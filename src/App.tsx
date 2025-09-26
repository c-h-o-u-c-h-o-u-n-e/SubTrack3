import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Subscription } from './types/Subscription';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [subscriptions, setSubscriptions] = useLocalStorage<Subscription[]>('subscriptions', []);

  const handleAddSubscription = (subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSubscription: Subscription = {
      ...subscriptionData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSubscriptions(prev => [...prev, newSubscription]);
  };

  const handleUpdateSubscription = (id: string, subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === id 
        ? { ...sub, ...subscriptionData, updatedAt: new Date().toISOString() }
        : sub
    ));
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <Dashboard
            subscriptions={subscriptions}
            onAddSubscription={handleAddSubscription}
            onUpdateSubscription={handleUpdateSubscription}
            onDeleteSubscription={handleDeleteSubscription}
          />
        } 
      />
    </Routes>
  );
}

export default App;
