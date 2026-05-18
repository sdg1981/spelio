import { loadStaticPublicContent, type PublicContent } from './staticContentRepository';
import { loadSupabasePublicContent } from './supabaseContentRepository';
import { withSupportWordLists } from '../../data/supportWordLists';

export type PublicContentSource = PublicContent['source'];

export async function loadPublicContent(): Promise<PublicContent> {
  try {
    const content = await loadSupabasePublicContent();
    return {
      ...content,
      lists: withSupportWordLists(content.lists)
    };
  } catch {
    console.info('Using bundled public content fallback.');
    return loadStaticPublicContent();
  }
}
