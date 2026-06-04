export type AzureTtsPurpose = 'default' | 'collection_intro';

export const AZURE_TTS_DEFAULT_TEXT_LIMIT = 500;
export const AZURE_TTS_COLLECTION_INTRO_TEXT_LIMIT = 3000;

export function normalizeAzureTtsPurpose(value: unknown): AzureTtsPurpose {
  return value === 'collection_intro' ? 'collection_intro' : 'default';
}

export function getAzureTtsTextLimit(purpose: AzureTtsPurpose) {
  return purpose === 'collection_intro'
    ? AZURE_TTS_COLLECTION_INTRO_TEXT_LIMIT
    : AZURE_TTS_DEFAULT_TEXT_LIMIT;
}
