import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultInput = path.resolve(__dirname, '../data-exports/spelio_welsh_foundations_content.json');
const inputPath = path.resolve(process.cwd(), process.argv[2] ?? defaultInput);
const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const primerDrafts = payload.primerDrafts ?? payload.primer_drafts ?? {};

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function pickLocalizedText(draft, baseKey, language) {
  const localized = asString(draft[`${baseKey}${language === 'cy' ? 'Cy' : 'En'}`]);
  return localized || asString(draft[baseKey]);
}

function audioTextForLabel(label) {
  const overrides = {
    D: 'da',
    DD: 'hedd',
    F: 'efo',
    FF: 'coffi',
    CH: 'bach',
    LL: 'lle',
    RH: 'rhif',
    TH: 'peth',
    C: 'cath',
    G: 'gardd',
    U: 'du',
    AI: 'tai',
    AE: 'cae',
    WY: 'wy',
    YW: 'yw',
    OE: 'oer',
    AU: 'haul',
    AW: 'mawr',
    'Y (FINAL SYLLABLE)': 'gwely',
    'Y (EARLIER SYLLABLE)': 'byd',
    'W AS A VOWEL': 'cwm',
    'W BEFORE A VOWEL': 'wedi'
  };
  return overrides[label.trim().toUpperCase()] ?? label.trim();
}

function soundItemId(label, index) {
  return `${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function normalizeAudioStatus(value) {
  return ['queued', 'generating', 'ready', 'failed'].includes(value) ? value : 'missing';
}

function normalizeAudioSource(value) {
  return ['azure', 'elevenlabs', 'manual'].includes(value) ? value : 'unknown';
}

function soundItems(draft) {
  const rawItems = draft.primerSoundItems ?? draft.primerSoundButtons ?? [];
  if (!Array.isArray(rawItems)) return [];
  return rawItems.flatMap((item, index) => {
    if (typeof item === 'string') {
      const label = item.trim();
      if (!label) return [];
      const id = soundItemId(label, index);
      return [{ id, key: id, label, labelCy: '', textToSpeak: audioTextForLabel(label), audioUrl: '', audioStatus: 'missing', audioSource: 'unknown', order: index + 1 }];
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const label = asString(item.label);
    if (!label) return [];
    const id = asString(item.id) || asString(item.key) || soundItemId(label, index);
    return [{
      id,
      key: asString(item.key) || id,
      label,
      labelCy: asString(item.labelCy ?? item.label_cy),
      textToSpeak: asString(item.textToSpeak ?? item.text_to_speak ?? item.generationText ?? item.generation_text ?? item.audioText ?? item.text) || audioTextForLabel(label),
      audioUrl: asString(item.audioUrl ?? item.audio_url),
      audioStatus: normalizeAudioStatus(item.audioStatus ?? item.audio_status),
      audioSource: normalizeAudioSource(item.audioSource ?? item.audio_source),
      order: Number.isFinite(Number(item.order ?? item.order_index)) ? Number(item.order ?? item.order_index) : index + 1
    }];
  }).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

function sqlString(value) {
  return String(value).replace(/'/g, "''");
}

const updates = Object.entries(primerDrafts).map(([listId, draft]) => {
  const primerContent = {
    enabled: true,
    titleEn: pickLocalizedText(draft, 'primerTitle', 'en'),
    titleCy: asString(draft.primerTitleCy),
    bodyEn: pickLocalizedText(draft, 'primerBody', 'en'),
    bodyCy: asString(draft.primerBodyCy),
    soundItems: soundItems(draft)
  };
  return `update public.word_lists\nset primer_content = '${sqlString(JSON.stringify(primerContent))}'::jsonb\nwhere id = '${sqlString(listId)}';`;
});

console.log('-- Generated from data-exports/spelio_welsh_foundations_content.json primerDrafts.');
console.log('-- Review before running. This only updates public.word_lists.primer_content for matching IDs.');
console.log('begin;');
console.log(updates.join('\n\n'));
console.log('commit;');
