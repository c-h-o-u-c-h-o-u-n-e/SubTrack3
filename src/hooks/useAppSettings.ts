import { useState, useEffect } from 'react';

interface AppSettings {
  language: 'fr' | 'en' | 'es';
  currency: string;
  notifications: {
    upcomingPayments: boolean;
    trialEnding: boolean;
    subscriptionExpiring: boolean;
    advanceDays: '3' | '7' | '14' | '30';
  };
  display: {
    showLogos: boolean;
    categoryFolders: boolean;
  };
  paymentMethods: {
    cash: boolean;
    credit_card: boolean;
    debit_card: boolean;
    prepaid_card: boolean;
    crypto: boolean;
    digital_wallet: boolean;
    bank_transfer: boolean;
    check: boolean;
  };
}

const defaultSettings: AppSettings = {
  language: 'fr',
  currency: '$',
  notifications: {
    upcomingPayments: true,
    trialEnding: true,
    subscriptionExpiring: true,
    advanceDays: '7'
  },
  display: {
    showLogos: true,
    categoryFolders: true
  },
  paymentMethods: {
    cash: true,
    credit_card: true,
    debit_card: true,
    prepaid_card: true,
    check: true,
    crypto: true,
    digital_wallet: true,
    bank_transfer: true
  }
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          // Merge with default settings to ensure all properties exist
          const mergedSettings = {
            ...defaultSettings,
            ...parsedSettings,
            notifications: {
              ...defaultSettings.notifications,
              ...parsedSettings.notifications
            },
            display: {
              ...defaultSettings.display,
              ...parsedSettings.display
            },
            paymentMethods: {
              ...defaultSettings.paymentMethods,
              ...parsedSettings.paymentMethods
            }
          };
          setSettings(mergedSettings);
        } catch (error) {
          console.error('Error loading app settings:', error);
          setSettings(defaultSettings);
        }
      }
    };

    loadSettings();

    // Listen for settings changes
    const handleSettingsChange = () => {
      loadSettings();
    };

    window.addEventListener('settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange);
    };
  }, []);

  return settings;
};

// Function to get current currency setting
export const getCurrentCurrency = (): string => {
  try {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.currency || '$';
    }
  } catch (error) {
    console.error('Error getting current currency:', error);
  }
  return '$';
};

// Function to get enabled payment methods
export const getEnabledPaymentMethods = (): string[] => {
  try {
    // First try to get from PaymentMethodManager settings
    const paymentMethodSettings = localStorage.getItem('paymentMethodSettings');
    if (paymentMethodSettings) {
      const settings = JSON.parse(paymentMethodSettings);
      return Object.entries(settings)
        .filter(([, method]: [string, { enabled: boolean }]) => method.enabled)
        .map(([key]) => key);
    }
    
    // Fallback to app settings
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      // Merge with default payment methods to ensure all properties exist
      const defaultPaymentMethods = {
        cash: true,
        credit_card: true,
        debit_card: true,
        prepaid_card: true,
        check: true,
        crypto: true,
        digital_wallet: true,
        bank_transfer: true
      };
      
      const paymentMethods = {
        ...defaultPaymentMethods,
        ...settings.paymentMethods
      };
      
      return Object.entries(paymentMethods)
        .filter(([, enabled]) => enabled)
        .map(([method]) => method);
    }
  } catch (error) {
    console.error('Error getting enabled payment methods:', error);
  }
  // Return all methods by default
  return ['cash', 'credit_card', 'debit_card', 'prepaid_card', 'check', 'crypto', 'digital_wallet', 'bank_transfer'];
};
