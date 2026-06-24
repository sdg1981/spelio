import { spellingBasicsCategories, spellingBasicsTopics } from './topics';
import type { SpellingBasicsTopicSlug } from './types';

export { spellingBasicsCategories, spellingBasicsTopics };
export type {
  LocalizedString,
  SpellingBasicsCategory,
  SpellingBasicsCategoryId,
  SpellingBasicsExample,
  SpellingBasicsExampleGroup,
  SpellingBasicsIconKey,
  SpellingBasicsPhoneticOrientation,
  SpellingBasicsSeriesTopic,
  SpellingBasicsSoundAnchor,
  SpellingBasicsSingleTopic,
  SpellingBasicsTopic,
  SpellingBasicsTopicCard,
  SpellingBasicsTopicSlug
} from './types';

export function getSpellingBasicsTopic(slug: string | null | undefined) {
  if (slug === 'wy') return getSpellingBasicsTopic('w');
  return spellingBasicsTopics.find(topic => topic.slug === slug) ?? null;
}

export function isSpellingBasicsTopicSlug(value: string | null | undefined): value is SpellingBasicsTopicSlug {
  return spellingBasicsTopics.some(topic => topic.slug === value);
}

export function getSpellingBasicsTopicSlugFromPath(pathname: string) {
  const match = pathname.match(/^\/spelling-basics\/([^/]+)$/);
  if (!match) return null;
  if (match[1] === 'wy') return 'w';
  return isSpellingBasicsTopicSlug(match[1]) ? match[1] : null;
}
