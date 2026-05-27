import { getSpellingBasicsTopic, getSpellingBasicsTopicSlugFromPath } from '../content/spellingBasics';
import type { SpellingBasicsTopic } from '../content/spellingBasics';
import type { WordList } from '../data/wordLists';
import type { InterfaceLanguage } from '../i18n';
import { getCustomPublicIdFromPath, getCustomSharePublicIdFromPath } from './customListRoutes';
import { getListDisplayDescription, getListDisplayName } from './practice/wordListDisplay';
import {
  findActiveWordListBySlug,
  getSharedWordListSlugFromPath,
  getWordListPath,
  isPracticeTestShareMode
} from './wordListSharing';

export type PublicScreenForMetadata = 'home' | 'practice' | 'end' | 'how' | 'feedback' | 'privacy' | 'about' | 'word-lists' | 'custom-new' | 'custom-share' | 'custom-entry' | 'spelling-basics' | 'spelling-basics-topic';

export type PageMetadata = {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: 'index, follow' | 'noindex, follow';
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  twitterTitle: string;
  twitterDescription: string;
};

export type PublicMetadataInput = {
  origin: string;
  pathname: string;
  search?: string;
  interfaceLanguage: InterfaceLanguage;
  screen?: PublicScreenForMetadata;
  wordLists?: WordList[];
};

const SITE_NAME = 'Spelio';
const DEFAULT_ORIGIN = 'https://spelio.app';

const home = {
  en: {
    title: 'Spelio - Welsh spelling practice',
    description: 'Calm, focused Welsh spelling practice for adults. Hear a Welsh word, recall it, and type the spelling.'
  },
  cy: {
    title: 'Spelio - Ymarfer sillafu Cymraeg',
    description: 'Ymarfer sillafu Cymraeg tawel a ffocysedig. Gwrandewch ar air Cymraeg, cofiwch ef, a theipiwch y sillafiad.'
  }
};

const staticPages: Record<string, { title: string; description: string; robots?: PageMetadata['robots'] }> = {
  '/how-spelio-works': {
    title: 'How Spelio works - Welsh spelling practice',
    description: 'See how Spelio helps adult learners practise Welsh spelling through short sessions built around listening, recall, and typing.'
  },
  '/word-lists': {
    title: 'Welsh spelling word lists - Spelio',
    description: 'Choose focused Welsh word lists for short practice sessions, including sounds, common words, phrases, and spelling patterns.'
  },
  '/about': {
    title: 'About Spelio',
    description: 'Spelio is a focused Welsh spelling tool for learners who want to connect spoken and written Cymraeg.'
  },
  '/privacy': {
    title: 'Privacy - Spelio',
    description: 'How Spelio handles local progress, settings, anonymous beta usage information, and personal data.'
  },
  '/feedback': {
    title: 'Feedback - Spelio',
    description: 'Send feedback, corrections, or suggestions for Spelio and its Welsh spelling practice.',
    robots: 'noindex, follow'
  },
  '/custom-list/new': {
    title: 'Create a custom Welsh spelling list - Spelio',
    description: 'Create a short Welsh spelling list, generate audio, and share focused practice by link or QR code.',
    robots: 'noindex, follow'
  }
};

const spellingBasicsDescriptions: Record<string, string> = {
  phonetic: 'A short guide to why Welsh spelling is often more regular than it first looks, with sounds and examples for practice.',
  'why-welsh-looks-different': 'A calm explanation of Welsh spelling patterns such as dd, ll, ch, rh, ff, w, and y.',
  'how-spelio-helps': 'How Spelio uses listening, recall, typing, and focused repetition to support Welsh spelling.',
  ff: 'Learn how Welsh ff works, why it differs from single f, and practise recognising it in common Welsh words.',
  dd: 'A short guide to the Welsh dd sound, with examples and focused spelling practice.',
  ll: 'Learn to recognise the Welsh ll sound pattern in common words and practise spelling it with Spelio.',
  ch: 'A simple guide to Welsh ch, how it differs from English ch, and how to recognise it in spelling practice.',
  rh: 'Learn to notice rh as a Welsh spelling pattern, with examples and focused practice.',
  w: 'A short guide to Welsh w as a vowel sound, with examples such as dŵr, cwm, byw, and bwrdd.',
  y: 'Learn how Welsh y can sound in common words and practise recognising it as part of Welsh spelling.',
  accents: 'A short guide to Welsh accents, long vowel sounds, and why small marks can change words.'
};

const spellingBasicsWelshDescriptions: Record<string, string> = {
  phonetic: 'Nodyn byr ar pam mae sillafu Cymraeg yn aml yn fwy rheolaidd nag y mae’n edrych ar y dechrau.',
  'why-welsh-looks-different': 'Esboniad tawel o batrymau sillafu Cymraeg fel dd, ll, ch, rh, ff, w, ac y.',
  'how-spelio-helps': 'Sut mae Spelio yn defnyddio gwrando, cofio, teipio, ac ailadrodd ffocysedig i gefnogi sillafu Cymraeg.',
  ff: 'Dysgwch sut mae ff yn gweithio yn Gymraeg, a sut i’w adnabod mewn geiriau cyffredin.',
  dd: 'Nodyn byr ar y sain dd Gymraeg, gydag enghreifftiau ac ymarfer sillafu ffocysedig.',
  ll: 'Dysgwch adnabod y patrwm ll mewn geiriau Cymraeg cyffredin.',
  ch: 'Canllaw syml i ch Gymraeg, a sut mae’n wahanol i ch Saesneg.',
  rh: 'Dysgwch sylwi ar rh fel patrwm sillafu Cymraeg.',
  w: 'Nodyn byr ar w fel llafariad Gymraeg, gydag enghreifftiau fel dŵr, cwm, byw, a bwrdd.',
  y: 'Dysgwch sut gall y swnio mewn geiriau Cymraeg cyffredin.',
  accents: 'Nodyn byr ar acenion Cymraeg, llafariaid hir, a pham mae marciau bach yn gallu newid geiriau.'
};

export function resolvePublicMetadata(input: PublicMetadataInput): PageMetadata {
  const origin = normalizeOrigin(input.origin);
  const pathname = normalizePathname(input.pathname);
  const search = input.search ?? '';
  const language = pathname === '/cy' || pathname.startsWith('/cy/') ? 'cy' : input.interfaceLanguage;
  const homeMetadata = home[language === 'cy' ? 'cy' : 'en'];

  if (input.screen === 'practice') {
    return createMetadata({
      title: 'Welsh spelling practice - Spelio',
      description: 'Hear a Welsh word, recall the spelling, and type your answer in a calm focused session.',
      canonicalUrl: `${origin}/`,
      robots: 'noindex, follow',
      ogUrl: `${origin}/`
    });
  }

  if (input.screen === 'end') {
    return createMetadata({
      title: 'Session complete - Spelio',
      description: 'Review your Spelio session and choose what to practise next.',
      canonicalUrl: `${origin}/`,
      robots: 'noindex, follow',
      ogUrl: `${origin}/`
    });
  }

  if (pathname === '/' || pathname === '/cy') {
    return createMetadata({
      ...homeMetadata,
      canonicalUrl: `${origin}/`,
      robots: pathname === '/cy' ? 'noindex, follow' : 'index, follow',
      ogUrl: `${origin}/`
    });
  }

  const spellingBasics = resolveSpellingBasicsMetadata(pathname, origin, language);
  if (spellingBasics) return spellingBasics;

  const staticPage = staticPages[pathname];
  if (staticPage) {
    const canonicalUrl = `${origin}${pathname}`;
    return createMetadata({
      title: staticPage.title,
      description: staticPage.description,
      canonicalUrl,
      robots: staticPage.robots ?? 'index, follow',
      ogUrl: canonicalUrl
    });
  }

  const sharedList = resolveSharedListMetadata(pathname, search, origin, input.wordLists ?? [], language);
  if (sharedList) return sharedList;

  const customEntryId = getCustomPublicIdFromPath(pathname);
  if (customEntryId) {
    const practiceTest = isPracticeTestShareMode(search);
    const canonicalUrl = `${origin}${pathname}${practiceTest ? '?mode=practice-test' : ''}`;
    return createMetadata({
      title: practiceTest ? 'Custom spelling practice test - Spelio' : 'Custom Welsh spelling list - Spelio',
      description: practiceTest
        ? 'Open a focused practice test for this custom Welsh spelling list.'
        : 'Open a custom Welsh spelling list in Spelio for focused spelling practice.',
      canonicalUrl,
      robots: 'noindex, follow',
      ogUrl: canonicalUrl
    });
  }

  if (getCustomSharePublicIdFromPath(pathname)) {
    const canonicalUrl = `${origin}${pathname}`;
    return createMetadata({
      title: 'Share custom Welsh spelling list - Spelio',
      description: 'Share this custom Welsh spelling list by link or QR code for focused practice in Spelio.',
      canonicalUrl,
      robots: 'noindex, follow',
      ogUrl: canonicalUrl
    });
  }

  const notFoundUrl = `${origin}${pathname}`;
  return createMetadata({
    title: 'Page not found - Spelio',
    description: 'The page could not be found. Return to Spelio to practise Welsh spelling.',
    canonicalUrl: notFoundUrl,
    robots: 'noindex, follow',
    ogUrl: notFoundUrl
  });
}

function resolveSpellingBasicsMetadata(pathname: string, origin: string, language: InterfaceLanguage): PageMetadata | null {
  if (pathname === '/spelling-basics') {
    const canonicalUrl = `${origin}/spelling-basics`;
    return createMetadata({
      title: language === 'cy' ? 'Hanfodion sillafu Cymraeg - Spelio' : 'Welsh spelling basics - Spelio',
      description: language === 'cy'
        ? 'Nodiadau sillafu Cymraeg syml i oedolion, yn cynnwys seiniau, acenion, a phatrymau sy’n helpu ymarfer ffocysedig.'
        : 'Simple Welsh spelling notes for adults, covering sounds, accents, and patterns that help with focused practice.',
      canonicalUrl,
      robots: 'index, follow',
      ogUrl: canonicalUrl
    });
  }

  const slug = getSpellingBasicsTopicSlugFromPath(pathname);
  if (!slug && pathname !== '/spelling-basics/wy') return null;

  const canonicalSlug = pathname === '/spelling-basics/wy' ? 'w' : slug;
  const topic = getSpellingBasicsTopic(canonicalSlug);
  if (!topic || !canonicalSlug) return null;

  const title = getSpellingBasicsTitle(topic, language);
  const description = language === 'cy'
    ? spellingBasicsWelshDescriptions[canonicalSlug] ?? spellingBasicsDescriptions[canonicalSlug]
    : spellingBasicsDescriptions[canonicalSlug];
  const canonicalUrl = `${origin}/spelling-basics/${canonicalSlug}`;

  return createMetadata({
    title,
    description,
    canonicalUrl,
    robots: 'index, follow',
    ogUrl: canonicalUrl
  });
}

function resolveSharedListMetadata(
  pathname: string,
  search: string,
  origin: string,
  lists: WordList[],
  language: InterfaceLanguage
): PageMetadata | null {
  const slug = getSharedWordListSlugFromPath(pathname);
  if (!slug) return null;

  const list = findActiveWordListBySlug(lists, slug);
  const canonicalUrl = list ? `${origin}${getWordListPath(list)}` : `${origin}${pathname}`;
  const practiceTest = isPracticeTestShareMode(search);

  if (!list) {
    return createMetadata({
      title: 'Word list not found - Spelio',
      description: 'This Spelio word list is not available.',
      canonicalUrl,
      robots: 'noindex, follow',
      ogUrl: canonicalUrl
    });
  }

  const displayName = getListDisplayName(list, language);
  const listDescription = getListDisplayDescription(list, language).trim();
  const fallbackDescription = 'Practise this Welsh word list in Spelio. Hear each word, recall it, and type the spelling in a focused session.';
  const title = practiceTest ? `${displayName} practice test - ${SITE_NAME}` : `${displayName} | ${SITE_NAME}`;
  const description = practiceTest
    ? 'Open a focused Welsh spelling practice test for this word list, with audio-first prompts and reduced assistance.'
    : listDescription || fallbackDescription;
  const ogUrl = practiceTest ? `${canonicalUrl}?mode=practice-test` : canonicalUrl;

  return createMetadata({
    title,
    description,
    canonicalUrl,
    robots: 'index, follow',
    ogUrl
  });
}

function getSpellingBasicsTitle(topic: SpellingBasicsTopic, language: InterfaceLanguage) {
  const localizedTitle = topic.overviewTitle[language] ?? topic.overviewTitle.en;
  if (language === 'cy') return `${localizedTitle} - ${SITE_NAME}`;

  if (topic.slug === 'how-spelio-helps') return `How Spelio helps with Welsh spelling`;
  if (topic.slug === 'w') return `Welsh w as a vowel - ${SITE_NAME}`;
  if (topic.slug === 'y') return `Welsh y as a vowel - ${SITE_NAME}`;
  if (topic.symbol && topic.slug !== 'accents') return `Welsh ${topic.symbol} sound and spelling - ${SITE_NAME}`;
  return `${localizedTitle} - ${SITE_NAME}`;
}

function createMetadata(input: {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: PageMetadata['robots'];
  ogUrl: string;
}): PageMetadata {
  return {
    title: input.title,
    description: input.description,
    canonicalUrl: input.canonicalUrl,
    robots: input.robots,
    ogTitle: input.title,
    ogDescription: input.description,
    ogUrl: input.ogUrl,
    twitterTitle: input.title,
    twitterDescription: input.description
  };
}

function normalizeOrigin(origin: string) {
  return (origin || DEFAULT_ORIGIN).replace(/\/+$/, '');
}

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
}
