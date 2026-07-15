import { supabase } from '../supabaseClient';
import type { MobileTypoGraceEvent } from './mobileTypoGrace';
import type { TypoGracePlatform, TypoGracePracticeContext } from './typoGraceAnalyticsModel';

export async function recordMobileTypoGraceEvent({
  eventName,
  platform,
  practiceContext,
  strictMode
}: {
  eventName: MobileTypoGraceEvent;
  platform: TypoGracePlatform;
  practiceContext: TypoGracePracticeContext;
  strictMode: boolean;
}) {
  try {
    if (!supabase) return;
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return;

    // Admin-authenticated browser sessions are excluded from aggregate learning signals.
    const { data } = await supabase.auth.getSession();
    if (data.session) return;

    const { error } = await supabase.rpc('increment_mobile_typo_grace_counter', {
      p_event_name: eventName,
      p_platform: platform,
      p_practice_context: practiceContext,
      p_strict_mode: strictMode
    });
    if (error) console.warn('Unable to record aggregate mobile typo-grace outcome.');
  } catch {
    // Aggregate measurement is non-critical and must never interrupt practice.
    console.warn('Unable to record aggregate mobile typo-grace outcome.');
  }
}
