import { motion } from 'motion/react';
import { Calendar, TrendingUp, Clock, CheckCircle2, Package } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfWeek, endOfWeek, isSameDay, addDays, differenceInDays } from 'date-fns';
import type { Campaign } from '../data/mockClients';

interface DeliveryScheduleSectionProps {
  campaign: Campaign;
  /**
   * Renders without its own card chrome, heading and overall-progress bar —
   * used when this sits inside the campaign analytics tabs, where the card is
   * already provided and the progress figure is in the KPI band above.
   */
  bare?: boolean;
}

export function DeliveryScheduleSection({ campaign, bare = false }: DeliveryScheduleSectionProps) {
  // Don't render if missing required data
  if (!campaign.deliverySchedule || !campaign.goalLeads || !campaign.deliveredLeads) {
    return null;
  }

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

  // Filter deliveries for this week
  const thisWeeksDeliveries = campaign.deliverySchedule.filter(delivery => {
    const deliveryDate = parseISO(delivery.date);
    return isAfter(deliveryDate, weekStart) && isBefore(deliveryDate, weekEnd) || isSameDay(deliveryDate, weekStart) || isSameDay(deliveryDate, weekEnd);
  });

  // Filter upcoming deliveries (future only)
  const upcomingDeliveries = campaign.deliverySchedule
    .filter(delivery => {
      const deliveryDate = parseISO(delivery.date);
      return isAfter(deliveryDate, today) || isSameDay(deliveryDate, today);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4); // Show next 4 deliveries

  // Calculate progress
  const progressPercentage = Math.round((campaign.deliveredLeads / campaign.goalLeads) * 100);
  const remainingLeads = campaign.goalLeads - campaign.deliveredLeads;

  // Format date helper
  const formatDeliveryDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  // Get relative date label
  const getRelativeDateLabel = (dateStr: string) => {
    const deliveryDate = parseISO(dateStr);
    const diffDays = differenceInDays(deliveryDate, today);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    return null;
  };

  return (
    <motion.div
      className={bare ? '' : 'glass-card p-6 mt-6'}
      initial={{ opacity: 0, y: bare ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={`flex items-center justify-between ${bare ? 'mb-4' : 'mb-6'}`}>
        {bare ? (
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Delivering every {campaign.deliveryDays?.join(', ')}
          </span>
        ) : (
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Delivery Schedule & Progress
          </h2>
        )}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          {!bare && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              {campaign.deliveryDays?.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar — hidden in `bare` mode, where the KPI band already
          carries this exact percentage. */}
      <div className={bare ? 'hidden' : 'mb-6'}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
            Overall Progress
          </span>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)' }}>
            {progressPercentage}%
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--color-primary)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {campaign.deliveredLeads.toLocaleString()} delivered
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {remainingLeads.toLocaleString()} remaining of {campaign.goalLeads.toLocaleString()}
          </span>
        </div>
      </div>

      {/* This Week's Schedule */}
      {thisWeeksDeliveries.length > 0 && (
        <div className="mb-6">
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            This Week's Schedule
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              ({format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')})
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {thisWeeksDeliveries.map((delivery, index) => {
              const relativeLabel = getRelativeDateLabel(delivery.date);
              const isCompleted = delivery.status === 'completed';
              
              return (
                <motion.div
                  key={index}
                  className="p-4 rounded-lg border"
                  style={{ 
                    borderColor: isCompleted ? 'var(--color-success)' : 'var(--color-border)',
                    background: isCompleted ? 'var(--color-success-bg)' : 'var(--color-bg-secondary)'
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                        {delivery.dayOfWeek}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {format(parseISO(delivery.date), 'MMM d')}
                      </div>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <Package className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                    {delivery.leadsDelivered.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    leads {isCompleted ? 'delivered' : 'scheduled'}
                  </div>
                  {relativeLabel && (
                    <div className="mt-2 inline-block px-2 py-1 rounded-full" style={{ background: 'var(--color-primary-tint)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-primary)' }}>
                      {relativeLabel}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Deliveries */}
      {upcomingDeliveries.length > 0 && (
        <div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            Upcoming Deliveries
          </h3>
          <div className={bare ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5' : 'space-y-3'}>
            {upcomingDeliveries.map((delivery, index) => {
              const relativeLabel = getRelativeDateLabel(delivery.date);
              const isNext = index === 0;
              
              return (
                <motion.div
                  key={index}
                  className={`flex items-center justify-between rounded-lg ${bare ? 'p-2.5' : 'p-4'}`}
                  style={{
                    background: isNext ? 'var(--color-primary-tint)' : 'var(--color-bg-secondary)',
                    border: isNext ? '1px solid var(--color-primary)' : '1px solid var(--color-border)'
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${bare ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center`} style={{ background: isNext ? 'var(--color-primary)' : 'var(--color-bg-tertiary)' }}>
                      <Calendar className={bare ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: isNext ? 'white' : 'var(--color-text-secondary)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                        {formatDeliveryDate(delivery.date)}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {delivery.dayOfWeek}
                        {relativeLabel && ` • ${relativeLabel}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                      {delivery.leadsDelivered.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      leads
                    </div>
                  </div>
                  {isNext && (
                    <div className="ml-3 px-3 py-1 rounded-full" style={{ background: 'var(--color-primary)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'white' }}>
                      Next
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Timeline */}
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-4">
          Full Delivery Timeline
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {campaign.deliverySchedule.map((delivery, index) => {
            const isCompleted = delivery.status === 'completed';
            const deliveryDate = parseISO(delivery.date);
            const isPast = isBefore(deliveryDate, today);
            
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: isCompleted ? 'var(--color-success)' : isPast ? 'var(--color-text-muted)' : 'var(--color-primary)' }} />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                      {formatDeliveryDate(delivery.date)}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }} className="ml-2">
                      ({delivery.dayOfWeek})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                      {delivery.leadsDelivered.toLocaleString()} leads
                    </span>
                    <span className={`px-2 py-1 rounded text-xs`} style={{ 
                      background: isCompleted ? 'var(--color-success-bg)' : 'var(--color-info-bg)',
                      color: isCompleted ? 'var(--color-success)' : 'var(--color-info)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      {isCompleted ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
