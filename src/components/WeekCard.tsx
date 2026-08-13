import React from 'react';
import { useApp } from '../context/AppContext';
import type { Week } from '../types';
import { WEEK_TYPE_LABELS } from '../types';
import { getWeekRangeString } from '../utils/dateUtils';
import { BookIcon, TvIcon, DocIcon, SparklesIcon } from './Icons';

interface WeekCardProps {
  week: Week;
  index: number;
  onClick: () => void;
}

export const WeekCard: React.FC<WeekCardProps> = ({ week, index, onClick }) => {
  const { getUserById } = useApp();
  const responsible = getUserById(week.responsibleId);
  const delayClass = `delay-${Math.min(index + 1, 5)}`;

  const title = week.type === 'theme' && week.theme
    ? week.theme
    : WEEK_TYPE_LABELS[week.type];

  // Pick custom SVG icon
  const getIcon = () => {
    switch (week.type) {
      case 'meeting_prep': return <DocIcon size={24} style={{ color: 'var(--c-primary)' }} />;
      case 'broadcast': return <TvIcon size={24} style={{ color: 'var(--c-primary)' }} />;
      case 'theme': return <BookIcon size={24} style={{ color: 'var(--c-accent)' }} />;
      default: return <SparklesIcon size={24} style={{ color: 'var(--c-text-3)' }} />;
    }
  };

  const isFree = week.type === 'free';

  return (
    <div
      className={`card interactive animate-up ${delayClass} ${week.completed ? 'completed-card' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        padding: '16px',
        marginBottom: '12px',
        borderLeft: isFree
          ? '3px dashed var(--c-border)'
          : week.type === 'theme'
            ? '4px solid var(--c-accent)'
            : '4px solid var(--c-primary)',
        background: isFree ? 'rgba(0,0,0,0.01)' : 'var(--c-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderRadius: 'var(--r-md)',
        boxShadow: isFree ? 'none' : 'var(--shadow-sm)',
        border: isFree ? '1px dashed var(--c-border)' : '1px solid var(--c-border)',
        cursor: 'pointer',
      }}
    >
      {/* Icon Area */}
      <div style={{
        width: '46px', height: '46px', borderRadius: 'var(--r-sm)',
        background: isFree ? 'transparent' : 'var(--c-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {getIcon()}
      </div>

      {/* Info Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--c-text-2)', marginBottom: '3px' }}>
          {getWeekRangeString(week.date)}
        </div>
        <div style={{
          fontWeight: 700, fontSize: '0.98rem',
          color: isFree ? 'var(--c-text-3)' : 'var(--c-text)',
          lineHeight: 1.35,
        }}>
          {isFree ? '✨ Sem tema definido (clique para agendar)' : title}
        </div>
        
        {/* Meta badges */}
        {!isFree && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
            {responsible && (
              <span className="badge" style={{
                background: `${responsible.color}15`,
                color: responsible.color,
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: 'var(--r-xs)',
              }}>
                {responsible.name}
              </span>
            )}
            {week.completed && (
              <span className="badge badge-success" style={{ fontSize: '0.7rem', fontWeight: 600, borderRadius: 'var(--r-xs)' }}>
                ✓ Realizada
              </span>
            )}
            {week.generatedContent && (
              <span className="badge" style={{ background: 'var(--c-primary-20)', color: 'var(--c-primary)', fontSize: '0.7rem', fontWeight: 600, borderRadius: 'var(--r-xs)' }}>
                Roteiro IA
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow / Indicator */}
      {!isFree && (
        <div style={{ color: 'var(--c-text-3)', fontSize: '1.2rem', paddingRight: '4px' }}>›</div>
      )}
    </div>
  );
};
