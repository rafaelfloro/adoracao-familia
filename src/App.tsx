import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { WeekForm } from './components/WeekForm';
import { Settings } from './components/Settings';
import { Navigation } from './components/Navigation';

import { SunIcon, MoonIcon, SettingsIcon } from './components/Icons';

const PageRenderer: React.FC = () => {
  const { state, navigate, saveAppSettings } = useApp();
  const { currentPage, currentUser } = state;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'light');
  }, [state.settings.theme]);

  if (!currentUser) return <Login />;

  const handleToggleTheme = () => {
    const nextTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    saveAppSettings({ ...state.settings, theme: nextTheme });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* JW Style Top Header Bar - Full Width Span */}
      <header className="jw-header">
        <div className="jw-header-inner">
          {/* Logo & Title */}
          <div className="jw-logo-group" onClick={() => navigate('dashboard')} style={{ cursor: 'pointer' }}>
            <div className="jw-logo-square">AF</div>
            <div className="jw-logo-text">
              <span className="jw-logo-title">ADORAÇÃO EM FAMÍLIA</span>
              <span className="jw-logo-subtitle">Família Floro</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="jw-header-controls">
            <button className="jw-control-btn" onClick={handleToggleTheme} title="Alternar Tema">
              {state.settings.theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </button>
            <button className="jw-control-btn" onClick={() => navigate('settings')} title="Configurações">
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Centered Main Content Area */}
      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'week-form' && <WeekForm />}
        {currentPage === 'settings' && <Settings />}
      </main>

      <Navigation />
    </div>
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
