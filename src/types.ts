export type UserId = 'rafael' | 'gracy' | 'ricardo';

export interface User {
  id: UserId;
  name: string;
  fullName: string;
  password: string;
  initials: string;
  color: string;
}

export type WeekType = 'theme' | 'broadcast' | 'meeting_prep' | 'free';

export interface BibleVerse {
  reference: string;
  text: string;
}

export interface DiscussionQuestion {
  question: string;
  hint?: string;
}

export interface JwLink {
  title: string;
  url: string;
  description?: string;
}

export interface GeneratedContent {
  objective: string;
  bibleVerses: BibleVerse[];
  discussionQuestions: DiscussionQuestion[];
  dynamic: string;
  closingThought: string;
  jwLinks: JwLink[];
  searchGroundingSources?: string[];
  generatedAt: string;
  themeUsed: string;
}

export interface Week {
  id: string;
  date: string; // ISO date string
  responsibleId: UserId;
  type: WeekType;
  theme?: string;
  description?: string;
  customDynamic?: string;
  generatedContent?: GeneratedContent;
  completed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type Page = 'login' | 'dashboard' | 'week-detail' | 'week-form' | 'settings';

export interface AppState {
  currentUser: User | null;
  currentPage: Page;
  selectedWeekId: string | null;
  editingWeekId: string | null;
  weeks: Week[];
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

export interface AppSettings {
  geminiApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  useSupabase: boolean;
}

export const USERS: User[] = [
  {
    id: 'rafael',
    name: 'Rafael',
    fullName: 'Rafael Floro',
    password: 'HaKuna890-',
    initials: 'RF',
    color: '#5b3c88',
  },
  {
    id: 'gracy',
    name: 'Gracy',
    fullName: 'Gracy Kelly',
    password: 'GK1976',
    initials: 'GK',
    color: '#4a6da7',
  },
  {
    id: 'ricardo',
    name: 'Ricardo',
    fullName: 'Ricardo Floro',
    password: 'RSF1974',
    initials: 'RF',
    color: '#799fcc',
  },
];

export const WEEK_TYPE_LABELS: Record<WeekType, string> = {
  theme: 'Tema Bíblico',
  broadcast: 'JW Broadcasting',
  meeting_prep: 'Preparação de Reunião',
  free: 'Livre / Dinâmica',
};

export const WEEK_TYPE_ICONS: Record<WeekType, string> = {
  theme: '📖',
  broadcast: '📺',
  meeting_prep: '📋',
  free: '✨',
};
