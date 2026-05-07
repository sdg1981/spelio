import type { WordList } from '../../data/wordLists';
import type { Translate } from '../../i18n';

export function getSelectedLists(selectedListIds: string[], lists: WordList[]) {
  const byId = new Map(lists.map(list => [list.id, list]));
  return selectedListIds
    .map(id => byId.get(id))
    .filter((list): list is WordList => Boolean(list));
}

export function getSelectedListLabel(selectedListIds: string[], lists: WordList[], t?: Translate) {
  const selectedLists = getSelectedLists(selectedListIds, lists);

  if (selectedLists.length === 0) return t ? t('home.selectWordList') : 'Select a word list';
  if (selectedLists.length === 1) return selectedLists[0].name;
  return t ? t('home.customMixedWordList') : 'Custom mixed word list';
}
