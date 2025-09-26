import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEye, faEyeSlash, faCreditCard, faPenToSquare, faTrash, faPlus, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { CustomCheckbox } from './ui';

interface PaymentMethodSettings {
  [key: string]: {
    label: string;
    enabled: boolean;
    isDefault: boolean;
  };
}

const defaultPaymentMethods: PaymentMethodSettings = {
  cash: { label: 'Argent comptant', enabled: true, isDefault: true },
  credit_card: { label: 'Carte de crédit', enabled: true, isDefault: true },
  debit_card: { label: 'Carte de débit', enabled: true, isDefault: true },
  prepaid_card: { label: 'Carte prépayée', enabled: true, isDefault: true },
  check: { label: 'Chèque', enabled: true, isDefault: true },
  crypto: { label: 'Cryptomonnaie', enabled: true, isDefault: true },
  digital_wallet: { label: 'Portefeuille numérique', enabled: true, isDefault: true },
  bank_transfer: { label: 'Virement bancaire', enabled: true, isDefault: true }
};

interface PaymentMethodManagerProps {
  onClose: () => void;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({ onClose }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSettings>(defaultPaymentMethods);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newMethodLabel, setNewMethodLabel] = useState('');
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = () => {
    const savedSettings = localStorage.getItem('paymentMethodSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Merge with default methods to ensure all default methods exist
        const merged = { ...defaultPaymentMethods };
        Object.keys(parsed).forEach(key => {
          if (parsed[key]) {
            merged[key] = {
              ...merged[key],
              ...parsed[key]
            };
          }
        });
        setPaymentMethods(merged);
      } catch (error) {
        console.error('Error loading payment methods:', error);
        setPaymentMethods(defaultPaymentMethods);
      }
    }
  };

  const savePaymentMethods = (methods: PaymentMethodSettings) => {
    localStorage.setItem('paymentMethodSettings', JSON.stringify(methods));
    
    // Update app settings to sync with the main settings
    const appSettings = localStorage.getItem('appSettings');
    if (appSettings) {
      try {
        const settings = JSON.parse(appSettings);
        const paymentMethodsForSettings: { [key: string]: boolean } = {};
        
        Object.keys(methods).forEach(key => {
          paymentMethodsForSettings[key] = methods[key].enabled;
        });
        
        settings.paymentMethods = paymentMethodsForSettings;
        localStorage.setItem('appSettings', JSON.stringify(settings));
        window.dispatchEvent(new Event('settings-changed'));
      } catch (error) {
        console.error('Error updating app settings:', error);
      }
    }
  };

  const handleToggleMethod = (methodKey: string) => {
    const updatedMethods = {
      ...paymentMethods,
      [methodKey]: {
        ...paymentMethods[methodKey],
        enabled: !paymentMethods[methodKey].enabled
      }
    };
    
    setPaymentMethods(updatedMethods);
    savePaymentMethods(updatedMethods);
  };

  const handleEnableAll = () => {
    const updatedMethods: PaymentMethodSettings = {};
    Object.keys(paymentMethods).forEach(key => {
      updatedMethods[key] = {
        ...paymentMethods[key],
        enabled: true
      };
    });
    
    setPaymentMethods(updatedMethods);
    savePaymentMethods(updatedMethods);
  };

  const handleDisableAll = () => {
    const updatedMethods: PaymentMethodSettings = {};
    Object.keys(paymentMethods).forEach(key => {
      updatedMethods[key] = {
        ...paymentMethods[key],
        enabled: false
      };
    });
    
    setPaymentMethods(updatedMethods);
    savePaymentMethods(updatedMethods);
  };

  const handleToggleAll = () => {
    const enabledCount = Object.values(paymentMethods).filter(method => method.enabled).length;
    const totalCount = Object.keys(paymentMethods).length;
    
    if (enabledCount === totalCount) {
      handleDisableAll();
    } else {
      handleEnableAll();
    }
  };

  const handleEditMethod = (key: string) => {
    setEditingMethod(key);
    setEditValue(paymentMethods[key].label);
  };

  const handleSaveEdit = () => {
    if (editingMethod && editValue.trim()) {
      const updatedMethods = {
        ...paymentMethods,
        [editingMethod]: {
          ...paymentMethods[editingMethod],
          label: editValue.trim()
        }
      };
      setPaymentMethods(updatedMethods);
      savePaymentMethods(updatedMethods);
      setEditingMethod(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMethod(null);
    setEditValue('');
  };

  const handleDeleteMethod = (key: string) => {
    setMethodToDelete(key);
  };

  const confirmDeleteMethod = () => {
    if (methodToDelete && !paymentMethods[methodToDelete].isDefault) {
      const { [methodToDelete]: _, ...rest } = paymentMethods;
      setPaymentMethods(rest);
      savePaymentMethods(rest);
      setMethodToDelete(null);
    }
  };

  const cancelDeleteMethod = () => {
    setMethodToDelete(null);
  };

  const handleAddMethod = () => {
    if (newMethodLabel.trim()) {
      const key = newMethodLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      // Check if key already exists
      if (paymentMethods[key]) {
        alert('Un mode de paiement avec ce nom existe déjà.');
        return;
      }
      
      const updatedMethods = {
        ...paymentMethods,
        [key]: {
          label: newMethodLabel.trim(),
          enabled: true,
          isDefault: false
        }
      };
      setPaymentMethods(updatedMethods);
      savePaymentMethods(updatedMethods);
      setNewMethodLabel('');
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les modes de paiement aux valeurs par défaut ? Cette action supprimera tous les modes personnalisés.')) {
      setPaymentMethods(defaultPaymentMethods);
      savePaymentMethods(defaultPaymentMethods);
    }
  };

  const enabledCount = Object.values(paymentMethods).filter(method => method.enabled).length;
  const totalCount = Object.keys(paymentMethods).length;
  const allEnabled = enabledCount === totalCount;

  return (
    <div className="fixed inset-0 bg-gruvbox-bg0-hard bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gruvbox-bg0 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 rounded-t-xl relative bg-gruvbox-green">
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
              <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-gruvbox-fg0" />
              <div>
                <h2 className="text-lg font-normal text-gruvbox-fg0">Gérer les modes de paiement</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gruvbox-fg0 hover:text-gruvbox-fg0 opacity-80 hover:opacity-100 rounded-lg transition-all focus:outline-none"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Formulaire d'ajout de mode de paiement */}
          <div className="relative mb-4">
            <input
              type="text"
              value={newMethodLabel}
              onChange={(e) => setNewMethodLabel(e.target.value)}
              placeholder="Créer un nouveau mode de paiement"
              className="w-full px-4 py-3 pr-12 bg-gruvbox-bg1 text-gruvbox-fg1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-gruvbox-green-bright placeholder-gruvbox-fg4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddMethod()}
            />
            <button
              onClick={handleAddMethod}
              disabled={!newMethodLabel.trim()}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gruvbox-fg0 bg-gruvbox-green rounded-r-lg hover:bg-gruvbox-green-bright transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ajouter le mode de paiement"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            </button>
          </div>

          <hr className="border-gruvbox-bg2 my-6" />

          {/* Actions globales */}
          <div className="mb-6">
            <div className="flex mb-4">
              <button
                onClick={handleToggleAll}
                className={`px-4 py-2 text-xs text-gruvbox-fg0 rounded transition-colors w-40 mr-2 ${
                  allEnabled 
                    ? 'bg-gruvbox-red hover:bg-gruvbox-red-bright' 
                    : 'bg-gruvbox-green hover:bg-gruvbox-green-bright'
                }`}
              >
                {allEnabled ? 'Tout désactiver' : 'Tout activer'}
              </button>
              <button
                onClick={handleResetToDefaults}
                className="flex items-center space-x-2 px-4 py-2 text-xs bg-gruvbox-bg1 text-gruvbox-fg1 rounded hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
              >
                <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3 mr-1" />
                <span>Réinitialiser tous</span>
              </button>
            </div>
            <p className="text-xs text-gruvbox-fg4 text-right">
              {enabledCount} sur {totalCount} modes activés
            </p>
          </div>

          {/* Liste des modes de paiement */}
          <div className="space-y-3 overflow-y-auto max-h-80 scrollbar-hide">
            {Object.entries(paymentMethods)
              .sort(([, a], [, b]) => a.label.localeCompare(b.label))
              .map(([key, method]) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                    method.enabled 
                      ? 'bg-gruvbox-bg1 hover:bg-gruvbox-bg2' 
                      : 'bg-gruvbox-bg0-soft hover:bg-gruvbox-bg1 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center flex-1">
                      {editingMethod === key ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 bg-transparent text-gruvbox-fg1 border-0 focus:outline-none focus:ring-0 font-normal"
                          style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
                          autoFocus
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`font-normal ${
                            method.enabled ? 'text-gruvbox-fg1' : 'text-gruvbox-fg3'
                          }`}>
                            {method.label}
                          </span>
                          {method.isDefault && (
                            <span className="text-xs bg-gruvbox-blue text-gruvbox-fg0 px-2 py-1 rounded">
                              Défaut
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {editingMethod === key ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 text-gruvbox-green-bright hover:text-gruvbox-green hover:bg-gruvbox-bg2 rounded-lg transition-colors focus:outline-none"
                            title="Sauvegarder"
                          >
                            <FontAwesomeIcon icon={faPlus} className="w-4 h-4 rotate-45" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gruvbox-fg3 hover:text-gruvbox-fg2 hover:bg-gruvbox-bg2 rounded-lg transition-colors focus:outline-none"
                            title="Annuler"
                          >
                            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleMethod(key)}
                            className={`p-2 rounded-lg transition-colors focus:outline-none ${
                              method.enabled
                                ? 'text-gruvbox-green hover:text-gruvbox-green-bright hover:bg-gruvbox-bg2'
                                : 'text-gruvbox-fg4 hover:text-gruvbox-fg2 hover:bg-gruvbox-bg2'
                            }`}
                            title={method.enabled ? 'Désactiver ce mode de paiement' : 'Activer ce mode de paiement'}
                          >
                            {method.enabled ? (
                              <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                            ) : (
                              <FontAwesomeIcon icon={faEyeSlash} className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleEditMethod(key)}
                            className="p-2 text-gruvbox-fg3 hover:text-gruvbox-blue-bright hover:bg-gruvbox-bg2 rounded-lg transition-colors focus:outline-none"
                            title="Éditer ce mode de paiement"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                          </button>
                          
                          {!method.isDefault && (
                            <button
                              onClick={() => handleDeleteMethod(key)}
                              className="p-2 text-gruvbox-fg3 hover:text-gruvbox-red-bright hover:bg-gruvbox-bg2 rounded-lg transition-colors focus:outline-none"
                              title="Supprimer ce mode de paiement"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="flex justify-end p-6 pt-4 border-t border-gruvbox-bg2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-normal text-gruvbox-fg0 bg-gruvbox-green rounded-lg hover:bg-gruvbox-green-bright transition-colors focus:outline-none"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {methodToDelete && (
        <div className="fixed inset-0 bg-gruvbox-bg0-hard bg-opacity-90 flex items-center justify-center z-60 p-4">
          <div className="bg-gruvbox-bg0 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 rounded-t-xl relative bg-gruvbox-red">
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
              <div className="flex items-center space-x-3 relative z-10">
                <FontAwesomeIcon icon={faTrash} className="w-5 h-5 text-gruvbox-fg0" />
                <h3 className="text-lg font-normal text-gruvbox-fg0">Supprimer le mode de paiement</h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gruvbox-fg1 mb-4">
                Vous êtes sur le point de supprimer un mode de paiement personnalisé.
              </p>
              <p className="text-gruvbox-fg1 mb-6">
                Cette action est irréversible.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDeleteMethod}
                  className="px-4 py-2 text-sm font-normal text-gruvbox-fg2 bg-gruvbox-bg1 rounded-lg hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteMethod}
                  className="px-4 py-2 text-sm font-normal text-gruvbox-fg0 bg-gruvbox-red rounded-lg hover:bg-gruvbox-red-bright transition-colors focus:outline-none"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
