import React, { useMemo } from 'react';
import { Subscription } from '../types/Subscription';
import { getCategoryLabels, calculateMonthlyAmount, formatCurrency } from '../utils/subscriptionUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faChartLine, faUsers, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface ChartsProps {
  subscriptions: Subscription[];
  onShowMonthlyTrend?: () => void;
}

const categoryColors = {
  streaming: '#83a598',
  cloud: '#8ec07c',
  productivity: '#d3869b',
  fitness: '#fabd2f',
  news: '#fb4934',
  music: '#d3869b',
  gaming: '#83a598',
  education: '#b8bb26',
  finance: '#fe8019',
  other: '#a89984'
};

const subscriptionColors = [
  '#83a598', // blue
  '#8ec07c', // green
  '#d3869b', // purple
  '#fabd2f', // yellow
  '#fb4934', // red
  '#b8bb26', // lime
  '#fe8019', // orange
  '#689d6a', // aqua
  '#d79921', // gold
  '#b16286', // magenta
  '#458588', // dark blue
  '#98971a', // dark green
];
export const Charts: React.FC<ChartsProps> = ({ subscriptions, onShowMonthlyTrend }) => {
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
  const categoryLabels = getCategoryLabels();
  
  // Calculate spending by category
  const spendingByCategory = activeSubscriptions.reduce((acc, sub) => {
    const monthlyAmount = calculateMonthlyAmount(sub.amount, sub.frequency);
    acc[sub.category] = (acc[sub.category] || 0) + monthlyAmount;
    return acc;
  }, {} as Record<string, number>);

  const totalMonthlySpending = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);
  
  // Prepare data for pie chart
  const categoryData = Object.entries(spendingByCategory)
    .map(([category, amount]) => ({
      category: category as keyof typeof categoryLabels,
      amount,
      percentage: (amount / totalMonthlySpending) * 100,
      color: categoryColors[category as keyof typeof categoryColors] || '#a89984'
    }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate spending by subscription
  const subscriptionData = activeSubscriptions
    .map((sub, index) => ({
      name: sub.name,
      amount: calculateMonthlyAmount(sub.amount, sub.frequency),
      percentage: (calculateMonthlyAmount(sub.amount, sub.frequency) / totalMonthlySpending) * 100,
      color: subscriptionColors[index % subscriptionColors.length]
    }))
    .sort((a, b) => b.amount - a.amount);
  // Calculate real monthly trend based on subscription start dates
  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        date: new Date(date),
        month: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()),
        amount: 0
      };
    });

    // Calculate spending for each month based on when subscriptions were active
    months.forEach(monthData => {
      activeSubscriptions.forEach(sub => {
        const subStartDate = new Date(sub.startDate);
        const monthEnd = new Date(monthData.date.getFullYear(), monthData.date.getMonth() + 1, 0);
        
        // Check if subscription was active during this month
        if (subStartDate <= monthEnd) {
          // If subscription started this month or earlier, include its cost
          const monthlyAmount = calculateMonthlyAmount(sub.amount, sub.frequency);
          monthData.amount += monthlyAmount;
        }
      });
    });

    return months;
  }, [activeSubscriptions]);

  const maxTrendAmount = Math.max(...monthlyTrend.map(m => m.amount));

  return (
    <div className="space-y-6">
      {/* Category Breakdown */}
      <div className="bg-gruvbox-bg0 rounded-xl shadow-sm">
        <div 
          className="p-4 rounded-t-xl relative bg-gruvbox-green-bright"
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
            <FontAwesomeIcon icon={faChartPie} className="w-5 h-5 text-gruvbox-fg0" />
            <h2 className="text-lg font-normal text-gruvbox-fg0">Répartition par catégorie</h2>
          </div>
        </div>
        
        <div className="py-4 px-6 space-y-3">
          {activeSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gruvbox-bg1 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faChartPie} className="w-8 h-8 text-gruvbox-fg4" />
              </div>
              <p className="text-gruvbox-fg2">Aucune donnée à afficher</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryData.map((item) => (
                <div key={String(item.category)} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gruvbox-fg1 font-normal">
                        {categoryLabels[String(item.category)]}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gruvbox-fg1 font-normal">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-gruvbox-fg3 ml-1">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gruvbox-bg2 rounded-full h-2 mb-5">
                    <div
                      className="h-2 rounded-full transition-all duration-500 hover:opacity-80"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subscription Breakdown */}
      <div className="bg-gruvbox-bg0 rounded-xl shadow-sm">
        <div 
          className="p-4 rounded-t-xl relative bg-gruvbox-blue-bright"
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
            <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-gruvbox-fg0" />
            <h2 className="text-lg font-normal text-gruvbox-fg0">Répartition par abonnement</h2>
          </div>
        </div>
        
        <div className="py-4 px-6 space-y-3">
          {activeSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gruvbox-bg1 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-gruvbox-fg4" />
              </div>
              <p className="text-gruvbox-fg2">Aucune donnée à afficher</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptionData.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gruvbox-fg1 font-normal">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gruvbox-fg1 font-normal">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-gruvbox-fg3 ml-1">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gruvbox-bg2 rounded-full h-2 mb-5">
                    <div
                      className="h-2 rounded-full transition-all duration-500 hover:opacity-80"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-gruvbox-bg0 rounded-xl shadow-sm">
        <div 
          className="p-4 rounded-t-xl relative bg-gruvbox-orange-bright"
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
            <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-gruvbox-fg0" />
            <h2 className="text-lg font-normal text-gruvbox-fg0">Évolution mensuelle</h2>
          </div>
        </div>

        <div className="py-4 px-6 space-y-3">
          {activeSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gruvbox-bg1 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faChartLine} className="w-8 h-8 text-gruvbox-fg4" />
              </div>
              <p className="text-gruvbox-fg2">Aucune donnée à afficher</p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {monthlyTrend.map((item, index) => (
                  <div key={index} className="space-y-1">
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
                    <div className="w-full bg-gruvbox-bg2 rounded-full h-2 mb-5">
                      <div
                        className="h-2 rounded-full transition-all duration-500 hover:opacity-80"
                        style={{ 
                          width: `${maxTrendAmount > 0 ? (item.amount / maxTrendAmount) * 100 : 0}%`,
                          backgroundColor: subscriptionColors[index % subscriptionColors.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 border-t border-gruvbox-bg2">
                <button
                  onClick={onShowMonthlyTrend}
                  className="flex items-center space-x-1 text-sm text-gruvbox-blue-bright hover:text-gruvbox-blue transition-colors ml-auto focus:outline-none"
                >
                  <span>Voir plus</span>
                  <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
