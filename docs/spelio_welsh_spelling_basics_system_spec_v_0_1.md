# Spelio — Welsh Spelling Basics System Specification v0.1

## Status

Future-facing subsystem specification.

This document defines the proposed architecture, philosophy, UX direction, and content structure for the future “Welsh Spelling Basics” educational layer inside Spelio.

This is not an MVP blocker and should not alter the existing core spelling-practice loop.

---

# 1. Purpose & Philosophy

## 1.1 Purpose

The Welsh Spelling Basics system is a lightweight educational support layer around the core Spelio spelling-practice engine.

Its purpose is to:

- reduce intimidation around Welsh spelling
- build spelling confidence
- explain common Welsh spelling patterns simply
- support adult learners who want a little more understanding
- reinforce the core hear → recall → spell loop

The system exists to support spelling practice, not replace it.

---

## 1.2 What this system IS

The system is:

- optional
- browseable
- calm
- adult-oriented
- lightweight
- visually integrated into the Spelio ecosystem
- spelling-focused
- pattern-focused
- explanation-light
- example-driven
- audio-supported where useful

It should feel like:

> Helpful observations about how Welsh spelling works.

not:

> formal Welsh lessons.

---

## 1.3 What this system is NOT

The system is NOT:

- a full Welsh course
- a grammar course
- a phonics engine
- a Duolingo-style lesson tree
- a quiz system
- a gamified progression system
- a mandatory onboarding flow
- a classroom curriculum UI
- a dashboard system
- a completion/badge/XP system

Avoid:

- lesson numbers
- locked content
- streaks
- XP
- “complete this module”
- forced sequential progression
- tutorial-heavy UX
- noisy educational design

This system must preserve Spelio’s core philosophy of:

- calmness
- low cognitive load
- spelling-first interaction
- adult-facing restraint
- minimal friction

---

# 2. Information Architecture

## 2.1 System hierarchy

```text
Welsh Spelling Basics
  → Categories
    → Topics
      → One or more cards
```

---

## 2.2 Categories

Categories are lightweight organisational groupings.

Categories help:

- scanning
- navigation
- future scalability
- SEO structure
- content organisation

Categories are not lessons or levels.

---

## 2.3 Initial recommended categories

### Start here

Introductory confidence-building content.

Examples:

- Welsh is mostly phonetic
- Why Welsh looks different from English
- How Spelio helps you practise

---

### Welsh sounds

Pattern/sound-focused topics.

Examples:

- ff
- dd
- ll
- ch
- rh
- w / y

This category primarily uses compact symbolic icon tiles.

---

### Accents

Accent and vowel-length topics.

Examples:

- Accents and long vowels
- Ŵ and Ŷ
- Strict spelling

This category may contain multi-card mini-series.

---

### Welsh in real use

Real-world variation and structure.

Examples:

- North and South Welsh
- Mutations
- Common spelling traps

---

## 2.4 Topics

A Topic is:

- the main educational unit
- accessible by its own URL
- optionally linked to support practice
- either single-card or multi-card

Examples:

- DD
- LL
- Accents and long vowels
- Mutations

---

## 2.5 Cards

Cards are the smallest content unit.

A card may contain:

- title
- short explanation
- examples
- optional audio
- optional tip
- optional linked practice action

Cards should remain:

- short
- visually calm
- highly readable
- mobile-friendly

---

## 2.6 Single-card vs series topics

### Single-card topics

Use for:

- simple spelling/sound patterns

Examples:

- dd
- ff
- ll
- rh
- ch

Single-card topics should not use:

- progress bars
- “2 of 8”
- global Next-topic navigation

---

### Multi-card series

Use for:

- concepts requiring several connected ideas

Examples:

- Accents and long vowels
- Mutations
- North and South Welsh

Series may use:

- Previous/Next within the topic only
- optional internal progress indicator

Series navigation must remain:

- topic-local
- non-course-like

---

# 3. Content Model

## 3.1 Topic schema

Suggested conceptual shape:

```ts
type SpellingTopic = {
  id: string
  slug: string
  categoryId: string

  title: string
  shortDescription?: string

  iconType?: string

  isSeries: boolean

  order: number
  isActive: boolean

  seoTitle?: string
  seoDescription?: string

  linkedSupportListId?: string | null

  createdAt: string
  updatedAt: string
}
```

---

## 3.2 Card schema

```ts
type SpellingCard = {
  id: string
  topicId: string

  title?: string
  body: string

  examples?: ExampleItem[]

  tip?: string

  audioEnabled?: boolean

  order: number

  isActive: boolean
}
```

---

## 3.3 Example schema

```ts
type ExampleItem = {
  welsh: string
  english?: string
  audioUrl?: string
}
```

---

## 3.4 Optional audio

Audio is optional per example item.

Audio should:

- reuse the existing Azure Welsh TTS pipeline
- match normal Spelio pronunciation/audio standards
- remain lightweight and replayable

Audio examples should support:

- listening familiarity
- pronunciation recognition
- spelling-sound connection

Audio must not become:

- full speaking practice
- voice analysis
- conversational tutoring

---

## 3.5 Optional support-list linkage

Topics may optionally link to a support-only practice list.

Example:

```text
Topic: DD
Linked support list:
stage3_d_vs_dd
```

This enables:

> “Practise this pattern”

buttons.

Not all topics require linked practice.

---

# 4. Navigation

## 4.1 Public URLs

The system uses standalone public URLs.

Recommended structure:

```text
/spelling-basics
/spelling-basics/dd
/spelling-basics/ll
/spelling-basics/accents
/spelling-basics/mutations
```

---

## 4.2 Standalone pages

These are full standalone public pages.

They are NOT:

- modals
- overlays
- embedded practice screens

Pages should use the standard public content shell:

- back arrow
- centred Spelio logo
- interface language switch
- standard public footer

The background should use the normal warm Spelio off-white surface colour rather than pure white.

Inner cards and example surfaces should use slightly lighter elevated surfaces, consistent with existing Spelio content-page styling.

---

## 4.3 SEO principles

Pages should be:

- crawlable
- shareable
- indexable
- semantically structured

Each topic page should support:

- unique title
- unique meta description
- clean canonical URL

Example:

```text
How Welsh DD works | Spelio
```

---

## 4.4 Navigation philosophy

The system is exploratory, not linear.

Avoid:

- global lesson progression
- forced next-topic navigation
- curriculum sequencing

Preferred flow:

- open topic
- explore
- return to overview
- optionally practise

---

## 4.5 Topic navigation behaviour

### Single-card topics

Single-card topics should normally:

- open directly
- contain no progress bar
- contain no lesson numbering
- contain no global next-topic progression

Examples:

- dd
- ff
- ll
- ch
- rh

These should feel like lightweight reference/exploration pages.

---

### Multi-card series topics

Multi-card series may use:

- Previous
- Next
- optional local progress indicators

This navigation applies only inside the current topic.

Example:

```text
Accents and long vowels
  Card 1 → Card 2 → Card 3
```

Series navigation must not imply:

- course completion
- global Welsh progression
- mandatory learning order

Avoid:

- “2 of 8” globally across all spelling basics topics
- large lesson progress systems
- curriculum framing

---

# 5. Practice Integration

## 5.1 Detached sessions

Practice launched from Spelling Basics uses:

## detached support sessions

These:

- use real Spelio practice logic
- contribute to learning
- do NOT hijack normal progression

---

## 5.2 Support-only lists

Support lists are:

- permanent
- admin-authored
- hidden from normal Word Lists
- accessible contextually

Examples:

- DD practice
- LL practice
- Accent practice

These should support:

```ts
listPurpose:
  "progression"
  "support"
  "draft"
```

---

## 5.3 Progression safety

Support sessions must NOT:

- overwrite selectedListIds
- overwrite currentPathPosition
- redirect Continue learning

Support sessions MAY:

- update difficult words
- update aggregate stats
- reinforce spelling familiarity

This preserves normal progression integrity.

---

# 6. Admin Structure

## 6.1 Admin capabilities

Admin should support:

- Create/edit categories
- Create/edit topics
- Create/edit cards
- Add audio examples
- Link support lists
- Reorder topics/cards
- Toggle active/draft state

---

## 6.2 Authoring philosophy

The authoring flow should remain:

- editorial
- lightweight
- calm
- content-focused

Avoid:

- giant CMS complexity
- page-builder systems
- heavy formatting controls

Simple structured content is preferred.

---

## 6.3 Topic editor

Topic editor should support:

### Core fields

- title
- slug
- category
- icon type
- short description

### Advanced

- SEO fields
- support-list linkage
- series toggle

---

## 6.4 Card editor

Card editor should support:

- body text
- examples
- optional audio
- optional tip
- ordering

Examples should support:

- Welsh
- English meaning
- audio replay

---

## 6.5 Sound-tile presentation

The Welsh sounds category should support a lighter symbolic presentation mode.

Examples:

- ff
- dd
- ll
- ch
- rh
- wy

This mode should:

- prioritise symbol recognition
- reduce reading fatigue
- feel app-native and premium
- avoid heavy educational-card density

Tiles may omit explanatory subtitles entirely on the overview page.

The digraph/symbol itself acts as the visual title.

---

# 7. Future Extensibility

## 7.1 Mutations

Mutations are future-supported but initially de-emphasised.

Future versions of Spelio may explore context-dependent spelling patterns, for example Welsh mutations, where correct written Welsh depends on neighbouring words. This would be approached from a spelling-confidence perspective rather than as a comprehensive grammar curriculum.

Mutation content should remain:

- optional
- calm
- explanation-light
- scoped around spelling mechanics, recognition, and written accuracy

Avoid turning mutations into:

- grammar-heavy lessons
- overwhelming beginner flows

---

## 7.2 Sentence moments

The Spelling Basics system may eventually connect with:

## Sentence Moments

Examples:

- mutation examples inside sentences
- accent examples in phrases
- contextual spelling patterns

But:

Sentence Moments remain:

- rare
- optional
- curated
- separate content types

---

## 7.3 Analytics linkage

Future analytics may track:

- most-opened topics
- most-practised patterns
- common confusion areas
- hint trigger frequency

Examples:

- frequent dd confusion
- accent struggles
- f/ff confusion

This may support:

- founder insight dashboards
- future adaptive hint systems

---

## 7.4 Contextual hints

Future integration may include:

- contextual links from difficult words
- “Need help with DD?”
- pattern-specific suggestions

Example:

After repeated:

```text
dwr
```

Suggest:

> “Welsh accents and long vowels”

This should remain:

- subtle
- optional
- non-intrusive

Never popup-heavy.

---

# 8. Visual Direction Principles

The Welsh Spelling Basics system should visually feel:

- premium
- calm
- minimal
- adult-oriented
- lightweight
- app-native
- restrained

Avoid:

- classroom styling
- bright educational palettes
- gamification
- mascots
- decorative Welsh clichés
- heavy gradients
- tutorial aesthetics

The system should feel like:

> “A beautifully designed understanding layer around spelling practice.”

Not:

> “a course platform.”

---

# 9. Current Recommended UI Direction

## Overview page

The overview page currently works best with:

- lightweight Start here cards
- symbolic Welsh sound tiles
- occasional larger feature cards for conceptual topics
- generous whitespace
- restrained typography
- warm off-white background

The page should avoid becoming:

- a dense documentation index
- a lesson dashboard
- a curriculum map

---

## Topic detail pages

Topic detail pages should:

- feel editorial and calm
- prioritise examples over theory
- remain visually lightweight
- avoid excessive vertical stacking

The sound symbol itself should generally act as the title.

Example:

```text
dd
A soft, gentle sound
```

Avoid duplicate uppercase/lowercase title structures.

---

## Practice integration UI

“Practise this pattern” actions should:

- feel secondary and lightweight
- not resemble large primary CTAs
- behave more like contextual utility actions

The educational layer must remain secondary to the core spelling-practice product.
