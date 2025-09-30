import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faBell, faCalendarDays, faCheckCircle, faCoins } from '@fortawesome/free-solid-svg-icons';
import { Alert, Subscription } from '../types/Subscription';
import { formatCurrency } from '../utils/subscriptionUtils';

interface AlertsPanelProps {
  alerts: Alert[];
  subscriptions: Subscription[];
  onPaySubscription: (subscriptionId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, subscriptions, onPaySubscription }) => {

  if (alerts.length === 0) {
    return (
      <div className="bg-gruvbox-bg0 rounded-xl shadow-sm">
        <div 
          className="p-4 rounded-t-xl relative bg-gruvbox-purple-bright"
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
            <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-gruvbox-fg0" />
            <h2 className="text-lg font-normal text-gruvbox-fg0">Notifications</h2>
          </div>
        </div>
        
        <div className="py-4 px-6 space-y-3 bg-gruvbox-bg1 rounded-b-xl">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gruvbox-bg1 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-gruvbox-fg4" />
            </div>
            <p className="text-gruvbox-fg2">Aucune notification</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gruvbox-bg0 rounded-xl shadow-sm">
      <div 
        className="p-4 rounded-t-xl relative bg-gruvbox-orange"
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
            <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-gruvbox-fg0" />
            <h2 className="text-lg font-normal text-gruvbox-fg0">Notifications</h2>
          </div>
          <span className="px-2 py-1 text-gruvbox-fg0 text-md rounded-full bg-black bg-opacity-20">
            {alerts.length}
          </span>
        </div>
      </div>

      <div className="px-4 pt-2 pb-4 space-y-2 bg-gruvbox-bg1 rounded-b-xl">
        {alerts.map((alert) => {
          const getUrgencyColor = () => {
            if (alert.urgency === 'high') return 'text-gruvbox-red-bright';
            if (alert.urgency === 'medium') return 'text-gruvbox-orange-bright';
            return 'text-gruvbox-yellow-bright';
          };

          const subscription = subscriptions.find(sub => sub.id === alert.subscriptionId);
          const showPaymentIcon = subscription && !subscription.isAutomaticPayment && (alert.type === 'renewal' || alert.type === 'trial_ending');

          return (
            <div key={alert.id} className="group py-3 pl-0 pr-7">
              <div className="grid grid-cols-[7.5%_62.5%_10%_20%] gap-2">
                {/* Column 1: Notification icon */}
                <div className="flex justify-start pl-0.5 pt-1">
                  {alert.type === 'trial_ending' ? (
                    <FontAwesomeIcon icon={faClock} className={`w-4 h-4 ${getUrgencyColor()}`} />
                  ) : (
                    <FontAwesomeIcon icon={faCalendarDays} className={`w-4 h-4 ${getUrgencyColor()}`} />
                  )}
                </div>
                
                {/* Column 2: Name and status */}
                <div className="flex flex-col">
                  <h3 className="text-sm font-normal text-gruvbox-fg1 truncate">
                    {alert.subscriptionName}
                  </h3>
                  <p className="text-xs text-gruvbox-fg3">
                    {alert.type === 'trial_ending' 
                      ? `Fin de la période d'essai`
                      : alert.type === 'expiring'
                      ? `Fin de l'abonnement`
                      : `Prochain prélèvement`
                    }
                  </p>
                </div>
                
                {/* Column 3: Payment confirmation icon */}
                <div className="flex justify-center">
                  {showPaymentIcon ? (
                    <button
                      onClick={() => onPaySubscription(alert.subscriptionId)}
                      className="w-8 h-8 flex items-center justify-center text-gruvbox-fg2 rounded-full hover:text-gruvbox-green transition-colors focus:outline-none"
                      aria-label="Confirmer le paiement"
                    >
                      <FontAwesomeIcon icon={faCoins} className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                
                {/* Column 4: Price and days remaining */}
                <div className="flex flex-col items-end">
                  {alert.type !== 'expiring' && (
                    <span className={`text-sm font-normal ${getUrgencyColor()}`}>
                      {formatCurrency(alert.amount, alert.currency)}
                    </span>
                  )}
                  <span className={`text-xs ${getUrgencyColor()}`}>
                    {alert.daysRemaining === 0 ? 'Aujourd\'hui' :
                     alert.daysRemaining === 1 ? 'Demain' :
                     `${alert.daysRemaining} jours`}
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
