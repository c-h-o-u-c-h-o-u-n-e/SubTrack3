import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faFloppyDisk, faGear, faPlus, faDollarSign, faEuroSign, faSterlingSign, faYenSign } from '@fortawesome/free-solid-svg-icons';
import { Subscription, Category, Frequency, SubscriptionStatus } from '../types/Subscription';
import { getEnabledCategories, frequencyLabels, calculateNextBilling } from '../utils/subscriptionUtils';
import { getCurrentCurrency, getEnabledPaymentMethods, useAppSettings } from '../hooks/useAppSettings';
import { ImageUploader, CustomSelect, CustomDatePicker, CustomCheckbox } from './ui';
import { CategoryManager } from './CategoryManager';

const paymentMethodOptions = [
  { value: 'cash', label: 'Argent comptant' },
  { value: 'credit_card', label: 'Carte de crédit' },
  { value: 'debit_card', label: 'Carte de débit' },
  { value: 'prepaid_card', label: 'Carte prépayée' },
  { value: 'check', label: 'Chèque' },
  { value: 'crypto', label: 'Cryptomonnaie' },
  { value: 'digital_wallet', label: 'Portefeuille numérique' },
  { value: 'bank_transfer', label: 'Virement bancaire' }
];


interface SubscriptionFormProps {
  subscription?: Subscription;
  onSave: (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  subscription,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '' as Category,
    amount: '',
    currency: getCurrentCurrency(),
    frequency: '' as Frequency,
    startDate: '',
    nextBilling: '',
    isTrialPeriod: false,
    trialEndDate: '',
    paymentMethod: '',
    isAutomaticPayment: true,
    url: '',
    logoUrl: '',
    primaryColor: '',
    notes: '',
    status: 'active' as SubscriptionStatus,
    reminderEnabled: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<string[]>([]);
  const settings = useAppSettings();

  // Disable background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        category: subscription.category,
        amount: subscription.amount.toString(),
        currency: getCurrentCurrency(), // Always use the app's current currency setting
        frequency: subscription.frequency,
        startDate: subscription.startDate,
        nextBilling: subscription.nextBilling,
        isTrialPeriod: subscription.isTrialPeriod,
        trialEndDate: subscription.trialEndDate || '',
        paymentMethod: subscription.paymentMethod,
        isAutomaticPayment: subscription.isAutomaticPayment !== undefined ? subscription.isAutomaticPayment : true,
        url: subscription.url || '',
        logoUrl: subscription.logoUrl || '',
        primaryColor: subscription.primaryColor || '',
        notes: subscription.notes || '',
        status: subscription.status,
        reminderEnabled: subscription.reminderEnabled
      });
    }
  }, [subscription]);

  useEffect(() => {
    if (formData.startDate && formData.frequency && !subscription) {
      const nextBilling = calculateNextBilling(formData.startDate, formData.frequency);
      setFormData(prev => ({ ...prev, nextBilling }));
    }
  }, [formData.startDate, formData.frequency, subscription]);

  // Load enabled payment methods and update when settings change
  useEffect(() => {
    const loadEnabledPaymentMethods = () => {
      setEnabledPaymentMethods(getEnabledPaymentMethods());
    };

    loadEnabledPaymentMethods();

    const handleSettingsChange = () => {
      loadEnabledPaymentMethods();
      if (!subscription) {
        const currentCurrency = getCurrentCurrency();
        setFormData(prev => ({ ...prev, currency: currentCurrency }));
      }
    };

    window.addEventListener('settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange);
    };
  }, [subscription]);

  // Get payment method options with custom labels
  const getPaymentMethodOptions = () => {
    try {
      const paymentMethodSettings = localStorage.getItem('paymentMethodSettings');
      if (paymentMethodSettings) {
        const settings = JSON.parse(paymentMethodSettings);
        return Object.entries(settings)
          .filter(([key, _]) => enabledPaymentMethods.includes(key))
          .map(([key, method]: [string, any]) => ({
            value: key,
            label: method.label
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
      }
    } catch (error) {
      console.error('Error loading payment method settings:', error);
    }
    
    // Fallback to default options
    return paymentMethodOptions.filter(option => 
      enabledPaymentMethods.includes(option.value)
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du service est obligatoire';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
    }

    // Le moyen de paiement n'est plus obligatoire

    if (formData.isTrialPeriod && !formData.trialEndDate) {
      newErrors.trialEndDate = 'La date de fin de la période d\'essai est obligatoire';
    }

    if (formData.url && !formData.url.match(/^https?:\/\/.+/)) {
      newErrors.url = 'L\'URL doit commencer par http:// ou https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const subscriptionData = {
      name: formData.name.trim(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      frequency: formData.frequency,
      startDate: formData.startDate,
      nextBilling: formData.nextBilling,
      isTrialPeriod: formData.isTrialPeriod,
      trialEndDate: formData.isTrialPeriod ? formData.trialEndDate : undefined,
      paymentMethod: formData.paymentMethod.trim() || undefined,
      isAutomaticPayment: formData.isAutomaticPayment,
      url: formData.url.trim() || undefined,
      logoUrl: formData.logoUrl || undefined,
      primaryColor: formData.primaryColor || undefined,
      notes: formData.notes.trim() || undefined,
      status: formData.status,
      reminderEnabled: formData.reminderEnabled
    };

    onSave(subscriptionData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoChange = (imageUrl: string, primaryColor?: string) => {
    setFormData(prev => ({ 
      ...prev, 
      logoUrl: imageUrl,
      primaryColor: primaryColor || ''
    }));
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case '$':
        return faDollarSign;
      case '€':
        return faEuroSign;
      case '£':
        return faSterlingSign;
      case '¥':
        return faYenSign;
      default:
        return faDollarSign;
    }
  };

  return (
    <div className="fixed inset-0 bg-gruvbox-bg0-hard bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="custom-scrollbar max-w-2xl w-full" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="bg-gruvbox-bg0 rounded-xl shadow-xl">
        <div className="p-4 rounded-t-xl relative bg-gruvbox-blue">
          {/* Matte overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-t-xl"></div>
          
          {/* Gradient overlay */}
          <div 
            className="absolute inset-0 rounded-t-xl"
            style={{
              background: `linear-gradient(to right, rgba(22, 24, 25, 0.4) 0%, rgba(22, 24, 25, 0.6) 50%, rgba(22, 24, 25, 0.4) 100%)`
            }}
          ></div>
          
          {/* Content */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faPlus} className="w-5 h-5 text-gruvbox-fg0" />
              <h2 className="text-lg font-normal text-gruvbox-fg0">
                {subscription ? 'Modifier l\'abonnement' : 'Nouvel abonnement'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gruvbox-fg0 hover:text-gruvbox-fg0 opacity-80 hover:opacity-100 rounded-lg transition-all focus:outline-none"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <hr className="flex-1 border-gruvbox-bg2" />
              <h3 className="text-lg font-normal text-gruvbox-fg1 px-4">Informations de base</h3>
              <hr className="flex-1 border-gruvbox-bg2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-4">
                {settings.display.showLogos && (
                  <div className="flex-shrink-0">
                    <ImageUploader
                      value={formData.logoUrl}
                      onChange={handleLogoChange}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-3 py-2 bg-gruvbox-bg1 border-0 rounded-lg focus:ring-2 focus:ring-gruvbox-blue-bright text-gruvbox-fg1 placeholder-gruvbox-fg4 focus:outline-none ${
                      errors.name ? 'bg-red-900 bg-opacity-20' : ''
                    }`}
                    placeholder="Nom du service"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <CustomSelect
                  options={Object.entries(getEnabledCategories()).map(([key, category]) => ({
                    value: key,
                    label: category.label
                  }))}
                  value={formData.category}
                  onChange={(value) => handleChange('category', value)}
                  placeholder="Catégorie"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowCategoryManager(true)}
                  className="px-3 py-3 bg-gruvbox-bg1 text-gruvbox-fg2 rounded-lg hover:bg-gruvbox-bg2 hover:text-gruvbox-blue-bright transition-colors focus:outline-none flex items-center space-x-1"
                  title="Gérer les catégories"
                >
                  <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <hr className="flex-1 border-gruvbox-bg2" />
              <h3 className="text-lg font-normal text-gruvbox-fg1 px-4">Tarification</h3>
              <hr className="flex-1 border-gruvbox-bg2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                {formData.currency === '¥' ? (
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => {
                      // Pour le Yen, n'accepter que des nombres entiers sans point ni virgule
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      handleChange('amount', value);
                    }}
                    className={`w-full pl-3 pr-8 py-2 bg-gruvbox-bg1 rounded-lg focus:ring-2 focus:ring-gruvbox-blue-bright text-gruvbox-fg1 placeholder-gruvbox-fg4 border-0 focus:outline-none ${
                      errors.amount ? 'bg-red-900 bg-opacity-20' : ''
                    }`}
                    placeholder="Montant (entier)"
                  />
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    className={`w-full pl-3 pr-8 py-2 bg-gruvbox-bg1 rounded-lg focus:ring-2 focus:ring-gruvbox-blue-bright text-gruvbox-fg1 placeholder-gruvbox-fg4 border-0 focus:outline-none ${
                      errors.amount ? 'bg-red-900 bg-opacity-20' : ''
                    }`}
                    placeholder="Montant"
                  />
                )}
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gruvbox-fg4">
                  <FontAwesomeIcon icon={getCurrencyIcon(formData.currency)} className="w-4 h-4" />
                </span>
              </div>

              <div>
                <CustomSelect
                  options={Object.entries(frequencyLabels).map(([key, label]) => ({
                    value: key,
                    label
                  }))}
                  value={formData.frequency}
                  onChange={(value) => handleChange('frequency', value)}
                  placeholder="Fréquence des paiements"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <hr className="flex-1 border-gruvbox-bg2" />
              <h3 className="text-lg font-normal text-gruvbox-fg1 px-4">Dates</h3>
              <hr className="flex-1 border-gruvbox-bg2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CustomDatePicker
                  value={formData.startDate}
                  onChange={(value) => handleChange('startDate', value)}
                  placeholder="Début de l'abonnement"
                />
              </div>

              <div>
                <CustomDatePicker
                  value={formData.nextBilling}
                  onChange={(value) => handleChange('nextBilling', value)}
                  placeholder="Prochain paiement"
                />
              </div>
            </div>

            {/* Trial Period */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex-1 flex items-center">
                  <CustomCheckbox
                    checked={formData.isTrialPeriod}
                    onChange={(checked) => handleChange('isTrialPeriod', checked)}
                    label="Période d'essai en cours"
                  />
                </div>

                <div className="flex-1">
                  <CustomDatePicker
                    value={formData.trialEndDate}
                    onChange={(value) => handleChange('trialEndDate', value)}
                    placeholder="Fin de la période d'essai"
                    disabled={!formData.isTrialPeriod}
                    className={`${
                      errors.trialEndDate ? 'bg-red-900 bg-opacity-20' : ''
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <hr className="flex-1 border-gruvbox-bg2" />
              <h3 className="text-lg font-normal text-gruvbox-fg1 px-4">Détails additionnels</h3>
              <hr className="flex-1 border-gruvbox-bg2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CustomSelect
                  options={getPaymentMethodOptions()}
                  value={formData.paymentMethod}
                  onChange={(value) => handleChange('paymentMethod', value)}
                  placeholder="Méthode de paiement (optionnel)"
                />
              </div>

              <div>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                  className={`w-full px-3 py-2 bg-gruvbox-bg1 rounded-lg focus:ring-2 focus:ring-gruvbox-blue-bright text-gruvbox-fg1 placeholder-gruvbox-fg4 border-0 focus:outline-none ${
                    errors.url ? 'bg-red-900 bg-opacity-20' : ''
                  }`}
                  placeholder="URL du fournisseur"
                />
              </div>
            </div>
            
            {/* Type de paiement */}
            <div className="space-y-2">
              <label className="text-sm text-gruvbox-fg2 block">Type de paiement</label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="automatic-payment"
                    name="payment-type"
                    checked={formData.isAutomaticPayment}
                    onChange={() => handleChange('isAutomaticPayment', true)}
                    className="mr-2 h-4 w-4 text-gruvbox-blue-bright focus:ring-gruvbox-blue-bright"
                  />
                  <label htmlFor="automatic-payment" className="text-sm text-gruvbox-fg1">
                    Prélèvement automatique
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="manual-payment"
                    name="payment-type"
                    checked={!formData.isAutomaticPayment}
                    onChange={() => handleChange('isAutomaticPayment', false)}
                    className="mr-2 h-4 w-4 text-gruvbox-blue-bright focus:ring-gruvbox-blue-bright"
                  />
                  <label htmlFor="manual-payment" className="text-sm text-gruvbox-fg1">
                    Paiement manuel
                  </label>
                </div>
              </div>
              <p className="text-xs text-gruvbox-fg3 mt-1">
                {formData.isAutomaticPayment 
                  ? "Le paiement est prélevé automatiquement à la date d'échéance" 
                  : "Le paiement doit être effectué manuellement"}
              </p>
            </div>

            <div>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 bg-gruvbox-bg1 text-gruvbox-fg1 placeholder-gruvbox-fg4 rounded-lg focus:ring-2 focus:ring-gruvbox-blue-bright border-0 focus:outline-none resize-none"
                placeholder="Commentaires additionnels "
              />
            </div>

          </div>

          {/* Actions */}
          <div className="border-t border-gruvbox-bg2 mt-2"></div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-normal text-gruvbox-fg2 bg-gruvbox-bg1 rounded-lg hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 text-sm font-normal text-gruvbox-fg0 bg-gruvbox-blue rounded-lg hover:bg-gruvbox-blue-bright transition-colors focus:outline-none"
            >
              <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
              <span>{subscription ? 'Modifier' : 'Ajouter'}</span>
            </button>
          </div>
        </form>
        </div>
      </div>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager onClose={() => setShowCategoryManager(false)} />
      )}
    </div>
  );
};
