import type { InterfaceLanguage, Translate } from '../../i18n';
import type { WordList } from '../../data/wordLists';
import type { Recommendation } from './recommendations';
import { getNormalContinuationRecommendation, getRecommendation } from './recommendations';
import { applyPracticeStartListSelection, type SpelioStorage } from './storage';

export type PracticeStart = {
  mode: 'normal' | 'review' | 'recap';
  review: boolean;
  recap: boolean;
  storage: SpelioStorage;
  recommendation?: Recommendation;
};

function withPracticeStarted(storage: SpelioStorage): SpelioStorage {
  return {
    ...storage,
    hasStartedPracticeSession: true
  };
}

export function createReviewPracticeStart(storage: SpelioStorage): PracticeStart {
  return {
    mode: 'review',
    review: true,
    recap: false,
    storage: withPracticeStarted(storage)
  };
}

export function createRecapPracticeStart(storage: SpelioStorage): PracticeStart {
  return {
    mode: 'recap',
    review: false,
    recap: true,
    storage: withPracticeStarted(storage)
  };
}

export function createNormalContinuationPracticeStart(
  storage: SpelioStorage,
  lists: WordList[],
  t?: Translate,
  interfaceLanguage?: InterfaceLanguage
): PracticeStart {
  const recommendation = getNormalContinuationRecommendation(storage, lists, t, interfaceLanguage);

  return {
    mode: 'normal',
    review: false,
    recap: false,
    storage: withPracticeStarted(applyPracticeStartListSelection(storage, recommendation.listId)),
    recommendation
  };
}

export function createPrimaryRecommendationPracticeStart(
  storage: SpelioStorage,
  lists: WordList[],
  t?: Translate,
  interfaceLanguage?: InterfaceLanguage
): PracticeStart {
  const recommendation = getRecommendation(storage, lists, t, interfaceLanguage);

  if (recommendation.kind === 'review') {
    return {
      ...createReviewPracticeStart(storage),
      recommendation
    };
  }

  return {
    mode: 'normal',
    review: false,
    recap: false,
    storage: withPracticeStarted(applyPracticeStartListSelection(storage, recommendation.listId)),
    recommendation
  };
}
