import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { AppSettings } from '../types';
import { SettingsIcon, RobotIcon, CloudIcon, SaveIcon, InfoIcon } from './Icons';

const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button className="back-btn" onClick={onClick} aria-label="Voltar">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
    Voltar
  </button>
);

export const Settings: React.FC = () => {
  const { state, navigate, saveAppSettings, exportData, importData, logout } = useApp();
  const [settings, setSettings] = useState<AppSettings>({ ...state.settings });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof AppSettings, value: string | boolean) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveAppSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      setImportMsg('✓ Backup importado com sucesso!');
    } catch {
      setImportMsg('⚠️ Erro ao importar arquivo.');
    }
    setTimeout(() => setImportMsg(''), 3000);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="page">
      <BackBtn onClick={() => navigate('dashboard')} />

      <h2 className="animate-up" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <SettingsIcon size={24} style={{ color: 'var(--c-primary)' }} />
        Configurações
      </h2>

      {/* User Card */}
      <div className="card animate-up delay-1" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            className="avatar avatar-lg"
            style={{
              background: `linear-gradient(135deg, ${state.currentUser?.color}, ${state.currentUser?.color}99)`,
              boxShadow: `0 4px 16px ${state.currentUser?.color}44`,
            }}
          >
            {state.currentUser?.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div className="font-semibold">{state.currentUser?.fullName}</div>
            <div className="text-sm text-muted">Sessão ativa</div>
          </div>
          <button className="btn btn-sm btn-danger" onClick={logout}>
            Sair
          </button>
        </div>
      </div>

      {/* Gemini API */}
      <div className="settings-section animate-up delay-2">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RobotIcon size={18} style={{ color: 'var(--c-primary)' }} />
          Gemini AI
        </div>
        <div className="settings-item">
          <div className="settings-item-label">Chave da API do Gemini</div>
          <div className="settings-item-desc">
            Necessária para gerar roteiros com IA. Obtenha sua chave gratuita em{' '}
            <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-primary)' }}>
              aistudio.google.com
            </a>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type={showKey ? 'text' : 'password'}
              value={settings.geminiApiKey}
              onChange={(e) => update('geminiApiKey', e.target.value)}
              placeholder="AQ.Ab8RN6..."
              style={{ paddingRight: '48px', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--c-primary)', fontSize: '0.78rem', fontWeight: 700,
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              {showKey ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div className="settings-item" style={{ marginTop: '16px' }}>
          <div className="settings-item-label">Modelo do Gemini</div>
          <div className="settings-item-desc">
            Selecione qual versão do modelo da IA usar para gerar os roteiros de adoração.
          </div>
          <select
            className="input"
            value={settings.geminiModel || 'gemini-3.5-flash'}
            onChange={(e) => update('geminiModel', e.target.value)}
            style={{ width: '100%', height: '42px', fontSize: '0.85rem' }}
          >
            <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recomendado)</option>
            <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
            <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
          </select>
        </div>
      </div>

      {/* Supabase */}
      <div className="settings-section animate-up delay-3">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CloudIcon size={18} style={{ color: 'var(--c-primary)' }} />
          Supabase (Sincronização em Nuvem)
        </div>
        <div className="settings-item">
          <div className="settings-item-desc">
            Opcional. Configure o Supabase para sincronizar dados entre todos os dispositivos da família.
            Projeto: <strong>ADORAÇÃOFAMILIAFLOROS</strong>
          </div>
          <div className="input-group" style={{ marginBottom: '10px' }}>
            <label className="input-label">URL do Supabase</label>
            <input
              className="input"
              type="url"
              value={settings.supabaseUrl}
              onChange={(e) => update('supabaseUrl', e.target.value)}
              placeholder="https://thrfdgetmezrfnvclwub.supabase.co"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Chave Pública (Anon Key)</label>
            <input
              className="input"
              type="password"
              value={settings.supabaseAnonKey}
              onChange={(e) => update('supabaseAnonKey', e.target.value)}
              placeholder="sb_publishable_..."
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        className={`btn btn-block animate-up delay-3 ${saved ? 'btn-secondary' : 'btn-primary'}`}
        style={{ marginBottom: '28px' }}
        onClick={handleSave}
      >
        {saved ? '✓ Configurações Salvas!' : 'Salvar Configurações'}
      </button>

      {/* Backup */}
      <div className="settings-section animate-up delay-4">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SaveIcon size={18} style={{ color: 'var(--c-primary)' }} />
          Backup de Dados
        </div>
        <div className="settings-item">
          <div className="settings-item-label">Exportar backup</div>
          <div className="settings-item-desc">Salva todos os dados em um arquivo JSON.</div>
          <button className="btn btn-secondary btn-sm" onClick={exportData}>
            ⬇ Exportar Backup ({state.weeks.length} adorações)
          </button>
        </div>
        <div className="settings-item" style={{ marginTop: '8px' }}>
          <div className="settings-item-label">Importar backup</div>
          <div className="settings-item-desc">Carrega dados de um arquivo JSON exportado anteriormente.</div>
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
            ⬆ Importar Backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          {importMsg && (
            <p className="text-sm" style={{ marginTop: '8px', color: importMsg.startsWith('✓') ? 'var(--c-success)' : 'var(--c-error)' }}>
              {importMsg}
            </p>
          )}
        </div>
      </div>

      {/* About */}
      <div className="settings-section animate-up delay-4">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <InfoIcon size={18} style={{ color: 'var(--c-primary)' }} />
          Sobre
        </div>
        <div className="settings-item">
          <div className="settings-item-label">Adoração em Família — Floro</div>
          <div className="settings-item-desc" style={{ lineHeight: 1.7 }}>
            App desenvolvido para a Família Floro organizar sua adoração em família semanal.
            Baseado nas recomendações de <a href="https://www.jw.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-primary)' }}>jw.org</a>.
          </div>
          <div className="text-xs text-muted" style={{ marginTop: '8px' }}>
            "Aquilo que ordenei a vocês hoje deve estar no seu coração; e deverão ensinar isso com diligência aos seus filhos." — Deuteronômio 6:6, 7
          </div>
        </div>
      </div>

      <div style={{ height: '16px' }} />
    </div>
  );
};
