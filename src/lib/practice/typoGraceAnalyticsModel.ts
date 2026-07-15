import type { WordList } from '../../data/wordLists';
import { isWelshFoundationsJourneyList } from './learningJourneySelection';
import type { MobileTypoGraceEvent } from './mobileTypoGrace';

export type TypoGracePlatform = 'ios' | 'android' | 'other_mobile';
export type TypoGracePracticeContext = 'foundations' | 'practice_library' | 'other';

export type TypoGraceAggregateRow = {
  eventName: MobileTypoGraceEvent;
  platform: TypoGracePlatform;
  practiceContext: TypoGracePracticeContext;
  strictMode: boolean;
  count: number;
};

export type TypoGraceAggregateSummary = {
  triggered: number;
  corrected: number;
  committedWrong: number;
  correctionRate: number;
  byPlatform: Record<TypoGracePlatform, { triggered: number; corrected: number; committedWrong: number }>;
};

export function detectTypoGracePlatform(userAgent: string): TypoGracePlatform {
  if (/android/i.test(userAgent)) return 'android';
  if (/iPad|iPhone|iPod/i.test(userAgent)) return 'ios';
  return 'other_mobile';
}

export function getTypoGracePracticeContext(list: WordList | undefined): TypoGracePracticeContext {
  if (!list) return 'other';
  if (isWelshFoundationsJourneyList(list)) return 'foundations';
  if (list.collection?.type === 'spelio_core' || list.collectionId === 'spelio_core_welsh') return 'practice_library';
  return 'other';
}

export function summarizeTypoGraceAggregates(rows: readonly TypoGraceAggregateRow[]): TypoGraceAggregateSummary {
  const byPlatform: TypoGraceAggregateSummary['byPlatform'] = {
    ios: { triggered: 0, corrected: 0, committedWrong: 0 },
    android: { triggered: 0, corrected: 0, committedWrong: 0 },
    other_mobile: { triggered: 0, corrected: 0, committedWrong: 0 }
  };
  let triggered = 0;
  let corrected = 0;
  let committedWrong = 0;

  for (const row of rows) {
    const count = Number.isFinite(row.count) ? Math.max(0, Math.trunc(row.count)) : 0;
    if (row.eventName === 'mobile_adjacent_typo_grace_triggered') {
      triggered += count;
      byPlatform[row.platform].triggered += count;
    } else if (row.eventName === 'mobile_adjacent_typo_corrected') {
      corrected += count;
      byPlatform[row.platform].corrected += count;
    } else if (row.eventName === 'mobile_adjacent_typo_committed_wrong') {
      committedWrong += count;
      byPlatform[row.platform].committedWrong += count;
    }
  }

  return { triggered, corrected, committedWrong, correctionRate: triggered > 0 ? Math.round((corrected / triggered) * 100) : 0, byPlatform };
}
