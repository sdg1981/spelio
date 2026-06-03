import type { WordList, WordListCollection } from '../../data/wordLists';
import type { InterfaceLanguage } from '../../i18n';

const WELSH_FOUNDATIONS_COLLECTION_ID = 'spelio_welsh_foundations';
const FOUNDATIONS_STAGE_ID = 'foundations';
const WELSH_FOUNDATIONS_STAGE_LABEL = 'Common Patterns';

type WordListDisplayFields = Pick<WordList, 'name' | 'description'> & {
  nameCy?: string | null;
  descriptionCy?: string | null;
  name_cy?: string | null;
  description_cy?: string | null;
};

export function getListDisplayName(list: Pick<WordListDisplayFields, 'name' | 'nameCy' | 'name_cy'>, interfaceLanguage?: InterfaceLanguage) {
  if (interfaceLanguage === 'cy') {
    const welshName = list.nameCy?.trim() || list.name_cy?.trim();
    if (welshName) return welshName;
  }

  return list.name;
}

export function getListDisplayDescription(
  list: Pick<WordListDisplayFields, 'description' | 'descriptionCy' | 'description_cy'>,
  interfaceLanguage?: InterfaceLanguage
) {
  if (interfaceLanguage === 'cy') {
    const welshDescription = list.descriptionCy?.trim() || list.description_cy?.trim();
    if (welshDescription) return welshDescription;
  }

  return list.description;
}

export function getCollectionDisplayName(
  collection: Pick<WordListCollection, 'name'> & { nameCy?: string | null; name_cy?: string | null },
  interfaceLanguage?: InterfaceLanguage
) {
  if (interfaceLanguage === 'cy') {
    const welshName = collection.nameCy?.trim() || collection.name_cy?.trim();
    if (welshName) return welshName;
  }

  return collection.name;
}

export function getWordListStageDisplayName(
  list: Pick<WordList, 'collectionId' | 'stage'> & { stageId?: string | null }
) {
  if (list.collectionId === WELSH_FOUNDATIONS_COLLECTION_ID && list.stageId === FOUNDATIONS_STAGE_ID) {
    return WELSH_FOUNDATIONS_STAGE_LABEL;
  }
  if (list.stageId === FOUNDATIONS_STAGE_ID) return 'Foundations';

  return list.stage;
}
