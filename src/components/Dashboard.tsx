import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { WeekCard } from './WeekCard';
import { WeekDetailModal } from './WeekDetail';
import { SunIcon, MoonIcon, PlusIcon, SettingsIcon } from './Icons';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Dashboard: React.FC = () => {
  const { state, navigate, initializeMonthWeeks, addThemeToQueue, saveAppSettings } = useApp();
  const { weeks } = state;

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

  // Auto initialize standard weeks when displaying a month
  useEffect(() => {
    initializeMonthWeeks(currentYear, currentMonth);
  }, [currentYear, currentMonth, weeks]);

  // Navigate months
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

  // Submit quick theme suggestion to queue
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeInput.trim()) return;

    setIsAdding(true);
    setAddError('');

    try {
      const newWeekId = await addThemeToQueue(themeInput, descInput, dynamicInput);
      setThemeInput('');
      setDescInput('');
      setDynamicInput('');
      setShowAddModal(false);
      
      // Instantly pop up the details of the newly created week
      setActiveWeekId(newWeekId);
    } catch (err) {
      setAddError((err as Error).message || 'Erro ao agendar tema.');
    } finally {
      setIsAdding(false);
    }
  };

  // Filter weeks belonging to currently displayed month
  const displayedMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthWeeks = useMemo(() => {
    return weeks
      .filter((w) => w.date.startsWith(displayedMonthStr))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [weeks, displayedMonthStr]);

  // Toggle Dark/Light Theme
  const handleToggleTheme = () => {
    const nextTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    saveAppSettings({ ...state.settings, theme: nextTheme });
  };

  return (
    <div className="page" style={{ paddingBottom: '100px', background: 'var(--c-bg)', minHeight: '100vh' }}>
      
      {/* JW Style Top Header Bar */}
      <div style={{
        background: 'var(--c-primary-dark)',
        color: '#ffffff',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-sm)',
        margin: '-20px -16px 20px -16px', // pull negative margin on containers
      }}>
        {/* Left Square Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--c-primary)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.95rem',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--r-xs)',
          }}>
            AF
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.03em' }}>ADORAÇÃO EM FAMÍLIA</span>
            <span style={{ fontSize: '0.72rem', display: 'block', opacity: 0.8, marginTop: '-2px' }}>Família Floro</span>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme Selector Toggle */}
          <button
            onClick={handleToggleTheme}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Alternar Tema"
          >
            {state.settings.theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </button>
          
          <button
            onClick={() => navigate('settings')}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Configurações"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      {/* JW Style Secondary Sub Bar */}
      <div style={{
        background: 'var(--c-surface-2)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-sm)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-xs)',
      }}>
        {/* Month Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-sm btn-ghost" onClick={handlePrevMonth} style={{ padding: '4px 8px', fontSize: '0.9rem' }}>
            ◀
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--c-primary)', textTransform: 'capitalize' }}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button className="btn btn-sm btn-ghost" onClick={handleNextMonth} style={{ padding: '4px 8px', fontSize: '0.9rem' }}>
            ▶
          </button>
        </div>

        <button
          className="btn btn-sm btn-primary"
          style={{ background: 'var(--c-accent)', border: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() => setShowAddModal(true)}
        >
          <PlusIcon size={16} />
          Sugerir Tema
        </button>
      </div>

      {/* Watchtower Study Schedule Sheet layout */}
      <div style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: '20px',
      }}>
        <div style={{ borderBottom: '1px solid var(--c-border)', paddingBottom: '10px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--c-primary)' }}>Programa de Estudo</h2>
          <p className="text-xs text-muted" style={{ marginTop: '2px' }}>Organização das reuniões semanais de Adoração em Família</p>
        </div>

        {/* Weekly Schedule list */}
        {monthWeeks.length > 0 ? (
          <div>
            {monthWeeks.map((week, idx) => (
              <WeekCard
                key={week.id}
                week={week}
                index={idx}
                onClick={() => setActiveWeekId(week.id)}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--c-text-3)' }}>
            Nenhuma semana agendada para este mês.
          </div>
        )}
      </div>

      {/* Week Details Popup Modal */}
      {activeWeekId && (
        <WeekDetailModal weekId={activeWeekId} onClose={() => setActiveWeekId(null)} />
      )}

      {/* Suggest Theme Dialog Popup Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div className="modal-title">Sugerir Tema de Adoração</div>
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
                  <span className="text-xs text-muted">A IA agendará no próximo slot vago do calendário.</span>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="popup-desc">📝 Contexto / Detalhes <span className="text-muted">(opcional)</span></label>
                  <textarea
                    id="popup-desc"
                    className="input textarea"
                    style={{ minHeight: '70px' }}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="Especifique algum foco ou relato que queira abordar..."
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
                    placeholder="Caso queira sugerir alguma atividade específica..."
                    disabled={isAdding}
                  />
                </div>

                {addError && (
                  <div className="error-banner">
                    <span>⚠️</span>
                    <span>{addError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  style={{ background: 'var(--c-accent)', border: 'none', color: '#ffffff', fontWeight: 'bold' }}
                  disabled={isAdding || !themeInput.trim()}
                >
                  {isAdding ? (
                    <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Agendando...</>
                  ) : (
                    <>✨ Enviar para Fila</>
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
