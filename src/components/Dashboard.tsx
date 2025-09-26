import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faMagnifyingGlass, 
  faFilter, 
  faTableCells, 
  faList, 
  faArrowUp, 
  faArrowDown, 
  faChartLine, 
  faCalendarDays, 
  faDollarSign, 
  faFont, 
  faTag, 
  faUser, 
  faGear, 
  faRightFromBracket 
} from '@fortawesome/free-solid-svg-icons';
import { isThisWeek, isThisMonth, isThisYear, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Subscription, Category, Alert } from '../types/Subscription';
import { SubscriptionCard } from './SubscriptionCard';
import { SubscriptionForm } from './SubscriptionForm';
import { AlertsPanel } from './AlertsPanel';
import { RecentPaymentsPanel } from './RecentPaymentsPanel';
import { PaymentAdjustmentModal } from './PaymentAdjustmentModal';
import { Charts } from './Charts';
import { CalendarView } from './CalendarView';
import { categoryLabels, calculateMonthlyAmount, generateAlerts, formatCurrency } from '../utils/subscriptionUtils';
import { MonthlyTrendView } from './MonthlyTrendView';
import { ProfileModal } from './ProfileModal';
import { SettingsModal } from './SettingsModal';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { DeleteSubscriptionModal } from './DeleteSubscriptionModal';
import { ReactivateSubscriptionModal } from './ReactivateSubscriptionModal';
import { SubscriptionDetailsPage } from './SubscriptionDetailsPage';

// Custom hook to generate alerts and listen for settings changes
function useAlerts(subscriptions: Subscription[]): Alert[] {
  const [alertsKey, setAlertsKey] = useState(0);
  
  useEffect(() => {
    const handleSettingsChange = () => {
      // Force re-calculation of alerts by updating a state
      setAlertsKey(prev => prev + 1);
    };

    window.addEventListener('settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange);
    };
  }, []);
  
  // Generate alerts when subscriptions or alertsKey changes
  // We need to use alertsKey in the function body to make it a dependency
  return useMemo(() => {
    // Using alertsKey in the function body to make it a dependency
    if (alertsKey > 0) {
      console.log('Regenerating alerts due to settings change');
    }
    return generateAlerts(subscriptions);
  }, [subscriptions, alertsKey]);
}

interface DashboardProps {
  subscriptions: Subscription[];
  onAddSubscription: (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateSubscription: (id: string, subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteSubscription: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

type ViewMode = 'grid' | 'list';
type MainView = 'subscriptions' | 'calendar' | 'monthly-trend';
type SortBy = 'name' | 'amount' | 'nextBilling' | 'category';
type SortDirection = 'asc' | 'desc';

export const Dashboard: React.FC<DashboardProps> = ({
  subscriptions,
  onAddSubscription,
  onUpdateSubscription,
  onDeleteSubscription,
  onViewDetails
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set());
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<'active' | 'trial' | 'cancelled'>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mainView, setMainView] = useState<MainView>('subscriptions');
  const [sortBy, setSortBy] = useState<SortBy>('nextBilling');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [useCategoryFolders, setUseCategoryFolders] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState<Subscription | null>(null);
  const [deletingSubscription, setDeletingSubscription] = useState<Subscription | null>(null);
  const [reactivatingSubscription, setReactivatingSubscription] = useState<Subscription | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailsPage, setShowDetailsPage] = useState(false);
  const [recentPayments, setRecentPayments] = useState<{subscription: Subscription, payment: PaymentRecord}[]>([]);
  const [adjustingPayment, setAdjustingPayment] = useState<{subscription: Subscription, payment: PaymentRecord} | null>(null);

  useEffect(() => {
    const handleSettingsChange = () => {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        setUseCategoryFolders(JSON.parse(savedSettings).display.categoryFolders);
      }
    };

    window.addEventListener('settings-changed', handleSettingsChange);
    handleSettingsChange(); // Initial load

    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange);
    };
  }, []);

  // Generate alerts using custom hook
  const alerts = useAlerts(subscriptions);

  const availableCategories = useMemo(() => {
    const categoriesInUse = new Set<Category>();
    subscriptions.forEach(sub => {
      categoriesInUse.add(sub.category);
    });
    return Object.entries(categoryLabels).filter(([key]) => categoriesInUse.has(key as Category));
  }, [subscriptions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const totalMonthly = activeSubscriptions.reduce((sum, sub) => {
      return sum + calculateMonthlyAmount(sub.amount, sub.frequency);
    }, 0);
    
    const totalYearly = activeSubscriptions.reduce((sum, sub) => {
      return sum + calculateMonthlyAmount(sub.amount, sub.frequency) * 12; // Assuming monthly equivalent for yearly
    }, 0);

    const toPayThisWeek = activeSubscriptions.reduce((sum, sub) => {
      const nextBillingDate = parseISO(sub.nextBilling);
      if (isThisWeek(nextBillingDate, { locale: fr })) {
        return sum + sub.amount;
      }
      return sum;
    }, 0);

    const toPayThisMonth = activeSubscriptions.reduce((sum, sub) => {
      const nextBillingDate = parseISO(sub.nextBilling);
      if (isThisMonth(nextBillingDate, { locale: fr })) {
        return sum + sub.amount;
      }
      return sum;
    }, 0);

    const toPayThisYear = activeSubscriptions.reduce((sum, sub) => {
      const nextBillingDate = parseISO(sub.nextBilling);
      if (isThisYear(nextBillingDate, { locale: fr })) {
        return sum + sub.amount;
      }
      return sum;
    }, 0);

    return {
      activeCount: activeSubscriptions.length,
      totalMonthly,
      totalYearly,
      toPayThisWeek,
      toPayThisMonth,
      toPayThisYear,
      alertCount: alerts.length
    };
  }, [subscriptions, alerts]);

  // Filter and sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    const filtered = subscriptions.filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           categoryLabels[sub.category].toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(sub.category);
      const matchesStatus = selectedStatuses.size === 0 || 
                            selectedStatuses.has(sub.status) || 
                            (selectedStatuses.has('trial') && sub.isTrialPeriod);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort subscriptions
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'nextBilling':
          comparison = new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime();
          break;
        case 'category':
          comparison = categoryLabels[a.category].localeCompare(categoryLabels[b.category]);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [subscriptions, searchQuery, selectedCategories, selectedStatuses, sortBy, sortDirection]);

  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter);
  };

  const toggleStatus = (status: 'active' | 'trial' | 'cancelled') => {
    setSelectedStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const handleToggleFilters = () => {
    setShowFilters(prev => !prev);
  };
  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setShowForm(true);
  };

  const handleSaveSubscription = (subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSubscription) {
      onUpdateSubscription(editingSubscription.id, subscriptionData);
    } else {
      onAddSubscription(subscriptionData);
    }
    setShowForm(false);
    setEditingSubscription(undefined);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSubscription(undefined);
  };

  const handleDeleteSubscription = (id: string) => {
    const subscription = subscriptions.find(sub => sub.id === id);
    if (subscription) {
      setDeletingSubscription(subscription);
    }
  };

  const confirmDeleteSubscription = () => {
    if (deletingSubscription) {
      onDeleteSubscription(deletingSubscription.id);
      setDeletingSubscription(null);
    }
  };

  const handleCancelSubscription = (id: string) => {
    const subscription = subscriptions.find(sub => sub.id === id);
    if (subscription) {
      setCancellingSubscription(subscription);
    }
  };

  const confirmCancelSubscription = () => {
    if (cancellingSubscription) {
      const updatedSubscription = {
        ...cancellingSubscription,
        status: 'cancelled' as const
      };
      onUpdateSubscription(cancellingSubscription.id, updatedSubscription);
      setCancellingSubscription(null);
    }
  };

  const handleReactivateSubscription = (id: string) => {
    const subscription = subscriptions.find(sub => sub.id === id);
    if (subscription) {
      setReactivatingSubscription(subscription);
    }
  };

  const confirmReactivateSubscription = () => {
    if (reactivatingSubscription) {
      // Check if the subscription is expired (next billing date is in the past)
      const isExpired = new Date(reactivatingSubscription.nextBilling) < new Date();
      
      let updatedSubscription;
      
      if (isExpired) {
        // If expired, set start date to today and recalculate next billing
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        
        // Calculate next billing based on frequency
        let nextBilling;
        switch (reactivatingSubscription.frequency) {
          case 'weekly':
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            nextBilling = nextWeek.toISOString().split('T')[0];
            break;
          case 'biweekly':
            const nextTwoWeeks = new Date(today);
            nextTwoWeeks.setDate(today.getDate() + 14);
            nextBilling = nextTwoWeeks.toISOString().split('T')[0];
            break;
          case 'monthly':
            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + 1);
            nextBilling = nextMonth.toISOString().split('T')[0];
            break;
          case 'yearly':
            const nextYear = new Date(today);
            nextYear.setFullYear(today.getFullYear() + 1);
            nextBilling = nextYear.toISOString().split('T')[0];
            break;
          default:
            nextBilling = reactivatingSubscription.nextBilling;
        }
        
        updatedSubscription = {
          ...reactivatingSubscription,
          status: 'active' as const,
          startDate,
          nextBilling
        };
      } else {
        // If not expired, just change the status back to active
        updatedSubscription = {
          ...reactivatingSubscription,
          status: 'active' as const
        };
      }
      
      onUpdateSubscription(reactivatingSubscription.id, updatedSubscription);
      setReactivatingSubscription(null);
    }
  };

  const handleViewChange = (newView: MainView, newViewMode?: ViewMode) => {
    if (newView === mainView && (!newViewMode || newViewMode === viewMode)) return;
    setMainView(newView);
    if (newViewMode) setViewMode(newViewMode);
  };

  const handleViewModeChange = (newViewMode: ViewMode) => {
    if (newViewMode === viewMode) return;
    setViewMode(newViewMode);
  };

  const handleSortChange = (newSortBy: SortBy) => {
    if (newSortBy === sortBy) return;
    setSortBy(newSortBy);
  };

  const handleSortDirectionChange = (newDirection: SortDirection) => {
    if (newDirection === sortDirection) return;
    setSortDirection(newDirection);
  };

  const handleViewDetails = (id: string) => {
    const subscription = subscriptions.find(sub => sub.id === id);
    if (subscription) {
      setSelectedSubscription(subscription);
      setShowDetailsPage(true);
    }
  };

  // Fonctions de gestion des paiements
  const handlePaySubscription = (subscriptionId: string) => {
    const subscription = subscriptions.find(sub => sub.id === subscriptionId);
    if (!subscription) return;

    // Créer un nouveau paiement
    const today = new Date();
    const paymentDate = today.toISOString().split('T')[0];
    
    const newPayment = {
      id: `payment-${subscriptionId}-${Date.now()}`,
      amount: subscription.amount,
      currency: subscription.currency,
      paymentDate,
      recordedDate: today.toISOString(),
      status: 'pending' as const,
      isAdjusted: false
    };

    // Ajouter le paiement à la liste des paiements récents
    setRecentPayments(prev => [
      ...prev,
      { subscription, payment: newPayment }
    ]);

    // Mettre à jour la date du prochain paiement
    const nextBillingDate = new Date(subscription.nextBilling);
    let newNextBilling;

    switch (subscription.frequency) {
      case 'weekly':
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);
        break;
      case 'biweekly':
        nextBillingDate.setDate(nextBillingDate.getDate() + 14);
        break;
      case 'monthly':
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        break;
      case 'yearly':
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        break;
    }

    newNextBilling = nextBillingDate.toISOString().split('T')[0];

    // Mettre à jour l'abonnement
    const updatedSubscription = {
      ...subscription,
      nextBilling: newNextBilling,
      paymentHistory: [...(subscription.paymentHistory || []), newPayment]
    };

    onUpdateSubscription(subscription.id, updatedSubscription);
  };

  const handleAdjustPayment = (subscriptionId: string, paymentId: string) => {
    const subscription = subscriptions.find(sub => sub.id === subscriptionId);
    if (!subscription) return;

    const paymentIndex = recentPayments.findIndex(
      p => p.subscription.id === subscriptionId && p.payment.id === paymentId
    );
    
    if (paymentIndex === -1) return;
    
    setAdjustingPayment(recentPayments[paymentIndex]);
  };

  const handleConfirmPayment = (subscriptionId: string, paymentId: string) => {
    const subscription = subscriptions.find(sub => sub.id === subscriptionId);
    if (!subscription) return;

    const paymentIndex = recentPayments.findIndex(
      p => p.subscription.id === subscriptionId && p.payment.id === paymentId
    );
    
    if (paymentIndex === -1) return;
    
    const payment = recentPayments[paymentIndex].payment;
    
    // Mettre à jour le statut du paiement
    const updatedPayment = {
      ...payment,
      status: 'confirmed' as const
    };
    
    // Mettre à jour l'historique des paiements de l'abonnement
    const updatedPaymentHistory = [...(subscription.paymentHistory || [])];
    const paymentHistoryIndex = updatedPaymentHistory.findIndex(p => p.id === paymentId);
    
    if (paymentHistoryIndex !== -1) {
      updatedPaymentHistory[paymentHistoryIndex] = updatedPayment;
    } else {
      updatedPaymentHistory.push(updatedPayment);
    }
    
    // Mettre à jour l'abonnement
    const updatedSubscription = {
      ...subscription,
      paymentHistory: updatedPaymentHistory
    };
    
    onUpdateSubscription(subscription.id, updatedSubscription);
    
    // Retirer le paiement de la liste des paiements récents
    setRecentPayments(prev => prev.filter((_, i) => i !== paymentIndex));
  };

  const handleSavePaymentAdjustment = (
    subscriptionId: string, 
    paymentId: string, 
    updatedPayment: Partial<PaymentRecord>,
    updateSubscriptionAmount: boolean
  ) => {
    const subscription = subscriptions.find(sub => sub.id === subscriptionId);
    if (!subscription) return;

    const paymentIndex = recentPayments.findIndex(
      p => p.subscription.id === subscriptionId && p.payment.id === paymentId
    );
    
    if (paymentIndex === -1) return;
    
    const payment = recentPayments[paymentIndex].payment;
    
    // Mettre à jour le paiement
    const newPayment = {
      ...payment,
      ...updatedPayment
    };
    
    // Mettre à jour la liste des paiements récents
    const updatedRecentPayments = [...recentPayments];
    updatedRecentPayments[paymentIndex] = {
      subscription,
      payment: newPayment
    };
    
    setRecentPayments(updatedRecentPayments);
    
    // Mettre à jour l'historique des paiements de l'abonnement
    const updatedPaymentHistory = [...(subscription.paymentHistory || [])];
    const paymentHistoryIndex = updatedPaymentHistory.findIndex(p => p.id === paymentId);
    
    if (paymentHistoryIndex !== -1) {
      updatedPaymentHistory[paymentHistoryIndex] = newPayment;
    } else {
      updatedPaymentHistory.push(newPayment);
    }
    
    // Mettre à jour l'abonnement
    let updatedSubscription: Partial<Subscription> = {
      ...subscription,
      paymentHistory: updatedPaymentHistory
    };
    
    // Si demandé, mettre à jour le montant de l'abonnement
    if (updateSubscriptionAmount && updatedPayment.amount) {
      updatedSubscription = {
        ...updatedSubscription,
        amount: updatedPayment.amount,
        amountUpdatedAt: new Date().toISOString()
      };
    }
    
    onUpdateSubscription(subscription.id, updatedSubscription);
    
    // Fermer la modal d'ajustement
    setAdjustingPayment(null);
  };

  return (
    <div className="min-h-screen bg-gruvbox-bg0-hard">
      {/* Header */}
      <header className="bg-gruvbox-bg0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="Logo" 
                className="h-16 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 text-gruvbox-fg3 hover:text-gruvbox-blue-bright rounded-lg transition-colors focus:outline-none"
                title="Profil"
              >
                <FontAwesomeIcon icon={faUser} className="w-6 h-6" />
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 text-gruvbox-fg3 hover:text-gruvbox-blue-bright rounded-lg transition-colors focus:outline-none"
                title="Réglages"
              >
                <FontAwesomeIcon icon={faGear} className="w-6 h-6" />
              </button>
              <button
                className="p-2 text-gruvbox-fg3 hover:text-gruvbox-red-bright rounded-lg transition-colors focus:outline-none"
                title="Se déconnecter"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* Card 1: Abonnements actifs */}
          <motion.div 
            className="bg-gruvbox-bg0 rounded-xl shadow-sm"
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
          >
            <div className="bg-gruvbox-purple rounded-t-xl p-2.5 flex items-center justify-center space-x-2">
              <h3 className="text-xs font-semibold text-gruvbox-bg0">Abonnements actifs</h3>
            </div>
            <div className="p-3 text-center">
              <div>
                <p className="text-xl font-normal text-gruvbox-fg0">{stats.activeCount}</p>
              </div>
            </div>
          </motion.div>

          {/* Card 2: À payer cette semaine */}
          <motion.div 
            className="bg-gruvbox-bg0 rounded-xl shadow-sm"
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
          >
            <div className="bg-gruvbox-yellow rounded-t-xl p-2.5 flex items-center justify-center space-x-2">
              <h3 className="text-xs font-semibold text-gruvbox-bg0">22 au 28 septembre 2025</h3>
            </div>
            <div className="p-3 text-center">
              <div>
                <p className="text-xl font-normal text-gruvbox-fg0">
                  {formatCurrency(stats.toPayThisWeek)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 3: À payer ce mois */}
          <motion.div 
            className="bg-gruvbox-bg0 rounded-xl shadow-sm"
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
          >
            <div className="bg-gruvbox-green rounded-t-xl p-2.5 flex items-center justify-center space-x-2">
              <h3 className="text-xs font-semibold text-gruvbox-bg0">Septembre 2025</h3>
            </div>
            <div className="p-3 text-center">
              <div>
                <p className="text-xl font-normal text-gruvbox-fg0">
                  {formatCurrency(stats.toPayThisMonth)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 4: À payer cette année */}
          <motion.div 
            className="bg-gruvbox-bg0 rounded-xl shadow-sm"
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
          >
            <div className="bg-gruvbox-blue rounded-t-xl p-2.5 flex items-center justify-center space-x-2">
              <h3 className="text-xs font-semibold text-gruvbox-bg0">2025</h3>
            </div>
            <div className="p-3 text-center">
              <div>
                <p className="text-xl font-normal text-gruvbox-fg0">
                  {formatCurrency(stats.toPayThisYear)}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Controls - Only show when not in monthly trend view */}
            {mainView !== 'monthly-trend' && (
              <div className="bg-gruvbox-bg0 rounded-xl shadow-sm p-4">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gruvbox-fg4 z-10" />
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className="w-full pl-10 pr-4 py-2 bg-gruvbox-bg1 text-gruvbox-fg1 rounded-lg focus:ring-2 focus:ring-gruvbox-blue-bright border-0 focus:outline-none transition-all duration-300"
                      />
                      <div 
                        className={`absolute left-10 top-1/2 transform -translate-y-1/2 pointer-events-none text-gruvbox-fg4 transition-opacity duration-300 ${
                          isSearchFocused || searchQuery ? 'opacity-0' : 'opacity-100'
                        }`}
                      >
                        Rechercher
                      </div>
                    </div>
                  </div>

                  {/* Filter Button */}
                  <motion.button
                    onClick={handleToggleFilters}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-colors border-0 focus:outline-none ${
                      showFilters ? 'bg-gruvbox-purple text-gruvbox-fg0' : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'
                    }`}
                  >
                    <FontAwesomeIcon icon={faFilter} className="w-4 h-4" />
                  </motion.button>

                  {/* Sort Icons */}
                  <div className="flex rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleSortChange('nextBilling')}
                      className={`p-2 ${sortBy === 'nextBilling' ? 'bg-gruvbox-yellow text-gruvbox-fg0' : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'} transition-colors focus:outline-none`}
                    >
                      <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSortChange('name')}
                      className={`p-2 ${sortBy === 'name' ? 'bg-gruvbox-yellow text-gruvbox-fg0' : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'} transition-colors focus:outline-none`}
                    >
                      <FontAwesomeIcon icon={faFont} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSortChange('amount')}
                      className={`p-2 ${sortBy === 'amount' ? 'bg-gruvbox-yellow text-gruvbox-fg0' : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'} transition-colors focus:outline-none`}
                    >
                      <FontAwesomeIcon icon={faDollarSign} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSortChange('category')}
                      className={`p-2 rounded-r-lg ${sortBy === 'category' ? 'bg-gruvbox-yellow text-gruvbox-fg0' : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'} transition-colors focus:outline-none`}
                    >
                      <FontAwesomeIcon icon={faTag} className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sort Direction */}
                  <div className="flex rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleSortDirectionChange('asc')}
                      className={`p-2 ${sortDirection === 'asc' ? 'bg-gruvbox-green text-gruvbox-fg0' : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'} transition-colors focus:outline-none`}
                    >
                      <FontAwesomeIcon icon={faArrowUp} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSortDirectionChange('desc')}
                      className={`p-2 rounded-r-lg ${sortDirection === 'desc' ? 'bg-gruvbox-green text-gruvbox-fg0' : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'} transition-colors focus:outline-none`}
                    >
                      <FontAwesomeIcon icon={faArrowDown} className="w-4 h-4" />
                    </button>
                  </div>
                  {/* View Mode and Calendar */}
                  <div className="flex rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        if (mainView === 'subscriptions') {
                          handleViewModeChange('grid');
                        } else {
                          handleViewChange('subscriptions', 'grid');
                        }
                      }}
                      className={`p-2 ${viewMode === 'grid' && mainView === 'subscriptions' ? 'bg-gruvbox-blue text-gruvbox-fg0' : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'} transition-colors focus:outline-none`}
                    >
                      <FontAwesomeIcon icon={faTableCells} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (mainView === 'subscriptions') {
                          handleViewModeChange('list');
                        } else {
                          handleViewChange('subscriptions', 'list');
                        }
                      }}
                      className={`p-2 ${viewMode === 'list' && mainView === 'subscriptions' ? 'bg-gruvbox-blue text-gruvbox-fg0' : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'} transition-colors focus:outline-none`}
                    >
                      <FontAwesomeIcon icon={faList} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewChange(mainView === 'calendar' ? 'subscriptions' : 'calendar')}
                      className={`p-2 rounded-r-lg ${mainView === 'calendar' ? 'bg-gruvbox-blue text-gruvbox-fg0' : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'} transition-colors focus:outline-none`}
                    >
                      <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4"
                    >
                      <div className="space-y-6">
                        {/* Status Section */}
                        <div className="flex items-center space-x-3 mb-4">
                          <hr className="flex-1 border-gruvbox-bg3" />
                          <h4 className="text-md font-normal text-gruvbox-fg2 px-2">État de l'abonnement</h4>
                          <hr className="flex-1 border-gruvbox-bg3" />
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button
                            onClick={() => toggleStatus('active')}
                            className={`px-3 py-1 text-sm rounded-full transition-colors focus:outline-none ${
                              selectedStatuses.has('active')
                                ? 'bg-gruvbox-purple text-gruvbox-fg0'
                                : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'
                            }`}
                          >
                            Abonnements actifs
                          </button>
                          <button
                            onClick={() => toggleStatus('trial')}
                            className={`px-3 py-1 text-sm rounded-full transition-colors focus:outline-none ${
                              selectedStatuses.has('trial')
                                ? 'bg-gruvbox-purple text-gruvbox-fg0'
                                : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'
                            }`}
                          >
                            Période d'essai
                          </button>
                          <button
                            onClick={() => toggleStatus('cancelled')}
                            className={`px-3 py-1 text-sm rounded-full transition-colors focus:outline-none ${
                              selectedStatuses.has('cancelled')
                                ? 'bg-gruvbox-purple text-gruvbox-fg0'
                                : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'
                            }`}
                          >
                            Abonnements résiliés
                          </button>
                        </div>

                        {/* Categories Section */}
                        <div className="flex items-center space-x-3 mb-4">
                          <hr className="flex-1 border-gruvbox-bg3" />
                          <h4 className="text-md font-normal text-gruvbox-fg2 px-2">Catégories</h4>
                          <hr className="flex-1 border-gruvbox-bg3" />
                        </div>
                        {useCategoryFolders ? (
                          <>
                            <div className="flex flex-col items-center gap-2 mb-4">
                              <div className="flex flex-wrap gap-2 justify-center">
                                {'ABCDEFGHIJKLM'.split('').map(letter => {
                                  const hasCategories = availableCategories.some(([, label]) => label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(letter));
                                  const isActive = selectedLetter === letter;
                                  const hasActiveFilter = availableCategories.some(([key, label]) => label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(letter) && selectedCategories.has(key as Category));
                                  
                                  let buttonClass = 'relative w-8 h-8 text-sm rounded-full transition-colors focus:outline-none ';
                                  if (isActive) {
                                    buttonClass += 'bg-gruvbox-purple text-gruvbox-fg0';
                                  } else if (hasActiveFilter) {
                                    buttonClass += 'bg-gruvbox-purple/40 text-gruvbox-fg2';
                                  } else if (hasCategories) {
                                    buttonClass += 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2';
                                  } else {
                                    buttonClass += 'bg-gruvbox-bg1/50 text-gruvbox-fg4/50';
                                  }

                                  return (
                                    <button
                                      key={letter}
                                      onClick={() => hasCategories && handleLetterClick(letter)}
                                      className={buttonClass}
                                      disabled={!hasCategories}
                                    >
                                      {letter}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {'NOPQRSTUVWXYZ'.split('').map(letter => {
                                  const hasCategories = availableCategories.some(([, label]) => label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(letter));
                                  const isActive = selectedLetter === letter;
                                  const hasActiveFilter = availableCategories.some(([key, label]) => label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(letter) && selectedCategories.has(key as Category));

                                  let buttonClass = 'relative w-8 h-8 text-sm rounded-full transition-colors focus:outline-none ';
                                  if (isActive) {
                                    buttonClass += 'bg-gruvbox-purple text-gruvbox-fg0';
                                  } else if (hasActiveFilter) {
                                    buttonClass += 'bg-gruvbox-purple/40 text-gruvbox-fg2';
                                  } else if (hasCategories) {
                                    buttonClass += 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2';
                                  } else {
                                    buttonClass += 'bg-gruvbox-bg1/50 text-gruvbox-fg4/50';
                                  }
                                  return (
                                    <button
                                      key={letter}
                                      onClick={() => hasCategories && handleLetterClick(letter)}
                                      className={buttonClass}
                                      disabled={!hasCategories}
                                    >
                                      {letter}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {availableCategories
                                .filter(([, label]) => selectedLetter && label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").startsWith(selectedLetter))
                                .map(([key, label]) => (
                                <button
                                  key={key}
                                  onClick={() => toggleCategory(key as Category)}
                                  className={`px-3 py-1 text-sm rounded-full transition-colors focus:outline-none ${
                                    selectedCategories.has(key as Category)
                                      ? 'bg-gruvbox-blue text-gruvbox-fg0'
                                      : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-wrap gap-2 justify-center">
                            {availableCategories.map(([key, label]) => (
                              <button
                                key={key}
                                onClick={() => toggleCategory(key as Category)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors focus:outline-none ${
                                  selectedCategories.has(key as Category)
                                    ? 'bg-gruvbox-blue text-gruvbox-fg0'
                                    : 'bg-gruvbox-bg1 text-gruvbox-fg2 hover:bg-gruvbox-bg2'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={mainView + viewMode + sortBy + sortDirection} // Unique key for re-mounting and animating
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {mainView === 'monthly-trend' ? (
                  <MonthlyTrendView 
                    subscriptions={subscriptions}
                    onBack={() => handleViewChange('subscriptions')}
                  />
                ) : mainView === 'subscriptions' ? (
                  <div>
                    {filteredSubscriptions.length > 0 ? (
                      sortBy === 'category' ? (
                        // Vue avec diviseurs de catégorie
                        (() => {
                          // Grouper par catégorie
                          const groupedByCategory = filteredSubscriptions.reduce((acc, sub) => {
                            if (!acc[sub.category]) {
                              acc[sub.category] = [];
                            }
                            acc[sub.category].push(sub);
                            return acc;
                          }, {} as Record<string, Subscription[]>);

                          return Object.entries(groupedByCategory).map(([category, categorySubscriptions]) => (
                            <div key={category} className="mb-8">
                              {/* Diviseur de catégorie */}
                              <div className="flex items-center mb-6">
                                <hr className="w-1/12 border-gruvbox-bg3" />
                                <h3 className="text-lg font-normal text-gruvbox-fg1 px-4">
                                  {categoryLabels[category as keyof typeof categoryLabels]}
                                </h3>
                                <hr className="flex-1 border-gruvbox-bg3" />
                              </div>

                              {/* Contenu de la catégorie */}
                              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
                                {viewMode === 'list' ? (
                                  categorySubscriptions.map((subscription) => (
                                    <motion.div 
                                      key={subscription.id} 
                                      className="mb-4"
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -20 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                        <SubscriptionCard
                                          subscription={subscription}
                                          subscriptions={subscriptions}
                                          viewMode={viewMode}
                                          isExpanded={expandedCardId === subscription.id}
                                          onToggleExpanded={(id) => setExpandedCardId(expandedCardId === id ? null : id)}
                                          onEdit={handleEditSubscription}
                                          onDelete={handleDeleteSubscription}
                                          onCancel={handleCancelSubscription}
                                          onReactivate={handleReactivateSubscription}
                                          onViewDetails={handleViewDetails}
                                          columnIndex={1}
                                        />
                                    </motion.div>
                                  ))
                                ) : (
                                  // Vue grille avec colonnes
                                  (() => {
                                    const leftColumn = [];
                                    const rightColumn = [];
                                    
                                    for (let i = 0; i < categorySubscriptions.length; i += 2) {
                                      if (categorySubscriptions[i]) {
                                        leftColumn.push(categorySubscriptions[i]);
                                      }
                                      if (categorySubscriptions[i + 1]) {
                                        rightColumn.push(categorySubscriptions[i + 1]);
                                      }
                                    }
                                    
                                    return (
                                      <>
                                        <div className="space-y-6">
                                          {leftColumn.map((subscription) => (
                                            <motion.div 
                                              key={subscription.id}
                                              initial={{ opacity: 0, y: 20 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              exit={{ opacity: 0, y: -20 }}
                                              transition={{ duration: 0.3 }}
                                            >
                                        <SubscriptionCard
                                          subscription={subscription}
                                          subscriptions={subscriptions}
                                          viewMode={viewMode}
                                          isExpanded={expandedCardId === subscription.id}
                                          onToggleExpanded={(id) => setExpandedCardId(expandedCardId === id ? null : id)}
                                          onEdit={handleEditSubscription}
                                          onDelete={handleDeleteSubscription}
                                          onCancel={handleCancelSubscription}
                                          onReactivate={handleReactivateSubscription}
                                          onViewDetails={handleViewDetails}
                                          columnIndex={0}
                                        />
                                            </motion.div>
                                          ))}
                                        </div>
                                        <div className="space-y-6">
                                          {rightColumn.map((subscription) => (
                                            <motion.div 
                                              key={subscription.id}
                                              initial={{ opacity: 0, y: 20 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              exit={{ opacity: 0, y: -20 }}
                                              transition={{ duration: 0.3 }}
                                            >
                                        <SubscriptionCard
                                          subscription={subscription}
                                          subscriptions={subscriptions}
                                          viewMode={viewMode}
                                          isExpanded={expandedCardId === subscription.id}
                                          onToggleExpanded={(id) => setExpandedCardId(expandedCardId === id ? null : id)}
                                          onEdit={handleEditSubscription}
                                          onDelete={handleDeleteSubscription}
                                          onCancel={handleCancelSubscription}
                                          onReactivate={handleReactivateSubscription}
                                          onViewDetails={handleViewDetails}
                                          columnIndex={1}
                                        />
                                            </motion.div>
                                          ))}
                                        </div>
                                      </>
                                    );
                                  })()
                                )}
                              </div>
                            </div>
                          ));
                        })()
                      ) : (
                        // Vue normale sans diviseurs
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
                          {viewMode === 'list' ? (
                            filteredSubscriptions.map((subscription) => (
                              <motion.div 
                                key={subscription.id} 
                                className="mb-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                              >
                                        <SubscriptionCard
                                          subscription={subscription}
                                          subscriptions={subscriptions}
                                          viewMode={viewMode}
                                          isExpanded={expandedCardId === subscription.id}
                                          onToggleExpanded={(id) => setExpandedCardId(expandedCardId === id ? null : id)}
                                          onEdit={handleEditSubscription}
                                          onDelete={handleDeleteSubscription}
                                          onCancel={handleCancelSubscription}
                                          onReactivate={handleReactivateSubscription}
                                          onViewDetails={handleViewDetails}
                                          columnIndex={0}
                                        />
                              </motion.div>
                            ))
                          ) : (
                            // Vue grille normale
                            (() => {
                              const leftColumn = [];
                              const rightColumn = [];
                              
                              // Si aucun abonnement, mettre toutes les cartes dans la colonne de droite
                              if (subscriptions.length === 0) {
                                for (let i = 0; i < filteredSubscriptions.length; i++) {
                                  rightColumn.push(filteredSubscriptions[i]);
                                }
                              } else {
                                // Distribution normale alternée
                                for (let i = 0; i < filteredSubscriptions.length; i += 2) {
                                  if (filteredSubscriptions[i]) {
                                    leftColumn.push(filteredSubscriptions[i]);
                                  }
                                  if (filteredSubscriptions[i + 1]) {
                                    rightColumn.push(filteredSubscriptions[i + 1]);
                                  }
                                }
                              }
                              
                              return (
                                <>
                                  <div className="space-y-6">
                                    {leftColumn.map((subscription) => (
                                      <motion.div 
                                        key={subscription.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                      >
                                        <SubscriptionCard
                                          subscription={subscription}
                                          subscriptions={subscriptions}
                                          viewMode={viewMode}
                                          isExpanded={expandedCardId === subscription.id}
                                          onToggleExpanded={(id) => setExpandedCardId(expandedCardId === id ? null : id)}
                                          onEdit={handleEditSubscription}
                                          onDelete={handleDeleteSubscription}
                                          onCancel={handleCancelSubscription}
                                          onReactivate={handleReactivateSubscription}
                                          onViewDetails={handleViewDetails}
                                          columnIndex={0}
                                        />
                                      </motion.div>
                                    ))}
                                  </div>
                                  <div className="space-y-6">
                                    {rightColumn.map((subscription) => (
                                      <motion.div 
                                        key={subscription.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                      >
                                        <SubscriptionCard
                                          subscription={subscription}
                                          subscriptions={subscriptions}
                                          viewMode={viewMode}
                                          isExpanded={expandedCardId === subscription.id}
                                          onToggleExpanded={(id) => setExpandedCardId(expandedCardId === id ? null : id)}
                                          onEdit={handleEditSubscription}
                                          onDelete={handleDeleteSubscription}
                                          onCancel={handleCancelSubscription}
                                          onReactivate={handleReactivateSubscription}
                                          onViewDetails={handleViewDetails}
                                          columnIndex={1}
                                        />
                                      </motion.div>
                                    ))}
                                  </div>
                                </>
                              );
                            })()
                          )}
                        </div>
                      )
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <div className="w-16 h-16 bg-gruvbox-bg1 rounded-full flex items-center justify-center mx-auto mb-4">
                          {viewMode === 'list' ? (
                            <FontAwesomeIcon icon={faList} className="w-8 h-8 text-gruvbox-fg4" />
                          ) : (
                            <FontAwesomeIcon icon={faTableCells} className="w-8 h-8 text-gruvbox-fg4" />
                          )}
                        </div>
                        <h3 className="text-lg font-normal text-gruvbox-fg1 mb-2">
                          Aucun abonnement trouvé
                        </h3>
                        <p className="text-gruvbox-fg3 mb-6">
                          {subscriptions.length === 0 
                            ? ''
                            : 'Essayez de modifier vos filtres de recherche'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <CalendarView 
                    subscriptions={subscriptions}
                    searchQuery={searchQuery}
                    selectedCategories={selectedCategories}
                    selectedStatuses={selectedStatuses}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Inscrire un abonnement button */}
            <motion.button
              onClick={() => setShowForm(true)}
              className="w-full bg-gruvbox-orange hover:bg-gruvbox-orange-bright text-gruvbox-bg0 rounded-xl shadow-lg p-6 flex items-center justify-center space-x-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gruvbox-green-bright/50"
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <FontAwesomeIcon icon={faPlus} className="w-6 h-6 text-gruvbox-bg0" />
              <span className="text-2xl font-bold">Inscrire un abonnement</span>
            </motion.button>

            {/* Alerts */}
            <AlertsPanel 
              alerts={alerts} 
              subscriptions={subscriptions}
              onPaySubscription={handlePaySubscription}
            />
            
            {/* Recent Payments */}
            <RecentPaymentsPanel 
              payments={recentPayments}
              onAdjustPayment={handleAdjustPayment}
              onConfirmPayment={handleConfirmPayment}
            />
            
            {/* Charts */}
            <Charts 
              subscriptions={subscriptions} 
              onShowMonthlyTrend={() => handleViewChange('monthly-trend')}
            />
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <SubscriptionForm
          subscription={editingSubscription}
          onSave={handleSaveSubscription}
          onClose={handleCloseForm}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      {/* Cancel Subscription Modal */}
      {cancellingSubscription && (
        <CancelSubscriptionModal
          subscription={cancellingSubscription}
          onConfirm={confirmCancelSubscription}
          onClose={() => setCancellingSubscription(null)}
        />
      )}

      {/* Delete Subscription Modal */}
      {deletingSubscription && (
        <DeleteSubscriptionModal
          subscription={deletingSubscription}
          onConfirm={confirmDeleteSubscription}
          onClose={() => setDeletingSubscription(null)}
          onCancel={handleCancelSubscription}
        />
      )}

      {/* Reactivate Subscription Modal */}
      {reactivatingSubscription && (
        <ReactivateSubscriptionModal
          subscription={reactivatingSubscription}
          onConfirm={confirmReactivateSubscription}
          onClose={() => setReactivatingSubscription(null)}
        />
      )}

      {/* Subscription Details Page */}
      <SubscriptionDetailsPage
        subscription={selectedSubscription}
        subscriptions={subscriptions}
        onClose={() => setShowDetailsPage(false)}
        isVisible={showDetailsPage}
      />
      
      {/* Payment Adjustment Modal */}
      {adjustingPayment && (
        <PaymentAdjustmentModal
          subscription={adjustingPayment.subscription}
          payment={adjustingPayment.payment}
          onSave={handleSavePaymentAdjustment}
          onClose={() => setAdjustingPayment(null)}
        />
      )}
    </div>
  );
};
