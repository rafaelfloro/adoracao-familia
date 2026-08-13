import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const WeekForm: React.FC = () => {
  const { navigate, addThemeToQueue } = useApp();
  const [theme, setTheme] = useState('');
  const [description, setDescription] = useState('');
  const [customDynamic, setCustomDynamic] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;

    setSaving(true);
    setError('');

    try {
      await addThemeToQueue(theme, description, customDynamic);
      
      // Navigate to dashboard and select the newly created week to open its popup details!
      navigate('dashboard');
      // Set selected week id so Dashboard opens it in popup
      // Note: context already updates state
    } catch (err) {
      setError((err as Error).message || 'Erro ao agendar tema.');
      setSaving(false);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      <button className="back-btn" onClick={() => navigate('dashboard')} aria-label="Voltar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Cancelar
      </button>

      <h2 className="animate-up" style={{ marginBottom: '8px' }}>✨ Sugerir Tema</h2>
      <p className="text-sm text-muted animate-up delay-1" style={{ marginBottom: '24px' }}>
        O tema será adicionado automaticamente na próxima data livre da adoração em família.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          
          {/* Theme */}
          <div className="input-group animate-up delay-1">
            <label className="input-label" htmlFor="form-theme">💡 Tema Bíblico</label>
            <input
              id="form-theme"
              className="input"
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Fé e coragem, Criação vs Evolução..."
              required
              disabled={saving}
              autoFocus
            />
            <span className="text-xs text-muted">A IA vai gerar um roteiro de adoração detalhado para o tema.</span>
          </div>

          {/* Description */}
          <div className="input-group animate-up delay-2">
            <label className="input-label" htmlFor="form-desc">📝 Contexto adicional <span className="text-muted">(opcional)</span></label>
            <textarea
              id="form-desc"
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Alguma situação específica da semana, ou foco bíblico que você queira..."
              disabled={saving}
            />
          </div>

          {/* Dynamic */}
          <div className="input-group animate-up delay-3">
            <label className="input-label" htmlFor="form-dynamic">🎮 Dinâmica Planejada <span className="text-muted">(opcional)</span></label>
            <textarea
              id="form-dynamic"
              className="input textarea"
              style={{ minHeight: '80px' }}
              value={customDynamic}
              onChange={(e) => setCustomDynamic(e.target.value)}
              placeholder="Se tiver uma ideia de dinâmica, digite aqui. Caso contrário, a IA sugerirá uma."
              disabled={saving}
            />
          </div>

          {error && (
            <div className="error-banner animate-fade">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="animate-up delay-4">
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              style={{ background: 'var(--c-accent)', border: 'none', color: 'white' }}
              disabled={saving || !theme.trim()}
            >
              {saving ? (
                <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Agendando e gerando roteiro...</>
              ) : (
                <>✨ Enviar para Fila</>
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};
