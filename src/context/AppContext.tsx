import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { AppSettings, AppState, Page, User, Week } from '../types';
import { USERS } from '../types';
import {
  DEFAULT_SETTINGS,
  exportBackup,
  importBackup,
  loadSettings,
  loadWeeks,
  saveSettings,
  saveWeeks,
} from '../services/dbService';
import { generateFamilyWorshipContent } from '../services/geminiService';

// ─── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'NAVIGATE'; payload: { page: Page; weekId?: string } }
  | { type: 'SET_WEEKS'; payload: Week[] }
  | { type: 'UPSERT_WEEK'; payload: Week }
  | { type: 'DELETE_WEEK'; payload: string }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  currentUser: null,
  currentPage: 'login',
  selectedWeekId: null,
  editingWeekId: null,
  weeks: [],
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.payload, currentPage: 'dashboard', error: null };
    case 'LOGOUT':
      return { ...initialState, weeks: state.weeks, settings: state.settings };
    case 'NAVIGATE':
      return {
        ...state,
        currentPage: action.payload.page,
        selectedWeekId: action.payload.weekId ?? state.selectedWeekId,
        editingWeekId: action.payload.page === 'week-form' ? (action.payload.weekId ?? null) : null,
        error: null,
      };
    case 'SET_WEEKS':
      return { ...state, weeks: action.payload };
    case 'UPSERT_WEEK': {
      const exists = state.weeks.some((w) => w.id === action.payload.id);
      const weeks = exists
        ? state.weeks.map((w) => (w.id === action.payload.id ? action.payload : w))
        : [...state.weeks, action.payload];
      return { ...state, weeks };
    }
    case 'DELETE_WEEK':
      return { ...state, weeks: state.weeks.filter((w) => w.id !== action.payload) };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

import { getSupabaseClient, mapFromDb, mapToDb } from '../services/supabaseClient';
import { getMondaysOfMonth, toLocalDateString } from '../utils/dateUtils';
import type { WeekType } from '../types';

interface AppContextValue {
  state: AppState;
  login: (userId: string, password: string) => boolean;
  logout: () => void;
  navigate: (page: Page, weekId?: string) => void;
  upsertWeek: (week: Week) => Promise<void>;
  deleteWeek: (id: string) => Promise<void>;
  generateContent: (weekId: string) => Promise<void>;
  saveAppSettings: (settings: AppSettings) => void;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  initializeMonthWeeks: (year: number, month: number) => Promise<void>;
  addThemeToQueue: (theme: string, description?: string, customDynamic?: string) => Promise<string>;
  swapWeeks: (id1: string, id2: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load persisted data on mount & fetch from Supabase if configured
  useEffect(() => {
    const settings = loadSettings();
    dispatch({ type: 'SET_SETTINGS', payload: settings });

    const localWeeks = loadWeeks();
    dispatch({ type: 'SET_WEEKS', payload: localWeeks });

    const savedUserId = localStorage.getItem('saved_user_id');
    if (savedUserId) {
      const user = USERS.find((u) => u.id === savedUserId);
      if (user) {
        dispatch({ type: 'LOGIN', payload: user });
      }
    }

    const syncWithSupabase = async () => {
      const supabase = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('weeks')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        if (data) {
          const mappedWeeks = data.map(mapFromDb);
          dispatch({ type: 'SET_WEEKS', payload: mappedWeeks });
          saveWeeks(mappedWeeks);
        }
      } catch (err) {
        console.error('Falha ao sincronizar com Supabase:', err);
        // Fallback silently to local weeks which are already loaded
      }
    };

    syncWithSupabase();
  }, []);

  // Persist weeks to localStorage when they change
  useEffect(() => {
    if (state.weeks.length >= 0 && state.currentPage !== 'login') {
      saveWeeks(state.weeks);
    }
  }, [state.weeks]);

  const login = (userId: string, password: string): boolean => {
    const user = USERS.find((u) => u.id === userId);
    if (!user || user.password !== password) return false;
    dispatch({ type: 'LOGIN', payload: user });
    return true;
  };

  const logout = () => {
    localStorage.removeItem('saved_user_id');
    dispatch({ type: 'LOGOUT' });
  };

  const navigate = (page: Page, weekId?: string) => {
    dispatch({ type: 'NAVIGATE', payload: { page, weekId } });
  };

  const upsertWeek = async (week: Week) => {
    // 1. Update local state immediately for instant UI response
    dispatch({ type: 'UPSERT_WEEK', payload: week });

    // 2. Sync to Supabase in the background if active
    const supabase = getSupabaseClient(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
    if (supabase) {
      try {
        const { error } = await supabase
          .from('weeks')
          .upsert(mapToDb(week));
        if (error) throw error;
      } catch (err) {
        console.error('Erro ao sincronizar upsert com Supabase:', err);
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao salvar na nuvem. Salvo localmente.' });
      }
    }
  };

  const deleteWeek = async (id: string) => {
    // 1. Update local state immediately
    dispatch({ type: 'DELETE_WEEK', payload: id });

    // 2. Sync to Supabase in the background if active
    const supabase = getSupabaseClient(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
    if (supabase) {
      try {
        const { error } = await supabase
          .from('weeks')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Erro ao sincronizar delete com Supabase:', err);
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar na nuvem. Deletado localmente.' });
      }
    }
  };


  const generateContent = async (weekId: string) => {
    const week = state.weeks.find((w) => w.id === weekId);
    if (!week) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const content = await generateFamilyWorshipContent(state.settings.geminiApiKey, week, state.settings.geminiModel);
      const updatedWeek: Week = {
        ...week,
        generatedContent: content,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'UPSERT_WEEK', payload: updatedWeek });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveAppSettings = (settings: AppSettings) => {
    saveSettings(settings);
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  };

  const exportData = () => {
    exportBackup(state.weeks);
  };

  const importData = async (file: File) => {
    try {
      const weeks = await importBackup(file);
      dispatch({ type: 'SET_WEEKS', payload: weeks });
      saveWeeks(weeks);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
    }
  };


  const initializeMonthWeeks = async (year: number, month: number) => {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const hasWeeks = state.weeks.some((w) => w.date.startsWith(monthStr));
    if (hasWeeks) return;

    const mondays = getMondaysOfMonth(year, month);
    const newWeeks: Week[] = mondays.map((monday, index) => {
      let type: WeekType = 'free';
      let theme: string | undefined = undefined;

      if (index === 0) {
        type = 'meeting_prep';
        theme = 'Estudo de Livro de Congregação';
      } else if (index === 1) {
        type = 'broadcast';
        theme = 'JW Broadcasting';
      }

      return {
        id: crypto.randomUUID(),
        date: monday,
        type,
        theme,
        completed: false,
        responsibleId: 'rafael',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const supabase = getSupabaseClient(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
    const updatedWeeks = [...state.weeks];

    for (const w of newWeeks) {
      dispatch({ type: 'UPSERT_WEEK', payload: w });
      updatedWeeks.push(w);
      if (supabase) {
        try {
          await supabase.from('weeks').upsert(mapToDb(w));
        } catch (e) {
          console.error('Erro ao salvar no Supabase:', e);
        }
      }
    }
    saveWeeks(updatedWeeks);
  };

  const addThemeToQueue = async (theme: string, description?: string, customDynamic?: string): Promise<string> => {
    if (!state.currentUser) throw new Error('Usuário não logado');

    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();
    let targetWeek: Week | null = null;
    let localWeeksState = [...state.weeks];

    for (let i = 0; i < 12; i++) {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      let monthWeeks = localWeeksState.filter((w) => w.date.startsWith(monthStr));

      if (monthWeeks.length === 0) {
        const mondays = getMondaysOfMonth(year, month);
        const generated: Week[] = mondays.map((monday, index) => {
          let type: WeekType = 'free';
          let t: string | undefined = undefined;
          if (index === 0) {
            type = 'meeting_prep';
            t = 'Estudo de Livro de Congregação';
          } else if (index === 1) {
            type = 'broadcast';
            t = 'JW Broadcasting';
          }
          return {
            id: crypto.randomUUID(),
            date: monday,
            type,
            theme: t,
            completed: false,
            responsibleId: 'rafael',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });

        for (const w of generated) {
          dispatch({ type: 'UPSERT_WEEK', payload: w });
          localWeeksState.push(w);

          const supabase = getSupabaseClient(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
          if (supabase) {
            try {
              await supabase.from('weeks').upsert(mapToDb(w));
            } catch (err) {
              console.error('Erro de sync no Supabase:', err);
            }
          }
        }
        monthWeeks = generated;
      }

      const todayStr = toLocalDateString(new Date());
      const freeWeek = monthWeeks
        .filter((w) => w.type === 'free' && w.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))[0];

      if (freeWeek) {
        targetWeek = freeWeek;
        break;
      }

      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    if (!targetWeek) {
      throw new Error('Nenhuma semana livre encontrada nos próximos 12 meses.');
    }

    const updatedWeek: Week = {
      ...targetWeek,
      type: 'theme',
      theme,
      description: description || undefined,
      customDynamic: customDynamic || undefined,
      responsibleId: state.currentUser.id,
      updatedAt: new Date().toISOString(),
    };

    await upsertWeek(updatedWeek);
    generateContent(updatedWeek.id).catch((err) => {
      console.error('Erro na geração automática da IA:', err);
    });

    return updatedWeek.id;
  };

  const swapWeeks = async (id1: string, id2: string) => {
    const w1 = state.weeks.find((w) => w.id === id1);
    const w2 = state.weeks.find((w) => w.id === id2);
    if (!w1 || !w2) return;

    const date1 = w1.date;
    const date2 = w2.date;

    const updated1 = { ...w1, date: date2, updatedAt: new Date().toISOString() };
    const updated2 = { ...w2, date: date1, updatedAt: new Date().toISOString() };

    dispatch({ type: 'UPSERT_WEEK', payload: updated1 });
    dispatch({ type: 'UPSERT_WEEK', payload: updated2 });

    const updatedWeeks = state.weeks.map((w) => {
      if (w.id === id1) return updated1;
      if (w.id === id2) return updated2;
      return w;
    });
    saveWeeks(updatedWeeks);

    const supabase = getSupabaseClient(state.settings.supabaseUrl, state.settings.supabaseAnonKey);
    if (supabase) {
      try {
        await Promise.all([
          supabase.from('weeks').upsert(mapToDb(updated1)),
          supabase.from('weeks').upsert(mapToDb(updated2)),
        ]);
      } catch (err) {
        console.error('Erro ao sincronizar troca com Supabase:', err);
        dispatch({ type: 'SET_ERROR', payload: 'Troca de data salva localmente, erro ao sincronizar.' });
      }
    }
  };

  const getUserById = (id: string) => USERS.find((u) => u.id === id);

  return (
    <AppContext.Provider
      value={{
        state,
        login,
        logout,
        navigate,
        upsertWeek,
        deleteWeek,
        generateContent,
        saveAppSettings,
        exportData,
        importData,
        getUserById,
        initializeMonthWeeks,
        addThemeToQueue,
        swapWeeks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
