import type { AzureTtsPurpose } from './azureTtsLimits';
import type { AzureSpeechLanguage } from './azureSpeech';
import { getApiUrl } from './nativeOrigin';

export const AZURE_TTS_ROUTE = '/api/azure-tts';

export function getAzureTtsRoute() {
  return getApiUrl(AZURE_TTS_ROUTE);
}

export type AzureTtsRequestPayload = {
  text: string;
  language: AzureSpeechLanguage;
  purpose?: AzureTtsPurpose;
};

export function createAzureTtsRequestPayload(
  text: string,
  language: AzureSpeechLanguage,
  purpose: AzureTtsPurpose = 'default'
): AzureTtsRequestPayload {
  return purpose === 'default'
    ? { text, language }
    : { text, language, purpose };
}

export function createWelshAzureTtsRequestPayload(text: string) {
  return createAzureTtsRequestPayload(text, 'cy');
}
