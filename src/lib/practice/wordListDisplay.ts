import type { WordList, WordListCollection } from '../../data/wordLists';
import { mainWordLists } from '../../data/supportWordLists';
import type { InterfaceLanguage } from '../../i18n';

export const WELSH_FOUNDATIONS_COLLECTION_ID = 'spelio_welsh_foundations';
const WELSH_FOUNDATIONS_COLLECTION_DISPLAY_NAME = 'Welsh Spelling Foundations';
const WELSH_FOUNDATIONS_COLLECTION_DISPLAY_NAME_CY = 'Sylfeini Sillafu Cymraeg';
const FOUNDATIONS_STAGE_ID = 'foundations';
const WELSH_FOUNDATIONS_AREA_LABEL = 'Learning';
const WELSH_FOUNDATIONS_AREA_LABEL_CY = 'Dysgu';
const WELSH_FOUNDATIONS_STAGE_LABEL = 'Spelling Patterns';
const WELSH_FOUNDATIONS_STAGE_LABEL_CY = 'Patrymau Sillafu';
export const PRACTICE_LIBRARY_COLLECTION_ID = 'practice';
const PRACTICE_LIBRARY_AREA_LABEL = 'Practice Library';
const PRACTICE_LIBRARY_AREA_LABEL_CY = 'Llyfrgell Ymarfer';

const PRACTICE_LIBRARY_CATEGORY_LABELS: Record<string, { en: string; cy?: string }> = {
  practice_most_common_animals: { en: 'Animals', cy: 'Anifeiliaid' },
  practice_most_common_food_and_drink: { en: 'Food & Drink', cy: 'Bwyd a Diod' },
  practice_most_common_places: { en: 'Places & Travel', cy: 'Lleoedd a Theithio' },
  practice_most_common_travel_and_transport: { en: 'Places & Travel', cy: 'Lleoedd a Theithio' },
  practice_most_common_people_and_family: { en: 'People & Home', cy: 'Pobl a Chartref' },
  practice_most_common_home_and_household: { en: 'People & Home', cy: 'Pobl a Chartref' },
  practice_most_common_weather: { en: 'Weather & Seasons', cy: 'Tywydd a Thymhorau' },
  practice_most_common_time_and_calendar: { en: 'Time & Calendar', cy: 'Amser a Chalendr' },
  practice_most_common_school_and_learning: { en: 'School & Learning', cy: 'Ysgol a Dysgu' },
  practice_most_common_work: { en: 'Work', cy: 'Gwaith' },
  practice_most_common_colours: { en: 'Colours', cy: 'Lliwiau' },
  practice_most_common_clothing: { en: 'Clothing', cy: 'Dillad' },
  practice_most_common_nature_and_landscape: { en: 'Nature & Landscape', cy: 'Natur a Thirwedd' },
  practice_most_common_shopping: { en: 'Shopping', cy: 'Siopa' },
  practice_most_common_body_parts: { en: 'Body Parts', cy: "Rhannau o'r Corff" },
  practice_most_common_sports: { en: 'Sports', cy: 'Chwaraeon' },
  practice_most_common_leisure: { en: 'Leisure', cy: 'Hamdden' },
  practice_most_common_numbers: { en: 'Numbers', cy: 'Rhifau' },
  practice_most_common_meals_and_eating: { en: 'Meals & Eating', cy: 'Prydau a Bwyta' },
  practice_most_common_around_town: { en: 'Around Town', cy: 'O Gwmpas y Dref' }
};

const PRACTICE_LIBRARY_CATEGORY_ICON_NAMES: Record<string, string> = {
  practice_most_common_animals: 'Dog',
  practice_most_common_food_and_drink: 'Apple',
  practice_most_common_places: 'MapPin',
  practice_most_common_travel_and_transport: 'MapPin',
  practice_most_common_people_and_family: 'UserRound',
  practice_most_common_home_and_household: 'Home',
  practice_most_common_weather: 'CloudSun',
  practice_most_common_time_and_calendar: 'Calendar',
  practice_most_common_school_and_learning: 'GraduationCap',
  practice_most_common_work: 'BriefcaseBusiness',
  practice_most_common_colours: 'Palette',
  practice_most_common_clothing: 'Shirt',
  practice_most_common_nature_and_landscape: 'Leaf',
  practice_most_common_shopping: 'ShoppingBag',
  practice_most_common_body_parts: 'Hand',
  practice_most_common_sports: 'Trophy',
  practice_most_common_leisure: 'Drama',
  practice_most_common_numbers: 'Hash',
  practice_most_common_meals_and_eating: 'Utensils',
  practice_most_common_around_town: 'Map'
};

export type PublicCatalogueListGroup = {
  key: string;
  title: string;
  subtitle?: string;
  lists: WordList[];
};

export type PublicCatalogueCollectionGroup = {
  collection: {
    id: string;
    name: string;
    nameCy?: string | null;
    order?: number | null;
  };
  title: string;
  listGroups: PublicCatalogueListGroup[];
};

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

export function compareWordListCollectionsForDisplay(
  a: Pick<WordListCollection, 'id' | 'name'> & { order?: number | null; nameCy?: string | null; name_cy?: string | null },
  b: Pick<WordListCollection, 'id' | 'name'> & { order?: number | null; nameCy?: string | null; name_cy?: string | null },
  interfaceLanguage?: InterfaceLanguage
) {
  const orderA = Number.isFinite(a.order) ? Number(a.order) : Number.POSITIVE_INFINITY;
  const orderB = Number.isFinite(b.order) ? Number(b.order) : Number.POSITIVE_INFINITY;
  return orderA - orderB ||
    getCollectionDisplayName(a, interfaceLanguage).localeCompare(getCollectionDisplayName(b, interfaceLanguage)) ||
    a.id.localeCompare(b.id);
}

export function getWelshFoundationsCollectionDisplayName(interfaceLanguage?: InterfaceLanguage) {
  return getCollectionDisplayName(
    {
      name: WELSH_FOUNDATIONS_COLLECTION_DISPLAY_NAME,
      nameCy: WELSH_FOUNDATIONS_COLLECTION_DISPLAY_NAME_CY
    },
    interfaceLanguage
  );
}

export function getPublicCatalogueCollectionDisplayName(
  collection: Pick<WordListCollection, 'id' | 'name'> & { nameCy?: string | null; name_cy?: string | null },
  interfaceLanguage?: InterfaceLanguage
) {
  if (collection.id === WELSH_FOUNDATIONS_COLLECTION_ID) {
    return interfaceLanguage === 'cy' ? WELSH_FOUNDATIONS_AREA_LABEL_CY : WELSH_FOUNDATIONS_AREA_LABEL;
  }

  if (collection.id === PRACTICE_LIBRARY_COLLECTION_ID) {
    return interfaceLanguage === 'cy' ? PRACTICE_LIBRARY_AREA_LABEL_CY : PRACTICE_LIBRARY_AREA_LABEL;
  }

  return getCollectionDisplayName(collection, interfaceLanguage);
}

export function getWordListStageDisplayName(
  list: Pick<WordList, 'collectionId' | 'stage'> & { stageId?: string | null }
) {
  if (list.collectionId === WELSH_FOUNDATIONS_COLLECTION_ID && list.stageId === FOUNDATIONS_STAGE_ID) {
    return WELSH_FOUNDATIONS_STAGE_LABEL;
  }
  if (list.stageId === FOUNDATIONS_STAGE_ID) return 'Foundations';

  return list.stage.trim() || 'Word Lists';
}

function getWelshFoundationsStageLabel(interfaceLanguage?: InterfaceLanguage) {
  return interfaceLanguage === 'cy' ? WELSH_FOUNDATIONS_STAGE_LABEL_CY : WELSH_FOUNDATIONS_STAGE_LABEL;
}

export function getPracticeLibraryCategoryLabel(list: Pick<WordList, 'id' | 'name'>, interfaceLanguage?: InterfaceLanguage) {
  const category = PRACTICE_LIBRARY_CATEGORY_LABELS[list.id];
  if (category) return interfaceLanguage === 'cy' && category.cy ? category.cy : category.en;

  return list.name.replace(/^Most Common\s+/i, '').trim() || list.name;
}

export function getPracticeLibraryIconName(list: Pick<WordList, 'id' | 'iconName'>) {
  return list.iconName?.trim() || PRACTICE_LIBRARY_CATEGORY_ICON_NAMES[list.id] || 'BookOpen';
}

export function getWordListCatalogueOrder(list: Pick<WordList, 'id' | 'collectionId' | 'order'> & { collection?: Pick<WordListCollection, 'id'> | null }) {
  return list.order;
}

export function getWordListProgressionOrder(list: Pick<WordList, 'id' | 'collectionId' | 'order'> & { collection?: Pick<WordListCollection, 'id'> | null }) {
  return list.order;
}

export function compareWordListsForCatalogue(a: WordList, b: WordList, interfaceLanguage?: InterfaceLanguage) {
  return getWordListCatalogueOrder(a) - getWordListCatalogueOrder(b) ||
    getListDisplayName(a, interfaceLanguage).localeCompare(getListDisplayName(b, interfaceLanguage)) ||
    a.id.localeCompare(b.id);
}

export function compareWordListsForProgression(a: WordList, b: WordList, interfaceLanguage?: InterfaceLanguage) {
  return getWordListProgressionOrder(a) - getWordListProgressionOrder(b) ||
    getListDisplayName(a, interfaceLanguage).localeCompare(getListDisplayName(b, interfaceLanguage)) ||
    a.id.localeCompare(b.id);
}

export function buildPublicCatalogueGroups(lists: WordList[], interfaceLanguage?: InterfaceLanguage): PublicCatalogueCollectionGroup[] {
  const groupsByCollectionId = new Map<string, PublicCatalogueCollectionGroup>();

  mainWordLists(lists).forEach(list => {
    const collectionId = list.collection?.id ?? list.collectionId;
    const collectionName = list.collection ? getCollectionDisplayName(list.collection, interfaceLanguage) : 'Spelio Core Welsh';
    const collection = {
      id: collectionId,
      name: list.collection?.name ?? collectionName,
      nameCy: list.collection?.nameCy,
      order: list.collection?.order
    };
    const collectionGroup = groupsByCollectionId.get(collectionId) ?? {
      collection,
      title: getPublicCatalogueCollectionDisplayName(collection, interfaceLanguage),
      listGroups: []
    };

    const groupTitle = collectionId === WELSH_FOUNDATIONS_COLLECTION_ID
      ? getWelshFoundationsCollectionDisplayName(interfaceLanguage)
      : collectionId === PRACTICE_LIBRARY_COLLECTION_ID
        ? getPracticeLibraryCategoryLabel(list, interfaceLanguage)
        : getWordListStageDisplayName(list);
    const groupSubtitle = collectionId === WELSH_FOUNDATIONS_COLLECTION_ID
      ? getWelshFoundationsStageLabel(interfaceLanguage)
      : undefined;
    const groupKey = collectionId === PRACTICE_LIBRARY_COLLECTION_ID
      ? groupTitle
      : `${groupTitle}:${groupSubtitle ?? ''}`;
    const listGroup = collectionGroup.listGroups.find(group => group.key === groupKey) ?? {
      key: groupKey,
      title: groupTitle,
      subtitle: groupSubtitle,
      lists: []
    };

    if (!collectionGroup.listGroups.includes(listGroup)) collectionGroup.listGroups.push(listGroup);
    listGroup.lists.push(list);
    groupsByCollectionId.set(collectionId, collectionGroup);
  });

  return Array.from(groupsByCollectionId.values())
    .map(group => ({
      ...group,
      listGroups: group.listGroups
        .map(listGroup => ({
          ...listGroup,
          lists: [...listGroup.lists].sort((a, b) => compareWordListsForCatalogue(a, b, interfaceLanguage))
        }))
        .sort((a, b) => {
          const firstA = a.lists[0];
          const firstB = b.lists[0];
          const firstAOrder = firstA ? getWordListCatalogueOrder(firstA) : Number.POSITIVE_INFINITY;
          const firstBOrder = firstB ? getWordListCatalogueOrder(firstB) : Number.POSITIVE_INFINITY;
          return firstAOrder - firstBOrder ||
            a.title.localeCompare(b.title) ||
            a.key.localeCompare(b.key);
        })
    }))
    .sort((a, b) => (
      compareWordListCollectionsForDisplay(a.collection, b.collection, interfaceLanguage)
    ));
}
