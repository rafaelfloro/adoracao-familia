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

// ─── Context ────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  login: (userId: string, password: string) => boolean;
  logout: () => void;
  navigate: (page: Page, weekId?: string) => void;
  upsertWeek: (week: Week) => void;
  deleteWeek: (id: string) => void;
  generateContent: (weekId: string) => Promise<void>;
  saveAppSettings: (settings: AppSettings) => void;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  getUserById: (id: string) => User | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load persisted data on mount
  useEffect(() => {
    const weeks = loadWeeks();
    const settings = loadSettings();
    dispatch({ type: 'SET_WEEKS', payload: weeks });
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  }, []);

  // Persist weeks when they change
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

  const logout = () => dispatch({ type: 'LOGOUT' });

  const navigate = (page: Page, weekId?: string) => {
    dispatch({ type: 'NAVIGATE', payload: { page, weekId } });
  };

  const upsertWeek = (week: Week) => {
    dispatch({ type: 'UPSERT_WEEK', payload: week });
  };

  const deleteWeek = (id: string) => {
    dispatch({ type: 'DELETE_WEEK', payload: id });
  };

  const generateContent = async (weekId: string) => {
    const week = state.weeks.find((w) => w.id === weekId);
    if (!week) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const content = await generateFamilyWorshipContent(state.settings.geminiApiKey, week);
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
