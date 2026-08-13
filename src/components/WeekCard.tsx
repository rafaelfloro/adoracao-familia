import React from 'react';
import { useApp } from '../context/AppContext';
import type { Week } from '../types';
import { WEEK_TYPE_ICONS, WEEK_TYPE_LABELS } from '../types';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

interface WeekCardProps {
  week: Week;
  index: number;
}

export const WeekCard: React.FC<WeekCardProps> = ({ week, index }) => {
  const { navigate, getUserById } = useApp();
  const responsible = getUserById(week.responsibleId);
  const delayClass = `delay-${Math.min(index + 1, 5)}`;

  const title = week.type === 'theme' && week.theme
    ? week.theme
    : WEEK_TYPE_LABELS[week.type];

  return (
    <div
      className={`card interactive animate-up ${delayClass}`}
      onClick={() => navigate('week-detail', week.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate('week-detail', week.id)}
      aria-label={`Adoração: ${title}`}
    >
      <div className="week-card">
        {/* Icon */}
        <div className="week-card-icon">
          {WEEK_TYPE_ICONS[week.type]}
        </div>

        {/* Body */}
        <div className="week-card-body">
          <div className="week-card-date">{formatDate(week.date)}</div>
          <div className="week-card-title">{title}</div>
          <div className="week-card-meta">
            {responsible && (
              <span className="badge badge-primary">
                {responsible.name}
              </span>
            )}
            {week.completed && (
              <span className="badge badge-success">✓ Realizada</span>
            )}
            {week.generatedContent && (
              <span className="badge" style={{ background: 'rgba(121,159,204,0.15)', color: 'var(--c-secondary)' }}>
                ✨ IA Gerado
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="week-card-arrow">›</div>
      </div>
    </div>
  );
};
