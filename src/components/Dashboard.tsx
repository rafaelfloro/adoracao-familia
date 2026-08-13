import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getCalendarGrid, toLocalDateString } from '../utils/dateUtils';
import { WEEK_TYPE_ICONS, WEEK_TYPE_LABELS, USERS } from '../types';
import { WeekDetailModal } from './WeekDetail';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const Dashboard: React.FC = () => {
  const { state, initializeMonthWeeks, addThemeToQueue } = useApp();
  const { weeks, currentUser } = state;

  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [themeInput, setThemeInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [dynamicInput, setDynamicInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Auto initialize weeks for the currently displayed month
  useEffect(() => {
    initializeMonthWeeks(currentYear, currentMonth);
  }, [currentYear, currentMonth, weeks]); // Runs when month changes or weeks are updated

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Add Theme to automatic queue
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeInput.trim()) return;

    setIsAdding(true);
    setAddError('');

    try {
      // Automatically schedules to the first free Monday, assigns responsible to current user, and starts Gemini content generation!
      const newWeekId = await addThemeToQueue(themeInput, descInput, dynamicInput);
      setThemeInput('');
      setDescInput('');
      setDynamicInput('');
      setShowAddModal(false);
      
      // Open details modal of the newly scheduled week
      setActiveWeekId(newWeekId);
    } catch (err) {
      setAddError((err as Error).message || 'Erro ao agendar tema.');
    } finally {
      setIsAdding(false);
    }
  };

  // Generate calendar grid dates
  const gridDates = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const todayStr = useMemo(() => toLocalDateString(today), [today]);

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      
      {/* Header Greeting */}
      <div className="dashboard-header animate-fade" style={{ marginBottom: '20px' }}>
        <div>
          <p className="dashboard-greeting">Olá, adoração em família</p>
          <h1 className="font-display">Família Floro</h1>
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

      {/* Quick Add Theme Trigger Card */}
      <div className="card animate-up delay-1" style={{ marginBottom: '24px', borderLeft: '4px solid var(--c-accent)' }}>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--c-text)' }}>Sugerir novo tema bíblico?</h3>
            <p className="text-xs text-muted">A IA vai gerar o estudo completo e agendar na próxima data livre.</p>
          </div>
          <button className="btn btn-sm btn-primary badge-accent" onClick={() => setShowAddModal(true)} style={{ background: 'var(--c-accent)', color: 'white', border: 'none' }}>
            + Sugerir Tema
          </button>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="calendar-container animate-up delay-2">
        <p className="section-title">📅 Cronograma Mensal</p>
        
        {/* Calendar Nav */}
        <div className="calendar-header">
          <button className="btn btn-sm btn-ghost" onClick={handlePrevMonth} style={{ fontSize: '1.1rem', padding: '0 12px' }}>
            ◀
          </button>
          <div className="calendar-month-title">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </div>
          <button className="btn btn-sm btn-ghost" onClick={handleNextMonth} style={{ fontSize: '1.1rem', padding: '0 12px' }}>
            ▶
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Weekday headers */}
          {WEEKDAY_NAMES.map((dayName) => (
            <div key={dayName} className="calendar-day-header">
              {dayName}
            </div>
          ))}

          {/* Grid cells */}
          {gridDates.map((date, idx) => {
            const dateStr = toLocalDateString(date);
            const isOutside = date.getMonth() !== currentMonth;
            const isToday = dateStr === todayStr;
            const weekWorship = weeks.find((w) => w.date === dateStr);

            return (
              <div
                key={idx}
                className={`calendar-cell ${isOutside ? 'outside' : ''} ${isToday ? 'today' : ''}`}
              >
                <div className="calendar-day-number">{date.getDate()}</div>
                
                {weekWorship && (
                  <div
                    className={`calendar-worship-card ${weekWorship.completed ? 'completed' : ''}`}
                    onClick={() => setActiveWeekId(weekWorship.id)}
                    style={
                      !weekWorship.completed && weekWorship.type === 'theme'
                        ? { borderLeft: `3.5px solid var(--c-accent)` }
                        : undefined
                    }
                  >
                    <div className="worship-card-title">
                      {weekWorship.type === 'theme' && weekWorship.theme ? weekWorship.theme : WEEK_TYPE_LABELS[weekWorship.type]}
                    </div>
                    <div className="worship-card-meta">
                      <span className="worship-card-type-icon">
                        {WEEK_TYPE_ICONS[weekWorship.type]}
                      </span>
                      {weekWorship.type !== 'free' && (
                        <span
                          className="worship-card-initials"
                          style={{
                            background: USERS.find((u) => u.id === weekWorship.responsibleId)?.color || 'var(--c-primary)',
                          }}
                        >
                          {USERS.find((u) => u.id === weekWorship.responsibleId)?.initials || 'F'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Details Popup Modal */}
      {activeWeekId && (
        <WeekDetailModal weekId={activeWeekId} onClose={() => setActiveWeekId(null)} />
      )}

      {/* Quick Add Theme Dialog Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title">✨ Sugerir Tema de Adoração</div>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleQuickAddSubmit} className="form-grid">
                
                <div className="input-group">
                  <label className="input-label" htmlFor="popup-theme">💡 Tema Bíblico</label>
                  <input
                    id="popup-theme"
                    className="input"
                    value={themeInput}
                    onChange={(e) => setThemeInput(e.target.value)}
                    placeholder="Ex: Fé e coragem, Criação vs Evolução..."
                    required
                    disabled={isAdding}
                    autoFocus
                  />
                  <span className="text-xs text-muted">Exemplo: Importância da oração, como fazer boas escolhas...</span>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="popup-desc">📝 Descrição/Contexto <span className="text-muted">(opcional)</span></label>
                  <textarea
                    id="popup-desc"
                    className="input textarea"
                    style={{ minHeight: '80px' }}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="Diga se tem algum foco específico que gostaria que a IA elaborasse..."
                    disabled={isAdding}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="popup-dynamic">🎮 Dinâmica Planejada <span className="text-muted">(opcional)</span></label>
                  <textarea
                    id="popup-dynamic"
                    className="input textarea"
                    style={{ minHeight: '60px' }}
                    value={dynamicInput}
                    onChange={(e) => setDynamicInput(e.target.value)}
                    placeholder="Ex: Quiz bíblico, jogo de tabuleiro..."
                    disabled={isAdding}
                  />
                  <span className="text-xs text-muted">Se deixar vazio, a IA vai sugerir dinâmicas ótimas.</span>
                </div>

                {addError && (
                  <div className="error-banner">
                    <span>⚠️</span>
                    <span>{addError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  style={{ background: 'var(--c-accent)', border: 'none', color: 'white' }}
                  disabled={isAdding || !themeInput.trim()}
                >
                  {isAdding ? (
                    <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Agendando e gerando roteiro...</>
                  ) : (
                    <>✨ Agendar e Criar Estudo</>
                  )}
                </button>

              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
