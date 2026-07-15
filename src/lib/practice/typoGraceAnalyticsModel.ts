import type { WordList } from '../../data/wordLists';
import { isWelshFoundationsJourneyList } from './learningJourneySelection';
import type { StoredMobileTypoGraceEvent } from './mobileTypoGrace';

export type TypoGracePlatform = 'ios' | 'android' | 'other_mobile';
export type TypoGracePracticeContext = 'foundations' | 'practice_library' | 'other';

export type TypoGraceAggregateRow = {
  eventName: StoredMobileTypoGraceEvent;
  platform: TypoGracePlatform;
  practiceContext: TypoGracePracticeContext;
  strictMode: boolean;
  count: number;
};

export type TypoGraceAggregateSummary = {
  detected: number;
  correctedBackspace: number;
  correctedDirect: number;
  corrected: number;
  committedWrong: number;
  correctionRate: number;
  byPlatform: Record<TypoGracePlatform, { detected: number; corrected: number; committedWrong: number }>;
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
    ios: { detected: 0, corrected: 0, committedWrong: 0 },
    android: { detected: 0, corrected: 0, committedWrong: 0 },
    other_mobile: { detected: 0, corrected: 0, committedWrong: 0 }
  };
  let detected = 0;
  let correctedBackspace = 0;
  let correctedDirect = 0;
  let committedWrong = 0;

  for (const row of rows) {
    const count = Number.isFinite(row.count) ? Math.max(0, Math.trunc(row.count)) : 0;
    if (row.eventName === 'mobile_adjacent_typo_detected' || row.eventName === 'mobile_adjacent_typo_grace_triggered') {
      detected += count;
      byPlatform[row.platform].detected += count;
    } else if (row.eventName === 'mobile_adjacent_typo_corrected_backspace' || row.eventName === 'mobile_adjacent_typo_corrected') {
      correctedBackspace += count;
      byPlatform[row.platform].corrected += count;
    } else if (row.eventName === 'mobile_adjacent_typo_corrected_direct') {
      correctedDirect += count;
      byPlatform[row.platform].corrected += count;
    } else if (row.eventName === 'mobile_adjacent_typo_committed_wrong') {
      committedWrong += count;
      byPlatform[row.platform].committedWrong += count;
    }
  }

  const corrected = correctedBackspace + correctedDirect;
  return {
    detected,
    correctedBackspace,
    correctedDirect,
    corrected,
    committedWrong,
    correctionRate: detected > 0 ? Math.round((corrected / detected) * 100) : 0,
    byPlatform
  };
}
