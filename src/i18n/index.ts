import { cy } from './cy';
import { en } from './en';

export type InterfaceLanguage = 'en' | 'cy';
export type TranslationKey = LeafKey<typeof en>;
export type Translate = (key: TranslationKey) => string;

const dictionaries = { en, cy };

type LeafKey<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : LeafKey<T[K], `${Prefix}${K}.`>
}[keyof T & string];

function readPath(source: unknown, path: string[]) {
  let current = source;
  for (const part of path) {
    if (!current || typeof current !== 'object' || !(part in current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function normaliseInterfaceLanguage(value: unknown): InterfaceLanguage {
  return value === 'cy' ? 'cy' : 'en';
}

export function translate(language: InterfaceLanguage, key: TranslationKey) {
  const path = key.split('.');
  return readPath(dictionaries[language], path) ?? readPath(en, path) ?? key;
}

export function createTranslator(language: InterfaceLanguage): Translate {
  return key => translate(language, key);
}
