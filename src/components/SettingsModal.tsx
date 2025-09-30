import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faGlobe, faDatabase, faDownload, faUpload, faDesktop, faRotateLeft, faGear, faCreditCard, faFolderOpen, faPlus, faEye, faEyeSlash, faPenToSquare, faTrash, faExclamationTriangle, faCheck, faUser, faEnvelope, faLock, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { CustomSelect, CustomCheckbox } from './ui';
import { getCategorySettings, saveCategorySettings, defaultCategorySettings } from '../utils/subscriptionUtils';
import { getPaymentMethodSettings, savePaymentMethodSettings, defaultPaymentMethodSettings } from '../utils/paymentMethodUtils'; // Assuming paymentMethodUtils exists

interface Subscription {
  id: string;
  name: string;
  category?: string;
  paymentMethod?: string;
  // Autres propriétés d'un abonnement
}

interface SettingsModalProps {
  onClose: () => void;
  initialSection?: string;
}

interface AppSettings {
  language: 'fr' | 'en' | 'es';
  currency: string;
  numberFormat: {
    thousandsSeparator: 'none' | 'space' | 'comma' | 'dot';
    decimalSeparator: 'dot' | 'comma';
  };
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

interface PaymentMethodSettings {
  [key: string]: {
    label: string;
    enabled: boolean;
    isDefault: boolean;
  };
}

// Fonction pour formater les montants selon les paramètres
const formatAmountExample = (amount: number, settings: AppSettings): string => {
  // Pour le Yen, pas de décimales
  const isYen = settings.currency === '¥';
  
  // Formater le montant avec ou sans décimales selon la devise
  let formattedAmount = isYen ? Math.round(amount).toString() : amount.toFixed(2);
  const parts = formattedAmount.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : '';
  
  // Formater la partie entière avec le séparateur de milliers
  let formattedIntegerPart = integerPart;
  if (settings.numberFormat.thousandsSeparator !== 'none' && integerPart.length > 3) {
    const thousandsSeparator = 
      settings.numberFormat.thousandsSeparator === 'space' ? ' ' :
      settings.numberFormat.thousandsSeparator === 'comma' ? ',' : '.';
    
    formattedIntegerPart = '';
    for (let i = 0; i < integerPart.length; i++) {
      if (i > 0 && (integerPart.length - i) % 3 === 0) {
        formattedIntegerPart += thousandsSeparator;
      }
      formattedIntegerPart += integerPart[i];
    }
  }
  
  // Appliquer le séparateur décimal (seulement si pas Yen)
  const decimalSeparator = settings.numberFormat.decimalSeparator === 'comma' ? ',' : '.';
  console.log('Decimal separator:', settings.numberFormat.decimalSeparator, decimalSeparator);
  
  // Formater selon la langue (symbole avant/après) et la devise
  let result = '';
  if (isYen) {
    // Pour le Yen, pas de décimales
    if (settings.language === 'en') {
      result = `${settings.currency}${formattedIntegerPart}`;
    } else {
      result = `${formattedIntegerPart} ${settings.currency}`;
    }
  } else {
    // Pour les autres devises, avec décimales
    if (settings.language === 'en') {
      // Anglais: symbole avant le montant sans espace
      result = `${settings.currency}${formattedIntegerPart}${decimalSeparator}${decimalPart}`;
    } else {
      // Français et autres: symbole après le montant avec espace
      result = `${formattedIntegerPart}${decimalSeparator}${decimalPart} ${settings.currency}`;
    }
  }
  
  return result;
};

const defaultSettings: AppSettings = {
  language: 'fr',
  currency: '$',
  numberFormat: {
    thousandsSeparator: 'space',
    decimalSeparator: 'comma'
  },
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
    crypto: true,
    digital_wallet: true,
    bank_transfer: true,
    check: true
  }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, initialSection = 'profile' }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isVisible, setIsVisible] = useState(false);
  const [categorySettings, setCategorySettings] = useState(getCategorySettings());
  const [paymentMethodSettings, setPaymentMethodSettings] = useState(getPaymentMethodSettings());
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newPaymentMethodName, setNewPaymentMethodName] = useState('');
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null);
  const [editingCategoryLabel, setEditingCategoryLabel] = useState('');
  const [editingPaymentMethodKey, setEditingPaymentMethodKey] = useState<string | null>(null);
  const [editingPaymentMethodLabel, setEditingPaymentMethodLabel] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalType, setConfirmModalType] = useState<'categories' | 'paymentMethods' | 'allData'>('categories');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalType, setDeleteModalType] = useState<'category' | 'paymentMethod'>('category');
  const [deleteItemKey, setDeleteItemKey] = useState('');
  const [deleteItemLabel, setDeleteItemLabel] = useState('');

  // Profil utilisateur
  const [profile, setProfile] = useState<{ email: string }>({ email: 'utilisateur@example.com' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const sections = [
    { id: 'profile', label: 'Profil utilisateur', icon: faUser, color: 'text-gruvbox-blue-bright' },
    { id: 'regional', label: 'Paramètres régionaux', icon: faGlobe, color: 'text-gruvbox-purple-bright' },
    { id: 'display', label: 'Paramètres d\'affichage', icon: faDesktop, color: 'text-gruvbox-blue-bright' },
    { id: 'categories', label: 'Catégories', icon: faFolderOpen, color: 'text-gruvbox-orange-bright' },
    { id: 'payment', label: 'Modes de paiement', icon: faCreditCard, color: 'text-gruvbox-green-bright' },
    { id: 'data', label: 'Gestion des données', icon: faDatabase, color: 'text-gruvbox-orange-bright' },
    { id: 'reset', label: 'Réinitialisation', icon: faRotateLeft, color: 'text-gruvbox-red-bright' }
  ];

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  // Animation d'entrée
  useEffect(() => {
    document.body.classList.add('modal-open');
    setIsVisible(true);
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Délai pour l'animation de sortie
  };

  // Load settings from localStorage
  useEffect(() => {
    const loadAllSettings = () => {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
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
            numberFormat: {
              ...defaultSettings.numberFormat,
              ...parsedSettings.numberFormat
            },
            paymentMethods: {
              ...defaultSettings.paymentMethods,
              ...parsedSettings.paymentMethods
            }
          };
          setSettings(mergedSettings);
        } catch (error) {
          console.error('Error parsing app settings:', error);
          setSettings(defaultSettings);
        }
      }
      setCategorySettings(getCategorySettings());
      setPaymentMethodSettings(getPaymentMethodSettings());

      // Charger le profil utilisateur
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile);
          const newProfile = {
            email: parsedProfile.email || 'utilisateur@example.com'
          };
          setProfile(newProfile);
          setEditedProfile(newProfile);
        } catch {
          const fallback = { email: 'utilisateur@example.com' };
          setProfile(fallback);
          setEditedProfile(fallback);
        }
      } else {
        const defaultProfile = { email: 'utilisateur@example.com' };
        setProfile(defaultProfile);
        setEditedProfile(defaultProfile);
      }
    };

    loadAllSettings();

    const handleSettingsChange = () => {
      loadAllSettings();
    };

    window.addEventListener('settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange);
    };
  }, []);

  const handleSettingChange = (path: string, value: string | boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Assurons-nous que le changement de langue n'affecte pas les séparateurs de décimaux
      // Seules les options sélectionnées dans les paramètres doivent être prises en compte
      if (path === 'language') {
        // Ne pas modifier les formats de nombres lors du changement de langue
        newSettings.numberFormat = { ...prev.numberFormat };
      }
      
      // Si la devise est changée pour le Yen, forcer les paramètres spécifiques
      if (path === 'currency' && value === '¥') {
        // Pour le Yen, forcer l'espace comme séparateur de milliers et pas de décimales
        newSettings.numberFormat = {
          ...newSettings.numberFormat,
          thousandsSeparator: 'space'
        };
      }
      
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setHasChanges(false);
    window.dispatchEvent(new Event('settings-changed'));
    onClose(); // Close the modal after saving
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setCategorySettings(defaultCategorySettings);
    saveCategorySettings(defaultCategorySettings);
    setPaymentMethodSettings(defaultPaymentMethodSettings);
    savePaymentMethodSettings(defaultPaymentMethodSettings);
    setHasChanges(true);
    window.dispatchEvent(new Event('settings-changed'));
  };
  
  const handleResetAllData = () => {
    // Supprimer toutes les données de l'application
    localStorage.removeItem('subscriptions');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('appSettings');
    localStorage.removeItem('categorySettings');
    localStorage.removeItem('paymentMethodSettings');
    
    // Réinitialiser les états
    setSettings(defaultSettings);
    setCategorySettings(defaultCategorySettings);
    setPaymentMethodSettings(defaultPaymentMethodSettings);
    
    setHasChanges(true);
    window.dispatchEvent(new Event('settings-changed'));
    
    // Notification à l'utilisateur
    alert('Toutes les données ont été effacées. L\'application va être rechargée.');
    
    // Recharger l'application après un court délai
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleExportData = () => {
    const subscriptions = localStorage.getItem('subscriptions') || '[]';
    const userProfile = localStorage.getItem('userProfile') || '{}';
    const appSettings = localStorage.getItem('appSettings') || '{}';
    const categorySettings = localStorage.getItem('categorySettings') || '{}';
    const paymentMethodSettings = localStorage.getItem('paymentMethodSettings') || '{}';
    
    const exportData = {
      subscriptions: JSON.parse(subscriptions),
      userProfile: JSON.parse(userProfile),
      appSettings: JSON.parse(appSettings),
      categorySettings: JSON.parse(categorySettings),
      paymentMethodSettings: JSON.parse(paymentMethodSettings),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.subscriptions) {
          localStorage.setItem('subscriptions', JSON.stringify(importData.subscriptions));
        }
        if (importData.userProfile) {
          localStorage.setItem('userProfile', JSON.stringify(importData.userProfile));
        }
        if (importData.appSettings) {
          localStorage.setItem('appSettings', JSON.stringify(importData.appSettings));
          setSettings(importData.appSettings);
        }
        if (importData.categorySettings) {
          localStorage.setItem('categorySettings', JSON.stringify(importData.categorySettings));
          setCategorySettings(importData.categorySettings);
        }
        if (importData.paymentMethodSettings) {
          localStorage.setItem('paymentMethodSettings', JSON.stringify(importData.paymentMethodSettings));
          setPaymentMethodSettings(importData.paymentMethodSettings);
        }
        
        alert('Données importées avec succès ! Rechargez la page pour voir les changements.');
        window.dispatchEvent(new Event('settings-changed'));
      } catch {
        alert('Erreur lors de l\'importation des données. Vérifiez le format du fichier.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const key = newCategoryName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const updatedSettings = {
        ...categorySettings,
        [key]: {
          label: newCategoryName.trim(),
          enabled: true
        }
      };
      setCategorySettings(updatedSettings);
      saveCategorySettings(updatedSettings);
      setNewCategoryName('');
      setHasChanges(true);
      window.dispatchEvent(new Event('settings-changed'));
    }
  };

  const handleToggleCategory = (key: string) => {
    const updatedSettings = {
      ...categorySettings,
      [key]: {
        ...categorySettings[key],
        enabled: !categorySettings[key].enabled
      }
    };
    setCategorySettings(updatedSettings);
    saveCategorySettings(updatedSettings);
    setHasChanges(true);
    window.dispatchEvent(new Event('settings-changed'));
  };

  const handleEditCategory = (key: string) => {
    setEditingCategoryKey(key);
    setEditingCategoryLabel(categorySettings[key].label);
  };

  const handleSaveCategoryEdit = () => {
    if (editingCategoryKey && editingCategoryLabel.trim()) {
      const updatedSettings = {
        ...categorySettings,
        [editingCategoryKey]: {
          ...categorySettings[editingCategoryKey],
          label: editingCategoryLabel.trim()
        }
      };
      setCategorySettings(updatedSettings);
      saveCategorySettings(updatedSettings);
      setEditingCategoryKey(null);
      setEditingCategoryLabel('');
      setHasChanges(true);
      window.dispatchEvent(new Event('settings-changed'));
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryKey(null);
    setEditingCategoryLabel('');
  };

  const handleDeleteCategory = (key: string) => {
    setDeleteModalType('category');
    setDeleteItemKey(key);
    setDeleteItemLabel(categorySettings[key].label);
    setShowDeleteModal(true);
  };

  const handleAddPaymentMethod = () => {
    if (newPaymentMethodName.trim()) {
      const key = newPaymentMethodName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const updatedSettings = {
        ...paymentMethodSettings,
        [key]: {
          label: newPaymentMethodName.trim(),
          enabled: true,
          isDefault: false
        }
      };
      setPaymentMethodSettings(updatedSettings);
      savePaymentMethodSettings(updatedSettings);
      setNewPaymentMethodName('');
      setHasChanges(true);
      window.dispatchEvent(new Event('settings-changed'));
    }
  };

  const handleTogglePaymentMethod = (key: string) => {
    const updatedSettings = {
      ...paymentMethodSettings,
      [key]: {
        ...paymentMethodSettings[key],
        enabled: !paymentMethodSettings[key].enabled
      }
    };
    setPaymentMethodSettings(updatedSettings);
    savePaymentMethodSettings(updatedSettings);
    setHasChanges(true);
    window.dispatchEvent(new Event('settings-changed'));
  };

  const handleEditPaymentMethod = (key: string) => {
    setEditingPaymentMethodKey(key);
    setEditingPaymentMethodLabel(paymentMethodSettings[key].label);
  };

  const handleSavePaymentMethodEdit = () => {
    if (editingPaymentMethodKey && editingPaymentMethodLabel.trim()) {
      const updatedSettings = {
        ...paymentMethodSettings,
        [editingPaymentMethodKey]: {
          ...paymentMethodSettings[editingPaymentMethodKey],
          label: editingPaymentMethodLabel.trim()
        }
      };
      setPaymentMethodSettings(updatedSettings);
      savePaymentMethodSettings(updatedSettings);
      setEditingPaymentMethodKey(null);
      setEditingPaymentMethodLabel('');
      setHasChanges(true);
      window.dispatchEvent(new Event('settings-changed'));
    }
  };

  const handleCancelPaymentMethodEdit = () => {
    setEditingPaymentMethodKey(null);
    setEditingPaymentMethodLabel('');
  };

  const handleDeletePaymentMethod = (key: string) => {
    setDeleteModalType('paymentMethod');
    setDeleteItemKey(key);
    setDeleteItemLabel(paymentMethodSettings[key].label);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    // Récupérer les abonnements
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]') as Subscription[];
    let updatedSubscriptions = [...subscriptions];
    
    if (deleteModalType === 'category') {
      // Mettre à jour les abonnements qui utilisent cette catégorie
      updatedSubscriptions = subscriptions.map(sub => {
        if (sub.category === deleteItemKey) {
          return { ...sub, category: undefined };
        }
        return sub;
      });
      
      // Supprimer la catégorie
      const { [deleteItemKey]: _removed, ...rest } = categorySettings;
      setCategorySettings(rest);
      saveCategorySettings(rest);
    } else {
      // Mettre à jour les abonnements qui utilisent ce mode de paiement
      updatedSubscriptions = subscriptions.map(sub => {
        if (sub.paymentMethod === deleteItemKey) {
          return { ...sub, paymentMethod: undefined };
        }
        return sub;
      });
      
      // Supprimer le mode de paiement
      const { [deleteItemKey]: _removed, ...rest } = paymentMethodSettings;
      setPaymentMethodSettings(rest);
      savePaymentMethodSettings(rest);
    }
    
    // Sauvegarder les abonnements mis à jour
    localStorage.setItem('subscriptions', JSON.stringify(updatedSubscriptions));
    
    setHasChanges(true);
    window.dispatchEvent(new Event('settings-changed'));
    setShowDeleteModal(false);
  };

  const handleToggleAllPaymentMethods = () => {
    const enabledCount = Object.values(paymentMethodSettings).filter(pm => pm.enabled).length;
    const totalCount = Object.keys(paymentMethodSettings).length;
    
    const updatedSettings: Record<string, { label: string; enabled: boolean; isDefault: boolean }> = {};
    Object.keys(paymentMethodSettings).forEach(key => {
      updatedSettings[key] = {
        label: paymentMethodSettings[key].label,
        enabled: enabledCount !== totalCount, // Toggle logic
        isDefault: paymentMethodSettings[key].isDefault
      };
    });
    setPaymentMethodSettings(updatedSettings);
    savePaymentMethodSettings(updatedSettings);
    setHasChanges(true);
    window.dispatchEvent(new Event('settings-changed'));
  };

  const handleResetPaymentMethods = () => {
    setConfirmModalType('paymentMethods');
    setShowConfirmModal(true);
  };

  const handleConfirmReset = () => {
    if (confirmModalType === 'categories') {
      setCategorySettings(defaultCategorySettings);
      saveCategorySettings(defaultCategorySettings);
    } else if (confirmModalType === 'paymentMethods') {
      setPaymentMethodSettings(defaultPaymentMethodSettings);
      savePaymentMethodSettings(defaultPaymentMethodSettings);
    } else if (confirmModalType === 'allData') {
      handleResetAllData();
    }
    setHasChanges(true);
    window.dispatchEvent(new Event('settings-changed'));
    setShowConfirmModal(false);
  };

  // Gestion du profil utilisateur
  const handleSaveUserProfile = () => {
    setProfile(editedProfile);
    localStorage.setItem('userProfile', JSON.stringify(editedProfile));
    setIsEditingProfile(false);
    setHasChanges(true);
    window.dispatchEvent(new Event('settings-changed'));
  };

  const handleCancelUserProfile = () => {
    setEditedProfile(profile);
    setIsEditingProfile(false);
  };

  const handleChangePassword = () => {
    alert('La modification du mot de passe nécessite une intégration backend. Cette fonctionnalité sera disponible avec Supabase.');
  };

  const languageOptions = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' }
  ];

  const currencyOptions = [
    { value: '$', label: 'Dollar' },
    { value: '€', label: 'Euro' },
    { value: '£', label: 'Livre' },
    { value: '¥', label: 'Yen' }
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'regional': {
        return (
          <div className="space-y-4 pr-8">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faGlobe} className="w-5 h-5 text-gruvbox-purple-bright" />
              <h3 className="text-lg font-normal text-gruvbox-fg1">Paramètres régionaux</h3>
            </div>
            
            <hr className="mt-4 mb-6 border-t border-gruvbox-bg1 w-full" />
            
            <div className="flex flex-col space-y-5 pt-2">
              {/* Langue */}
              <div className="flex items-center">
                <label className="text-sm text-gruvbox-fg2 w-48 ml-8">Langue de l'interface</label>
                <CustomSelect
                  options={languageOptions}
                  value={settings.language}
                  onChange={(value) => handleSettingChange('language', value)}
                  className="w-40 text-sm"
                />
              </div>
              {/* Devise */}
              <div className="flex items-center">
                <label className="text-sm text-gruvbox-fg2 w-48 ml-8">Devise</label>
                <CustomSelect
                  options={currencyOptions}
                  value={settings.currency}
                  onChange={(value) => handleSettingChange('currency', value)}
                  className="w-40 text-sm"
                />
              </div>
              
              {/* Format des nombres */}
              <div className="flex items-center">
                <label className="text-sm text-gruvbox-fg2 w-48 ml-8">Séparateur de milliers</label>
                {settings.currency === '¥' ? (
                  <div className="w-40 text-sm px-3 py-2 bg-gruvbox-bg2 text-gruvbox-fg3 rounded-lg">
                    Espace
                  </div>
                ) : (
                  <CustomSelect
                    options={[
                      { value: 'none', label: 'Aucun' },
                      { value: 'space', label: 'Espace' },
                      { value: 'dot', label: 'Point' },
                      { value: 'comma', label: 'Virgule' }
                    ]}
                    value={settings.numberFormat.thousandsSeparator}
                    onChange={(value) => handleSettingChange('numberFormat.thousandsSeparator', value)}
                    className="w-40 text-sm"
                  />
                )}
              </div>
              
              {/* Séparateur décimal */}
              <div className="flex items-center">
                <label className="text-sm text-gruvbox-fg2 w-48 ml-8">Séparateur décimal</label>
                {settings.currency === '¥' ? (
                  <div className="w-40 text-sm px-3 py-2 bg-gruvbox-bg2 text-gruvbox-fg3 rounded-lg">
                      Non applicable
                  </div>
                ) : (
                  <CustomSelect
                    options={[
                      { value: 'dot', label: 'Point' },
                      { value: 'comma', label: 'Virgule' }
                    ]}
                    value={settings.numberFormat.decimalSeparator}
                    onChange={(value) => handleSettingChange('numberFormat.decimalSeparator', value)}
                    className="w-40 text-sm"
                  />
                )}
              </div>
              
            {/* Exemple de formatage des montants */}
              <div className="mt-6 p-4 ml-4 bg-gruvbox-bg1 rounded-lg" style={{ width: '384px' }}>
                <div className="flex items-center">
                  <span className="text-sm text-gruvbox-fg3 w-48">Exemple</span>
                  <span className="text-lg ml-3 font-medium text-gruvbox-fg1">
                    {formatAmountExample(8765.43, settings)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'display': {
        return (
          <div className="space-y-4 pr-8">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faDesktop} className="w-5 h-5 text-gruvbox-blue-bright" />
              <h3 className="text-lg font-normal text-gruvbox-fg1">Paramètres d'affichage</h3>
            </div>
            
            <hr className="border-t border-gruvbox-bg1 w-full" />
            
            <div className="space-y-4 ml-8">
              {/* Interface utilisateur */}
              <div className="space-y-3">
                <h4 className="text-md font-normal text-gruvbox-fg2">Interface utilisateur</h4>
                <CustomCheckbox
                  checked={settings.display.showLogos}
                  onChange={(checked) => handleSettingChange('display.showLogos', checked)}
                  label="Afficher les logos des services"
                />
                <CustomCheckbox
                  checked={settings.display.categoryFolders}
                  onChange={(checked) => handleSettingChange('display.categoryFolders', checked)}
                  label="Utiliser l'abécédaire pour les filtres de catégories"
                />
              </div>
              
              <hr className="border-t border-gruvbox-bg1" />
              
              {/* Notifications */}
              <div className="space-y-3">
                <h4 className="text-md font-normal text-gruvbox-fg2">Notifications</h4>
                <div className="space-y-2">
                  <CustomCheckbox
                    checked={settings.notifications.upcomingPayments}
                    onChange={(checked) => handleSettingChange('notifications.upcomingPayments', checked)}
                    label="Paiement à venir bientôt"
                  />
                  <CustomCheckbox
                    checked={settings.notifications.trialEnding}
                    onChange={(checked) => handleSettingChange('notifications.trialEnding', checked)}
                    label="Fin de la période d'essai"
                  />
                  <CustomCheckbox
                    checked={settings.notifications.subscriptionExpiring}
                    onChange={(checked) => handleSettingChange('notifications.subscriptionExpiring', checked)}
                    label="L'abonnement arrive à terme"
                  />
                </div>
                <div className="pt-1">
                  <div className="flex items-center">
                    <label className="text-sm text-gruvbox-fg2 w-48">Délai de notification</label>
                    <CustomSelect
                      options={[
                        { value: '3', label: '3 jours' },
                        { value: '7', label: '1 semaine' },
                        { value: '14', label: '2 semaines' },
                        { value: '30', label: '1 mois' }
                      ]}
                      value={settings.notifications.advanceDays}
                      onChange={(value) => handleSettingChange('notifications.advanceDays', value)}
                      className="w-40 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'profile': {
        return (
          <div className="space-y-4 pr-8">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-gruvbox-blue-bright" />
              <h3 className="text-lg font-normal text-gruvbox-fg1">Profil utilisateur</h3>
            </div>
            
            <hr className="mt-4 mb-6 border-t border-gruvbox-bg1 w-full" />
            
            <div className="ml-0 pt-2 space-y-5">
              <div className="flex items-center">
                <label className="text-sm text-gruvbox-fg2 w-48 ml-8">Courriel</label>
                <div className="flex items-center space-x-2 px-3 py-2 bg-gruvbox-bg1 rounded-lg w-[384px]">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gruvbox-fg3" />
                  <span className="text-gruvbox-fg1">{profile.email}</span>
                </div>
              </div>

              <div className="flex items-center">
                <label className="text-sm text-gruvbox-fg2 w-48 ml-8">Mot de passe</label>
                <div className="flex items-center justify-between px-3 py-2 bg-gruvbox-bg1 rounded-lg w-[384px]">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faLock} className="w-4 h-4 text-gruvbox-fg3" />
                    <span className="text-gruvbox-fg1">••••••••</span>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="text-sm text-gruvbox-blue-bright hover:text-gruvbox-blue transition-colors focus:outline-none"
                  >
                    Modifier
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      }

      case 'categories': {
        const enabledCategoryCount = Object.values(categorySettings).filter(cat => cat.enabled).length;
        const totalCategoryCount = Object.keys(categorySettings).length;
        const allCategoriesEnabled = enabledCategoryCount === totalCategoryCount;

        return (
          <div className="flex flex-col h-full pr-8">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faFolderOpen} className="w-5 h-5 text-gruvbox-orange-bright" />
              <h3 className="text-lg font-normal text-gruvbox-fg1">Gestion des catégories</h3>
            </div>

            <hr className="mt-4 mb-[22px] border-t border-gruvbox-bg1 w-full" />

            <div className="ml-8 flex flex-col flex-1 space-y-5">
              {/* Option pour les dossiers alphabétiques */}
              <div className="mb-2">
                <CustomCheckbox
                  checked={settings.display.categoryFolders}
                  onChange={(checked) => handleSettingChange('display.categoryFolders', checked)}
                  label="Utiliser l'abécédaire pour les filtres de catégories"
                />
              </div>

              {/* Formulaire d'ajout de catégorie */}
              <div className="relative">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Créer une nouvelle catégorie"
                  className="w-full px-4 py-3 pr-12 bg-gruvbox-bg1 text-gruvbox-fg1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-gruvbox-orange-bright placeholder-gruvbox-fg4"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className={`absolute inset-y-0 right-0 flex items-center justify-center w-12 rounded-r-lg transition-colors focus:outline-none ${
                    newCategoryName.trim()
                      ? 'text-gruvbox-fg0 bg-gruvbox-orange hover:bg-gruvbox-orange-bright'
                      : 'text-gruvbox-fg4 bg-gruvbox-bg2'
                  }`}
                  title={newCategoryName.trim() ? "Ajouter la catégorie" : "Saisissez un nom de catégorie"}
                >
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                </button>
              </div>

              {/* Actions globales */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    const updatedSettings: Record<string, { enabled: boolean; label: string }> = {};
                    Object.keys(categorySettings).forEach(key => {
                      updatedSettings[key] = { ...categorySettings[key], enabled: !allCategoriesEnabled };
                    });
                    setCategorySettings(updatedSettings);
                    saveCategorySettings(updatedSettings);
                    setHasChanges(true);
                    window.dispatchEvent(new Event('settings-changed'));
                  }}
                  className={`px-4 py-3 text-xs text-gruvbox-bg1 rounded-lg transition-colors w-40 ${
                    allCategoriesEnabled
                      ? 'bg-gruvbox-yellow hover:bg-gruvbox-yellow-bright'
                      : 'bg-gruvbox-green hover:bg-gruvbox-green-bright'
                  }`}
                >
                  {allCategoriesEnabled ? 'Tout désactiver' : 'Tout activer'}
                </button>
                <button
                  onClick={() => {
                    setConfirmModalType('categories');
                    setShowConfirmModal(true);
                  }}
                  className="px-4 py-3 text-xs text-gruvbox-fg1 bg-gruvbox-orange hover:bg-orange-bright rounded-lg transition-colors"
                >
                  Catégories par défaut
                </button>
              </div>

              {/* Compteur de catégories */}
              <div className="text-right">
                <span className="text-sm text-gruvbox-fg3">
                  {enabledCategoryCount} catégories sur {totalCategoryCount} activées
                </span>
              </div>

              {/* Liste des catégories actives */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="space-y-3 pb-5">
                  {Object.entries(categorySettings)
                    .filter(([, category]) => category.enabled)
                    .sort(([, a], [, b]) => a.label.localeCompare(b.label))
                    .map(([key, category]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-2 rounded-lg transition-colors bg-gruvbox-bg1 hover:bg-gruvbox-bg2 transform transition-all duration-300 ease-in-out"
                    >
                      <div className="flex items-center justify-between w-full">
                        {editingCategoryKey === key ? (
                          <input
                            type="text"
                            value={editingCategoryLabel}
                            onChange={(e) => setEditingCategoryLabel(e.target.value)}
                            className="flex-1 bg-transparent text-gruvbox-fg1 border-0 focus:outline-none focus:ring-0 font-normal"
                            style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
                            autoFocus
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveCategoryEdit()}
                          />
                        ) : (
                          <span className="text-sm font-normal text-gruvbox-fg1">{category.label}</span>
                        )}

                        <div className="flex items-center space-x-2">
                          {editingCategoryKey === key ? (
                            <>
                              <button
                                onClick={handleSaveCategoryEdit}
                                className="p-1 text-gruvbox-green hover:text-gruvbox-green-bright transition-colors focus:outline-none"
                                title="Sauvegarder"
                              >
                                <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelCategoryEdit}
                                className="p-1 text-gruvbox-red hover:text-gruvbox-red-bright transition-colors focus:outline-none"
                                title="Annuler"
                              >
                                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleToggleCategory(key)}
                                className="p-1 text-gruvbox-green hover:text-gruvbox-green-bright transition-colors focus:outline-none"
                                title="Désactiver"
                              >
                                <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditCategory(key)}
                                className="p-1 text-gruvbox-blue hover:text-gruvbox-blue-bright transition-colors focus:outline-none"
                                title="Modifier"
                              >
                                <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(key)}
                                className="p-1 text-gruvbox-red hover:text-gruvbox-red-bright transition-colors focus:outline-none"
                                title="Supprimer"
                              >
                                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liste des catégories désactivées */}
              {Object.values(categorySettings).some(cat => !cat.enabled) && (
                <div className="pb-6">
                  <hr className="my-5 border-t border-gruvbox-bg1" />
                  <div className="space-y-3">
                    {Object.entries(categorySettings)
                      .filter(([, category]) => !category.enabled)
                      .sort(([, a], [, b]) => a.label.localeCompare(b.label))
                      .map(([key, category]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between px-4 py-2 rounded-lg transition-colors bg-gruvbox-bg0-soft hover:bg-gruvbox-bg1 transform transition-all duration-300 ease-in-out"
                      >
                        <div className="flex items-center justify-between w-full">
                          {editingCategoryKey === key ? (
                            <input
                              type="text"
                              value={editingCategoryLabel}
                              onChange={(e) => setEditingCategoryLabel(e.target.value)}
                              className="flex-1 bg-transparent text-gruvbox-fg1 border-0 focus:outline-none focus:ring-0 font-normal"
                              style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
                              autoFocus
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveCategoryEdit()}
                            />
                          ) : (
                            <span className="text-sm font-normal text-gruvbox-fg3">{category.label}</span>
                          )}

                          <div className="flex items-center space-x-2">
                            {editingCategoryKey === key ? (
                              <>
                                <button
                                  onClick={handleSaveCategoryEdit}
                                  className="p-1 text-gruvbox-green hover:text-gruvbox-green-bright transition-colors focus:outline-none"
                                  title="Sauvegarder"
                                >
                                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelCategoryEdit}
                                  className="p-1 text-gruvbox-red hover:text-gruvbox-red-bright transition-colors focus:outline-none"
                                  title="Annuler"
                                >
                                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleCategory(key)}
                                  className="p-1 text-gruvbox-red hover:text-gruvbox-red-bright transition-colors focus:outline-none"
                                  title="Activer"
                                >
                                  <FontAwesomeIcon icon={faEyeSlash} className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditCategory(key)}
                                  className="p-1 text-gruvbox-blue hover:text-gruvbox-blue-bright transition-colors focus:outline-none"
                                  title="Modifier"
                                >
                                  <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(key)}
                                  className="p-1 text-gruvbox-red hover:text-gruvbox-red-bright transition-colors focus:outline-none"
                                  title="Supprimer"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'payment': {
        const enabledPaymentMethodCount = Object.values(paymentMethodSettings).filter(pm => pm.enabled).length;
        const totalPaymentMethodCount = Object.keys(paymentMethodSettings).length;
        const allPaymentMethodsEnabled = enabledPaymentMethodCount === totalPaymentMethodCount;

        return (
           <div className="flex flex-col h-full pr-8">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-gruvbox-green-bright" />
              <h3 className="text-lg font-normal text-gruvbox-fg1">Gestion des modes de paiement</h3>
            </div>
            
            <hr className="mt-4 mb-6 border-t border-gruvbox-bg1 w-full" />
            
            <div className="ml-8 flex flex-col flex-1 space-y-5 pb-6">
              {/* Formulaire d'ajout de mode de paiement */}
              <div className="relative">
                <input
                  type="text"
                  value={newPaymentMethodName}
                  onChange={(e) => setNewPaymentMethodName(e.target.value)}
                  placeholder="Créer un nouveau mode de paiement"
                  className="w-full px-4 py-3 pr-12 bg-gruvbox-bg1 text-gruvbox-fg1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-gruvbox-green-bright placeholder-gruvbox-fg4"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPaymentMethod()}
                />
                <button
                  onClick={handleAddPaymentMethod}
                  disabled={!newPaymentMethodName.trim()}
                  className={`absolute inset-y-0 right-0 flex items-center justify-center w-12 rounded-r-lg transition-colors focus:outline-none ${
                    newPaymentMethodName.trim()
                      ? 'text-gruvbox-fg0 bg-gruvbox-green hover:bg-gruvbox-green-bright'
                      : 'text-gruvbox-fg4 bg-gruvbox-bg2'
                  }`}
                  title={newPaymentMethodName.trim() ? "Ajouter le mode de paiement" : "Saisissez un nom de mode de paiement"}
                >
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                </button>
              </div>

              {/* Actions globales */}
              <div className="flex justify-between items-center">
                <button 
                  onClick={handleToggleAllPaymentMethods}
                  className={`px-4 py-3 text-xs text-gruvbox-bg0 rounded-lg transition-colors w-40 ${
                    allPaymentMethodsEnabled
                      ? 'bg-gruvbox-yellow hover:bg-gruvbox-yellow-bright'
                      : 'bg-gruvbox-green hover:bg-gruvbox-green-bright'
                  }`}
                >
                  {allPaymentMethodsEnabled ? 'Tout désactiver' : 'Tout activer'}
                </button>
                <button 
                  onClick={handleResetPaymentMethods}
                  className="px-4 py-3 text-xs text-gruvbox-fg1 bg-gruvbox-orange hover:bg-gruvbox-orange-bright rounded-lg transition-colors"
                >
                  Modes par défaut
                </button>
              </div>

              {/* Compteur de modes de paiement */}
              <div className="text-right">
                <span className="text-sm text-gruvbox-fg3">
                  {enabledPaymentMethodCount} modes de paiement sur {totalPaymentMethodCount} activés
                </span>
              </div>

              {/* Liste des modes de paiement actifs */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="space-y-3 pb-5">
                  {Object.entries(paymentMethodSettings)
                    .filter(([, paymentMethod]) => paymentMethod.enabled)
                    .sort(([, a], [, b]) => a.label.localeCompare(b.label))
                    .map(([key, paymentMethod]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-2 rounded-lg transition-colors bg-gruvbox-bg1 hover:bg-gruvbox-bg2 transform transition-all duration-300 ease-in-out"
                    >
                      <div className="flex items-center justify-between w-full">
                        {editingPaymentMethodKey === key ? (
                          <input
                            type="text"
                            value={editingPaymentMethodLabel}
                            onChange={(e) => setEditingPaymentMethodLabel(e.target.value)}
                            className="flex-1 bg-transparent text-gruvbox-fg1 border-0 focus:outline-none focus:ring-0 font-normal"
                            style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
                            autoFocus
                            onKeyPress={(e) => e.key === 'Enter' && handleSavePaymentMethodEdit()}
                          />
                        ) : (
                          <span className="text-sm font-normal text-gruvbox-fg1">{paymentMethod.label}</span>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          {editingPaymentMethodKey === key ? (
                            <>
                              <button
                                onClick={handleSavePaymentMethodEdit}
                                className="p-1 text-gruvbox-green hover:text-gruvbox-green-bright transition-colors focus:outline-none"
                                title="Sauvegarder"
                              >
                                <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelPaymentMethodEdit}
                                className="p-1 text-gruvbox-red hover:text-gruvbox-red-bright transition-colors focus:outline-none"
                                title="Annuler"
                              >
                                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleTogglePaymentMethod(key)}
                                className="p-1 text-gruvbox-green hover:text-gruvbox-green-bright transition-colors focus:outline-none"
                                title="Désactiver"
                              >
                                <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditPaymentMethod(key)}
                                className="p-1 text-gruvbox-blue hover:text-gruvbox-blue-bright transition-colors focus:outline-none"
                                title="Modifier"
                              >
                                <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePaymentMethod(key)}
                                className="p-1 text-gruvbox-red hover:text-gruvbox-red-bright transition-colors focus:outline-none"
                                title="Supprimer"
                              >
                                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Liste des modes de paiement désactivés */}
              {Object.values(paymentMethodSettings).some(pm => !pm.enabled) && (
                <div className="pb-5">
                  <hr className="my-5 border-t border-gruvbox-bg1" />
                  <div className="space-y-3">
                    {Object.entries(paymentMethodSettings)
                      .filter(([, paymentMethod]) => !paymentMethod.enabled)
                      .sort(([, a], [, b]) => a.label.localeCompare(b.label))
                      .map(([key, paymentMethod]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between px-4 py-2 rounded-lg transition-colors bg-gruvbox-bg0-soft hover:bg-gruvbox-bg1 transform transition-all duration-300 ease-in-out"
                      >
                        <div className="flex items-center justify-between w-full">
                          {editingPaymentMethodKey === key ? (
                            <input
                              type="text"
                              value={editingPaymentMethodLabel}
                              onChange={(e) => setEditingPaymentMethodLabel(e.target.value)}
                              className="flex-1 bg-transparent text-gruvbox-fg1 border-0 focus:outline-none focus:ring-0 font-normal"
                              style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
                              autoFocus
                              onKeyPress={(e) => e.key === 'Enter' && handleSavePaymentMethodEdit()}
                            />
                          ) : (
                            <span className="text-sm font-normal text-gruvbox-fg3">{paymentMethod.label}</span>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            {editingPaymentMethodKey === key ? (
                              <>
                                <button
                                  onClick={handleSavePaymentMethodEdit}
                                  className="p-1 text-gruvbox-green hover:text-gruvbox-green-bright transition-colors focus:outline-none"
                                  title="Sauvegarder"
                                >
                                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelPaymentMethodEdit}
                                  className="p-1 text-gruvbox-red hover:text-gruvbox-red-bright transition-colors focus:outline-none"
                                  title="Annuler"
                                >
                                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleTogglePaymentMethod(key)}
                                  className="p-1 text-gruvbox-red hover:text-gruvbox-red-bright transition-colors focus:outline-none"
                                  title="Activer"
                                >
                                  <FontAwesomeIcon icon={faEyeSlash} className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditPaymentMethod(key)}
                                  className="p-1 text-gruvbox-blue hover:text-gruvbox-blue-bright transition-colors focus:outline-none"
                                  title="Modifier"
                                >
                                  <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePaymentMethod(key)}
                                  className="p-1 text-gruvbox-red hover:text-gruvbox-red-bright transition-colors focus:outline-none"
                                  title="Supprimer"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'data': {
        return (
          <div className="space-y-4 pr-8">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faDatabase} className="w-5 h-5 text-gruvbox-orange-bright" />
              <h3 className="text-lg font-normal text-gruvbox-fg1">Gestion des données</h3>
            </div>
            
            <hr className="mt-4 mb-6 border-t border-gruvbox-bg1 w-full" />
            
            <div className="ml-8 space-y-6">
              <div className="space-y-3">
                <h4 className="text-md font-normal text-gruvbox-fg2">Exporter les données</h4>
                <p className="text-xs text-gruvbox-fg3 line">
                  Exportez vos données dans un fichier JSON.</p>
                  <p className="text-xs text-gruvbox-fg3 pb-4 line">
                  Utilisez le fichier exporté pour restaurer vos données.
                </p>
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-normal text-gruvbox-bg0 bg-gruvbox-green rounded-lg hover:bg-gruvbox-green-bright transition-colors focus:outline-none w-40"
                >
                  <FontAwesomeIcon icon={faDownload} className="w-4 h-4"/>
                  <span>Sauvegarder</span>
                </button>
              </div>
              
              <hr className="my-6 border-t border-gruvbox-bg1" />
              
              <div className="space-y-4">
                <h4 className="text-md font-normal text-gruvbox-fg2">Importer les données</h4>
                <p className="text-xs text-gruvbox-fg3 line">
                  Importez un fichier JSON précédemment exporté.
                </p>
                    <p className="text-xs text-gruvbox-fg3 pb-4 line">
                  Toutes vos données actuelles seront écrasées.
                </p>
                <label className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-normal text-gruvbox-bg0 bg-gruvbox-yellow rounded-lg hover:bg-gruvbox-yellow-bright transition-colors focus:outline-none cursor-pointer w-40">
                  <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
                  <span>Restaurer</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        );
      }

      case 'reset': {
        return (
          <div className="space-y-4 pr-8">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faRotateLeft} className="w-5 h-5 text-gruvbox-red-bright" />
              <h3 className="text-lg font-normal text-gruvbox-fg1">Réinitialisation</h3>
            </div>
            
            <hr className="mt-4 mb-6 border-t border-gruvbox-bg1 w-full" />
            
            <div className="ml-8 space-y-6">
              <div className="space-y-3">
                <h4 className="text-md font-normal text-gruvbox-fg2">Réinitialiser les paramètres</h4>
                <p className="text-xs text-gruvbox-fg3 line">
                  Revenez aux paramètres par défaut de l'application.
                </p>
                <p className="text-xs text-gruvbox-fg3 pb-4 line">
                  Cette action ne supprime pas vos abonnements.
                </p>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-normal text-gruvbox-fg1 bg-gruvbox-orange rounded-lg hover:bg-gruvbox-orange-bright transition-colors focus:outline-none w-40"
                >
                  <FontAwesomeIcon icon={faRotateLeft} className="w-4 h-4" />
                  <span>Réinitialiser</span>
                </button>
              </div>
              
              <hr className="my-6 border-t border-gruvbox-bg1" />
              
              <div className="space-y-4">
                <h4 className="text-md font-normal text-gruvbox-fg2">Tout effacer et repartir à zéro</h4>
                <p className="text-xs text-gruvbox-fg3 line">
                  Supprimez toutes les données de l'application.
                </p>
                <p className="text-xs text-gruvbox-fg3 pb-4 line">
                  Pensez à exporter vos données avant de procéder.
                </p>
                <button
                  onClick={() => {
                    setConfirmModalType('allData');
                    setShowConfirmModal(true);
                  }}
                  className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-normal text-gruvbox-fg1 bg-gruvbox-red rounded-lg hover:bg-gruvbox-red-bright transition-colors focus:outline-none w-40"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  <span>Tout supprimer</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <div
        className={`fixed inset-y-0 left-0 w-full md:w-3/5 lg:w-1/2 xl:w-2/5 bg-gruvbox-bg0 text-gruvbox-fg1 shadow-xl z-50 transition-transform duration-300 transform ${
          isVisible ? 'translate-x-0' : 'translate-x-[-100%]'
        } flex flex-col modal-container`}
      >
        <div className="relative p-4 border-b border-gruvbox-bg1 bg-gruvbox-green-bright">
          {/* Matte overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          
          {/* Gradient overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, rgba(22, 24, 25, 0.4) 0%, rgba(22, 24, 25, 0.6) 50%, rgba(22, 24, 25, 0.4) 100%)`
            }}
          ></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faGear} className="w-5 h-5 text-gruvbox-fg0" />
              <h2 className="text-xl font-normal text-gruvbox-fg0">Paramètres</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gruvbox-fg0 hover:text-gruvbox-fg1 transition-colors focus:outline-none"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gruvbox-bg1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
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
          
          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            {renderSectionContent()}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gruvbox-bg1 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-normal text-gruvbox-fg2 bg-gruvbox-bg1 rounded-lg hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 text-sm font-normal text-gruvbox-fg0 rounded-lg transition-colors focus:outline-none ${
              hasChanges
                ? 'bg-gruvbox-blue hover:bg-gruvbox-blue-bright'
                : 'bg-gruvbox-bg2 text-gruvbox-fg3'
            }`}
            disabled={!hasChanges}
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-gruvbox-bg0 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-gruvbox-orange-bright" />
              <h3 className="text-lg font-normal text-gruvbox-fg0">Confirmation</h3>
            </div>
      <p className="text-sm text-gruvbox-fg2 mb-2">
        {confirmModalType === 'categories'
          ? "Êtes-vous sûr de vouloir réinitialiser toutes les catégories ?"
          : confirmModalType === 'paymentMethods'
          ? "Êtes-vous sûr de vouloir réinitialiser tous les modes de paiement ?"
          : "Êtes-vous sûr de vouloir effacer TOUTES les données de l'application ?"}
      </p>
      <p className="text-sm text-gruvbox-fg2 mb-6">
        {confirmModalType === 'allData' 
          ? "Cette action est irréversible et supprimera tous vos abonnements, paramètres et données personnelles."
          : "Cette action ne peut pas être annulée."}
      </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-normal text-gruvbox-fg2 bg-gruvbox-bg1 rounded-lg hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 text-sm font-normal text-gruvbox-fg0 bg-gruvbox-red rounded-lg hover:bg-gruvbox-red-bright transition-colors focus:outline-none"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-gruvbox-bg0 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <FontAwesomeIcon icon={faTrash} className="w-6 h-6 text-gruvbox-red-bright" />
              <h3 className="text-lg font-normal text-gruvbox-fg0">Supprimer {deleteModalType === 'category' ? 'la catégorie' : 'le mode de paiement'}</h3>
            </div>
            <p className="text-sm text-gruvbox-fg2 mb-2">
              Êtes-vous sûr de vouloir supprimer {deleteModalType === 'category' ? 'la catégorie' : 'le mode de paiement'} "{deleteItemLabel}" ?
            </p>
            <p className="text-sm text-gruvbox-fg2 mb-6">
              {deleteModalType === 'category' 
                ? "Les abonnements associés à cette catégorie n'auront plus de catégorie assignée."
                : "Les abonnements associés à ce mode de paiement n'auront plus de mode de paiement assigné."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-normal text-gruvbox-fg2 bg-gruvbox-bg1 rounded-lg hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-normal text-gruvbox-fg0 bg-gruvbox-red rounded-lg hover:bg-gruvbox-red-bright transition-colors focus:outline-none"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
