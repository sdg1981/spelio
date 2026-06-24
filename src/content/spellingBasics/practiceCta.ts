import type { InterfaceLanguage, Translate } from '../../i18n';
import type { SpellingBasicsTopicSlug } from './types';

export function getSpellingBasicsPracticeCtaLabel(topicSlug: SpellingBasicsTopicSlug, interfaceLanguage: InterfaceLanguage, t: Translate) {
  if (topicSlug === 'w') {
    return interfaceLanguage === 'cy'
      ? 'Ymarferwch y patrwm hwn'
      : 'Practise this pattern';
  }

  return t('spellingBasics.topic.practicePattern');
}
