import React from 'react';
import { useApp } from '../context/AppContext';
import { HomeIcon, PlusIcon, SettingsIcon } from './Icons';

export const Navigation: React.FC = () => {
  const { state, navigate } = useApp();
  const { currentPage } = state;

  return (
    <nav className="nav-bar" role="navigation" aria-label="Navegação principal">
      <div className="nav-inner">
        <button
          className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => navigate('dashboard')}
          aria-label="Início"
        >
          <HomeIcon size={20} className="nav-icon-svg" />
          <span>Início</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'week-form' ? 'active' : ''}`}
          onClick={() => navigate('week-form')}
          aria-label="Novo"
        >
          <PlusIcon size={20} className="nav-icon-svg" />
          <span>Novo</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => navigate('settings')}
          aria-label="Configurações"
        >
          <SettingsIcon size={20} className="nav-icon-svg" />
          <span>Config</span>
        </button>
      </div>
    </nav>
  );
};
