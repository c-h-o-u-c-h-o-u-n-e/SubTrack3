// Interface pour les modes de paiement
export interface PaymentMethodSettings {
  [key: string]: {
    label: string;
    enabled: boolean;
    isDefault: boolean;
  };
}

// Modes de paiement par défaut
export const defaultPaymentMethodSettings: PaymentMethodSettings = {
  cash: { label: 'Argent comptant', enabled: true, isDefault: true },
  credit_card: { label: 'Carte de crédit', enabled: true, isDefault: true },
  debit_card: { label: 'Carte de débit', enabled: true, isDefault: true },
  prepaid_card: { label: 'Carte prépayée', enabled: true, isDefault: true },
  check: { label: 'Chèque', enabled: true, isDefault: true },
  crypto: { label: 'Cryptomonnaie', enabled: true, isDefault: true },
  digital_wallet: { label: 'Portefeuille numérique', enabled: true, isDefault: true },
  bank_transfer: { label: 'Virement bancaire', enabled: true, isDefault: true }
};

// Fonction pour obtenir les modes de paiement depuis le localStorage
export const getPaymentMethodSettings = (): PaymentMethodSettings => {
  try {
    const stored = localStorage.getItem('paymentMethodSettings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres de modes de paiement:', error);
  }
  return defaultPaymentMethodSettings;
};

// Fonction pour sauvegarder les paramètres de modes de paiement
export const savePaymentMethodSettings = (settings: PaymentMethodSettings): void => {
  try {
    localStorage.setItem('paymentMethodSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres de modes de paiement:', error);
  }
};

// Fonction pour obtenir les modes de paiement activés uniquement
export const getEnabledPaymentMethods = (): PaymentMethodSettings => {
  const allSettings = getPaymentMethodSettings();
  const enabledSettings: PaymentMethodSettings = {};
  
  Object.entries(allSettings).forEach(([key, value]) => {
    if (value.enabled) {
      enabledSettings[key] = value;
    }
  });
  
  return enabledSettings;
};

// Fonction pour obtenir les labels de tous les modes de paiement
export const getPaymentMethodLabels = (): { [key: string]: string } => {
  const settings = getPaymentMethodSettings();
  const labels: { [key: string]: string } = {};
  
  Object.entries(settings).forEach(([key, value]) => {
    labels[key] = value.label;
  });
  
  return labels;
};
