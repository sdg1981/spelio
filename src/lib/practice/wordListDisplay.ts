import type { WordList } from '../../data/wordLists';
import type { InterfaceLanguage } from '../../i18n';

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
