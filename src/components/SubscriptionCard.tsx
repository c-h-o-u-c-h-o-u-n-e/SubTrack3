import React from 'react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSettings } from '../hooks/useAppSettings';
import { 
  faCalendarDays, 
  faDollarSign, 
  faPenToSquare, 
  faExternalLinkAlt, 
  faTrash,
  faTriangleExclamation,
  faClock,
  faCheckCircle,
  faXmark,
  faGlobe,
  faChevronDown,
  faChevronUp,
  faBan,
  faRotateRight
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from '../types/Subscription';
import { categoryLabels, frequencyDisplayLabels, formatCurrency, getDaysRemaining, calculateMonthlyAmount, formatDaysRemaining } from '../utils/subscriptionUtils';

const getPaymentMethodLabel = (paymentMethod: string) => {
  // Try to get from localStorage first (custom payment methods)
  try {
    const paymentMethodSettings = localStorage.getItem('paymentMethodSettings');
    if (paymentMethodSettings) {
      const settings = JSON.parse(paymentMethodSettings);
      if (settings[paymentMethod]) {
        return settings[paymentMethod].label;
      }
    }
  } catch (error) {
    console.error('Error loading payment method settings:', error);
  }
  
  // Fallback to default labels
  const defaultLabels: Record<string, string> = {
    cash: 'Argent comptant',
    credit_card: 'Carte de crédit',
    debit_card: 'Carte de débit',
    prepaid_card: 'Carte prépayée',
    crypto: 'Cryptomonnaie',
    digital_wallet: 'Portefeuille numérique',
    bank_transfer: 'Virement bancaire',
    check: 'Chèque'
  };
  
  return defaultLabels[paymentMethod] || paymentMethod;
};

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onCancel?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  subscriptions?: Subscription[];
  viewMode?: 'grid' | 'list';
  isExpanded?: boolean;
  onToggleExpanded?: (id: string) => void;
  columnIndex?: number;
}

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

const statusConfig = {
  active: {
    icon: faCheckCircle,
    color: 'text-gruvbox-green-bright',
    bg: 'bg-gruvbox-green bg-opacity-20',
    label: 'Actif'
  },
  trial: {
    icon: faClock,
    color: 'text-gruvbox-blue-bright',
    bg: 'bg-gruvbox-blue bg-opacity-20',
    label: 'Essai'
  },
  cancelled: {
    icon: faXmark,
    color: 'text-gruvbox-fg3',
    bg: 'bg-gruvbox-bg2',
    label: 'Résilié'
  }
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onEdit,
  onDelete,
  onCancel,
  onReactivate,
  onViewDetails,
  subscriptions = [],
  viewMode = 'grid',
  isExpanded = false,
  onToggleExpanded,
  columnIndex = 0
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const settings = useAppSettings();
  
  // Force expanded state for list view
  const shouldBeExpanded = viewMode === 'list' || isExpanded;
  
  const daysUntilNext = getDaysRemaining(subscription.nextBilling);
  const isUrgent = daysUntilNext <= 3 && daysUntilNext >= 0;
  const isOverdue = daysUntilNext < 0;
  
  const getUrgencyColor = () => {
    if (isOverdue) return 'text-gruvbox-red-bright';
    if (daysUntilNext <= 1) return 'text-gruvbox-red';
    if (daysUntilNext <= 3) return 'text-gruvbox-orange-bright';
    if (daysUntilNext <= 7) return 'text-gruvbox-yellow-bright';
    return 'text-gruvbox-fg2';
  };

  const getBorderColor = () => {
    if (isOverdue) return 'border-l-gruvbox-red-bright';
    if (daysUntilNext <= 1) return 'border-l-gruvbox-red';
    if (daysUntilNext <= 3) return 'border-l-gruvbox-orange-bright';
    if (daysUntilNext <= 7) return 'border-l-gruvbox-yellow-bright';
    return 'border-l-gruvbox-bg3';
  };

  // Calculate additional details
  const annualCost = calculateMonthlyAmount(subscription.amount, subscription.frequency) * 12;
  
  // Calculate rank by annual cost
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
  const sortedByAnnualCost = activeSubscriptions
    .map(sub => ({
      id: sub.id,
      annualCost: calculateMonthlyAmount(sub.amount, sub.frequency) * 12
    }))
    .sort((a, b) => b.annualCost - a.annualCost);
  
  const rank = sortedByAnnualCost.findIndex(sub => sub.id === subscription.id) + 1;
  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'er';
    return 'e';
  };

  const formatStartDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const StatusIcon = statusConfig[subscription.status].icon;

  // Get the primary color or fallback to default
  const primaryColor = subscription.primaryColor || '#83a598';

  // Function to determine if text should be light or dark based on background color
  const getTextColor = (hexColor: string) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return light or dark text based on luminance
    return luminance > 0.5 ? 'text-gruvbox-bg0' : 'text-gruvbox-fg0';
  };

  const textColor = getTextColor(primaryColor);

  const handleToggleExpanded = () => {
    if (viewMode === 'list') return; // No toggle in list view
    
    if (isExpanded && onToggleExpanded) {
      // Closing
      setIsAnimating(true);
      setAnimationClass('card-details-exit');
      
      setTimeout(() => {
        onToggleExpanded(subscription.id);
        setIsAnimating(false);
        setAnimationClass('');
      }, 300);
    } else if (onToggleExpanded) {
      // Opening
      onToggleExpanded(subscription.id);
      setIsAnimating(true);
      setAnimationClass('card-details-enter');
      
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationClass('');
      }, 400);
    }
  };

  return (
    <div 
      className={`subscription-card masonry-item bg-gruvbox-bg0 rounded-xl shadow-sm hover:shadow-md ${isExpanded ? 'shadow-lg' : ''}`}
      style={{
        transform: isExpanded ? 'translateZ(0)' : 'none',
        position: isExpanded ? 'relative' : 'static',
        zIndex: isExpanded ? 10 : 1
      }}
    >
      {/* Colored Header - Clickable for details */}
      <div 
        className={`p-4 rounded-t-xl relative ${onViewDetails ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        style={{ backgroundColor: primaryColor }}
        onClick={() => onViewDetails && onViewDetails(subscription.id)}
      >
        {/* Matte overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-t-xl"></div>
        
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 rounded-t-xl"
          style={{
            background: `linear-gradient(to right, rgba(22, 24, 25, 0.4) 0%, rgba(22, 24, 25, 0.6) 50%, rgba(22, 24, 25, 0.4) 100%)`,
            backgroundColor: "#f5d533"
          }}
        ></div>
        
        {/* Content */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Logo */}
            {settings.display.showLogos && (
              <div className="flex-shrink-0">
                {subscription.logoUrl ? (
                  <img
                    src={subscription.logoUrl}
                    alt={`Logo ${subscription.name}`}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{getCategoryIcon(subscription.category)}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Name and Category with Payment Delay */}
            <div className="min-w-0 flex-1 text-left pl-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-normal text-gruvbox-fg0">
                  {subscription.name}
                </h3>
                <span className={`text-md font-normal text-gruvbox-fg0 ${getUrgencyColor()}`}>
                  {formatDaysRemaining(subscription.nextBilling)}
                </span>
              </div>
              <p className="text-sm text-gruvbox-fg0 opacity-80 truncate whitespace-nowrap">
                {categoryLabels[subscription.category]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="card-content p-6 pb-4">
        {/* Price Section */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex flex-col">
            <div className="flex items-baseline space-x-2 mb-1">
            <span className="text-2xl font-normal text-gruvbox-fg0">
              {formatCurrency(subscription.amount, subscription.currency)}
            </span>
            <span className="text-sm text-gruvbox-fg3">
              / {frequencyDisplayLabels[subscription.frequency]}
            </span>
            </div>
            {/* Payment Method */}
            <div className="text-sm text-gruvbox-fg3 mt-1">
              {getPaymentMethodLabel(subscription.paymentMethod)}
            </div>
          </div>
          
          <div className="flex flex-col items-end relative">
            <div className="flex items-center space-x-2 mt-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(subscription);
                }}
                onMouseEnter={() => {
                  setHoveredAction('Éditer l\'abonnement');
                  setShowTooltip(true);
                }}
                onMouseLeave={() => {
                  setHoveredAction(null);
                  setShowTooltip(false);
                }}
                className="pr-2 text-gruvbox-fg3 hover:text-gruvbox-blue-bright rounded-lg transition-all duration-150 focus:outline-none"
              >
                <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
              </button>
              {onCancel && subscription.status !== 'cancelled' && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCancel(subscription.id);
                  }}
                  onMouseEnter={() => {
                    setHoveredAction('Résilier l\'abonnement');
                    setShowTooltip(true);
                  }}
                  onMouseLeave={() => {
                    setHoveredAction(null);
                    setShowTooltip(false);
                  }}
                  className="text-gruvbox-fg3 hover:text-gruvbox-yellow-bright rounded-lg transition-all duration-150 focus:outline-none"
                >
                  <FontAwesomeIcon icon={faBan} className="pr-2 w-4 h-4" />
                </button>
              )}
              {onReactivate && subscription.status === 'cancelled' && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onReactivate(subscription.id);
                  }}
                  onMouseEnter={() => {
                    setHoveredAction('Réactiver l\'abonnement');
                    setShowTooltip(true);
                  }}
                  onMouseLeave={() => {
                    setHoveredAction(null);
                    setShowTooltip(false);
                  }}
                  className="text-gruvbox-fg3 hover:text-gruvbox-green-bright rounded-lg transition-all duration-150 focus:outline-none"
                >
                  <FontAwesomeIcon icon={faRotateRight} className="pr-2 w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(subscription.id);
                }}
                onMouseEnter={() => {
                  setHoveredAction('Supprimer l\'abonnement');
                  setShowTooltip(true);
                }}
                onMouseLeave={() => {
                  setHoveredAction(null);
                  setShowTooltip(false);
                }}
                className="px-0 text-gruvbox-fg3 hover:text-gruvbox-red-bright rounded-lg transition-all duration-150 focus:outline-none"
              >
                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
              </button>
            </div>
            {/* Action Description - positioned absolutely to not affect layout */}
            {hoveredAction && (
              <div className={`absolute top-full right-0 mt-2.5 transition-all duration-300 ease-out ${
                showTooltip ? 'opacity-100 animate-in' : 'opacity-0'
              }`}>
                <span className={`text-sm transition-colors duration-300 whitespace-nowrap ${
                  hoveredAction === 'Éditer l\'abonnement' ? 'text-gruvbox-blue-bright' :
                  hoveredAction === 'Résilier l\'abonnement' ? 'text-gruvbox-yellow-bright' :
                  hoveredAction === 'Réactiver l\'abonnement' ? 'text-gruvbox-green-bright' :
                  hoveredAction === 'Supprimer l\'abonnement' ? 'text-gruvbox-red-bright' :
                  'text-gruvbox-fg2'
                }`}>
                  {hoveredAction}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end items-center mt-3">
          {/* Voir plus de détails button - only in grid mode */}
          {viewMode === 'grid' && (
            <button
              onClick={handleToggleExpanded}
              className="flex items-center space-x-2 text-sm text-gruvbox-fg3 hover:text-gruvbox-blue-bright transition-colors focus:outline-none"
            >
              <span>Voir plus de détails</span>
              {(isExpanded || isAnimating) ? (
                <FontAwesomeIcon icon={faChevronUp} className="w-4 h-4" />
              ) : (
                <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details Section */}
      {(shouldBeExpanded || isAnimating) && (
        <div className={`card-details px-6 pb-6 space-y-4 ${animationClass}`}>
          {/* Separator */}
          <div className="border-t border-gruvbox-bg2"></div>

          {/* Trial Period Info */}
          {subscription.isTrialPeriod && subscription.trialEndDate && (
            <div className="flex items-center justify-between opacity-50">
              <span className="text-sm text-gruvbox-fg2">Fin de la période d'essai</span>
              <span className="text-sm font-normal text-gruvbox-blue-bright">
                Dans {Math.max(0, Math.ceil((new Date(subscription.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} jours
              </span>
            </div>
          )}

          {/* Next Billing Info */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gruvbox-fg2">Prochain prélèvement</span>
            <span className="text-sm font-normal text-gruvbox-fg1">
              {isOverdue ? `En retard de ${formatDaysRemaining(subscription.nextBilling)}` :
               daysUntilNext === 0 ? 'Aujourd\'hui' :
               daysUntilNext === 1 ? 'Demain' :
               `Dans ${formatDaysRemaining(subscription.nextBilling)}`}
            </span>
          </div>

          {/* Date d'abonnement */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gruvbox-fg2">Date d'abonnement</span>
            <span className="text-sm font-normal text-gruvbox-fg1">
              {formatStartDate(subscription.startDate)}
            </span>
          </div>

          {/* Coût annuel */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gruvbox-fg2">Coût annuel</span>
            <span className="text-sm font-normal text-gruvbox-fg1">
              {formatCurrency(annualCost)}
            </span>
          </div>

          {/* Palmarès de coût annuel */}
          {activeSubscriptions.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gruvbox-fg2">Palmarès de coût annuel</span>
              <span className="text-sm font-normal text-gruvbox-fg1">
                {rank}{getRankSuffix(rank)} sur {activeSubscriptions.length}
              </span>
            </div>
          )}

          {/* Site du fournisseur */}
          {subscription.url ? (
            <a
              href={subscription.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between transition-colors group"
            >
              <span className="text-sm text-gruvbox-fg2 group-hover:text-gruvbox-blue-bright transition-colors">
                Site du fournisseur
              </span>
              <FontAwesomeIcon icon={faExternalLinkAlt} className="w-4 h-4 text-gruvbox-fg4 group-hover:text-gruvbox-blue-bright transition-colors" />
            </a>
          ) : (
            <div className="flex items-center justify-between opacity-50">
              <span className="text-sm text-gruvbox-fg3">Aucun site web</span>
            </div>
          )}

          {/* Commentaires additionnels */}
          {subscription.notes && (
            <>
              <div className="border-t border-gruvbox-bg2"></div>
              <div>
                <p className="text-sm text-gruvbox-fg2">{subscription.notes}</p>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
};
