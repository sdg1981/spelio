export type WelshSpellingMode = 'flexible' | 'strict';
export type Dialect = 'North Wales' | 'South Wales' | 'Both' | 'Other';

export interface PracticeWord {
  id: string;
  listId: string;
  englishPrompt: string;
  welshAnswer: string;
  acceptedAlternatives?: string[];
  audioUrl?: string;
  audioStatus?: 'missing' | 'generated' | 'failed';
  notes?: string;
  order: number;
}

export interface WordList {
  id: string;
  name: string;
  description: string;
  language: 'Welsh';
  dialect: Dialect;
  stage: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  order: number;
  nextListId?: string;
  isActive: boolean;
  words: PracticeWord[];
}

function words(listId: string, rows: Array<[string, string]>): PracticeWord[] {
  return rows.map(([englishPrompt, welshAnswer], index) => ({
    id: `${listId}-${index + 1}`,
    listId,
    englishPrompt,
    welshAnswer,
    audioUrl: '',
    audioStatus: 'missing',
    order: index + 1
  }));
}

export const wordLists: WordList[] = [
  {
    id: 'common-verbs-north',
    name: 'Common Verbs — North Wales',
    description: 'Useful beginner verbs for daily practice.',
    language: 'Welsh',
    dialect: 'North Wales',
    stage: 'Foundations',
    difficulty: 1,
    order: 1,
    nextListId: 'everyday-words-both',
    isActive: true,
    words: words('common-verbs-north', [
      ['To work', 'gweithio'],
      ['To go', 'mynd'],
      ['To come', 'dod'],
      ['To see', 'gweld'],
      ['To speak', 'siarad'],
      ['To learn', 'dysgu'],
      ['To write', 'ysgrifennu'],
      ['To read', 'darllen'],
      ['To listen', 'gwrando'],
      ['To remember', 'cofio'],
      ['To start', 'dechrau'],
      ['To finish', 'gorffen']
    ])
  },
  {
    id: 'everyday-words-both',
    name: 'Everyday Words — Both',
    description: 'Common words that are useful from the beginning.',
    language: 'Welsh',
    dialect: 'Both',
    stage: 'Foundations',
    difficulty: 1,
    order: 2,
    nextListId: 'opposites-both',
    isActive: true,
    words: words('everyday-words-both', [
      ['Water', 'dŵr'],
      ['Bread', 'bara'],
      ['Milk', 'llaeth'],
      ['Coffee', 'coffi'],
      ['Tea', 'te'],
      ['House', 'tŷ'],
      ['School', 'ysgol'],
      ['Work', 'gwaith'],
      ['Book', 'llyfr'],
      ['Friend', 'ffrind'],
      ['Morning', 'bore'],
      ['Evening', 'noswaith']
    ])
  },
  {
    id: 'opposites-both',
    name: 'Opposites — Both',
    description: 'Simple contrast words for spelling practice.',
    language: 'Welsh',
    dialect: 'Both',
    stage: 'Foundations',
    difficulty: 2,
    order: 3,
    nextListId: 'animals-both',
    isActive: true,
    words: words('opposites-both', [
      ['Big', 'mawr'],
      ['Small', 'bach'],
      ['Fast', 'cyflym'],
      ['Slow', 'araf'],
      ['Hot', 'poeth'],
      ['Cold', 'oer'],
      ['Good', 'da'],
      ['Bad', 'drwg'],
      ['Long', 'hir'],
      ['Short', 'byr']
    ])
  },
  {
    id: 'animals-both',
    name: 'Animals — Both',
    description: 'Animal words with useful Welsh spelling patterns.',
    language: 'Welsh',
    dialect: 'Both',
    stage: 'Core Welsh',
    difficulty: 2,
    order: 4,
    isActive: true,
    words: words('animals-both', [
      ['Cat', 'cath'],
      ['Dog', 'ci'],
      ['Horse', 'ceffyl'],
      ['Cow', 'buwch'],
      ['Sheep', 'dafad'],
      ['Bird', 'aderyn'],
      ['Fish', 'pysgodyn'],
      ['Mouse', 'llygoden'],
      ['Fox', 'llwynog'],
      ['Rabbit', 'cwningen']
    ])
  },
  {
    id: 'weather-both',
    name: 'Weather — Both',
    description: 'Weather vocabulary for everyday use.',
    language: 'Welsh',
    dialect: 'Both',
    stage: 'Core Welsh',
    difficulty: 2,
    order: 5,
    isActive: true,
    words: words('weather-both', [
      ['Rain', 'glaw'],
      ['Sun', 'haul'],
      ['Wind', 'gwynt'],
      ['Snow', 'eira'],
      ['Cloud', 'cwmwl'],
      ['Storm', 'storm'],
      ['Warm', 'cynnes'],
      ['Cold', 'oer'],
      ['Today', 'heddiw'],
      ['Tomorrow', 'yfory']
    ])
  },
  {
    id: 'food-drink-both',
    name: 'Food & Drink — Both',
    description: 'Food and drink words for short sessions.',
    language: 'Welsh',
    dialect: 'Both',
    stage: 'Core Welsh',
    difficulty: 2,
    order: 6,
    isActive: true,
    words: words('food-drink-both', [
      ['Food', 'bwyd'],
      ['Drink', 'diod'],
      ['Apple', 'afal'],
      ['Cheese', 'caws'],
      ['Soup', 'cawl'],
      ['Cake', 'cacen'],
      ['Breakfast', 'brecwast'],
      ['Lunch', 'cinio'],
      ['Supper', 'swper'],
      ['Water', 'dŵr']
    ])
  }
];

export const defaultSelectedListIds = ['common-verbs-north'];
