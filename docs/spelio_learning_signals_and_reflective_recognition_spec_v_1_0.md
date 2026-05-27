# Spelio — Learning Signals & Reflective Recognition System Specification v1.0

## Status

Future-facing emotional reinforcement and learner-recognition specification.

This document defines a proposed system for:

- recognising genuine learner progress
- reinforcing spelling confidence
- surfacing meaningful growth
- tracking learning signals
- reflecting competence back to learners
- supporting future adaptive intelligence
- supporting future product insight and syllabus refinement

This system is intended to strengthen:

> learner confidence through calm recognition of real improvement.

It is not intended to introduce:

- aggressive gamification
- dopamine-heavy engagement systems
- shallow praise systems
- competitive mechanics
- streak anxiety
- manipulative reward loops
- noisy achievement systems
- dashboard-heavy educational tracking

The system should remain deeply aligned with Spelio’s existing philosophy:

- calmness
- adult-oriented design
- low cognitive load
- meaningful reinforcement
- emotionally safe practice
- spelling-first interaction
- focused repetition
- quiet confidence-building

---

# 1. Core Product Philosophy

## 1.1 Purpose

The Learning Signals & Reflective Recognition system exists to:

- help learners notice real progress
- reinforce genuine competence
- increase motivation through meaningful recognition
- reduce the feeling of invisible progress
- reduce discouragement and plateau perception
- encourage continued practice
- make learners feel seen and understood
- strengthen learner confidence and identity
- support long-term habit formation without manipulative systems

The system should help learners feel:

> “I’m genuinely becoming better at Welsh spelling.”

rather than:

> “The app is rewarding me for tapping buttons.”

---

## 1.2 Product positioning

Spelio should reward:

- competence
- recognition
- listening improvement
- spelling familiarity
- pattern understanding
- reduced struggle
- growing confidence

rather than:

- raw app usage
- arbitrary grinding
- streak pressure
- endless XP accumulation
- compulsive engagement loops

---

## 1.3 Emotional philosophy

The emotional tone should feel:

- observant
- calm
- intelligent
- encouraging
- restrained
- earned
- teacher-like
- trustworthy

Avoid:

- exaggerated excitement
- childish praise
- repetitive encouragement spam
- fake enthusiasm
- emotional manipulation
- gamified theatrics
- confetti-style reward systems
- overly precise numerical claims

Good:

> “You’re becoming much more consistent with dd words.”

Bad:

> “Amazing!!! +250 XP for Welsh Mastery!”

---

# 2. System Overview

## 2.1 Two connected subsystems

The overall system contains:

### Reflective Recognition

Learner-specific recognition based on demonstrated behavioural change.

Purpose:

> “You are improving in meaningful ways.”

---

### Session Reflection

Occasional lightweight explanations of what the learner practised or reinforced.

Purpose:

> “This session helped reinforce these Welsh spelling patterns or phrase structures.”

Reflective Recognition is considered the stronger and more important subsystem.

Session Reflection should remain lighter and less frequent.

---

# 3. Reflective Recognition

## 3.1 Definition

Reflective Recognition means:

- the app notices meaningful learner improvement
- the app occasionally reflects that improvement back
- the recognition feels earned and believable
- the learner recognises themselves in the feedback

The system should feel:

> observant rather than congratulatory.

---

## 3.2 Recognition philosophy

Recognition should be:

- specific
- pattern-aware
- behaviour-based
- infrequent enough to feel meaningful
- qualitative rather than statistical
- emotionally believable

Recognition should NOT:

- trigger constantly
- interrupt practice flow
- feel algorithmically shallow
- feel generic
- overstate progress
- rely heavily on visible numbers

---

## 3.3 Recognition categories

### Pattern familiarity

Examples:

- dd
- ll
- ch
- rh
- accents
- w/y vowel behaviour
- double consonants

Example recognition:

> “Words with ll are starting to feel much more familiar.”

---

### Recovery after struggle

Example:

> “You struggled with dd earlier, but you’re now spelling those words cleanly.”

---

### Reduced reveal dependence

Example:

> “You needed reveal much less often in this session.”

---

### Listening improvement

Example:

> “You’re starting to hear Welsh spelling patterns more naturally.”

---

### Confidence recognition

Example:

> “Welsh spelling probably feels much more predictable now than when you started.”

---

### Session recovery

Example:

> “That was a strong recovery after some difficult words earlier.”

---

# 4. Learning Signals Architecture

## 4.1 Philosophy

The system should track:

- real behavioural signals
- not just surface scores

The goal is:

> meaningful evidence of learning change.

---

## 4.2 Two-layer architecture

Recommended architecture:

### Layer 1 — Raw event history

Detailed spelling-attempt events.

Purpose:

- future insight
- analytics
- future AI analysis
- syllabus refinement
- future adaptive systems
- long-term learning analysis

---

### Layer 2 — Derived learning signals

Fast summarised learner-pattern state.

Purpose:

- real-time product behaviour
- recognition triggering
- lightweight adaptive systems
- future hint systems

---

# 5. Raw Event History

## 5.1 Purpose

Raw event history preserves:

- detailed learner behaviour
- future analytical possibilities
- future AI-assisted analysis
- future product-learning insight

The system should preserve enough historical detail to support:

- unknown future insight opportunities
- future learner-pattern detection
- future spelling-pattern research
- future adaptive replay systems

---

## 5.2 Example conceptual structure

```ts
SpellingAttemptEvent = {
  id: string

  userId: string
  sessionId: string

  wordId: string
  listId: string

  targetAnswer: string
  learnerAnswer: string

  incorrectAttempts: number
  revealedLetters: number

  usedReveal: boolean

  replayCount: number
  assistedReplayCount?: number

  completionTimeMs?: number
  hesitationTimeMs?: number

  wasCorrect: boolean
  wasCleanCompletion: boolean

  spellingMode: "flexible" | "strict"

  dialectPreference:
    | "mixed"
    | "north"
    | "south"

  createdAt: string
}
```

---

## 5.3 Storage philosophy

Storage should prioritise:

- usefulness
- future insight
- simplicity
- scalability

The system should avoid:

- excessive personal information
- unnecessary identity data
- surveillance-feeling analytics
- over-engineered telemetry

---

## 5.4 MVP recommendation

For MVP:

- store lightweight local learning summaries only
- avoid full server-side event history until accounts/login exist

Once account systems exist:

- introduce server-side event storage progressively

---

# 6. Derived Learning Signals

## 6.1 Purpose

Derived signals summarise:

- meaningful learner tendencies
- current confidence state
- recovery trends
- pattern familiarity

These signals power:

- reflective recognition
- future adaptive systems
- future contextual hints
- future replay refinement

---

## 6.2 Pattern-level tracking

Words should eventually support lightweight pattern tagging.

Example tags:

- dd
- ll
- ch
- rh
- ff
- accent
- long-vowel
- w-vowel
- y-vowel
- double-consonant

Words may support multiple pattern tags.

---

## 6.3 Example signal structure

```ts
PatternLearningSignal = {
  userId: string

  patternId: string

  attempts: number

  incorrectAttempts: number

  cleanCompletions: number

  recentCleanStreak: number

  revealRate: number

  replayRate: number

  recentStruggleCount: number

  confidenceState:
    | "unfamiliar"
    | "emerging"
    | "improving"
    | "confident"

  lastRecognitionShownAt?: string

  updatedAt: string
}
```

---

## 6.4 Signals that may matter later

Possible future signals:

- hesitation reduction
- replay-before-reveal behaviour
- reduced reveal dependency
- speed consistency
- confidence recovery after struggle
- clean completions after repeated failure
- audio dependence changes
- dialect familiarity
- phrase-length confidence
- long-word confidence
- sound-pattern differentiation

These should remain future-facing and lightweight.

---

# 7. Recognition Triggering

## 7.1 Core principle

Recognition should trigger only when:

- there is meaningful evidence of improvement
- the improvement feels believable
- the recognition would feel emotionally true

The system should avoid:

- shallow praise spam
- random encouragement
- repetitive compliments
- fake precision

---

## 7.2 Recognition thresholds

Recognition should normally require:

- earlier evidence of struggle
- later evidence of clean improvement
- repeated confirmation
- enough behavioural confidence

Example conceptual logic:

```ts
if (
  pattern.previousStruggleCount >= 2 &&
  pattern.recentCleanCompletions >= 3 &&
  pattern.revealRate < threshold
) {
  triggerRecognition()
}
```

Exact thresholds should remain adjustable.

---

## 7.3 Recognition cooldowns

Recognition should remain relatively rare.

Recommended behaviour:

- maximum one reflective message at a time
- cooldown between similar recognitions
- avoid repeating the same praise repeatedly

The system should preserve:

- freshness
- credibility
- emotional weight

---

# 8. Reflective Message Writing Principles

## 8.1 Tone goals

Messages should feel:

- calm
- intelligent
- observant
- grounded
- restrained
- emotionally believable

---

## 8.2 Avoid

Avoid:

- exaggerated excitement
- childish wording
- over-enthusiasm
- excessive emoji energy
- empty positivity
- vague encouragement

Avoid:

> “Awesome work!”

Prefer:

> “You’re becoming much more consistent with dd words.”

---

## 8.3 Avoid fake precision

Avoid:

> “You improved by 83%.”

Prefer:

> “You rarely struggle with ll words now.”

The system should feel:

> humanly observant rather than mathematically performative.

---

## 8.4 Qualitative over quantitative

Prefer:

- observations
- reflections
- confidence recognition
- behavioural noticing

rather than:

- dashboards
- statistics
- rankings
- performance scores

---

# 9. Session Reflection System

## 9.1 Purpose

Session Reflection is a lighter subsystem.

Its purpose is:

- helping learners understand what the session reinforced
- helping practice feel meaningful rather than random
- occasionally surfacing why a session existed

---

## 9.2 Importance level

Session Reflection is considered:

- secondary
- lightweight
- occasional

Reflective Recognition remains the primary emotional system.

---

## 9.3 Example reflections

Examples:

> “This session reinforced everyday Welsh verbs and short phrases.”

> “Today’s practice included several Welsh double-consonant patterns.”

> “This session focused on common Welsh listening and spelling patterns.”

---

## 9.4 Risks

Avoid turning session reflection into:

- educational reports
- dashboards
- lesson summaries
- classroom analysis
- verbose explanations

The end screen should remain:

- calm
- lightweight
- emotionally clean

---

# 10. Placement & UX Behaviour

## 10.1 Best placement locations

Recommended locations:

### End screen

Preferred primary location.

---

### Returning homepage

Occasional reflective reinforcement.

---

### After difficult-word recovery

Good moment for earned recognition.

---

### After completing a list/stage

Useful for larger reflection moments.

---

## 10.2 Avoid interrupting practice

Avoid:

- mid-word praise
- modal interruptions
- popup-heavy systems
- animated celebrations during spelling

The core practice loop should remain:

- focused
- quiet
- low-friction

---

## 10.3 One-message rule

Normally:

- show at most one reflective message at a time

The system should avoid:

- stacking messages
- multiple rewards simultaneously
- noisy feedback density

---

# 11. AI Integration Philosophy

## 11.1 AI is not required initially

MVP should NOT depend on:

- LLM-generated praise
- open-ended AI encouragement
- conversational AI coaching

Initial implementation should use:

- structured behavioural signals
- human-written reflection templates
- carefully designed thresholds

---

## 11.2 Why structured systems are preferred initially

Structured systems provide:

- tone consistency
- emotional reliability
- lower complexity
- easier testing
- better philosophical control

LLM-generated praise risks:

- emotional uncannyness
- verbosity
- inconsistency
- exaggerated tone
- shallow repetition

---

## 11.3 Future AI roles

Future AI may assist with:

- learner-pattern discovery
- unknown confusion-pattern analysis
- syllabus optimisation
- adaptive review timing
- recognition-trigger refinement
- cohort-level insight analysis
- future personalised support systems

AI should strengthen:

- learner usefulness
- confidence
- calmness
- meaningful recognition

not create:

- chatbot-heavy experiences
- tutorial-heavy interactions
- excessive conversational complexity

---

# 12. Future Possibilities

Possible future directions:

- pattern-specific recovery journeys
- long-term confidence arcs
- subtle milestone reflection
- listening-confidence recognition
- dialect familiarity reflection
- contextual audio-support suggestions
- replay-confidence analysis
- intelligent hint adaptation
- founder insight dashboards
- anonymised spelling-pattern research
- optional event-based competence reflection for future Welsh spelling challenges

These should remain:

- calm
- lightweight
- respectful
- genuinely useful

If Spelio later supports classroom events, school competitions, The Spelio Challenge, public spelling booths, or scheduled online spelling challenges, reflective recognition should still focus on genuine competence rather than competitive status.

Future event-related recognition should notice qualities such as careful listening, recovery after difficult words, consistency under light pressure, and improved spelling confidence. It should not become a leaderboard system, ranking engine, XP layer, or dopamine-heavy reward mechanic.

---

# 13. Final Strategic Principle

The purpose of this system is NOT:

> to manipulate learners into opening the app more often.

The purpose is:

> to help learners genuinely notice and trust their own progress.

The ideal emotional outcome is:

> “Welsh spelling used to feel confusing and intimidating.
>
> Now it feels more natural, more predictable, and more achievable.”

This system should reinforce:

- competence
- recognition
- confidence
- clarity
- listening familiarity
- spelling intuition
- calm progress

without compromising:

- simplicity
- trust
- adult-oriented restraint
- emotional safety
- focused practice
