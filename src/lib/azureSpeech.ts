export type AzureSpeechLanguage = 'cy' | 'en';

export type AzureVoiceConfig = {
  language: AzureSpeechLanguage;
  locale: string;
  voice: string;
};

export const AZURE_WELSH_VOICE = 'cy-GB-NiaNeural';
export const AZURE_SPEECH_LOCALE = 'cy-GB';
export const AZURE_ENGLISH_VOICE = 'en-GB-SoniaNeural';
export const AZURE_ENGLISH_SPEECH_LOCALE = 'en-GB';
export const AZURE_SPEECH_PROSODY_RATE = '-4%';

export function getAzureVoiceConfig(language: unknown): AzureVoiceConfig {
  if (language === 'en') {
    return {
      language: 'en',
      locale: AZURE_ENGLISH_SPEECH_LOCALE,
      voice: AZURE_ENGLISH_VOICE
    };
  }

  return {
    language: 'cy',
    locale: AZURE_SPEECH_LOCALE,
    voice: AZURE_WELSH_VOICE
  };
}

export function createWelshSsml(text: string) {
  // TODO: Add dialect-specific voice selection if Azure Welsh regional voices become practical.
  return createAzureSsml(text, getAzureVoiceConfig('cy'));
}

export function createEnglishSsml(text: string) {
  return createAzureSsml(text, getAzureVoiceConfig('en'));
}

export function createAzureSsml(text: string, voiceConfig: AzureVoiceConfig) {
  return `<speak version="1.0" xml:lang="${voiceConfig.locale}"><voice xml:lang="${voiceConfig.locale}" name="${voiceConfig.voice}"><prosody rate="${AZURE_SPEECH_PROSODY_RATE}">${escapeXml(text.trim())}</prosody></voice></speak>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
