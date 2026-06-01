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

### Per-word contextual hints

Spelio may eventually support rare optional per-word contextual hints for unusually confusing spellings. These should be editorial overrides rather than the primary hint system.

Most learner support should still come from generic pattern-aware systems, such as `dd`, `ff`, accents, `w` / `y`, English spelling transfer, and other recurring spelling patterns.

Per-word hints are intended only for edge cases where learners consistently miss a specific hidden, softened, swallowed, or unexpected letter or chunk within a particular word.

Example concept:

- Welsh word `diolch`
- Learners may miss the `l`
- A lightweight contextual hint could quietly suggest: "Listen for the final -olch."

These hints should remain:

- Subtle
- Calm
- Audio-first where possible
- Rare
- Non-intrusive
- Adult-oriented

They should trigger only after clear struggle signals, such as repeated incorrect attempts on the same position, hesitation or a long pause, or repeated replay usage.

Avoid turning the system into handcrafted tutoring, popup-heavy teaching, explanation-heavy phonics instruction, or verbose educational overlays.

The long-term goal is for Spelio to feel intelligently supportive underneath while remaining visually simple on the surface.

## Adaptive replay and assisted listening

Spelio should explore assisted listening as a future direction for replay audio and reveal behaviour.

The product should not solve uncertainty primarily through visual answer exposure. It should quietly help learners hear Welsh more clearly before encouraging full Reveal.

Preferred support hierarchy:

1. Replay
2. Assisted replay
3. Reveal

Current direction:

- Replay may evolve into a layered listening-support system.
- Replay may become progressively more helpful during repeated use on the same word.
- Future replay assistance may include subtle slowing, chunk emphasis, small natural pauses, or clearer rhythmic separation.
- The goal is to preserve natural Welsh rhythm while improving auditory decoding.
- Reveal should remain available, but should not become the default easiest escape route.
- The interface should remain visually simple even if replay becomes more intelligent underneath.

UX principles:

- Avoid robotic slowed-down phonics audio.
- Avoid over-teaching syllables.
- Avoid classroom-feeling pronunciation drills.
- Avoid tutorial-heavy explanation around replay.
- Replay support should feel natural and lightweight.
- Learners should feel: "Oh, I can hear it now."
- Learners should not feel: "The app is teaching me phonics."

Lightweight behavioural guidance:

- Spelio may later add tiny inline hints encouraging replay before reveal.
- If a learner repeatedly uses Reveal quickly, the app may gently encourage another listen first.
- Guidance should be non-intrusive and should use existing quiet UI areas where possible.
- Do not add modal warnings, punitive systems, forced listening gates, or friction-heavy anti-reveal behaviour.
- The same contextual audio-guidance pattern may later support carefully throttled sound-pattern guidance, such as CH/K confusion, but this should require stronger evidence than a single mobile typo and should remain audio-first, rare, and non-intrusive.

Future AI / TTS direction:

- Improving TTS and AI voice tooling may eventually allow smarter replay assistance.
- Future systems could potentially support adaptive chunk replay, sound-aware replay, context-aware emphasis, or learner-specific replay assistance.
- These should only be explored when audio quality supports them naturally.
- Current implementation should remain lightweight and technically practical.
- Advanced replay systems should still preserve Spelio's calm, minimal, adult-focused philosophy.
- Spelio should avoid becoming a full phonics-analysis engine.

Experimental ElevenLabs audio direction:

- Spelio is now exploring ElevenLabs as a premium generated-audio layer.
- Direct ElevenLabs Welsh TTS is often preferred for naturalness, warmth, and voice quality.
- Azure remains valuable as a pronunciation fallback and rescue route, especially when direct generation struggles.
- The current preferred workflow is direct ElevenLabs generation from Welsh text, followed by review or spot-checking.
- Problematic words may be regenerated directly, improved with a per-word `elevenLabsPronunciationHint`, or regenerated using Azure pronunciation via Azure -> ElevenLabs speech-to-speech.
- Pronunciation hints should be used for specific problem words before falling back to Azure transform where appropriate.
- WY words should be flagged or visually highlighted for careful audio review, but should not automatically be forced to Azure transform.
- Azure should not be assumed as the default source for every ElevenLabs file.
- Per-word metadata may track `elevenLabsGenerationMode`, `preferredElevenLabsGenerationMode`, `elevenLabsPronunciationHint`, and audio review status.
- Current generation modes are `direct` and `azure_transform`.
- Direct generation should use Eleven v3, Welsh language override, a configured voice ID, and stable conservative settings.
- Final ElevenLabs MP3s should pass through the same gentle loudness-normalisation and post-processing approach where practical, so direct and Azure-transform files have similar perceived volume.
- The current preferred experimental voice ID is `aHCytOTnUOgfGPn5n89j`; previous tested reference IDs are `G7ILShrCNLfmS0A37SXS` and `DikmR0aoFXAp1A3NcovW`.
- Voice IDs should remain configurable rather than hardcoded throughout the app.
- The workflow should remain admin-only and should not add learner-facing audio complexity.
- This should remain a pragmatic hybrid experiment and should not imply that ElevenLabs replaces trusted human recordings or makes Azure obsolete.

## Welsh pronunciation and listening discovery pages

Spelio may later create a small number of carefully curated public pages for high-value Welsh pronunciation and listening searches. These should be selected deliberately, not mass-generated, and should exist to help learners and curious searchers hear Welsh clearly.

Candidate page types may include:

- Welsh sound and spelling-pattern pages such as `ll`, `dd`, `ch`, `rh`, `ff`, `w`, and `y`
- High-confusion Welsh words such as `Cymru`, `iechyd`, `diolch`, `llaeth`, and `chwech`
- Selected Welsh place names where pronunciation search intent is strong, such as `Llandudno`, `Llanelli`, `Caernarfon`, `Aberystwyth`, and `Rhyl`
- Selected Welsh personal names where pronunciation and spelling questions are common, such as `Rhys`, `Gwyn`, `Gwen` / `Gwên`, `Carys`, `Llyr`, `Dafydd`, and `Siân`

The purpose should be to make Spelio a trusted, calm, useful place to hear Welsh clearly, not to create SEO content at scale. Trusted Welsh voice recordings are a key differentiator here.

These pages should be audio-first, lightweight, beautifully presented, and aligned with Spelio's calm adult-oriented tone. Each page should provide genuine usefulness, such as:

- Clear Welsh audio
- A short pronunciation or spelling-pattern note
- Optional related pattern links
- An optional gentle CTA into Spelio practice

Future Welsh place-name pages could combine trusted Welsh voice pronunciation, a spelling breakdown, pronunciation guidance, links back to relevant Foundations patterns such as LL, CH, RH, W, Y, and AE / AI, and an optional short cultural or location note where appropriate. The goal would be to help people understand why Welsh place names are pronounced and spelled the way they are, while gently connecting that understanding to relevant Foundations practice.

Future Welsh personal-name pages could similarly include trusted Welsh pronunciation, a spelling explanation, common learner confusions, relevant spelling-pattern links, and optional notes on accents or meaning where appropriate. These pages should be especially careful, respectful, and human-sounding, because names carry personal and cultural weight.

Search demand should guide page selection using evidence such as Google Search Console, Google autocomplete, Google Trends, and/or SEO tools.

Early manual Google autocomplete and search observations suggest real search interest around Welsh pronunciation, digraphs, orthography, sound-pattern questions, high-confusion words such as `Cymru`, and selected Welsh place-name pronunciation such as Llandudno and Snowdon. Future research may also assess demand around searches such as "how to pronounce [Welsh place name]", "how to pronounce [Welsh name]", "Welsh name pronunciation", and "Welsh place-name pronunciation". This supports the future direction of carefully curated pronunciation and listening pages, but does not justify mass-generated pages or broad SEO expansion.

Avoid thin content, AI-generated page farms, generic vocabulary pages, manipulative SEO tactics, or bloated blog-style content.

SEO value should come from genuine usefulness, not volume. These pages should remain carefully curated, high-trust, audio-led, calm, useful, adult-oriented, and visibly connected to Spelio's Foundations model.

This should remain future-facing until real search demand, audio quality, and learner usefulness justify implementation.

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

## Future curriculum architecture direction

Spelio's educational direction is increasingly closer to:

> a carefully designed Welsh spelling mastery system

than:

> an endless vocabulary-practice platform.

This should not be read as a choice between a tiny finite course and an endless vocabulary catalogue. The strongest current model is:

`Learn`

A short, carefully designed path for Welsh spelling confidence.

`Practise`

A broad, expandable library for continued spelling reinforcement.

The key product distinction is:

> The learning path is finite. The practice library can be expansive.

Future curriculum planning should keep asking:

> What is the minimum amount of carefully designed practice required to make a learner genuinely confident at Welsh spelling?

The goal is not maximum content volume, endless word lists, vocabulary inflation, or artificially extending the learner journey. The goal is educational efficiency, transferable pattern recognition, Welsh decoding confidence, Welsh spelling confidence, and practical writing confidence.

Progression quality should be prioritised over content quantity. A carefully designed progression path may contain significantly fewer words than a traditional course while producing stronger spelling outcomes.

Current curriculum architecture:

- Learn: a short, finite, carefully designed Welsh spelling confidence path.
- Practise: a broad, expandable practice library.
- Advanced Topics: future optional deeper material.

Learn mainly contains Welsh Foundations and any tightly curated representative practice needed to make those foundations feel useful and transferable. It may include D / DD, Y, F / FF, W, CH, LL, RH, AI / AE, WY / YW subject to future validation, mixed confidence recap, and carefully selected Applied Welsh examples where they help prove transfer. Its goals are decoding confidence, listening confidence, pattern familiarity, reduced intimidation, and practical spelling confidence. It should remain highly curated and intentionally compact.

Practise may include numbers, time, food and drink, places, Welsh place names, travel, common actions, common phrases, messaging, everyday written Welsh, GCSE practice, teacher-created lists, custom lists, expanded topic libraries, and vocabulary learners recognise from Duolingo, SaySomethinginWelsh, Welsh classes, school, or everyday Welsh life. Applied Welsh is not a fixed second course layer: it can appear as representative practice inside Learn where it helps prove foundations transfer into real Welsh, and it can also grow as broader optional practice. Learners should not need to complete exhaustive Applied Welsh collections before moving forward.

## Topic collections and school alignment

While Spelio's core learning path may remain deliberately short and focused on Welsh spelling foundations, broader topic collections continue to have significant value. Topic collections such as numbers, time, food and drink, places, travel, everyday actions, common phrases, animals, GCSE topics, and curriculum-linked vocabulary are useful not only for independent learners, but also as potential school and teacher resources.

Teachers often teach Welsh through themes and topics, and may naturally want spelling practice aligned with the topic currently being covered in class, such as food and drink week, numbers work, local area studies, Welsh place names, travel vocabulary, or GCSE revision themes.

This reinforces the distinction between Learn as the finite Welsh Foundations path and Practise as the broader topic-based practice library. Topic collections can support learner reinforcement, confidence building, familiar vocabulary practice, Duolingo / SSiW overlap, classroom support, homework, revision, and teacher recommendations.

The existence of a finite Foundations path does not reduce the value of broader topic collections. The two systems should complement each other.

Advanced Topics are future optional deeper material, not a required third curriculum stage. They may eventually include mutation awareness, accents, tricky spellings, subtle spelling distinctions, similar-looking words, advanced listening, advanced orthographic confidence, and advanced decoding confidence.

Mutations are important for Welsh spelling confidence, but they should not pull Spelio into becoming a full Welsh grammar course. They may later be introduced as optional advanced spelling-recognition or writing-confidence topics. Possible future framing includes recognising Welsh mutations, common mutation spelling patterns, and mutation awareness for spelling confidence. Spelio may support those areas without claiming to teach all mutation rules comprehensively.

This direction should not redesign MVP behaviour, introduce dashboards, introduce gamification, introduce formal course trees, introduce compulsory progression gates, or remove existing content systems.

## Progression path and practice layer

Future product thinking should separate the progression path from the practice layer.

The progression path should be finite, curated, intentional, and mastery-oriented. Learners should feel:

> I am progressing through a carefully designed journey.

Progression should remain visually simple and understandable. It should include Welsh Foundations, carefully selected representative practice, mixed confidence milestones, and just enough required exposure for learners to understand the pattern and feel ready to move on. It should be recommendation-friendly, teacher-friendly, emotionally achievable, and not artificially extended. The learner should be able to complete it.

The practice layer may become broader, revisitable, expandable, and potentially very large. It may include additional words for a pattern, additional numbers, time, food and drink, places, Welsh place names, travel, everyday actions, common phrases, Duolingo- or SSiW-aligned vocabulary, GCSE practice, teacher-created lists, custom lists, expanded topic libraries, and adaptive practice.

The practice layer exists to reinforce learning, not define the required curriculum.

Pattern mastery principle:

- Learners should receive only enough required practice to become confident with the underlying spelling mechanic.
- Additional practice should remain available but optional.
- Progression should not require exhaustive repetition once confidence is demonstrated.
- The educational goal is mastery of the pattern, not exposure to every possible example.

Large collections should have a short representative core path and optional expanded practice. For example, Numbers should teach the structure and spelling feel of Welsh numbers through a selected core set, then offer many additional numbers for learners who want more repetition. Learners should not need to spell every number from 1-100 before moving on.

End-screen progression should preserve forward motion. After completing a representative core list, the learner may be offered:

- Continue learning →
- Practise more in this topic →

Avoid hard gates, forced completion of large collections, or UI that makes learners feel they have thousands of words left before they are "done".

Word-list UI should avoid using large raw completion counters such as `52 / 200 complete` when they make Spelio feel endless. Prefer calmer language such as:

- Core complete
- Practise more
- Additional practice available
- More words in this topic

Mixed confidence lists may become important future milestones:

- Mixed Confidence — Foundations 1
- Mixed Confidence — Foundations 2
- Mixed Confidence — Foundations 3

Their purpose should be integrated decoding confidence, transfer between learned systems, and emotional proof that Welsh is becoming readable and spellable.

## Voice spelling and hands-free input mode

Spelio may eventually support an optional hands-free spelling mode where learners hear the Welsh prompt and then spell the answer aloud letter by letter.

This should be treated as an alternative input method, not as pronunciation practice, conversational AI, or whole-word dictation. The learner should not simply repeat the Welsh word back. The educational value comes from recalling the spelling and committing the letters verbally.

Potential use cases:

- Walking practice
- Low-dexterity or accessibility support
- Visually reduced interaction
- Hands-busy situations
- Calm review away from a keyboard
- Classroom or shared-device variation

Preferred interaction model:

1. Spelio plays the Welsh audio.
2. The learner says the spelling aloud, for example "d d y d d".
3. The system records one short utterance for the whole answer.
4. Speech recognition converts the utterance into likely letters.
5. Spelio parses the result as a constrained spelling attempt and compares it with the target answer.
6. Feedback remains calm, with retry/replay rather than harsh correction.

Important product principles:

- Keep this optional and separate from the default keyboard experience.
- Do not add a microphone button or voice clutter to the MVP keyboard.
- Do not replace the tactile typing flow.
- Do not turn Spelio into speaking assessment or pronunciation scoring.
- Avoid per-letter live upload/check interactions if they feel slow or brittle.
- Prefer whole-answer voice spelling attempts.
- Preserve the existing calm, adult-oriented emotional tone.
- Support the core hear → recall → spell philosophy.

Technical notes:

- Future implementation could use Welsh-capable speech recognition, likely Azure Speech-to-Text given Spelio's existing Azure audio direction.
- The parser should be constrained because Spelio already knows the expected answer.
- It may need to handle English and Welsh letter names, repeated letters, digraphs such as `ch`, `dd`, `ff`, `ll`, `rh`, `th`, and `ng`, apostrophes, spaces, and accented characters.
- Recognition ambiguity is likely the main challenge, not audio upload speed.
- The feature should require careful prototype testing before being treated as a committed roadmap item.

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
- Separate assessment controls such as allowManualReplay, allowReveal, allowEnglishReveal or allowPromptReveal, and audioPromptsOnStart
- Randomise order
- Require audio
- Assessment/test-style mode
- Possibly time limits later

For normal practice, audio prompts off should mean no automatic audio, not no manual replay. Stricter replay/reveal limits should belong to future assessment or teacher-shared modes rather than changing the normal learner setting.

These controls should be hidden behind progressive disclosure such as "Advanced settings". They should not clutter the normal learner experience or make Spelio Core feel configurable for its own sake.

The interface should remain simple on the surface and deep underneath. Learners should not be shown unnecessary mechanics.

## Custom keyboard and guided spelling interaction exploration

Spelio explored several possible input directions for Welsh spelling practice:

- fully adaptive Welsh spelling trays
- reduced letter-choice or sequential guided spelling interactions
- contextual chunk rows
- a custom QWERTY-style touch keyboard
- Welsh digraph shortcuts

The main product conclusion is that fully adaptive spelling trays became too complex for the core adult product. They risk:

- answer leakage
- inconsistent behaviour
- reduced spatial familiarity
- slower input for confident users
- excessive cognitive complexity
- a more game-like or educational-tool feeling

Sequential guided-choice spelling may still be valuable in future for:

- younger learners
- schools
- public challenge or event modes
- accessibility
- dyslexia support
- beginner listening-focused practice

However, sequential guided-choice spelling is not currently recommended as the default adult or core practice interaction because it:

- slows confident users
- reduces fluent typing flow
- may feel too multiple-choice or overly guided
- may be less appealing to serious adult and GCSE learners who prefer fast recall-to-typing flow

The strongest near-term direction for the core product became:

> a custom mobile/tablet QWERTY-style keyboard with a stable Welsh digraph shortcut row.

Current preferred keyboard direction:

- Preserve normal QWERTY familiarity.
- Keep fast confident typing flow.
- Use a calm custom touch keyboard on mobile and tablet.
- Include a stable, always-visible Welsh digraph row: `CH DD FF NG LL PH RH TH`.
- Keep the digraph row non-contextual and non-predictive so it does not leak answers.
- Support hold-for-accent where practical.
- Avoid adaptive, predictive, or context-aware chunk rows for the core practice keyboard.
- Avoid turning the keyboard into a phonics engine, game mechanic, or guided-answer system.

The key principle is:

> The core adult Spelio practice experience should preserve fast hear → recall → type flow. More guided or simplified keyboard modes may be explored later as optional modes or separate school, event, or challenge experiences, not as the default core interaction.

## Future classroom spelling-test identity and pupil progress

Future teacher spelling-test tools may need to track pupil progress over time, especially for classroom tests, homework, revision, and school reporting. This should remain a later, carefully scoped product area and should not change the current public learner flow, MVP practice logic, session generation, scoring, recommendations, or existing learner experience.

The guiding principle should be reliable classroom progress tracking with the least necessary pupil-identifying data.

Spelio should avoid asking pupils to type arbitrary names every time they start a test. Free-text names create unreliable tracking because of typos, nicknames, joke entries, fake names, inconsistent capitalisation, and pupils using slightly different versions of the same name across sessions.

Pupil codes should also be avoided as the main classroom UX. Codes may work in some systems, but they add friction in a live classroom: pupils can lose them, forget them, enter them incorrectly, or require the teacher to shout codes around the room.

Spelio should also avoid collecting dates of birth, birth days, or extra identity-verification details. Those details increase sensitivity and setup friction without meaningfully solving the classroom progress problem.

The preferred future model is teacher-controlled class lists with simple pupil display labels. A teacher creates or imports a class list, using classroom-appropriate labels such as:

- Rhys J
- Rhys M
- Megan C

Pupils would open a class or test link, or scan a QR code, then use a minimal "Start typing your name" field. That field should use autocomplete or predictive matching against the teacher-approved class list. It should not show the full class list upfront by default, because that makes casual selection of another pupil's name too easy.

Pupils should only be able to select a name that already exists on the teacher's class list. Duplicate or similar names should be handled through teacher-controlled classroom labels rather than by asking pupils for stronger personal identifiers. If a test link already belongs to a specific class, autocomplete should search only that class.

Class names may appear where useful for teacher management, especially when a teacher manages multiple classes. The pupil-facing flow should remain minimal and should not make the child reason about class metadata unless it is necessary.

The teacher should own and be able to correct the class list. This keeps progress tracking more reliable than arbitrary typed names, simpler than pupil codes, and less intrusive than collecting stronger identifiers.

Privacy and reporting principles:

- Future classroom reporting should prefer data minimisation, short retention where possible, encrypted storage where practical, and teacher or school control over any pupil-identifying labels.
- Spelio should avoid storing raw typed answers, keystroke logs, or unnecessary long-term pupil histories.
- Any future school reporting feature should be treated as a later, carefully scoped system requiring proper privacy, retention, access-control, and deletion design.

## Future Welsh spelling challenges and events

Spelio may eventually support event-based Welsh spelling experiences without changing the current MVP, normal learner flow, or calm product philosophy.

The key product insight is that Spelio's simple audio-first loop may already be well suited to live shared contexts:

> hear → recall → spell

Because the interaction is focused, quick to understand, and spectator-friendly, future challenge formats could grow naturally from the existing practice system rather than requiring a separate game layer.

Possible future directions:

- The Spelio Challenge
- classroom spelling-test events
- live Welsh spelling challenges
- school spelling challenges
- regional school competitions
- inter-school competitions
- GCSE spelling competitions
- learner spelling challenges
- scheduled online challenge events
- QR-code classroom competitions
- public challenge booths
- side-by-side spelling booths
- spectator-friendly audio spelling
- Welsh listening-and-spelling competitions

These should remain exploratory and future-facing. They should not change MVP session generation, scoring, recommendations, difficult-word review, normal practice settings, or the default individual learner experience.

Product principles:

- Shared challenges should showcase genuine Welsh listening and spelling competence.
- Competition should feel calm, elegant, focused, and skill-based.
- Public or classroom events should use the existing spelling-practice grammar where possible.
- Participation should be optional, not a mandatory social layer.
- The emotional tone should remain premium, respectful, and adult-compatible.
- School uses should support teacher practicality without forcing noisy classroom aesthetics.

Avoid:

- arcade quiz energy
- loud gamification
- leaderboard obsession
- XP, streak, or loot mechanics
- esports-style framing
- childish educational-game presentation
- dopamine-heavy competition systems
- making Spelio multiplayer-first

A good Spelio event should feel closer to a refined Welsh listening-and-spelling challenge than a game show. The pressure, if any, should come from the dignity of trying to spell carefully in a shared moment, not from manipulative reward systems.

## Future practice buddies and baton progression

Spelio may eventually explore calm shared progression between learners without becoming competitive or social-first.

One possible direction is practice buddies or baton progression:

- calm shared progression
- passing the baton between learners
- companionship rather than competition
- mutual encouragement
- light accountability without pressure

This should remain future-facing and exploratory.

Avoid:

- leaderboards
- XP systems
- streak pressure
- mandatory social mechanics
- noisy competition
- gamified peer comparison

The value would be emotional companionship around careful practice, not performance ranking.

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
