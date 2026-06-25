# Spelio Content System Specification v1.0

## 1. Purpose

This document defines how Welsh spelling content should be created, structured, reviewed, and expanded for Spelio.

Spelio is a focused spelling practice app. It is not a full Welsh course. The content system should support short, high-quality spelling sessions that build confidence, accuracy, and recall over time.

This document is intended to be reused whenever new word lists are created, reviewed, or expanded. It should sit in the website source repository so future AI chats, developers, and contributors can follow the same content rules.

---

## 2. Core Content Philosophy

Spelio should prioritise:

1. Progressive spelling difficulty
2. Real-world usefulness
3. Adult-neutral tone
4. Clear list purpose
5. Scalability over time

The key rule is:

> Spelling progression comes first. Language usefulness is a filter, not the main driver.

A word should not be placed early just because it is useful. It should be placed early only if it is useful and spellable at that point in the learner journey.

---

## 3. Product Boundary

Spelio is:

- a spelling practice system
- a recall and accuracy tool
- a practice layer for learners using any course
- suitable for short, repeated sessions

Spelio is not:

- a complete Welsh course
- a grammar course
- a Duolingo-style game
- a child-first literacy app
- a dictionary
- a phrasebook

Content should support spelling practice first. It may reinforce vocabulary and structures, but it should not try to teach the entire language.

Future versions of Spelio may explore context-dependent spelling patterns, for example Welsh mutations, where correct written Welsh depends on neighbouring words. This should remain a spelling-confidence direction, not a comprehensive grammar curriculum. Any future mutation work should be carefully scoped around spelling mechanics, recognition, and written accuracy.

---

## 4. Audience

Primary audience:

- adult Welsh learners
- learners who can recognise or say some Welsh but struggle with spelling
- learners who want practical, calm, focused practice

Secondary possible audiences:

- older children learning Welsh at school
- parents supporting Welsh practice
- teachers using word lists for homework or classroom reinforcement

The core product should remain adult-neutral rather than child-specific.

Avoid:

- childish tone
- excessive school-like framing
- gamified reward language
- patronising learner notes

Prefer:

- useful everyday words
- clear spelling progression
- calm and respectful tone
- content that adults and older children can both use

Child-focused or school-aligned content can be added later as separate word-list packs, not by changing the core product.

---

## 5. Content Catalogue Model

Spelio content should be organised around a clear distinction between:

```text
Learn
    Welsh Spelling Foundations
    Future spelling-awareness topics

Practise
    Topic Collections
    Custom Lists
    Future extension collections

Build
    Building Welsh
    Word Building / Written Welsh Patterns
```

The overall identity is:

> a Welsh written-confidence product built from spelling mastery.

Spelio should not become an endless vocabulary catalogue or a full language course. The content system should keep spelling first while recognising that spelling exists in service of writing.

The main information architecture should be:

```text
Learn / Practise / Build
    Category
        Word List
```

Example:

```text
Practise
    Nature & Animals
        Animals 1
        Animals 2
        Most Common Animals
```

Older abstract stage groupings such as Core, Usage, and Confidence should not be treated as the primary learner-facing catalogue model. Difficulty and progression metadata may still exist internally, but visible structure should favour understandable product areas, categories, and word lists.

### Learn — Finite Spelling Understanding Path

Learn is deliberately finite, curated, and completable.

Purpose: help learners understand how Welsh spelling works.

Current and possible future examples include:

- Welsh Spelling Foundations
- Advanced Recognition, if introduced later
- Mutation Awareness, if introduced later

Learn content may include:

- Welsh spelling foundations such as D / DD, Y, F / FF, W, CH, LL, RH, and future validated vowel or recognition topics
- mixed confidence milestones that combine previously learned spelling systems
- tightly selected representative words where they prove that spelling foundations transfer into real Welsh
- possible future advanced foundations, if they remain spelling-confidence material rather than grammar-course material

Learn should remain compact, recommendation-friendly, teacher-friendly, emotionally achievable, and mastery-oriented. Learners should be able to feel that they have completed a meaningful spelling-confidence journey.

### Practise — Topic Collections, Custom Lists, and Extensions

Practise is the focused spelling-reinforcement layer. Topic Collections are the first Practise catalogue. Custom Lists and future extension collections may expand this area sideways.

Purpose:

- reinforce spelling confidence
- provide broad exposure to useful Welsh vocabulary
- provide representative practice across common topics
- support adult learners, teachers, and GCSE learners

Core Practice should not become an endlessly expanding catalogue. It should offer a coherent core library of useful, representative Welsh spelling practice after Foundations.

Example categories:

- Everyday Welsh
- People & Home
- Food & Drink
- Nature & Animals
- Places

### Build — Short Written Welsh Contexts

Build is a separate future-facing product area for using known spellings in short written Welsh contexts.

Purpose:

- build real written Welsh from familiar words and high-frequency chunks
- connect spelling recall to controlled writing
- introduce context-dependent spelling changes only where they support written accuracy

Build may include:

- Building Welsh
- Word Building
- Written Welsh Patterns
- phrase chunks such as "I can", "I want", "I need", and "I am going"
- short fragments such as "going to work" and "going home"
- word transformations such as "rain" to "rainy" and "work" to "working"
- endings, mutations, and context-dependent spelling changes

Build should remain spelling-first and writing-first. It should not become conversational language learning, a grammar-heavy course, or a Duolingo-style syllabus.

Example list patterns:

- Animals 1
- Animals 2
- Most Common Animals
- Food 1
- Food 2
- Most Common Foods
- Family 1
- Family 2
- Most Common Family Words

These examples are illustrative rather than final curriculum commitments.

Core Practice lists should not be designed around the absolute easiest spellings possible. They should prioritise:

- accessible words
- representative words
- useful words
- recognisable words
- words that fit the topic naturally

while still maintaining sensible spelling progression.

For example, Animals 1 should not be restricted to only the easiest possible animal names. It should contain a balanced set of accessible, representative animal vocabulary appropriate for a learner who has completed Foundations.

The goal is useful spelling confidence, not artificially simplified vocabulary.

### Progression Within Numbered Core Practice Lists

Numbered Core Practice lists should provide meaningful spelling progression.

For example:

- Animals 1 should generally contain words with a lower overall spelling load than Animals 2.
- Family 1 should generally contain words with a lower overall spelling load than Family 2.
- Food 1 should generally contain words with a lower overall spelling load than Food 2.

The distinction should be based primarily on spelling complexity rather than rarity or specialist vocabulary.

Factors may include:

- word length
- number of spelling challenges
- unfamiliar Welsh patterns
- multiple simultaneous spelling features
- accents and diacritics
- apostrophes
- multi-word phrases

Progression should remain moderate. Animals 2 should not become an obscure-vocabulary list.

The goal is accessible progression, not easiest words followed by increasingly rare words. Core Practice collections should remain useful, representative, and adult-appropriate throughout.

### Extension Collections

Extension Collections are optional and intentionally expandable.

Extensions expand sideways into interests, domains, and specialist vocabulary. They should not create an endless ladder of progression.

Examples:

- Welsh Place Names
- GCSE Welsh
- Healthcare Welsh
- Education Welsh
- Tourism Welsh
- Church & Faith
- Welsh History
- Birds
- British Wildlife

Avoid assumptions such as:

```text
Animals 1
Animals 2
Animals 3
Animals 4
Animals 5
```

unless a strong educational reason exists. Prefer meaningful specialist collections with their own identity.

Example:

```text
Animals 1
Animals 2
Most Common Animals

Birds
Farm Animals
British Wildlife
```

### Completion Philosophy

Completion is a meaningful part of the product.

Spelio should not be afraid of learners completing:

- Foundations
- Core Practice

The intended learner experience may be:

> You have completed the core Spelio spelling journey.

followed by:

> Explore additional collections that match your interests.

This is preferable to creating an endless sequence of numbered levels purely to avoid completion.

---

## 6. Difficulty Model

Difficulty should be based primarily on spelling complexity, not semantic meaning.

A word or phrase becomes harder when it includes:

- more letters
- more words
- unfamiliar digraphs
- vowel clusters
- irregular-looking spelling
- accents or diacritics
- apostrophes
- mutations
- capitalisation requirements
- spacing between words
- multiple spelling challenges at once

Difficulty should not be based only on whether the word is common.

For example:

- sori is useful and easy
- os gwelwch yn dda is useful but spelling-heavy
- tŷ is short but includes a diacritic
- yng Nghymru is useful but mutation-heavy

---

## 7. Word Selection Rules

Every word should pass these tests:

1. Is it appropriate for the current spelling stage?
2. Is it useful or recognisable in real Welsh?
3. Does it fit the list’s purpose?
4. Is it not randomly included just to fill space?
5. Does it avoid too many new spelling challenges at once?

If unsure, choose a word that remains accessible for the list's intended point in the journey. Do not choose the absolute easiest spelling if it makes the topic artificial or unrepresentative, and do not choose a highly useful word if it creates too many simultaneous spelling challenges.

---

## 8. List Design Rules

Each list should have:

- clear title
- clear purpose
- coherent theme
- consistent spelling load
- generally 10–25 conceptual learning items
- logical progression
- no random mixing

A list should feel intentionally designed, not like a vocabulary dump.

List size is based on dialect-resolved conceptual learning items, not necessarily raw database rows. A raw word row with no `variantGroupId` counts as one conceptual learning item. Multiple raw word rows sharing the same `variantGroupId` represent dialect variants of one conceptual learning item for ordinary practice and completion.

Spelio-authored lists do not need to contain exactly 10 items and do not need to be multiples of 10. Do not pad, split, or duplicate lists only to create fixed groups of 10.

### Optional list-level primers

Some word lists may include optional primer metadata, especially Welsh Foundations lists that benefit from a brief sound-pattern introduction before practice. Primers belong directly to word lists; do not create a separate primer CMS.

A primer is optional list metadata. Future-compatible conceptual fields may include `primerEnabled`, `primerTitleEn`, `primerTitleCy`, `primerBodyEn`, `primerBodyCy`, and `primerSoundItems`.

`primerSoundItems` may include `label`, `labelCy`, `textToSpeak`, `audioUrl`, `audioStatus`, `audioSource`, and `order`.

Do not create fake word records for primer sound buttons. Import/export should eventually support primer metadata, while existing content import remains safe and backwards-compatible. If the current importer cannot import primers yet, curriculum JSON may hold primer drafts as non-imported editorial metadata.

Good list types:

- First Words — Simple Welsh
- Spelling Focus — LL
- Short Phrases — Going Somewhere
- Mutation Pattern — tref, as future optional content
- Food & Drink — Essentials

Weak list types:

- Random Useful Words
- Hard Welsh Words
- Mixed Phrases 1
- Things to Know

Mixed lists are allowed only when they serve review or consolidation.

---

## 9. Core Practice Word Selection

Core Practice lists should prioritise words learners will actually encounter.

Good categories:

- essential verbs
- people and family
- food and drink
- home and places
- time words
- weather
- everyday adjectives
- common function words
- common objects
- school/work basics

Do not over-prioritise child-like categories early unless they are useful for broader learners.

Animals, colours, and classroom vocabulary can be useful, but they should not dominate the earliest content unless the specific pack is school-focused.

---

## 10. Pattern-Based Spelling Lists

Pattern-based lists are central to Spelio.

They should help learners internalise Welsh spelling patterns through repeated exposure.

Examples:

- Spelling Focus — LL
- Spelling Focus — CH
- Spelling Contrast — D vs DD
- Spelling Contrast — F vs FF
- Vowel Patterns — WY
- Vowel Patterns — AE
- Vowel Patterns — OE

Rules:

- keep the pattern clear
- avoid mixing too many patterns
- use practical real words
- keep list size manageable
- order from easier to harder where possible

Pattern lists should feel like useful practice, not phonics worksheets.

---

## 10.1 Spelling Pattern Hint Guidance

Spelio may use generic spelling pattern hints during practice to help learners connect Welsh sounds with Welsh spelling patterns.

These hints are primarily app-level behaviour, not manually authored content.

Content authors should normally rely on the generic hint registry rather than writing per-word spelling hints.

Content-authoring note:

Some early-stage words may be selected because they create a useful spelling discovery, not because they are objectively easy. Where a word introduces a high-value Welsh spelling pattern, it may be suitable for generic pattern hints, including future proactive listening hints triggered by hesitation or repeated audio replay. This should not require routine per-word hint authoring. Prefer using the generic hint registry unless a specific reviewed override is genuinely needed.

Pattern hints should:

- support common Welsh spelling patterns
- be short and calm
- avoid turning the app into a phonics course
- avoid absolute pronunciation claims where dialect or word-level variation exists
- avoid revealing the full target answer unnecessarily
- support spelling awareness rather than grammar explanation

High-value hint patterns may include:

- dd
- f
- ff
- ll
- ch
- rh
- ng
- ngh
- ae
- ai
- au
- ei
- eu
- oe
- wy
- Welsh w functioning as a vowel
- Welsh y functioning as a vowel
- rare English-letter habits such as k, q, v, x, z

Vowel and diphthong hints should be especially cautious.

Prefer awareness wording such as:

- “Listen closely to the wy sound.”
- “Welsh w can sometimes act like a vowel.”
- “Welsh y can sometimes act like a vowel.”

Avoid oversimplified wording such as:

- “w sounds like o”
- “y always sounds like…”
- broad pronunciation rules that may vary by dialect, stress, position, or word

Optional word-level controls:

Word records may optionally support:

- spellingHintId
- disablePatternHints

These fields should normally be empty or omitted.

Use spellingHintId only when:

- a specific reviewed hint should be forced for a word
- the generic hint registry is not sufficient
- the item has been linguistically reviewed or is high confidence

Use disablePatternHints only when:

- a generic hint would be misleading for this word
- pronunciation or spelling behaviour is exceptional
- dialect or usage variation makes the generic hint unsafe
- the word should be excluded from pattern hints until reviewed

Do not use these fields as a routine content-authoring burden.

Do not create bespoke hints for every word.

Do not duplicate generic hint wording inside usageNote, dialectNote, or notes.

Relationship to usageNote:

- usageNote remains for practical usage guidance, not live spelling-pattern hints.
- Do not use usageNote to explain every spelling pattern.
- If a spelling issue can be handled by the generic hint system, prefer the generic hint system.
- usageNote must still not reveal the exact target answer during active spelling.

Relationship to notes:

- notes may be used internally to flag uncertainty about whether a word should disable pattern hints or use a specific spellingHintId.
- notes should not become a hidden second hint system.

---

## 11. Phrase-Based Lists

Phrase lists should use short, practical chunks.

Early phrase lists should usually be 2–3 words.

Good phrase patterns:

- going home
- going out
- coming back
- drinking water
- learning Welsh
- want coffee
- need help

Phrase lists should reinforce:

- spacing
- common structures
- useful real-world language
- repeated spelling patterns

Avoid early:

- long formal phrases
- full sentences
- several mutations in one list
- phrases that are useful but too spelling-heavy for the list's intended point in the journey

---

## 12. Sentence Lists

Sentences are useful, but they should appear later.

Rules:

- introduce after strong word and phrase foundations
- keep short
- keep practical
- avoid multiple grammar burdens at once
- use familiar vocabulary where possible

Good examples:

- Dw i’n mynd adref
- Dw i’n dysgu Cymraeg
- Mae hi’n bwrw glaw

Poor early examples:

- long formal sentences
- sentence forms with several mutations
- grammar-heavy constructions

---

## 13. Mutation Strategy

Mutations are essential in Welsh, but they should not be an early burden.

### Early content

Avoid requiring learners to understand or predict mutations.

Use mostly base forms and simple phrases.

### Mid-journey content

Introduce mutations inside fixed, common phrases.

The learner should be able to practise the spelling without needing a full grammar explanation.

### Later or advanced content

Introduce mutation pattern lists.

The pattern should be visible through repetition and contrast.

### Mutation content principle

Spelio teaches mutation spelling through pattern recognition, not grammar lectures.

---

## 14. Mutation List Design

A mutation list should usually focus on one of:

- one base word across contexts
- one mutation trigger across several words
- one contrast pattern

Good structures:

### Same base word

- tref
- y dref
- i’r dref
- yn y dref

### Same trigger

- fy nhad
- fy mrawd
- fy nghar
- fy ngwaith

### Contrast

- Cymru / Nghymru
- tref / dref
- pont / bont
- car / nghar

Rules:

- avoid too many unrelated words
- avoid multiple mutation systems in one beginner mutation list
- keep usage notes minimal
- do not explain full rules inside usageNote

---

## 15. Dialect Strategy

Welsh dialect variation should be respected without breaking the spelling UI.

Dialect should be handled at word/item level, not only list level.

Reason:

- a list may be mostly universal but contain a few dialect-sensitive items
- dialect variants may have different lengths
- the app renders answer slots before typing, so it must know the target spelling first

Use separate items for different-length dialect variants.

Example:

- nawr — South Wales / Standard
- rwan — North Wales

Spelio teaches Mixed Welsh by default and exposes a quiet Welsh style setting with three options: Mixed Welsh, North Wales, and South Wales / Standard. The setting is stored as `dialectPreference`, defaults to `mixed`, and older local storage without the field should default safely to `mixed`.

Dialect preference affects word-level variant selection only. It must not affect word-list visibility. List-level dialect is internal/admin metadata only and should not appear as public badges beside word lists.

Where meaningful dialect variants exist, a `variantGroupId` counts as one conceptual learning item for ordinary practice and completion. Normal sessions choose at most one variant from each `variantGroupId`. Mixed Welsh may rotate or balance variants over time where possible, but should not show both variants from the same group in the same ordinary session and should not require learners to complete every dialect variant. North Wales and South Wales / Standard preferences are soft preferences: if the preferred variant is missing, use a `Both` item where available or the best available single variant rather than shrinking the session.

Dialect variants should not inflate list length, session length, or public completion requirements. A list should not appear incomplete merely because a learner has not completed an unselected dialect variant.

Do not handle different-length dialect forms as acceptedAlternatives.

---

## 16. Dialect Fields

Each word may include:

- dialect
- dialectNote
- variantGroupId

Recommended dialect values for Welsh:

- Both
- North Wales
- South Wales / Standard
- Standard
- Other

dialectNote should explain regional form briefly.

dialectNote should be included when:

- a real regional alternative exists
- the learner may encounter another form elsewhere
- the Welsh style setting may surface another variant in future sessions
- the answer belongs clearly to North Wales, South Wales, Standard Welsh, or another defined variety

dialectNote should not be used for:

- general usage guidance
- formality
- grammar
- generic comments like "Welsh word"
- duplicating usageNote

If a note mentions regional variation, it belongs in dialectNote, not usageNote.

Learner-facing notes must not reveal the exact target answer currently being practised.

For the Welsh MVP:

- englishPrompt may contain English.
- welshAnswer is the target spelling.
- usageNote and dialectNote must not contain the exact welshAnswer.
- usageNote and dialectNote may mention English meanings, opposite dialect variants, fuller or shorter alternative forms, and regional equivalents, provided they do not reveal the exact answer being tested.

If a note would need to name the exact target answer to be useful, either:

- rewrite it without the exact answer
- put the explanation in internal notes
- show it only after the answer has been completed, if the product later supports post-answer notes

Example:

```json
{
  "answer": "rwan",
  "dialect": "North Wales",
  "dialectNote": "North Wales form."
}
```

dialectNote must not duplicate usageNote.

Examples:

If the learner is spelling "isio coffi":

Bad:

- North Wales form using isio.
- Shorter spoken form: isio.

Good:

- South Wales commonly uses eisiau.
- Shorter spoken form.

If the learner is spelling "eisiau coffi":

Bad:

- Standard form using eisiau.

Good:

- North Wales commonly uses isio.
- Fuller standard form.

When creating meaningful dialect variants:

- Create separate word entries for each variant.
- Use the same English prompt.
- Give each variant its own Welsh answer.
- Keep different-length dialect variants as separate word items, not acceptedAlternatives.
- Variants can have different difficulty values.
- Add the correct dialect value.
- Add a short dialectNote where useful.
- Link the entries with the same variantGroupId.
- Ensure each variant has its own audio matching the exact Welsh answer.
- Ordinary sessions should not show both variants from the same variantGroupId.
- Ordinary completion should count the selected/resolved variant as completion of the conceptual learning item.

Example:

```json
[
  {
    "englishPrompt": "now",
    "welshAnswer": "nawr",
    "dialect": "South Wales / Standard",
    "dialectNote": "South Wales / standard form.",
    "variantGroupId": "now"
  },
  {
    "englishPrompt": "now",
    "welshAnswer": "rwan",
    "dialect": "North Wales",
    "dialectNote": "North Wales form.",
    "variantGroupId": "now"
  }
]
```

---

## 17. Strong usageNote Strategy

usageNote is optional and learner-facing.

It should be rare and high-value.

usageNote should normally be omitted unless a mandatory learner-confusion trigger applies.

### Mandatory usageNote triggers

A usageNote MUST be included when any of the following apply:

- The English prompt maps poorly onto Welsh.
- A direct one-word translation would be misleading.
- The Welsh form depends heavily on grammatical context.
- The word or phrase is a response form rather than a simple vocabulary item.
- The learner is likely to overgeneralise from the prompt.
- The item is a shortened, colloquial, formal, or fixed expression.
- The Welsh answer is useful but not the only common way to express the prompt.
- The item involves a common learner trap that can be explained briefly without teaching a full grammar lesson.
- The prompt is deceptively simple, such as "yes", "no", "with", "want", "you", "here", "there", "please", or "sorry".

### Pedagogical risk principle

Learner-facing notes should prevent likely misunderstanding. They should not add trivia. If a note does not make the learner more confident, more accurate, or less likely to misuse the item, omit it.

### Usage note purpose categories

These are NOT separate schema fields.

The content creator may use these categories to decide what kind of usageNote is needed, but they should still write only one short `usageNote` field:

- Response behaviour — for items like yes/no where Welsh depends on the preceding question.
- Register — formal, informal, polite, colloquial.
- Form length — short form, fuller form, common expansion.
- Context — where the word/phrase is normally used.
- Common mistake — a likely learner misunderstanding.
- Grammar-light clarification — a brief explanation where grammar affects usage, without turning the app into a grammar course.
- Fixed expression — where the phrase should be learnt as a chunk.

Do not expose these categories as separate learner-facing fields in the MVP.

Use usageNote for:

- informal vs formal
- fuller vs shorter forms
- spoken vs written nuance
- practical usage hints

Do not use usageNote for:

- dialect information
- grammar teaching
- long explanations
- generic filler
- information already in dialectNote
- the exact target answer currently being practised

Good usageNote examples:

- Informal. Fuller form: “Mae’n ddrwg gen i”.
- Formal/polite; often shortened in speech.
- Can be expanded to “diolch yn fawr”.
- Welsh has several forms of ‘yes’; this is a simple general form.
- Welsh has several forms of ‘no’; this is a simple general form.

Bad usageNote examples:

- Commonly used in everyday Welsh.
- This is a soft mutation after the preposition i.
- North Wales form of the word.
- This means “thank you”.
- Shorter spoken form: isio. (when the target answer is "isio coffi")
- This means yes.
- This means no.
- Common word.

For `englishPrompt: "yes"` and `welshAnswer: "ie"`:

Good usageNote:

- Welsh has several forms of ‘yes’; this is a simple general form.

For `englishPrompt: "no"` and `welshAnswer: "na"`:

Good usageNote:

- Welsh has several forms of ‘no’; this is a simple general form.

Do not imply that ie/na answer every yes/no question in Welsh.

Recommended length:

- one short line
- usually brief and concise

Prefer no note over a low-value note.

---

## 18. notes Field

The notes field is internal/admin-facing.

It may be used for exceptional cases such as:

- uncertainty flags
- review comments
- audio/pronunciation reminders
- future correction notes
- source comments
- occasional AI regeneration guidance
- note purpose/category for editors when needed for review

Internal notes may be longer than usageNote or dialectNote, but must not be shown to learners.

notes is optional and should be used for exceptional cases only. Do not require notes, populate notes routinely, or use notes as a second hidden teaching system. Prefer leaving notes empty unless there is a clear editorial reason.

---

## 19. acceptedAlternatives Rules

acceptedAlternatives should be used sparingly.

Allowed uses:

- same-slot spelling or formatting tolerance
- apostrophe variation if slot structure is compatible
- rare equivalent spellings with the same practical answer shape

Do not use acceptedAlternatives for:

- different-length dialect variants
- mutation variants
- different grammatical forms
- different phrase structures

Different-length variants should be separate word items with variantGroupId.

Meaningful dialect variants should always be separate word entries linked by variantGroupId, especially when they have different spellings, different lengths, or different audio.

Dialect variants may appear in dedicated future dialect-contrast lists, but ordinary sessions should not show both variants from the same group.

Diacritic tolerance should be handled by the spelling engine, not by adding unaccented alternatives manually.

---

## 20. Prompt and Answer Fields

The current Welsh MVP may use:

- englishPrompt
- welshAnswer

For future-proofing, a later schema may use:

- sourceLanguage
- targetLanguage
- prompt
- answer

Recommended future-ready structure:

```json
{
  "sourceLanguage": "en",
  "targetLanguage": "cy",
  "prompt": "to go",
  "answer": "mynd"
}
```

Do not over-engineer multilingual support in the MVP.

For now:

- keep Welsh content clean
- avoid assuming all future users are English-speaking where possible
- make future migration easy by keeping prompts and answers clearly separated

If the product later supports Spanish speakers learning Welsh, this can be handled by adding translated prompts or separate sourceLanguage packs later.

No need to build full multilingual prompt arrays in the current MVP.

---

## 21. JSON Data Principles

Word-list data should be:

- consistent
- explicit
- easy to validate
- easy for AI to extend
- easy for the app to consume

Each word should ideally include:

- id
- listId if required by app structure
- prompt or englishPrompt
- answer or welshAnswer
- acceptedAlternatives
- audioUrl
- audioStatus
- notes
- usageNote where useful
- dialect
- dialectNote
- variantGroupId
- spellingHintId
- disablePatternHints
- order
- difficulty

Do not add empty optional fields purely for completeness unless the app schema requires them.

Optional fields should remain optional where possible.

spellingHintId and disablePatternHints are optional controls and should not be populated purely for completeness.

---

## 22. Source Language and Future Languages

Spelio may later support:

- English speakers learning Welsh
- Spanish speakers learning Welsh
- Welsh speakers practising English spelling
- other target languages

Do minimal future-proofing now:

- keep language codes in list or word metadata
- keep prompt and answer conceptually separate
- avoid hard-coding “English” into future schema names where practical

Do not add complex multilingual architecture until needed.

Future options:

### Option A — Separate packs by source language

Example:

- Welsh for English speakers
- Welsh for Spanish speakers

### Option B — Multiple prompts per item

Example:

```json
"prompts": {
  "en": "to go",
  "es": "ir"
}
```

This should be considered later, not required now.

---

## 23. Audio Considerations

Every answer should eventually have audio.

Audio should reflect the exact answer form.

For dialect variants:

- each variant should have its own audio
- do not reuse audio between different spellings
- ensure North/South forms are spoken naturally

audioStatus should track:

- missing
- generated
- failed

---

## 24. Review and Quality Checks

Before accepting a list, check:

### Structure

- Does the list have one clear purpose?
- Does every item belong?
- Is the order sensible?
- Is the list length appropriate?

### Spelling progression

- Is anything too difficult for the list's intended point in the journey?
- Are mutations introduced too early?
- Are long phrases delayed appropriately?

### Welsh quality

- Are the forms correct?
- Are dialect choices explicit?
- Are accepted alternatives used correctly?
- Does every high-risk prompt have a useful usageNote?
- Are yes/no, response words, function words, colloquial forms, and fixed expressions explained where needed?
- Is dialect information in dialectNote rather than usageNote?
- Are usageNote and dialectNote both short, non-duplicative, and spoiler-safe?
- Would the note actually prevent learner confusion?
- Does usageNote avoid revealing the target answer?
- Does dialectNote avoid revealing the target answer?
- Do learner-facing notes avoid spoiling the spelling task?
- Are generic spelling pattern hints likely to be safe for this item?
- Should pattern hints be disabled for any exceptional word?
- Is a specific spellingHintId needed only where genuinely justified?

### Learner experience

- Will this feel useful?
- Will it feel fair?
- Will the learner understand what is being asked?
- Does the list avoid unnecessary frustration?

### App compatibility

- Are answer lengths compatible with slot rendering?
- Are variants separated properly?
- Are notes not overloaded?
- Are usageNote, dialectNote, and notes not being misused as spelling hint fields?

---

## 25. Content Review Levels

Use three review levels.

### Level 1 — Structural Review

Checks:

- schema validity
- IDs
- order
- list length
- required fields

### Level 2 — Learning Design Review

Checks:

- fit with the product area, category, and list purpose
- difficulty progression
- list purpose
- cognitive load

### Level 3 — Welsh Quality Review

Checks:

- spelling accuracy
- naturalness
- dialect handling
- mutation correctness
- usageNote/dialectNote quality
- usageNote does not reveal the target answer
- dialectNote does not reveal the target answer
- learner-facing notes do not spoil the spelling task

A list is production-ready only after all three review levels.

---

## 26. Scaling Strategy

The platform may support many lists over time, but scale should come primarily from optional Practise extensions and future Build collections rather than from stretching Learn or Core Practice indefinitely.

To keep content scalable:

- use clear Learn / Practise / Build areas
- use understandable categories
- use consistent list naming
- avoid duplicate list concepts
- keep Core Practice finite and representative
- keep Build short, controlled, spelling-first, and writing-first
- keep pattern lists modular
- create Extension Collections rather than bloated numbered sequences
- maintain a content index as the library grows

Possible long-term high-level library structure:

- Learn
- Practise
- Build

Possible Learn examples:

- Welsh Spelling Foundations
- Advanced Recognition, if introduced as future spelling-confidence material
- Mutation Awareness, if introduced as future spelling-confidence material

Possible Practise examples:

- Topic Collections
- Custom Lists
- Future extension collections
- Everyday Welsh
- People & Home
- Food & Drink
- Nature & Animals
- Places

Possible Build examples:

- Building Welsh
- Word Building
- Written Welsh Patterns
- short phrase chunks
- short sentence fragments
- word transformations
- endings, mutations, and context-dependent spelling changes

Possible Extension Collection examples:

- Welsh Place Names
- GCSE Welsh
- Healthcare Welsh
- Education Welsh
- Tourism Welsh
- Church & Faith
- Welsh History
- Birds
- British Wildlife

Possible long-term spelling-confidence sequence:

1. Foundations 1 — Core Patterns
2. Foundations 2 — Pattern Extensions
3. Foundations 3 — Advanced Recognition
4. Written Welsh — Context & Mutation Patterns

That sequence belongs in Learn or future advanced foundations. It should not be confused with an indefinitely growing Practise catalogue.

---

## 27. Naming Conventions

List names should be clear and calm.

Good:

- First Words — Simple Welsh
- Food & Drink — Essentials
- Spelling Focus — LL
- Short Phrases — Going Somewhere
- Mutation Pattern — tref, as future optional content

Avoid:

- Fun Welsh Challenge
- Super Hard Words
- Random Practice
- Lesson 1 unless it is part of a specific course pack

---

## 28. Content for Children and Schools

Do not redesign core content for children.

If Spelio is used by teachers or parents, support this through content packs.

Future child/school packs may include:

- School Basics
- Classroom Welsh
- KS2 Welsh Vocabulary
- GCSE Core Welsh
- Animals and Nature
- Family and Feelings

These should still follow spelling progression and avoid childish UI assumptions.

---

## 29. Content Generation Prompt Template

Use this when asking AI to create new content:

```text
Use the Spelio Content System Specification.

Create [number] Welsh spelling practice lists for [Learn/Core Practice/Extension Collection purpose].

Prioritise spelling progression, real-world usefulness, and representative topic fit.

For each list include:
- id
- name
- description
- productArea
- category
- focus
- difficulty
- order
- words

For each word include:
- id
- prompt / englishPrompt
- answer / welshAnswer
- acceptedAlternatives
- notes
- usageNote only where genuinely useful
- dialect
- dialectNote where relevant
- variantGroupId where variants exist
- spellingHintId where genuinely justified
- disablePatternHints where genuinely justified
- order
- difficulty

Rules:
- Design Spelio-authored lists around 10–25 conceptual learning items, not fixed groups of 10 raw rows.
- Do not pad, split, or duplicate lists only to make exact 10-item groups.
- Avoid early mutation burden.
- Use mutations only where appropriate for the product area, category, and list purpose.
- For Core Practice, choose accessible, useful, representative words rather than only the easiest possible spellings.
- For numbered Core Practice lists, make progression moderate and based mainly on spelling complexity rather than rarity.
- For Extensions, expand sideways into a meaningful topic, domain, or interest area rather than extending a numbered ladder without a strong educational reason.
- Do not use acceptedAlternatives for different-length variants.
- Create separate entries for meaningful dialect variants.
- Link dialect variants with variantGroupId.
- Do not use acceptedAlternatives for dialect variants.
- Treat each variantGroupId as one conceptual learning item for ordinary practice and completion.
- Mixed Welsh exposure is the default; rotate variants over time where possible, but do not show both variants from the same group in the same ordinary session or require every dialect variant for completion.
- When generating or reviewing word lists with AI, explicitly ask the AI to identify high-risk learner-confusion items and add short usageNote or dialectNote values only where they are genuinely useful.
- Keep usageNote short and rare, except where high-risk learner-confusion triggers make it mandatory.
- Do not put dialect information in usageNote.
- Leave spellingHintId and disablePatternHints empty unless there is a clear reason.
- Do not invent bespoke spelling hints for every word.
- Flag uncertain hint cases in notes for later Welsh review.
- Keep lists coherent and practical.
- If unsure, avoid both artificially easy vocabulary and words that create too many simultaneous spelling challenges.
```

---

## 30. Content Audit Prompt Template

Use this when asking AI to review content:

```text
Audit this Spelio word-list dataset against the Spelio Content System Specification.

Check:
- spelling progression
- fit with the product area, category, and list purpose
- mutation burden
- dialect handling
- acceptedAlternatives
- usageNote quality
- high-risk learner-confusion items needing short usageNote or dialectNote values
- usageNote does not reveal the target answer
- dialectNote does not reveal the target answer
- learner-facing notes do not spoil the spelling task
- list coherence
- learner usefulness
- app compatibility

Be critical. Identify anything that is too difficult, misplaced, redundant, unnatural, or likely to frustrate learners.

Do not rewrite the dataset unless asked. Provide specific recommended fixes.
```

---

## 31. Final Content Rule

If there is a conflict between usefulness and spelling suitability:

> Choose spelling suitability.

If a word is useful but too hard, move it later.

If a word is easy but not useful, do not include it unless it serves a clear spelling-pattern purpose.

The best Spelio content is:

- useful
- spellable
- coherent
- calm
- scalable
