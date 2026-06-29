import type { WordList, WordListCollection } from '../../data/wordLists';
import { mainWordLists } from '../../data/supportWordLists';
import { WELSH_FOUNDATIONS_COLLECTION_ID } from '../../content/collectionIntro';
import type { Translate } from '../../i18n';
import type { SessionResult, SpelioStorage } from './storage';
import { isListFullyComplete } from './storage';
import { getCollectionDisplayName } from './wordListDisplay';

export type CompletionMilestoneKind = 'collection' | 'practice-library' | 'learning-journey' | 'full-catalogue';

export type CompletionMilestone = {
  id: string;
  kind: CompletionMilestoneKind;
  collectionId?: string;
  collectionName?: string;
  titleKey: 'end.collectionCompleteHeading' | 'end.practiceLibraryCompleteHeading' | 'end.learningJourneyCompleteHeading' | 'end.fullSpelioCompleteHeading';
  bodyKey: 'end.collectionCompleteBody' | 'end.practiceLibraryCompleteBody' | 'end.learningJourneyCompleteBody' | 'end.fullSpelioCompleteBody';
};

const FULL_CATALOGUE_MILESTONE_ID = 'full-catalogue';

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function isSpelioOwnedCollection(collection?: WordListCollection) {
  return collection?.isActive !== false && collection?.ownerType === 'spelio';
}

function isNormalLearnerFacingList(list: WordList) {
  return (
    list.isActive &&
    list.words.length > 0 &&
    list.listType !== 'support' &&
    !list.isSupportList &&
    !list.hiddenFromMainCatalogue &&
    isSpelioOwnedCollection(list.collection)
  );
}

function eligibleCompletionLists(lists: WordList[]) {
  return mainWordLists(lists).filter(isNormalLearnerFacingList);
}

function isPracticeLibraryCollection(collection: WordListCollection | undefined, collectionId: string) {
  const text = `${collectionId} ${collection?.slug ?? ''} ${collection?.name ?? ''}`.toLowerCase();
  return text.includes('practice');
}

function isLearningJourneyCollection(collection: WordListCollection | undefined, collectionId: string) {
  const text = `${collectionId} ${collection?.slug ?? ''} ${collection?.name ?? ''}`.toLowerCase();
  return collectionId === WELSH_FOUNDATIONS_COLLECTION_ID || text.includes('foundation') || text.includes('learning journey');
}

function getCollectionMilestoneKind(collection: WordListCollection | undefined, collectionId: string): Exclude<CompletionMilestoneKind, 'full-catalogue'> {
  if (isPracticeLibraryCollection(collection, collectionId)) return 'practice-library';
  if (isLearningJourneyCollection(collection, collectionId)) return 'learning-journey';
  return 'collection';
}

function isCollectionComplete(storage: SpelioStorage, collectionLists: WordList[]) {
  return collectionLists.length > 0 && collectionLists.every(list => isListFullyComplete(storage, list));
}

function isFullCatalogueComplete(storage: SpelioStorage, lists: WordList[]) {
  const eligibleLists = eligibleCompletionLists(lists);
  return eligibleLists.length > 0 && eligibleLists.every(list => isListFullyComplete(storage, list));
}

function milestoneIdForCollection(collectionId: string) {
  return `collection:${collectionId}`;
}

function wasMilestoneShown(storage: SpelioStorage, milestoneId: string) {
  return storage.shownCompletionMilestoneIds?.includes(milestoneId) === true;
}

export function markCompletionMilestoneShown(storage: SpelioStorage, milestone: CompletionMilestone | null): SpelioStorage {
  if (!milestone || wasMilestoneShown(storage, milestone.id)) return storage;

  return {
    ...storage,
    shownCompletionMilestoneIds: unique([...(storage.shownCompletionMilestoneIds ?? []), milestone.id])
  };
}

export function getCompletionMilestoneForSession(
  previousStorage: SpelioStorage,
  nextStorage: SpelioStorage,
  lists: WordList[],
  result: SessionResult
): CompletionMilestone | null {
  const eligibleLists = eligibleCompletionLists(lists);
  const completedSessionListIds = new Set(result.listIds);
  const relevantCompletedLists = eligibleLists.filter(list => completedSessionListIds.has(list.id));
  if (!relevantCompletedLists.length) return null;

  const fullCatalogueJustCompleted = !isFullCatalogueComplete(previousStorage, eligibleLists) && isFullCatalogueComplete(nextStorage, eligibleLists);
  if (fullCatalogueJustCompleted && !wasMilestoneShown(previousStorage, FULL_CATALOGUE_MILESTONE_ID)) {
    return {
      id: FULL_CATALOGUE_MILESTONE_ID,
      kind: 'full-catalogue',
      titleKey: 'end.fullSpelioCompleteHeading',
      bodyKey: 'end.fullSpelioCompleteBody'
    };
  }

  const collectionIds = unique(relevantCompletedLists.map(list => list.collectionId));
  const completedCollectionId = collectionIds.find(collectionId => {
    const collectionLists = eligibleLists.filter(list => list.collectionId === collectionId);
    return (
      !wasMilestoneShown(previousStorage, milestoneIdForCollection(collectionId)) &&
      !isCollectionComplete(previousStorage, collectionLists) &&
      isCollectionComplete(nextStorage, collectionLists)
    );
  });

  if (!completedCollectionId) return null;

  const collection = eligibleLists.find(list => list.collectionId === completedCollectionId)?.collection;
  const kind = getCollectionMilestoneKind(collection, completedCollectionId);

  return {
    id: milestoneIdForCollection(completedCollectionId),
    kind,
    collectionId: completedCollectionId,
    collectionName: collection ? getCollectionDisplayName(collection) : completedCollectionId,
    titleKey: kind === 'practice-library'
      ? 'end.practiceLibraryCompleteHeading'
      : kind === 'learning-journey'
        ? 'end.learningJourneyCompleteHeading'
        : 'end.collectionCompleteHeading',
    bodyKey: kind === 'practice-library'
      ? 'end.practiceLibraryCompleteBody'
      : kind === 'learning-journey'
        ? 'end.learningJourneyCompleteBody'
        : 'end.collectionCompleteBody'
  };
}

export function formatCompletionMilestoneTitle(milestone: CompletionMilestone, t: Translate) {
  return t(milestone.titleKey).replace('{collectionName}', milestone.collectionName ?? '');
}

export function formatCompletionMilestoneBody(milestone: CompletionMilestone, t: Translate) {
  return t(milestone.bodyKey).replace('{collectionName}', milestone.collectionName ?? '');
}
