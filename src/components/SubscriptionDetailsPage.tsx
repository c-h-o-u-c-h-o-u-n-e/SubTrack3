import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faCalendarDays, 
  faDollarSign, 
  faExternalLinkAlt,
  faCheckCircle,
  faClock,
  faXmark,
  faChartLine,
  faTag,
  faCreditCard,
  faGlobe,
  faImage,
  faComment,
  faRotateRight,
  faBan,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from '../types/Subscription';
import { 
  categoryLabels, 
  frequencyDisplayLabels, 
  formatCurrency, 
  calculateMonthlyAmount 
} from '../utils/subscriptionUtils';
import { getPaymentMethodLabels } from '../utils/paymentMethodUtils';
import { useAppSettings } from '../hooks/useAppSettings';

interface SubscriptionDetailsPageProps {
  subscription: Subscription | null;
  subscriptions: Subscription[];
  onClose: () => void;
  isVisible: boolean;
}


const statusConfig = {
  active: {
    icon: faCheckCircle,
    color: 'text-gruvbox-green-bright',
    label: 'Abonnement actif'
  },
  trial: {
    icon: faClock,
    color: 'text-gruvbox-blue-bright',
    label: "'Période d'essai en cours'"
  },
  cancelled: {
    icon: faXmark,
    color: 'text-gruvbox-fg3',
    label: 'Abonnement résilié'
  }
};

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

// Type for subscription history events
interface SubscriptionEvent {
  id: string;
  date: string;
  type: string;
  description: string;
  icon: any;
  color: string;
}

export const SubscriptionDetailsPage: React.FC<SubscriptionDetailsPageProps> = ({ 
  subscription,
  subscriptions,
  onClose,
  isVisible
}) => {
  const settings = useAppSettings();
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [activeSection, setActiveSection] = useState('details');
  
  const sections = [
    { id: 'details', label: 'Détails', icon: faTag, color: 'text-gruvbox-purple-bright' },
    { id: 'history', label: 'Historique', icon: faHistory, color: 'text-gruvbox-orange-bright' }
  ];
  
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };
  
  // Animation effect - Prevent background scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      // Always ensure body is scrollable when component unmounts
      document.body.classList.remove('modal-open');
    };
  }, [isVisible]);
  
    // Generate history events when subscription changes
  useEffect(() => {
    if (!subscription) return;
    
    // Generate history events
    const historyEvents: SubscriptionEvent[] = [];
    
    // Subscription creation
    historyEvents.push({
      id: `creation-${subscription.id}`,
      date: subscription.createdAt || subscription.startDate,
      type: 'creation',
      description: 'Date d\'abonnement',
      icon: faCalendarDays,
      color: 'text-gruvbox-blue-bright'
    });
    
    // Trial period events
    if (subscription.isTrialPeriod) {
      historyEvents.push({
        id: `trial-start-${subscription.id}`,
        date: subscription.startDate,
        type: 'trial_start',
        description: 'Début de la période d\'essai',
        icon: faClock,
        color: 'text-gruvbox-blue-bright'
      });
      
      if (subscription.trialEndDate) {
        historyEvents.push({
          id: `trial-end-${subscription.id}`,
          date: subscription.trialEndDate,
          type: 'trial_end',
          description: 'Fin de la période d\'essai',
          icon: faClock,
          color: 'text-gruvbox-blue-bright'
        });
      }
    }
    
    // Cancellation event
    if (subscription.status === 'cancelled') {
      historyEvents.push({
        id: `cancel-${subscription.id}`,
        date: subscription.updatedAt || new Date().toISOString(),
        type: 'cancellation',
        description: 'Résiliation d\'abonnement',
        icon: faBan,
        color: 'text-gruvbox-red-bright'
      });
      
      // End of subscription (next billing date for cancelled subscriptions)
      historyEvents.push({
        id: `end-${subscription.id}`,
        date: subscription.nextBilling,
        type: 'end',
        description: 'Fin d\'abonnement',
        icon: faXmark,
        color: 'text-gruvbox-red-bright'
      });
    }
    
    // Reactivation event
    if (subscription.reactivatedAt) {
      historyEvents.push({
        id: `reactivation-${subscription.id}`,
        date: subscription.reactivatedAt,
        type: 'reactivation',
        description: 'Réactivation d\'abonnement',
        icon: faRotateRight,
        color: 'text-gruvbox-green-bright'
      });
    }
    
    // Payment method assignment (only after creation)
    if (subscription.paymentMethod && subscription.paymentMethodUpdatedAt) {
      historyEvents.push({
        id: `payment-method-${subscription.id}`,
        date: subscription.paymentMethodUpdatedAt,
        type: 'payment_method_assignment',
        description: 'Mode de paiement assigné',
        icon: faCreditCard,
        color: 'text-gruvbox-purple-bright'
      });
    }
    
    // Payment method modification
    if (subscription.paymentMethodUpdatedAt) {
      historyEvents.push({
        id: `payment-method-update-${subscription.id}`,
        date: subscription.paymentMethodUpdatedAt,
        type: 'payment_method_update',
        description: 'Mode de paiement modifié',
        icon: faCreditCard,
        color: 'text-gruvbox-purple-bright'
      });
    }
    
    // Payment history
    if (subscription.paymentHistory && Array.isArray(subscription.paymentHistory)) {
      subscription.paymentHistory.forEach((payment) => {
        if (payment.status === 'confirmed') {
          historyEvents.push({
            id: `payment-${payment.id}`,
            date: payment.paymentDate,
            type: 'payment',
            description: 'Paiement effectué',
            icon: faDollarSign,
            color: 'text-gruvbox-green-bright'
          });
        }
      });
    }
    
    // Payment frequency modification
    if (subscription.frequencyUpdatedAt) {
      historyEvents.push({
        id: `frequency-update-${subscription.id}`,
        date: subscription.frequencyUpdatedAt,
        type: 'frequency_update',
        description: 'Fréquence de paiement modifiée',
        icon: faCalendarDays,
        color: 'text-gruvbox-aqua-bright'
      });
    }
    
    // URL added
    if (subscription.url && subscription.urlUpdatedAt) {
      historyEvents.push({
        id: `url-add-${subscription.id}`,
        date: subscription.urlUpdatedAt,
        type: 'url_add',
        description: 'URL de fournisseur ajouté',
        icon: faGlobe,
        color: 'text-gruvbox-blue-bright'
      });
    }
    
    // URL modification
    if (subscription.urlUpdatedAt) {
      historyEvents.push({
        id: `url-update-${subscription.id}`,
        date: subscription.urlUpdatedAt,
        type: 'url_update',
        description: 'URL de fournisseur modifié',
        icon: faGlobe,
        color: 'text-gruvbox-blue-bright'
      });
    }
    
    // Logo added
    if (subscription.logoUrl && subscription.logoUpdatedAt) {
      historyEvents.push({
        id: `logo-add-${subscription.id}`,
        date: subscription.logoUpdatedAt,
        type: 'logo_add',
        description: 'Logo de fournisseur ajouté',
        icon: faImage,
        color: 'text-gruvbox-yellow-bright'
      });
    }
    
    // Logo modification
    if (subscription.logoUpdatedAt) {
      historyEvents.push({
        id: `logo-update-${subscription.id}`,
        date: subscription.logoUpdatedAt,
        type: 'logo_update',
        description: 'Logo de fournisseur modifié',
        icon: faImage,
        color: 'text-gruvbox-yellow-bright'
      });
    }
    
    // Category modification
    if (subscription.categoryUpdatedAt) {
      historyEvents.push({
        id: `category-update-${subscription.id}`,
        date: subscription.categoryUpdatedAt,
        type: 'category_update',
        description: 'Catégorie de l\'abonnement modifiée',
        icon: faTag,
        color: 'text-gruvbox-orange-bright'
      });
    }
    
    // Amount modification
    if (subscription.amountUpdatedAt) {
      historyEvents.push({
        id: `amount-update-${subscription.id}`,
        date: subscription.amountUpdatedAt,
        type: 'amount_update',
        description: 'Tarif de l\'abonnement modifié',
        icon: faDollarSign,
        color: 'text-gruvbox-green-bright'
      });
    }
    
    // Start date modification
    if (subscription.startDateUpdatedAt) {
      historyEvents.push({
        id: `start-date-update-${subscription.id}`,
        date: subscription.startDateUpdatedAt,
        type: 'start_date_update',
        description: 'Date d\'abonnement modifiée',
        icon: faCalendarDays,
        color: 'text-gruvbox-blue-bright'
      });
    }
    
    // Next billing date modification
    if (subscription.nextBillingUpdatedAt) {
      historyEvents.push({
        id: `next-billing-update-${subscription.id}`,
        date: subscription.nextBillingUpdatedAt,
        type: 'next_billing_update',
        description: 'Date de prochain paiement modifiée',
        icon: faCalendarDays,
        color: 'text-gruvbox-yellow-bright'
      });
    }
    
    // Notes added
    if (subscription.notes) {
      historyEvents.push({
        id: `notes-${subscription.id}`,
        date: subscription.createdAt || subscription.startDate,
        type: 'notes_add',
        description: 'Commentaires ajoutés',
        icon: faComment,
        color: 'text-gruvbox-fg2'
      });
    }
    
    // Sort events by date (most recent first)
    historyEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setEvents(historyEvents);
  }, [subscription]);
  
  if (!subscription) {
    return null;
  }
  
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
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
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
  const StatusIcon = statusConfig[subscription.status].icon;
  
  const handleClose = () => {
    // Ensure body is scrollable before closing
    document.body.style.overflow = '';
    onClose();
  };
  
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />
      
      {/* Slide-in panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-3/5 lg:w-1/2 xl:w-2/5 bg-gruvbox-bg0 text-gruvbox-fg1 shadow-xl z-50 transition-transform duration-300 transform ${
          isVisible ? 'translate-x-0' : 'translate-x-[100%]'
        } flex flex-col modal-container`}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b border-gruvbox-bg1 relative"
          style={{ backgroundColor: primaryColor }}
        >
          {/* Matte overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          
          {/* Gradient overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, rgba(22, 24, 25, 0.4) 0%, rgba(22, 24, 25, 0.6) 50%, rgba(22, 24, 25, 0.4) 100%)`
            }}
          ></div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <FontAwesomeIcon icon={faHistory} className="w-5 h-5 text-gruvbox-fg0" />
            <h2 className="text-xl font-normal text-gruvbox-fg0">Détails de l'abonnement</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gruvbox-fg0 hover:text-gruvbox-fg1 transition-colors focus:outline-none relative z-10"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Subscription Header */}
          <div className="p-6 border-b border-gruvbox-bg2">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              {settings.display.showLogos && (
                <div className="flex-shrink-0">
                  {subscription.logoUrl ? (
                    <img
                      src={subscription.logoUrl}
                      alt={`Logo ${subscription.name}`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center">
                      <span className="text-3xl">{getCategoryIcon(subscription.category)}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Name and Category with Status */}
              <div className="min-w-0 flex-1 text-left pl-1">
                {/* Name and Price */}
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-normal text-gruvbox-fg0">
                    {subscription.name}
                  </h1>
                  
                  {/* Amount and Frequency - Only for active subscriptions */}
                  {subscription.status === 'active' && (
                    <span className="text-xl font-normal text-gruvbox-fg0">
                      {formatCurrency(subscription.amount, subscription.currency)} / {frequencyDisplayLabels[subscription.frequency]}
                    </span>
                  )}
                </div>
                
                {/* Category and Status */}
                <div className="flex items-center justify-between mt-1">
                  <p className="text-md text-gruvbox-fg2">
                    {categoryLabels[subscription.category]}
                  </p>
                  
                  {/* Status Badge */}
                  <div className="flex items-center space-x-2">
                    <span className={`text-md ${statusConfig[subscription.status].color}`}>
                      {statusConfig[subscription.status].label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content with Tabs */}
          <div className="flex flex-1 overflow-hidden">
            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
              {/* Details Section */}
              {activeSection === 'details' && (
                <div className="space-y-6">
                  <div className="bg-gruvbox-bg1 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center mb-6">
                        <hr className="w-1/12 border-gruvbox-bg3" />
                        <h2 className="text-lg font-normal text-gruvbox-fg1 px-4">Détails de l'abonnement</h2>
                        <hr className="flex-1 border-gruvbox-bg3" />
                      </div>
                    
                    <div className="space-y-3">
                      
                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gruvbox-fg2">Tarif</span>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-sm font-normal text-gruvbox-fg0">
                            {formatCurrency(subscription.amount, subscription.currency)}
                          </span>
                          <span className="text-sm text-gruvbox-fg3">
                            / {frequencyDisplayLabels[subscription.frequency]}
                          </span>
                        </div>
                      </div>
                      
                      {/* Annual Cost */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gruvbox-fg2">Coût annuel</span>
                        <span className="text-sm text-gruvbox-fg1">
                          {formatCurrency(annualCost)}
                        </span>
                      </div>
                      
                      {/* Ranking */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gruvbox-fg2">Palmarès de côut annuel</span>
                        <span className="text-sm text-gruvbox-fg1">
                          {activeSubscriptions.length > 1 
                            ? `${rank}${getRankSuffix(rank)} sur ${activeSubscriptions.length}` 
                            : "N/A"}
                        </span>
                      </div>
                      
                      {/* Payment Method */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gruvbox-fg2">Mode de paiement</span>
                        <span className="text-sm text-gruvbox-fg1">
                          {getPaymentMethodLabels()[subscription.paymentMethod] || subscription.paymentMethod}
                        </span>
                      </div>
                      
                      {/* Provider URL */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gruvbox-fg2">URL du fournisseur</span>
                        {subscription.url ? (
                          <a
                            href={subscription.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gruvbox-blue-bright hover:underline flex items-center space-x-1"
                          >
                            <span>Ouvrir le lien</span>
                          </a>
                        ) : (
                          <span className="text-sm text-gruvbox-fg3"></span>
                        )}
                      </div>

                      {/* Spacer */}
                      <div className="h-1"></div>

                      {/* Created At */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gruvbox-fg2">Création de l'abonnement</span>
                        <span className="text-sm text-gruvbox-fg1">
                          {formatDate(subscription.createdAt || subscription.startDate)}
                        </span>
                      </div>
                      
                      {/* Last Updated */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gruvbox-fg2">Dernière modification</span>
                        <span className="text-sm text-gruvbox-fg1">
                          {formatDate(subscription.updatedAt || subscription.startDate)}
                        </span>
                      </div>
                      
                      {/* Start Date */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gruvbox-fg2">Début de l'abonnement en cours</span>
                        <span className="text-sm text-gruvbox-fg1">
                          {formatDate(subscription.startDate)}
                        </span>
                      </div>
                      
                      {/* Next Billing */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gruvbox-fg2">Prochain paiement</span>
                        <span className="text-sm text-gruvbox-fg1">
                          {formatDate(subscription.nextBilling)}
                        </span>
                      </div>
                      
                      {/* Trial Period */}
                      {subscription.isTrialPeriod && subscription.trialEndDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gruvbox-fg2">Fin de la période d'essai</span>
                          <span className="text-sm text-gruvbox-blue-bright">
                            {formatDate(subscription.trialEndDate)}
                          </span>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Comments Section */}
                  <div className="bg-gruvbox-bg1 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center mb-6">
                        <hr className="w-1/12 border-gruvbox-bg3" />
                        <h2 className="text-lg font-normal text-gruvbox-fg1 px-4">Commentaires</h2>
                        <hr className="flex-1 border-gruvbox-bg3" />
                      </div>
                      {subscription.notes ? (
                        <p className="text-sm text-gruvbox-fg2">{subscription.notes}</p>
                      ) : (
                        <p className="text-sm text-gruvbox-fg3"></p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* History Section */}
              {activeSection === 'history' && (
                <div className="bg-gruvbox-bg1 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center mb-6">
                      <hr className="w-1/12 border-gruvbox-bg3" />
                      <h2 className="text-lg font-normal text-gruvbox-fg1 px-4">Historique de l'abonnement</h2>
                      <hr className="flex-1 border-gruvbox-bg3" />
                    </div>
                    
                    <div className="space-y-6">
                      {events.map((event, index) => (
                        <div key={event.id} className="relative">
                          {/* Timeline connector */}
                          {index < events.length - 1 && (
                            <div className="absolute top-8 bottom-0 left-4 w-0.5 bg-gruvbox-bg2"></div>
                          )}
                          
                          <div className="flex items-center space-x-4">
                            {/* Icon */}
                            <div className={`w-8 h-8 rounded-full ${event.color.replace('text-', 'bg-')} bg-opacity-20 flex items-center justify-center z-10`}>
                              <FontAwesomeIcon icon={event.icon} className={`w-4 h-4 ${event.color}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex flex-row items-center justify-between">
                                <h3 className="text-sm font-normal text-gruvbox-fg2">{event.description}</h3>
                                <span className="text-sm text-gruvbox-fg3">{formatDate(event.date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar with Tabs */}
            <div className="w-64 border-l border-gruvbox-bg1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-gruvbox-bg1 text-gruvbox-fg0'
                      : 'text-gruvbox-fg2 hover:bg-gruvbox-bg1 hover:text-gruvbox-fg1'
                  }`}
                >
                  <FontAwesomeIcon icon={section.icon} className={`w-5 h-5 ${section.color}`} />
                  <span className="text-sm font-normal">{section.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
