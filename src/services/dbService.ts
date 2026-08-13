import type { AppSettings, Week } from '../types';

const WEEKS_KEY = 'adoracao_familia_weeks';
const SETTINGS_KEY = 'adoracao_familia_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://thrfdgetmezrfnvclwub.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  useSupabase: false,
  theme: 'light',
  geminiModel: 'gemini-3.5-flash',
};

// ─── Local Storage ─────────────────────────────────────────────────────────

export const loadWeeks = (): Week[] => {
  try {
    const raw = localStorage.getItem(WEEKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveWeeks = (weeks: Week[]): void => {
  localStorage.setItem(WEEKS_KEY, JSON.stringify(weeks));
};

export const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      // Fallback to env variables if stored values are empty strings
      geminiApiKey: parsed.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey,
      supabaseUrl: parsed.supabaseUrl || DEFAULT_SETTINGS.supabaseUrl,
      supabaseAnonKey: parsed.supabaseAnonKey || DEFAULT_SETTINGS.supabaseAnonKey,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const exportBackup = (weeks: Week[]): void => {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    weeks,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `adoracao-familia-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importBackup = (file: File): Promise<Week[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data.weeks || []);
      } catch {
        reject(new Error('Arquivo inválido'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};
