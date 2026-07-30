import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLayout } from '../components/AppLayout';
import {
  MessageSquare, Send, CheckCircle2, AlertCircle, Lightbulb,
  TrendingUp, Zap, Shield, Users, DollarSign, ChevronDown,
  Rocket, GitBranch, Clock, FilePen, Upload, Receipt,
  ArrowRight, Bot, Brain, BarChart3, CreditCard, Target, Sparkles,
  Mic, MicOff, Square, FileDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import emailjs from '@emailjs/browser';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const EMAILJS_SERVICE_ID  = 'service_2cz8e3g';
const EMAILJS_TEMPLATE_ID = 'template_up5p94g';
const EMAILJS_PUBLIC_KEY  = '_oEucjCREDn4wOTcz';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general';
type FeedbackPriority = 'low' | 'medium' | 'high';

interface FeedbackFormData {
  type: FeedbackType;
  priority: FeedbackPriority;
  subject: string;
  message: string;
  email: string;
  name: string;
}

const coreAutomations = [
  {
    icon: TrendingUp,
    title: 'Salesforce — Auto-Create Opportunities',
    tagline: 'Zero manual CRM entry, ever.',
    description:
      'Every time a new campaign is created on the platform, a corresponding Opportunity is automatically created in Salesforce — no manual entry ever.',
    bullets: [
      'Campaign name, client, value, dates & targets all populate automatically',
      'Full two-way sync — updates on the platform reflect in Salesforce and vice versa',
      'The team sees every new campaign in Salesforce the moment it\'s approved',
    ],
    saves: '~30 min/campaign',
    eliminates: 'Manual CRM data entry',
    eta: 'Q3 2026',
    buildTime: '~1 day',
  },
  {
    icon: FilePen,
    title: 'DocuSign — Auto-Generate & Send Job Cards',
    tagline: 'Campaigns approved → job cards signed, automatically.',
    description:
      'The moment a campaign is approved, a Job Card PDF is automatically generated from the campaign data and sent via DocuSign to all required signatories.',
    bullets: [
      'Automatically emails every stakeholder with their DocuSign signing link',
      'Sends reminders to anyone who hasn\'t signed',
      'Real-time status: "Awaiting Client Signature" → "Fully Executed"',
      'Completed signed PDF stored and visible on the platform with full audit trail',
    ],
    saves: '~2 hrs/campaign',
    eliminates: 'Job card creation & signature chasing',
    eta: 'Q3 2026',
    buildTime: '~2–3 days',
  },
  {
    icon: Upload,
    title: 'Automated Lead Delivery',
    tagline: 'No spreadsheets. No manual uploads. Ever.',
    description:
      'When leads are ready for delivery, the platform automatically sends them straight into each client\'s delivery pipeline in real time.',
    bullets: [
      'Each lead is validated and deduped instantly upon receipt',
      'Accepted/rejected status feeds back into the platform automatically',
      'Delivery status visible on the dashboard — full visibility end to end',
      'Campaign delivery counters update live as leads are accepted',
      'Leads flow automatically into the client\'s CRM via 45+ native integrations',
    ],
    saves: '~1–3 hrs/delivery',
    eliminates: 'Spreadsheet prep & manual lead upload',
    eta: 'Q4 2026',
    buildTime: '~1–2 days',
  },
  {
    icon: Receipt,
    title: 'Tally — Invoice & Payment Sync',
    tagline: 'Every invoice auto-posted. Every payment auto-reconciled.',
    description:
      'Every invoice generated on the platform automatically syncs to TallyPrime — and when payment is received, Tally updates too. No manual accounting entry ever again.',
    bullets: [
      'Invoice generated → Sales voucher created automatically in Tally',
      'Invoice sent → Tally records the outstanding receivable',
      'Payment received → Tally updates with receipt entry & marks ledger settled',
      'Invoice cancelled → Tally credit note created automatically',
      'New client added → Tally ledger created automatically',
    ],
    saves: '~1–2 hrs/invoice',
    eliminates: 'Manual accounting entry & payment tracking',
    eta: 'Q4 2026',
    buildTime: '~2–3 days',
  },
];

const askPrafulCapabilities = [
  { icon: Target,    label: 'Campaign Intelligence',  text: 'Full breakdown of any campaign — status, delivery rate, lead quality, remaining targets, and what actions are pending.' },
  { icon: Users,     label: 'Lead Insights',           text: 'Ask about leads across any campaign: how many delivered, accepted, rejected, why they were rejected, and patterns in the data.' },
  { icon: BarChart3, label: 'Metrics & Performance',   text: 'Plain-English summaries of KPIs, conversion rates, cost-per-lead, and campaign ROI — no need to dig through dashboards.' },
  { icon: CreditCard,label: 'Outstanding Payments',    text: 'Instant visibility on which invoices are overdue, by how much, and for which clients — plus suggested next steps.' },
  { icon: Brain,     label: 'Automated Actions',       text: 'Praful won\'t just answer — it will act. Trigger lead uploads, flag anomalies, send reminders, and surface what needs your attention today.' },
];

export default function Feedback() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: 'general',
    priority: 'medium',
    subject: '',
    message: '',
    email: currentUser?.email || '',
    name: currentUser?.name || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [showPlatformVision, setShowPlatformVision] = useState(false);
  const [showComingFeatures, setShowComingFeatures] = useState(false);
  const [expandedAutomation, setExpandedAutomation] = useState<number | null>(null);

  // ── Voice dictation state ──
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const committedBaseRef = useRef(''); // snapshot of formData.message when recording starts

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setMicError(null);
    setInterimText('');

    // Snapshot the current message so we can append to it
    committedBaseRef.current = formData.message;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      if (finalChunk) {
        committedBaseRef.current = (committedBaseRef.current + finalChunk).trimStart();
        setFormData(prev => ({ ...prev, message: committedBaseRef.current }));
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setMicError('blocked');
      } else if (event.error !== 'aborted') {
        setMicError(`Speech error: ${event.error}`);
      }
      setIsRecording(false);
      setInterimText('');
    };

    recognition.onend = () => {
      // Flush any remaining interim as committed text
      if (interimText) {
        committedBaseRef.current = (committedBaseRef.current + interimText + ' ').trimStart();
        setFormData(prev => ({ ...prev, message: committedBaseRef.current }));
      }
      setInterimText('');
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [formData.message, interimText]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  // ── PDF download ──────────────────────────────────────────────────────────
  const handleDownloadPDF = useCallback(() => {
    // ── ALL text in this function is strict ASCII (no unicode) ────────────
    // jsPDF's built-in Helvetica covers only Latin-1 (ISO-8859-1).
    // Characters outside that range (arrows, special bullets, triangles, etc.)
    // cause the renderer to switch to a wide-spacing glyph mode mid-string,
    // producing the "s p a c e d  o u t" kerning visible in the old PDF.
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const ML = 52, MR = 52, MT = 52, MB = 52;
    const CW = pageW - ML - MR;
    let y = MT;

    // Colour palette
    const RED:   [number,number,number] = [186, 32,  39];
    const RED2:  [number,number,number] = [139, 18,  25];
    const DARK:  [number,number,number] = [22,  22,  22];
    const BODY:  [number,number,number] = [60,  65,  72];
    const MID:   [number,number,number] = [100, 110, 120];
    const LIGHT: [number,number,number] = [170, 176, 183];
    const PALE:  [number,number,number] = [240, 240, 242];
    const WHITE: [number,number,number] = [255, 255, 255];

    const newPage = (needed = 20) => {
      if (y + needed > pageH - MB) { doc.addPage(); y = MT; }
    };
    const sf = (w: 'normal'|'bold', sz: number, c: [number,number,number]) => {
      doc.setFont('helvetica', w); doc.setFontSize(sz); doc.setTextColor(...c);
    };

    // ── COVER PAGE ──────────────────────────────────────────────────────────
    doc.setFillColor(...RED);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Darker bottom band
    doc.setFillColor(...RED2);
    doc.rect(0, pageH * 0.66, pageW, pageH * 0.34, 'F');

    // White accent bar (top left)
    doc.setFillColor(...WHITE);
    doc.rect(ML, 54, 40, 4, 'F');

    // Company label
    sf('bold', 9, [255, 200, 200]);
    doc.text('DATAMATICS BUSINESS SOLUTIONS', ML, 78);

    // Main title
    sf('bold', 36, WHITE);
    doc.text('Client Portal', ML, 132);
    sf('bold', 36, [255, 160, 160]);
    doc.text('Feature Reference', ML, 172);

    // Subtitle
    sf('normal', 11, [255, 220, 220]);
    doc.text('Complete guide to every page, action, filter,', ML, 210);
    doc.text('export, modal, and role-based permission.', ML, 226);

    // Stats row in the darker band
    const stats = [
      { n: '21', label: 'Pages' },
      { n: '4',  label: 'User Roles' },
      { n: '25', label: 'Sections' },
      { n: '200+', label: 'Features' },
    ];
    const statW = CW / stats.length;
    const statY = pageH * 0.66 + 52;
    stats.forEach((s, i) => {
      const sx = ML + i * statW + statW / 2;
      sf('bold', 24, WHITE);
      doc.text(s.n, sx, statY, { align: 'center' });
      sf('normal', 9, [255, 200, 200]);
      doc.text(s.label, sx, statY + 18, { align: 'center' });
    });

    // Footer line on cover
    sf('normal', 8, [255, 190, 190]);
    doc.text('Version: March 2026  |  Datamatics Business Solutions Internal Use', ML, pageH - 32);
    doc.text('Confidential', pageW - MR, pageH - 32, { align: 'right' });

    // ── CONTENT PAGES ────────────────────────────────────────────────────────
    doc.addPage();
    y = MT;

    // ALL strings below are strict ASCII -- no unicode arrows, dots, triangles
    const sections: Array<{
      num: string;
      title: string;
      items: Array<{ heading?: string; bullets: string[] }>;
    }> = [
      {
        num: '01', title: 'Authentication & User Roles',
        items: [
          { heading: 'Login', bullets: [
            'Select from 4 mock user accounts to log in instantly.',
            'Role switches immediately and redirects to the correct home screen.',
          ]},
          { heading: 'User Roles', bullets: [
            'client - Campaigns, Leads, Reports, Invoices, Payments, Documents, Support, Account, Feedback.',
            'campaign_manager - All client views + Internal pages, Approvals, Lead Upload, Team, Client Assignment.',
            'campaign_backup - Same as campaign_manager (read + upload access).',
            'ops_manager - Full access: Ops Overview, Team Management, Internal Reports, Client Assignment.',
          ]},
          { heading: 'Permission Helpers', bullets: [
            'canUploadLeads() - true for ops_manager and campaign_manager.',
            'canAccessOps() - true for ops_manager only.',
            'canManageTeam() - true for ops_manager only.',
            'canEditCampaigns() - true for ops_manager and campaign_manager.',
          ]},
        ],
      },
      {
        num: '02', title: 'Global Navigation & Shell',
        items: [
          { heading: 'Left Sidebar', bullets: [
            'Persistent on every page across all roles.',
            'Collapses to icon-only on medium screens; hidden on mobile.',
            'Role-based menu items - ops-only links hidden from clients.',
            'Shows current user name, role badge, and avatar. Switch Role button for demo.',
          ]},
          { heading: 'Mobile Bottom Tab Bar', bullets: [
            'Fixed bottom navigation on small screens.',
            '4-5 most relevant shortcuts for the active role; active tab highlighted.',
          ]},
          { heading: 'Top Header Bar', bullets: [
            'Bell icon - opens Notifications panel.',
            'User avatar / name - navigates to Account Settings.',
            'Dynamic page titles via useDocumentTitle on every route.',
            '2 px brand-coloured Route Loader bar during route transitions.',
          ]},
          { heading: 'Splash Loader', bullets: [
            'Full-screen branded loading screen on first application load.',
            'Animated logo, progress bar, and tagline.',
          ]},
        ],
      },
      {
        num: '03', title: 'Notifications',
        items: [
          { bullets: [
            'Unread count badge displayed on the bell icon.',
            'Clicking the bell opens the Notification Panel as a floating dropdown.',
            'Mark all as read - clears all unread indicators at once.',
            'Each notification is clickable and navigates directly to the relevant page.',
            'Event types: Campaign live, 25% / 50% / 75% / 100% delivery milestones, Invoice generated.',
          ]},
        ],
      },
      {
        num: '04', title: 'My Campaigns - Client Dashboard (/campaigns)',
        items: [
          { heading: 'KPI Cards', bullets: [
            'Active Campaigns - time selector: Day / Week / Month / Year (each card is independent).',
            'Total Leads Delivered - own independent time selector.',
            'Total Spend - own time selector; values formatted as $XX,XXX.',
            'Awaiting Approval card - conditionally shown; lists pending campaigns with pulsing dot.',
          ]},
          { heading: 'Campaign Table', bullets: [
            'Columns: Campaign, Type, Status, Progress (animated bar + percentage), Actions.',
            'Debounced real-time search by campaign name.',
            'Status filter: All / Pending Approval / In Progress / Completed / Paused.',
            'Click row or Eye button to navigate to Campaign Detail.',
            '"Start a Campaign" button opens the New Campaign Modal.',
            'Empty state shown with "No campaigns found" and a Create Campaign action button.',
          ]},
          { heading: 'Account Team Section', bullets: [
            'Shows Campaign Manager and Campaign Backup: photo, name, role, email.',
            'Clicking an email address opens the default mail client.',
          ]},
        ],
      },
      {
        num: '05', title: 'Campaign List - Client (/campaigns)',
        items: [
          { heading: 'Submission Tracker Banner', bullets: [
            'Shown when Pending Approval or Changes Requested submissions exist.',
            '3-step timeline stepper per submission: Submitted > Under Review > Goes Live.',
            'Changes Requested: amber callout box showing manager feedback notes inline.',
          ]},
          { heading: 'Filters', bullets: [
            'Search by campaign name (real-time).',
            'Status: All / Pending Approval / Changes Requested / Not Started / In Progress / Paused / Completed.',
            'Date range: All time / This month / Last 3 months / This year.',
          ]},
          { heading: 'Campaign Table', bullets: [
            'Animated progress bar and live pulsing dot for active campaigns.',
            'Three-dot menu per row: View Details, Clone Campaign.',
            'Clone: confirmation modal then New Campaign Modal pre-filled with name and type.',
          ]},
          { heading: 'New Campaign Modal (3 steps)', bullets: [
            'Step 1: Campaign name, service type, target geography, locations (multi-select).',
            'Step 2: Job titles (multi-select), employee size range, revenue size range.',
            'Step 3: CPL (cost per lead), additional notes.',
            'Submission instantly adds campaign to list and Submission Tracker; success toast + banner.',
          ]},
        ],
      },
      {
        num: '06', title: 'Campaign Detail - Client (/campaigns/:id)',
        items: [
          { bullets: [
            'KPI cards: Target Leads, Delivered, Acceptance Rate, Budget - all animated counters.',
            'Animated Donut Chart - delivered vs remaining with live animated counter in centre.',
            'Delivery Schedule Section - historical and upcoming delivery batch timeline.',
            'Campaign Details panel: geography, locations, industry, revenue, employee size, job titles, pricing.',
            'Activity Feed - chronological list of updates, uploads, and status changes.',
            'Download Job Card button - opens Job Card Modal (full document) with Download PDF inside.',
            'Clone Campaign button - confirmation modal then New Campaign Modal pre-filled.',
          ]},
        ],
      },
      {
        num: '07', title: 'Leads (/leads)',
        items: [
          { heading: 'Filters', bullets: [
            'Search by first name, last name, company, or email (real-time).',
            'Status dropdown: All / Accepted / Pending / Rejected / Under Review.',
            'Campaign dropdown filter.',
            'Advanced Filters panel: Score range (0-100), Date range, Industry multi-select, Tags multi-select.',
            'Apply Filters button and Reset button to clear all advanced filters.',
          ]},
          { heading: 'Table & Grid Views', bullets: [
            'Table view / Grid view toggle buttons.',
            'Sortable columns: Lead Score, Delivery Date, Company, Status (click header toggles asc/desc).',
            'Select all checkbox and individual row checkboxes for multi-select.',
            'Lead Score Ring - animated circular ring, colour-coded from 0 to 100.',
            'Star / Favourite toggle per lead (amber star when active).',
            'Three-dot menu: View Details, Tag lead, Export lead.',
          ]},
          { heading: 'Lead Detail Drawer', bullets: [
            'Slides in from the right without leaving the page.',
            'Full profile: name, company, job title, email, phone, industry.',
            'Lead score breakdown, status badge, delivery date, campaign, and tags.',
          ]},
          { heading: 'Other', bullets: [
            'Pagination: 10 per page (table), 12 per page (grid); Previous / Next buttons.',
            'Download button - exports selected or all leads.',
            'Dismissible alert banner for flagged or rejected leads.',
          ]},
        ],
      },
      {
        num: '08', title: 'Reports - Client (/reports)',
        items: [
          { bullets: [
            'KPI cards: Total Leads, Acceptance Rate, Conversions, Revenue, Active Campaigns (animated).',
            'Campaign selector dropdown - filters all charts and KPIs simultaneously.',
            'Date Range Picker - presets (7 / 30 / 90 days, this year) and custom range.',
            'Revenue & Leads Over Time - area chart with dual Y-axis, animated on load.',
            'Lead Status Distribution - pie chart with coloured segments and legend.',
            'Campaign Performance Comparison - bar chart across campaigns.',
            'Lead Title Distribution - horizontal bar (C-Level, VP/Director, Manager, etc.).',
            'Bookmark icon per chart - toggles saved state (fills amber when bookmarked).',
            'Export Modal: PDF Report / Excel Workbook / CSV Data; Include Charts toggle; Include Data toggle.',
            'Share button - toast notification confirming report link is copied.',
          ]},
        ],
      },
      {
        num: '09', title: 'Invoices (/invoices)',
        items: [
          { bullets: [
            'KPI cards: Total Revenue, Paid, Pending, Overdue - all $-formatted with commas, animated.',
            'Search by invoice number or campaign name (debounced).',
            'Status filter: All / Paid / Pending / Overdue.',
            'Select all checkbox and per-row checkboxes for multi-select.',
            'Preview (Eye icon) - opens Invoice Preview Modal: full branded invoice + Download PDF.',
            'Download icon per row - triggers a download toast notification.',
            '"Pay Now" button on overdue or pending invoices - links to /payment/:invoiceId.',
          ]},
        ],
      },
      {
        num: '10', title: 'Payment Methods (/payment)',
        items: [
          { bullets: [
            'List of saved cards and bank accounts with last 4 digits, brand/bank, and expiry.',
            'Default badge shown on the currently selected default method.',
            'Set as Default button - updates default method with toast confirmation.',
            'Delete (Trash) button - removes payment method with toast confirmation.',
            '"+ Add Payment Method" modal: card number, name, expiry, CVV or bank/routing number.',
          ]},
        ],
      },
      {
        num: '11', title: 'Documents (/documents)',
        items: [
          { heading: 'Filters', bullets: [
            'Search by document name, uploader, or campaign - with inline clear button.',
            'Type: All / Contract / SOW / NDA / Invoice / Report / Other.',
            'Status: All / Active / Expired / Pending / Archived.',
            'Starred filter button - shows only starred documents; amber badge shows live count.',
          ]},
          { heading: 'View & Actions', bullets: [
            'Table view / Grid view toggle buttons.',
            'Star toggle - grey when unstarred, fills amber when starred.',
            'Preview (Eye icon) - opens Document Viewer Modal for full-screen preview.',
            'Download icon - triggers a download toast notification.',
            'Three-dot menu per document: Download, Delete (with toast confirmation).',
            'Results count displayed live: "X documents found".',
            'Upload Document button - drag-and-drop Upload Zone Modal (CSV, PDF, DOCX, XLSX).',
          ]},
        ],
      },
      {
        num: '12', title: 'Support & Tickets (/support)',
        items: [
          { bullets: [
            'KPI cards: Open Tickets, In Progress, Resolved, Response Time - all animated.',
            'List view / Grid view toggle.',
            'Filters: Search, Status (5 states), Priority (4 levels), Category (5 types).',
            'Ticket Detail panel: full description, message thread, assigned agent, linked campaign.',
            'Reply / Send Message input with Attachment (paperclip) button.',
            '"+ New Ticket" modal: Title, Description, Category, Priority, linked Campaign (optional).',
            'Star / priority flag toggle per ticket.',
          ]},
        ],
      },
      {
        num: '13', title: 'Account Settings (/account)',
        items: [
          { heading: '5 Tabs', bullets: [
            'My Profile - edit name, email, phone, job title; view active sessions list.',
            'Company Info - edit company name, address, city/state, country, website, contact.',
            'Team Members - invite member (email + role), edit role, remove member.',
            'Security - change password (show/hide toggle), 2FA toggle, revoke individual sessions.',
            'Notifications - Email and In-app toggles per event type; Save Preferences button.',
          ]},
        ],
      },
      {
        num: '14', title: 'Feedback (/feedback)',
        items: [
          { bullets: [
            'Download Feature List (PDF) button - right of the "Share Feedback" heading.',
            'Feedback form: Type (Bug / Feature / Improvement / General), Priority (Low / Medium / High).',
            'Name and Email pre-filled from logged-in user; Subject and Message fields.',
            'Voice Dictation (Mic icon) - Web Speech API; live interim transcript; pulsing stop button.',
            'Submit via EmailJS - loading spinner, success/error states, auto-reset after 3 seconds.',
            '"Why This Platform Matters" - collapsible: 3 problems, 4 strategic pillars, strategic play.',
            '"Coming Features" - collapsible: Salesforce, DocuSign, automated lead delivery, Tally, Ask Praful AI.',
            'Each automation card is individually expandable: capabilities, build time, what it eliminates.',
          ]},
        ],
      },
      {
        num: '15', title: 'Internal Dashboard - Ops (/internal/dashboard)',
        items: [
          { bullets: [
            'KPI cards: Total Campaigns, Active, Completed, Total Clients, Total Leads, Processing Uploads.',
            'Upload Leads quick-action button - opens Lead Upload Modal directly from the dashboard.',
            'Recent Campaigns table (5 most recently active) - click row to go to Internal Campaign Detail.',
            'Top 4 Clients by Leads leaderboard with mini progress bars.',
            'Recent Upload Batches list with status badges (Processing / Completed / Failed).',
          ]},
        ],
      },
      {
        num: '16', title: 'Ops Overview (/dashboard/ops)',
        items: [
          { bullets: [
            'KPI cards: Total Clients, Campaigns, Active, Leads, Processing Uploads, Failed Uploads.',
            'All Clients table - searchable and with sortable columns.',
            'Per-client: View (Eye) navigates to campaign list; Upload Leads opens Lead Upload Modal pre-selected.',
            'Upload Status section with progress bars for batches currently processing.',
          ]},
        ],
      },
      {
        num: '17', title: 'Internal Campaign List (/internal/campaigns)',
        items: [
          { bullets: [
            'Real-time search by campaign name.',
            'Status filter: All / Active / Completed / Paused / Pending Approval.',
            'Sortable columns: Campaign, Client, Status, Leads Delivered, Target, Acceptance Rate.',
            'Clicking a column header toggles asc/desc order with a chevron indicator.',
            'View (Eye icon) navigates to Internal Campaign Detail.',
          ]},
        ],
      },
      {
        num: '18', title: 'Internal Campaign Detail (/internal/campaigns/:id)',
        items: [
          { bullets: [
            'KPI cards: Target Leads, Delivered, Acceptance Rate, Budget - all animated.',
            'Animated Donut Chart - delivered vs remaining with live centre counter.',
            'Delivery Schedule Section - batch timeline with historical and upcoming dates.',
            'Campaign info panel: geography, locations, job titles, employee size, industry.',
            'Upload Leads button - opens Lead Upload Modal pre-selected to this campaign.',
          ]},
        ],
      },
      {
        num: '19', title: 'Internal Reports (/internal/reports)',
        items: [
          { bullets: [
            'KPI cards: Total Leads, Revenue, Active Campaigns, Avg Acceptance Rate, Total Clients (with trend indicators).',
            'Monthly Performance area chart - Leads and Revenue over 6 months.',
            'Campaign Performance bar chart.',
            'Industry Breakdown pie chart: Technology, Healthcare, Financial, Manufacturing, Other.',
            'Operator Performance bar chart and table with avatar, leads, acceptance rate, and clients.',
            'Bookmark icon per chart - saves/unsaves (amber fill when bookmarked).',
            'Export Modal: PDF / Excel / CSV with chart and data toggles.',
          ]},
        ],
      },
      {
        num: '20', title: 'Manager Dashboard (/dashboard/manager)',
        items: [
          { bullets: [
            'Client switcher dropdown - switches between clients assigned to the logged-in manager.',
            'KPI cards per client: Total Campaigns, Active, Total Leads, Acceptance Rate.',
            'Sortable campaign table: Name, Status, Total Leads, Acceptance Rate.',
            'Upload button per campaign row - opens Lead Upload Modal pre-selected.',
            'Recent Activity timeline of uploads and status changes for the selected client.',
          ]},
        ],
      },
      {
        num: '21', title: 'Lead Upload Dashboard (/internal/leads)',
        items: [
          { heading: 'Dashboard', bullets: [
            'KPI cards: Processing, Completed, Failed, Pending, Leads Uploaded Today.',
            'Dismissible pending uploads alert banner.',
            'Filter tabs: All / Processing / Completed / Failed / Pending.',
            'Search by file name, client name, or campaign name.',
          ]},
          { heading: 'Upload Batches Table', bullets: [
            'Columns: File Name, Client, Campaign, Uploaded By, Date/Time, Status, Rows, Success, Errors, Actions.',
            'Inline progress bar for batches currently processing.',
            'Retry (Refresh icon) button for failed uploads with toast confirmation.',
            'Download error report available for failed or partial batches.',
          ]},
          { heading: 'Lead Upload Modal (4 steps)', bullets: [
            'Step 0 - Select Client dropdown and Campaign dropdown (when not pre-selected).',
            'Step 1 - Drag-and-drop zone or click-to-browse; accepts CSV, XLS, XLSX.',
            'Step 2 - Column mapping: assign each column to First Name / Last Name / Email / Phone / Company / Job Title / Source / Ignore; with live row preview.',
            'Step 3 - Animated success state with upload count; "Upload Another" resets; "Done" closes.',
          ]},
        ],
      },
      {
        num: '22', title: 'Team Management (/dashboard/ops/team)',
        items: [
          { bullets: [
            'KPI cards: Total Members, Active, Away/On Leave, Inactive - all animated.',
            'Table view / Grid view toggle.',
            'Sortable by: Name, Role, Status, Clients Assigned, Leads Uploaded, Acceptance Rate.',
            'Three-dot menu per member: Edit, View Client Coverage, View Activity Log, Deactivate, Send Email.',
            'Edit Member Modal: name, email, role, status - Save / Cancel.',
            'Client Coverage Modal: all clients assigned to member with campaign counts.',
            'Activity Log Modal: timestamped history of all recent actions.',
            'Deactivate Modal: warning message with Confirm / Cancel.',
            '"Add Team Member" button: Name, Email, Role, Assign Clients, Send Invite (with toast).',
            '"Bulk Reassign" button: select source member, select target member, Confirm.',
          ]},
        ],
      },
      {
        num: '23', title: 'Client Assignment (/internal/client-assignment)',
        items: [
          { bullets: [
            'KPI cards: Total Clients, Fully Assigned, Unassigned, Total Managers - all animated.',
            'Search by client name; Status filter: All / Assigned / Unassigned.',
            'Table columns: Client, Industry, Current Manager, Current Backup, Campaigns, Actions.',
            'View (Eye icon) - navigates to Internal Campaign List filtered for that client.',
            'Assign / Transfer / Revoke modal: manager dropdown, backup dropdown, confirm, send-notification checkbox.',
          ]},
        ],
      },
      {
        num: '24', title: 'Campaign Approvals (/internal/approvals)',
        items: [
          { bullets: [
            'Pending submission queue ordered by date; header shows Pending vs Changes Requested count.',
            'Per submission (expandable): client, company, date, service type, geography, job titles, CPL.',
            'Approve button - marks as approved, removes from queue with toast.',
            'Request Changes button - opens modal with free-text notes; sends feedback to client Submission Tracker.',
            'Decline button - marks as declined, removes from queue with toast.',
            'Empty state: inbox icon with "No pending approvals" message.',
          ]},
        ],
      },
      {
        num: '25', title: 'Coming Integrations (Roadmap)',
        items: [
          { bullets: [
            'Salesforce - Auto-create Opportunities on campaign creation with two-way sync. ETA: Q3 2026.',
            'DocuSign - Auto-generate and email Job Cards for signature on campaign approval. ETA: Q3 2026.',
            'Automated lead delivery - deliver leads into client campaigns in real time. ETA: Q4 2026.',
            'Tally (TallyPrime) - Auto-post invoices, receipts, credit notes, and new client ledgers. ETA: Q4 2026.',
            'Ask Praful AI - Campaign intelligence, lead insights, KPI summaries, overdue payment visibility, and automated actions. ETA: TBD.',
          ]},
        ],
      },
    ];

    // ── Render sections ─────────────────────────────────────────────────────
    sections.forEach((section, sIdx) => {
      newPage(48);

      // Section header bar
      const barH = 26;
      doc.setFillColor(...RED);
      doc.roundedRect(ML, y, CW, barH, 4, 4, 'F');

      // Number pill inside header
      doc.setFillColor(...RED2);
      doc.roundedRect(ML + 6, y + 4, 28, 18, 3, 3, 'F');
      sf('bold', 8, [255, 200, 200]);
      doc.text(section.num, ML + 6 + 14, y + 15.5, { align: 'center' });

      // Section title
      sf('bold', 11, WHITE);
      doc.text(section.title, ML + 42, y + 17);
      y += barH + 10;

      // Items
      section.items.forEach((item, iIdx) => {
        if (item.heading) {
          newPage(22);
          // Sub-heading with left accent stripe
          doc.setFillColor(...RED);
          doc.rect(ML, y, 3, 13, 'F');
          sf('bold', 9.5, DARK);
          doc.text(item.heading, ML + 10, y + 10);
          y += 18;
        }

        item.bullets.forEach((bullet) => {
          const lines: string[] = doc.splitTextToSize(bullet, CW - 22);
          const blockH = lines.length * 13 + 2;
          newPage(blockH);
          lines.forEach((ln: string, li: number) => {
            sf('normal', 9, li === 0 ? BODY : MID);
            if (li === 0) {
              // Small filled circle bullet drawn manually (no unicode)
              doc.setFillColor(...RED);
              doc.circle(ML + 7, y - 3.5, 1.8, 'F');
              doc.text(ln, ML + 15, y);
            } else {
              doc.text(ln, ML + 15, y);
            }
            y += 13;
          });
          y += 2;
        });

        if (iIdx < section.items.length - 1) y += 4;
      });

      y += 14;

      // Subtle divider between sections (not after last)
      if (sIdx < sections.length - 1) {
        newPage(6);
        doc.setDrawColor(...PALE);
        doc.setLineWidth(0.4);
        doc.line(ML, y - 8, pageW - MR, y - 8);
      }
    });

    // ── Footer on every content page ────────────────────────────────────────
    const total = (doc as any).internal.getNumberOfPages();
    for (let p = 2; p <= total; p++) {
      doc.setPage(p);
      // Rule
      doc.setDrawColor(...PALE);
      doc.setLineWidth(0.4);
      doc.line(ML, pageH - MB + 4, pageW - MR, pageH - MB + 4);
      // Red dot
      doc.setFillColor(...RED);
      doc.circle(ML, pageH - MB + 15, 2.5, 'F');
      // Text
      sf('normal', 7.5, LIGHT);
      doc.text(
        'Datamatics Business Solutions Client Portal  -  Feature Reference  -  March 2026',
        ML + 9, pageH - MB + 18
      );
      sf('normal', 7.5, MID);
      doc.text(`Page ${p - 1} of ${total - 1}`, pageW - MR, pageH - MB + 18, { align: 'right' });
    }

    doc.save('Datamatics-Business-Solutions-Feature-Reference.pdf');
    toast.success('Feature reference PDF downloaded!');
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const templateParams = {
        email:         'support@datamaticsbpm.com',
        from_name:     formData.name,
        from_email:    formData.email,
        user_role:     currentUser?.role || 'Unknown',
        user_id:       currentUser?.id  || 'Unknown',
        submitted_at:  new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        feedback_type: formData.type.toUpperCase(),
        priority:      formData.priority.toUpperCase(),
        subject:       formData.subject,
        message:       formData.message,
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      setSubmitStatus('success');

      setTimeout(() => {
        setFormData({
          type: 'general', priority: 'medium', subject: '', message: '',
          email: currentUser?.email || '', name: currentUser?.name || '',
        });
        setSubmitStatus(null);
      }, 3000);
    } catch (error: any) {
      console.error('EmailJS error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes: { value: FeedbackType; label: string }[] = [
    { value: 'bug',         label: 'Bug Report'  },
    { value: 'feature',     label: 'Feature Request' },
    { value: 'improvement', label: 'Improvement' },
    { value: 'general',     label: 'General'     },
  ];

  const priorityLevels: { value: FeedbackPriority; label: string }[] = [
    { value: 'low',    label: 'Low'    },
    { value: 'medium', label: 'Medium' },
    { value: 'high',   label: 'High'   },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto page-content">

        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Left: icon + title — icon aligned to match card icons (pl-5 offset) */}
          <div className="flex items-center gap-4 pl-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-primary)' }}
            >
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 style={{ color: 'var(--color-text-primary)' }}>Share Feedback</h1>
              <p className="t2 mt-0.5">Help us improve the Datamatics Business Solutions Client Portal</p>
            </div>
          </div>

          {/* Right: Download PDF button */}
          <button
            onClick={handleDownloadPDF}
            title="Download full feature reference as PDF"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all flex-shrink-0"
            style={{
              borderColor: 'var(--color-border)',
              background: 'white',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
            }}
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Feature List
            </span>
          </button>
        </div>

        {/* ── Why This Platform Matters ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-3"
        >
          <button
            onClick={() => setShowPlatformVision(!showPlatformVision)}
            className="glass-card w-full p-5 text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary)' }}
                >
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="t1">Why This Platform Matters</h3>
                  <p className="t3 mt-0.5">Vision, problems we're solving & the strategic play</p>
                </div>
              </div>
              <motion.div animate={{ rotate: showPlatformVision ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
              </motion.div>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {showPlatformVision && (
              <motion.div
                key="vision"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="glass-card mt-2 p-6 space-y-5">
                  {/* Core Problem */}
                  <div>
                    <h4 className="t1 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      The Core Problem We're Solving
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Internally',  text: 'Mistakes happen, things fall through the cracks, and too much time is spent on admin.' },
                        { label: 'For Clients', text: 'They have no visibility into their campaigns and have to chase us for updates.' },
                        { label: 'Financially', text: 'Invoice follow-up is manual, slow, and awkward — we get paid later than we should.' },
                      ].map(item => (
                        <div key={item.label} className="flex items-start gap-2 pl-2">
                          <span style={{ color: 'var(--color-primary)', marginTop: '2px' }}>•</span>
                          <p className="t2"><strong style={{ color: 'var(--color-text-primary)' }}>{item.label}:</strong> {item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4 pillars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: Zap,       title: 'Operational Efficiency', text: 'Single source of truth for every campaign, lead, invoice, and client. Less admin, fewer mistakes, faster turnaround.' },
                      { icon: Shield,    title: 'Professional Brand',     text: 'A clean, modern platform signals we\'re organized and technology-forward. Clients see us as a premium partner.' },
                      { icon: Users,     title: 'Client Visibility',      text: 'Clients see campaign progress, lead delivery, acceptance rates, and invoices in real time — no more chasing us.' },
                      { icon: DollarSign,title: 'Faster Payments',        text: 'Invoices auto-generated and visible immediately. Clients can view, download, and action directly.' },
                    ].map(card => {
                      const CardIcon = card.icon;
                      return (
                        <div
                          key={card.title}
                          className="p-4 rounded-xl"
                          style={{ background: 'var(--color-border-light)', border: '1px solid var(--color-border)' }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: 'var(--color-primary)' }}
                            >
                              <CardIcon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <h5 className="t1">{card.title}</h5>
                          </div>
                          <p className="t2">{card.text}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Strategic Play */}
                  <div
                    className="p-4 rounded-xl"
                    style={{ background: 'var(--color-border-light)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-primary)' }}
                  >
                    <h5 className="t1 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      The Strategic Play
                    </h5>
                    <p className="t2 leading-relaxed">
                      Once clients use our platform and we integrate with their tools (Salesforce, DocuSign, lead delivery, Tally), switching away doesn't just mean finding a new partner — it means replacing an entire workflow.{' '}
                      <strong style={{ color: 'var(--color-text-primary)' }}>We become infrastructure, not just a supplier.</strong> That's the definition of a sticky relationship.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Coming Features / Core Automations ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowComingFeatures(!showComingFeatures)}
            className="glass-card w-full p-5 text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary)' }}
                >
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="t1">Coming Features</h3>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'var(--color-border-light)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      5 features
                    </span>
                  </div>
                  <p className="t3 mt-0.5">Salesforce · DocuSign · Lead Delivery · Tally · Ask Praful AI</p>
                </div>
              </div>
              <motion.div animate={{ rotate: showComingFeatures ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
              </motion.div>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {showComingFeatures && (
              <motion.div
                key="features"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="glass-card mt-2 overflow-hidden">
                  {/* Summary bar */}
                  <div
                    className="px-5 py-4 flex items-center gap-3"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <GitBranch className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="t2">
                      Four automations that will make the platform the <strong style={{ color: 'var(--color-text-primary)' }}>central nervous system</strong> of the entire operation — campaigns, signatures, lead delivery, and accounting, all connected.
                    </p>
                  </div>

                  {/* Time savings strip */}
                  <div
                    className="grid grid-cols-2 sm:grid-cols-4"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    {coreAutomations.map((a, i) => (
                      <div
                        key={a.title}
                        className="px-4 py-3 text-center"
                        style={{ borderRight: i < 3 ? '1px solid var(--color-border)' : undefined }}
                      >
                        <p className="t1" style={{ color: 'var(--color-primary)' }}>{a.saves}</p>
                        <p className="t3 mt-0.5">saved</p>
                      </div>
                    ))}
                  </div>

                  {/* Automation cards */}
                  <div className="p-4 space-y-2">
                    {coreAutomations.map((automation, idx) => {
                      const isOpen = expandedAutomation === idx;
                      const Icon = automation.icon;
                      return (
                        <div
                          key={automation.title}
                          className="rounded-xl overflow-hidden"
                          style={{ border: '1px solid var(--color-border)', background: 'var(--color-border-light)' }}
                        >
                          <button
                            className="w-full p-4 text-left flex items-start gap-3"
                            onClick={() => setExpandedAutomation(isOpen ? null : idx)}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: 'var(--color-primary)' }}
                            >
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="t1">{automation.title}</p>
                                  <p className="t3 mt-0.5 italic">{automation.tagline}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span
                                    className="px-2 py-0.5 rounded-full"
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      background: 'rgba(186,32,39,0.08)',
                                      color: 'var(--color-primary)',
                                      border: '1px solid rgba(186,32,39,0.15)',
                                    }}
                                  >
                                    {automation.eta}
                                  </span>
                                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                                  </motion.div>
                                </div>
                              </div>
                              <p className="t2 mt-1.5 leading-relaxed">{automation.description}</p>
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                key={`detail-${idx}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div
                                  className="px-4 pb-4 space-y-3"
                                  style={{ borderTop: '1px solid var(--color-border)' }}
                                >
                                  <div className="pt-3">
                                    <p className="t3 uppercase tracking-wide mb-2">What it does</p>
                                    <ul className="space-y-1.5">
                                      {automation.bullets.map((bullet, bi) => (
                                        <li key={bi} className="flex items-start gap-2">
                                          <span
                                            className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                            style={{ background: 'var(--color-primary)' }}
                                          />
                                          <span className="t2">{bullet}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="flex items-center gap-5 pt-1">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                                      <span className="t2"><strong style={{ color: 'var(--color-text-primary)' }}>Build time:</strong> {automation.buildTime}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                                      <span className="t2"><strong style={{ color: 'var(--color-text-primary)' }}>Eliminates:</strong> {automation.eliminates}</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {/* Ask Praful AI */}
                    {(() => {
                      const prafulIdx = coreAutomations.length;
                      const isOpen = expandedAutomation === prafulIdx;
                      return (
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-border-light)',
                          }}
                        >
                          <button
                            className="w-full p-4 text-left flex items-start gap-3"
                            onClick={() => setExpandedAutomation(isOpen ? null : prafulIdx)}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: 'var(--color-primary)' }}
                            >
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="t1">Ask Praful — Resident AI</p>
                                  <p className="t3 mt-0.5 italic">Ask anything. Get instant answers — and automated actions.</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span
                                    className="px-2 py-0.5 rounded-full"
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      background: 'var(--color-border-light)',
                                      color: 'var(--color-text-secondary)',
                                      border: '1px solid var(--color-border)',
                                    }}
                                  >
                                    Coming Soon
                                  </span>
                                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                                  </motion.div>
                                </div>
                              </div>
                              <p className="t2 mt-1.5 leading-relaxed">
                                Your resident AI that lives inside this platform. Ask anything in plain English — campaigns, leads, payments, performance — and get the answer instantly.
                              </p>
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                key="praful-detail"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div
                                  className="px-4 pb-4 space-y-3"
                                  style={{ borderTop: '1px solid var(--color-border)' }}
                                >
                                  <div className="pt-3">
                                    <p className="t3 uppercase tracking-wide mb-2">Example Questions</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      {[
                                        '"What\'s the delivery status on the Barclays campaign?"',
                                        '"Which invoices are more than 30 days overdue?"',
                                        '"Show me all leads rejected last week and why."',
                                        '"Which campaigns are behind on their targets?"',
                                        '"Summarise performance for all active campaigns."',
                                        '"Which clients haven\'t paid this month?"',
                                      ].map((q, i) => (
                                        <div
                                          key={i}
                                          className="px-3 py-2 rounded-lg"
                                          style={{
                                            background: 'var(--color-surface-raised)',
                                            border: '1px solid var(--color-border)',
                                          }}
                                        >
                                          <span className="t2 italic">{q}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <p className="t3 uppercase tracking-wide">What Praful Can Do</p>
                                    {askPrafulCapabilities.map((cap) => {
                                      const CapIcon = cap.icon;
                                      return (
                                        <div
                                          key={cap.label}
                                          className="flex items-start gap-2.5 p-3 rounded-lg"
                                          style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
                                        >
                                          <div
                                            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'rgba(186,32,39,0.08)' }}
                                          >
                                            <CapIcon className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
                                          </div>
                                          <div>
                                            <p className="t1">{cap.label}</p>
                                            <p className="t2 mt-0.5">{cap.text}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div
                                    className="flex items-start gap-2.5 p-3 rounded-lg"
                                    style={{
                                      background: 'var(--color-surface-raised)',
                                      border: '1px solid var(--color-border)',
                                      borderLeft: '3px solid var(--color-primary)',
                                    }}
                                  >
                                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                                    <p className="t2 leading-relaxed">
                                      <strong style={{ color: 'var(--color-text-primary)' }}>Beyond answers, Praful will act.</strong>{' '}
                                      Trigger uploads, send reminders, flag anomalies — a team member who knows everything on the platform, 24/7.
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Combined Impact */}
                  <div
                    className="mx-4 mb-4 p-4 rounded-xl flex items-start gap-3"
                    style={{
                      background: 'var(--color-border-light)',
                      border: '1px solid var(--color-border)',
                      borderLeft: '3px solid var(--color-primary)',
                    }}
                  >
                    <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <p className="t1 mb-1">Combined Impact</p>
                      <p className="t2 leading-relaxed">
                        Total estimated build time for all four automations:{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>~2–3 weeks.</strong>{' '}
                        The platform effectively becomes the central nervous system of the entire operation — campaigns, signatures, lead delivery, and accounting all connected and automated in one place.
                      </p>
                    </div>
                  </div>

                  {/* Agentic AI subscription notice */}
                  <div
                    className="mx-4 mb-4 p-4 rounded-xl flex items-start gap-3"
                    style={{
                      background: 'rgba(186,32,39,0.04)',
                      border: '1px solid rgba(186,32,39,0.18)',
                    }}
                  >
                    <Bot className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                    <p className="t2 leading-relaxed">
                      <strong style={{ color: 'var(--color-text-primary)' }}>Note:</strong>{' '}
                      All of the above features — including the Ask Praful resident AI — require a monthly subscription to{' '}
                      <strong style={{ color: 'var(--color-text-primary)' }}>Agentic AI</strong>.
                      Once the project is given the green light, these features can be scoped, costed, and added to the roadmap.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Feedback Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-card overflow-hidden"
        >
          {/* Form header */}
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-primary)' }}
            >
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="t1">We Value Your Input</h2>
              <p className="t3 mt-0.5">Share bugs, feature ideas, or general thoughts</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Type + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Feedback Type
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {feedbackTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      className="px-3 py-1.5 rounded-lg border transition-all"
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        borderColor: formData.type === type.value ? 'var(--color-primary)' : 'var(--color-border)',
                        background: formData.type === type.value ? 'rgba(186,32,39,0.06)' : 'white',
                        color: formData.type === type.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Priority
                </label>
                <div className="flex gap-1.5">
                  {priorityLevels.map(priority => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                      className="flex-1 py-1.5 px-3 rounded-lg border transition-all"
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        borderColor: formData.priority === priority.value ? 'var(--color-primary)' : 'var(--color-border)',
                        background: formData.priority === priority.value ? 'rgba(186,32,39,0.06)' : 'white',
                        color: formData.priority === priority.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      }}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Your Name
                </label>
                <input
                  type="text" id="name" name="name" value={formData.name}
                  onChange={handleInputChange} required
                  className="input-base px-3 py-2.5"
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Your Email
                </label>
                <input
                  type="email" id="email" name="email" value={formData.email}
                  onChange={handleInputChange} required
                  className="input-base px-3 py-2.5"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Subject
              </label>
              <input
                type="text" id="subject" name="subject" value={formData.subject}
                onChange={handleInputChange} required placeholder="Brief summary of your feedback"
                className="input-base px-3 py-2.5"
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="message" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Message
                </label>

                {/* Dictate button — inline right of label */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    title={isRecording ? 'Stop dictating' : 'Dictate your message'}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all"
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      borderColor: isRecording ? 'var(--color-error)' : 'var(--color-primary)',
                      background: isRecording ? 'rgba(220,38,38,0.06)' : 'rgba(186,32,39,0.06)',
                      color: isRecording ? 'var(--color-error)' : 'var(--color-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {isRecording ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                        </span>
                        <Square className="w-3 h-3" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" />
                        Dictate
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="relative">
                <textarea
                  id="message" name="message"
                  value={formData.message + (interimText ? interimText : '')}
                  onChange={e => {
                    // Allow manual edits; keep the committed base in sync
                    committedBaseRef.current = e.target.value;
                    setFormData(prev => ({ ...prev, message: e.target.value }));
                  }}
                  required rows={5}
                  placeholder={isRecording ? 'Listening… start speaking.' : 'Please provide as much detail as possible, or use Dictate above to speak your feedback…'}
                  className="input-base px-3 py-2.5 resize-none w-full"
                  style={{
                    borderColor: isRecording ? 'var(--color-error)' : undefined,
                    outline: isRecording ? '2px solid rgba(220,38,38,0.15)' : undefined,
                  }}
                />
              </div>

              {/* Live interim transcript preview */}
              <AnimatePresence>
                {isRecording && (
                  <motion.div
                    key="interim"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1.5 px-3 py-2 rounded-lg flex items-start gap-2"
                    style={{
                      background: 'rgba(220,38,38,0.04)',
                      border: '1px solid rgba(220,38,38,0.15)',
                    }}
                  >
                    <MicOff className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
                    <p style={{ fontSize: '12px', color: 'var(--color-error)', fontStyle: 'italic' }}>
                      {interimText || 'Listening… speak clearly into your microphone.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mic error */}
              <AnimatePresence>
                {micError && (
                  <motion.div
                    key="mic-err"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1.5 p-3 rounded-lg"
                    style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)' }}
                  >
                    {micError === 'blocked' ? (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
                        <div style={{ fontSize: '12px', color: 'var(--color-error)' }}>
                          <p style={{ fontWeight: 600 }}>Microphone access is unavailable here</p>
                          <p className="mt-0.5" style={{ color: 'var(--color-error)' }}>
                            Voice dictation doesn't work inside the Figma app or embedded previews — the webview doesn't have microphone access.
                          </p>
                          <p className="mt-1.5" style={{ color: 'var(--color-error)' }}>
                            To use Dictate, open this portal in <strong>Chrome</strong> or <strong>Edge</strong> directly — then click Dictate and allow microphone access when prompted.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2" style={{ fontSize: '12px', color: 'var(--color-error)' }}>
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {micError}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Unsupported notice */}
              {!speechSupported && (
                <p className="mt-1.5 flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  <MicOff className="w-3 h-3 flex-shrink-0" />
                  Voice dictation isn't supported in this browser. Try Chrome or Edge.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || submitStatus === 'success'}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Submitting...</span></>
              ) : submitStatus === 'success' ? (
                <><CheckCircle2 className="w-4 h-4" /><span>Feedback Sent!</span></>
              ) : (
                <><Send className="w-4 h-4" /><span>Submit Feedback</span></>
              )}
            </button>

            <AnimatePresence>
              {submitStatus === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3 rounded-xl flex items-center gap-3"
                  style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success)' }}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                  <div>
                    <p className="t1" style={{ color: 'var(--color-success)' }}>Thank you for your feedback!</p>
                    <p className="t2 mt-0.5">We've received your message and will review it shortly.</p>
                  </div>
                </motion.div>
              )}
              {submitStatus === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3 rounded-xl flex items-center gap-3"
                  style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error)' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-error)' }} />
                  <div>
                    <p className="t1" style={{ color: 'var(--color-error)' }}>Something went wrong</p>
                    <p className="t2 mt-0.5">Please try again or contact support if the issue persists.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* What happens next */}
          <div className="px-6 pb-6">
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--color-border-light)', border: '1px solid var(--color-border)' }}
            >
              <p className="t1 mb-2">What happens next?</p>
              <ul className="space-y-1.5">
                {[
                  'Our team reviews feedback within 24–48 hours',
                  'High priority issues are addressed immediately',
                  `Email confirmation sent to ${formData.email || 'your email'}`,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--color-primary)' }} />
                    <span className="t2">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}