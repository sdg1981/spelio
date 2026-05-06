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

## 5. Content Progression Model

Spelio content should be organised into expandable stages.

Stages represent broad learning progression. Difficulty values can still be used within stages, but stage and difficulty are not the same thing.

### Stage 1 — Foundations: Simple Spelling Confidence

Purpose: build trust, confidence, and familiarity with Welsh spelling.

Content should include:

- short words, usually 2–5 letters
- simple spelling patterns
- high-frequency everyday words
- minimal digraph complexity
- no mutation burden
- very short phrases only if they are easy and useful

Avoid:

- long formal phrases
- mutation-dependent phrases
- dense grammar
- multi-word answers with several spelling challenges
- advanced vowel clusters too early

Good examples:

- ie
- na
- te
- mam
- tad
- siop
- yma
- yna
- dod
- mynd

### Stage 2 — Core Words: Useful Everyday Vocabulary

Purpose: expand useful vocabulary while keeping spelling load manageable.

Content may include:

- common nouns
- common verbs
- everyday adjectives
- simple topic groups such as food, family, places, weather
- slightly longer words
- early controlled digraph exposure

Avoid:

- mutation-heavy phrases
- complex sentences
- long formal expressions

### Stage 3 — Spelling Patterns

Purpose: train Welsh spelling patterns deliberately.

This is one of Spelio’s most important content types.

Pattern lists may focus on:

- ll
- ch
- dd
- d vs dd
- f vs ff
- ae
- oe
- wy
- w/y vowel behaviour
- double letters
- common endings

Pattern lists should feel practical, not academic. They should use real words that learners are likely to meet.

### Stage 4 — Short Phrase Building

Purpose: introduce short practical chunks without overwhelming the learner.

Content should include:

- 2–3 word phrases
- repeated phrase patterns
- everyday actions
- useful location/time phrases
- controlled spacing practice

Examples:

- mynd adref
- dod yma
- yfed coffi
- dysgu Cymraeg
- mynd allan

Avoid:

- long sentences
- several new grammar features in one item
- mutation-heavy phrase sets unless intentionally controlled

### Stage 5 — Controlled Mutation Exposure

Purpose: expose learners to common mutated forms inside useful fixed phrases.

At this stage, mutation can appear, but the list should not yet behave like a grammar lesson.

Good approach:

- use common fixed phrases
- keep phrases short
- use repeated structures
- allow the pattern to emerge gradually

Avoid:

- explaining full mutation systems in notes
- mixing too many mutation types in one list
- making mutation knowledge essential without context

### Stage 6 — Mutation Pattern Lists

Purpose: practise mutation patterns directly through spelling contrast.

Mutation pattern lists should be introduced only after learners have enough spelling confidence.

Structure:

- reuse the same base word or a small family of related base words
- show 2–4 forms
- keep the list tightly focused
- let the spelling pattern teach itself through repetition

Examples:

Mutation Pattern — tref:

- tref
- y dref
- i’r dref
- yn y dref

Mutation Pattern — Cymru:

- Cymru
- yng Nghymru
- i Gymru

Mutation Pattern — car:

- car
- fy nghar
- ei gar
- y car

Do not use these lists too early.

### Stage 7 — Sentences and Longer Real-World Use

Purpose: practise short, useful sentences and longer spellings once the learner has confidence.

Content may include:

- short practical sentences
- common first-person phrases
- longer workplace/social phrases
- mixed phrase review
- longer Welsh words

Sentences should still be concise and practical.

### Stage 8+ — Expansion Packs

Purpose: allow the platform to grow indefinitely.

Possible expansion packs:

- school Welsh
- workplace Welsh
- travel Welsh
- family life
- health
- hobbies
- nature
- place names
- GCSE support
- course-aligned practice packs
- advanced spelling patterns
- mutation mastery
- mixed revision

Expansion packs must still follow the same spelling-first content rules.

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

If unsure, choose simpler spelling over higher usefulness.

---

## 8. List Design Rules

Each list should have:

- clear title
- clear purpose
- coherent theme
- consistent spelling load
- 10–25 items
- logical progression
- no random mixing

A list should feel intentionally designed, not like a vocabulary dump.

Good list types:

- First Words — Simple Welsh
- Spelling Focus — LL
- Short Phrases — Going Somewhere
- Mutation Pattern — tref
- Food & Drink — Essentials

Weak list types:

- Random Useful Words
- Hard Welsh Words
- Mixed Phrases 1
- Things to Know

Mixed lists are allowed only when they serve review or consolidation.

---

## 9. Core Vocabulary Lists

Core vocabulary lists should prioritise words learners will actually encounter.

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
- phrases that are useful but too spelling-heavy for the stage

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

### Early stages

Avoid requiring learners to understand or predict mutations.

Use mostly base forms and simple phrases.

### Mid stages

Introduce mutations inside fixed, common phrases.

The learner should be able to practise the spelling without needing a full grammar explanation.

### Later stages

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

Where meaningful dialect variants exist, normal sessions choose at most one variant from each `variantGroupId`. Mixed Welsh should rotate or expose variants over time where possible, but should not show both variants from the same group in the same ordinary session. North Wales and South Wales / Standard preferences are soft preferences: if the preferred variant is missing, use a `Both` item where available or the best available single variant rather than shrinking the session.

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

Example:

```json
{
  "answer": "rwan",
  "dialect": "North Wales",
  "dialectNote": "North Wales form."
}
```

dialectNote must not duplicate usageNote.

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

## 17. usageNote Strategy

usageNote is optional and learner-facing.

It should be rare and high-value.

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

Good usageNote examples:

- Informal. Fuller form: “Mae’n ddrwg gen i”.
- Formal/polite; often shortened in speech.
- Can be expanded to “diolch yn fawr”.

Bad usageNote examples:

- Commonly used in everyday Welsh.
- This is a soft mutation after the preposition i.
- North Wales form of the word.
- This means “thank you”.

Recommended length:

- one short line
- usually 5–12 words

Prefer no note over a low-value note.

---

## 18. notes Field

The notes field is internal/admin-facing.

It may be used for:

- editorial comments
- content review notes
- audio generation notes
- uncertainty flags
- future improvements

It must not be shown to learners.

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
- order
- difficulty

Do not add empty optional fields purely for completeness unless the app schema requires them.

Optional fields should remain optional where possible.

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

- Is anything too difficult for the stage?
- Are mutations introduced too early?
- Are long phrases delayed appropriately?

### Welsh quality

- Are the forms correct?
- Are dialect choices explicit?
- Are accepted alternatives used correctly?

### Learner experience

- Will this feel useful?
- Will it feel fair?
- Will the learner understand what is being asked?
- Does the list avoid unnecessary frustration?

### App compatibility

- Are answer lengths compatible with slot rendering?
- Are variants separated properly?
- Are notes not overloaded?

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

- stage fit
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

A list is production-ready only after all three review levels.

---

## 26. Scaling Strategy

The platform should support hundreds or thousands of lists over time.

To keep content scalable:

- use clear stage names
- use consistent list naming
- avoid duplicate list concepts
- keep pattern lists modular
- create expansion packs rather than bloated stages
- maintain a content index as the library grows

Suggested high-level library structure:

- Foundations
- Core Vocabulary
- Spelling Patterns
- Phrases
- Controlled Mutations
- Mutation Patterns
- Sentences
- Mixed Review
- Topic Packs
- School Packs
- Course-Aligned Packs
- Advanced Welsh

---

## 27. Naming Conventions

List names should be clear and calm.

Good:

- First Words — Simple Welsh
- Food & Drink — Essentials
- Spelling Focus — LL
- Short Phrases — Going Somewhere
- Mutation Pattern — tref

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

Create [number] Welsh spelling practice lists for [stage/purpose].

Prioritise spelling progression first and real-world usefulness second.

For each list include:
- id
- name
- description
- stage
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
- order
- difficulty

Rules:
- Avoid early mutation burden.
- Use mutations only where appropriate for the stage.
- Do not use acceptedAlternatives for different-length variants.
- Create separate entries for meaningful dialect variants.
- Link dialect variants with variantGroupId.
- Do not use acceptedAlternatives for dialect variants.
- Mixed Welsh exposure is the default; rotate variants over time where possible, but do not show both variants from the same group in the same ordinary session.
- Keep usageNote short and rare.
- Do not put dialect information in usageNote.
- Keep lists coherent and practical.
- Prefer simpler spelling over higher usefulness if unsure.
```

---

## 30. Content Audit Prompt Template

Use this when asking AI to review content:

```text
Audit this Spelio word-list dataset against the Spelio Content System Specification.

Check:
- spelling progression
- stage fit
- mutation burden
- dialect handling
- acceptedAlternatives
- usageNote quality
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
