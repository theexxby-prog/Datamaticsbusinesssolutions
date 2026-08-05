import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, ChevronDown, ChevronRight, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCampaignThread } from '../../context/CampaignThreadContext';
import { useNotifications } from '../../context/NotificationContext';
import type { CampaignActivity } from '../../data/campaignActivities';
import type { CampaignThreadEntry, RequestStatus } from '../../data/campaignThread';
import { CampaignActivityTimeline } from '../CampaignActivityTimeline';
import { EmptyState } from '../EmptyState';
import { ThreadEntryCard } from './ThreadEntryCard';
import { ThreadComposer } from './ThreadComposer';
import { authorFromUser, canResolveRequests, formatEntryTime } from './threadFormat';
import { toast } from 'sonner';
import { useUnionLens } from '../../hooks/useUnionLens';

// One feed, filtered — not three tabs. Splitting comments, files and requests
// into separate sections would break the one thing that makes a thread useful:
// reading them in the order they happened.
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'comment', label: 'Comments' },
  { key: 'attachment', label: 'Files' },
  { key: 'change_request', label: 'Requests' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

type FeedItem =
  | { type: 'entry'; at: string; entry: CampaignThreadEntry }
  | { type: 'system'; at: string; activities: CampaignActivity[] };

/**
 * Interleaves the human thread with system activity, collapsing consecutive
 * machine events into one expandable row. Delivery batches otherwise bury the
 * conversation within a week — the audit trail stays one click away.
 */
function buildFeed(entries: CampaignThreadEntry[], activities: CampaignActivity[]): FeedItem[] {
  const merged = [
    ...entries.map(entry => ({ type: 'entry' as const, at: entry.createdAt, entry })),
    ...activities.map(activity => ({ type: 'activity' as const, at: activity.timestamp, activity })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  const feed: FeedItem[] = [];
  for (const item of merged) {
    if (item.type === 'entry') {
      feed.push({ type: 'entry', at: item.at, entry: item.entry });
      continue;
    }
    const last = feed[feed.length - 1];
    if (last?.type === 'system') {
      last.activities.push(item.activity);
      last.at = item.at;
    } else {
      feed.push({ type: 'system', at: item.at, activities: [item.activity] });
    }
  }
  return feed;
}

function SystemGroup({ activities }: { activities: CampaignActivity[] }) {
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-primary-tint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        <Chevron className="h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]" />
        <Activity className="h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">
          {activities.length === 1
            ? activities[0].title
            : `${activities.length} campaign updates`}
        </span>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">
          {formatEntryTime(activities[activities.length - 1].timestamp)}
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--color-border-light)] px-4 py-3">
          <CampaignActivityTimeline activities={[...activities].reverse()} />
        </div>
      )}
    </div>
  );
}

interface CampaignThreadProps {
  campaignId: string;
  campaignName: string;
  /** System-generated events for this campaign — deliveries, milestones. */
  activities?: CampaignActivity[];
  /**
   * `rail` pins the thread to the viewport height and scrolls the feed inside
   * itself, with the composer fixed at the bottom. A conversation is the one
   * section on this page with unbounded height; left to grow inline it pushes
   * everything below it off the page and gets longer every week.
   */
  variant?: 'inline' | 'rail';
}

export function CampaignThread({ campaignId, campaignName, activities = [], variant = 'inline' }: CampaignThreadProps) {
  const isRail = variant === 'rail';
  const { currentUser } = useAuth();
  const { entriesFor, addComment, addChangeRequest, addAttachment, setRequestStatus } = useCampaignThread();
  const { addNotification } = useNotifications();
  const [filter, setFilter] = useState<FilterKey>('all');
  const feedRef = useRef<HTMLDivElement>(null);

  const author = useMemo(() => authorFromUser(currentUser), [currentUser]);
  const canResolve = canResolveRequests(currentUser);
  const lens = useUnionLens();
  const entries = lens(entriesFor(campaignId));

  const counts = useMemo(() => ({
    all: entries.length,
    comment: entries.filter(e => e.kind === 'comment').length,
    attachment: entries.filter(e => e.kind === 'attachment').length,
    change_request: entries.filter(e => e.kind === 'change_request').length,
  }), [entries]);

  // System events are context for the whole conversation, so they only belong
  // in the unfiltered view.
  const feed = useMemo(() => {
    if (filter === 'all') return buildFeed(entries, activities);
    return buildFeed(entries.filter(e => e.kind === filter), []);
  }, [entries, activities, filter]);

  function notifyCounterpart(event: string, description: string) {
    addNotification({
      campaignId,
      campaignName,
      event,
      description,
      link: `/campaigns/${campaignId}`,
    });
  }

  function handleComment(body: string) {
    addComment(campaignId, author, body);
    notifyCounterpart('New comment', `${author.name} commented on ${campaignName}.`);
    toast.success('Note posted to the campaign thread');
  }

  function handleChangeRequest(body: string) {
    addChangeRequest(campaignId, author, body);
    notifyCounterpart('Change requested', `${author.name} requested a change on ${campaignName}.`);
    toast.success('Change request sent — the campaign manager has been notified');
  }

  function handleAttachment(body: string, attachment: Parameters<typeof addAttachment>[3]) {
    addAttachment(campaignId, author, body, attachment);
    notifyCounterpart('Document uploaded', `${author.name} uploaded ${attachment.name} to ${campaignName}.`);
    toast.success(`${attachment.name} uploaded to the campaign`);
  }

  function handleStatus(entryId: string, status: RequestStatus) {
    setRequestStatus(entryId, status, currentUser.name);
    toast.success(status === 'done' ? 'Request marked done' : 'Request acknowledged');
  }

  // Open on the newest entry, and follow along as new ones are posted.
  useEffect(() => {
    if (!isRail || !feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [isRail, feed.length, filter]);

  return (
    <div
      className={`glass-card flex flex-col ${
        isRail ? 'max-h-[calc(100vh-16rem)] min-h-[26rem] p-5' : 'p-6'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Discussion</h2>
        <span className="text-sm text-[var(--color-text-muted)]">
          {isRail ? 'Notes, documents and requests' : 'Notes, documents and change requests for this campaign'}
        </span>
      </div>

      {/* Filters, not tabs — the conversation stays one list. */}
      <div className="mb-3 flex flex-shrink-0 flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
              filter === key
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary)]'
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs ${filter === key ? 'opacity-80' : 'opacity-60'}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      <div
        ref={feedRef}
        className={`mb-4 space-y-4 ${isRail ? 'min-h-0 flex-1 overflow-y-auto pr-1' : ''}`}
      >
        {feed.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={filter === 'all' ? 'No discussion yet' : `No ${FILTERS.find(f => f.key === filter)?.label.toLowerCase()} yet`}
            description={
              filter === 'all'
                ? 'Post a note, attach a document or raise a change request — your campaign manager sees it here and is notified straight away.'
                : 'Switch back to All to see the full conversation for this campaign.'
            }
          />
        ) : (
          feed.map(item =>
            item.type === 'entry' ? (
              <ThreadEntryCard
                key={item.entry.id}
                entry={item.entry}
                canResolve={canResolve}
                onSetStatus={handleStatus}
              />
            ) : (
              <SystemGroup key={`sys_${item.at}`} activities={item.activities} />
            ),
          )
        )}
      </div>

      <div className="flex-shrink-0">
        <ThreadComposer
          onComment={handleComment}
          onChangeRequest={handleChangeRequest}
          onAttachment={handleAttachment}
        />
      </div>
    </div>
  );
}
