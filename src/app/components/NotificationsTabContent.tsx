import { useState } from 'react';
import { Bell, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../context/NotificationContext';

interface PrefRow {
  key: 'campaign_live' | '25_percent' | '50_percent' | '75_percent' | '100_percent' | 'invoice_generated';
  emoji: string;
  label: string;
  description: string;
}

const PREF_ROWS: PrefRow[] = [
  { key: 'campaign_live',     emoji: '🟢', label: 'Campaign Goes Live',       description: 'When a campaign is approved and starts running' },
  { key: '25_percent',        emoji: '📊', label: '25% of leads delivered',   description: 'First quarter milestone reached' },
  { key: '50_percent',        emoji: '📊', label: '50% of leads delivered',   description: 'Halfway point reached' },
  { key: '75_percent',        emoji: '📊', label: '75% of leads delivered',   description: 'Three-quarter milestone reached' },
  { key: '100_percent',       emoji: '✅', label: '100% of leads delivered',  description: 'Campaign delivery complete' },
  { key: 'invoice_generated', emoji: '🧾', label: 'Invoice Generated',        description: 'A new invoice has been created for your account' },
];

export function NotificationsTabContent() {
  const { preferences, setPreferences } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState({ ...preferences });

  const toggle = (key: PrefRow['key']) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setPreferences(localPrefs);
    toast.success('Notification preferences updated');
  };

  const handleCancel = () => {
    setLocalPrefs({ ...preferences });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
          Notification Preferences
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }} className="mt-1">
          Choose which delivery milestones trigger an in-app notification and email alert.
        </p>
      </div>

      {/* Section label */}
      <div>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
          className="mb-3"
        >
          Delivery Milestone Alerts
        </p>

        <div className="space-y-2">
          {PREF_ROWS.map((row) => {
            const isOn = localPrefs[row.key];
            return (
              <div
                key={row.key}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'var(--color-border-light)', border: '1px solid var(--color-border)' }}
              >
                {/* Label + description */}
                <div className="flex-1 min-w-0 mr-4">
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {row.emoji} {row.label}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }} className="mt-0.5">
                    {row.description}
                  </p>
                </div>

                {/* Toggle switch — pure inline styles, no peer-* classes */}
                <button
                  type="button"
                  onClick={() => toggle(row.key)}
                  role="switch"
                  aria-checked={isOn}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    flexShrink: 0,
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: isOn ? 'var(--color-primary)' : 'var(--color-border)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: isOn ? '23px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'var(--color-surface-raised)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info callout */}
      <div
        className="p-4 rounded-xl flex items-start gap-3"
        style={{ background: 'rgba(186,32,39,0.04)', border: '1px solid rgba(186,32,39,0.12)' }}
      >
        <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
        <div>
          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            In-app &amp; Email
          </p>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }} className="mt-0.5">
            Enabled milestones appear in the notification bell in your sidebar. Email alerts are also
            sent to your account email address.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={handleCancel} className="btn-outline px-4 py-2">
          Cancel
        </button>
        <button onClick={handleSave} className="btn-primary px-4 py-2 flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Preferences
        </button>
      </div>
    </div>
  );
}
