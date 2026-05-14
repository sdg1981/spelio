# Spelio MVP Product Specification v1.1 Gold

## 1. Product summary

Spelio is a focused Welsh spelling practice app for adult learners.

The MVP should be a browser-based, mobile-first web app that helps users practise spelling Welsh words through short, clean, high-feedback sessions. The product should feel calm, premium, adult, and practical. It should avoid childish gamification, dashboards, clutter, or Duolingo-style noise.

The core product loop is:

1. User lands on the homepage.
2. User starts a spelling practice session.
3. User hears or sees an English prompt.
4. User types the Welsh answer letter by letter.
5. App validates each character immediately.
6. User completes a short session.
7. App shows a clean end screen with score and a recommended next step.
8. App uses local progress to recommend what to practise next.

The MVP should prove that the core practice loop is satisfying, clear, useful, and repeatable.

## 2. Product positioning

Spelio should be positioned as:

A serious, simple Welsh spelling practice tool for adult learners who want to improve recall, accuracy, and confidence.

It is not a full Welsh course. It is not a Duolingo clone. It is a practice layer that could eventually support learners using any course.

The first market is Welsh learners, especially adults who can say words or recognise them but struggle to spell them correctly.

Long-term, the same engine could support other languages, English spelling, teacher lists, custom lists, or institutional integrations.

## 3. MVP principles

The MVP must follow these principles:

- Mobile-first
- Browser-based
- No account required
- Start instantly
- Short sessions
- Minimal interface
- Adult tone
- Strong feedback
- No unnecessary gamification
- No dashboards at launch
- No custom user accounts at launch
- No complex AI recommendation system at launch
- No native app build at launch
- Lightweight word-list sharing is included, but accounts, dashboards, teacher systems, reporting, and advanced assessment controls remain excluded

The product should feel like a premium SaaS-style tool: calm, restrained, responsive, and well designed.

### 3.0.1 Visual tone clarification: what "calm" means

In Spelio, "calm" is an interaction and cognitive-load principle, not a nature-inspired visual theme.

Calm means:

- low distraction
- clear hierarchy
- restrained animation
- minimal cognitive overload
- fast understanding
- low-friction interaction
- controlled feedback
- mature, adult-facing presentation
- visually quiet support for focused spelling practice

Calm does not mean:

- countryside-themed branding
- nature imagery as a dominant visual language
- wellness-app aesthetics
- meditation-app styling
- rustic, folk, or heritage tourism visuals
- excessive green palettes
- soft decorative serenity
- slow or sleepy interaction design

Spelio should feel like modern premium learning software: focused, precise, tactile, responsive, intelligent, and well crafted.

The visual direction should communicate clarity, confidence, and quality rather than pastoral calmness or decorative Welsh countryside identity.

Avoid using "calm" as a reason to add landscapes, leaves, mountains, organic motifs, wellness-style copy, or overly soft green visual treatments unless they are explicitly requested for a specific future marketing asset.

### 3.1 No auto-start rule

The app must never automatically start a practice session as a side-effect of another action.

Only explicit user actions should trigger a practice session:

- Start spelling practice
- Review difficult words

Examples of actions that must not automatically start practice:

- Changing word lists
- Pressing Done in the word list modal
- Closing a modal
- Returning from the end screen
- Saving settings
- Opening a shared `/list/{slug}` URL
- Opening a shared `/list/{slug}?mode=practice-test` URL

This rule is global and applies across homepage, practice screen, end screen, and modals.

Shared list links may preselect or preload a word list. They must not start practice automatically. The learner must explicitly press Start / Continue practice.

Shared list links and Practice test links are temporary detached session contexts. They must not permanently move the learner’s main Continue learning path unless the learner explicitly saves that list through the normal Word Lists modal flow.

## 4. Core screens

The MVP contains these core screens and states:

- First-time homepage
- Returning-user homepage
- Returning-user struggled homepage
- Practice screen
- Settings modal
- Word list modal
- End-of-session screen
- Admin panel

The public user experience should remain extremely simple. The admin panel is private and functional rather than highly polished.

Public learner screens use a warm neutral app background, currently `#f6f5f2`, while white pills, cards, modals, and button surfaces remain white. This public background must not affect the admin panel.

### 4.x Public theme architecture

The public learner app may support light and dark appearance through a scoped public wrapper such as `.public-app[data-theme="light|dark"]`.

Public theme styling should use semantic CSS tokens / custom properties where practical, for example background, surface, text, border, accent, success, and error tokens. Admin styling must remain separate and must not inherit public learner theme rules.

`data-theme` should be treated as the light/dark appearance axis only. If Spelio later supports age/audience presentation variants such as calm, warm, schools, or dyslexia-support, that should be a separate presentation axis such as `data-presentation`, not mixed into the light/dark setting.

Future presentation variants should adapt emotional tone through tokens, accents, spacing, illustration, and small visual details without changing practice logic, scoring, content selection, session generation, or recommendation behaviour.

Do not add warm, schools, or dyslexia-support presentation modes to MVP. Avoid one-off hardcoded public colour overrides where semantic tokens can be used safely.

The homepage footer should include:

- Made with love for Wales. © CURRENT_YEAR Spelio

Practice and end screen footers should be simplified to:

- © CURRENT_YEAR Spelio

The homepage should include a small, low-contrast interface language switcher in the top-right utility area, for example:

- English · Cymraeg

The footer language switcher is not shown on public learner screens. Interface language remains available from the homepage top-right switcher and from Settings. It must not appear in the admin panel.

The app should use the Spelio SVG favicon.

### 4.1 Public interface language

The public learner app supports a lightweight interface language setting:

- English
- Cymraeg

This applies to public learner interface copy only:

- homepage
- practice screen
- settings modal
- word list modal
- end screen
- footer
- status messages, buttons, and headings

The admin panel remains English-only for MVP.

`interfaceLanguage` is separate from:

- `dialectPreference` / Welsh style
- English prompt visibility
- `sourceLanguage` / `targetLanguage` content metadata

Changing the interface language must not alter:

- selected word list
- active session word pool
- dialect variant selection
- prompt/answer data
- scoring or progress

### 4.2 File-based UI translations

MVP interface translations are file-based, not database-backed and not admin-editable.

Conceptual structure:

```text
src/i18n/en.ts
src/i18n/cy.ts
src/i18n/index.ts
```

The translation helper should fall back safely to English when a key is missing.

Do not add database-backed UI translations for MVP.

The app uses one shared design and styling system. Do not introduce separate language-specific CSS files, stylesheets, themes, or layout variants.

Layouts should be resilient to Welsh labels being longer than English:

- avoid hardcoded English-width assumptions
- allow wrapping or responsive sizing where needed
- keep controls calm and visually consistent across interface languages

## 5. Homepage design

**UX intent:** The homepage must feel effortless and calm. Avoid clutter, avoid secondary explanations, and prioritise a single clear action. Every element should justify its presence.

### 5.1 First-time homepage

Purpose: get a new user started instantly.

Content:

- Spelio logo
- Large central play button
- Short explanation:
  - “Type what you hear.”
  - “Learn Welsh spelling.”
- Primary CTA:
  - “Start spelling practice →”
- Secondary link:
  - “Select word list →”
- Faint copyright text:
  - “© CURRENT_YEAR Spelio”

Behaviour:

- Clicking the play button or primary CTA starts practice using the default selected word list.
- “Select word list” opens the word list modal.
- No account prompt.
- No dashboard.
- A small settings cog may appear in the top-right utility cluster beside the language switcher.

### 5.2 Returning-user homepage

Purpose: let the user continue intelligently.

Content:

- Spelio logo
- Large central play button
- Recommendation heading:
  - “Continue learning”
- Recommended list:
  - Example: “SSiW Lesson 02 — North Wales”
- Primary CTA:
  - “Start spelling practice →”
- Secondary action:
  - “From earlier →” if eligible resolved `recapDue` words currently exist
- Tertiary action:
  - “Select word list →”
- Faint copyright text

Behaviour:

- Main CTA starts the recommended list/session.
- Continue learning bypasses visible Review difficult words and From earlier; normal sessions may still receive automatic recap injection if eligible.
- A low-priority From earlier link appears near the bottom only when eligible resolved `recapDue` words currently exist.
- From earlier is an optional user-initiated recap of resolved or previously weak words that have been fixed enough to leave visible difficult review but are still worth reinforcing. It starts a recap session from eligible `recapDue` words, not from the current Review difficult words pool.
- From earlier should feel low-pressure and must not be framed as a backlog or blocker.
- If showing a From earlier count: hide it at 0, show exact counts for 1–5, and show “5+” above that. Never show large counts, percentages, progress bars, or “remaining” language.
- Select word list opens the word list modal.
- Returning-user homepage may show one subtle cumulative progress line below the primary CTA and above secondary actions, for example “142 spellings learned · 38 minutes practised”. Hide it when there is no meaningful progress.
- Progress wording must stay calm and minimal. Do not show charts, percentages, XP, badges, streaks, levels, goals, or dashboard-style stats.

### 5.3 Returning-user struggled homepage

Purpose: adapt to a user who struggled in the last session.

Content:

- Spelio logo
- Large central play button
- Recommendation heading:
  - “Focus on tricky words”
- Supporting text:
  - “Based on your last session”
- Primary CTA:
  - “Review difficult words →” if eligible difficult words currently exist
- Secondary action:
  - “Continue learning →”
- Tertiary action:
  - “Select word list →”
- Faint copyright text

Behaviour:

- If the last session is classified as “struggled” and difficult words exist, review becomes the primary action.
- If the last session is classified as “struggled” but no eligible difficult words currently exist, do not show a review action. Fall back to the appropriate continue-learning recommendation.
- Review difficult words and From earlier are different pools and actions: Review difficult words fixes current unresolved difficulty; From earlier revisits previously weak words through `recapDue`.
- Review difficult words must never fall back to ordinary words when empty.
- The user can still continue learning or choose another word list.
- Select word list opens the word list modal and must not auto-start a practice session after Done is pressed.

## 6. Practice screen design

**UX intent:** This is the core experience. It must feel focused, quiet, and satisfying. Avoid instructional text, avoid noise, and prioritise immediate feedback and flow.

The practice screen is the core product experience.

### 6.1 Layout

Desktop and mobile should follow the same mental model:

- Thin progress bar at top
- Optional small progress count, e.g. “3 / 10”
- Back-to-home arrow top-left
- Compact Spelio S mark top-right
- Word/audio pill
- Letter input row
- Temporary feedback/status line
- Bottom utility strip
- Standalone settings cog below the bottom utility strip
- Faint copyright footer

The practice screen S mark must stay compact and must never push the answer area below the visible viewport. The back arrow and S mark both return explicitly to the homepage.

### 6.2 Word/audio pill

The word pill should contain:

- Speaker icon
- English prompt text, if English is enabled

Example:

🔊 To work

Behaviour:

- The entire pill is clickable/tappable.
- Clicking/tapping replays the current word audio.
- The pill should be subtle, compact, and not over-designed.
- Do not show persistent text such as “Tap to hear” if it makes the design feel too instructional.
- If subtitles are off, the pill may show only the speaker icon, but still remains tappable.
- If audio is unavailable, tapping the pill should show a subtle temporary status message: “Audio unavailable”.

Recall pause:

- Optional learning mode controlled from Settings.
- When Recall pause is off, existing word/audio pill behaviour is unchanged.
- When Recall pause is on, and audio prompts are on, English prompts are on, and audio is available:
  - Welsh audio plays immediately.
  - The English prompt/subtitle is hidden from the first render of the word.
  - The English prompt appears only after a short recall pause.
  - The English prompt fades in smoothly unless reduced motion is preferred.
  - The speaker/audio affordance remains visible immediately.
  - The prompt area should reserve space to avoid layout shift.
- If audio is unavailable, audio prompts are off, or English prompts are off:
  - Fall back to normal existing behaviour with no artificial delay.
- Recall pause must not delay typing/input availability.
- Recall pause must not delay audio.
- Recall pause must not affect scoring, review, recap, difficult-word handling, recommendations, hints, usage notes, dialect notes, reveal, completion, or word selection.
- Delay timing is adaptive but internal and not user-configurable:
  - Minimum delay: about 1.5 seconds.
  - Slightly longer for longer prompts/answers.
  - Suggested implementation: base 1500ms, add around 150ms per prompt word after the first, add around 40ms per answer character after 8 characters, cap around 2400ms.
  - Do not add a user-facing slider, advanced timing controls, or separate delay-audio setting.
- English must not flash briefly before being hidden. The delayed English visibility state should be initialised so hidden text is not visible on first render when Recall pause applies.
- Pending delayed-English timers must be cleared when moving word, leaving practice, opening relevant modals, or unmounting. Stale timers must not reveal English for a previous word on the next word.

### 6.3 Letter input

The answer appears as individual letter slots.

Rules:

- Correct letters lock in.
- Incorrect letters show a brief restrained red mark on the active slot, then clear.
- The active typing position is obvious but not visually harsh.
- All completed letters return to black.
- The layout must wrap cleanly for longer words or phrases.
- No horizontal scrolling.
- Preserve clear visual spaces between words in multi-word phrases.
- Spaces are not rendered as input slots.
- User-typed spaces are ignored silently and should not count as errors.

Answer layout rules:

- Words must never split across lines.
- Each word should be treated as a single unit for wrapping.
- Multi-word phrases must preserve clear spacing between words.
- For long answers, reduce letter spacing first, then reduce letter size.
- Never allow horizontal scrolling.
- The answer layout must remain usable on small mobile screens.

### 6.4 Bottom utility strip

Bottom controls:

- English toggle: `MessageSquareQuote` icon only when English is off; `MessageSquareQuote` + “English” when English is on
- Reveal: eye icon + “REVEAL” label

No separate replay audio icon. Audio replay is handled by the word pill.

The word list button is not present on the practice screen bottom utility strip. Word list selection remains available from the homepage and end screen.

The English toggle must preserve mobile keyboard focus.

No audio prompts toggle in the practice screen. Audio prompt preference belongs in settings.

Reveal supports two interactions:

- Tap/click: reveal the next missing letter.
- Press and hold: briefly peek at the full answer, mark the word as revealed/difficult, then return to memory practice.

Bottom strip should be subtle:

- Small icons
- Minimal labels
- Low visual weight
- Light separators
- No heavy card feeling

The practice screen footer should remain very faint and should show only the copyright line. It should not include homepage footer links, “Made with love for Wales”, or a footer language switcher.

### 6.5 Status messages

**UX intent:** Feedback should feel supportive, not intrusive. Messages should be brief, subtle, and never stack or overwhelm the user.

Status area should be temporary only.

Examples:

- “English on”
- “English off”
- “Audio unavailable”

Messages should fade after approximately 1.2–1.8 seconds.

Persistent hints should be avoided.

The temporary status message area must not be used for dialect notes or usage notes.

### 6.6 Learner-facing notes

usageNote and dialectNote must not appear before or during active spelling.

Rules:

- They must not appear in the temporary status message area.
- If displayed in MVP, show them only after the word is completed, revealed, or on a post-answer/end-of-session review surface.
- Notes should be visually quiet and optional.
- If both usageNote and dialectNote exist, show usageNote first and dialectNote second.
- Do not show empty note containers.
- Do not let notes interrupt typing flow.
- If note display feels too cluttered, it is acceptable for MVP to store/manage notes in admin first and delay learner display.

Language rule:

- `usageNote` and free-text `dialectNote` are authored learner content, not interface copy.
- Do not automatically translate `usageNote` or free-text `dialectNote`.
- In the English interface, `usageNote` may display where note display is already supported.
- In the English interface, free-text `dialectNote` may display where note display is already supported.
- In the Welsh interface, hide `usageNote`.
- In the Welsh interface, hide free-text `dialectNote`.
- In the Welsh interface, show only a small generated dialect label derived from structured dialect metadata where appropriate.

## 7. Settings modal

Settings should be minimal.

Fields:

- Interface language
  - English
  - Cymraeg
- Welsh spelling
  - Flexible
  - Strict
- Welsh style
  - Mixed Welsh
  - North Wales
  - South Wales / Standard
- Audio prompts
  - On/off
- Learning mode / Recall pause
  - On/off
  - Suggested label: “Recall pause”
  - Suggested helper text: “Hear the Welsh first, then show English after a moment.”
  - Optional and not enabled by default
  - Do not add sliders, timing controls, separate delay-audio settings, or multiple recall modes
- Sound effects
  - On/off
- Reset progress
  - Requires confirmation
  - Clears progress, settings, and history on the current device
  - Returns the user to the homepage
  - Shows a short confirmation toast

Defaults:

- Interface language: English
- Welsh spelling: Flexible
- Welsh style: Mixed Welsh
- Audio prompts: On
- Recall pause: Off
- Sound effects: On

Welsh style is stored as `dialectPreference` and affects word-level variant selection only. It must not affect word-list visibility.

Interface language is stored as `interfaceLanguage` and affects learner-facing interface copy only. It is not the Welsh style setting, not the English prompt visibility setting, and not content language-pair metadata.

Changing interface language from Settings should update public interface copy immediately where practical, without changing the selected word list, active session word pool, dialect variant selection, prompt/answer data, scoring, or progress.

Interface language can be changed from:

- the existing public Settings modal accessed from the homepage utility cog or practice-screen settings cog
- the small public homepage top-right language switcher

The homepage language switcher should be low contrast and should not become a prominent onboarding step.

### 7.1 Welsh spelling modes

Flexible:

- User can type unaccented letters.
- App accepts equivalent accented Welsh characters.
- App still displays the correct Welsh spelling.
- Apostrophe and dash variants are accepted as equivalent.
- Comparison is case-insensitive.

Strict:

- Accents and diacritics must be typed correctly.
- Wrong accent counts as incorrect.
- Apostrophe and dash variants are still accepted as equivalent.
- Comparison is case-insensitive.

## 8. Word list modal

**UX intent:** The modal is a lightweight configuration layer. It should never feel like a separate workflow. Selection is simple, reversible, and never forces action.

**Critical rule:** Modal actions must never trigger unintended session starts. This separation is essential to prevent navigation-related bugs.

The word list modal should be scalable.

### 8.1 Structure

Modal title:

- “Word Lists”

Search field:

- “Search word lists…”

Body:

- Grouped, scrollable list body
- Full-row clickable/tappable word-list rows
- A subtle selected state on the currently selected row, such as stronger text weight, soft tint, left accent, or a small checkmark on the right
- No checkbox styling in the public MVP modal

Footer:

- Sticky footer with action button, such as “Done” or “Use this list”

### 8.2 Grouping examples

Groups might include:

- Foundations
- Core Welsh
- Nature
- Opposites
- Course Collections
- Personal

Example lists:

- Common Verbs — North Wales
- Common Verbs — South Wales
- Everyday Words — Both
- Opposites — Both
- Animals — Both
- Birds — Both
- Weather — Both
- Food & Drink — Both
- SSiW Lesson 01 — North Wales
- SSiW Lesson 02 — North Wales

### 8.2.1 Collections

Spelio supports a lightweight Collection layer above individual word lists:

```text
Collection
  → Word lists
    → Words
```

Terminology:

- “Collection” = higher-level grouping of word lists
- “Word list” = individual selectable practice list

Avoid “Pack” in backend, data, and admin naming.

Collections are an organisational/content-grouping layer intended to support future:

- Spelio core content
- Curriculum collections
- Course-aligned collections
- School-created collections
- Teacher-created collections
- Personal/user collections

Collections do not change practice behaviour in MVP.

The public word-list modal should be collection-aware.

Recommended hierarchy when multiple collections exist:

```text
Collection
  Stage/group
    Word lists
```

Example:

```text
Spelio Core Welsh
  Foundations
    First Words — Immediate Welsh
```

If only one collection exists, the UI may still appear similar to the current grouped MVP layout. The architecture should still be ready for multiple collections later.

This must remain lightweight and calm. Do not turn the word-list modal into a dashboard, course browser, permissions view, or reporting surface.

### 8.3 Dialect handling

Dialect should be explicit at word/item level, not only list level.

Reason:

- Many Welsh word lists are mostly shared across Wales but contain a few dialect-sensitive items.
- Duplicating whole lists for one or two dialect items creates unnecessary clutter.
- Some dialect variants have different lengths, which affects the letter-slot UI.

Each word should have:

- dialect: Both / North Wales / South Wales / Standard / Other
- dialectNote: optional short explanation
- variantGroupId: optional shared ID linking variants of the same prompt

Dialect labels shown in the public learner UI should be generated from structured dialect metadata and translation keys, not from free-text `dialectNote`.

Generated dialect label examples:

- North Wales
  - English: North Wales form
  - Welsh: Ffurf Gogledd Cymru
- South Wales / Standard
  - English: South Wales / Standard form
  - Welsh: Ffurf De Cymru / Safonol
- Standard
  - English: Standard form
  - Welsh: Ffurf safonol
- Both
  - normally show no dialect label

Examples:

- now → nawr — South Wales / Standard — variantGroupId: now
- now → rwan — North Wales — variantGroupId: now

The session engine should resolve dialect variants before rendering the answer slots.

Dialect is handled at word/item level. The Welsh style setting affects variant selection, not word-list visibility. List-level dialect remains internal/admin metadata only and should not appear as public badges beside word lists.

For ordinary practice and completion, a `variantGroupId` represents one conceptual learning item even when it is stored as multiple raw word rows.

Normal sessions choose at most one variant from each `variantGroupId`. North Wales and South Wales / Standard are soft preferences: prefer the matching variant where available, otherwise use a `Both` item where available, otherwise use the best available single variant. Missing preferred variants must not shrink the session. Mixed Welsh should balance available North Wales and South Wales / Standard variants over time across ordinary learner progression, avoiding persistent first-exposure bias while still showing only one variant from each group in a normal session.

Mixed Welsh balancing may use lightweight persistent exposure memory. It should remain deterministic and testable rather than random. If exposure is balanced, a deterministic fallback is acceptable.

Mixed Welsh exposure memory should only count selections where the system had a genuine dialect choice within the same `variantGroupId`: both a North Wales variant and a South Wales / Standard or Standard variant existed for that conceptual learning item. Single-side grouped items, ungrouped dialect-specific items, `Both` items, review sessions, and unavoidable single-dialect content must not skew long-term Mixed Welsh balancing.

Dialect variants must not inflate list length, session length, or public completion requirements. A list should not appear incomplete merely because the learner has not completed an unselected dialect variant.

Different-length dialect variants should not be handled as acceptedAlternatives. Use separate word items linked by variantGroupId instead.

### 8.3.1 Language-pair metadata

Word lists and collections should include future-safe language-pair metadata:

- `sourceLanguage`
- `targetLanguage`

For current Welsh MVP content:

```json
{
  "sourceLanguage": "en",
  "targetLanguage": "cy"
}
```

This is metadata only for MVP.

Do not add multilingual prompt arrays yet.

Do not convert current content into multi-prompt objects.

### 8.3.2 Prompt/answer abstraction

The practice engine should prefer generic internal concepts:

- `prompt`
- `answer`

while preserving compatibility with existing current-content fields:

- `englishPrompt`
- `welshAnswer`

This avoids hardcoding the product permanently to English → Welsh while keeping current dataset and database compatibility.

### 8.4 Single-list selection

The public MVP word list modal allows one active word list at a time.

Rules:

- Tapping a word list selects it.
- Selecting a second list replaces the first pending selection.
- The selected list is saved only when Done / Use this list is pressed.
- Closing with X discards unsaved changes.
- Pressing Done / Use this list must never auto-start practice.
- If no valid active list is selected for any reason, fall back safely to the first active list.

Backward compatibility:

- Existing `selectedListIds` storage may remain as a one-item array.
- Store only one selected list ID, for example `["foundations_first_words"]`.
- Older stored multiple selections should be migrated to the first valid active selected list.

### 8.5 Modal behaviour

The word list modal must separate selection from session start.

Done behaviour:

- If no changes were made, close the modal and leave the user where they were.
- If changes were made:
  - Save the selected list as a one-item `selectedListIds` array.
  - If the selected ID is invalid, fall back to the first available active list.
  - Set currentPathPosition to the selected list.
  - If opened from the homepage, return to the homepage.
  - If opened during practice, end the current session and return to the homepage.
  - If opened from the end screen, return to the homepage.
- Pressing Done must never automatically start a practice session.

Close (X) behaviour:

- Discard any unsaved changes.
- Restore the previous selection.
- Close the modal.
- Do not start or restart a practice session.

Changing word lists is a navigation/setup action, not a session-start action.

### 8.6 Shareable word-list links

The public word list modal supports lightweight sharing for individual word lists.

Rules:

- Sharing is available only for the currently selected word list.
- The share icon appears only on the selected row.
- Do not show share icons on every row.
- Do not add a global share button at the top of the modal.
- Clicking the share icon opens a lightweight share surface for that specific list.
- Clicking the share icon must not accidentally select or deselect the row through event bubbling.
- Share actions must never start practice.
- Opening a shared link creates a temporary detached shared-session context. It may present the shared list, but must not permanently overwrite the learner’s main selected word list or `currentPathPosition`.
- Shared sessions may still update word progress, difficult words, recap eligibility, list completion, and aggregate stats normally.
- Shared sessions must not re-anchor normal Continue learning to the shared list unless the learner explicitly selects/saves that list through the normal Word Lists modal flow.

The share surface should include:

- Word-list name
- QR code
- Human-readable share URL
- Copy link action
- Native Share action where supported by the browser/device
- A small reassurance message explaining that the link opens Spelio and does not require an account

Do not include a custom grid of WhatsApp, X, Facebook, Reddit, email, or other social buttons. Use the native share sheet where available.

The QR code should be clickable/tappable and open a larger QR view suitable for classroom display or a smartboard. This is only a display convenience. It must not affect selection, practice state, scoring, or session generation.

### 8.7 Canonical friendly list URLs

Public word-list sharing uses friendly canonical URLs.

Preferred format:

```text
/list/{word-list-slug}
```

Example:

```text
/list/first-verbs-core-actions
```

Rules:

- Slugs are human-readable, lowercase, hyphenated, and stable.
- Public sharing uses slugs; internal IDs remain unchanged and remain available internally.
- Friendly URLs are for public sharing only.
- Avoid deeply nested collection/stage URLs for MVP.
- Invalid or inactive slugs should be ignored safely or fall back to existing behaviour.
- Opening a valid list URL may preselect/present that word list and temporarily use it as the session path.
- Opening a valid list URL must not permanently overwrite the learner’s normal `selectedListIds` or `currentPathPosition`.
- Opening a valid list URL must not start practice automatically.
- Existing local storage IDs must not be renamed or invalidated by public slugs.

### 8.8 Practice test share option

Practice test is a lightweight shared-link option, not a full assessment system.

The share modal may include one optional checkbox/toggle:

- Label: “Practice test”
- Helper text: “Hides English prompts and reveal tools.”

When enabled, the shared URL becomes:

```text
/list/{slug}?mode=practice-test
```

Rules:

- The QR code, Copy link action, and native Share action all use the currently toggled URL.
- Visiting `/list/{slug}?mode=practice-test` preselects the list but does not auto-start practice.
- Once the learner explicitly starts practice from that link, Practice test applies for that shared-link session.
- Practice test hides English prompts/subtitles and hides or disables reveal tools.
- Audio remains available.
- Practice test is link/session-scoped and must not permanently overwrite learner settings.
- Practice test must not alter scoring, progress, recommendations, difficult words, recap, dialect handling, completion rules, or normal learner progression.
- Leaving or completing a Practice test link should restore normal behaviour and must not save Practice test as a setting.
- Do not add timers, lockdown behaviour, reporting, teacher accounts, score submission, anti-cheating systems, configurable assessment builders, or additional checkboxes for MVP.

## 9. End-of-session screen

**UX intent:** This screen should feel rewarding but restrained. Avoid gamification. Emphasise clarity, closure, and the next useful step.

Purpose: show completion, performance, and the best next action.

### 9.1 Layout

Content:

- Spelio logo
- Circular score indicator:
  - Show correct answers over total words, for example “9/10”
  - Show a proportional circular progress ring around the score
  - Use the shared success green for the progress ring
- Heading:
  - “Session complete”
- Optional subtle cumulative progress line:
  - “Total progress: 142 spellings learned”
  - “Total progress: 142 spellings learned · 38 minutes practised”
- Next word list title / recommendation area, where appropriate
- Primary recommended action
- Secondary action
- Tertiary action
- Back to home

No footer utility icons on the end screen.

### 9.2 Primary action

The primary button should be explicit about what happens next.

Example:

- Continue learning
- SSiW Lesson 02 — North Wales

Small supporting text:

- Next lesson in your current course

If the user struggled and eligible difficult words currently exist, primary action should become:

- Review difficult words

If the user struggled but no eligible difficult words currently exist, do not show Review difficult words. Use the next valid continue-learning recommendation instead.

For a completed shared-link or Practice test session, the primary action should be:

- Return to your learning

This returns the learner to their previous normal homepage/recommendation context. Do not show normal next-list progression from the shared list as the primary action. A low-emphasis secondary action such as “Practise this list again” is acceptable if it fits the existing end-screen pattern.

### 9.3 Secondary actions

Possible actions:

- Review difficult words, only if eligible difficult words currently exist
- Change word lists
- Back to home

Avoid over-explaining. No “or pick something else” text is needed if “Change word lists” is visible.

### 9.4 Score calculation

Score definitions must be consistent across the end screen, local storage, and recommendation logic.

Correct:

- A word completed without incorrect attempts and without revealed letters.

Incorrect:

- A word with one or more incorrect attempts.

Revealed:

- A word where one or more letters were revealed.

Spellings learned:

- Count a spelling as learned only when it is currently cleanly completed and not difficult.
- Exclude currently difficult or unresolved Review difficult words.
- Revealed-only or seen-only words do not count.
- If a previously difficult word is later completed cleanly and is no longer difficult, it may count as learned.
- Dialect variants that represent the same `variantGroupId` learning item should not be double-counted.

Minutes practised:

- Means active practice time, not raw elapsed session duration.
- Count active interaction time in whole minutes.
- Ignore or cap idle gaps so interruptions do not inflate cumulative practice time.

Rules:

- Correct + Incorrect should equal total words in the session.
- Revealed is also shown as its own stat and may overlap with Incorrect if the same word had both an incorrect attempt and a reveal.
- Revealed words must not count as Correct.
- A word with a reveal but no incorrect attempts should not count as Correct; it should be excluded from Correct and represented through the Revealed stat.
- If the UI requires Correct + Incorrect to equal total words, then any revealed word should be included in Incorrect for scoring purposes.

## 10. Session model

### 10.1 Word list vs session

A collection is an organisational grouping of word lists.

A Spelio-authored word list can contain a flexible number of dialect-resolved conceptual learning items, generally 10–25 for well-designed MVP content.

A list does not need to contain exactly 10 items and does not need to be a multiple of 10. Content creators should not artificially pad, split, or duplicate lists only to create groups of 10.

A conceptual learning item is the ordinary learner-facing unit for session generation, progress, and completion. A single raw word row with no `variantGroupId` counts as one conceptual learning item. Multiple raw word rows sharing the same `variantGroupId` represent dialect variants of one conceptual learning item for ordinary practice and completion purposes.

A session is a short chunk of practice.

MVP session target:

- around 10 conceptual learning items

If fewer than 10 eligible conceptual learning items exist, use the available number.

### 10.2 Large word lists

If a list has 25 eligible conceptual learning items, the user should not complete all 25 in one session by default.

Instead:

- Session 1: around 10 items
- Session 2: next around 10 items, prioritising unseen items
- Session 3: remaining unseen items plus sensible reinforcement items if useful

The user should continue the same list until the list is complete.

Do not move the user to the next word list after only completing one short session if there are unseen eligible conceptual learning items remaining in the current list.

### 10.2.1 Tail-end completion sessions

When a learner has only a small number of unseen eligible conceptual learning items remaining in a list, the next session should feel like finishing the list, not like an awkward full repeat.

Recommended rule:

- If remaining unseen eligible learning items are enough for a normal session, run a normal session.
- If only a small tail remains, create a shorter finishing session using the remaining unseen items plus a small number of sensible reinforcement items if useful.
- Do not pad the session to 10 with excessive repeated words.
- The learner should feel they are completing the list, not repeating the list unnecessarily.

Do not expose technical language such as "completion mode" to learners. The app should simply present a calm, ordinary practice session.

### 10.3 Selection priority within a list

Before selecting session words, resolve dialect variants using the saved Welsh style preference.

If multiple words share the same variantGroupId, they represent dialect variants of the same prompt.

Variant selection rules:

- A variantGroupId counts as one conceptual learning item and one prompt slot.
- Raw dialect rows must not inflate list length, session length, or completion requirements.
- Choose at most one variant from a variantGroupId in a normal session.
- North Wales preference should prefer North Wales variants, then Both, then the best available single variant.
- South Wales / Standard preference should prefer South Wales / Standard or Standard variants, then Both, then the best available single variant.
- Mixed Welsh should feel naturally mixed within the same session where possible, not separated entirely by session order.
- Mixed Welsh should avoid always choosing the first dataset-order variant.
- Mixed Welsh should balance North Wales and South Wales / Standard exposure over time across normal learner progression, not merely within a single session or list.
- Mixed Welsh should avoid persistent first-exposure bias toward either dialect side, including in lists with sparse variant groups.
- Mixed Welsh may use lightweight persistent exposure memory/history for this balancing.
- Mixed Welsh should remain deterministic and testable rather than fully random.
- If Mixed Welsh exposure is balanced or equal, deterministic fallback behaviour is acceptable.
- Mixed Welsh exposure memory should only count choiceful `variantGroupId` selections where both a North Wales variant and a South Wales / Standard or Standard variant existed for the same conceptual learning item.
- Single-side grouped items, ungrouped dialect-specific items, `Both` items, review sessions, and unavoidable single-dialect content should not affect Mixed Welsh balancing memory.
- Mixed Welsh should still choose only one variant from each `variantGroupId` in a normal session.
- Mixed Welsh should not force learners to complete every dialect variant.
- If only one variant exists for a group, use the available variant.
- Dialect preference is soft, not a hard filter.
- If a preferred variant is missing, use the best available variant rather than shrinking the session.
- Dialect balancing must not reduce normal session size.

The goal is to let learners hear and spell real Welsh forms while gradually noticing dialect variation. Mixed Welsh balancing should remain a lightweight session-selection aid, not a full dialect-tracking, mastery, or spaced-repetition subsystem. Dialect variants can be exposed more deliberately later in dedicated dialect-contrast or advanced practice modes, but they must not become a core completion burden.

When choosing session words, prioritise:

1. Unseen words
2. Previously incorrect words
3. Words where reveal was used
4. Older seen but not completed words
5. Mastered words only rarely

### 10.3.1 Lightweight recap injection

Starting from the user’s third normal practice session, each new normal session should include up to one recap word if eligible.

Rules:

- A recap word is a word with `recapDue === true` that is still relevant to the active Welsh style.
- `recapDue` is created when a word has previously been answered incorrectly or revealed.
- Recap injection is invisible reinforcement inside normal sessions, not a separate user-selected mode or public UI label.
- This is automatic and must not make the homepage feel like the learner has unfinished work.
- Recap injection should not happen in dedicated Review difficult words sessions.
- Recap should not reduce session quality or cause duplicate variantGroupId entries.
- If no eligible recap word exists, run the normal session unchanged.
- Normal sessions may inject up to one recap-due word.
- Automatic recap injection should avoid immediate duplicate practice after review. If a word is cleanly resolved in the immediately preceding Review difficult words session, that exact wordId should be excluded from automatic recap injection in the next normal session only. It may remain `recapDue` and may become eligible again after one normal session has passed. If another eligible recap-due word exists, the app may inject that word instead. If no eligible recap word remains after this exclusion, the normal session should run unchanged.
- Recap should prefer words that were previously incorrect or revealed, prioritising current difficult words before resolved recap-due words.
- If the recap word is completed cleanly, update its current difficulty using the existing review removal rule.
- Recap eligibility clears after one clean recap completion. `cleanRecapCount` may still be updated as optional/internal future-safe metadata, but it must not delay `recapDue` clearing after a clean recap.
- Recap-due words may support the optional From earlier action, but must not keep the homepage Review difficult words option visible after current difficult words have been resolved.
- This is not a full spaced repetition system and should not introduce complex scheduling.

### 10.4 Session integrity

**Critical rule:** This behaviour must be enforced strictly with no exceptions. Mixing session state leads to corrupted practice flows and incorrect progress tracking.

Collections are organisational only for MVP.

Practice sessions still operate from selected word list IDs.

Collections must not alter:

- no-auto-start rule
- session generation
- dialect handling
- Review difficult words
- scoring
- recommendation logic
- local progress logic

No MVP practice/session logic should branch on collection type, ownerType, or ownerId.

For MVP, Spelio Core collections use the guided, adaptive, short-session behaviour described above. Custom, personal, and teacher-created lists are future-facing utility modes unless deliberately added to scope later. They may eventually need more direct practice controls because they serve classroom, homework, spelling-test, and personal-list needs, but that configurability must not complicate the normal Spelio Core learner experience.

Changing word lists mid-session:

- Always ends the current session.
- Never mixes newly selected lists into an active session.
- Always returns the user to the homepage.
- The user must explicitly start a new session after changing word lists.

A session’s word pool should be fixed when the session starts.

Changing Welsh style during an active session:

- Saves the new preference immediately.
- Does not alter the current session’s word pool.
- Does not change the current word, answer slots, answer length, audio, notes, scoring, or progress tracking mid-session.
- Shows a subtle inline message in Settings as soon as the Welsh style option is selected: “Welsh style will apply from your next session.”
- Applies when the next normal or Review difficult words session is created.

## 11. Completion and mastery

### 11.1 Word states

Each word may have states such as:

- Unseen
- Seen
- Difficult
- Completed
- Mastered later

For MVP, the key operational states are:

- unseen
- seen
- difficult
- completed

### 11.2 List completion

List progression and full list completion are separate.

Progression-complete means:

- All dialect-eligible conceptual learning items in the list have been seen at least once according to the active Welsh style rules.
- The learner may naturally continue to the next recommended list.
- This does not require every difficult word from that list to be resolved first.
- This is mostly invisible system logic, not a new learner-facing status.

List completion and modal ticks must be based on dialect-resolved conceptual learning items, not raw database rows. For items linked by `variantGroupId`, completion of the selected/resolved variant counts for the conceptual learning item.

The list should only receive the stricter modal tick / full completion state when:

- Every dialect-eligible conceptual learning item in the list has been seen at least once according to the active Welsh style rules, and
- The user has completed a session for that list with at least 85% accuracy and no revealed letters, and
- There are no currently unresolved difficult words from that same list using the current Review difficult words logic.

This prevents a list from being marked fully complete after simply seeing all items once while still struggling. The modal tick must not be shown merely because the user can move on.

Unresolved difficult words from unselected or currently ineligible dialect variants must not prevent full completion under the current Welsh style rules.

The tick in the word list modal represents full completion only. Do not add a second tick state, badge, label, or visible "progression-complete" language. The learner can move forward without a tick; the tick appears once the list has been properly settled.

Switching Welsh style later may allow the learner to encounter a different variant in future practice, but it should not make past list completion feel broken or incomplete.

Do not show public completion requirements based on raw dialect rows.

Review difficult words remains a helpful nudge, not a hard gate:

- If the learner struggles and eligible difficult words exist, continue recommending Review difficult words.
- The learner may continue learning instead if they choose.
- Review difficult words must disappear once all currently eligible difficult words are resolved cleanly.

### 11.3 Mastery

For MVP, “complete” is enough.

A stronger “mastered” concept can come later.

Possible future mastery rule:

- A list is mastered when the user performs well across repeated sessions, e.g. two or more strong sessions with no reveals.

## 12. Struggle and difficulty logic

After a session:

```text
accuracy = correctWords / totalWords
difficultyScore = incorrectAttempts + (revealedLetters * 2)
```

Session states:

Strong:

```text
accuracy >= 90%
AND revealedLetters === 0
```

Good:

```text
accuracy >= 75%
AND accuracy < 90%
```

Struggled:

```text
accuracy < 75%
OR revealedLetters > 0
OR difficultyScore >= 3
```

If the user struggled and dialect-eligible difficult words currently exist, the next recommendation should prioritise reviewing difficult words.

If the user struggled but no dialect-eligible difficult words currently exist, the app should not show Review difficult words and should fall back to the next valid continue-learning recommendation.

## 13. Review difficult words

**UX intent:** Review is a reflection of *current* difficulty, not a punishment or history log. It should feel helpful, lightweight, and disappear naturally as the user improves.

**Critical rule:** This system must never behave like a historical mistake log. Words must leave review immediately once completed cleanly. This rule exists to prevent persistent difficulty bugs and must be enforced strictly.

Review difficult words represents current difficulty, not historical difficulty.

Review difficult words, From earlier, and automatic recap injection are distinct:

- Review difficult words fixes current unresolved difficulty and uses `progress.difficult === true`.
- From earlier revisits resolved or previously weak words using `recapDue` / `cleanRecapCount`; for this action, resolved means `progress.difficult === false`.
- Automatic recap injection quietly reinforces up to one `recapDue` word inside a normal session.

From earlier and automatic recap injection should not be described as visible difficult-word review.

### 13.1 Entry rule

A word enters review if:

- incorrectAttempts > 0, or
- revealedLetters > 0

When either happens, the word should be marked:

```text
progress.difficult === true
```

### 13.2 Removal rule

A word is removed from review if the user later completes it correctly in a session with:

- no incorrect attempts, and
- no revealed letters.

This is a clean completion.

When this happens, the word should be marked:

```text
progress.difficult === false
```

The word may still remain eligible for quiet automatic recap through `recapDue`, but it no longer needs visible review.

A cleanly resolved review word may still remain `recapDue` for later reinforcement, but it should not be immediately injected as the automatic recap word in the next normal session. Review fixes current difficulty; automatic recap provides later reinforcement.

### 13.3 Review session selection

Review selection should use current difficulty only:

```text
progress.difficult === true
```

Review difficult words should resolve eligibility using the exact difficult word variant and the active `dialectPreference`.

A word becomes difficult at the exact `wordId` / variant the learner attempted. Changing Welsh style must not convert that old difficult variant into a different dialect variant.

Review difficult words should only include difficult words that are eligible under the current Welsh style:

- North Wales reviews North Wales and Both difficult words.
- South Wales / Standard reviews South Wales / Standard, Standard, and Both difficult words.
- Mixed Welsh may review any currently difficult dialect variant.

Review must not create duplicate entries for multiple variants in the same `variantGroupId`. `variantGroupId` may be used for deduplication, but not to substitute a different dialect variant for review.

Old difficult entries from another dialect may remain in storage, but should not drive current review recommendations.

When a review word is completed cleanly, the current difficulty for that exact word variant should be resolved.

Review session:

- Up to 10 words.
- Prioritise most recent difficult words.
- Prioritise revealed words.
- Prioritise words with most incorrect attempts.

### 13.4 Empty review state

**Critical rule:** Review must never fall back to a standard session. This prevents incorrect practice behaviour and ensures the feature reflects true user difficulty.

If no dialect-eligible difficult words currently exist:

- Hide “Review difficult words” on the homepage.
- Hide “Review difficult words” on the end screen.
- Do not allow Review difficult words to fall back to a standard session.
- Do not load random words as a substitute review session.

### 13.5 Review list shrink behaviour

**UX expectation:** This behaviour should feel immediate and responsive. Users should clearly see their improvement reflected as the review list shrinks in real time.

Review sessions should dynamically shrink as the user improves.

Example:

- 6 difficult words exist.
- User fixes 3 cleanly.
- Next review session shows 3.
- Once all are fixed, the Review difficult words option disappears.

This should happen immediately as progress updates.

Resolved recap-due words must not keep the visible Review difficult words option on the homepage or end screen.

## 14. Recommendation logic

**UX intent:** Recommendations should feel intelligent but invisible. The system guides without forcing. Users should feel in control, not directed.

Recommendation order after a session:

1. If user struggled and dialect-relevant difficult words currently exist → recommend Review difficult words.
2. Else if current list is not complete → continue current list.
3. Else if current list has a nextListId → recommend next list.
4. Else if unfinished lists exist in current stage → recommend next unfinished list in stage.
5. Else if all lists in stage are complete → recommend first list in next stage.
6. Else recommend weakest incomplete list.

When resolving ordinary Continue learning progression through `nextListId`, the app should not recommend a sequential next list that already meets the stricter full-completion / modal-tick state. It should walk forward through the `nextListId` chain and skip fully completed/ticked lists until it finds the first active list that is not fully completed. This skip rule must use the same full-completion source of truth as the modal tick, not the lighter progression-complete state. Lists that are merely progression-complete but not fully completed/ticked must not be skipped.

This refinement should be invisible to learners and must not introduce any new public completion status, badge, label, or second tick state.

Manual user selection resets the current path position.

If user manually selects a later list, the app should continue from that point onward and should not drag them back to earlier lists unless they choose them or repeatedly struggle.

This creates guided progression rather than locked progression.

Review difficult words must only be recommended when current difficult words exist and are relevant to the learner’s current Welsh style.

`recapDue` words do not count as current difficult words for recommendation purposes. They may power the optional From earlier action or be injected quietly into normal sessions, but they must not cause Review difficult words to remain visible.

From earlier must not block normal progression and must not be treated as the primary recommendation. Continue learning should bypass both visible Review difficult words and From earlier unless automatic recap injection applies normally inside the generated session.

Review difficult words, From earlier, and automatic recap injection must all resolve word eligibility using the current Welsh style rules.

If all currently difficult words belong only to dialect variants that no longer match the active Welsh style, fall back to normal progression recommendations instead of continuing to suggest irrelevant review.

Older multiple selected lists:

- MVP public practice should treat `selectedListIds` as a single-list selection.
- If older local storage contains multiple selected IDs, migrate to the first valid active selected list.
- Normal recommendations should then use the selected/current list and the existing guided progression rules.
- Review difficult words, From earlier, and recap injection remain independent of this migration and should continue using dialect-eligible word progress.

## 15. Local storage

No accounts are required for MVP.

Use local storage key:

```text
spelio-storage-v1
```

Use local storage shape:

```json
{
  "selectedListIds": ["foundations_first_words"],
  "currentPathPosition": "foundations_first_words",
  "completedNormalSessionCount": 0,
  "learningStats": {
    "totalActiveMs": 0,
    "totalSessionsCompleted": 0,
    "firstPractisedAt": null,
    "lastPractisedAt": null
  },
  "lastSessionDate": null,
  "lastSessionResult": {},
  "wordProgress": {},
  "listProgress": {},
  "settings": {
    "englishVisible": true,
    "audioPrompts": true,
    "recallPause": false,
    "soundEffects": true,
    "welshSpelling": "flexible",
    "dialectPreference": "mixed",
    "interfaceLanguage": "en"
  }
}
```

Older stored settings without `dialectPreference` should default safely to `mixed`.

Older stored settings without `interfaceLanguage` should default safely to `en`.

Older stored settings without `recallPause` should default safely to `false`.

`interfaceLanguage` must remain independent from `dialectPreference`, English prompt visibility, and content language-pair metadata.

`selectedListIds` remains for backward compatibility but should contain only one active word list ID in the public MVP. Older multiple selections should be migrated to the first valid active selected list, falling back to the first active list if none are valid.

If normal completed session count cannot be inferred reliably from lastSessionResult or listProgress, store `completedNormalSessionCount` as the minimal additional field.

Rules:

- Increment `completedNormalSessionCount` after completed normal sessions.
- Do not increment it for Review difficult words sessions.
- Use it to decide when recap injection becomes eligible.

Word progress should support:

```json
{
  "wordId": {
    "seen": true,
    "completedCount": 1,
    "difficult": false,
    "recapDue": false,
    "cleanRecapCount": 0,
    "incorrectAttempts": 0,
    "revealedCount": 0,
    "lastPractisedAt": "ISO_DATE_STRING"
  }
}
```

Field meaning:

- `difficult` means current unresolved difficulty for Review difficult words.
- `recapDue` means eligible for From earlier and automatic recap injection.
- `cleanRecapCount` may track clean recap completions as optional/internal future-safe metadata. The MVP recap-clearing rule is one clean recap completion.

Words may have `recapDue === true` after `difficult === false`. That means visible difficult review has been resolved, but the word may still be reinforced through From earlier or automatic recap injection.

Learning stats should remain compact aggregate summaries. Do not store raw timing logs, per-keystroke histories, full answer-entry logs, or exact typed answers.

Active practice time should be accumulated from relevant practice interactions such as typing, reveal, peek, audio replay, completion, and navigation through practice. Long idle gaps should be ignored or capped.

Reset progress should remove this storage key and any known legacy MVP storage keys, then recreate default storage in memory.

Limitations:

- Local to device/browser
- Lost if browser storage is cleared
- No cross-device sync

This is acceptable for MVP.

## 16. Admin panel

**UX intent:** This is a functional tool for the founder. Prioritise clarity and speed over polish. Do not over-design.

The MVP needs a simple private admin panel.

Purpose: allow the founder to add and manage word lists without editing code.

### 16.1 Access

- Private admin route, e.g. `/admin`
- Simple password protection
- Password stored securely as environment variable
- Only founder uses it at MVP stage

### 16.2 Admin features

Admin should allow:

- View collection metadata
- Create word list
- Edit word list
- Delete word list
- Add/edit/delete words
- Generate audio using Azure Voice
- Preview/play generated audio
- Save word list metadata

### 16.3 Word list fields

Each word list belongs to a collection through `collectionId`.

Each word list should include:

- id
- slug
- collectionId
- name
- description
- language
- sourceLanguage
- targetLanguage
- dialect: Both / Mixed / North Wales / South Wales / Standard / Other
- stage/group
- difficulty: 1–5
- order
- nextListId
- isActive
- createdAt
- updatedAt

List-level dialect is a summary/display field only. The actual practice filtering is controlled by word-level dialect.

Existing word-list fields remain unchanged. Do not remove or rename current English/Welsh MVP content fields.

`slug` is the stable public URL identifier for shareable word-list links. It is separate from `id`.

Admin slug requirements:

- Slug editing should be shown in a low-emphasis metadata or advanced area.
- Slugs should use lowercase letters, numbers, and hyphens only.
- No spaces.
- No leading or trailing hyphens.
- Slugs should be unique across active word lists where practical.
- Admin may show and copy the canonical public URL, for example `/list/first-verbs-core-actions`.
- Slug support must not rename existing IDs, break imports, or invalidate local storage.

For current Welsh MVP content, word lists should default to:

```json
{
  "sourceLanguage": "en",
  "targetLanguage": "cy"
}
```

In Supabase/database persistence, the `word_lists` table should include:

- `slug` for public canonical URLs
- `collection_id` referencing the collection entity/table
- `source_language` default `"en"`
- `target_language` default `"cy"`

Do not rename existing `english_prompt` or `welsh_answer` database fields in MVP.

### 16.3.1 Collection fields

The admin/data architecture should include a collection-level model/entity, represented in Supabase as `word_list_collections` or equivalent.

Conceptual collection shape:

- id
- slug
- name
- description
- type
- sourceLanguage
- targetLanguage
- curriculumKeyStage?
- curriculumArea?
- ownerType?
- ownerId?
- order
- isActive
- createdAt
- updatedAt

Allowed collection type examples:

- spelio_core
- curriculum
- course
- school
- teacher
- personal
- custom

Allowed ownerType examples:

- spelio
- school
- teacher
- user
- null

Clarifications:

- `slug` should be stable and unique.
- Do not rely on display-name uniqueness.
- `slug` is intended for future routing, filtering, imports, analytics grouping, and integrations.
- Curriculum fields are optional metadata only.
- Collection type does not affect practice/session logic in MVP.
- ownerType identifies the category of owner.
- ownerId identifies a future specific school, teacher, or user.

For MVP:

- Spelio-owned collections use ownerType: `"spelio"`.
- Spelio-owned collections may use ownerId: `null`.
- Ownership support is schema-only for now.

The MVP does not include:

- ownership enforcement
- school accounts
- teacher accounts
- permissions systems
- multi-tenant architecture

Default seeded MVP collection:

```json
{
  "id": "spelio_core_welsh",
  "slug": "spelio-core-welsh",
  "name": "Spelio Core Welsh",
  "description": "Core Welsh spelling practice lists for the Spelio MVP.",
  "type": "spelio_core",
  "sourceLanguage": "en",
  "targetLanguage": "cy",
  "ownerType": "spelio",
  "ownerId": null,
  "order": 1,
  "isActive": true
}
```

Existing Welsh MVP word lists belong to this default collection.

The Collections layer exists to reduce future refactor risk for curriculum integrations, course pathways, school deployments, teacher lists, personal lists, and future language-pair expansions. Those systems are intentionally postponed beyond MVP.

### 16.4 Word fields

Each word should include:

- id
- listId
- englishPrompt
- welshAnswer
- acceptedAlternatives
- audioUrl
- audioStatus: missing / generated / failed
- notes
- order
- difficulty: optional
- createdAt
- updatedAt
- dialect: Both / North Wales / South Wales / Standard / Other
- dialectNote: optional short learner-facing explanation of regional/dialect usage
- usageNote: optional short learner-facing practical usage note
- variantGroupId: optional shared ID linking variants of the same prompt

acceptedAlternatives should not be used for different-length dialect variants. Use separate word items linked by variantGroupId instead.

No additional learner-facing note fields are required for MVP. More detailed note categories should remain editorial guidance or internal notes, not separate schema fields.

Do not add `usageNoteTranslations`, `dialectNoteTranslations`, multilingual learner-note tables, or database-backed translated note fields for MVP.

### 16.4.1 usageNote rules

Purpose:

usageNote provides practical usage guidance such as:

- formality, e.g. formal / informal
- common shortened vs full forms
- typical spoken vs written usage
- helpful context for when the phrase is used

usageNote should normally be omitted unless the prompt/answer is likely to mislead learners.

Mandatory triggers include:

- yes/no and other response words
- function words with no simple English equivalent
- fixed expressions
- shortened or fuller forms
- formal/informal distinctions
- grammar-dependent meanings
- common learner traps

Rules:

- Must not contain dialect or regional information. That belongs in dialectNote.
- Must not duplicate dialectNote.
- Should be a single short sentence or sentence fragment.
- Recommended length: usually one short line.
- Only include if it adds clear value for the learner.
- Should explain practical use, not teach a full grammar lesson.
- Prefer omission over low-value notes.

usageNote must not contain regional information; regional information belongs in dialectNote.

### 16.4.2 dialectNote rules

dialectNote should explain regional or Welsh-style variation only.

It should be used when:

- North/South/Standard variants exist
- the learner may encounter a different regional form
- the word is part of a variantGroupId
- the selected Welsh style affects which form appears

It should not:

- duplicate usageNote
- include general grammar guidance
- include generic filler
- reveal the exact target answer during active spelling

### 16.4.3 Admin note presentation

In the admin panel, place usageNote and dialectNote in an “Advanced content notes” or “Learner notes” area so the main word editing flow remains uncluttered.

Admin layout:

- Core fields visible by default: English prompt, Welsh answer, dialect, audio status, difficulty, order.
- Advanced/content fields collapsible: acceptedAlternatives, usageNote, dialectNote, notes, variantGroupId.
- Internal notes may be longer and should be clearly labelled “Internal only”.
- notes remains optional and internal/admin-only for exceptional cases such as uncertainty flags, review comments, audio/pronunciation reminders, or future correction notes. Avoid using notes as a routine content-authoring field.
- Do not require notes, populate notes routinely, or use notes as a second hidden teaching system.

### 16.5 Audio generation

Admin should be able to click:

- Generate audio

This should:

1. Send text to a serverless API route.
2. API route calls Azure Voice.
3. Audio file is generated.
4. Audio file is stored or linked.
5. audioUrl is saved against the word.

Do not expose Azure API keys in the browser.

### 16.5.1 Audio generation refinement

Azure Welsh TTS remains the MVP audio provider.

Where practical, audio generation should use a WAV/intermediate output before final MP3 encoding.

Generated audio should pass through a lightweight automated server-side post-processing step before upload/storage:

- gentle loudness normalisation for consistent playback volume
- very short fade-out, around 20–40ms, to reduce mobile speaker popping/clicking at clip endings
- trailing silence padding, around 150ms, to prevent abrupt cutoffs and support the calm Spelio experience

SSML prosody rate may be set slightly slower, around -3% to -5%, with -4% as the initial recommended default.

Goal: clearer, calmer, less abrupt audio while preserving natural Welsh pronunciation and avoiding an obviously slowed-down teaching voice.

Do not add EQ, compression, custom mastering, IPA dictionaries, pronunciation override UI, or third-party audio-processing APIs for MVP.

Any pronunciation override system should remain future-facing and only be considered later for individual problematic words.

This change must not alter public playback UI, practice logic, scoring, progress, word-list behaviour, or learner settings.

## 17. Founder Observation & Anonymous Product Analytics

**UX intent:** Analytics should help the founder understand whether the core practice loop works, without changing the calm, low-friction, privacy-respectful nature of the product.

Analytics are for:

- Improving the core practice loop
- Identifying content difficulty and learner struggle patterns
- Monitoring list completion and review usage
- Supporting future tutor pilots, grants, and educational partnerships
- Technical health monitoring

Analytics are not for:

- Advertising
- Growth hacking
- Invasive tracking
- Session replay
- Behavioural profiling
- Selling user data
- Gamification or engagement maximisation

### 17.1 Anonymous event principles

Events should be anonymous, minimal, and first-party where possible.

Do not collect:

- Names
- Emails
- Account IDs
- Exact typed answers
- Full keystroke logs
- Raw long-term timing logs
- Session replay
- Unnecessary device fingerprinting
- Precise location data
- Marketing identifiers

Analytics should be stored separately from local learner progress. Local progress remains in browser local storage and should not depend on analytics.

Analytics failure must never affect the practice experience.

### 17.2 Recommended anonymous events

Recommended MVP events:

- `session_started`
- `session_completed`
- `session_abandoned`
- `review_started`
- `review_completed`
- `list_completed`
- `audio_replayed`
- `reveal_used`
- `difficult_word_marked`
- `difficult_word_resolved`
- `audio_unavailable`
- `frontend_error`

Events should include only the minimum useful context, such as anonymous session ID, list ID, word ID where needed for aggregate difficulty analysis, review mode, duration, accuracy bucket or aggregate result, reveal count, replay count, and error type.

Do not send exact typed answers or full answer-entry history.

### 17.3 Founder observation dashboard

Add a small founder-only observation dashboard inside the existing admin panel.

The dashboard should show aggregate-only views such as:

- Sessions started
- Sessions completed
- Completion rate
- Average session duration
- Average accuracy
- Reveal usage rate
- Audio replay frequency
- Review difficult words usage
- Returning anonymous device count
- List-level completion rate
- List-level average accuracy
- List-level reveal rate
- Most difficult words by aggregate incorrect/reveal rate
- Missing audio count
- Audio playback failures
- Frontend/API errors

This dashboard is for founder observation and product learning only. It should not become a learner-facing dashboard in the MVP.

### 17.4 Admin analytics exclusion

Founder/admin testing must not pollute analytics.

Rules:

- If the founder is logged into the admin panel, any public front-end practice sessions in that same browser must not send analytics events.
- Admin-authenticated sessions may still update local progress if needed for testing, but they must be excluded from server-side analytics.
- The app should expose a clear internal helper such as `shouldTrackAnalytics()` that returns false when admin mode is active.
- Admin mode analytics exclusion should apply globally across homepage, practice screen, end screen, review sessions, and word list interactions.
- The admin dashboard should ideally show a small “Admin analytics excluded” indicator when admin mode is active.

This rule exists because founder testing will be frequent and would otherwise distort early usage statistics.

### 17.5 Implementation guidance

Use lightweight first-party event logging through a serverless API route.

Consider Plausible or Vercel Analytics for basic page-level analytics.

Do not introduce PostHog or complex product analytics unless later needed.

Prefer aggregate daily statistics over long-term raw event storage. Keep raw event retention short if raw events are stored at all.

Events should be queued or batched where sensible.

Respect browser Do Not Track or a future analytics opt-out setting where practical.

### 17.6 Privacy and legal note

The MVP should clearly disclose use of local storage for progress/settings.

Any anonymous analytics should be described plainly in a privacy or cookies page.

Avoid analytics cookies unless there is a clear reason. Prefer cookieless or first-party privacy-conscious analytics.

If optional anonymous analytics are added later, provide an easy opt-out.

This is not legal advice, but the product should be designed conservatively for UK GDPR/PECR expectations.

## 18. Audio handling

### 18.1 Public app

If audio exists:

- Load quickly.
- Replay from word pill.
- Respect audio prompts setting.

If audio is missing:

- Do not crash.
- If user taps audio, show subtle message:
  - “Audio unavailable”

### 18.2 Sound effects

Sound effects:

- success
- error
- completion

Rules:

- Short sounds under 300ms where possible.
- Low volume.
- No overlapping sounds.
- Respect sound effects setting.

## 19. Interaction details

**UX intent:** Interactions should feel responsive, tactile, and predictable. Avoid surprises. Maintain continuity, especially with keyboard and input behaviour.

### 19.1 Word pill tap

On tap/click:

- Scale 0.98 briefly.
- Play audio immediately.
- No unnecessary status message unless audio fails.

### 19.2 Post-answer notes display

If the current word has dialect other than Both, the app may show a subtle dialect label only after the word is completed, revealed, or on a post-answer/end-of-session review surface, for example:

- North Wales form
- South Wales / Standard form
- Standard form

Generated dialect labels must come from translation keys and structured dialect metadata, not from free-text `dialectNote`.

Welsh generated dialect label examples:

- Ffurf Gogledd Cymru
- Ffurf De Cymru / Safonol
- Ffurf safonol

If a word has a dialectNote:

- Show a subtle dialect note only after active spelling is complete.

If a word has a usageNote:

- Show a subtle usage note only after active spelling is complete.

If both dialectNote and usageNote exist:

- Show usageNote first.
- Show dialectNote below it.

Display rules:

- Maximum of 2 lines total for dialect and usage notes combined.
- Keep text small, low contrast, and visually quiet.
- Do not show notes before or during active spelling.
- Do not use the temporary status message area.
- Do not animate or draw attention to these notes.
- These notes should support the learner without becoming instructional clutter.
- If this feels too cluttered for MVP, store and manage notes in admin first and delay learner display.

Interface-language rule:

- English interface: `usageNote` and free-text `dialectNote` may display where already supported.
- Welsh interface: hide `usageNote` and free-text `dialectNote`.
- Welsh interface: use generated dialect labels from translation keys where appropriate.
- Both: normally show no dialect label.
- Do not add note translation fields or tables for MVP.

### 19.3 Correct letter

- Letter appears black.
- Active underline advances to the next slot.
- Move to next slot.

### 19.4 Incorrect letter

- Show a small restrained red “×” on the active slot.
- Briefly flash the active underline red.
- Optional small shake animation.
- Error sound.
- On supported mobile devices, if Sound effects is on, an incorrect input may trigger a tiny optional haptic vibration, around 8–12ms.
- Clears after approximately 450–650ms.
- Do not show ordinary written error status text.
- Mark word difficult.

The haptic cue is a progressive enhancement only. It must never be required for feedback, must not replace the red “×” / underline feedback or error sound, and must only trigger for incorrect input, not success or completion. If vibration is unsupported, nothing should happen. It must not affect practice logic, scoring, progress, session generation, word-list behaviour, audio prompt playback, or UI layout.

### Spelling pattern hints

Spelio should support lightweight contextual spelling hints during practice.

Purpose:

- Help learners connect Welsh sounds to Welsh spelling patterns.
- Turn common mistakes into useful learning moments.
- Keep the practice flow calm, fast, and non-instructional.

This is not a full phonics engine and should not attempt to explain every Welsh pronunciation rule.

Hint behaviour:

- When a learner types an incorrect character, the app may show a small contextual hint if the mistake matches a known high-confidence Welsh spelling pattern.
- Hints should appear after the first relevant mistake.
- Hints should be short, calm, and visually subtle.
- Hints should avoid long explanations.
- Hints should avoid absolute claims where exceptions exist.
- Hints should not automatically reveal the answer.
- Hints should not block typing.
- Hints should not appear in a modal.
- Hints should not replace existing red error feedback.
- Hints should not count separately from existing incorrect/reveal scoring.

Future-capable hint timing:

Pattern hints are primarily reactive in the MVP and may appear after a relevant incorrect attempt. The system may later support gentle proactive hints when a learner meaningfully hesitates at a known high-value spelling pattern or repeatedly replays the audio. This should remain optional, rare, and especially focused on early-stage lists. Proactive hints must not interrupt typing, must not reveal the full answer, and must not make the experience feel like a tutorial. No exact pause threshold is defined in this specification; timing should be tuned through testing.

#### Hint display placement

Pattern hints should use the same quiet learner-note area intended for usageNote, dialectNote, and generated dialect labels.

Hints must not create an additional new line or stacked message area on the practice screen.

When a pattern hint is active, it may temporarily replace any currently visible usageNote, dialectNote, or generated dialect label in that note area.

Hints should:

- appear in the existing note location
- remain visually quiet and low contrast
- avoid pushing the answer area or controls down
- avoid layout shift where possible
- disappear automatically after a short period, approximately 3–5 seconds
- not stack with usageNote or dialectNote
- not use the temporary status message area
- not appear as a modal, toast, popover, or separate card

After the hint disappears, the normal learner note area may return to its previous state if appropriate.

If there is no existing note area visible during active spelling, reserve or reuse the same physical location so that hints do not alter the screen layout.

Hint levels:

1. Pattern hint: a short explanation of a likely Welsh spelling pattern or learner misconception.
2. Optional reveal help: if the learner continues to struggle at the same position, the app may offer a stronger user-controlled help action such as revealing the next spelling chunk.

Revealing must remain user-controlled. The app must not automatically reveal letters after a mistake.

Initial generic hint registry:

Pattern hints should initially be implemented as a curated generic rule registry, not manually stored on every word.

#### Future learner-instinct hints

The hint registry may later expand to include common English-spelling transfer mistakes and learner-instinct corrections where these are high-confidence, broadly useful, and unlikely to mislead learners.

Examples may include:
- English-style y endings where Welsh commonly uses i
- English k → Welsh c habits
- English v → Welsh f habits
- English th → Welsh dd habits

These should remain lightweight learner-awareness hints rather than full pronunciation or phonics teaching.

Where a hint encourages the learner to “listen closely” or similar, the app may optionally replay the current word audio once after a short delay if:
- audio prompts are enabled
- audio is available
- the replay is unlikely to feel repetitive or intrusive

Automatic replay should remain subtle, infrequent, and secondary to the learner-controlled audio pill.

Initial patterns may include:

- dd
- f
- ff
- ll
- ch
- rh
- wy
- ae
- oe
- ai
- ei
- rare English-letter habits such as k, q, v, x, z

Example English hints:

- dd: “Listen for the soft ‘th’ sound — in Welsh this is often written dd.”
- f: “In Welsh, f often sounds like English ‘v’.”
- ff: “In Welsh, the English ‘f’ sound is usually written ff.”
- ll: “Listen closely — this is the Welsh ll sound.”
- ch: “Listen closely — this is the Welsh ch sound.”
- k: “Welsh rarely uses the letter k.”

Chunk-aware reveal:

When reveal help is used near a known Welsh spelling chunk, reveal the whole chunk rather than only one character where appropriate.

Examples:

- dd
- ll
- ff
- ch
- rh
- wy
- ae
- oe
- ai
- ei

Using chunk-aware reveal should mark the word as revealed/difficult using existing reveal logic.

Multilingual/i18n handling:

- Hint detection logic should be language-neutral.
- Hint messages should be rendered through the existing i18n system.
- The English interface may use English-friendly comparisons, such as “soft th sound”.
- The Welsh interface should avoid assuming English phonics and use more neutral wording where appropriate.
- Do not store translated hint text on individual words for MVP.

Optional word-level controls:

Word records may support optional fields:

- spellingHintId
- disablePatternHints

Most words should not need these fields. Generic pattern rules should be the default.

These optional fields exist only to:

- suppress misleading hints
- force a specific hint in edge cases
- support future reviewed content

The fields should be optional and should not be required when creating or importing words.

Admin handling:

- If implemented, admin should expose these fields quietly in the advanced/learner notes area, not in the main word editing flow.
- Do not require admins to fill them in for normal content creation.

#### Additional vowel-awareness hints

Additional awareness hints may later be added for Welsh vowel behaviour and common diphthongs where the guidance is high-value and unlikely to mislead learners.

Examples may include:

- Welsh w functioning as a vowel
- Welsh y functioning as a vowel
- common diphthongs such as wy, au, ei, oe, eu

These hints should remain lightweight and awareness-based rather than acting as full pronunciation explanations.

Avoid absolute pronunciation claims where dialect or pronunciation variation exists.

Prefer wording such as:

- “Listen closely to the wy sound.”
- “Welsh w can sometimes act like a vowel.”
- “Welsh y can sometimes act like a vowel.”

Avoid oversimplified statements such as:

- “w sounds like o”
- “y always sounds like…”

The MVP should not become a full Welsh phonetics or pronunciation system.

### 19.5 Reveal letter

- Tap/click fills the next missing letter.
- Reveal feedback is communicated visually through the inserted letter and active-slot progression; no temporary “Letter revealed” status is shown.
- Mark word difficult.
- Does not play success sound.
- After revealing a letter, mobile keyboard should remain visible.
- After revealing a letter, focus must return to the hidden input.
- Press and hold briefly shows the full answer as a peek state.
- Peek marks the word as revealed/difficult.
- Peek should end automatically after a short delay and show a subtle “Now try from memory” status.
- Peek should be available once per word; repeat attempts may show “Peek used”.

### 19.6 Word completion

- Success sound.
- Animate completed underlines to the shared success green from left to right.
- Do not add green letter backgrounds, tiles, halos, or written “Correct” status text.
- Keep the completed word visible briefly after the final underline turns green, approximately 400–550ms.
- Move to next word.

If the completed word had no incorrect attempts and no revealed letters during that session, remove it from current review by setting `progress.difficult` to false.

### 19.7 Progress bar

- Animate width change over 200–300ms.
- No jumpy transitions.

### 19.8 Keyboard shortcuts

Desktop:

- Spacebar tap/release: replay audio.
- Spacebar press and hold: peek at the full answer.
- Right arrow: reveal next letter.

The practice screen may show a subtle inline keyboard shortcut hint on desktop/tablet layouts only. The hint must include a small keyboard icon, must not appear on mobile, and should say: “Space to replay audio • → to reveal next letter”.

The keyboard shortcut hint is first-session-only. Track whether the user has already started a practice session in local storage. Show the hint during that first practice session, then hide it entirely for all later sessions. Reset Progress clears this flag with the rest of progress storage.

Typed spaces should be ignored silently during practice. Multi-word answers should work whether the user types the word boundary space or continues with the next letter.

Optional later:

- Enter: continue / confirm where relevant.

### 19.9 Mobile input handling

**Critical implementation requirement:** This system must not be simplified. Incorrect handling will cause keyboard bugs, focus issues, and duplicate input problems.

Mobile input must use a hidden input element to trigger the keyboard.

Rules:

- Hidden input must always retain focus during practice.
- UI interactions, including reveal letter and word pill tap, must restore focus where appropriate.
- Hidden input must not handle keydown events, to avoid desktop duplication.
- Desktop input is handled separately through key events.
- The mobile keyboard should remain available throughout practice unless the user intentionally leaves practice or opens a modal.
- Revealing a letter must not dismiss the keyboard.

### 19.10 Desktop input handling

Desktop input rules:

- Only one input source should process key events.
- Hidden mobile input must not process desktop keydown events.
- Avoid double-processing characters.
- Keyboard shortcuts should not conflict with normal character entry.

## 20. Edge cases

**UX intent:** Edge cases should degrade gracefully. Never break flow, never show errors unnecessarily, and always preserve user confidence.

### 20.1 No word lists selected

Show:

- Select a word list to begin

Primary action opens word list modal.

Do not start practice until the user explicitly starts a session after selecting a list.

### 20.2 Empty word list

Do not allow practice.

Show admin warning or user message:

- This list has no words yet.

### 20.3 Very long words or phrases

- Wrap letter slots cleanly.
- Preserve spaces.
- Words must not split across lines.
- Reduce letter spacing first.
- Reduce letter size if needed.
- Avoid horizontal scrolling.

### 20.4 Offline / audio unavailable

- App should still allow text-based practice.
- Audio failures should not break session.
- Audio failures should produce only subtle temporary feedback.

### 20.5 Older multiple selected lists

Older local storage may contain more than one `selectedListIds` entry from previous multi-list selection behaviour.

When older multiple selections are loaded:

- Keep the first valid active selected list.
- Store `selectedListIds` as a one-item array.
- Set `currentPathPosition` to that selected list if the previous path is invalid.
- Fall back to the first active list if none of the older selected IDs are valid.

Normal sessions should use only the single selected/current list. Progression logic should continue to track progress per source list.

### 20.6 Review action with no eligible difficult words

If the user somehow triggers Review difficult words when no dialect-eligible difficult words exist:

- Do not start a standard session.
- Return to homepage or show a subtle message that there are no eligible difficult words to review.
- Hide the review action wherever possible to prevent this case.

## 21. Tech stack recommendation

Recommended MVP stack:

- React
- TypeScript
- Tailwind CSS
- Vite
- Vercel
- Local storage for progress/settings
- File-based public UI translations
- Serverless API routes for admin/Azure integration
- Simple storage for word/audio data initially

Do not start with a separate Node server unless required.

The app should be built mobile-first and PWA-friendly.

Do not add database-backed or admin-editable UI translations for MVP.

Do not introduce separate language-specific CSS files or themes. Use the shared styling system and make layouts resilient to longer Welsh labels.

### 21.1 Future app options

Start as browser-based web app.

Later options:

- PWA installable app
- Capacitor wrapper for App Store / Google Play
- React Native / Expo only if native needs become significant

## 22. MVP exclusions

Do not include in MVP:

- User accounts
- Paid subscriptions
- Native mobile app
- AI recommendation engine
- Full spaced repetition system
- Teacher dashboards
- Teacher accounts
- Classroom management
- Learner reporting
- Formal assessment mode
- Configurable assessment builders
- Advanced share controls
- Public custom list sharing
- Custom, personal, or teacher-created list authoring
- Configurable custom-list practice modes
- Leaderboards
- Streaks
- Badges/coins/gamification
- Learner-facing progress dashboard
- Charts or noisy progress analytics
- Multi-language support beyond data model readiness
- Database-backed UI translations
- Admin-editable translations
- Multilingual prompt arrays
- usageNoteTranslations or dialectNoteTranslations
- Language-specific stylesheets/themes
- User-level dashboards
- Tutor dashboard
- Cohort management
- Marketing attribution system
- Heatmaps
- Session replay
- A/B testing framework
- Predictive learner scoring
- AI recommendation analytics

Lightweight recap of recently weak words is included; full spaced repetition scheduling is excluded.

Lightweight share links and Practice test links are included. They do not make the MVP a teacher platform, reporting system, or formal assessment system.

## 23. Build priorities

### Phase 1 — Frontend UI

Build:

- First-time homepage
- Returning homepage
- Struggled homepage
- Practice screen
- Settings modal
- Word list modal
- Selected word-list share surface with QR, copy link, native Share where supported, and the lightweight Practice test share option
- End screen

Use static mock data first.

### Phase 2 — Practice engine

Build:

- Word selection
- Per-letter validation
- Diacritic handling
- Audio replay
- Reveal logic
- Completion logic
- End-session stats
- Welsh style setting for word-level dialect variant selection
- Dialect variant selection before rendering answer slots, with at most one variant per variantGroupId in ordinary sessions
- Optional post-answer note display for usageNote and dialectNote
- Mobile hidden input handling
- Desktop key handling without duplication

### Phase 3 — Persistence

Build:

- Local storage settings
- Word progress
- List progress
- Last session result
- Recommendation logic
- Current difficulty review logic
- Removal of words from review after clean completion
- Lightweight recap injection after the second completed normal session
- Homepage From earlier link with capped recap count

### Phase 4 — Admin panel

Build:

- Login/password gate
- Lightweight Collections metadata layer
- Word list CRUD
- Word-list slug and canonical public URL metadata
- Word CRUD
- Azure Voice generation
- Audio preview
- Word-level dialect fields
- usageNote and dialectNote management
- Admin advanced note fields for usageNote, dialectNote, and internal-only notes

### Phase 5 — Content

Build first Welsh starter lists.

Start with original curated content, not copied course content.

Include stricter usageNote/dialectNote handling so high-risk learner-confusion items get useful short notes and regional information stays in dialectNote.

### 23.1 Build quality rule

All changes must pass a production build before being considered valid.

Required checks:

- TypeScript compile/check
- Vite production build

No file should be integrated without passing TypeScript checks.

## 24. Development prompts for future chats

### Prompt 1 — Build the frontend UI first

Use this in a new chat:

I am building Spelio, a premium mobile-first Welsh spelling practice web app for adults. I have final design screenshots in the project files for the homepage states, practice screen, settings modal, word list modal, and end screen. Please inspect those screenshots and build the frontend UI in React + TypeScript + Tailwind using static mock data first. Do not add extra features. Match the visual style closely: clean warm-neutral public background, minimal red accent, premium SaaS feel, calm adult tone, strong whitespace, subtle interactions. Build the following screens/states: first-time homepage, returning homepage, struggled homepage, practice screen, settings modal, word list modal, and end screen. Use reusable components and mobile-first responsive layout. Do not implement backend yet. Include the word list modal behaviour from the specification: Done saves selection but never auto-starts practice, and changing lists during practice ends the current session and returns to homepage.

### Prompt 2 — Build the practice engine

Use this after the UI shell exists:

Using the existing Spelio frontend, implement the core practice engine. The app should run short sessions targeting around 10 dialect-resolved conceptual learning items drawn from selected word lists, using fewer when fewer eligible items are available and continuing larger lists across multiple sessions. It should validate Welsh answers letter-by-letter, accept flexible diacritics by default, accept apostrophe/dash variants, ignore typed spaces silently for multi-word answers, mark wrong letters red and clear them after a short delay, reveal the next letter when requested, mark words as difficult when the user makes an error or uses reveal, replay audio when the word pill is tapped, and show an end screen with correct/incorrect/revealed/time stats. Add keyboard shortcuts: spacebar tap/release to replay audio, spacebar press-and-hold to peek at the answer, and right arrow to reveal the next letter. Keep all behaviour aligned with the MVP specification. Before rendering answer slots, resolve dialect variants using Welsh style, choosing at most one variant per variantGroupId in ordinary sessions. Do not display usageNote or dialectNote during active spelling; optional learner note display should happen only after completion, reveal, or on review surfaces. Implement mobile input using a hidden input that retains focus, and ensure desktop input is handled separately so characters are not processed twice.

### Prompt 3 — Build local storage progress and recommendation logic

Use this after the practice engine works:

Add local storage persistence to Spelio using the `spelio-storage-v1` key. Store the selected word list as a one-item `selectedListIds` array, settings including `dialectPreference`, word progress, list progress, last session result, current path position, and only if needed a minimal `completedNormalSessionCount`. Implement list progression separately from full list completion: the user may move on once every dialect-eligible conceptual learning item has been seen, while the modal tick/full completion remains stricter and requires at least 85% accuracy and no revealed letters in a completed session. Implement recommendation logic: if the user struggled and dialect-eligible difficult words currently exist, recommend review difficult words; if current list is incomplete for progression, continue it; otherwise recommend nextListId, then unfinished list in current stage, then first list in next stage, then weakest incomplete list. Starting from the third normal practice session, inject up to one eligible recap-due word into normal sessions, without duplicate variantGroupId entries and without applying this to Review difficult words sessions. Recap-due words come from previous incorrect/revealed words, may remain eligible after visible review is resolved, and clear after one clean recap completion; `cleanRecapCount` may remain optional/internal future-safe metadata but must not require two completions. Older multiple selected list IDs should migrate to the first valid active selected list. Update homepage states based on first-time, returning, and struggled user logic, including a low-priority “From earlier →” link with a hidden/exact/capped count for eligible resolved `recapDue` words. Welsh style should affect word-level variant selection only, never word-list visibility, and older storage without `dialectPreference` should default to `mixed`. Review difficult words must use progress.difficult === true only, remove words from review after clean completion, shrink dynamically, disappear when no current difficult words remain, and never fall back to a standard session when empty. Continue learning should bypass visible review and From earlier unless automatic recap injection applies normally. Include reset progress behaviour that clears current and legacy local storage keys and returns the user to the homepage.

### Prompt 4 — Build admin panel and Azure Voice integration

Use this once the app works with mock data:

Build a simple private admin panel for Spelio. It should be protected by a simple password stored in an environment variable. The admin panel should allow me to create/edit/delete word lists and add/edit/delete words. Each word list should have name, description, language, dialect, stage, difficulty, order, nextListId, and active status. Each word should have English prompt, Welsh answer, accepted alternatives, audioUrl, audioStatus, notes, order, optional difficulty, dialect, optional dialectNote, optional usageNote, and optional variantGroupId. Keep usageNote and dialectNote in a collapsible Advanced content notes or Learner notes area, keep notes clearly labelled internal-only, and do not add separate learner-facing note fields such as grammarNote or registerNote. Add an API route to generate audio using Azure Voice without exposing API keys in the browser. Save generated audio references against words and allow preview/playback in admin.

### Prompt 5 — Create starter Welsh word lists

Use this as a separate content-generation chat:

Help me create original Welsh word lists for Spelio. Do not copy any commercial course structure or proprietary lists. Create beginner-friendly Welsh spelling practice lists for adult learners. Start with around 8–12 lists, each with 10–25 dialect-resolved conceptual learning items, not necessarily exactly 10 words or raw rows. Include list name, dialect tag where relevant, stage, difficulty, English prompt, Welsh answer, accepted alternatives if needed, dialect, dialectNote where useful, usageNote where useful, variantGroupId where dialect variants exist, and notes only for exceptional internal review needs. Suggested categories include Common Verbs, Everyday Words, Opposites, Animals, Birds, Weather, Food & Drink, Family, Places, and Useful Phrases. Prioritise words that are useful, common, and good for spelling practice. Explicitly identify high-risk learner-confusion items such as yes/no, response words, function words, fixed expressions, shortened/full forms, register differences, grammar-dependent meanings, and common traps. Add short usageNote or dialectNote values only where genuinely useful. Do not put regional information in usageNote; use dialectNote for that.

### Prompt 6 — Create a technical implementation plan

Use this before or during build:

Based on the Spelio MVP specification v1.1 Gold, create a detailed technical implementation plan for React + TypeScript + Tailwind + Vite + Vercel. Include folder structure, component structure, data models, local storage schema, state management approach, practice engine functions, recommendation functions, review difficult words logic, From earlier recap logic, lightweight recap injection, capped From earlier count on the homepage, learner note handling for usageNote and dialectNote, mobile hidden input strategy, desktop keyboard strategy, word list modal behaviour, admin panel structure including advanced note fields, Azure Voice API route design, and deployment steps. Keep it lean and suitable for a solo founder building an MVP.

### Prompt 7 — Implement lightweight anonymous analytics and founder observation dashboard

Use this after the core practice loop, local storage progress, and admin panel are working:

Implement lightweight anonymous analytics and a founder observation dashboard for Spelio. Use first-party anonymous event logging through a serverless API route. Add admin analytics exclusion so `shouldTrackAnalytics()` returns false when admin mode is active, and ensure public practice sessions in the same browser as an admin-authenticated session do not send analytics events. Track only minimal anonymous events needed for aggregate metrics, including session starts/completions/abandonments, review usage, list completion, reveal usage, audio replay, difficult word marking/resolution, missing audio, and frontend errors. Build founder-only admin dashboard views for aggregate metrics such as sessions, completion rate, average duration, average accuracy, reveal/audio replay usage, review usage, returning anonymous device count, list-level performance, difficult words, missing audio, playback failures, and frontend/API errors. Keep retention and minimisation privacy-conscious, prefer daily aggregates over long-term raw event storage, avoid invasive tracking, do not collect typed answers or keystroke logs, and do not add session replay, heatmaps, marketing attribution, behavioural profiling, or gamification analytics.

## 25. Final MVP definition

The MVP is complete when:

- A new user can open the app and start a Welsh spelling session instantly.
- A returning user is shown a smart next recommendation.
- A struggling user is encouraged to review difficult words only when dialect-eligible difficult words currently exist.
- The practice screen behaves smoothly and clearly.
- Word lists can contain more than 10 conceptual learning items and are practised over multiple short sessions.
- The app tracks local progress.
- Review difficult words works as current difficulty, shrinks as the user improves, and disappears when resolved.
- From earlier can optionally revisit previously weak `recapDue` words without blocking progression or looking like a backlog.
- Quiet recap injection can reinforce `recapDue` words inside normal sessions without keeping the learner in a visible difficult-words state.
- Changing word lists never auto-starts practice and never mutates an active session.
- Mobile input works reliably and does not conflict with desktop key handling.
- The admin panel can create and manage word lists.
- Azure Voice audio can be generated for words.
- The experience feels premium, adult, calm, and useful.
- All production code passes TypeScript checks and a production build.

The MVP should not try to do everything. It should make one loop excellent:

Start → practise → feedback → complete → recommended next step.
