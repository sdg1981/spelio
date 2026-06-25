# Spelio Practice Catalogue Draft v1

Working draft. This document is a content-architecture source of truth for the first Topic Collections build. It does not define final Welsh vocabulary, final word lists, production collection names, database records, seed data, migrations, or UI implementation.

## Product Architecture

Spelio Practice should launch first with Topic Collections. This reinforces that Spelio is a spelling-practice platform, not a full Welsh language course.

Intended product hierarchy:

```text
Learn
  Welsh Spelling Foundations

Practise
  Topic Collections
    Animals
    Food & Drink
    People & Home
    Places & Travel
    Weather & Seasons
    Nature & Landscape
    School & Learning
    Work
    Time & Calendar
    Colours & Shapes
    Clothing & Appearance

  Language Building
    Future

  GCSE Welsh
    Future

  Professional Welsh
    Future

  Other extension collections
    Future
```

Practise is the broad product area. Topic Collections is the first Practice collection being designed now.

Later Practice collections should appear as separate collection cards or destinations rather than being squeezed into one huge topic list. UI implementation is not part of this task.

## Learner Path And Catalogue

The homepage and recommendation path should prioritise useful Most Common topic collections for adult learners. These lists give learners an obvious place to practise vocabulary they are likely to recognise, need, or be asked to spell.

Progressive spelling-level topic lists remain valuable, especially for teachers, structured revision, and learners who want a more scaffolded route through a topic. They should be treated as additional practice and teacher-friendly catalogue resources, not necessarily the default learner path.

The Word Lists page is a catalogue/library. It should help learners and teachers browse available content, but it is not the learner journey by itself.

The learner journey and the catalogue may use the same content differently. A Most Common list might be recommended first on the homepage, while the catalogue still shows Topic 1, Topic 2, Topic 3, and specialist lists for browsing, assignment, or targeted practice.

## First Launch Scope

The first Topic Collections launch should focus on practical, adult-friendly vocabulary grouped by familiar topics. These collections should be easy for learners to understand and easy for teachers to assign.

Topic Collections should be spelling-first. They are not intended to become a full course sequence, grammar syllabus, or general Welsh curriculum.

Future Practice collections may include:

- Language Building
- GCSE Welsh
- Professional Welsh
- Welsh Place Names
- Custom / Teacher Collections

These should be documented as future separate Practice collections, not included in the first Topic Collections launch.

## Level Model

Each substantial topic should normally include four list types:

- Topic 1
- Topic 2
- Topic 3
- Most Common Topic

For example:

```text
Animals
  Animals 1
  Animals 2
  Animals 3
  Most Common Animals
```

### Level 1

Accessible, representative vocabulary with lower spelling load.

Level 1 should not feel babyish. It should not be restricted to only the easiest possible Welsh spellings. It should be appropriate for adult learners who have completed Welsh Spelling Foundations.

### Level 2

Still useful and representative vocabulary, with a moderate increase in spelling complexity.

Level 2 may include longer words, more digraphs, vowel combinations, accents, or less immediately predictable spellings.

### Level 3

Broader and richer topic vocabulary.

Level 3 may include longer, more complex, or less immediately familiar words, provided they still genuinely belong in the topic. Level 3 should not become obscure vocabulary for its own sake.

### Most Common

A separate frequency and usefulness list.

Most Common lists should contain the words learners and teachers are most likely to expect or need in that topic, even if some are harder to spell. Most Common lists do not follow the same spelling-progression rules as Levels 1-3.

## Topic Collections

### Animals

- Animals 1:
  - Purpose: Familiar animal vocabulary with lower spelling load and clear topic fit.
- Animals 2:
  - Purpose: Useful animal words with a moderate increase in digraphs, vowel combinations, or less predictable spellings.
- Animals 3:
  - Purpose: Broader animal vocabulary that remains practical and recognisable within the topic.
- Most Common Animals:
  - Purpose: The animal words learners and teachers are most likely to expect or need, regardless of spelling difficulty.

### Food & Drink

- Food & Drink 1:
  - Purpose: Everyday food and drink vocabulary with lower spelling load and strong practical usefulness.
- Food & Drink 2:
  - Purpose: Common meals, ingredients, and drink words with longer forms or more spelling complexity.
- Food & Drink 3:
  - Purpose: Broader food and drink vocabulary for menus, shopping, cooking, and social contexts.
- Most Common Food & Drink:
  - Purpose: The baseline vocabulary learners are most likely to need when ordering, shopping, or reading a basic Welsh menu.

### People & Home

- People & Home 1:
  - Purpose: Immediate family, household, and home vocabulary with lower spelling load.
- People & Home 2:
  - Purpose: Wider home and relationship vocabulary with longer words or more varied spelling patterns.
- People & Home 3:
  - Purpose: Broader vocabulary for describing people, households, rooms, and everyday home life.
- Most Common People & Home:
  - Purpose: The highest-use words for describing who people live with and where they live, regardless of spelling difficulty.

### Places & Travel

- Places & Travel 1:
  - Purpose: Basic places, town vocabulary, and travel words with lower spelling load.
- Places & Travel 2:
  - Purpose: Useful destinations, transport words, and civic places with longer words or multi-word answers.
- Places & Travel 3:
  - Purpose: Broader vocabulary for getting around, asking for directions, and describing places.
- Most Common Places & Travel:
  - Purpose: Essential words for navigation, travel, commuting, and everyday place names.

### Weather & Seasons

- Weather & Seasons 1:
  - Purpose: Everyday weather and season words with lower spelling load and clear usefulness.
- Weather & Seasons 2:
  - Purpose: Common weather descriptions with longer words, accents, or less predictable spellings.
- Weather & Seasons 3:
  - Purpose: Broader weather, seasonal, and environmental vocabulary for everyday discussion.
- Most Common Weather & Seasons:
  - Purpose: The words learners are most likely to need for understanding or giving a simple weather report.

### Nature & Landscape

- Nature & Landscape 1:
  - Purpose: Immediate landscape and natural feature words with lower spelling load.
- Nature & Landscape 2:
  - Purpose: Useful nature vocabulary with longer words, digraphs, or more varied vowel combinations.
- Nature & Landscape 3:
  - Purpose: Broader landscape, terrain, and natural-world vocabulary that remains practical.
- Most Common Nature & Landscape:
  - Purpose: The most useful nature and landscape words for everyday Welsh, geography, and place-related language.

### School & Learning

- School & Learning 1:
  - Purpose: Concrete classroom objects and learning vocabulary with lower spelling load.
- School & Learning 2:
  - Purpose: Common education words, subjects, and school routines with longer or less predictable spellings.
- School & Learning 3:
  - Purpose: Broader vocabulary for school life, learning environments, and classroom communication.
- Most Common School & Learning:
  - Purpose: Core words learners and teachers are most likely to need for classroom instructions and everyday learning.

### Work

- Work 1:
  - Purpose: Common roles, workplaces, and employment vocabulary with lower spelling load.
- Work 2:
  - Purpose: Useful work-related words with longer forms, digraphs, or more varied spelling patterns.
- Work 3:
  - Purpose: Broader workplace, industry, and professional vocabulary for adult conversation.
- Most Common Work:
  - Purpose: General employment words adults are most likely to need when talking about work.

### Time & Calendar

- Time & Calendar 1:
  - Purpose: Days, simple time words, and foundational calendar vocabulary with lower spelling load.
- Time & Calendar 2:
  - Purpose: Months, duration words, and scheduling vocabulary with longer or less predictable spellings.
- Time & Calendar 3:
  - Purpose: Broader time, calendar, and planning vocabulary for everyday use.
- Most Common Time & Calendar:
  - Purpose: Crucial words for scheduling, telling the time, and talking about when things happen.

### Colours & Shapes

- Colours & Shapes 1:
  - Purpose: Basic colours and simple shape vocabulary with lower spelling load.
- Colours & Shapes 2:
  - Purpose: Wider colour and shape vocabulary with longer words or less predictable spellings.
- Colours & Shapes 3:
  - Purpose: Broader descriptive vocabulary for colour, shape, and visual description.
- Most Common Colours & Shapes:
  - Purpose: The colour and shape words learners are most likely to need when describing objects.

### Clothing & Appearance

- Clothing & Appearance 1:
  - Purpose: Everyday clothing and appearance vocabulary with lower spelling load.
- Clothing & Appearance 2:
  - Purpose: Common accessories, appearance words, and clothing descriptions with more spelling complexity.
- Clothing & Appearance 3:
  - Purpose: Broader clothing and appearance vocabulary for describing people and everyday situations.
- Most Common Clothing & Appearance:
  - Purpose: The clothing and appearance words most frequently needed in descriptive speech.

## Future Expansion Principle

Level 3 is part of the intended launch structure for substantial Topic Collections.

Future Level 4 or Level 5 lists may be added if learner demand, teacher demand, or topic depth justifies them. Do not add levels merely to keep extending the ladder.

Where possible, prefer meaningful specialist extension collections once a topic becomes broad enough. For example, instead of endlessly extending Animals to Animals 6, future expansion might use:

- Farm Animals
- Birds
- British Wildlife
- Sea Life

This does not rule out Animals 4 later if there is a strong educational reason.

## Language Building

Language Building is deliberately postponed and should not be part of the first Topic Collections build.

Potential future Language Building areas may include:

- Verbs
- Connecting words
- Question words
- Short phrases
- Past-focused phrases
- Future-focused phrases
- Talking about yourself
- Talking about other people

Language Building introduces more curriculum-design complexity and could make Spelio feel closer to a language-learning course if rushed. Topic Collections are easier to understand, easier for teachers to share, and clearer as spelling-practice content.

## Draft Boundaries

This draft does not:

- Generate Welsh vocabulary.
- Create final word lists.
- Rename production collections.
- Merge into the main content specification.
- Make UI implementation decisions.
- Modify application code, database files, JSON exports, migrations, seed data, or live content.
