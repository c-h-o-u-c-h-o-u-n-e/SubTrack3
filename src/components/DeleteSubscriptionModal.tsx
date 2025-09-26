import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from '../types/Subscription';

interface DeleteSubscriptionModalProps {
  subscription: Subscription;
  onConfirm: () => void;
  onClose: () => void;
  onCancel?: (id: string) => void;
}

export const DeleteSubscriptionModal: React.FC<DeleteSubscriptionModalProps> = ({
  subscription,
  onConfirm,
  onClose,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gruvbox-bg0 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gruvbox-red p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faTrash} className="w-5 h-5 text-gruvbox-fg1" />
            <h3 className="text-lg font-normal text-gruvbox-fg1">Supprimer l'abonnement</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gruvbox-bg0 hover:text-gruvbox-bg2 transition-colors focus:outline-none"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gruvbox-fg1 mb-4">
            Vous êtes sur le point de supprimer un abonnement.
          </p>
          <p className="text-gruvbox-fg3 mb-4">
              Toutes les données liées à cet abonnement seront effacées de façon définitive et les totaux comptabilisés seront automatiquement réajustés.
          </p>
            <p className="text-gruvbox-fg3 mb-6">
                Il est  préférable de résilier l'abonnement.
            </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gruvbox-bg1 text-gruvbox-fg2 rounded-lg hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
            >
              Annuler
            </button>
            {onCancel && (
              <button
                onClick={() => {
                  onClose(); // Close the delete modal first
                  onCancel(subscription.id); // Then trigger the cancel action
                }}
                className="px-4 py-2 bg-gruvbox-yellow text-gruvbox-bg0 rounded-lg hover:bg-gruvbox-yellow-bright transition-colors focus:outline-none"
              >
                Résilier
              </button>
            )}
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-gruvbox-red text-gruvbox-fg2 rounded-lg hover:bg-gruvbox-red-bright transition-colors focus:outline-none"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
