import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faDollarSign, faClock, faTriangleExclamation, faPenToSquare, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { Subscription, Category } from '../types/Subscription';
import { formatCurrency, getDaysRemaining, categoryLabels } from '../utils/subscriptionUtils';
import { SubscriptionCard } from './SubscriptionCard';
import { useAppSettings } from '../hooks/useAppSettings';

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
  
  // Format as day, month and year with capitalized weekday
  const formattedDate = date.toLocaleDateString('fr-FR', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
  
  // Capitalize the first letter (weekday)
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
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
  onEdit?: (subscription: Subscription) => void;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  subscriptions, 
  searchQuery = '', 
  selectedCategories = new Set(), 
  selectedStatuses = new Set(),
  sortBy = 'nextBilling',
  sortDirection = 'asc',
  onEdit,
  onDelete,
  onCancel,
  onReactivate,
  onViewDetails
}) => {
  const settings = useAppSettings();

  // Default icon for any category
  const defaultCategoryIcon = '📱';

  // Use a function to get the icon instead of direct object access
  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      streaming: '🎬',
      cloud: '☁️',
      productivity: '💼',
      fitness: '🏋️',
      news: '📰',
      music: '🎵',
      gaming: '🎮',
      education: '📚',
      finance: '💰',
      television: '📺',
      videos_en_continu: '📺',
      musique_en_continu: '🎵'
    };
    
    return icons[category] || defaultCategoryIcon;
  };
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
    if (sortBy !== 'category') return null;
    
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

      {/* Subscriptions Cards */}
      <div className="space-y-4">
        {dateGroup.subscriptions.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            subscriptions={subscriptions}
            viewMode="list"
            isExpanded={true}
            onEdit={onEdit}
            onDelete={onDelete}
            onCancel={onCancel}
            onReactivate={onReactivate}
            onViewDetails={onViewDetails}
          />
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
      
      {/* Subscription Cards */}
      <div className="space-y-4">
        {payments.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            subscriptions={subscriptions}
            viewMode="list"
            isExpanded={true}
            onEdit={onEdit}
            onDelete={onDelete}
            onCancel={onCancel}
            onReactivate={onReactivate}
            onViewDetails={onViewDetails}
          />
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
      </div>
    );
  }

  return (
    <div>
      {sortBy === 'nextBilling' ? (
        // Vue calendrier par jour avec montants totaux
        <div className="space-y-6">
          {(upcomingPayments as { date: string; subscriptions: Subscription[]; totalAmount: number }[]).map((dateGroup) => (
            <div key={dateGroup.date} className="bg-gruvbox-bg0 rounded-xl shadow-sm">
              <div className="p-4">
                {/* En-tête du jour avec montant total */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-normal text-gruvbox-fg1">
                      {formatDate(dateGroup.date)}
                    </h3>
                    {getDaysRemaining(dateGroup.date) <= 1 && (
                      <FontAwesomeIcon icon={faTriangleExclamation} className={`w-4 h-4 ${getUrgencyColor(dateGroup.date)}`} />
                    )}
                  </div>
                  <span className="text-xl font-normal text-gruvbox-fg1">
                    {formatCurrency(dateGroup.totalAmount)}
                  </span>
                </div>

                {/* Ligne de séparation */}
                <div className="border-t border-gruvbox-bg2 mb-4"></div>

                {/* Liste des paiements du jour */}
                <div className="space-y-2">
                  {dateGroup.subscriptions.map((subscription) => (
                    <div key={subscription.id} className="flex items-center py-2 px-3 bg-gruvbox-bg1 rounded-lg hover:bg-gruvbox-bg2 transition-colors">
                      {/* Logo */}
                      <div className="flex-shrink-0 mr-3">
                        {settings.display.showLogos && subscription.logoUrl ? (
                          <img
                            src={subscription.logoUrl}
                            alt={`Logo ${subscription.name}`}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded flex items-center justify-center bg-gruvbox-bg2">
                            <span className="text-sm">{getCategoryIcon(subscription.category)}</span>
                          </div>
                        )}
                      </div>

                      {/* Nom et catégorie en colonnes */}
                      <div className="flex-1 grid grid-cols-2 gap-4 min-w-0">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gruvbox-fg1 truncate block">
                            {subscription.name}
                          </span>
                          {subscription.isTrialPeriod && (
                            <span className="text-xs text-gruvbox-blue-bright block">
                              Période d'essai
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm text-gruvbox-fg3 truncate block">
                            {categoryLabels[subscription.category]}
                          </span>
                        </div>
                      </div>

                      {/* Boutons d'action compacts avant le prix */}
                      <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEdit(subscription);
                            }}
                            className="p-1.5 text-gruvbox-fg3 hover:text-gruvbox-blue-bright rounded transition-colors focus:outline-none"
                            title="Éditer"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-3 h-3" />
                          </button>
                        )}
                        {onViewDetails && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onViewDetails(subscription.id);
                            }}
                            className="p-1.5 text-gruvbox-fg3 hover:text-gruvbox-green-bright rounded transition-colors focus:outline-none"
                            title="Voir détails"
                          >
                            <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Montant complètement à droite */}
                      <div className="flex-shrink-0 ml-2 text-right">
                        <span className="text-sm font-medium text-gruvbox-fg1">
                          {formatCurrency(subscription.amount, subscription.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortBy === 'category' && groupedPayments ? (
        // Vue avec diviseurs de catégorie
        <div className="space-y-6">
          {Object.entries(groupedPayments).map(([category, payments]) =>
            renderCategorySection(category, payments)
          )}
        </div>
      ) : (
        // Vue normale - liste simple
        <div className="space-y-4">
          {(upcomingPayments as Subscription[]).map((subscription) => (
            <div key={subscription.id} className="bg-gruvbox-bg0 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="font-normal text-gruvbox-fg1">
                    {formatDate(subscription.nextBilling)}
                  </h3>
                  {getDaysRemaining(subscription.nextBilling) <= 1 && (
                    <FontAwesomeIcon icon={faTriangleExclamation} className={`w-4 h-4 ${getUrgencyColor(subscription.nextBilling)}`} />
                  )}
                </div>
                <span className="text-lg font-normal text-gruvbox-fg1">
                  {formatCurrency(subscription.amount, subscription.currency)}
                </span>
              </div>

              <div className="border-t border-gruvbox-bg2 mb-3"></div>

              <div className="flex items-center justify-between py-2 px-3 bg-gruvbox-bg1 rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subscription.primaryColor || '#83a598' }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gruvbox-fg1 truncate">
                        {subscription.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gruvbox-fg3">
                        {categoryLabels[subscription.category]}
                      </span>
                      {subscription.isTrialPeriod && (
                        <span className="text-xs text-gruvbox-blue-bright">
                          Période d'essai
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-3">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit(subscription);
                      }}
                      className="p-1.5 text-gruvbox-fg3 hover:text-gruvbox-blue-bright rounded transition-colors focus:outline-none"
                      title="Éditer"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="w-3 h-3" />
                    </button>
                  )}
                  {onViewDetails && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onViewDetails(subscription.id);
                      }}
                      className="p-1.5 text-gruvbox-fg3 hover:text-gruvbox-green-bright rounded transition-colors focus:outline-none"
                      title="Voir détails"
                    >
                      <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
