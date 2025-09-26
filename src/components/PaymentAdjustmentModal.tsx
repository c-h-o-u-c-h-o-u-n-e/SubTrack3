import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faFloppyDisk, faDollarSign, faEuroSign, faSterlingSign, faYenSign } from '@fortawesome/free-solid-svg-icons';
import { Subscription, PaymentRecord } from '../types/Subscription';
import { CustomDatePicker } from './ui';
import { getCurrentCurrency } from '../hooks/useAppSettings';

interface PaymentAdjustmentModalProps {
  subscription: Subscription;
  payment: PaymentRecord;
  onSave: (subscriptionId: string, paymentId: string, updatedPayment: Partial<PaymentRecord>, updateSubscriptionAmount: boolean) => void;
  onClose: () => void;
}

export const PaymentAdjustmentModal: React.FC<PaymentAdjustmentModalProps> = ({
  subscription,
  payment,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: '',
    updateSubscriptionAmount: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Disable background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    setFormData({
      amount: payment.amount.toString(),
      paymentDate: payment.paymentDate,
      updateSubscriptionAmount: false
    });
  }, [payment]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'La date de paiement est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const updatedPayment = {
      amount: parseFloat(formData.amount),
      paymentDate: formData.paymentDate,
      isAdjusted: parseFloat(formData.amount) !== payment.amount,
      originalAmount: parseFloat(formData.amount) !== payment.amount ? payment.amount : undefined
    };

    onSave(subscription.id, payment.id, updatedPayment, formData.updateSubscriptionAmount);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
      <div className="max-w-md w-full">
        <div className="bg-gruvbox-bg0 rounded-xl shadow-xl">
          <div className="p-4 rounded-t-xl relative bg-gruvbox-yellow">
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
                <FontAwesomeIcon icon={faDollarSign} className="w-5 h-5 text-gruvbox-fg0" />
                <h2 className="text-lg font-normal text-gruvbox-fg0">
                  Ajuster le paiement
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gruvbox-fg2">Abonnement</span>
                <span className="text-sm font-normal text-gruvbox-fg1">{subscription.name}</span>
              </div>

              <div className="relative">
                <label className="text-sm text-gruvbox-fg2 block mb-2">Montant</label>
                {payment.currency === '¥' ? (
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
                <span className="absolute bottom-0 right-0 flex items-center pr-3 text-gruvbox-fg4 h-10">
                  <FontAwesomeIcon icon={getCurrencyIcon(payment.currency)} className="w-4 h-4" />
                </span>
              </div>

              <div>
                <label className="text-sm text-gruvbox-fg2 block mb-2">Date de paiement</label>
                <CustomDatePicker
                  value={formData.paymentDate}
                  onChange={(value) => handleChange('paymentDate', value)}
                  placeholder="Date de paiement"
                  className={`${errors.paymentDate ? 'bg-red-900 bg-opacity-20' : ''}`}
                />
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="update-subscription"
                  checked={formData.updateSubscriptionAmount}
                  onChange={(e) => handleChange('updateSubscriptionAmount', e.target.checked)}
                  className="mr-2 h-4 w-4 text-gruvbox-blue-bright focus:ring-gruvbox-blue-bright"
                />
                <label htmlFor="update-subscription" className="text-sm text-gruvbox-fg1">
                  Mettre à jour le tarif de l'abonnement
                </label>
              </div>
              <p className="text-xs text-gruvbox-fg3 mt-1">
                Si activé, le tarif de l'abonnement sera mis à jour avec ce nouveau montant
              </p>
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
                className="flex items-center space-x-2 px-4 py-2 text-sm font-normal text-gruvbox-fg0 bg-gruvbox-yellow rounded-lg hover:bg-gruvbox-yellow-bright transition-colors focus:outline-none"
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                <span>Enregistrer</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
