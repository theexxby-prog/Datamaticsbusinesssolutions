// ─── Lead delivery methods ───────────────────────────────────────────────────
// One list, two consumers: the campaign-setup modal (where a method is picked
// and configured) and the client-facing delivery strip on the Leads page (where
// we show what a client can receive leads through). Keeping them on the same
// const means the roadmap and the setup form can never claim different things.

export interface DeliveryMethod {
  value: string;
  label: string;
  /** Live in the September build, or on the roadmap behind it. */
  status: 'available' | 'roadmap';
  /** Short client-facing description for the roadmap strip. */
  blurb?: string;
}

export const DELIVERY_METHODS: DeliveryMethod[] = [
  { value: 'email', label: '📧 Email (CSV attachment)', status: 'available' },
  { value: 'sheets', label: '📊 Google Sheets', status: 'roadmap' },
  { value: 'webhook', label: '🔗 Custom Webhook', status: 'roadmap' },
  { value: 'salesforce', label: '☁️ Salesforce CRM', status: 'roadmap' },
  { value: 'hubspot', label: '🟠 HubSpot CRM', status: 'roadmap' },
  { value: 'pipedrive', label: '🟣 Pipedrive CRM', status: 'roadmap' },
  { value: 'convertr', label: '⚡ Automated Delivery', status: 'roadmap' },
  { value: 'leadbyte', label: '📦 LeadByte', status: 'roadmap' },
  { value: 'ftp', label: '🗂️ FTP / SFTP', status: 'roadmap' },
];

// ─── What the client sees on the Leads page ──────────────────────────────────
// CSV export is real today. The API subscription and CRM push are deliberately
// non-interactive: September's commitment is screen-share and export, and a
// working connect flow here would promise more than the build delivers.

export interface DeliveryChannel {
  key: 'csv' | 'api' | 'crm';
  label: string;
  blurb: string;
  status: 'available' | 'roadmap';
}

export const CLIENT_DELIVERY_CHANNELS: DeliveryChannel[] = [
  {
    key: 'csv',
    label: 'CSV export',
    blurb: 'Download the current view, filters and all',
    status: 'available',
  },
  {
    key: 'api',
    label: 'API subscription',
    blurb: 'Poll or subscribe to leads as they are accepted',
    status: 'roadmap',
  },
  {
    key: 'crm',
    label: 'Push to your CRM',
    blurb: 'Salesforce · HubSpot · Dynamics',
    status: 'roadmap',
  },
];
