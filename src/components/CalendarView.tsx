import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faDollarSign, faClock, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Subscription, Category } from '../types/Subscription';
import { formatCurrency, getDaysRemaining, categoryLabels } from '../utils/subscriptionUtils';

// Helper function to format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return "Aujourd'hui";
  }
  
  // Check if it's tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Demain";
  }
  
  // Format as day and month
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long' 
  });
};

// Helper function to get urgency color based on days remaining
const getUrgencyColor = (dateString: string): string => {
  const daysRemaining = getDaysRemaining(dateString);
  if (daysRemaining === 0) return 'text-red-500';
  if (daysRemaining === 1) return 'text-orange-500';
  return 'text-yellow-500';
};

interface CalendarViewProps {
  subscriptions: Subscription[];
  searchQuery?: string;
  selectedCategories?: Set<Category>;
  selectedStatuses?: Set<'active' | 'trial' | 'cancelled'>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

interface DayPayment {
  date: string;
  subscriptions: Subscription[];
  totalAmount: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  subscriptions, 
  searchQuery = '', 
  selectedCategories = new Set(), 
  selectedStatuses = new Set(),
  sortBy = 'nextBilling',
  sortDirection = 'asc'
}) => {
  const upcomingPayments = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Apply filters first
    const filteredSubscriptions = subscriptions.filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           categoryLabels[sub.category].toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(sub.category);
      const matchesStatus = selectedStatuses.size === 0 || 
                            selectedStatuses.has(sub.status) || 
                            (selectedStatuses.has('trial') && sub.isTrialPeriod);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });


    if (sortBy === 'nextBilling') {
      // For date sorting, group by date
      const groupedByDate: Record<string, Subscription[]> = {};
      
      filteredSubscriptions.forEach(sub => {
        const billingDate = new Date(sub.nextBilling);
        if (billingDate >= today && billingDate <= thirtyDaysFromNow) {
          const dateKey = sub.nextBilling;
          if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
          }
          groupedByDate[dateKey].push(sub);
        }
      });

      // Convert to array and sort by date
      const dateGroups = Object.entries(groupedByDate)
        .map(([date, subs]) => ({
          date,
          subscriptions: subs.sort((a, b) => a.name.localeCompare(b.name)),
          totalAmount: subs.reduce((sum, sub) => sum + sub.amount, 0)
        }))
        .sort((a, b) => {
          const comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          return sortDirection === 'asc' ? comparison : -comparison;
        });

      return dateGroups;
    } else {
      // For other sorting, create individual payment items
      let individualPayments: (Subscription & { category?: string })[] = [];
      
      filteredSubscriptions.forEach(sub => {
        const billingDate = new Date(sub.nextBilling);
        if (billingDate >= today && billingDate <= thirtyDaysFromNow) {
          if (sortBy === 'category') {
            individualPayments.push({ ...sub, category: sub.category });
          } else {
            individualPayments.push(sub);
          }
        }
      });

      // Sort individual payments
      individualPayments.sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'category') {
          // Sort by category first, then by date
          const categoryComparison = categoryLabels[a.category!].localeCompare(categoryLabels[b.category!]);
          if (categoryComparison !== 0) {
            comparison = categoryComparison;
          } else {
            comparison = new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime();
          }
        } else {
          switch (sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'amount':
              comparison = a.amount - b.amount;
              break;
            default:
              comparison = 0;
          }
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });

      return individualPayments;
    }
  }, [subscriptions, searchQuery, selectedCategories, selectedStatuses, sortBy, sortDirection]);

  // Group payments by category for display when sorting by category
  const groupedPayments = useMemo(() => {
    if (sortBy !== 'category' || sortBy === 'nextBilling') return null;
    
    const grouped: Record<string, Subscription[]> = {};
    (upcomingPayments as Subscription[]).forEach(payment => {
      const category = payment.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(payment);
    });
    
    return grouped;
  }, [upcomingPayments, sortBy]);

  const renderIndividualPaymentCard = (subscription: Subscription) => (
    <div
      key={subscription.id}
      className="bg-gruvbox-bg0 rounded-xl shadow-sm"
    >
      <div className="p-4">
        {/* Date Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-normal text-gruvbox-fg1">
              {formatDate(subscription.nextBilling)}
            </h3>
            {getDaysRemaining(subscription.nextBilling) <= 1 && (
              <FontAwesomeIcon icon={faTriangleExclamation} className={`w-4 h-4 ${getUrgencyColor(subscription.nextBilling)}`} />
            )}
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-gruvbox-bg2 mb-32"></div>

        {/* Subscription Info */}
        <div className="flex items-center justify-between py-2 bg-transparent rounded-lg">
          <div className="flex items-center space-x-3">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: subscription.primaryColor || '#83a598' }}
            ></div>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-gruvbox-fg1 min-w-0 flex-shrink-0" style={{ width: '200px' }}>
                {subscription.name}
              </span>
              {subscription.isTrialPeriod && (
                <span className="text-sm text-gruvbox-fg3 flex-shrink-0">
                  Fin de la période d'essai
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-sm font-normal text-gruvbox-fg2">
              {formatCurrency(subscription.amount, subscription.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGroupedPaymentCard = (dateGroup: { date: string; subscriptions: Subscription[]; totalAmount: number }) => (
    <div key={dateGroup.date} className="mb-6">
      {/* Date Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="font-normal text-gruvbox-fg1">
            {formatDate(dateGroup.date)}
          </h3>
          {getDaysRemaining(dateGroup.date) <= 1 && (
            <FontAwesomeIcon icon={faTriangleExclamation} className={`w-4 h-4 ${getUrgencyColor(dateGroup.date)}`} />
          )}
        </div>
        <span className="text-sm font-normal text-gruvbox-fg2">
          {formatCurrency(dateGroup.totalAmount)}
        </span>
      </div>

      {/* Ligne de séparation */}
      <div className="border-t border-gruvbox-bg3 mb-3"></div>

      {/* Subscriptions List */}
      <div className="space-y-2">
        {dateGroup.subscriptions.map((subscription) => (
          <div key={subscription.id} className="flex items-center justify-between py-2 bg-transparent rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: subscription.primaryColor || '#83a598' }}
              ></div>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-gruvbox-fg1 min-w-0 flex-shrink-0" style={{ width: '200px' }}>
                  {subscription.name}
                </span>
                {subscription.isTrialPeriod && (
                  <span className="text-sm text-gruvbox-fg3 flex-shrink-0 mr-16">
                    Fin de la période d'essai
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-sm text-gruvbox-fg2">{formatCurrency(subscription.amount, subscription.currency)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategorySection = (category: string, payments: Subscription[]) => (
    <div key={category} className="mb-8">
      {/* Diviseur de catégorie */}
      <div className="flex items-center mb-6">
        <hr className="w-1/12 border-gruvbox-bg3" />
        <h3 className="text-lg font-normal text-gruvbox-fg1 px-4">
          {categoryLabels[category as keyof typeof categoryLabels]}
        </h3>
        <hr className="flex-1 border-gruvbox-bg3" />
      </div>
      
      {/* Paiements de la catégorie */}
      <div className="space-y-4">
        {payments.map((subscription) => (
          <div
            key={subscription.id}
            className="bg-gruvbox-bg0 rounded-xl shadow-sm"
          >
            <div className="p-4">
              {/* Date Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="font-normal text-gruvbox-fg1">
                    {formatDate(subscription.nextBilling)}
                  </h3>
                  {getDaysRemaining(subscription.nextBilling) <= 1 && (
                    <FontAwesomeIcon icon={faTriangleExclamation} className={`w-4 h-4 ${getUrgencyColor(subscription.nextBilling)}`} />
                  )}
                </div>
              </div>

              {/* Ligne de séparation */}
              <div className="border-t border-gruvbox-bg2 mb-3"></div>

              {/* Subscription Info */}
              <div className="flex items-center justify-between py-2 bg-transparent rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: subscription.primaryColor || '#83a598' }}
                  ></div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm text-gruvbox-fg1 min-w-0 flex-shrink-0" style={{ width: '200px' }}>
                      {subscription.name}
                    </span>
                    {subscription.isTrialPeriod && (
                      <span className="text-sm text-gruvbox-fg3 flex-shrink-0 mr-16">
                        Fin de la période d'essai
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-sm text-gruvbox-fg2">{formatCurrency(subscription.amount, subscription.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!upcomingPayments || upcomingPayments.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="w-16 h-16 bg-gruvbox-bg1 rounded-full flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faCalendarDays} className="w-8 h-8 text-gruvbox-fg4" />
        </div>
        <h3 className="text-lg font-normal text-gruvbox-fg1 mb-2">
          Aucun abonnement trouvé
        </h3>
        <p className="text-gruvbox-fg3 mb-6">
          Créez votre premier abonnement pour commencer
        </p>
      </div>
    );
  }

  return (
    <div>
        {sortBy === 'nextBilling' ? (
          // Vue groupée par date
          <div className="space-y-4">
            {(upcomingPayments as { date: string; subscriptions: Subscription[]; totalAmount: number }[]).map(renderGroupedPaymentCard)}
          </div>
        ) : sortBy === 'category' && groupedPayments ? (
          // Vue avec diviseurs de catégorie
          <div className="space-y-6">
            {Object.entries(groupedPayments).map(([category, payments]) =>
              renderCategorySection(category, payments)
            )}
          </div>
        ) : (
          // Vue normale
          <div className="space-y-4">
            {(upcomingPayments as Subscription[]).map((subscription) => (
              <div key={subscription.id} className="mb-6">
                {/* Date Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-normal text-gruvbox-fg1">
                      {formatDate(subscription.nextBilling)}
                    </h3>
                    {getDaysRemaining(subscription.nextBilling) <= 1 && (
                      <FontAwesomeIcon icon={faTriangleExclamation} className={`w-4 h-4 ${getUrgencyColor(subscription.nextBilling)}`} />
                    )}
                  </div>
                </div>

                {/* Ligne de séparation */}
                <div className="border-t border-gruvbox-bg3 mb-3"></div>

                {/* Subscription Info */}
                <div className="flex items-center justify-between py-2 bg-transparent rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: subscription.primaryColor || '#83a598' }}
                    ></div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm text-gruvbox-fg1 min-w-0 flex-shrink-0" style={{ width: '200px' }}>
                        {subscription.name}
                      </span>
                      {subscription.isTrialPeriod && (
                        <span className="text-sm text-gruvbox-fg3 flex-shrink-0 mr-16">
                          Fin de la période d'essai
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-sm font-normal text-gruvbox-fg2">
                      {formatCurrency(subscription.amount, subscription.currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};
