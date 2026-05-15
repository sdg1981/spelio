import { isSupabaseConfigured } from '../../lib/supabaseClient';
import type { AdminRepository } from './adminRepository';
import { mockAdminRepository } from './mockAdminRepository';
import { supabaseAdminRepository } from './supabaseAdminRepository';

export function getAdminRepository(): AdminRepository {
  const requestedRepository = import.meta.env.VITE_ADMIN_REPOSITORY;
  if (requestedRepository === 'supabase' && !isSupabaseConfigured) {
    return supabaseAdminRepository;
  }
  return isSupabaseConfigured && requestedRepository === 'supabase'
    ? supabaseAdminRepository
    : mockAdminRepository;
}

export type { AdminCustomWordListSummary, AdminRepository, AdminWordWithListName } from './adminRepository';
export { getAudioHealth } from './adminRepository';
