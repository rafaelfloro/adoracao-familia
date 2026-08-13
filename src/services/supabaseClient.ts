import { createClient } from '@supabase/supabase-js';
import type { Week } from '../types';

export const getSupabaseClient = (url?: string, anonKey?: string) => {
  const sbUrl = url || import.meta.env.VITE_SUPABASE_URL || '';
  const sbKey = anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!sbUrl || !sbKey || sbUrl.startsWith('→') || sbUrl.includes('placeholder')) {
    return null;
  }

  try {
    return createClient(sbUrl, sbKey);
  } catch (e) {
    console.error('Erro ao inicializar cliente Supabase:', e);
    return null;
  }
};

export const mapToDb = (week: Week) => ({
  id: week.id,
  date: week.date,
  responsible_id: week.responsibleId,
  type: week.type,
  theme: week.theme || null,
  description: week.description || null,
  custom_dynamic: week.customDynamic || null,
  generated_content: week.generatedContent || null,
  completed: week.completed,
  notes: week.notes || null,
  created_at: week.createdAt,
  updated_at: week.updatedAt,
});

export const mapFromDb = (dbWeek: any): Week => ({
  id: dbWeek.id,
  date: dbWeek.date,
  responsibleId: dbWeek.responsible_id,
  type: dbWeek.type,
  theme: dbWeek.theme || undefined,
  description: dbWeek.description || undefined,
  customDynamic: dbWeek.custom_dynamic || undefined,
  generatedContent: dbWeek.generated_content || undefined,
  completed: dbWeek.completed,
  notes: dbWeek.notes || undefined,
  createdAt: dbWeek.created_at,
  updatedAt: dbWeek.updated_at,
});
