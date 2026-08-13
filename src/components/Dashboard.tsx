import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { WeekCard } from './WeekCard';

export const Dashboard: React.FC = () => {
  const { state, navigate } = useApp();
  const { weeks, currentUser } = state;

  const sorted = useMemo(
    () => [...weeks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [weeks]
  );

  const upcoming = sorted.filter((w) => !w.completed);
  const completed = sorted.filter((w) => w.completed);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="dashboard-header animate-fade">
        <div>
          <p className="dashboard-greeting">{greeting()},</p>
          <h1>{currentUser?.name} 👋</h1>
        </div>
        <div
          className="avatar avatar-lg"
          style={{
            background: `linear-gradient(135deg, ${currentUser?.color}, ${currentUser?.color}aa)`,
            boxShadow: `0 4px 16px ${currentUser?.color}44`,
          }}
        >
          {currentUser?.initials}
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        <div className="card animate-up delay-1">
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--c-primary)', fontFamily: 'Sora' }}>
              {weeks.length}
            </div>
            <div className="text-sm text-muted">Adorações</div>
          </div>
        </div>
        <div className="card animate-up delay-2">
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--c-success)', fontFamily: 'Sora' }}>
              {completed.length}
            </div>
            <div className="text-sm text-muted">Realizadas</div>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="animate-up delay-2" style={{ marginBottom: '32px' }}>
          <p className="section-title">📅 Próximas</p>
          <div className="weeks-list">
            {upcoming.map((w, i) => (
              <WeekCard key={w.id} week={w} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="animate-up delay-3">
          <p className="section-title">✅ Realizadas</p>
          <div className="weeks-list">
            {completed.map((w, i) => (
              <WeekCard key={w.id} week={w} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {weeks.length === 0 && (
        <div className="empty-state animate-up delay-2">
          <div className="empty-icon">🌱</div>
          <h3 style={{ marginBottom: '8px' }}>Nenhuma adoração ainda</h3>
          <p className="text-sm text-muted" style={{ marginBottom: '24px' }}>
            Comece planejando a adoração em família desta semana!
          </p>
          <button className="btn btn-primary" onClick={() => navigate('week-form')}>
            ＋ Adicionar Adoração
          </button>
        </div>
      )}

      {/* FAB */}
      {weeks.length > 0 && (
        <button
          className="fab"
          onClick={() => navigate('week-form')}
          title="Nova adoração"
          aria-label="Adicionar nova adoração"
        >
          +
        </button>
      )}
    </div>
  );
};
