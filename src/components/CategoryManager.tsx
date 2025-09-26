import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEye, faEyeSlash, faGear, faPenToSquare, faTrash, faPlus, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { CategorySettings } from '../types/Subscription';
import { getCategorySettings, saveCategorySettings, defaultCategorySettings } from '../utils/subscriptionUtils';
import { CustomCheckbox } from './ui';

interface CategoryManagerProps {
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const [categorySettings, setCategorySettings] = useState<CategorySettings>(defaultCategorySettings);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newCategoryKey, setNewCategoryKey] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [useCategoryFolders, setUseCategoryFolders] = useState(true);

  useEffect(() => {
    setCategorySettings(getCategorySettings());
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setUseCategoryFolders(JSON.parse(savedSettings).display.categoryFolders);
    }
  }, []);

  const handleToggleCategoryFolders = (checked: boolean) => {
    setUseCategoryFolders(checked);
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const newSettings = JSON.parse(savedSettings);
      newSettings.display.categoryFolders = checked;
      localStorage.setItem('appSettings', JSON.stringify(newSettings));
      window.dispatchEvent(new Event('settings-changed'));
    }
  };

  const handleToggleCategory = (categoryKey: string) => {
    const updatedSettings = {
      ...categorySettings,
      [categoryKey]: {
        ...categorySettings[categoryKey],
        enabled: !categorySettings[categoryKey].enabled
      }
    };
    
    setCategorySettings(updatedSettings);
    saveCategorySettings(updatedSettings);
  };

  const handleEnableAll = () => {
    const updatedSettings: CategorySettings = {};
    Object.keys(categorySettings).forEach(key => {
      updatedSettings[key] = {
        ...categorySettings[key],
        enabled: true
      };
    });
    
    setCategorySettings(updatedSettings);
    saveCategorySettings(updatedSettings);
  };

  const handleDisableAll = () => {
    const updatedSettings: CategorySettings = {};
    Object.keys(categorySettings).forEach(key => {
      updatedSettings[key] = {
        ...categorySettings[key],
        enabled: false
      };
    });
    
    setCategorySettings(updatedSettings);
    saveCategorySettings(updatedSettings);
  };

  const handleToggleAll = () => {
    const enabledCount = Object.values(categorySettings).filter(cat => cat.enabled).length;
    const totalCount = Object.keys(categorySettings).length;
    
    if (enabledCount === totalCount) {
      handleDisableAll();
    } else {
      handleEnableAll();
    }
  };

  const handleEditCategory = (key: string) => {
    setEditingCategory(key);
    setEditValue(categorySettings[key].label);
  };

  const handleSaveEdit = () => {
    if (editingCategory && editValue.trim()) {
      const updatedSettings = {
        ...categorySettings,
        [editingCategory]: {
          ...categorySettings[editingCategory],
          label: editValue.trim()
        }
      };
      setCategorySettings(updatedSettings);
      saveCategorySettings(updatedSettings);
      setEditingCategory(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  const handleDeleteCategory = (key: string) => {
    setCategoryToDelete(key);
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      const { [categoryToDelete]: _, ...rest } = categorySettings;
      setCategorySettings(rest);
      saveCategorySettings(rest);
      setCategoryToDelete(null);
    }
  };

  const cancelDeleteCategory = () => {
    setCategoryToDelete(null);
  };

  const handleAddCategory = () => {
    if (newCategoryLabel.trim()) {
      const key = newCategoryLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const updatedSettings = {
        ...categorySettings,
        [key]: {
          label: newCategoryLabel.trim(),
          enabled: true
        }
      };
      setCategorySettings(updatedSettings);
      saveCategorySettings(updatedSettings);
      setNewCategoryLabel('');
      setShowAddForm(false);
    }
  };

  const enabledCount = Object.values(categorySettings).filter(cat => cat.enabled).length;
  const totalCount = Object.keys(categorySettings).length;
  const allEnabled = enabledCount === totalCount;

  return (
    <div className="fixed inset-0 bg-gruvbox-bgemini0-hard bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gruvbox-bg0 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 rounded-t-xl relative bg-gruvbox-orange">
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
            <div className="flex items-center space-x-4">
              <FontAwesomeIcon icon={faGear} className="w-5 h-5 text-gruvbox-fg0" />
              <div>
                <h2 className="text-lg font-normal text-gruvbox-fg0">Gérer les catégories</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gruvbox-fg0 hover:text-gruvbox-fg0 opacity-80 hover:opacity-100 rounded-lg transition-all focus:outline-none"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3">
          {/* Formulaire d'ajout de catégorie */}
          <div className="relative mb-4">
            <input
              type="text"
              value={newCategoryLabel}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              placeholder="Créer une nouvelle catégorie"
              className="w-full px-4 py-3 pr-12 bg-gruvbox-bg1 text-gruvbox-fg1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-gruvbox-blue-bright placeholder-gruvbox-fg4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategoryLabel.trim()}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gruvbox-fg0 bg-gruvbox-blue rounded-r-lg hover:bg-gruvbox-blue-bright transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ajouter la catégorie"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            </button>
          </div>

          <hr className="border-gruvbox-bg2 my-6" />

          {/* Actions globales */}
          <div className="mb-6">
            <div className="mb-4">
              <CustomCheckbox
                checked={useCategoryFolders}
                onChange={handleToggleCategoryFolders}
                label="Utiliser l'abécédaire pour les filtres de catégories"
              />
            </div>
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
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les catégories aux valeurs par défaut ? Cette action supprimera toutes les catégories personnalisées.')) {
                    setCategorySettings(defaultCategorySettings);
                    saveCategorySettings(defaultCategorySettings);
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 text-xs bg-gruvbox-bg1 text-gruvbox-fg1 rounded hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
              >
                <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3 mr-1" />
                <span>Réinitialiser tous</span>
              </button>
            </div>
            <p className="text-xs text-gruvbox-fg4 text-right">
              {enabledCount} sur {totalCount} catégories activées
            </p>
          </div>

          {/* Liste des catégories */}
          <div className="space-y-3 overflow-y-auto max-h-80 scrollbar-hide">
            {Object.entries(categorySettings)
              .sort(([, a], [, b]) => a.label.localeCompare(b.label))
              .map(([key, category]) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                    category.enabled 
                      ? 'bg-gruvbox-bg1 hover:bg-gruvbox-bg2' 
                      : 'bg-gruvbox-bg0-soft hover:bg-gruvbox-bg1 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center flex-1">
                      {editingCategory === key ? (
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
                        <span className={`font-normal ${
                          category.enabled ? 'text-gruvbox-fg1' : 'text-gruvbox-fg3'
                        }`}>
                          {category.label}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {editingCategory === key ? (
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
                            onClick={() => handleToggleCategory(key)}
                            className={`p-2 rounded-lg transition-colors focus:outline-none ${
                              category.enabled
                                ? 'text-gruvbox-green hover:text-gruvbox-green-bright hover:bg-gruvbox-bg2'
                                : 'text-gruvbox-fg4 hover:text-gruvbox-fg2 hover:bg-gruvbox-bg2'
                            }`}
                            title={category.enabled ? 'Désactiver cette catégorie' : 'Activer cette catégorie'}
                          >
                            {category.enabled ? (
                              <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                            ) : (
                              <FontAwesomeIcon icon={faEyeSlash} className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleEditCategory(key)}
                            className="p-2 text-gruvbox-fg3 hover:text-gruvbox-blue-bright hover:bg-gruvbox-bg2 rounded-lg transition-colors focus:outline-none"
                            title="Éditer cette catégorie"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteCategory(key)}
                            className="p-2 text-gruvbox-fg3 hover:text-gruvbox-red-bright hover:bg-gruvbox-bg2 rounded-lg transition-colors focus:outline-none"
                            title="Supprimer cette catégorie"
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

        <div className="flex justify-end p-6 pt-4 border-t border-gruvbox-bg2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-normal text-gruvbox-fg0 bg-gruvbox-blue rounded-lg hover:bg-gruvbox-blue-bright transition-colors focus:outline-none"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {categoryToDelete && (
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
                <h3 className="text-lg font-normal text-gruvbox-fg0">Supprimer la catégorie</h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gruvbox-fg1 mb-4">
                Vous êtes sur le point de supprimer une catégorie.</p>
                <p className="text-gruvbox-fg1 mb-6">
                Cette action est irréversible.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDeleteCategory}
                  className="px-4 py-2 text-sm font-normal text-gruvbox-fg2 bg-gruvbox-bg1 rounded-lg hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteCategory}
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
