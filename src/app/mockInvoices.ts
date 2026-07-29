export interface Invoice {
  id: string;
  invoiceNumber: string;
  campaignName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  pdfUrl?: string;
}

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2026-001234',
    campaignName: 'Uptime Solutions CRN2 - Lead Gen',
    issueDate: '2026-03-01',
    dueDate: '2026-03-31',
    amount: 29750,
    status: 'Paid'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2026-001189',
    campaignName: 'Lenovo Intel FIFA AI',
    issueDate: '2026-02-15',
    dueDate: '2026-03-17',
    amount: 14400,
    status: 'Paid'
  },
  {
    id: '3',
    invoiceNumber: 'INV-2026-001298',
    campaignName: 'Financial Services BANT Qualification',
    issueDate: '2026-02-20',
    dueDate: '2026-04-05',
    amount: 7800,
    status: 'Pending'
  },
  {
    id: '4',
    invoiceNumber: 'INV-2026-001156',
    campaignName: 'Lenovo Intel FIFA AI',
    issueDate: '2026-01-31',
    dueDate: '2026-03-02',
    amount: 11250,
    status: 'Paid'
  },
  {
    id: '5',
    invoiceNumber: 'INV-2026-001087',
    campaignName: 'SaaS Appointment Setting - Q1',
    issueDate: '2026-01-15',
    dueDate: '2026-02-14',
    amount: 3600,
    status: 'Overdue'
  }
];
