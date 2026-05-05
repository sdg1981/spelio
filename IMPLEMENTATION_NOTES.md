# Spelio practice-engine update

## Settings dialect preference removal

The Settings modal no longer exposes a dialect preference selector. Practice now uses the mixed dialect behavior by default while keeping word-level dialect metadata, dialect notes, usage notes, and `variantGroupId` handling intact. Old saved `dialectPreference` values are ignored during storage normalization so existing users continue with mixed practice.

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

## Word-list selection state verification

Manual verification for the word-list selection/session-state fix:

- From the homepage, open Word Lists, change the selection, press Done, and confirm the app remains on the homepage, persists `selectedListIds`, updates `currentPathPosition`, and does not start practice.
- From an active practice session, open Word Lists, change the selection, press Done, and confirm the app returns to the homepage, discards the active session, persists the selected list, and does not start a new session.
- Select a list already marked completed and confirm the homepage still recommends that manually selected list until another session is explicitly started and completed.
- Select `First Verbs — Core Actions` and confirm the homepage does not immediately show `First Phrases — Using Verbs` solely because it is `nextListId`.
- Change checkboxes in the modal, close with X, reopen it, and confirm the unsaved changes were discarded.
- Save a selection, refresh the page, and confirm the persisted selected list is still shown/recommended.
- Confirm `Review difficult words` only overrides the homepage recommendation when difficult words currently exist.

## Quiet animation polish

The UI now includes a restrained animation layer intended to make Spelio feel responsive without becoming gamified or distracting.

- Homepage logo uses an inline SVG so the red cursor mark can blink softly on first render, then stop. Practice uses the existing small logo without cursor animation.
- Main screen changes use a short fade with slight vertical movement.
- Homepage primary actions, practice audio pill, utility/action rows, modals, progress bar, status messages, letter slots, completed words, and end-screen stats all use small, quick CSS transitions/keyframes.
- Correct typed letters pop subtly; revealed letters fade/slide in; incorrect letters keep a short low-amplitude shake.
- Word completion uses a brief left-to-right highlight wave across the completed word.
- Reveal completion delay is kept short enough for the completion wave to read while preserving reveal scoring and difficult-word logic.
- `prefers-reduced-motion: reduce` disables decorative animation and reduces transitions globally.
- Hidden mobile input focus is preserved after tapping the audio pill and pressing Reveal; desktop keyboard handling is unchanged.
