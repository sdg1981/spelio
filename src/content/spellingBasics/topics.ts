import type { SpellingBasicsCategory, SpellingBasicsTopic } from './types';

export const spellingBasicsCategories: SpellingBasicsCategory[] = [
  {
    id: 'start',
    title: {
      en: 'Start here',
      cy: 'Dechrau yma'
    },
    topicSlugs: ['phonetic', 'why-welsh-looks-different', 'how-spelio-helps']
  },
  {
    id: 'sounds',
    title: {
      en: 'Welsh sounds',
      cy: 'Seiniau Cymraeg'
    },
    topicSlugs: ['ff', 'dd', 'll', 'wy', 'ch', 'rh']
  },
  {
    id: 'accents',
    title: {
      en: 'Accents',
      cy: 'Acenion'
    },
    topicSlugs: ['accents']
  }
];

export const spellingBasicsTopics: SpellingBasicsTopic[] = [
  {
    slug: 'phonetic',
    categoryId: 'start',
    kind: 'single',
    iconKey: 'ear',
    overviewTitle: {
      en: 'Welsh is mostly phonetic',
      cy: 'Mae Cymraeg yn weddol ffonetig'
    },
    card: {
      subtitle: {
        en: 'Welsh spelling is more predictable than it first looks.',
        cy: 'Mae sillafu Cymraeg yn fwy rhagweladwy nag y mae’n edrych ar y dechrau.'
      },
      body: [
        {
          en: 'Welsh spelling often follows more consistent sound patterns than English. Once you recognise the sounds, many words become much easier to read and spell.',
          cy: 'Mae sillafu Cymraeg yn aml yn dilyn patrymau sain mwy cyson na Saesneg. Unwaith y byddwch yn adnabod y seiniau, mae llawer o eiriau’n dod yn haws i’w darllen a’u sillafu.'
        }
      ],
      tip: {
        en: 'Welsh is not perfectly phonetic, but it is often more regular than English.',
        cy: 'Nid yw Cymraeg yn hollol ffonetig, ond mae’n aml yn fwy rheolaidd na Saesneg.'
      },
      examples: [
        { welsh: 'dydd', meaning: { en: 'day', cy: 'dydd' } },
        { welsh: 'bore', meaning: { en: 'morning', cy: 'bore' } },
        { welsh: 'ysgol', meaning: { en: 'school', cy: 'ysgol' } }
      ]
    },
    phoneticOrientation: {
      soundSectionTitle: {
        en: 'Tap a sound',
        cy: 'Tapiwch sain'
      },
      soundSectionBody: {
        en: 'These are some of the building blocks that make Welsh spelling feel more regular.',
        cy: 'Dyma rai o’r blociau adeiladu sy’n gwneud i sillafu Cymraeg deimlo’n fwy rheolaidd.'
      },
      sounds: [
        { symbol: 'a', hint: { en: 'like “a” in cat', cy: 'fel yr “a” yn y gair Saesneg cat' }, example: 'afal' },
        { symbol: 'e', hint: { en: 'like “e” in bed', cy: 'fel yr “e” yn y gair Saesneg bed' }, example: 'hen' },
        { symbol: 'i', hint: { en: 'often like “ee” in see', cy: 'fel y sain “ee” yn y gair Saesneg see' }, example: 'ti' },
        { symbol: 'o', hint: { en: 'like “o” in hot', cy: 'fel yr “o” yn y gair Saesneg hot' }, example: 'bore' },
        { symbol: 'w', hint: { en: '“oo” in food', cy: 'fel y sain “oo” yn y gair Saesneg food' }, example: 'dŵr' },
        { symbol: 'y', hint: { en: '“ee” in see', cy: 'fel y sain “ee” yn y gair Saesneg see' }, example: 'tŷ' },
        { symbol: 'f', hint: { en: 'usually like English “v”', cy: 'fel y sain “v” yn y gair Saesneg van' }, example: 'afal' },
        { symbol: 'ff', hint: { en: 'usually like English “f”', cy: 'fel y sain “f” yn y gair Saesneg fish' }, example: 'ffordd' },
        { symbol: 'dd', hint: { en: 'like “th” in this', cy: 'fel y sain “th” yn y gair Saesneg this' }, example: 'dydd' },
        { symbol: 'll', hint: { en: 'a distinctive Welsh sound', cy: 'sain Gymraeg arbennig, nid sain Saesneg arferol' }, example: 'llaw' },
        { symbol: 'ch', hint: { en: 'the “ch” in Scottish loch', cy: 'fel yr “ch” yn y gair Scottish loch' }, example: 'bach' },
        { symbol: 'rh', hint: { en: 'a breathy Welsh r sound', cy: 'sain “r” Gymraeg anadlol, nid sain Saesneg arferol' }, example: 'rhydd' }
      ],
      patternExample: {
        title: {
          en: 'Example: heddiw',
          cy: 'Enghraifft: heddiw'
        },
        body: {
          en: 'Some Welsh words look difficult at first, but they often become easier once you recognise the patterns.',
          cy: 'Mae rhai geiriau Cymraeg yn edrych yn anodd ar y dechrau, ond maen nhw’n aml yn dod yn haws pan fyddwch chi’n sylwi ar y patrymau.'
        },
        patterns: ['h', 'e', 'dd', 'iw'],
        word: 'heddiw',
        helper: {
          en: 'Listen to the whole word, then notice how the patterns sit inside it.',
          cy: 'Gwrandewch ar y gair cyfan, wedyn sylwch sut mae’r patrymau’n eistedd ynddo.'
        }
      },
      llNote: {
        en: 'If Spelio used “ll” — Spellio — it would suggest a very different Welsh sound.',
        cy: 'Pe bai Spelio yn defnyddio “ll” — Spellio — byddai’n awgrymu sain Gymraeg wahanol iawn.'
      },
      closing: {
        en: 'Once the sound patterns become familiar, Welsh spelling starts to feel much more logical.',
        cy: 'Unwaith y bydd y patrymau sain yn dod yn gyfarwydd, mae sillafu Cymraeg yn dechrau teimlo’n llawer mwy rhesymegol.'
      }
    }
  },
  {
    slug: 'why-welsh-looks-different',
    categoryId: 'start',
    kind: 'single',
    iconKey: 'book',
    overviewTitle: {
      en: 'Why Welsh looks different from English',
      cy: 'Pam mae Cymraeg yn edrych yn wahanol i Saesneg'
    },
    card: {
      subtitle: {
        en: 'Different patterns, not random spelling.',
        cy: 'Patrymau gwahanol, nid sillafu ar hap.'
      },
      body: [
        {
          en: 'Welsh uses some letters and combinations differently from English. That can make words look unfamiliar at first, but the patterns are usually consistent.',
          cy: 'Mae Cymraeg yn defnyddio rhai llythrennau a chyfuniadau mewn ffordd wahanol i Saesneg. Gall hynny wneud i eiriau edrych yn anghyfarwydd ar y dechrau, ond mae’r patrymau fel arfer yn gyson.'
        },
        {
          en: 'Sounds like dd, ll, ch, rh, ff, w, and y appear often, so recognising them makes a big difference.',
          cy: 'Mae seiniau fel dd, ll, ch, rh, ff, w, ac y yn ymddangos yn aml, felly mae eu hadnabod yn gwneud gwahaniaeth mawr.'
        }
      ],
      tip: {
        en: 'When Welsh looks unfamiliar, look for repeated patterns rather than trying to read it like English.',
        cy: 'Pan fydd Cymraeg yn edrych yn anghyfarwydd, chwiliwch am batrymau sy’n ailadrodd yn hytrach na’i ddarllen fel Saesneg.'
      },
      examples: [
        { welsh: 'llaeth', meaning: { en: 'milk', cy: 'llaeth' } },
        { welsh: 'chwech', meaning: { en: 'six', cy: 'chwech' } },
        { welsh: 'dŵr', meaning: { en: 'water', cy: 'dŵr' } }
      ]
    }
  },
  {
    slug: 'how-spelio-helps',
    categoryId: 'start',
    kind: 'single',
    iconKey: 'lightbulb',
    overviewTitle: {
      en: 'How Spelio helps you practise',
      cy: 'Sut mae Spelio yn eich helpu i ymarfer'
    },
    card: {
      subtitle: {
        en: 'Short sessions that build recall.',
        cy: 'Sesiynau byr sy’n meithrin cofio.'
      },
      body: [
        {
          en: 'Spelio helps you hear a Welsh word, recall the spelling, and type it carefully. The aim is not to rush, but to build confidence through focused repetition.',
          cy: 'Mae Spelio yn eich helpu i glywed gair Cymraeg, cofio’r sillafiad, a’i deipio’n ofalus. Nid rhuthro yw’r nod, ond meithrin hyder drwy ailadrodd ffocysedig.'
        },
        {
          en: 'Difficult words quietly return later, giving you another calm chance to practise them.',
          cy: 'Mae geiriau anodd yn dod yn ôl yn dawel yn nes ymlaen, gan roi cyfle tawel arall i chi eu hymarfer.'
        }
      ],
      tip: {
        en: 'Listening first helps connect the sound of Welsh with the written form.',
        cy: 'Mae gwrando yn gyntaf yn helpu i gysylltu sain y Gymraeg â’r ffurf ysgrifenedig.'
      }
    }
  },
  {
    slug: 'ff',
    categoryId: 'sounds',
    kind: 'single',
    symbol: 'ff',
    practiceListId: 'support_ff',
    overviewTitle: { en: 'ff', cy: 'ff' },
    card: {
      subtitle: {
        en: 'Welsh “ff” sounds like English “f”.',
        cy: 'Mae “ff” Cymraeg yn swnio fel “f” Saesneg.'
      },
      body: [
        {
          en: 'In Welsh, ff usually makes the sound you expect from English f.',
          cy: 'Yn Gymraeg, mae ff fel arfer yn gwneud y sain rydych yn ei disgwyl gan f Saesneg.'
        },
        {
          en: 'The single letter f is different in Welsh: it usually sounds like English v. That is why ff is an important spelling pattern to notice.',
          cy: 'Mae’r llythyren f ar ei phen ei hun yn wahanol yn Gymraeg: fel arfer mae’n swnio fel v Saesneg. Dyna pam mae ff yn batrwm sillafu pwysig i sylwi arno.'
        }
      ],
      tip: {
        en: 'If you hear an English-style “f” sound in Welsh, look for ff.',
        cy: 'Os ydych yn clywed sain fel “f” Saesneg mewn Cymraeg, chwiliwch am ff.'
      },
      examples: [
        { welsh: 'ffordd', meaning: { en: 'road', cy: 'ffordd' } },
        { welsh: 'coffi', meaning: { en: 'coffee', cy: 'coffi' } },
        { welsh: 'ffrind', meaning: { en: 'friend', cy: 'ffrind' } }
      ]
    }
  },
  {
    slug: 'dd',
    categoryId: 'sounds',
    kind: 'single',
    symbol: 'dd',
    practiceListId: 'support_dd',
    overviewTitle: { en: 'dd', cy: 'dd' },
    card: {
      subtitle: {
        en: 'A soft, gentle sound',
        cy: 'Sain feddal, dyner'
      },
      body: [
        {
          en: 'The letters dd make a soft voiced “th” sound, like the th in this.',
          cy: 'Mae’r llythrennau dd yn gwneud sain “th” feddal, fel y th yn y gair Saesneg this.'
        },
        {
          en: 'It’s one of the most common sounds in Welsh and appears in many everyday words.',
          cy: 'Mae’n un o’r seiniau mwyaf cyffredin yn Gymraeg ac mae’n ymddangos mewn llawer o eiriau bob dydd.'
        }
      ],
      tip: {
        en: 'When you see dd in a word, think of the “th” sound in this.',
        cy: 'Pan welwch dd mewn gair, meddyliwch am y sain “th” yn y gair Saesneg this.'
      },
      examples: [
        { welsh: 'dydd', meaning: { en: 'day', cy: 'dydd' } },
        { welsh: 'heddiw', meaning: { en: 'today', cy: 'heddiw' } },
        { welsh: 'mynydd', meaning: { en: 'mountain', cy: 'mynydd' } }
      ]
    }
  },
  {
    slug: 'll',
    categoryId: 'sounds',
    kind: 'single',
    symbol: 'll',
    practiceListId: 'support_ll',
    overviewTitle: { en: 'll', cy: 'll' },
    card: {
      subtitle: {
        en: 'A distinctive Welsh sound.',
        cy: 'Sain Gymraeg nodweddiadol.'
      },
      body: [
        {
          en: 'The letters ll represent one of the most recognisable Welsh sounds. It is treated as its own sound pattern, not just two separate l letters.',
          cy: 'Mae’r llythrennau ll yn cynrychioli un o seiniau mwyaf adnabyddus y Gymraeg. Mae’n batrwm sain ei hun, nid dim ond dwy l ar wahân.'
        },
        {
          en: 'For spelling practice, the most important thing is to recognise ll when you hear and see it.',
          cy: 'Ar gyfer ymarfer sillafu, y peth pwysicaf yw adnabod ll pan fyddwch yn ei glywed a’i weld.'
        }
      ],
      tip: {
        en: 'At first, focus on recognising ll in common words rather than perfecting the pronunciation.',
        cy: 'I ddechrau, canolbwyntiwch ar adnabod ll mewn geiriau cyffredin yn hytrach na pherffeithio’r ynganiad.'
      },
      examples: [
        { welsh: 'lle', meaning: { en: 'place', cy: 'lle' } },
        { welsh: 'llaw', meaning: { en: 'hand', cy: 'llaw' } },
        { welsh: 'llyfr', meaning: { en: 'book', cy: 'llyfr' } }
      ]
    }
  },
  {
    slug: 'ch',
    categoryId: 'sounds',
    kind: 'single',
    symbol: 'ch',
    practiceListId: 'support_ch',
    overviewTitle: { en: 'ch', cy: 'ch' },
    card: {
      subtitle: {
        en: 'Not the English “ch” in church.',
        cy: 'Nid y “ch” Saesneg yn church.'
      },
      body: [
        {
          en: 'Welsh ch is a single sound pattern. It is closer to the ch in Scottish loch than the English ch in church.',
          cy: 'Mae ch Cymraeg yn batrwm sain unigol. Mae’n nes at yr “ch” yn y gair Scottish loch na’r “ch” Saesneg yn church.'
        },
        {
          en: 'Once you recognise ch as its own Welsh sound, many words start to feel more familiar.',
          cy: 'Unwaith y byddwch yn adnabod ch fel sain Gymraeg ar wahân, mae llawer o eiriau’n dechrau teimlo’n fwy cyfarwydd.'
        }
      ],
      tip: {
        en: 'When you see ch in Welsh, do not read it like English church.',
        cy: 'Pan welwch ch yn Gymraeg, peidiwch â’i darllen fel y gair Saesneg church.'
      },
      examples: [
        { welsh: 'bach', meaning: { en: 'small', cy: 'bach' } },
        { welsh: 'chwech', meaning: { en: 'six', cy: 'chwech' } },
        { welsh: 'iechyd', meaning: { en: 'health', cy: 'iechyd' } }
      ]
    }
  },
  {
    slug: 'rh',
    categoryId: 'sounds',
    kind: 'single',
    symbol: 'rh',
    practiceListId: 'support_rh',
    overviewTitle: { en: 'rh', cy: 'rh' },
    card: {
      subtitle: {
        en: 'A breathy Welsh sound.',
        cy: 'Sain Gymraeg anadlog.'
      },
      body: [
        {
          en: 'Welsh rh is a common sound pattern that appears at the start of many words. It sounds a little like an r sound with extra breath.',
          cy: 'Mae rh Cymraeg yn batrwm sain cyffredin sy’n ymddangos ar ddechrau llawer o eiriau. Mae’n swnio ychydig fel sain r gyda mwy o anadl.'
        },
        {
          en: 'You do not need a long explanation to begin with. Just noticing rh as a Welsh spelling pattern will help you recognise it more quickly.',
          cy: 'Does dim angen esboniad hir i ddechrau. Bydd sylwi ar rh fel patrwm sillafu Cymraeg yn eich helpu i’w adnabod yn gyflymach.'
        }
      ],
      tip: {
        en: 'Treat rh as a Welsh sound pattern of its own.',
        cy: 'Triniwch rh fel patrwm sain Cymraeg ei hun.'
      },
      examples: [
        { welsh: 'rhydd', meaning: { en: 'free', cy: 'rhydd' } },
        { welsh: 'rhyw', meaning: { en: 'some / kind', cy: 'rhyw' } },
        { welsh: 'rhiain', meaning: { en: 'maiden', cy: 'rhiain' } }
      ]
    }
  },
  {
    slug: 'wy',
    categoryId: 'sounds',
    kind: 'single',
    symbol: 'wy',
    practiceListId: 'support_wy',
    overviewTitle: { en: 'wy', cy: 'wy' },
    card: {
      subtitle: {
        en: 'W and Y often sound like vowels.',
        cy: 'Mae W ac Y yn aml yn swnio fel llafariaid.'
      },
      body: [
        {
          en: 'In Welsh, w and y often work as vowels. This is one reason Welsh words can look surprising if you are reading them through English habits.',
          cy: 'Yn Gymraeg, mae w ac y yn aml yn gweithio fel llafariaid. Dyma un rheswm pam gall geiriau Cymraeg edrych yn annisgwyl os ydych yn eu darllen drwy arferion Saesneg.'
        },
        {
          en: 'Once you notice this, words like dŵr, tŷ, byw, and gwyn start to make more sense.',
          cy: 'Unwaith rydych yn sylwi ar hyn, mae geiriau fel dŵr, tŷ, byw, a gwyn yn dechrau gwneud mwy o synnwyr.'
        }
      ],
      tip: {
        en: 'Do not assume w and y are always consonants in Welsh.',
        cy: 'Peidiwch â chymryd yn ganiataol fod w ac y bob amser yn gytseiniaid yn Gymraeg.'
      },
      examples: [
        { welsh: 'dŵr', meaning: { en: 'water', cy: 'dŵr' } },
        { welsh: 'wy', meaning: { en: 'egg', cy: 'wy' } },
        { welsh: 'byw', meaning: { en: 'living', cy: 'byw' } },
        { welsh: 'gwyn', meaning: { en: 'white', cy: 'gwyn' } }
      ]
    }
  },
  {
    slug: 'accents',
    categoryId: 'accents',
    kind: 'series',
    symbol: 'â',
    practiceListId: 'support_accents',
    overviewTitle: {
      en: 'Accents and long vowels',
      cy: 'Acenion a llafariaid hir'
    },
    overviewBody: {
      en: 'Why the little marks matter',
      cy: 'Pam mae’r marciau bach yn bwysig'
    },
    cards: [
      {
        title: {
          en: 'What accents do',
          cy: 'Beth mae acenion yn ei wneud'
        },
        body: [
          {
            en: 'Welsh accents can show that a vowel is longer or that a word needs a particular spelling. The most common mark learners notice is the to bach — the little roof-shaped accent.',
            cy: 'Gall acenion Cymraeg ddangos bod llafariad yn hirach neu fod angen sillafiad penodol ar air. Y marc mwyaf cyffredin y mae dysgwyr yn sylwi arno yw’r to bach — yr acen fach siâp to.'
          }
        ],
        tip: {
          en: 'Accents are small, but they can change how a word sounds.',
          cy: 'Mae acenion yn fach, ond gallant newid sut mae gair yn swnio.'
        }
      },
      {
        title: {
          en: 'Ŵ and Ŷ',
          cy: 'Ŵ ac Ŷ'
        },
        body: [
          {
            en: 'You will often see accents on w and y in short Welsh words. They can help show a longer vowel sound.',
            cy: 'Byddwch yn aml yn gweld acenion ar w ac y mewn geiriau Cymraeg byr. Gallant helpu i ddangos sain llafariad hirach.'
          }
        ],
        examples: [
          { welsh: 'dŵr', meaning: { en: 'water', cy: 'dŵr' } },
          { welsh: 'tŷ', meaning: { en: 'house', cy: 'tŷ' } },
          { welsh: 'ŷd', meaning: { en: 'corn / grain', cy: 'ŷd' } }
        ]
      },
      {
        title: {
          en: 'Hear the difference',
          cy: 'Clywed y gwahaniaeth'
        },
        body: [
          {
            en: 'Sometimes an accent changes how a word sounds. Listening to the accented and unaccented forms side by side can make the difference easier to notice.',
            cy: 'Weithiau mae acen yn newid sut mae gair yn swnio. Gall gwrando ar ffurfiau ag acen a heb acen ochr yn ochr wneud y gwahaniaeth yn haws i’w sylwi.'
          }
        ],
        examples: [
          { welsh: 'tan', meaning: { en: 'until', cy: 'tan' } },
          { welsh: 'tân', meaning: { en: 'fire', cy: 'tân' } }
        ],
        tip: {
          en: 'The accent may look small, but it can change both sound and meaning.',
          cy: 'Gall yr acen edrych yn fach, ond gall newid y sain a’r ystyr.'
        }
      }
    ]
  }
];
