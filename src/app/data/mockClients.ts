// ============================================
// MOCK CLIENT DATA - Used across all roles
// ============================================

export type LeadAcceptanceMethod = 'convertr' | 'csv_manual' | 'portal_review';

export interface Client {
  id: string;
  companyName: string;
  industry: string;
  status: 'active' | 'paused' | 'completed';
  totalLeads: number;
  leadsThisMonth: number;
  campaignManager: string;
  campaignManagerEmail: string;
  backupManager: string;
  backupManagerEmail: string;
  lastActivity: string; // ISO date string
  unreadNotifications: number;
  leadAcceptanceMethod: LeadAcceptanceMethod;
  campaigns: Campaign[];
}

export interface DeliverySchedule {
  date: string; // ISO date string
  leadsDelivered: number;
  status: 'completed' | 'upcoming';
  dayOfWeek: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'pending_approval';
  totalLeads: number;
  leadsThisMonth: number;
  acceptanceRate: number;
  lastActivity: string;
  target?: number;
  delivered?: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  goalLeads?: number;
  deliveredLeads?: number;
  deliverySchedule?: DeliverySchedule[];
  deliveryDays?: string[];
  leadsPerDelivery?: number;
  outreachMetrics?: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    openRate: number;
    clickRate: number;
  };
  convertrMetrics?: {
    uploadedLeads: number;
    acceptedLeads: number;
  };
}

// ─── 5 Clients with multiple campaigns each ───────────────────────────────────
export const allClients: Client[] = [
  // ── Client 1: The Channel Company (Technology) ─────────────────────────────────────
  {
    id: 'client_1',
    companyName: 'The Channel Company',
    industry: 'Technology',
    status: 'active',
    // Totals mirror the twelve seeded campaigns:
    // 314 + 59 + 41 + 128 + 62 + 96 + 180 + 114 + 97 + 133 + 0 + 0 delivered.
    totalLeads: 1224,
    leadsThisMonth: 400,
    campaignManager: 'Brijesh Singh',
    campaignManagerEmail: 'brijesh.singh@datamaticsbpm.com',
    backupManager: 'Arjun Patel',
    backupManagerEmail: 'arjun.patel@datamaticsbpm.com',
    lastActivity: '2026-07-28T14:30:00Z',
    unreadNotifications: 4,
    leadAcceptanceMethod: 'convertr',
    campaigns: [
      {
        id: '46888',
        name: 'Lenovo Intel FIFA AI',
        status: 'active',
        totalLeads: 314,
        leadsThisMonth: 176,
        acceptanceRate: 97,
        lastActivity: '2026-07-28T14:30:00Z',
        target: 350,
        delivered: 314,
        startDate: 'Jun 7, 2026',
        endDate: 'Oct 31, 2026',
        budget: 4200,
        goalLeads: 350,
        deliveredLeads: 314,
        deliverySchedule: [
          { date: '2026-06-08T00:00:00Z', leadsDelivered: 30, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-15T00:00:00Z', leadsDelivered: 34, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-22T00:00:00Z', leadsDelivered: 36, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-29T00:00:00Z', leadsDelivered: 38, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-06T00:00:00Z', leadsDelivered: 40, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-13T00:00:00Z', leadsDelivered: 44, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-20T00:00:00Z', leadsDelivered: 45, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-27T00:00:00Z', leadsDelivered: 47, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-08-03T00:00:00Z', leadsDelivered: 12, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-10T00:00:00Z', leadsDelivered: 12, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-17T00:00:00Z', leadsDelivered: 12, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 45,
        outreachMetrics: {
          emailsSent: 18200,
          emailsOpened: 5642,
          emailsClicked: 892,
          openRate: 31.0,
          clickRate: 4.9,
        },
      },
      {
        id: '46873',
        name: 'Uptime Solutions CRN2 - Lead Gen',
        status: 'active',
        totalLeads: 59,
        leadsThisMonth: 25,
        acceptanceRate: 96,
        lastActivity: '2026-07-28T11:15:00Z',
        target: 80,
        delivered: 59,
        startDate: 'May 25, 2026',
        endDate: 'Aug 31, 2026',
        budget: 960,
        goalLeads: 80,
        deliveredLeads: 59,
        deliverySchedule: [
          { date: '2026-05-25T00:00:00Z', leadsDelivered: 5, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-01T00:00:00Z', leadsDelivered: 5, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-08T00:00:00Z', leadsDelivered: 6, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-15T00:00:00Z', leadsDelivered: 6, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-22T00:00:00Z', leadsDelivered: 6, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-29T00:00:00Z', leadsDelivered: 6, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-06T00:00:00Z', leadsDelivered: 6, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-13T00:00:00Z', leadsDelivered: 6, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-20T00:00:00Z', leadsDelivered: 6, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-27T00:00:00Z', leadsDelivered: 7, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-08-03T00:00:00Z', leadsDelivered: 7, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-10T00:00:00Z', leadsDelivered: 7, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-17T00:00:00Z', leadsDelivered: 7, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 6,
        outreachMetrics: {
          emailsSent: 6400,
          emailsOpened: 1837,
          emailsClicked: 268,
          openRate: 28.7,
          clickRate: 4.2,
        },
      },
      {
        id: '46936',
        name: 'Eaton 2026 Full Year 1_Q3',
        status: 'active',
        totalLeads: 41,
        leadsThisMonth: 35,
        acceptanceRate: 95,
        lastActivity: '2026-07-27T16:40:00Z',
        target: 100,
        delivered: 41,
        startDate: 'Jun 29, 2026',
        endDate: 'Sep 30, 2026',
        budget: 1200,
        goalLeads: 100,
        deliveredLeads: 41,
        deliverySchedule: [
          { date: '2026-06-29T00:00:00Z', leadsDelivered: 6, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-06T00:00:00Z', leadsDelivered: 7, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-13T00:00:00Z', leadsDelivered: 9, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-20T00:00:00Z', leadsDelivered: 9, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-27T00:00:00Z', leadsDelivered: 10, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-08-03T00:00:00Z', leadsDelivered: 8, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-10T00:00:00Z', leadsDelivered: 8, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-17T00:00:00Z', leadsDelivered: 8, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-24T00:00:00Z', leadsDelivered: 9, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-31T00:00:00Z', leadsDelivered: 9, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-09-07T00:00:00Z', leadsDelivered: 9, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-09-14T00:00:00Z', leadsDelivered: 8, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 9,
        outreachMetrics: {
          emailsSent: 5100,
          emailsOpened: 1479,
          emailsClicked: 214,
          openRate: 29.0,
          clickRate: 4.2,
        },
      },
      // ── Active, on pace ──────────────────────────────────────────────────
      {
        id: '46901',
        name: 'Cisco Secure Edge CRN NAM - Q3',
        status: 'active',
        totalLeads: 128,
        leadsThisMonth: 82,
        acceptanceRate: 96,
        lastActivity: '2026-07-27T15:05:00Z',
        target: 200,
        delivered: 128,
        startDate: 'Jun 15, 2026',
        endDate: 'Sep 30, 2026',
        budget: 2600,
        goalLeads: 200,
        deliveredLeads: 128,
        deliverySchedule: [
          { date: '2026-06-15T00:00:00Z', leadsDelivered: 14, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-22T00:00:00Z', leadsDelivered: 16, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-29T00:00:00Z', leadsDelivered: 16, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-06T00:00:00Z', leadsDelivered: 20, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-13T00:00:00Z', leadsDelivered: 20, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-20T00:00:00Z', leadsDelivered: 21, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-27T00:00:00Z', leadsDelivered: 21, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-08-03T00:00:00Z', leadsDelivered: 18, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-10T00:00:00Z', leadsDelivered: 18, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-17T00:00:00Z', leadsDelivered: 18, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-24T00:00:00Z', leadsDelivered: 18, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 18,
        outreachMetrics: {
          emailsSent: 9800,
          emailsOpened: 3038,
          emailsClicked: 470,
          openRate: 31.0,
          clickRate: 4.8,
        },
      },
      // ── Active, behind pace ──────────────────────────────────────────────
      {
        id: '46912',
        name: 'Veeam Data Resilience CRN4 - EMEA',
        status: 'active',
        totalLeads: 62,
        leadsThisMonth: 29,
        acceptanceRate: 89,
        lastActivity: '2026-07-27T09:20:00Z',
        target: 150,
        delivered: 62,
        startDate: 'May 18, 2026',
        endDate: 'Aug 31, 2026',
        budget: 2250,
        goalLeads: 150,
        deliveredLeads: 62,
        deliverySchedule: [
          { date: '2026-05-18T00:00:00Z', leadsDelivered: 4, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-05-25T00:00:00Z', leadsDelivered: 4, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-01T00:00:00Z', leadsDelivered: 5, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-08T00:00:00Z', leadsDelivered: 5, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-15T00:00:00Z', leadsDelivered: 5, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-22T00:00:00Z', leadsDelivered: 5, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-29T00:00:00Z', leadsDelivered: 5, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-06T00:00:00Z', leadsDelivered: 7, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-13T00:00:00Z', leadsDelivered: 7, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-20T00:00:00Z', leadsDelivered: 7, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-27T00:00:00Z', leadsDelivered: 8, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-08-10T00:00:00Z', leadsDelivered: 8, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-17T00:00:00Z', leadsDelivered: 8, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-24T00:00:00Z', leadsDelivered: 8, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 8,
        outreachMetrics: {
          emailsSent: 7400,
          emailsOpened: 1954,
          emailsClicked: 252,
          openRate: 26.4,
          clickRate: 3.4,
        },
      },
      {
        id: '46927',
        name: 'Dell AI PC Refresh 2026 - APAC',
        status: 'active',
        totalLeads: 96,
        leadsThisMonth: 53,
        acceptanceRate: 91,
        lastActivity: '2026-07-27T13:45:00Z',
        target: 240,
        delivered: 96,
        startDate: 'Jun 1, 2026',
        endDate: 'Oct 15, 2026',
        budget: 3600,
        goalLeads: 240,
        deliveredLeads: 96,
        deliverySchedule: [
          { date: '2026-06-01T00:00:00Z', leadsDelivered: 8, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-08T00:00:00Z', leadsDelivered: 8, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-15T00:00:00Z', leadsDelivered: 9, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-22T00:00:00Z', leadsDelivered: 9, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-29T00:00:00Z', leadsDelivered: 9, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-06T00:00:00Z', leadsDelivered: 10, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-13T00:00:00Z', leadsDelivered: 13, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-20T00:00:00Z', leadsDelivered: 15, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-07-27T00:00:00Z', leadsDelivered: 15, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-08-03T00:00:00Z', leadsDelivered: 14, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-10T00:00:00Z', leadsDelivered: 14, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-17T00:00:00Z', leadsDelivered: 14, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-24T00:00:00Z', leadsDelivered: 14, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-08-31T00:00:00Z', leadsDelivered: 14, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-09-07T00:00:00Z', leadsDelivered: 14, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-09-14T00:00:00Z', leadsDelivered: 14, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-09-21T00:00:00Z', leadsDelivered: 14, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 14,
        outreachMetrics: {
          emailsSent: 12600,
          emailsOpened: 3402,
          emailsClicked: 441,
          openRate: 27.0,
          clickRate: 3.5,
        },
      },
      // ── Completed, earlier quarters ──────────────────────────────────────
      {
        id: '46944',
        name: 'HPE GreenLake Hybrid Cloud - Q1',
        status: 'completed',
        totalLeads: 180,
        leadsThisMonth: 0,
        acceptanceRate: 98,
        lastActivity: '2026-03-23T17:10:00Z',
        target: 180,
        delivered: 180,
        startDate: 'Jan 12, 2026',
        endDate: 'Mar 27, 2026',
        budget: 2700,
        goalLeads: 180,
        deliveredLeads: 180,
        deliverySchedule: [
          { date: '2026-01-12T00:00:00Z', leadsDelivered: 28, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-01-26T00:00:00Z', leadsDelivered: 30, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-09T00:00:00Z', leadsDelivered: 30, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-23T00:00:00Z', leadsDelivered: 30, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-09T00:00:00Z', leadsDelivered: 31, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-23T00:00:00Z', leadsDelivered: 31, status: 'completed', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 30,
        outreachMetrics: {
          emailsSent: 14100,
          emailsOpened: 4653,
          emailsClicked: 761,
          openRate: 33.0,
          clickRate: 5.4,
        },
      },
      {
        id: '46952',
        name: 'Fortinet SecOps Modernization CRN1',
        status: 'completed',
        totalLeads: 114,
        leadsThisMonth: 0,
        acceptanceRate: 94,
        lastActivity: '2026-04-20T16:00:00Z',
        target: 120,
        delivered: 114,
        startDate: 'Feb 2, 2026',
        endDate: 'Apr 30, 2026',
        budget: 1800,
        goalLeads: 120,
        deliveredLeads: 114,
        deliverySchedule: [
          { date: '2026-02-02T00:00:00Z', leadsDelivered: 18, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-16T00:00:00Z', leadsDelivered: 19, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-02T00:00:00Z', leadsDelivered: 19, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-16T00:00:00Z', leadsDelivered: 19, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-04-06T00:00:00Z', leadsDelivered: 20, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-04-20T00:00:00Z', leadsDelivered: 19, status: 'completed', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 19,
        outreachMetrics: {
          emailsSent: 9200,
          emailsOpened: 2668,
          emailsClicked: 386,
          openRate: 29.0,
          clickRate: 4.2,
        },
      },
      {
        id: '46967',
        name: 'Nutanix Cloud Platform CRN NAM - Q2',
        status: 'completed',
        totalLeads: 97,
        leadsThisMonth: 0,
        acceptanceRate: 97,
        lastActivity: '2026-06-08T12:30:00Z',
        target: 90,
        delivered: 97,
        startDate: 'Apr 6, 2026',
        endDate: 'Jun 12, 2026',
        budget: 1450,
        goalLeads: 90,
        deliveredLeads: 97,
        deliverySchedule: [
          { date: '2026-04-06T00:00:00Z', leadsDelivered: 15, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-04-20T00:00:00Z', leadsDelivered: 16, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-05-04T00:00:00Z', leadsDelivered: 16, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-05-18T00:00:00Z', leadsDelivered: 17, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-01T00:00:00Z', leadsDelivered: 17, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-08T00:00:00Z', leadsDelivered: 16, status: 'completed', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 16,
        outreachMetrics: {
          emailsSent: 7300,
          emailsOpened: 2409,
          emailsClicked: 372,
          openRate: 33.0,
          clickRate: 5.1,
        },
      },
      {
        id: '46974',
        name: 'Zscaler Zero Trust Exchange - EMEA Q2',
        status: 'completed',
        totalLeads: 133,
        leadsThisMonth: 0,
        acceptanceRate: 93,
        lastActivity: '2026-06-22T10:05:00Z',
        target: 140,
        delivered: 133,
        startDate: 'Apr 13, 2026',
        endDate: 'Jun 30, 2026',
        budget: 2100,
        goalLeads: 140,
        deliveredLeads: 133,
        deliverySchedule: [
          { date: '2026-04-13T00:00:00Z', leadsDelivered: 20, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-04-27T00:00:00Z', leadsDelivered: 22, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-05-11T00:00:00Z', leadsDelivered: 22, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-05-25T00:00:00Z', leadsDelivered: 23, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-08T00:00:00Z', leadsDelivered: 23, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-06-22T00:00:00Z', leadsDelivered: 23, status: 'completed', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 22,
        outreachMetrics: {
          emailsSent: 11400,
          emailsOpened: 3078,
          emailsClicked: 410,
          openRate: 27.0,
          clickRate: 3.6,
        },
      },
      // ── Awaiting client sign-off ─────────────────────────────────────────
      {
        id: '46989',
        name: 'Pure Storage FlashBlade CRN - Q4',
        status: 'pending_approval',
        totalLeads: 0,
        leadsThisMonth: 0,
        acceptanceRate: 0,
        lastActivity: '2026-08-04T09:00:00Z',
        target: 160,
        delivered: 0,
        startDate: 'Sep 7, 2026',
        endDate: 'Dec 18, 2026',
        budget: 2400,
        goalLeads: 160,
        deliveredLeads: 0,
        deliverySchedule: [
          { date: '2026-09-07T00:00:00Z', leadsDelivered: 20, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-09-21T00:00:00Z', leadsDelivered: 20, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-10-05T00:00:00Z', leadsDelivered: 20, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-10-19T00:00:00Z', leadsDelivered: 20, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-11-02T00:00:00Z', leadsDelivered: 20, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-11-16T00:00:00Z', leadsDelivered: 20, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-11-30T00:00:00Z', leadsDelivered: 20, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-12-14T00:00:00Z', leadsDelivered: 20, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 20,
      },
      {
        id: '46995',
        name: 'Broadcom VMware Cloud Foundation - Q4',
        status: 'pending_approval',
        totalLeads: 0,
        leadsThisMonth: 0,
        acceptanceRate: 0,
        lastActivity: '2026-08-05T15:20:00Z',
        target: 110,
        delivered: 0,
        startDate: 'Oct 5, 2026',
        endDate: 'Dec 14, 2026',
        budget: 1650,
        goalLeads: 110,
        deliveredLeads: 0,
        deliverySchedule: [
          { date: '2026-10-05T00:00:00Z', leadsDelivered: 18, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-10-19T00:00:00Z', leadsDelivered: 18, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-11-02T00:00:00Z', leadsDelivered: 18, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-11-16T00:00:00Z', leadsDelivered: 19, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-11-30T00:00:00Z', leadsDelivered: 19, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-12-14T00:00:00Z', leadsDelivered: 18, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 18,
      },
    ],
  },

  // ── Client 2: TechCo Ltd (SaaS) ──────────────────────────────────────────
  {
    id: 'client_2',
    companyName: 'TechCo Ltd',
    industry: 'SaaS',
    status: 'active',
    totalLeads: 2108,
    leadsThisMonth: 287,
    campaignManager: 'Brijesh Singh',
    campaignManagerEmail: 'brijesh.singh@datamaticsbpm.com',
    backupManager: 'Arjun Patel',
    backupManagerEmail: 'arjun.patel@datamaticsbpm.com',
    lastActivity: '2026-03-02T09:15:00Z',
    unreadNotifications: 2,
    leadAcceptanceMethod: 'csv_manual',
    campaigns: [
      {
        id: 'camp_2a',
        name: 'Enterprise Outreach – North America Q1 2026',
        status: 'active',
        totalLeads: 1203,
        leadsThisMonth: 287,
        acceptanceRate: 76,
        lastActivity: '2026-03-02T09:15:00Z',
        target: 1500,
        delivered: 1203,
        startDate: 'Jan 8, 2026',
        endDate: 'Apr 15, 2026',
        budget: 120000,
        goalLeads: 1500,
        deliveredLeads: 1203,
        deliverySchedule: [
          { date: '2026-01-12T00:00:00Z', leadsDelivered: 300, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-01-26T00:00:00Z', leadsDelivered: 300, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-09T00:00:00Z', leadsDelivered: 300, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-23T00:00:00Z', leadsDelivered: 303, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-09T00:00:00Z', leadsDelivered: 297, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 300,
        outreachMetrics: {
          emailsSent: 38200,
          emailsOpened: 11842,
          emailsClicked: 1719,
          openRate: 31.0,
          clickRate: 4.5,
        },
      },
      {
        id: 'camp_2b',
        name: 'SMB SaaS Decision Makers – EMEA 2026',
        status: 'active',
        totalLeads: 905,
        leadsThisMonth: 0,
        acceptanceRate: 69,
        lastActivity: '2026-02-20T11:00:00Z',
        target: 800,
        delivered: 905,
        startDate: 'Nov 1, 2025',
        endDate: 'Feb 28, 2026',
        budget: 72000,
        goalLeads: 800,
        deliveredLeads: 905,
        deliverySchedule: [
          { date: '2025-11-15T00:00:00Z', leadsDelivered: 220, status: 'completed', dayOfWeek: 'Saturday' },
          { date: '2025-12-15T00:00:00Z', leadsDelivered: 220, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-01-15T00:00:00Z', leadsDelivered: 230, status: 'completed', dayOfWeek: 'Thursday' },
          { date: '2026-02-15T00:00:00Z', leadsDelivered: 235, status: 'completed', dayOfWeek: 'Sunday' },
        ],
        deliveryDays: ['Friday'],
        leadsPerDelivery: 220,
      },
      {
        id: 'camp_2c',
        name: 'APAC SaaS Appointment Setting – Q2 2026',
        status: 'active',
        totalLeads: 0,
        leadsThisMonth: 0,
        acceptanceRate: 0,
        lastActivity: '2026-02-28T08:00:00Z',
        target: 80,
        delivered: 0,
        startDate: 'Apr 1, 2026',
        endDate: 'Jun 30, 2026',
        budget: 16000,
        goalLeads: 80,
        deliveredLeads: 0,
        deliverySchedule: [
          { date: '2026-04-15T00:00:00Z', leadsDelivered: 40, status: 'upcoming', dayOfWeek: 'Wednesday' },
          { date: '2026-05-15T00:00:00Z', leadsDelivered: 40, status: 'upcoming', dayOfWeek: 'Friday' },
        ],
        deliveryDays: ['Wednesday'],
        leadsPerDelivery: 40,
      },
    ],
  },

  // ── Client 3: Meridian Group (Financial Services) ─────────────────────────
  {
    id: 'client_3',
    companyName: 'Meridian Group',
    industry: 'Financial Services',
    status: 'active',
    totalLeads: 893,
    leadsThisMonth: 145,
    campaignManager: 'Brijesh Singh',
    campaignManagerEmail: 'brijesh.singh@datamaticsbpm.com',
    backupManager: 'Arjun Patel',
    backupManagerEmail: 'arjun.patel@datamaticsbpm.com',
    lastActivity: '2026-03-01T16:45:00Z',
    unreadNotifications: 1,
    leadAcceptanceMethod: 'portal_review',
    campaigns: [
      {
        id: 'camp_3a',
        name: 'UK Banking Sector BANT Qualification – Q1 2026',
        status: 'active',
        totalLeads: 412,
        leadsThisMonth: 145,
        acceptanceRate: 74,
        lastActivity: '2026-03-01T16:45:00Z',
        target: 500,
        delivered: 412,
        startDate: 'Dec 1, 2025',
        endDate: 'Mar 31, 2026',
        budget: 60000,
        goalLeads: 500,
        deliveredLeads: 412,
        deliverySchedule: [
          { date: '2025-12-15T00:00:00Z', leadsDelivered: 120, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-01-12T00:00:00Z', leadsDelivered: 120, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-09T00:00:00Z', leadsDelivered: 172, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-09T00:00:00Z', leadsDelivered: 88, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 120,
      },
      {
        id: 'camp_3b',
        name: 'FinTech Decision Makers – DACH Region',
        status: 'paused',
        totalLeads: 245,
        leadsThisMonth: 0,
        acceptanceRate: 66,
        lastActivity: '2026-02-10T12:00:00Z',
        target: 400,
        delivered: 245,
        startDate: 'Jan 15, 2026',
        endDate: 'Apr 30, 2026',
        budget: 52000,
        goalLeads: 400,
        deliveredLeads: 245,
        deliverySchedule: [
          { date: '2026-01-19T00:00:00Z', leadsDelivered: 125, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-02T00:00:00Z', leadsDelivered: 120, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-02T00:00:00Z', leadsDelivered: 155, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 125,
      },
      {
        id: 'camp_3c',
        name: 'APAC Appointment Setting – CloudTech Program',
        status: 'active',
        totalLeads: 236,
        leadsThisMonth: 0,
        acceptanceRate: 83,
        lastActivity: '2026-02-28T10:00:00Z',
        target: 60,
        delivered: 22,
        startDate: 'Mar 1, 2026',
        endDate: 'May 31, 2026',
        budget: 12000,
        goalLeads: 60,
        deliveredLeads: 22,
        deliverySchedule: [
          { date: '2026-03-15T00:00:00Z', leadsDelivered: 20, status: 'upcoming', dayOfWeek: 'Sunday' },
          { date: '2026-04-15T00:00:00Z', leadsDelivered: 20, status: 'upcoming', dayOfWeek: 'Wednesday' },
          { date: '2026-05-15T00:00:00Z', leadsDelivered: 18, status: 'upcoming', dayOfWeek: 'Friday' },
        ],
        deliveryDays: ['Wednesday'],
        leadsPerDelivery: 20,
      },
    ],
  },

  // ── Client 4: Global Innovations Inc (Manufacturing) ─────────────────────
  {
    id: 'client_4',
    companyName: 'Global Innovations Inc',
    industry: 'Manufacturing',
    status: 'active',
    totalLeads: 1087,
    leadsThisMonth: 198,
    campaignManager: 'Michael Chen',
    campaignManagerEmail: 'michael.chen@datamaticsbpm.com',
    backupManager: 'Emily Rodriguez',
    backupManagerEmail: 'emily.rodriguez@datamaticsbpm.com',
    lastActivity: '2026-03-02T11:20:00Z',
    unreadNotifications: 3,
    leadAcceptanceMethod: 'convertr',
    campaigns: [
      {
        id: 'camp_4a',
        name: 'Manufacturing Leads – North America Q1 2026',
        status: 'active',
        totalLeads: 623,
        leadsThisMonth: 142,
        acceptanceRate: 78,
        lastActivity: '2026-03-02T11:20:00Z',
        target: 700,
        delivered: 623,
        startDate: 'Jan 20, 2026',
        endDate: 'Apr 20, 2026',
        budget: 62000,
        goalLeads: 700,
        deliveredLeads: 623,
        deliverySchedule: [
          { date: '2026-01-26T00:00:00Z', leadsDelivered: 175, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-09T00:00:00Z', leadsDelivered: 175, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-23T00:00:00Z', leadsDelivered: 175, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-09T00:00:00Z', leadsDelivered: 98, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-23T00:00:00Z', leadsDelivered: 77, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 175,
      },
      {
        id: 'camp_4b',
        name: 'EMEA Industrial Automation – Double Touch',
        status: 'active',
        totalLeads: 464,
        leadsThisMonth: 56,
        acceptanceRate: 71,
        lastActivity: '2026-02-28T14:00:00Z',
        target: 500,
        delivered: 228,
        startDate: 'Feb 15, 2026',
        endDate: 'May 15, 2026',
        budget: 35000,
        goalLeads: 500,
        deliveredLeads: 228,
        deliverySchedule: [
          { date: '2026-02-23T00:00:00Z', leadsDelivered: 125, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-09T00:00:00Z', leadsDelivered: 103, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-23T00:00:00Z', leadsDelivered: 125, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-04-06T00:00:00Z', leadsDelivered: 125, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-04-20T00:00:00Z', leadsDelivered: 22, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 125,
      },
    ],
  },

  // ── Client 5: Nexus Enterprises (Healthcare) ─────────────────────────────
  {
    id: 'client_5',
    companyName: 'Nexus Enterprises',
    industry: 'Healthcare',
    status: 'active',
    totalLeads: 1742,
    leadsThisMonth: 220,
    campaignManager: 'Emily Rodriguez',
    campaignManagerEmail: 'emily.rodriguez@datamaticsbpm.com',
    backupManager: 'Michael Chen',
    backupManagerEmail: 'michael.chen@datamaticsbpm.com',
    lastActivity: '2026-03-02T08:30:00Z',
    unreadNotifications: 0,
    leadAcceptanceMethod: 'csv_manual',
    campaigns: [
      {
        id: 'camp_5a',
        name: 'Healthcare Provider Campaign – Q4 2025',
        status: 'completed',
        totalLeads: 892,
        leadsThisMonth: 0,
        acceptanceRate: 88,
        lastActivity: '2025-12-31T23:59:00Z',
        target: 900,
        delivered: 892,
        startDate: 'Oct 1, 2025',
        endDate: 'Dec 31, 2025',
        budget: 95000,
        goalLeads: 900,
        deliveredLeads: 892,
        deliverySchedule: [
          { date: '2025-10-15T00:00:00Z', leadsDelivered: 223, status: 'completed', dayOfWeek: 'Wednesday' },
          { date: '2025-11-01T00:00:00Z', leadsDelivered: 223, status: 'completed', dayOfWeek: 'Saturday' },
          { date: '2025-11-15T00:00:00Z', leadsDelivered: 223, status: 'completed', dayOfWeek: 'Saturday' },
          { date: '2025-12-15T00:00:00Z', leadsDelivered: 223, status: 'completed', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Friday'],
        leadsPerDelivery: 223,
      },
      {
        id: 'camp_5b',
        name: 'Medical Device Decision Makers – US 2026',
        status: 'active',
        totalLeads: 520,
        leadsThisMonth: 150,
        acceptanceRate: 85,
        lastActivity: '2026-03-02T08:30:00Z',
        target: 750,
        delivered: 520,
        startDate: 'Jan 10, 2026',
        endDate: 'Apr 30, 2026',
        budget: 67500,
        goalLeads: 750,
        deliveredLeads: 520,
        deliverySchedule: [
          { date: '2026-01-19T00:00:00Z', leadsDelivered: 175, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-02T00:00:00Z', leadsDelivered: 175, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-16T00:00:00Z', leadsDelivered: 170, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-09T00:00:00Z', leadsDelivered: 155, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-03-23T00:00:00Z', leadsDelivered: 75, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 175,
      },
      {
        id: 'camp_5c',
        name: 'Healthcare IT BANT Qualification – EMEA',
        status: 'active',
        totalLeads: 330,
        leadsThisMonth: 70,
        acceptanceRate: 79,
        lastActivity: '2026-03-01T15:00:00Z',
        target: 300,
        delivered: 180,
        startDate: 'Feb 1, 2026',
        endDate: 'May 31, 2026',
        budget: 42000,
        goalLeads: 300,
        deliveredLeads: 180,
        deliverySchedule: [
          { date: '2026-02-09T00:00:00Z', leadsDelivered: 90, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-02-23T00:00:00Z', leadsDelivered: 90, status: 'completed', dayOfWeek: 'Monday' },
          { date: '2026-03-09T00:00:00Z', leadsDelivered: 90, status: 'upcoming', dayOfWeek: 'Monday' },
          { date: '2026-03-23T00:00:00Z', leadsDelivered: 30, status: 'upcoming', dayOfWeek: 'Monday' },
        ],
        deliveryDays: ['Monday'],
        leadsPerDelivery: 90,
      },
    ],
  },
];

// Helper function: Get clients assigned to a specific user
export function getClientsForUser(userEmail: string): Client[] {
  return allClients.filter(
    (client) =>
      client.campaignManagerEmail === userEmail ||
      client.backupManagerEmail === userEmail
  );
}

// Helper function: Get clients assigned to a specific user by ID
export function getAssignedClients(userId: string): Array<{ id: string; name: string; status: string }> {
  const userEmailMap: Record<string, string> = {
    'manager_1': 'brijesh.singh@datamaticsbpm.com',
    'manager_2': 'michael.chen@datamaticsbpm.com',
    'backup_1': 'arjun.patel@datamaticsbpm.com',
    'backup_2': 'emily.rodriguez@datamaticsbpm.com',
  };

  const userEmail = userEmailMap[userId];
  if (!userEmail) return [];

  const clients = getClientsForUser(userEmail);
  return clients.map(client => ({
    id: client.id,
    name: client.companyName,
    status: client.status,
  }));
}

// Helper function: Get a single client by ID
export function getClientById(clientId: string): Client | undefined {
  return allClients.find((client) => client.id === clientId);
}

// Helper function: Get account team for a client
export function getAccountTeam(clientId: string) {
  const client = getClientById(clientId);
  if (!client) return null;

  return {
    manager: {
      name: client.campaignManager,
      email: client.campaignManagerEmail,
      role: 'Your Campaign Manager',
    },
    backup: {
      name: client.backupManager,
      email: client.backupManagerEmail,
      role: 'Your Campaign Backup',
    },
  };
}

// Aggregate stats for ops manager
export function getGlobalStats() {
  const totalClients = allClients.length;
  const activeCampaigns = allClients.reduce(
    (sum, c) => sum + c.campaigns.filter(camp => camp.status === 'active').length, 0
  );
  const totalCampaigns = allClients.reduce((sum, client) => sum + client.campaigns.length, 0);
  const totalLeadsDelivered = allClients.reduce((sum, client) => sum + client.totalLeads, 0);
  const totalLeadsThisMonth = allClients.reduce((sum, client) => sum + client.leadsThisMonth, 0);
  const teamMembers = 5;

  return {
    totalClients,
    activeCampaigns,
    totalCampaigns,
    totalLeadsDelivered,
    totalLeadsThisMonth,
    teamMembers,
  };
}

// Operations-focused lead upload tracking
export interface LeadUploadBatch {
  id: string;
  campaignId: string;
  campaignName: string;
  clientId: string;
  clientName: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errorDetails?: string[];
}

export const recentUploadBatches: LeadUploadBatch[] = [
  {
    id: 'upload_001',
    campaignId: '46888',
    campaignName: 'Lenovo Intel FIFA AI',
    clientId: 'client_1',
    clientName: 'The Channel Company',
    uploadedBy: 'Brijesh Singh',
    uploadedAt: '2026-03-02T10:30:00Z',
    status: 'processing',
    fileName: 'tcc_lenovo_fifa_july_batch1.csv',
    totalRows: 450,
    processedRows: 287,
    successCount: 285,
    errorCount: 2,
    errorDetails: ['Row 45: Invalid email format', 'Row 123: Missing required field'],
  },
  {
    id: 'upload_002',
    campaignId: 'camp_2a',
    campaignName: 'Enterprise Outreach – North America Q1 2026',
    clientId: 'client_2',
    clientName: 'TechCo Ltd',
    uploadedBy: 'Arjun Patel',
    uploadedAt: '2026-03-02T09:15:00Z',
    status: 'completed',
    fileName: 'techco_na_batch5.xlsx',
    totalRows: 823,
    processedRows: 823,
    successCount: 820,
    errorCount: 3,
  },
  {
    id: 'upload_003',
    campaignId: 'camp_4a',
    campaignName: 'Manufacturing Leads – North America Q1 2026',
    clientId: 'client_4',
    clientName: 'Global Innovations Inc',
    uploadedBy: 'Michael Chen',
    uploadedAt: '2026-03-02T08:45:00Z',
    status: 'completed',
    fileName: 'global_innovations_batch4.csv',
    totalRows: 234,
    processedRows: 234,
    successCount: 234,
    errorCount: 0,
  },
  {
    id: 'upload_004',
    campaignId: 'camp_4b',
    campaignName: 'EMEA Industrial Automation – Double Touch',
    clientId: 'client_4',
    clientName: 'Global Innovations Inc',
    uploadedBy: 'Emily Rodriguez',
    uploadedAt: '2026-03-01T16:20:00Z',
    status: 'failed',
    fileName: 'emea_industrial_batch2.csv',
    totalRows: 156,
    processedRows: 45,
    successCount: 0,
    errorCount: 45,
    errorDetails: ['File format error: Invalid CSV structure', 'Multiple duplicate emails detected'],
  },
  {
    id: 'upload_005',
    campaignId: 'camp_5b',
    campaignName: 'Medical Device Decision Makers – US 2026',
    clientId: 'client_5',
    clientName: 'Nexus Enterprises',
    uploadedBy: 'Emily Rodriguez',
    uploadedAt: '2026-03-01T14:00:00Z',
    status: 'completed',
    fileName: 'nexus_medical_devices_batch3.xlsx',
    totalRows: 567,
    processedRows: 567,
    successCount: 565,
    errorCount: 2,
  },
  {
    id: 'upload_006',
    campaignId: 'camp_3a',
    campaignName: 'UK Banking Sector BANT Qualification – Q1 2026',
    clientId: 'client_3',
    clientName: 'Meridian Group',
    uploadedBy: 'Brijesh Singh',
    uploadedAt: '2026-02-28T13:00:00Z',
    status: 'completed',
    fileName: 'meridian_uk_bant_batch3.csv',
    totalRows: 172,
    processedRows: 172,
    successCount: 172,
    errorCount: 0,
  },
];

// Helper: Get pending uploads (for ops priority view)
export function getPendingUploads(): LeadUploadBatch[] {
  return recentUploadBatches.filter(u => u.status === 'pending' || u.status === 'processing');
}

// Helper: Get failed uploads (for ops to retry)
export function getFailedUploads(): LeadUploadBatch[] {
  return recentUploadBatches.filter(u => u.status === 'failed');
}

// ============================================
// CAMPAIGN OVERRIDES PERSISTENCE (localStorage)
// ============================================

export function applyCampaignOverrides() {
  try {
    const saved = localStorage.getItem('datamatics-campaign-overrides');
    if (saved) {
      const overrides = JSON.parse(saved); // key: campaignId -> override fields
      allClients.forEach(client => {
        client.campaigns.forEach(campaign => {
          const o = overrides[campaign.id];
          if (o) {
            // Update base metrics
            if (o.deliveredLeads !== undefined) {
              campaign.delivered = o.deliveredLeads;
              campaign.deliveredLeads = o.deliveredLeads;
              campaign.totalLeads = o.deliveredLeads; // keep sync
            }
            if (o.targetLeads !== undefined) {
              campaign.target = o.targetLeads;
              campaign.goalLeads = o.targetLeads;
            }
            if (o.acceptanceRate !== undefined) {
              campaign.acceptanceRate = o.acceptanceRate;
            }
            
            // Update outreach metrics if they exist
            if (o.outreachMetrics) {
              campaign.outreachMetrics = {
                emailsSent: o.outreachMetrics.emailsSent,
                emailsOpened: o.outreachMetrics.emailsOpened,
                emailsClicked: o.outreachMetrics.emailsClicked,
                openRate: o.outreachMetrics.openRate,
                clickRate: o.outreachMetrics.clickRate,
              };
            }
            
            // Update convertr metrics
            if (o.convertrMetrics) {
              campaign.convertrMetrics = {
                uploadedLeads: o.convertrMetrics.uploadedLeads,
                acceptedLeads: o.convertrMetrics.acceptedLeads,
              };
            }
          }
        });
        
        // Recalculate client-level aggregate metrics based on campaigns
        client.totalLeads = client.campaigns.reduce((sum, camp) => sum + (camp.deliveredLeads || camp.delivered || camp.totalLeads || 0), 0);
      });
    }
  } catch (e) {
    console.error("Failed to apply campaign overrides:", e);
  }
}

export function saveCampaignOverride(campaignId: string, data: {
  deliveredLeads?: number;
  targetLeads?: number;
  acceptanceRate?: number;
  outreachMetrics?: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    openRate: number;
    clickRate: number;
  };
  convertrMetrics?: {
    uploadedLeads: number;
    acceptedLeads: number;
  };
}) {
  try {
    const saved = localStorage.getItem('datamatics-campaign-overrides');
    const overrides = saved ? JSON.parse(saved) : {};
    overrides[campaignId] = {
      ...overrides[campaignId],
      ...data,
    };
    localStorage.setItem('datamatics-campaign-overrides', JSON.stringify(overrides));
    
    // Apply immediately to the in-memory array
    applyCampaignOverrides();
  } catch (e) {
    console.error("Failed to save campaign override:", e);
  }
}

// Automatically apply overrides on load if in browser environment
if (typeof window !== 'undefined') {
  applyCampaignOverrides();
}