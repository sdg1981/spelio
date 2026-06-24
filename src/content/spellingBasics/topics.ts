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
    topicSlugs: ['ff', 'dd', 'll', 'w', 'y', 'ch', 'rh']
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
        { symbol: 'a', hint: { en: '“a” in the English word cat', cy: 'yr “a” yn y gair Saesneg cat' }, example: 'afal' },
        { symbol: 'e', hint: { en: '“e” in the English word bed', cy: 'yr “e” yn y gair Saesneg bed' }, example: 'hen' },
        { symbol: 'i', hint: { en: '“ee” in the English word see', cy: 'y sain “ee” yn y gair Saesneg see' }, example: 'ti' },
        { symbol: 'o', hint: { en: '“o” in the English word hot', cy: 'yr “o” yn y gair Saesneg hot' }, example: 'bore' },
        { symbol: 'w', hint: { en: '“oo” in the English word food', cy: 'y sain “oo” yn y gair Saesneg food' }, example: 'dŵr' },
        { symbol: 'y', hint: { en: '“ee” in the English word see', cy: '“ee” yn y gair Saesneg see' }, example: 'tŷ' },
        { symbol: 'f', hint: { en: '“v” in the English word van', cy: 'y sain “v” yn y gair Saesneg van' }, example: 'afal' },
        { symbol: 'ff', hint: { en: '“f” in the English word fish', cy: 'y sain “f” yn y gair Saesneg fish' }, example: 'coffi' },
        { symbol: 'dd', hint: { en: '“th” in the English word this', cy: 'y sain “th” yn y gair Saesneg this' }, example: 'dydd' },
        { symbol: 'll', hint: { en: 'a distinctive Welsh sound', cy: 'sain Gymraeg arbennig, nid sain Saesneg arferol' }, example: 'llaw' },
        { symbol: 'ch', hint: { en: '“ch” in the Scottish word loch', cy: 'yr “ch” yn y gair Sgoteg loch' }, example: 'bach' },
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
        { welsh: 'bardd', meaning: { en: 'poet', cy: 'bardd' } },
        { welsh: 'meddal', meaning: { en: 'soft', cy: 'meddal' } }
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
        { welsh: 'llaw', meaning: { en: 'hand', cy: 'llaw' } }
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
        { welsh: 'rhaid', meaning: { en: 'must', cy: 'rhaid' } }
      ]
    }
  },
  {
    slug: 'w',
    categoryId: 'sounds',
    kind: 'single',
    symbol: 'w',
    practiceListId: 'support_w',
    overviewTitle: { en: 'w', cy: 'w' },
    card: {
      subtitle: {
        en: 'W can sound like a vowel.',
        cy: 'Gall W swnio fel llafariad.'
      },
      body: [
        {
          en: 'In Welsh, w is often used as a vowel sound — usually a little like the “oo” sound in English words like food.',
          cy: 'Yn Gymraeg, mae w yn aml yn cael ei defnyddio fel sain llafariad — yn aml ychydig fel y sain “oo” mewn geiriau Saesneg fel food.'
        },
        {
          en: 'This is one reason Welsh words can look surprising if you are reading them through English habits.',
          cy: 'Dyma un rheswm pam gall geiriau Cymraeg edrych yn annisgwyl os ydych yn eu darllen drwy arferion Saesneg.'
        },
        {
          en: 'Once you start hearing w as a vowel, words like dŵr, cwm, byw, and bwrdd start to make more sense.',
          cy: 'Unwaith rydych chi’n dechrau clywed w fel llafariad, mae geiriau fel dŵr, cwm, byw, a bwrdd yn dechrau gwneud mwy o synnwyr.'
        }
      ],
      examples: [
        { welsh: 'dŵr', meaning: { en: 'water', cy: 'dŵr' } },
        { welsh: 'cwm', meaning: { en: 'valley', cy: 'cwm' } },
        { welsh: 'byw', meaning: { en: 'living', cy: 'byw' } },
        { welsh: 'bwrdd', meaning: { en: 'table', cy: 'bwrdd' } }
      ]
    }
  },
  {
    slug: 'y',
    categoryId: 'sounds',
    kind: 'single',
    symbol: 'y',
    practiceListId: 'support_y',
    overviewTitle: { en: 'y', cy: 'y' },
    card: {
      subtitle: {
        en: 'Y can sound like a vowel.',
        cy: 'Gall Y swnio fel llafariad.'
      },
      body: [
        {
          en: 'Welsh y often works as a vowel, but its sound can change depending on the word.',
          cy: 'Mae y Gymraeg yn aml yn gweithio fel llafariad, ond gall ei sain newid yn ôl y gair.'
        },
        {
          en: 'It can sound a little like the “ee” in English words like see, or softer like the “u” in English words like up.',
          cy: 'Gall swnio ychydig fel yr “ee” mewn geiriau Saesneg fel see, neu’n feddalach fel yr “u” mewn geiriau Saesneg fel up.'
        },
        {
          en: 'That can feel unfamiliar at first, because English readers are not used to y behaving this way.',
          cy: 'Gall hynny deimlo’n anghyfarwydd ar y dechrau, oherwydd nid yw darllenwyr Saesneg wedi arfer â y yn ymddwyn fel hyn.'
        },
        {
          en: 'Once you start noticing y in words like tŷ, dydd, mynydd, and llyfr, Welsh spelling starts to feel more predictable.',
          cy: 'Unwaith rydych chi’n dechrau sylwi ar y mewn geiriau fel tŷ, dydd, mynydd, a llyfr, mae sillafu Cymraeg yn dechrau teimlo’n fwy rhagweladwy.'
        }
      ],
      observation: {
        title: {
          en: 'Helpful pattern to notice:',
          cy: 'Patrwm defnyddiol i sylwi arno:'
        },
        body: [
          {
            en: 'Y near the end of short words often sounds more like “ee”.',
            cy: 'Mae y ger diwedd geiriau byr yn aml yn swnio’n fwy fel “ee”.'
          },
          {
            en: 'Earlier in longer words it is often softer.',
            cy: 'Mewn geiriau hirach, mae’n aml yn swnio’n feddalach.'
          }
        ]
      },
      tip: {
        en: 'Welsh y is worth noticing carefully because it appears in many common words.',
        cy: 'Mae y Gymraeg yn werth sylwi arni’n ofalus oherwydd mae’n ymddangos mewn llawer o eiriau cyffredin.'
      },
      examples: [
        { welsh: 'tŷ', meaning: { en: 'house', cy: 'tŷ' } },
        { welsh: 'dydd', meaning: { en: 'day', cy: 'dydd' } },
        { welsh: 'mynydd', meaning: { en: 'mountain', cy: 'mynydd' } },
        { welsh: 'llyfr', meaning: { en: 'book', cy: 'llyfr' } }
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
          en: 'Small marks that change words',
          cy: 'Marciau bach sy’n newid geiriau'
        },
        body: [
          {
            en: 'Welsh accents are small marks written above letters.',
            cy: 'Mae acenion Cymraeg yn farciau bach uwchben llythrennau.'
          },
          {
            en: 'They often show that a vowel sound is longer.',
            cy: 'Yn aml, maen nhw’n dangos bod sain llafariad yn hirach.'
          },
          {
            en: 'Listen carefully: in tân, the â is held a little longer than the a in tan. The accent also changes the meaning.',
            cy: 'Gwrandewch yn ofalus: yn tân, mae’r â yn cael ei ddal ychydig yn hirach na’r a yn tan. Mae’r acen hefyd yn newid yr ystyr.'
          }
        ],
        examples: [
          { welsh: 'tan', meaning: { en: 'until', cy: 'tan' } },
          { welsh: 'tân', meaning: { en: 'fire', cy: 'tân' } }
        ],
        tip: {
          en: 'The difference can be subtle, so listening side by side helps.',
          cy: 'Gall y gwahaniaeth fod yn gynnil, felly mae gwrando ochr yn ochr yn helpu.'
        }
      },
      {
        title: {
          en: 'Accented vowels',
          cy: 'Llafariaid ag acen'
        },
        body: [
          {
            en: 'Welsh accents can appear on vowels such as â, ê, î, ô, û, ŵ, and ŷ.',
            cy: 'Gall acenion Cymraeg ymddangos ar lafariaid fel â, ê, î, ô, û, ŵ, ac ŷ.'
          },
          {
            en: 'You will often notice ŵ and ŷ in short Welsh words. They can help show a longer vowel sound.',
            cy: 'Byddwch yn aml yn sylwi ar ŵ ac ŷ mewn geiriau Cymraeg byr. Gallant helpu i ddangos sain llafariad hirach.'
          }
        ],
        examples: [
          { welsh: 'dŵr', meaning: { en: 'water', cy: 'dŵr' } },
          { welsh: 'tŷ', meaning: { en: 'house', cy: 'tŷ' } },
          { welsh: 'ŷd', meaning: { en: 'corn / grain', cy: 'ŷd' } }
        ]
      }
    ]
  }
];
