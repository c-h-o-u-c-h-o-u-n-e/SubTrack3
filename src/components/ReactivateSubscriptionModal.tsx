import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from '../types/Subscription';

interface ReactivateSubscriptionModalProps {
  subscription: Subscription;
  onConfirm: () => void;
  onClose: () => void;
}

export const ReactivateSubscriptionModal: React.FC<ReactivateSubscriptionModalProps> = ({
  subscription,
  onConfirm,
  onClose
}) => {
  // Check if the subscription is expired (next billing date is in the past)
  const isExpired = new Date(subscription.nextBilling) < new Date();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gruvbox-bg0 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gruvbox-green p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faRotateRight} className="w-5 h-5 text-gruvbox-bg0" />
            <h3 className="text-lg font-normal text-gruvbox-bg0">Réactiver l'abonnement</h3>
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
            Vous êtes sur le point de réactiver un abonnement.
          </p>
          
          {isExpired ? (
            <p className="text-gruvbox-fg3 mb-4">
              Cet abonnement est arrivé à terme. La réactivation débutera aujourd'hui et la date de prélèvement sera ajustée selon la fréquence choisie.
            </p>
          ) : (
            <p className="text-gruvbox-fg3 mb-4">
              Cet abonnement est toujours actif. La réactivation ne changera pas la date du prochain prélèvement qui demeurera identique à ce qu'elle affichait avant la résiliation.
            </p>
          )}
          
          <p className="text-gruvbox-fg3 mb-6">
            Voulez-vous continuer avec la réactivation?
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
              className="px-4 py-2 bg-gruvbox-green text-gruvbox-bg0 rounded-lg hover:bg-gruvbox-green-bright transition-colors focus:outline-none"
            >
              Réactiver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
