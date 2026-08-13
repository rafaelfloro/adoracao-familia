import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Week, WeekType } from '../types';
import { USERS, WEEK_TYPE_ICONS, WEEK_TYPE_LABELS } from '../types';

const WEEK_TYPES: WeekType[] = ['theme', 'broadcast', 'meeting_prep', 'free'];

function today(): string {
  return new Date().toISOString().split('T')[0];
}

const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button className="back-btn" onClick={onClick} aria-label="Voltar">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
    Voltar
  </button>
);

export const WeekForm: React.FC = () => {
  const { state, navigate, upsertWeek } = useApp();
  const editingWeek = state.weeks.find((w) => w.id === state.editingWeekId);
  const isEditing = !!editingWeek;

  const [date, setDate] = useState(editingWeek?.date ?? today());
  const [responsibleId, setResponsibleId] = useState(editingWeek?.responsibleId ?? (state.currentUser?.id ?? 'rafael'));
  const [type, setType] = useState<WeekType>(editingWeek?.type ?? 'theme');
  const [theme, setTheme] = useState(editingWeek?.theme ?? '');
  const [description, setDescription] = useState(editingWeek?.description ?? '');
  const [customDynamic, setCustomDynamic] = useState(editingWeek?.customDynamic ?? '');
  const [completed, setCompleted] = useState(editingWeek?.completed ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (type !== 'theme') setTheme('');
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));

    const week: Week = {
      id: editingWeek?.id ?? crypto.randomUUID(),
      date,
      responsibleId: responsibleId as any,
      type,
      theme: type === 'theme' ? theme : undefined,
      description: description || undefined,
      customDynamic: customDynamic || undefined,
      generatedContent: editingWeek?.generatedContent,
      completed,
      notes: editingWeek?.notes,
      createdAt: editingWeek?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    upsertWeek(week);
    navigate('week-detail', week.id);
  };

  return (
    <div className="page">
      <BackBtn onClick={() => navigate(isEditing ? 'week-detail' : 'dashboard', editingWeek?.id)} />

      <h2 className="animate-up" style={{ marginBottom: '24px' }}>
        {isEditing ? '✎ Editar Adoração' : '✨ Nova Adoração'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">

          {/* Date */}
          <div className="input-group animate-up delay-1">
            <label className="input-label" htmlFor="date">📅 Data da Adoração</label>
            <input
              id="date"
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Responsible */}
          <div className="input-group animate-up delay-1">
            <label className="input-label">👤 Responsável</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setResponsibleId(user.id)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 'var(--r-md)',
                    border: `2px solid ${responsibleId === user.id ? user.color : 'var(--c-border)'}`,
                    background: responsibleId === user.id ? `${user.color}18` : 'var(--c-surface)',
                    cursor: 'pointer',
                    transition: 'all var(--t-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <div
                    className="avatar"
                    style={{
                      width: '36px', height: '36px',
                      fontSize: '0.75rem',
                      background: `linear-gradient(135deg, ${user.color}, ${user.color}bb)`,
                    }}
                  >
                    {user.initials}
                  </div>
                  <span style={{ fontSize: '0.73rem', fontWeight: 600, color: responsibleId === user.id ? user.color : 'var(--c-text-2)' }}>
                    {user.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="input-group animate-up delay-2">
            <label className="input-label">📚 Tipo de Adoração</label>
            <div className="type-grid">
              {WEEK_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`type-option ${type === t ? 'selected' : ''}`}
                  onClick={() => setType(t)}
                >
                  <span className="type-option-icon">{WEEK_TYPE_ICONS[t]}</span>
                  <span className="type-option-label">{WEEK_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme (only for 'theme' type) */}
          {type === 'theme' && (
            <div className="input-group animate-up">
              <label className="input-label" htmlFor="theme">💡 Tema do Estudo</label>
              <input
                id="theme"
                className="input"
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex: Fé e coragem, Criação vs Evolução..."
                required
              />
              <span className="text-xs text-muted">O Gemini vai criar um roteiro completo sobre este tema</span>
            </div>
          )}

          {/* Description */}
          <div className="input-group animate-up delay-2">
            <label className="input-label" htmlFor="desc">📝 Contexto adicional <span className="text-muted">(opcional)</span></label>
            <textarea
              id="desc"
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Situação específica, foco desejado, algo que aconteceu esta semana..."
            />
          </div>

          {/* Dynamic */}
          <div className="input-group animate-up delay-3">
            <label className="input-label" htmlFor="dynamic">🎮 Dinâmica planejada <span className="text-muted">(opcional)</span></label>
            <textarea
              id="dynamic"
              className="input textarea"
              style={{ minHeight: '80px' }}
              value={customDynamic}
              onChange={(e) => setCustomDynamic(e.target.value)}
              placeholder="Ex: Jogo bíblico de perguntas, encenação de relato, maquete..."
            />
            <span className="text-xs text-muted">Se deixar vazio, a IA vai sugerir dinâmicas para você</span>
          </div>

          {/* Completed */}
          {isEditing && (
            <div className="animate-up delay-3">
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '14px 0' }}
              >
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--c-primary)' }}
                />
                <span className="font-medium">Marcar como realizada</span>
              </label>
            </div>
          )}

          {/* Submit */}
          <div className="animate-up delay-4">
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={saving || (type === 'theme' && !theme.trim())}
            >
              {saving ? (
                <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Salvando...</>
              ) : (
                <>{isEditing ? '✓ Salvar Alterações' : '✨ Criar Adoração'}</>
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};
