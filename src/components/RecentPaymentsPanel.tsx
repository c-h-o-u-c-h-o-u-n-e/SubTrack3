import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faCheckCircle, faPenToSquare, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Subscription, PaymentRecord } from '../types/Subscription';
import { formatCurrency, formatDaysRemaining } from '../utils/subscriptionUtils';

interface RecentPaymentsPanelProps {
  payments: {
    subscription: Subscription;
    payment: PaymentRecord;
  }[];
  onAdjustPayment: (subscriptionId: string, paymentId: string) => void;
  onConfirmPayment: (subscriptionId: string, paymentId: string) => void;
}

export const RecentPaymentsPanel: React.FC<RecentPaymentsPanelProps> = ({ 
  payments, 
  onAdjustPayment, 
  onConfirmPayment 
}) => {
  // Utiliser les paiements réels
  const displayPayments = payments;

  if (payments.length === 0) {
    return (
      <div className="bg-gruvbox-bg0 rounded-xl shadow-sm">
        <div 
          className="p-4 rounded-t-xl relative bg-gruvbox-yellow-bright"
        >
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
            <FontAwesomeIcon icon={faCoins} className="w-5 h-5 text-gruvbox-fg0" />
            <h2 className="text-lg font-normal text-gruvbox-fg0">Paiements récents</h2>
          </div>
        </div>
        
        <div className="py-4 px-6 space-y-3">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gruvbox-bg1 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-gruvbox-fg4" />
            </div>
            <p className="text-gruvbox-fg2">Aucun paiement récent</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gruvbox-bg0 rounded-xl shadow-sm">
      <div 
        className="p-4 rounded-t-xl relative bg-gruvbox-green"
      >
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
            <FontAwesomeIcon icon={faCoins} className="w-5 h-5 text-gruvbox-fg0" />
            <h2 className="text-lg font-normal text-gruvbox-fg0">Paiements récents</h2>
          </div>
          <span className="px-2 py-1 text-gruvbox-fg0 text-md rounded-full bg-black bg-opacity-20">
            {displayPayments.length}
          </span>
        </div>
      </div>

      <div className="px-4 pt-2 pb-4 space-y-2">
        {displayPayments.map(({ subscription, payment }) => {
          const getPaymentDate = () => {
            return formatDaysRemaining(payment.paymentDate);
          };

          return (
            <div key={payment.id} className="group py-3 pl-0 pr-7">
              <div className="grid grid-cols-[7.5%_62.5%_10%_20%] gap-2">
                {/* Column 1: Payment icon */}
                <div className="flex justify-start pl-0.5 pt-1">
                  <FontAwesomeIcon icon={faCoins} className="w-4 h-4 text-gruvbox-green-bright" />
                </div>
                
                {/* Column 2: Name and status */}
                <div className="flex flex-col">
                  <h3 className="text-sm font-normal text-gruvbox-fg1 truncate">
                    {subscription.name}
                  </h3>
                  <p className="text-xs text-gruvbox-fg3">
                    Paiement à confirmer
                  </p>
                </div>
                
                {/* Column 3: Payment adjustment icon */}
                <div className="flex justify-center">
                  <button
                    onClick={() => onAdjustPayment(subscription.id, payment.id)}
                    className="w-8 h-8 flex items-center justify-center text-gruvbox-fg2 rounded-full hover:text-gruvbox-green-bright transition-colors focus:outline-none"
                    aria-label="Confirmer le montant et la date"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Column 4: Price and date */}
                <div className="flex flex-col items-end">
                  <span className="text-sm font-normal text-gruvbox-fg1">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                  <span className="text-xs text-gruvbox-fg3">
                    {getPaymentDate()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
