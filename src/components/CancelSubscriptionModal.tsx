import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from '../types/Subscription';

interface CancelSubscriptionModalProps {
  subscription: Subscription;
  onConfirm: () => void;
  onClose: () => void;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  subscription,
  onConfirm,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gruvbox-bg0 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gruvbox-yellow p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faBan} className="w-5 h-5 text-gruvbox-bg0" />
            <h3 className="text-lg font-normal text-gruvbox-bg0">Résilier l'abonnement</h3>
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
            Vous êtes sur le point de résilier un abonnement.
          </p>
          <p className="text-gruvbox-fg3 mb-4">
            Celui-ci ne sera plus pris en compte dans vos dépenses futures et n’apparaîtra dans l’interface que si vous activez le filtre des abonnements résiliés.
          </p>
          <p className="text-gruvbox-fg3 mb-6">
            Vous aurez toutefois la possibilité de réactiver votre abonnement à tout moment.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gruvbox-bg1 text-gruvbox-fg2 rounded-lg hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-gruvbox-yellow text-gruvbox-bg0 rounded-lg hover:bg-gruvbox-yellow-bright transition-colors focus:outline-none"
            >
              Résilier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
