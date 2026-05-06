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

The product should feel like a premium SaaS-style tool: calm, restrained, responsive, and well designed.

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

This rule is global and applies across homepage, practice screen, end screen, and modals.

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

All public screens should include the shared footer copy:

- Made with love for Wales. © CURRENT_YEAR Spelio

The app should use the Spelio SVG favicon.

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
  - “© 2025 Spelio”

Behaviour:

- Clicking the play button or primary CTA starts practice using the default selected word list.
- “Select word list” opens the word list modal.
- No account prompt.
- No dashboard.
- No settings cog on homepage.

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
  - “Review difficult words →” if difficult words currently exist
- Tertiary action:
  - “Select word list →”
- Faint copyright text

Behaviour:

- Main CTA starts the recommended list/session.
- Review difficult words appears only if there are words currently marked difficult.
- Select word list opens the word list modal.
- If no difficult words currently exist, the Review difficult words action must be hidden.
- The homepage must not show Review difficult words as an action if selecting it would lead to an empty review session.

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
  - “Review difficult words →” if difficult words currently exist
- Secondary action:
  - “Continue learning →”
- Tertiary action:
  - “Select word list →”
- Faint copyright text

Behaviour:

- If the last session is classified as “struggled” and difficult words exist, review becomes the primary action.
- If the last session is classified as “struggled” but no difficult words currently exist, do not show a review action. Fall back to the appropriate continue-learning recommendation.
- The user can still continue learning or choose another word list.
- Select word list opens the word list modal and must not auto-start a practice session after Done is pressed.

## 6. Practice screen design

**UX intent:** This is the core experience. It must feel focused, quiet, and satisfying. Avoid instructional text, avoid noise, and prioritise immediate feedback and flow.

The practice screen is the core product experience.

### 6.1 Layout

Desktop and mobile should follow the same mental model:

- Thin progress bar at top
- Optional small progress count, e.g. “3 / 10”
- Settings cog top-right
- Spelio logo
- Word/audio pill
- Letter input row
- Temporary feedback/status line
- Bottom utility strip
- Faint copyright footer

The practice screen logo must be smaller on mobile than the homepage logo. It must never push the answer area below the visible viewport. It should scale responsively based on available screen height.

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

### 6.3 Letter input

The answer appears as individual letter slots.

Rules:

- Correct letters lock in.
- Incorrect letters appear red briefly, then clear.
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

The practice screen uses the same shared footer copy and styling as the homepage.

### 6.5 Status messages

**UX intent:** Feedback should feel supportive, not intrusive. Messages should be brief, subtle, and never stack or overwhelm the user.

Status area should be temporary only.

Examples:

- “Incorrect. Try again.”
- “Correct”
- “Letter revealed”
- “English on”
- “English off”
- “Audio unavailable”

Messages should fade after approximately 1.2–1.8 seconds.

Persistent hints should be avoided.

The temporary status message area must not be used for dialect notes or usage notes.

## 7. Settings modal

Settings should be minimal.

Fields:

- Welsh spelling
  - Flexible
  - Strict
- Welsh style
  - Mixed Welsh
  - North Wales
  - South Wales / Standard
- Audio prompts
  - On/off
- Sound effects
  - On/off
- Reset progress
  - Requires confirmation
  - Clears progress, settings, and history on the current device
  - Returns the user to the homepage
  - Shows a short confirmation toast

Defaults:

- Welsh spelling: Flexible
- Welsh style: Mixed Welsh
- Audio prompts: On
- Sound effects: On

Welsh style is stored as `dialectPreference` and affects word-level variant selection only. It must not affect word-list visibility.

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

Short explanation:

- “Words will be mixed from all selected lists.”

Selected count:

- Example: “Selected: 3 lists”

Search field:

- “Search word lists…”

Body:

- Grouped, scrollable list body

Footer:

- Sticky footer with action button

### 8.2 Grouping examples

Groups might include:

- Foundations
- Core Welsh
- Nature
- Opposites
- Course Packs
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

Examples:

- now → nawr — South Wales / Standard — variantGroupId: now
- now → rwan — North Wales — variantGroupId: now

The session engine should resolve dialect variants before rendering the answer slots.

Dialect is handled at word/item level. The Welsh style setting affects variant selection, not word-list visibility. List-level dialect remains internal/admin metadata only and should not appear as public badges beside word lists.

Normal sessions choose at most one variant from each `variantGroupId`. North Wales and South Wales / Standard are soft preferences: prefer the matching variant where available, otherwise use a `Both` item where available, otherwise use the best available single variant. Missing preferred variants must not shrink the session. Mixed Welsh should include a balanced mix of available North Wales and South Wales / Standard variants within the same session where possible, avoiding a simple first-in-dataset-order bias while still showing only one variant from each group.

Different-length dialect variants should not be handled as acceptedAlternatives. Use separate word items linked by variantGroupId instead.

### 8.4 Multi-list selection

Users should be able to select multiple word lists.

Reason:

- It supports mixed practice.
- It allows users to revise across topics.
- It creates flexibility without forcing a rigid course path.

Clarity rule:

- The modal must make it clear that words are mixed from selected lists.

### 8.5 Modal behaviour

The word list modal must separate selection from session start.

Done behaviour:

- If no changes were made, close the modal and leave the user where they were.
- If changes were made:
  - Save the selected lists.
  - If the user clears all selections, fall back to the first available active list.
  - Set currentPathPosition to the first selected list.
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

## 9. End-of-session screen

**UX intent:** This screen should feel rewarding but restrained. Avoid gamification. Emphasise clarity, closure, and the next useful step.

Purpose: show completion, performance, and the best next action.

### 9.1 Layout

Content:

- Complete progress bar
- Success icon/checkmark
- Heading:
  - “Excellent!”
- Message:
  - “You’ve completed this session”
- Stats:
  - Correct
  - Incorrect
  - Revealed
  - Time
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

If the user struggled and difficult words currently exist, primary action should become:

- Review difficult words

If the user struggled but no difficult words currently exist, do not show Review difficult words. Use the next valid continue-learning recommendation instead.

### 9.3 Secondary actions

Possible actions:

- Review difficult words, only if difficult words currently exist
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

Rules:

- Correct + Incorrect should equal total words in the session.
- Revealed is also shown as its own stat and may overlap with Incorrect if the same word had both an incorrect attempt and a reveal.
- Revealed words must not count as Correct.
- A word with a reveal but no incorrect attempts should not count as Correct; it should be excluded from Correct and represented through the Revealed stat.
- If the UI requires Correct + Incorrect to equal total words, then any revealed word should be included in Incorrect for scoring purposes.

## 10. Session model

### 10.1 Word list vs session

A word list can contain any number of words.

A session is a short chunk of practice.

MVP session target:

- 10 words

If fewer than 10 available words exist, use all available words.

### 10.2 Large word lists

If a list has 25 words, the user should not complete all 25 in one session by default.

Instead:

- Session 1: 10 words
- Session 2: next 10 words, prioritising unseen words
- Session 3: remaining words plus difficult words

The user should continue the same list until the list is complete.

Do not move the user to the next word list after only completing one 10-word session if there are unseen words remaining in the current list.

### 10.3 Selection priority within a list

Before selecting session words, resolve dialect variants using the saved Welsh style preference.

If multiple words share the same variantGroupId, they represent dialect variants of the same prompt.

Variant selection rules:

- A variantGroupId counts as one learning item and one prompt slot.
- Choose at most one variant from a variantGroupId in a normal session.
- North Wales preference should prefer North Wales variants, then Both, then the best available single variant.
- South Wales / Standard preference should prefer South Wales / Standard or Standard variants, then Both, then the best available single variant.
- Mixed Welsh should feel naturally mixed within the same session where possible, not separated entirely by session order.
- Mixed Welsh should avoid always choosing the first dataset-order variant.
- Mixed Welsh may alternate or rotate between North Wales and South Wales / Standard forms across variant groups and sessions.
- If only one variant exists for a group, use the available variant.
- Dialect preference is soft, not a hard filter.
- If a preferred variant is missing, use the best available variant rather than shrinking the session.
- Dialect balancing must not reduce normal session size.

The goal is to let learners hear and spell real Welsh forms while gradually noticing dialect variation.

When choosing session words, prioritise:

1. Unseen words
2. Previously incorrect words
3. Words where reveal was used
4. Older seen but not completed words
5. Mastered words only rarely

### 10.4 Session integrity

**Critical rule:** This behaviour must be enforced strictly with no exceptions. Mixing session state leads to corrupted practice flows and incorrect progress tracking.

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
- Shows a subtle temporary practice message: “Welsh style will apply from your next session.”
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

A list is complete when:

- Every word in the list has been seen at least once, and
- The user completes a session for that list with at least 85% accuracy and no revealed letters.

This prevents a list from being marked complete after simply seeing all words once while still struggling.

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

If the user struggled and difficult words currently exist, the next recommendation should prioritise reviewing difficult words.

If the user struggled but no difficult words currently exist, the app should not show Review difficult words and should fall back to the next valid continue-learning recommendation.

## 13. Review difficult words

**UX intent:** Review is a reflection of *current* difficulty, not a punishment or history log. It should feel helpful, lightweight, and disappear naturally as the user improves.

**Critical rule:** This system must never behave like a historical mistake log. Words must leave review immediately once completed cleanly. This rule exists to prevent persistent difficulty bugs and must be enforced strictly.

Review difficult words represents current difficulty, not historical difficulty.

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

When this happens, the word should be marked:

```text
progress.difficult === false
```

### 13.3 Review session selection

Review selection should use current difficulty only:

```text
progress.difficult === true
```

Review difficult words should resolve eligibility using the active `dialectPreference` and `variantGroupId` relationships where possible.

If a difficult word belongs to a linked dialect-variant group, a newly started review session should prefer the variant matching the learner’s current Welsh style. This prevents learners being forced to keep practising an old dialect variant indefinitely after changing Welsh style.

Review must not create duplicate entries for multiple variants in the same `variantGroupId`.

If no matching dialect variant exists, the available difficult word may still be reviewed.

When a mapped review variant is completed cleanly, the relevant current difficulty for that linked variant group should be resolved.

Review session:

- Up to 10 words.
- Prioritise most recent difficult words.
- Prioritise revealed words.
- Prioritise words with most incorrect attempts.

### 13.4 Empty review state

**Critical rule:** Review must never fall back to a standard session. This prevents incorrect practice behaviour and ensures the feature reflects true user difficulty.

If no difficult words currently exist:

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
- Once all are fixed, the review option disappears.

This should happen immediately as progress updates.

## 14. Recommendation logic

**UX intent:** Recommendations should feel intelligent but invisible. The system guides without forcing. Users should feel in control, not directed.

Recommendation order after a session:

1. If user struggled and dialect-relevant difficult words currently exist → recommend Review difficult words.
2. Else if current list is not complete → continue current list.
3. Else if current list has a nextListId → recommend next list.
4. Else if unfinished lists exist in current stage → recommend next unfinished list in stage.
5. Else if all lists in stage are complete → recommend first list in next stage.
6. Else recommend weakest incomplete list.

Manual user selection resets the current path position.

If user manually selects a later list, the app should continue from that point onward and should not drag them back to earlier lists unless they choose them or repeatedly struggle.

This creates guided progression rather than locked progression.

Review difficult words must only be recommended when current difficult words exist and are relevant to the learner’s current Welsh style.

If all currently difficult words belong only to dialect variants that no longer match the active Welsh style, and no linked matching variant is available through `variantGroupId`, fall back to normal progression recommendations instead of continuing to suggest irrelevant review.

Multiple selected lists:

- If multiple lists are selected and dialect-relevant difficult words currently exist, recommend Review difficult words.
- If multiple lists are selected and not all selected-list words have been completed, recommend continuing mixed practice.
- If multiple lists are selected and all selected-list words have been completed, recommend practising the mixed selection again.
- The recommendation subtitle should make the mixed selection clear, e.g. “Custom mixed word list”.

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
  "lastSessionDate": null,
  "lastSessionResult": {},
  "wordProgress": {},
  "listProgress": {},
  "settings": {
    "englishVisible": true,
    "audioPrompts": true,
    "soundEffects": true,
    "welshSpelling": "flexible",
    "dialectPreference": "mixed"
  }
}
```

Older stored settings without `dialectPreference` should default safely to `mixed`.

Word progress should support:

```json
{
  "wordId": {
    "seen": true,
    "completedCount": 1,
    "difficult": false,
    "incorrectAttempts": 0,
    "revealedCount": 0,
    "lastPractisedAt": "ISO_DATE_STRING"
  }
}
```

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

- Create word list
- Edit word list
- Delete word list
- Add/edit/delete words
- Generate audio using Azure Voice
- Preview/play generated audio
- Save word list metadata

### 16.3 Word list fields

Each word list should include:

- id
- name
- description
- language
- dialect: Both / Mixed / North Wales / South Wales / Standard / Other
- stage/group
- difficulty: 1–5
- order
- nextListId
- isActive
- createdAt
- updatedAt

List-level dialect is a summary/display field only. The actual practice filtering is controlled by word-level dialect.

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

### 16.4.1 usageNote rules

Purpose:

usageNote provides practical usage guidance such as:

- formality, e.g. formal / informal
- common shortened vs full forms
- typical spoken vs written usage
- helpful context for when the phrase is used

Rules:

- Must not contain dialect or regional information. That belongs in dialectNote.
- Must not duplicate dialectNote.
- Should be a single short sentence or sentence fragment.
- Recommended length: 5–12 words.
- Only include if it adds clear value for the learner.
- Prefer omission over low-value notes.

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

### 19.2 Prompt notes display

If the current word has dialect other than Both, show a subtle dialect label near the prompt, for example:

- North Wales form
- South Wales / Standard form

If a word has a dialectNote:

- Show a subtle dialect note near the prompt.

If a word has a usageNote:

- Show a subtle usage note near the prompt.

If both dialectNote and usageNote exist:

- Show dialectNote first.
- Show usageNote below it.

Display rules:

- Maximum of 2 lines total for dialect and usage notes combined.
- Keep text small, low contrast, and visually quiet.
- Do not use the temporary status message area.
- Do not animate or draw attention to these notes.
- These notes should support the learner without becoming instructional clutter.

### 19.3 Correct letter

- Letter appears black.
- Brief soft green flash.
- Move to next slot.

### 19.4 Incorrect letter

- Letter appears red.
- Small shake animation.
- Error sound.
- Clears after 700–900ms.
- Status: “Incorrect. Try again.”
- Mark word difficult.

### 19.5 Reveal letter

- Tap/click fills the next missing letter.
- Status: “Letter revealed.”
- Mark word difficult.
- Does not play success sound.
- After revealing a letter, mobile keyboard should remain visible.
- After revealing a letter, focus must return to the hidden input.
- Press and hold briefly shows the full answer as a peek state.
- Peek marks the word as revealed/difficult.
- Peek should end automatically after a short delay and show a subtle “Now try from memory” status.
- Peek should be available once per word; repeat attempts may show “Peek used”.

### 19.6 Word completion

- Status: “Correct.”
- Success sound.
- Subtle green flash across word.
- Wait 250–400ms.
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

### 20.5 Multiple selected lists

Words can be mixed from all selected lists.

However, progression logic should still track progress per source list.

When a mixed selection is saved:

- `selectedListIds` stores all selected list IDs in selected order.
- `currentPathPosition` is set to the first selected list.
- Recommendation copy should describe the selection as mixed practice.
- Review difficult words may override mixed practice only when current difficult words exist.

### 20.6 Review action with no difficult words

If the user somehow triggers Review difficult words when no difficult words exist:

- Do not start a standard session.
- Return to homepage or show a subtle message that there are no difficult words to review.
- Hide the review action wherever possible to prevent this case.

## 21. Tech stack recommendation

Recommended MVP stack:

- React
- TypeScript
- Tailwind CSS
- Vite
- Vercel
- Local storage for progress/settings
- Serverless API routes for admin/Azure integration
- Simple storage for word/audio data initially

Do not start with a separate Node server unless required.

The app should be built mobile-first and PWA-friendly.

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
- Public custom list sharing
- Leaderboards
- Streaks
- Badges/coins/gamification
- Multi-language support beyond data model readiness
- User-level dashboards
- Tutor dashboard
- Cohort management
- Marketing attribution system
- Heatmaps
- Session replay
- A/B testing framework
- Predictive learner scoring
- AI recommendation analytics

## 23. Build priorities

### Phase 1 — Frontend UI

Build:

- First-time homepage
- Returning homepage
- Struggled homepage
- Practice screen
- Settings modal
- Word list modal
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

### Phase 4 — Admin panel

Build:

- Login/password gate
- Word list CRUD
- Word CRUD
- Azure Voice generation
- Audio preview
- Word-level dialect fields
- usageNote and dialectNote management

### Phase 5 — Content

Build first Welsh starter lists.

Start with original curated content, not copied course content.

### 23.1 Build quality rule

All changes must pass a production build before being considered valid.

Required checks:

- TypeScript compile/check
- Vite production build

No file should be integrated without passing TypeScript checks.

## 24. Development prompts for future chats

### Prompt 1 — Build the frontend UI first

Use this in a new chat:

I am building Spelio, a premium mobile-first Welsh spelling practice web app for adults. I have final design screenshots in the project files for the homepage states, practice screen, settings modal, word list modal, and end screen. Please inspect those screenshots and build the frontend UI in React + TypeScript + Tailwind using static mock data first. Do not add extra features. Match the visual style closely: clean white background, minimal red accent, premium SaaS feel, calm adult tone, strong whitespace, subtle interactions. Build the following screens/states: first-time homepage, returning homepage, struggled homepage, practice screen, settings modal, word list modal, and end screen. Use reusable components and mobile-first responsive layout. Do not implement backend yet. Include the word list modal behaviour from the specification: Done saves selection but never auto-starts practice, and changing lists during practice ends the current session and returns to homepage.

### Prompt 2 — Build the practice engine

Use this after the UI shell exists:

Using the existing Spelio frontend, implement the core practice engine. The app should run 10-word sessions drawn from selected word lists. It should validate Welsh answers letter-by-letter, accept flexible diacritics by default, accept apostrophe/dash variants, ignore typed spaces silently for multi-word answers, mark wrong letters red and clear them after a short delay, reveal the next letter when requested, mark words as difficult when the user makes an error or uses reveal, replay audio when the word pill is tapped, and show an end screen with correct/incorrect/revealed/time stats. Add keyboard shortcuts: spacebar tap/release to replay audio, spacebar press-and-hold to peek at the answer, and right arrow to reveal the next letter. Keep all behaviour aligned with the MVP specification. Before rendering answer slots, resolve dialect variants using Welsh style, choosing at most one variant per variantGroupId in ordinary sessions. Implement mobile input using a hidden input that retains focus, and ensure desktop input is handled separately so characters are not processed twice.

### Prompt 3 — Build local storage progress and recommendation logic

Use this after the practice engine works:

Add local storage persistence to Spelio using the `spelio-storage-v1` key. Store selected word lists, settings including `dialectPreference`, word progress, list progress, last session result, and current path position. Implement list completion logic: a list is complete when every learning item has been seen at least once and the user completes a session for that list with at least 85% accuracy and no revealed letters. Implement recommendation logic: if the user struggled and difficult words currently exist, recommend review difficult words; if current list is incomplete, continue it; otherwise recommend nextListId, then unfinished list in current stage, then first list in next stage, then weakest incomplete list. For multiple selected lists, recommend mixed practice unless current difficult words exist. Update homepage states based on first-time, returning, and struggled user logic. Welsh style should affect word-level variant selection only, never word-list visibility, and older storage without `dialectPreference` should default to `mixed`. Review difficult words must use progress.difficult === true only, remove words from review after clean completion, shrink dynamically, and never fall back to a standard session when empty. Include reset progress behaviour that clears current and legacy local storage keys and returns the user to the homepage.

### Prompt 4 — Build admin panel and Azure Voice integration

Use this once the app works with mock data:

Build a simple private admin panel for Spelio. It should be protected by a simple password stored in an environment variable. The admin panel should allow me to create/edit/delete word lists and add/edit/delete words. Each word list should have name, description, language, dialect, stage, difficulty, order, nextListId, and active status. Each word should have English prompt, Welsh answer, accepted alternatives, audioUrl, audioStatus, notes, order, optional difficulty, dialect, optional dialectNote, optional usageNote, and optional variantGroupId. Add an API route to generate audio using Azure Voice without exposing API keys in the browser. Save generated audio references against words and allow preview/playback in admin.

### Prompt 5 — Create starter Welsh word lists

Use this as a separate content-generation chat:

Help me create original Welsh word lists for Spelio. Do not copy any commercial course structure or proprietary lists. Create beginner-friendly Welsh spelling practice lists for adult learners. Start with around 8–12 lists, each with 10–25 words. Include list name, dialect tag where relevant, stage, difficulty, English prompt, Welsh answer, accepted alternatives if needed, dialect, dialectNote where useful, usageNote where useful, variantGroupId where dialect variants exist, and notes. Suggested categories include Common Verbs, Everyday Words, Opposites, Animals, Birds, Weather, Food & Drink, Family, Places, and Useful Phrases. Prioritise words that are useful, common, and good for spelling practice. Do not put regional information in usageNote; use dialectNote for that.

### Prompt 6 — Create a technical implementation plan

Use this before or during build:

Based on the Spelio MVP specification v1.1 Gold, create a detailed technical implementation plan for React + TypeScript + Tailwind + Vite + Vercel. Include folder structure, component structure, data models, local storage schema, state management approach, practice engine functions, recommendation functions, review difficult words logic, mobile hidden input strategy, desktop keyboard strategy, word list modal behaviour, admin panel structure, Azure Voice API route design, and deployment steps. Keep it lean and suitable for a solo founder building an MVP.

### Prompt 7 — Implement lightweight anonymous analytics and founder observation dashboard

Use this after the core practice loop, local storage progress, and admin panel are working:

Implement lightweight anonymous analytics and a founder observation dashboard for Spelio. Use first-party anonymous event logging through a serverless API route. Add admin analytics exclusion so `shouldTrackAnalytics()` returns false when admin mode is active, and ensure public practice sessions in the same browser as an admin-authenticated session do not send analytics events. Track only minimal anonymous events needed for aggregate metrics, including session starts/completions/abandonments, review usage, list completion, reveal usage, audio replay, difficult word marking/resolution, missing audio, and frontend errors. Build founder-only admin dashboard views for aggregate metrics such as sessions, completion rate, average duration, average accuracy, reveal/audio replay usage, review usage, returning anonymous device count, list-level performance, difficult words, missing audio, playback failures, and frontend/API errors. Keep retention and minimisation privacy-conscious, prefer daily aggregates over long-term raw event storage, avoid invasive tracking, do not collect typed answers or keystroke logs, and do not add session replay, heatmaps, marketing attribution, behavioural profiling, or gamification analytics.

## 25. Final MVP definition

The MVP is complete when:

- A new user can open the app and start a Welsh spelling session instantly.
- A returning user is shown a smart next recommendation.
- A struggling user is encouraged to review difficult words only when difficult words currently exist.
- The practice screen behaves smoothly and clearly.
- Word lists can contain more than 10 words and are practised over multiple sessions.
- The app tracks local progress.
- Review difficult words works as current difficulty, shrinks as the user improves, and disappears when resolved.
- Changing word lists never auto-starts practice and never mutates an active session.
- Mobile input works reliably and does not conflict with desktop key handling.
- The admin panel can create and manage word lists.
- Azure Voice audio can be generated for words.
- The experience feels premium, adult, calm, and useful.
- All production code passes TypeScript checks and a production build.

The MVP should not try to do everything. It should make one loop excellent:

Start → practise → feedback → complete → recommended next step.
