import { loadStaticPublicContent, type PublicContent } from './staticContentRepository';
import { loadSupabasePublicContent } from './supabaseContentRepository';

export type PublicContentSource = PublicContent['source'];

export async function loadPublicContent(): Promise<PublicContent> {
  try {
    return await loadSupabasePublicContent();
  } catch {
    console.info('Using bundled public content fallback.');
    return loadStaticPublicContent();
  }
}
