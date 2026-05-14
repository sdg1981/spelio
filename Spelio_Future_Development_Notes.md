# Spelio — Future Development Notes

This document captures useful future-facing ideas for Spelio before they are forgotten. It is not a specification, roadmap, release checklist, or MVP requirement. It is a lightweight reference for future planning, product thinking, and AI-assisted development conversations.

## 1. Contextual spelling hint evolution

Spelio may gradually expand its generic hint registry as real learner patterns become clearer. The goal would be to add calm, lightweight support for spelling recall without turning the app into a full phonics, grammar, or language-analysis engine.

Possible hint directions include English-spelling transfer and learner-instinct hints, especially where learners naturally apply English spelling habits to Welsh words.

Examples:

- `y` to `i` habits
- `k` to `c` habits
- `v` to `f` habits
- `th` to `dd` habits

Hints should remain short, plain, and non-intrusive. They should support the existing recall-and-listening loop rather than replacing it with explanation-heavy teaching.

Future possible refinements:

- Chunk-aware reveal
- Stronger `ff` detection
- Mutation-awareness hints
- Optional micro-learning info cards
- Optional learner-controlled info icons
- Delayed replay refinement
- Analytics on common learner mistakes
- Founder dashboards showing common learner confusion patterns

### Important product principle

Spelio should remain:

- Calm
- Focused
- Spelling-first
- Low-clutter
- Adult-oriented

Future educational systems should support the spelling practice loop rather than turning the app into a full grammar or phonics course.

## 2. Future educational systems

Possible future systems to keep in mind:

- Mutation-awareness systems
- Post-answer learning notes
- Spaced repetition improvements
- Optional learning overlays or cards
- Audio speaking and spelling mode
- Hands-free driving mode
- Teacher insight tools
- School curriculum packs
- Review workflows with Welsh language organisations

These ideas should remain optional and carefully scoped. They should improve learning value without making the core experience feel busy or instructional by default.

## Welsh Spelling Tips & Foundations

Spelio could eventually add a lightweight educational layer for beginners who want a little more context around Welsh spelling patterns. This should not become a full course mode, grammar course, or classroom-style teaching system.

The core spelling-practice loop should remain primary. Any tips should feel optional, subtle, and useful in the moment rather than tutorial-heavy or instructional by default.

Possible product directions:

- Occasional pre-session or post-session spelling tips
- An optional "Welsh spelling basics" area for beginners
- Contextual pattern tips for `ll`, `dd`, `f` vs `ff`, `ch`, `rh`, and `w` / `y` as vowels
- Simple Welsh alphabet observations, including that some English letters are uncommon or non-native in Welsh
- Optional audio examples for Welsh digraph sounds
- A future progressive path for beginner spelling foundations, if demand becomes clear

Implementation guidance:

- Tips should remain visually subtle and consistent with Spelio's calm, minimal, adult-focused design philosophy.
- Users should be able to dismiss or disable tips.
- Tips should feel like useful observations, not lessons.
- Avoid popups on every session, gamification, classroom framing, or tutorial-heavy UX.
- The feature should support spelling confidence without turning Spelio into a grammar course.

## Optional Sentence Moments

Spelio may eventually offer rare, optional full-sentence practice moments, but these should not become normal word-list practice or shift the product toward a full Welsh course.

The preferred future model is occasional "Sentence Moments": one short, curated Welsh sentence offered after a learner has completed a meaningful number of lists, a stage, or another natural milestone. These should appear at the end of a normal session as a skippable bonus, for example:

> Want to try a real Welsh sentence using words you've learned?

They should not appear at the beginning of sessions, where they could raise cognitive load before the core spelling loop or make Spelio feel more course-like.

Product principles:

- Full-sentence practice should remain rare, optional, skippable, and low-pressure.
- Avoid dedicated "sentence word lists" for now.
- Avoid adding a sentence at the end of every mixed practice list.
- Sentence Moments should feel rewarding: a way to help learners realise that individual words and phrases are beginning to connect into real Welsh.
- They may reuse words from recently completed lists, but the content system should not be rigidly redesigned around "every five lists must form a sentence".
- Neighbouring lists should, where practical, include practical reusable vocabulary that can naturally combine into simple phrases and sentences over time.

Content principles:

- Sentence Moments should be stored as a separate curated content type, not generated automatically.
- Do not rely on AI-generated live Welsh sentences because grammar, mutations, dialect, and naturalness need editorial control.
- Sentence Moments should be manually authored and reviewed.

Suggested future data shape:

- `id`
- `title`
- `welshSentence`
- `englishMeaning`
- `audioUrl` / `audioStatus`
- `unlocksAfterListId` or `unlocksAfterStage`
- `usesWordIds` / `usesListIds`
- `difficulty`
- `dialect` / Welsh style applicability, if needed
- `isActive`

This is future-facing only and should not change MVP session generation, list completion, recommendation logic, scoring, difficult words, recap, or the current word-list structure.

## AI Integration Philosophy

Spelio should treat AI as an enhancement layer around the core spelling and recall engine, not as a replacement for the focused practice experience.

The product’s long-term strength may come from:

- structured recall practice
- spelling confidence
- calm repeatable interaction loops
- lightweight reinforcement
- carefully designed progression
- focused review systems

rather than from open-ended conversational tutoring alone.

Future AI usage should prioritise:

- adaptive spelling-pattern support
- personalised review suggestions
- learner confusion detection
- contextual spelling explanations
- optional post-answer learning support
- teacher insight systems
- content-generation assistance
- voice spelling and hands-free practice modes

Avoid turning the core product into:

- a generic AI chatbot
- an explanation-heavy tutoring system
- an unfocused conversational language app
- a noisy “AI-first” experience

The core practice loop should remain:
hear → recall → spell → immediate feedback → repeat.

AI should strengthen this loop rather than replace it.

Long-term strategic value may come not only from Welsh content itself, but from the underlying focused spelling-practice engine and interaction model, which could eventually support:

- additional languages
- GCSE revision
- dyslexia-support workflows
- school reinforcement systems
- professional vocabulary practice
- English spelling support
- hands-free spoken spelling practice

Any future AI features should continue supporting Spelio’s existing philosophy of calmness, low friction, learner usefulness, and focused repetition.

## 3. Future analytics and insight ideas

Possible future insight areas:

- Most-triggered spelling hints
- Common learner confusion heatmaps
- Difficult spelling-pattern tracking
- Class-level spelling insight tools
- Anonymous aggregate spelling-pattern analytics

Analytics should be used to improve learner support, content quality, and product decisions. Any future analytics work should stay privacy-conscious and avoid creating pressure-heavy performance tracking for learners.

## Future monetisation directions

Spelio may eventually explore monetisation once the core practice loop, retention, content quality, and learner usefulness have been validated.

Potential future monetisation directions include:

- Premium content packs
- GCSE Welsh revision packs
- Advanced spelling-pattern packs
- School or teacher-created collections
- Teacher tools
- Classroom assignment links
- School licences
- Institutional partnerships
- Synced progress / account-based premium features
- Course-aligned practice packs
- Future speaking or hands-free modes, if they prove valuable and cost-effective

These should remain exploratory until real learner behaviour shows what people value enough to pay for.

Monetisation should not distort the core product philosophy.

Avoid:

- Paywall anxiety too early
- Manipulative engagement systems
- Excessive dashboarding
- Artificial scarcity
- Noisy upsells
- Feature bloat created mainly to justify pricing

The guiding principle should be:

> Monetisation should follow demonstrated usefulness, not lead the product.

## Future custom and teacher list practice controls

Spelio Core should remain opinionated, guided, calm, and progression-oriented. Core lists should keep using short adaptive sessions that continue where the learner left off, with the app doing the quiet work underneath.

Custom, personal, and teacher-created lists may need more direct control because they serve practical classroom, homework, revision, and spelling-test needs.

Future custom lists should support a simple practice mode choice:

- Adaptive practice: short focused sessions that continue where the learner left off.
- Full list: practises the whole list in one go, useful for spelling tests, classrooms, homework, or teacher-created lists.

Teacher-created lists may eventually need optional advanced settings, such as:

- Full list vs adaptive practice
- Strict/flexible spelling
- English prompt visibility
- Audio prompt availability
- Reveal enabled/disabled
- Audio replay allowed/disabled
- Randomise order
- Require audio
- Assessment/test-style mode
- Possibly time limits later

These controls should be hidden behind progressive disclosure such as "Advanced settings". They should not clutter the normal learner experience or make Spelio Core feel configurable for its own sake.

The interface should remain simple on the surface and deep underneath. Learners should not be shown unnecessary mechanics.

## Future accessibility foundations

Spelio should aim to become accessible by default rather than creating a separate “accessibility mode” as the main solution. The normal public app should remain calm, premium, minimal, and adult-focused while quietly improving technical accessibility underneath.

Accessibility should not mean making the interface visually loud, oversized, childish, or ugly. The current subtle design direction can remain, provided it meets practical accessibility requirements such as readable contrast, visible focus, usable touch targets, scalable text, and clear interaction states.

Dark mode is useful, but it is only one part of accessibility. Future accessibility work should prioritise:

- Semantic HTML for buttons, inputs, dialogs, headings, navigation, and main content regions
- Proper labels and accessible names for icon-only buttons
- Logical keyboard navigation and visible focus states
- Modal focus trapping and Escape-to-close behaviour where appropriate
- Screen-reader-friendly status messages using appropriate live regions
- Colour contrast testing across light and dark themes
- Support for browser zoom, text scaling, and small-screen layouts
- Respect for `prefers-reduced-motion`
- Sufficient touch target size while preserving the refined visual design
- Audio-driven practice that still provides enough visual support and graceful audio-unavailable states

This should be treated as good frontend engineering, not a separate design direction or a step backwards from modern React development.

Future optional preferences may include high contrast or reduced motion controls if testing shows they are genuinely needed. However, the preferred approach is to make the default Spelio experience accessible, resilient, and inclusive without fragmenting the app into separate accessibility versions.

Suggested future testing checklist:

- Keyboard-only navigation through homepage, practice screen, modals, word list selection, and end screen
- VoiceOver testing on iPhone or macOS
- TalkBack testing on Android
- NVDA testing on Windows where possible
- Lighthouse accessibility checks
- Axe DevTools checks
- Manual colour contrast checks for light and dark themes
- 200% browser zoom testing
- Mobile font scaling testing
- Reduced-motion testing

Accessibility improvements should preserve Spelio’s existing product philosophy:

- calm
- focused
- low-clutter
- adult-oriented
- cognitively clean
- emotionally safe
- spelling-first

They should strengthen the core experience rather than add visual noise or feature bloat.

## 4. Product philosophy reminders

- Avoid feature bloat
- Avoid noisy gamification
- Preserve instant-start UX
- Preserve calmness
- Avoid turning the app into Duolingo
- Prioritise learner usefulness over engagement tricks
- Prioritise spelling confidence over grammar complexity
