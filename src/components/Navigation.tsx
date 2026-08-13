import React from 'react';
import { useApp } from '../context/AppContext';
import type { Page } from '../types';

const NAV_ITEMS: { page: Page; icon: string; label: string }[] = [
  { page: 'dashboard', icon: '🏠', label: 'Início' },
  { page: 'week-form', icon: '➕', label: 'Novo' },
  { page: 'settings', icon: '⚙️', label: 'Config' },
];

export const Navigation: React.FC = () => {
  const { state, navigate } = useApp();

  return (
    <nav className="nav-bar" role="navigation" aria-label="Navegação principal">
      <div className="nav-inner">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.page === 'dashboard'
              ? state.currentPage === 'dashboard' || state.currentPage === 'week-detail'
              : state.currentPage === item.page;

          return (
            <button
              key={item.page}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.page)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-icon">{item.icon}</div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
