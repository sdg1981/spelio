# Spelio Topic Collection Editorial Standards v1

This document defines the editorial standards every Spelio Topic Collection should follow.

It is not a curriculum specification, vocabulary document, language course, database source, or seed-data file. Its purpose is to keep Topic Collections consistent whenever new collections are created, reviewed, or expanded.

Topic Collections exist to provide carefully designed spelling practice. They assume the learner has already completed Welsh Spelling Foundations, or has equivalent spelling knowledge.

The primary objective is:

> Build spelling confidence through carefully curated vocabulary.

Vocabulary learning is a valuable outcome, but it is not the main design driver.

---

## 1. Core Philosophy

Topic Collections should strengthen spelling confidence through vocabulary that is useful, recognisable, and carefully sequenced.

They should not try to teach Welsh from the beginning. They should not become a general vocabulary catalogue, dictionary substitute, full language course, or grammar syllabus.

Each collection should feel like Spelio: calm, focused, intentional, adult-neutral, and built around spelling practice rather than content volume.

---

## 2. Editorial Priorities

When selecting words, priorities should generally be considered in this order:

1. Appropriate spelling progression
2. Useful and recognisable vocabulary
3. Clear topic fit
4. Adult-friendly vocabulary
5. Teacher usefulness
6. Long-term catalogue consistency

Avoid selecting words simply because they are common if they introduce unnecessary spelling complexity too early.

Likewise, avoid selecting unnaturally easy words if they make the topic feel artificial.

---

## 3. Topic Progression

Each substantial topic normally contains:

- Topic 1
- Topic 2
- Topic 3
- Most Common

Examples:

```text
Animals
  Animals 1
  Animals 2
  Animals 3
  Most Common Animals

Food & Drink
  Food & Drink 1
  Food & Drink 2
  Food & Drink 3
  Most Common Food & Drink
```

Topic 1, Topic 2, and Topic 3 are not presented as learner levels, but they should still represent genuine progression in spelling accessibility.

Teachers should be able to confidently use Topic 1 before Topic 2. The progression should be moderate rather than dramatic, so a learner completing Topic 1 should normally feel ready for Topic 2.

---

## 4. Topic 1

Topic 1 should contain:

- highly recognisable vocabulary
- representative vocabulary
- useful vocabulary
- relatively accessible spellings
- lower overall spelling load

It should avoid:

- obscure vocabulary
- artificially childish vocabulary
- words chosen only because they are extremely easy to spell

Adult learners should still find Topic 1 worthwhile. It must not feel like a cut-down starter pack that only exists to prepare learners for Topic 2.

---

## 5. Topic 2

Topic 2 should broaden the topic naturally.

It may introduce:

- longer words
- additional Welsh digraphs
- vowel combinations
- accents
- slightly less predictable spellings

However, it should remain practical and recognisable. Topic 2 should feel like a natural next step, not a sudden jump into specialist vocabulary.

---

## 6. Topic 3

Topic 3 should complete a well-rounded introduction to the topic.

It may contain:

- broader vocabulary
- richer descriptions
- less familiar words
- more complex spellings

Topic 3 should never become a collection of obscure words simply because it is the third list. Every word should still justify its place.

---

## 7. Most Common

Most Common follows a different philosophy.

Its purpose is frequency and expectation rather than progression. Include the words learners and teachers would naturally expect to find in that topic.

Do not remove an important word simply because it is spelling-heavy.

Most Common lists should complement Topic 1-3 rather than replace them.

---

## 8. Practical Collection Workflow

When creating a new Topic Collection, use a simple draft-first workflow:

1. Generate a broad vocabulary pool with Welsh and English forms.
2. Ask AI to draft Topic 1, Topic 2, and Topic 3 directly from the pool.
3. Keep each Topic 1-3 list tightly curated, normally around 10 words.
4. Ask AI to judge progression primarily from Welsh spelling complexity, not English familiarity, semantic difficulty, or vocabulary frequency.
5. Generate the Most Common list separately.
6. Allow Most Common to duplicate words from Topic 1-3.
7. Review the AI draft editorially before approval.
8. Store approved lists in `docs/topic_collections/`.

Topic 1-3 are spelling-progression lists, not vocabulary-frequency lists. Most Common is frequency and usefulness driven, not spelling-progression driven.

Human editorial review remains essential. The AI draft should create momentum, but editors must still judge whether the lists genuinely separate by Welsh spelling complexity, respect the topic, and feel calm, focused, intentional, and spelling-first.

The older metadata-heavy workflow may still be useful for difficult topics, disputed topics, or topics with many near-equivalent candidates. Fields such as Spelling Load, Core Status, Most Common Candidate, and Representative Role can help discovery and review, but they are no longer the default authoring workflow.

If metadata is used, spelling-load classification remains relative within the topic and should be treated as an editorial aid, not a rigid formula. It can help editors notice when a familiar or common word carries more spelling complexity than expected, and when a less common word may still be highly accessible for spelling practice.

Representative Role can help editors balance lists so each Topic Collection feels varied, representative, and satisfying rather than simply sorted by spelling load. It is a balancing aid, not a primary selection driver. Topic expectation, learner usefulness, and spelling accessibility should carry more weight than category spread.

Representative Role should prevent a list becoming too narrow, but it should not force every introductory list to include every subcategory. A Topic 1 list may be naturally weighted toward the most expected vocabulary if that better serves learners and teachers. Balance should improve the list, not make it feel artificial, and important expected words should not be excluded solely to satisfy category spread.

Topic 1 should not include deliberate stretch words. A few moderate spelling-load words may belong in Topic 1 only if they are still genuinely accessible and central to the topic. If a word feels like a stretch, it should normally move later or remain unused.

Selection is not allocation. Core means a word may be suitable for the main topic area, but it does not guarantee inclusion in Topic 1-3. Topic 1-3 should normally be tightly curated lists, often around 10 words each. Words not selected for Topic 1-3 may remain unused, move into future Topic 4/5 lists, or be better suited to specialist extension collections.

Editorial quality matters more than using up the vocabulary pool. Do not force words into Topic 2 or Topic 3 merely because they were not used in Topic 1.

### Animals Lesson Learned

The Animals experiment showed that over-classifying every word can slow the process down. The detailed metadata was useful for discovery, but it created too much process weight to repeat by default for every future topic.

A simpler AI draft, followed by human editorial review, may produce better momentum. The human review should focus on whether Topic 1, Topic 2, and Topic 3 genuinely separate by Welsh spelling complexity. Words should not be placed into later topics simply because they were unused earlier.

---

## 9. Every List Should Feel Complete

Every Topic Collection should feel satisfying on its own.

Topic 1 must not feel like a reduced preview of the topic. Topic 2 must not feel like a miscellaneous middle group. Topic 3 must not feel like a place to put leftovers.

Each list should contain a balanced and representative selection that provides genuine educational value.

---

## 10. Spelling Progression

Spelling progression may consider factors such as:

- word length
- Welsh digraphs
- vowel combinations
- accents
- apostrophes
- multi-word answers
- several spelling challenges within one word

Difficulty should never be based solely on how uncommon a word is.

A common word may be difficult to spell. An uncommon word may be easy to spell. Editorial judgement should consider both spelling load and learner usefulness.

---

## 11. Spelling Load

Spelling load is an editorial judgement, not a strict numerical score.

Editors may consider factors such as:

- number of letters
- number of Welsh digraphs
- uncommon vowel combinations
- accents
- apostrophes
- multi-word answers
- multiple spelling features occurring together
- mutation-related spelling changes where appropriate

No single factor determines spelling load. A short word can still be difficult, and a longer word can still be appropriate if it is useful, recognisable, and clearly belongs in the topic.

Editors should balance spelling complexity with usefulness, recognisability, topic fit, and teacher usefulness.

---

## 12. Topic Integrity

Every word should belong naturally inside its topic.

Avoid including words simply because they fit the spelling progression if they weaken the topic.

A learner should immediately understand why every word belongs in the collection.

---

## 13. Audience

Topic Collections are primarily designed for adult learners.

They should also work naturally for important secondary or overlapping audiences:

- GCSE learners
- teachers
- independent learners
- older school pupils

The tone should remain adult-neutral and teacher-friendly. Avoid vocabulary that feels designed exclusively for young children.

Child-friendly vocabulary is acceptable when it genuinely belongs to the topic, but the overall collection should respect adult learners. Topic Collections should not feel school-only or child-first.

---

## 14. Teacher Usefulness

A teacher should be able to understand why a list exists, when to assign it, and how it differs from the neighbouring lists.

Topic Collections should support classroom or homework use without becoming school-only material.

Useful teacher-facing questions include:

- Is this list easy to assign as a coherent practice set?
- Is the progression clear enough to explain?
- Does the list avoid surprising or distracting word choices?
- Would the list work for mixed learner confidence levels?

---

## 15. Future Expansion

Future expansion should normally favour meaningful specialist collections rather than endless numbered lists.

Example:

```text
Animals
  Birds
  Farm Animals
  British Wildlife
  Sea Life
```

This is usually preferable to automatically extending a topic to Animals 4, Animals 5, and Animals 6.

However, Topic 4 or Topic 5 may still be appropriate where educationally justified.

---

## 16. Editorial Review Questions

Before approving any Topic Collection, ask:

- Does every word genuinely belong?
- Does the progression feel sensible?
- Is Topic 1 noticeably more accessible than Topic 2?
- Is Topic 2 noticeably more accessible than Topic 3?
- Does Most Common contain the words people would expect?
- Would a teacher understand why the lists are organised this way?
- Would an adult learner feel respected?
- Does this feel like Spelio rather than a generic vocabulary list?

---

## 17. Editorial Flexibility

These standards guide editorial judgement rather than replace it.

They should not be treated as a rigid scoring system. Future contributors should use them to make consistent, defensible editorial decisions while still considering the needs of the topic, the learner, and the teacher.

---

## 18. Final Editorial Principle

The goal is not to create the largest Welsh vocabulary catalogue.

The goal is to create the most thoughtfully designed Welsh spelling-practice collections.

Every list should feel intentional.

Every progression should feel earned.

Every topic should strengthen learner confidence.
