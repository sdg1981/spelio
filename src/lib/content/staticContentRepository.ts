import { wordLists } from '../../data/wordLists';
import type { WordList } from '../../data/wordLists';

export interface PublicContent {
  lists: WordList[];
  source: 'static' | 'supabase';
}

export async function loadStaticPublicContent(): Promise<PublicContent> {
  return {
    lists: wordLists,
    source: 'static'
  };
}
