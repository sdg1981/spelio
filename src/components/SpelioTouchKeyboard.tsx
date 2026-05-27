import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Translate } from '../i18n';
import {
  TOUCH_KEYBOARD_ROWS,
  WELSH_ACCENT_VARIANTS,
  answerNeedsWelshAccent,
  hasSeenTouchKeyboardAccentHint,
  markTouchKeyboardAccentHintSeen
} from '../lib/practice/touchKeyboard';

const LONG_PRESS_DELAY_MS = 430;
const HINT_VISIBLE_MS = 2400;

type AccentChooser = {
  keyLabel: string;
  variants: readonly string[];
};

export function SpelioTouchKeyboard({
  answer,
  disabled = false,
  onInput,
  onUseNativeKeyboard,
  t
}: {
  answer: string;
  disabled?: boolean;
  onInput: (input: string) => void;
  onUseNativeKeyboard: () => void;
  t: Translate;
}) {
  const [accentChooser, setAccentChooser] = useState<AccentChooser | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const suppressNextClickRef = useRef(false);

  function clearLongPressTimer() {
    if (!longPressTimerRef.current) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }

  function showAccentHintOnce() {
    if (hasSeenTouchKeyboardAccentHint(typeof window === 'undefined' ? null : window.localStorage)) return;
    markTouchKeyboardAccentHintSeen(typeof window === 'undefined' ? null : window.localStorage);
    setHintVisible(true);
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => {
      setHintVisible(false);
      hintTimerRef.current = null;
    }, HINT_VISIBLE_MS);
  }

  useEffect(() => {
    if (!answerNeedsWelshAccent(answer)) return;
    const timer = window.setTimeout(showAccentHintOnce, 700);
    return () => window.clearTimeout(timer);
  }, [answer]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    };
  }, []);

  function openAccentChooser(keyLabel: string, variants: readonly string[] = Object.values(WELSH_ACCENT_VARIANTS).flat()) {
    showAccentHintOnce();
    setAccentChooser({ keyLabel, variants });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>, keyLabel: string) {
    const variants = WELSH_ACCENT_VARIANTS[keyLabel];
    if (!variants || disabled) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      suppressNextClickRef.current = true;
      openAccentChooser(keyLabel, variants);
    }, LONG_PRESS_DELAY_MS);
  }

  function handlePointerEnd() {
    clearLongPressTimer();
  }

  function handleKeyClick(keyLabel: string) {
    if (disabled) return;

    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    if (keyLabel === '^') {
      openAccentChooser(keyLabel);
      return;
    }

    setAccentChooser(null);
    onInput(keyLabel);
  }

  function getKeyClassName(keyLabel: string) {
    if (keyLabel === '^' || keyLabel === '’') return 'spelio-touch-key special';
    if (keyLabel.length > 1) return 'spelio-touch-key digraph';
    return 'spelio-touch-key';
  }

  function getKeyAriaLabel(keyLabel: string) {
    if (keyLabel === '^') return t('practice.touchKeyboardAccentKey');
    if (keyLabel === '’') return t('practice.touchKeyboardApostropheKey');
    return `${t('practice.touchKeyboardTypeKey')} ${keyLabel}`;
  }

  return (
    <div className="spelio-touch-keyboard-shell" aria-label={t('practice.touchKeyboardLabel')}>
      <div className={`spelio-touch-keyboard-hint ${hintVisible ? 'visible' : ''}`} aria-live="polite">
        {hintVisible ? t('practice.touchKeyboardAccentHint') : ''}
      </div>

      {accentChooser && (
        <div className="spelio-accent-chooser" role="dialog" aria-label={t('practice.touchKeyboardAccentChoices')}>
          {accentChooser.variants.map(variant => (
            <button
              key={`${accentChooser.keyLabel}-${variant}`}
              type="button"
              className="spelio-accent-choice"
              onClick={() => {
                setAccentChooser(null);
                onInput(variant);
              }}
              aria-label={`${t('practice.touchKeyboardTypeKey')} ${variant}`}
            >
              {variant}
            </button>
          ))}
        </div>
      )}

      <div className="spelio-touch-keyboard" role="group" aria-label={t('practice.touchKeyboardLabel')}>
        {TOUCH_KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={`touch-keyboard-row-${rowIndex}`} className={`spelio-touch-key-row row-${rowIndex + 1}`}>
            {row.map(keyLabel => (
              <button
                key={keyLabel}
                type="button"
                className={getKeyClassName(keyLabel)}
                disabled={disabled}
                onPointerDown={event => handlePointerDown(event, keyLabel)}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onPointerLeave={handlePointerEnd}
                onClick={() => handleKeyClick(keyLabel)}
                aria-label={getKeyAriaLabel(keyLabel)}
              >
                {keyLabel}
              </button>
            ))}
          </div>
        ))}
      </div>

      <button type="button" className="spelio-native-keyboard-fallback" onClick={onUseNativeKeyboard}>
        {t('practice.useNativeKeyboard')}
      </button>
    </div>
  );
}
