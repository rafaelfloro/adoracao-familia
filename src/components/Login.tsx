import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { USERS } from '../types';
import { BookIcon } from './Icons';

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

export const Login: React.FC = () => {
  const { login } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [keepConnected, setKeepConnected] = useState(true);
  const [error, setError] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !password) {
      setError('Selecione um perfil e insira a senha.');
      return;
    }
    setIsLogging(true);
    await new Promise((r) => setTimeout(r, 400)); // smooth delay
    const ok = login(selectedId, password);
    if (ok) {
      if (keepConnected) {
        localStorage.setItem('saved_user_id', selectedId);
      } else {
        localStorage.removeItem('saved_user_id');
      }
    } else {
      setError('Senha incorreta. Tente novamente.');
      setIsLogging(false);
    }
  };

  return (
    <div className="login-page">
      {/* Logo */}
      <div className="login-logo animate-up">
        <div className="login-logo-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--c-primary)', marginBottom: '10px' }}>
          <BookIcon size={38} />
        </div>
        <h1 className="login-title">Adoração em Família</h1>
        <p className="login-subtitle">Família Floro · Bem-vindo(a)!</p>
      </div>

      {/* Card */}
      <div className="card login-card animate-up delay-1">
        <div className="card-body" style={{ padding: '28px' }}>
          <form onSubmit={handleSubmit}>
            {/* Profiles */}
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Quem está acessando?</label>
              <div className="login-profiles">
                {USERS.map((user, i) => (
                  <button
                    key={user.id}
                    type="button"
                    className={`profile-btn animate-up delay-${i + 2}`}
                    onClick={() => handleSelect(user.id)}
                    style={selectedId === user.id ? { borderColor: user.color } : undefined}
                  >
                    <div
                      className="avatar"
                      style={{ background: `linear-gradient(135deg, ${user.color}, ${user.color}bb)` }}
                    >
                      {user.initials}
                    </div>
                    <div>
                      <div className="profile-btn-name">{user.fullName}</div>
                    </div>
                    <div
                      className="profile-check"
                      style={
                        selectedId === user.id
                          ? { display: 'flex', background: user.color }
                          : undefined
                      }
                    >
                      ✓
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div className="input-group" style={{ marginBottom: '14px' }}>
              <label className="input-label" htmlFor="password">Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Digite sua senha"
                  style={{ paddingRight: '48px' }}
                  disabled={!selectedId}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--c-text-3)',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color var(--t-fast)',
                    background: 'none',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-text-3)')}
                >
                  <EyeIcon open={showPwd} />
                </button>
              </div>
            </div>

            {/* Keep Connected Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="keepConnected"
                checked={keepConnected}
                onChange={(e) => setKeepConnected(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
              />
              <label htmlFor="keepConnected" style={{ fontSize: '0.82rem', color: 'var(--c-text-2)', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                Continuar conectado
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="error-banner" style={{ marginBottom: '16px' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={!selectedId || !password || isLogging}
            >
              {isLogging ? (
                <><div className="spinner" style={{ borderTopColor: '#fff' }} /><span>Entrando...</span></>
              ) : (
                <><span>Entrar</span><span>→</span></>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="animate-up delay-5 text-xs text-muted text-center" style={{ marginTop: '28px' }}>
        Baseado em Deuteronômio 6:6-7 · jw.org
      </p>
    </div>
  );
};
