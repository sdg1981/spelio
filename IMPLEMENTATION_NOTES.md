# Spelio practice-engine update

This build fixes the end-screen stats so:

- `Incorrect` counts unique words where the user made at least one mistake, not every incorrect keypress.
- `Revealed` counts unique words where reveal was used, not every revealed letter.
- Repeated mistakes on the same word still mark the word as difficult, but only count once in the end-screen total.
- Repeated reveals on the same word still reveal letters, but only count once in the end-screen total.

The red wrong-letter state remains tied to the active letter slot so later mistakes should also show red correctly.

## Practice answer comparison normalisation

Practice validation now applies a comparison-only normalisation step before checking typed input against the stored answer or `acceptedAlternatives`.

- Apostrophe variants (`'`, `’`, `‘`, `` ` ``, `´`, `ʻ`) compare as `'`.
- Dash and hyphen variants (`-`, `–`, `—`, `‑`) compare as `-`.
- Comparison is case-insensitive.
- Leading/trailing whitespace is trimmed and repeated whitespace collapses to a single space for full-answer comparison helpers.
- Normalisation is not applied to stored answers, accepted alternative data, letter-slot rendering, or displayed correct answers.
- Strict Welsh spelling mode still requires correct diacritics; flexible mode keeps using the existing Welsh diacritic tolerance map.
- Per-character validation uses the same apostrophe/dash/case normalisation, so visually equivalent punctuation is accepted while incorrect or missing letters still fail.

## Practice space input and active-letter UI

Spaces in Welsh answers are now treated as structural layout only.

- Stored spaces still separate words visually, but they do not render as input slots.
- When the next stored answer character is a space, input advances internally to the next real letter.
- User-typed spaces are ignored silently and do not trigger validation, red error state, status messages, sound effects, incorrect attempt counts, difficult-word tracking, or cursor movement.
- Multi-word answers work whether the user types the word boundary space or continues with the next letter.
- During active practice, desktop spacebar input follows the same silent ignore path; audio replay remains available from the prompt button.
- The active letter slot now uses a slightly thicker calm underline with a low-intensity fade animation, and `prefers-reduced-motion` disables the animation while keeping the thicker underline.
