import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from '../types/Subscription';
import { calculateMonthlyAmount, formatCurrency } from '../utils/subscriptionUtils';

interface MonthlyTrendViewProps {
  subscriptions: Subscription[];
  onBack: () => void;
}

const subscriptionColors = [
  '#83a598', '#8ec07c', '#d3869b', '#fabd2f', '#fb4934', '#b8bb26', 
  '#fe8019', '#689d6a', '#d79921', '#b16286', '#458588', '#98971a',
];

export const MonthlyTrendView: React.FC<MonthlyTrendViewProps> = ({ subscriptions, onBack }) => {
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

  // Calculate complete monthly trend based on subscription history
  const monthlyTrend = useMemo(() => {
    if (activeSubscriptions.length === 0) return [];

    // Find the earliest subscription start date
    const earliestDate = activeSubscriptions.reduce((earliest, sub) => {
      const subDate = new Date(sub.startDate);
      return subDate < earliest ? subDate : earliest;
    }, new Date(activeSubscriptions[0].startDate));

    // Generate months from earliest date to current month
    const months = [];
    const currentDate = new Date();
    const startDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    
    for (let date = new Date(startDate); date <= currentDate; date.setMonth(date.getMonth() + 1)) {
      months.push({
        date: new Date(date),
        month: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()),
        amount: 0,
        subscriptions: [] as string[]
      });
    }

    // Calculate spending for each month
    months.forEach(monthData => {
      activeSubscriptions.forEach(sub => {
        const subStartDate = new Date(sub.startDate);
        const monthStart = new Date(monthData.date.getFullYear(), monthData.date.getMonth(), 1);
        const monthEnd = new Date(monthData.date.getFullYear(), monthData.date.getMonth() + 1, 0);
        
        // Check if subscription was active during this month
        if (subStartDate <= monthEnd) {
          const monthlyAmount = calculateMonthlyAmount(sub.amount, sub.frequency);
          monthData.amount += monthlyAmount;
          monthData.subscriptions.push(sub.name);
        }
      });
    });

    return months.reverse(); // Most recent first
  }, [activeSubscriptions]);

  const maxAmount = Math.max(...monthlyTrend.map(m => m.amount));

  return (
    <div className="bg-gruvbox-bg0 rounded-xl shadow-sm">
      <div className="flex items-center space-x-3 p-4 border-b border-gruvbox-bg2">
        <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-gruvbox-green-bright" />
        <h2 className="text-lg font-normal text-gruvbox-fg1 flex-1">Évolution mensuelle</h2>
        <button
          onClick={onBack}
          className="p-2 text-gruvbox-fg4 hover:text-gruvbox-fg2 rounded-lg transition-colors focus:outline-none"
        >
          <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        {monthlyTrend.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gruvbox-bg1 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faChartLine} className="w-8 h-8 text-gruvbox-fg4" />
            </div>
            <p className="text-gruvbox-fg2">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="space-y-4">
            {monthlyTrend.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subscriptionColors[index % subscriptionColors.length] }}
                    />
                    <span className="text-gruvbox-fg1 font-normal">
                      {item.month}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gruvbox-fg1 font-normal">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gruvbox-bg2 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500 hover:opacity-80"
                    style={{ 
                      width: `${maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0}%`,
                      backgroundColor: subscriptionColors[index % subscriptionColors.length]
                    }}
                  />
                </div>
                {item.subscriptions.length > 0 && (
                  <div className="text-xs text-gruvbox-fg3 ml-5">
                    {item.subscriptions.length} abonnement{item.subscriptions.length > 1 ? 's' : ''} actif{item.subscriptions.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
