import type { InterfaceLanguage } from '../../i18n';

export type LocalizedString = Record<InterfaceLanguage, string>;

export type SpellingBasicsCategoryId = 'start' | 'sounds' | 'accents';

export type SpellingBasicsTopicSlug =
  | 'phonetic'
  | 'why-welsh-looks-different'
  | 'how-spelio-helps'
  | 'ff'
  | 'dd'
  | 'll'
  | 'ch'
  | 'rh'
  | 'w'
  | 'y'
  | 'accents';

export type SpellingBasicsIconKey = 'ear' | 'book' | 'lightbulb';

export type SpellingBasicsExample = {
  welsh: string;
  meaning?: LocalizedString;
};

export type SpellingBasicsTopicCard = {
  title?: LocalizedString;
  subtitle?: LocalizedString;
  body: LocalizedString[];
  examples?: SpellingBasicsExample[];
  tip?: LocalizedString;
};

export type SpellingBasicsSoundAnchor = {
  symbol: string;
  hint: LocalizedString;
  example: string;
};

export type SpellingBasicsPatternExample = {
  title: LocalizedString;
  body: LocalizedString;
  patterns: string[];
  word: string;
  helper: LocalizedString;
};

export type SpellingBasicsPhoneticOrientation = {
  soundSectionTitle: LocalizedString;
  soundSectionBody: LocalizedString;
  sounds: SpellingBasicsSoundAnchor[];
  patternExample?: SpellingBasicsPatternExample;
  llNote: LocalizedString;
  closing: LocalizedString;
};

export type SpellingBasicsBaseTopic = {
  slug: SpellingBasicsTopicSlug;
  categoryId: SpellingBasicsCategoryId;
  overviewTitle: LocalizedString;
  overviewBody?: LocalizedString;
  iconKey?: SpellingBasicsIconKey;
  symbol?: string;
  practiceListId?: string;
  phoneticOrientation?: SpellingBasicsPhoneticOrientation;
};

export type SpellingBasicsSingleTopic = SpellingBasicsBaseTopic & {
  kind: 'single';
  card: SpellingBasicsTopicCard;
};

export type SpellingBasicsSeriesTopic = SpellingBasicsBaseTopic & {
  kind: 'series';
  cards: SpellingBasicsTopicCard[];
};

export type SpellingBasicsTopic = SpellingBasicsSingleTopic | SpellingBasicsSeriesTopic;

export type SpellingBasicsCategory = {
  id: SpellingBasicsCategoryId;
  title: LocalizedString;
  topicSlugs: SpellingBasicsTopicSlug[];
};
