import { wordLists } from '../../data/wordLists';
import type { WordList } from '../../data/wordLists';
import type { DefaultAudioProvider } from '../audioProvider';
import { DEFAULT_AUDIO_PROVIDER } from '../audioProvider';
import { createDefaultInterfaceAudioClips, createInterfaceAudioRegistry, type InterfaceAudioClipRegistry } from '../interfaceAudio';

export interface PublicContent {
  lists: WordList[];
  source: 'static' | 'supabase';
  defaultAudioProvider: DefaultAudioProvider;
  interfaceAudioClips: InterfaceAudioClipRegistry;
}

export async function loadStaticPublicContent(): Promise<PublicContent> {
  return {
    lists: wordLists,
    source: 'static',
    defaultAudioProvider: DEFAULT_AUDIO_PROVIDER,
    interfaceAudioClips: createInterfaceAudioRegistry(createDefaultInterfaceAudioClips())
  };
}
