import { Subscription, Alert, Frequency, CategorySettings } from '../types/Subscription';

export const defaultCategorySettings: CategorySettings = {
  alimentation: { label: 'Alimentation', enabled: true },
  alimentation_animaux: { label: 'Alimentation pour animaux', enabled: true },
  applications_productivite: { label: 'Applications de productivité', enabled: true },
  assurance_automobile: { label: 'Assurance automobile', enabled: true },
  assurance_habitation: { label: 'Assurance habitation', enabled: true },
  assurance_sante: { label: 'Assurance santé', enabled: true },
  assurance_voyage: { label: 'Assurance voyage', enabled: true },
  assurances_animaux: { label: 'Assurances pour animaux', enabled: true },
  baladodiffusions: { label: 'Baladodiffusions', enabled: true },
  cine_clubs: { label: 'Ciné-clubs', enabled: true },
  clubs_sport: { label: 'Clubs de sport', enabled: true },
  clubs_voyage: { label: 'Clubs de voyage', enabled: true },
  clubs_communautes: { label: 'Clubs et communautés', enabled: true },
  commerce_en_ligne: { label: 'Commerce en ligne', enabled: true },
  compagnies_aeriennes: { label: 'Compagnies aériennes', enabled: true },
  conception_graphique: { label: 'Conception graphique', enabled: true },
  concerts_operas: { label: 'Concerts et opéras', enabled: true },
  cours_en_ligne: { label: 'Cours en ligne', enabled: true },
  cryptomonnaies: { label: 'Cryptomonnaies', enabled: true },
  creation_musicale: { label: 'Création musicale', enabled: true },
  cybersecurite: { label: 'Cybersécurité', enabled: true },
  divertissements_adultes: { label: 'Divertissements pour adultes', enabled: true },
  eau: { label: 'Eau', enabled: true },
  edition_photo_videos: { label: 'Édition photo et vidéos', enabled: true },
  electricite: { label: 'Électricité', enabled: true },
  entreposage: { label: 'Entreposage', enabled: true },
  entretien_domestique: { label: 'Entretien domestique', enabled: true },
  formations_professionnelles: { label: 'Formations professionnelles', enabled: true },
  frais_bancaires: { label: 'Frais bancaires', enabled: true },
  garde_animaux: { label: 'Garde d\'animaux', enabled: true },
  garde_enfants: { label: 'Garde d\'enfants', enabled: true },
  gaz: { label: 'Gaz', enabled: true },
  gestion_entreprise: { label: 'Gestion d\'entreprise', enabled: true },
  gestion_financiere: { label: 'Gestion financière', enabled: true },
  hebergement_en_ligne: { label: 'Hébergement en ligne', enabled: true },
  hebergement_infonuagique: { label: 'Hébergement infonuagique', enabled: true },
  hebergement_touristique: { label: 'Hébergement touristique', enabled: true },
  intelligence_artificielle: { label: 'Intelligence artificielle', enabled: true },
  internet: { label: 'Internet', enabled: true },
  investissements_boursiers: { label: 'Investissements boursiers', enabled: true },
  jeux_videos: { label: 'Jeux vidéos', enabled: true },
  journaux_magazines: { label: 'Journaux / Magazines', enabled: true },
  livres_audio: { label: 'Livres audio', enabled: true },
  livres_numeriques: { label: 'Livres numériques', enabled: true },
  location_equipements: { label: 'Location d\'équipements', enabled: true },
  location_vetements: { label: 'Location de vêtements', enabled: true },
  magazines_numeriques: { label: 'Magazines numériques', enabled: true },
  maison_connectee: { label: 'Maison connectée', enabled: true },
  mise_en_forme: { label: 'Mise en forme', enabled: true },
  mode_vetements: { label: 'Mode et vêtements', enabled: true },
  musique_en_continu: { label: 'Musique en continu', enabled: true },
  musees_galeries: { label: 'Musées et galeries', enabled: true },
  meditation: { label: 'Méditation', enabled: true },
  programmation: { label: 'Programmation', enabled: true },
  programmes_fidelite: { label: 'Programmes de fidélité', enabled: true },
  protection_juridique: { label: 'Protection juridique', enabled: true },
  publicite: { label: 'Publicité', enabled: true },
  rencontres_vie_amoureuse: { label: 'Rencontres et vie amoureuse', enabled: true },
  reapprovisionnement: { label: 'Réapprovisionnement', enabled: true },
  services_automobiles: { label: 'Services automobiles', enabled: true },
  services_courriels: { label: 'Services de courriels', enabled: true },
  services_postaux: { label: 'Services postaux', enabled: true },
  soins_animaux: { label: 'Soins pour animaux', enabled: true },
  soins_bebe: { label: 'Soins pour bébé', enabled: true },
  soutien_createurs: { label: 'Soutien aux créateurs', enabled: true },
  suivi_sante: { label: 'Suivi de la santé', enabled: true },
  securite_residentielle: { label: 'Sécurité résidentielle', enabled: true },
  selections_personnalisees: { label: 'Sélections personnalisées', enabled: true },
  therapie_coaching: { label: 'Thérapie / Coaching', enabled: true },
  theatre_spectacles: { label: 'Théâtre et spectacles', enabled: true },
  transports_urbains: { label: 'Transports urbains', enabled: true },
  telephonie: { label: 'Téléphonie', enabled: true },
  television: { label: 'Télévision', enabled: true },
  videos_en_continu: { label: 'Vidéos en continu', enabled: true }
};

// Fonction pour obtenir les catégories activées depuis le localStorage
export const getCategorySettings = (): CategorySettings => {
  try {
    const stored = localStorage.getItem('categorySettings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres de catégories:', error);
  }
  return defaultCategorySettings;
};

// Fonction pour sauvegarder les paramètres de catégories
export const saveCategorySettings = (settings: CategorySettings): void => {
  try {
    localStorage.setItem('categorySettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres de catégories:', error);
  }
};

// Fonction pour obtenir les catégories activées uniquement
export const getEnabledCategories = (): CategorySettings => {
  const allSettings = getCategorySettings();
  const enabledSettings: CategorySettings = {};
  
  Object.entries(allSettings).forEach(([key, value]) => {
    if (value.enabled) {
      enabledSettings[key] = value;
    }
  });
  
  return enabledSettings;
};

// Fonction pour obtenir les labels de toutes les catégories (pour compatibilité)
export const getCategoryLabels = (): { [key: string]: string } => {
  const settings = getCategorySettings();
  const labels: { [key: string]: string } = {};
  
  Object.entries(settings).forEach(([key, value]) => {
    labels[key] = value.label;
  });
  
  return labels;
};

// Compatibilité avec l'ancien système - objet statique pour les cas où on a besoin d'un objet
export const categoryLabels: { [key: string]: string } = {};

// Initialiser categoryLabels au chargement
Object.entries(defaultCategorySettings).forEach(([key, value]) => {
  categoryLabels[key] = value.label;
});

export const frequencyLabels = {
  weekly: 'Hebdomadaire',
  biweekly: 'Bimensuel',
  monthly: 'Mensuel',
  yearly: 'Annuel'
};

export const frequencyDisplayLabels = {
  weekly: 'semaine',
  biweekly: '2 semaines',
  monthly: 'mois',
  yearly: 'an'
};

export const calculateNextBilling = (startDate: string, frequency: Frequency): string => {
  const start = new Date(startDate);
  const today = new Date();
  let next = new Date(start);
  
  // Find the next billing date after today
  while (next <= today) {
    switch (frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
  }
  
  return next.toISOString().split('T')[0];
};

export const calculateMonthlyAmount = (amount: number, frequency: Frequency): number => {
  switch (frequency) {
    case 'weekly':
      return amount * 4.33; // Average weeks per month
    case 'biweekly':
      return amount * 2.17; // Average bi-weeks per month (26/12)
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
};

export const generateAlerts = (subscriptions: Subscription[]): Alert[] => {
  const alerts: Alert[] = [];
  const today = new Date();
  
  // Get notification settings
  let notificationSettings = {
    upcomingPayments: true,
    trialEnding: true,
    subscriptionExpiring: true,
    advanceDays: 7
  };
  
  try {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.notifications) {
        notificationSettings = {
          ...notificationSettings,
          ...settings.notifications,
          advanceDays: parseInt(settings.notifications.advanceDays || '7', 10)
        };
      }
    }
  } catch (error) {
    console.error('Error loading notification settings:', error);
  }
  
  const advanceDays = notificationSettings.advanceDays;
  
  subscriptions.forEach(sub => {
    let trialAlertCreated = false;
    
    // For active trial subscriptions, create a combined notification
    if (sub.status !== 'cancelled' && notificationSettings.trialEnding && sub.isTrialPeriod && sub.trialEndDate) {
      const trialEnd = new Date(sub.trialEndDate);
      const daysUntilTrialEnd = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilTrialEnd >= 0 && daysUntilTrialEnd <= advanceDays) {
        alerts.push({
          id: `trial-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          type: 'trial_ending',
          daysRemaining: daysUntilTrialEnd,
          amount: sub.amount,
          currency: sub.currency,
          urgency: daysUntilTrialEnd <= 1 ? 'high' : daysUntilTrialEnd <= 3 ? 'medium' : 'low',
          primaryColor: sub.primaryColor,
          nextBillingDate: sub.nextBilling // Include the next billing date for active trial subscriptions
        });
        
        // Mark that we've created a trial alert for this subscription
        trialAlertCreated = true;
      }
    }
    
    // Check next billing for active subscriptions (only if not already handled as a trial notification)
    if (!trialAlertCreated && (sub.status === 'active' || sub.status === 'trial') && notificationSettings.upcomingPayments && sub.reminderEnabled) {
      const nextBilling = new Date(sub.nextBilling);
      const daysUntilBilling = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilBilling >= 0 && daysUntilBilling <= advanceDays) {
        alerts.push({
          id: `billing-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          type: 'renewal',
          daysRemaining: daysUntilBilling,
          amount: sub.amount,
          currency: sub.currency,
          urgency: daysUntilBilling <= 1 ? 'high' : daysUntilBilling <= 3 ? 'medium' : 'low'
        });
      }
    }
    
    // Check subscription expiration (for cancelled subscriptions that are still active)
    if (notificationSettings.subscriptionExpiring && sub.status === 'cancelled') {
      const nextBilling = new Date(sub.nextBilling);
      const daysUntilExpiration = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiration >= 0 && daysUntilExpiration <= advanceDays) {
        alerts.push({
          id: `expiring-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          type: 'expiring',
          daysRemaining: daysUntilExpiration,
          amount: 0, // No amount for expiring subscriptions since they won't be renewed
          currency: sub.currency,
          urgency: daysUntilExpiration <= 1 ? 'high' : daysUntilExpiration <= 3 ? 'medium' : 'low'
        });
      }
    }
  });
  
  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
};

export const formatCurrency = (amount: number, currency?: string): string => {
  // Get currency, language and number format from settings
  let currencySymbol = '$'; // Default currency symbol
  let language = 'fr';
  let thousandsSeparator = 'space';
  let decimalSeparator = 'comma';
  
  try {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      // Always use the application's currency setting, ignoring the currency parameter
      currencySymbol = settings.currency || '$';
      language = settings.language || 'fr';
      
      // Get number format settings if available
      if (settings.numberFormat) {
        thousandsSeparator = settings.numberFormat.thousandsSeparator || 'space';
        decimalSeparator = settings.numberFormat.decimalSeparator || 'comma';
      }
    }
  } catch (error) {
    console.error('Error getting settings:', error);
  }
  
  // For Yen, round the amount to the nearest integer
  let formattedAmount = amount;
  if (currencySymbol === '¥') {
    formattedAmount = Math.round(amount);
  }

  // Determine number format options based on user settings
  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: currencySymbol === '¥' ? 0 : 2,
    maximumFractionDigits: currencySymbol === '¥' ? 0 : 2,
    useGrouping: thousandsSeparator !== 'none'
  };
  
  // Create a custom formatter based on user preferences
  let formatted: string;
  
  // Format the number
  if (thousandsSeparator === 'none') {
    // No thousands separator
    formatted = formattedAmount.toFixed(formatOptions.minimumFractionDigits);
    
    // Apply decimal separator
    if (decimalSeparator === 'comma') {
      formatted = formatted.replace('.', ',');
    }
  } else {
    // With thousands separator
    let locale: string;
    
    switch (thousandsSeparator) {
      case 'space':
        locale = 'fr-FR'; // Uses space as thousands separator
        break;
      case 'comma':
        locale = 'en-US'; // Uses comma as thousands separator
        break;
      case 'dot':
        locale = 'de-DE'; // Uses dot as thousands separator
        break;
      default:
        locale = language === 'fr' ? 'fr-FR' : 'en-US';
    }
    
    formatted = new Intl.NumberFormat(locale, formatOptions).format(formattedAmount);
    
    // Override decimal separator if needed
    if ((locale === 'fr-FR' || locale === 'de-DE') && decimalSeparator === 'dot') {
      // Convert comma to dot for decimal
      formatted = formatted.replace(',', '.');
    } else if (locale === 'en-US' && decimalSeparator === 'comma') {
      // Convert dot to comma for decimal
      formatted = formatted.replace('.', ',');
    }
  }
  
  // Apply currency symbol based on language
  if (language === 'fr') {
    return `${formatted} ${currencySymbol}`;
  } else {
    return `${currencySymbol}${formatted}`;
  }
};

export const getDaysRemaining = (date: string): number => {
  const target = new Date(date);
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatDaysRemaining = (targetDateString: string): string => {
  const targetDate = new Date(targetDateString);
  const today = new Date();
  
  // Reset time to avoid time zone issues
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'jour' : 'jours'}`;
  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Demain';
  if (diffDays < 7) return `${diffDays} jours`;
  
  // For periods >= 7 days, use more precise date calculations
  let currentDate = new Date(today);
  let weeks = 0;
  let months = 0;
  let years = 0;
  
  // Count full years
  while (true) {
    const nextYear = new Date(currentDate);
    nextYear.setFullYear(currentDate.getFullYear() + 1);
    if (nextYear <= targetDate) {
      years++;
      currentDate = nextYear;
    } else {
      break;
    }
  }
  
  // Count full months
  while (true) {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(currentDate.getMonth() + 1);
    if (nextMonth <= targetDate) {
      months++;
      currentDate = nextMonth;
    } else {
      break;
    }
  }
  
  // Count remaining weeks
  while (true) {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(currentDate.getDate() + 7);
    if (nextWeek <= targetDate) {
      weeks++;
      currentDate = nextWeek;
    } else {
      break;
    }
  }
  
  // Calculate remaining days
  const remainingDays = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Return the most significant unit
  if (years > 0) {
    if (years === 1) return '1 an';
    if (years === 2) return '2 ans';
    return `${years} ans`;
  }
  
  if (months > 0) {
    if (months === 1) return '1 mois';
    return `${months} mois`;
  }
  
  if (weeks > 0) {
    if (weeks === 1) return '1 semaine';
    return `${weeks} semaines`;
  }
  
  // If we have remaining days after counting weeks/months/years
  if (remainingDays > 0) {
    return `${remainingDays} ${remainingDays === 1 ? 'jour' : 'jours'}`;
  }
  
  // Fallback (should not happen)
  return `${diffDays} jours`;
};
