import { DEFAULT_COLLECTION_ID, type AdminWordList, type AdminWordListCollection } from '../types';
import { createAdminWordListSlug } from './wordListSlug';

export function createDraftAdminWordList(input: {
  name: string;
  existingLists: AdminWordList[];
  collections: AdminWordListCollection[];
  now?: string;
}): AdminWordList {
  const collection = input.collections.find(item => item.id === DEFAULT_COLLECTION_ID) ?? input.collections[0];
  const now = input.now ?? new Date().toISOString();

  return {
    id: slug(input.name),
    slug: createAdminWordListSlug(input.name, input.existingLists),
    collectionId: collection?.id ?? DEFAULT_COLLECTION_ID,
    collectionName: collection?.name ?? 'Spelio Core Welsh',
    iconName: '',
    name: input.name,
    nameCy: '',
    description: 'New editorial word list.',
    descriptionCy: '',
    language: 'Welsh',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    dialect: 'Mixed',
    stageId: '',
    stage: '',
    focusCategoryId: '',
    focus: '',
    difficulty: 1,
    order: input.existingLists.length + 1,
    nextListId: null,
    isActive: false,
    isSupportList: false,
    listType: 'main',
    hiddenFromMainCatalogue: false,
    primerContent: null,
    createdAt: now,
    updatedAt: now,
    words: []
  };
}

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `word-list-${Date.now()}`;
}
