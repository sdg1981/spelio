import { getCustomPublicIdFromPath, getCustomSharePublicIdFromPath } from './customListRoutes';
import { getSpellingBasicsTopicSlugFromPath } from '../content/spellingBasics';

export type PublicScreen = 'home' | 'collection-intro' | 'primer' | 'practice' | 'end' | 'how' | 'feedback' | 'privacy' | 'about' | 'install' | 'word-lists' | 'custom-new' | 'custom-share' | 'custom-entry' | 'spelling-basics' | 'spelling-basics-topic';

export function isStandalonePublicPagePath(pathname: string) {
  return ['/how-spelio-works', '/feedback', '/privacy', '/about', '/install', '/word-lists', '/spelling-basics', '/custom-list/new'].includes(pathname) ||
    Boolean(getSpellingBasicsTopicSlugFromPath(pathname)) ||
    Boolean(getCustomSharePublicIdFromPath(pathname) || getCustomPublicIdFromPath(pathname));
}

export function shouldPreserveInterfaceLanguageScreen(screen: PublicScreen, hasPendingPrimerLaunch: boolean, pathname: string) {
  return isStandalonePublicPagePath(pathname) || ((screen === 'primer' || screen === 'collection-intro') && hasPendingPrimerLaunch);
}

export function shouldResetPracticeLaunchContextOnInterfaceLanguageChange(screen: PublicScreen, hasPendingPrimerLaunch: boolean) {
  return !((screen === 'primer' || screen === 'collection-intro') && hasPendingPrimerLaunch);
}
