import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { WeekDetail } from './components/WeekDetail';
import { WeekForm } from './components/WeekForm';
import { Settings } from './components/Settings';
import { Navigation } from './components/Navigation';

const PageRenderer: React.FC = () => {
  const { state } = useApp();
  const { currentPage, currentUser } = state;

  if (!currentUser) return <Login />;

  return (
    <>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'week-detail' && <WeekDetail />}
      {currentPage === 'week-form' && <WeekForm />}
      {currentPage === 'settings' && <Settings />}
      <Navigation />
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <PageRenderer />
    </AppProvider>
  );
}

export default App;
