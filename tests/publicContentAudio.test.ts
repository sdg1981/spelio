import { normalizePublicWordAudioFields, normalizePublicWordAudioStatus } from '../src/lib/content/publicAudioFields';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const liveReadyAudio = normalizePublicWordAudioFields({
  audio_url: 'https://example.com/storage/v1/object/public/audio/words/cloud.mp3',
  audio_status: 'ready'
});

assertEqual(
  liveReadyAudio.audioUrl,
  'https://example.com/storage/v1/object/public/audio/words/cloud.mp3',
  'Public practice loader audio normalization should preserve the live audio_url.'
);

assertEqual(
  liveReadyAudio.audioStatus,
  'ready',
  'Public practice loader audio normalization should preserve a live ready status.'
);

assertEqual(
  normalizePublicWordAudioStatus('generated'),
  'ready',
  'Public practice loader audio normalization should treat legacy generated word audio as ready.'
);

assertEqual(
  normalizePublicWordAudioFields({
    audioUrl: 'https://example.com/audio/camel.mp3',
    audioStatus: 'generated'
  }).audioStatus,
  'ready',
  'Public practice loader audio normalization should handle camel-case legacy generated status.'
);

assertEqual(
  normalizePublicWordAudioFields({
    audio_url: '',
    audio_status: 'missing'
  }).audioStatus,
  'missing',
  'Public practice loader audio normalization should keep genuinely missing audio missing.'
);

console.log('public content audio tests passed');
