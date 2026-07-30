import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { TableRow } from '../components/TableRow';
import { 
  Search, MessageSquare, AlertCircle, CheckCircle, Clock, Plus, User, Calendar, Tag,
  Send, Paperclip, Star, X, Activity, TrendingUp, BarChart3, Filter, Grid3x3, List
} from 'lucide-react';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmptyState } from '../components/EmptyState';
import { toast } from 'sonner';
import { formatDate } from '../utils/formatDate';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category: 'Technical' | 'Billing' | 'Campaign' | 'Lead Quality' | 'General';
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
  assignedTo?: string;
  campaign?: string;
  messages?: number;
}

const mockTickets: Ticket[] = [
  {
    id: 'TKT-001',
    title: 'Add Budget Authority field to lead format',
    description: 'Requesting two extra qualification fields (Budget Authority, Purchase Timeline) on delivered leads for Lenovo Intel FIFA AI.',
    status: 'In Progress',
    priority: 'Low',
    category: 'General',
    createdBy: 'Renuka Lawless',
    createdDate: '2026-07-22',
    lastUpdated: '2026-07-27',
    assignedTo: 'Brijesh Singh',
    campaign: 'Lenovo Intel FIFA AI',
    messages: 5
  },
  {
    id: 'TKT-002',
    title: 'Add a second recipient to weekly digest',
    description: 'Please copy our channel marketing lead on the weekly campaign digest email.',
    status: 'Resolved',
    priority: 'Low',
    category: 'General',
    createdBy: 'Renuka Lawless',
    createdDate: '2026-07-14',
    lastUpdated: '2026-07-16',
    assignedTo: 'Brijesh Singh',
    campaign: 'Uptime Solutions CRN2 - Lead Gen',
    messages: 3
  },
  {
    id: 'TKT-003',
    title: 'Campaign performance metrics clarification',
    description: 'Need clarification on how acceptance rate is calculated.',
    status: 'Resolved',
    priority: 'Low',
    category: 'General',
    createdBy: 'Renuka Lawless',
    createdDate: '2026-07-06',
    lastUpdated: '2026-07-09',
    assignedTo: 'Brijesh Singh',
    campaign: 'Eaton 2026 Full Year 1_Q3',
    messages: 7
  }
];

export default function Support() {
  const { currentUser } = useAuth();
  const ticketStats = {
    total: mockTickets.length,
    active: mockTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length,
    resolved: mockTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
    highPriority: mockTickets.filter(t => t.priority === 'High' || t.priority === 'Urgent').length,
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'General' as Ticket['category'],
    priority: 'Medium' as Ticket['priority']
  });

  const filteredTickets = mockTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSubmitTicket = () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Support ticket created successfully!');
    setShowNewTicketModal(false);
    setNewTicket({
      title: '',
      description: '',
      category: 'General',
      priority: 'Medium'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'badge badge-paused';
      case 'In Progress':
        return 'badge badge-active';
      case 'Waiting':
        return 'badge badge-paused';
      case 'Resolved':
        return 'badge badge-active';
      case 'Closed':
        return 'badge badge-completed';
      default:
        return 'badge badge-completed';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <Clock className="w-3.5 h-3.5" />;
      case 'In Progress':
        return <Activity className="w-3.5 h-3.5" />;
      case 'Waiting':
        return <Clock className="w-3.5 h-3.5" />;
      case 'Resolved':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'Closed':
        return <CheckCircle className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'text-red-600 bg-red-50 border border-red-100';
      case 'High':
        return 'text-orange-600 bg-orange-50 border border-orange-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border border-yellow-100';
      case 'Low':
        return 'text-blue-600 bg-blue-50 border border-blue-100';
      default:
        return 'text-gray-600 bg-gray-50 border border-gray-100';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-[1440px] mx-auto page-content animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 style={{ color: 'var(--color-text-primary)' }}>Support Tickets</h1>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Get help with your campaigns and account
            </p>
          </div>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="btn-primary px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 stagger-children">
          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between">
              <MessageSquare className="kpi-card__icon" />
            </div>
            <div className="kpi-card__number">{ticketStats.total}</div>
            <div className="kpi-card__label">Total Tickets</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between">
              <Clock className="kpi-card__icon" />
            </div>
            <div className="kpi-card__number">{ticketStats.active}</div>
            <div className="kpi-card__label">Active</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between">
              <CheckCircle className="kpi-card__icon" />
            </div>
            <div className="kpi-card__number">{ticketStats.resolved}</div>
            <div className="kpi-card__label">Resolved</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between">
              <AlertCircle className="kpi-card__icon" />
            </div>
            <div className="kpi-card__number">{ticketStats.highPriority}</div>
            <div className="kpi-card__label">High Priority</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
          <div className="lg:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base w-full pl-10 pr-4 py-3"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base w-full px-4 py-3"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting">Waiting</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-base w-full px-4 py-3"
            >
              <option value="All">All Priority</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="glass-card overflow-hidden">
          {/* Desktop table — hidden on mobile */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead style={{ background: 'var(--color-border-light)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th className="text-left px-6 py-4" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>
                    Ticket
                  </th>
                  <th className="text-left px-6 py-4" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>
                    Category
                  </th>
                  <th className="text-left px-6 py-4" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>
                    Priority
                  </th>
                  <th className="text-left px-6 py-4" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>
                    Status
                  </th>
                  <th className="text-left px-6 py-4" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>
                    Last Updated
                  </th>
                  <th className="text-left px-6 py-4" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket, index) => (
                  <TableRow
                    key={ticket.id}
                    showHoverEffect={true}
                    animationDelay={index * 50}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                          {ticket.title}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }} className="mt-1">
                          {ticket.id} • {ticket.messages} messages
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-completed">{ticket.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${getPriorityColor(ticket.priority)}`} style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', letterSpacing: 'var(--letter-spacing-wide)' }}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span>{ticket.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                        {formatDate(ticket.lastUpdated)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toast.info('Opening ticket...')}
                        className="btn-outline px-3 py-1.5"
                        style={{ fontSize: 'var(--font-size-sm)' }}
                      >
                        View
                      </button>
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list — visible only below sm */}
          <div className="sm:hidden divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 flex flex-col gap-3">
                {/* Title + meta */}
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    {ticket.title}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }} className="mt-0.5">
                    {ticket.id} • {ticket.messages} messages
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="badge badge-completed">{ticket.category}</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${getPriorityColor(ticket.priority)}`} style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', letterSpacing: 'var(--letter-spacing-wide)' }}>
                    {ticket.priority}
                  </span>
                  <div className={getStatusColor(ticket.status)}>
                    {getStatusIcon(ticket.status)}
                    <span>{ticket.status}</span>
                  </div>
                </div>

                {/* Last updated */}
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Updated {formatDate(ticket.lastUpdated)}
                </div>

                {/* Full-width View button */}
                <button
                  onClick={() => toast.info('Opening ticket...')}
                  className="btn-outline w-full py-2.5"
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  View
                </button>
              </div>
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <EmptyState
              icon={MessageSquare}
              title="No tickets found"
              description="No support tickets match your current filters. Try adjusting your search or category filters."
            />
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowNewTicketModal(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="glass-card p-6 w-full max-w-[500px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Create New Ticket
              </h2>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1 hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Title <span className="text-[var(--color-primary)]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief description of your issue"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="input-base w-full px-4 py-3"
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Description <span className="text-[var(--color-primary)]">*</span>
                </label>
                <textarea
                  placeholder="Please provide detailed information about your issue..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="input-base w-full px-4 py-3 min-h-[120px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Category
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as Ticket['category'] })}
                    className="input-base w-full px-4 py-3"
                  >
                    <option value="General">General</option>
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="Campaign">Campaign</option>
                    <option value="Lead Quality">Lead Quality</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Priority
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as Ticket['priority'] })}
                    className="input-base w-full px-4 py-3"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="btn-outline px-4 py-2 flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTicket}
                className="btn-primary px-4 py-2 flex-1"
              >
                Submit Ticket
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AppLayout>
  );
}