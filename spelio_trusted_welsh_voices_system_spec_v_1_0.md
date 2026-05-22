# Spelio — Trusted Welsh Voices System Specification v1.0

## Status

Future-facing premium audio infrastructure specification.

This document defines the proposed architecture, workflow, philosophy, contributor experience, admin tooling, storage model, and audio-quality direction for the future Trusted Welsh Voices system inside Spelio.

This specification expands beyond the current Azure-generated audio pipeline and introduces a scalable hybrid model combining:

- trusted human Welsh recordings
- premium assisted replay variants
- dialect-aware voice selection
- experimental premium ElevenLabs-generated audio
- scalable Azure fallback audio
- contributor recording workflows
- admin approval tooling

This system is intended to become one of Spelio’s major product-quality differentiators.

---

# 1. Purpose & Philosophy

## 1.1 Purpose

The Trusted Welsh Voices system exists to:

- provide high-quality Welsh pronunciation
- improve learner listening confidence
- increase trust from Welsh speakers and teachers
- support assisted listening and replay systems
- preserve natural Welsh rhythm and cadence
- make Spelio feel premium, respectful, and carefully crafted

The system is not merely:

> “adding voice recordings.”

It is intended to become:

> a trusted Welsh listening layer around spelling practice.

---

## 1.2 Strategic product direction

The system should reinforce Spelio’s existing philosophy:

- calmness
- focused practice
- adult-oriented design
- low cognitive load
- thoughtful interaction
- meaningful quality
- restrained premium feel

The goal is not:

- celebrity voices
- entertainment voices
- cartoon energy
- gamified voice reactions
- noisy language-learning theatrics

The ideal emotional reaction is:

> “This Welsh sounds clear, natural, trustworthy, and carefully done.”

---

## 1.3 Why this matters

Welsh learners are highly sensitive to pronunciation quality.

Poor pronunciation can:

- reduce learner confidence
- reduce trust
- feel careless or culturally disrespectful
- undermine educational credibility

High-quality Welsh audio may become one of Spelio’s strongest differentiators.

This system intentionally prioritises:

- quality over scale
- trust over automation
- coherence over novelty
- careful craft over feature quantity

---

# 2. Audio Philosophy

## 2.1 Human-first audio

The preferred audio hierarchy is:

1. Approved human-recorded audio
2. Approved fallback human audio
3. Azure-generated audio
4. Graceful audio-unavailable state

Human recordings should become the preferred experience for:

- core vocabulary
- foundational lists
- spelling-pattern support lists
- educational examples
- Welsh spelling basics content
- high-frequency learner words

Azure-generated audio remains important for:

- custom lists
- temporary lists
- missing recordings
- long-tail content
- dynamic future systems

---

## 2.2 Experimental ElevenLabs generation layer

Spelio is now exploring ElevenLabs as a premium generated-audio layer within the broader human-first Trusted Welsh Voices direction.

This should be treated as an experimental, pragmatic hybrid workflow, not as a replacement for trusted human recordings and not as a reason to remove Azure fallback infrastructure.

Current observations:

- Direct ElevenLabs Welsh text-to-speech is often preferred for naturalness, warmth, and voice quality.
- Azure remains valuable as a pronunciation fallback and rescue route, especially for words where direct generation struggles.
- Azure should not be assumed as the default source for every ElevenLabs file.

Preferred current experimental workflow:

1. Generate ElevenLabs audio directly from Welsh text by default.
2. Review or spot-check the generated audio.
3. For problematic words, either regenerate directly, add a per-word `elevenLabsPronunciationHint`, or regenerate using Azure pronunciation via Azure -> ElevenLabs speech-to-speech.
4. Use pronunciation hints for specific problem words before falling back to Azure transform where appropriate.
5. Flag or visually highlight WY words for careful audio review, without automatically forcing them to Azure transform.

Direct ElevenLabs generation should currently use:

- Eleven v3
- Welsh language override
- configured voice ID
- stable, conservative settings

Final ElevenLabs MP3s should pass through the same gentle loudness-normalisation and post-processing approach where practical, so direct and Azure-transform files have similar perceived volume.

Current experimental voice configuration:

- Current preferred experimental voice ID: `aHCytOTnUOgfGPn5n89j`
- Previous tested reference voice ID: `G7ILShrCNLfmS0A37SXS`
- Previous tested Welsh-ish reference voice ID: `DikmR0aoFXAp1A3NcovW`

Voice IDs should remain configurable and should not be hardcoded throughout the app.

This workflow should remain admin-only and should not add learner-facing audio complexity.

---

## 2.3 Naturalness is critical

The system must preserve:

- natural Welsh rhythm
- warmth
- human pacing
- clear but natural articulation
- authentic cadence
- dialect integrity

Avoid:

- robotic slowing
- exaggerated pronunciation
- phonics-classroom tone
- theatrical voice acting
- stitched or obviously manipulated speech
- harsh AI-sounding processing

The learner should feel:

> “Oh, I can hear it now.”

not:

> “The app is manipulating speech.”

---

## 2.4 Assisted listening philosophy

Replay support should become:

1. Normal replay
2. Assisted replay
3. Reveal

The system should help learners stay with listening longer before visual answer exposure.

This should remain:

- subtle
- calm
- lightweight
- supportive
- audio-first

Avoid:

- tutorial-heavy listening systems
- forced listening gates
- robotic syllable drills
- aggressive anti-reveal friction

---

# 3. Audio Types

## 3.1 Initial recording variants

Each approved human recording should support:

### Normal
Natural calm Welsh speech.

### Assisted
Human-recorded slower and clearer version.

Assisted replay should:

- remain natural
- preserve warmth
- preserve pitch
- slightly slow pacing
- slightly increase clarity
- slightly increase separation between natural chunks

Assisted replay should NOT:

- sound robotic
- sound algorithmically stretched
- become unnaturally slow
- over-separate syllables
- feel patronising

---

## 3.2 Avoid heavy artificial chunking initially

MVP-quality premium audio should prioritise:

- human performance
- natural pacing
- careful articulation

The system should avoid aggressive algorithmic chunk splitting in early versions.

Future experimentation may include:

- subtle silence shaping
- gentle tempo adjustment
- lightweight assistive replay enhancement

But the foundational quality should come from:

> the human recording itself.

---

## 3.3 Future possible audio variants

Potential future variants:

- sentence example replay
- dialect comparison replay
- slower educational replay
- speaking-mode prompts
- hands-free mode prompts
- contextual spelling examples

These are future-facing only.

Future premium audio should also allow a small library of interface, helper, and coaching clips that are separate from word-list audio. These clips should remain calm, rare, contextual, non-intrusive, and audio-first rather than tutorial-heavy or phonics-drill-like.

Possible future helper/coaching clips include:

- struggle assist guidance
- replay/reveal guidance
- CH/K confusion prompt
- LL listening prompt
- DD/TH spelling-pattern prompt
- W/Y or WY listening prompt

These clips are not an MVP blocker, but the long-term system may need human-recorded versions, Azure fallback, ElevenLabs experimentation, language/locale-aware generation, admin review and approval, stable storage paths, and cache-busted preview/playback.

---

# 4. Voice Profiles

## 4.1 Voice identity

Each contributor should have a voice profile.

Suggested conceptual structure:

```ts
VoiceProfile = {
  id: string

  displayName: string

  dialect:
    | "north"
    | "south"
    | "both"
    | "other"

  status:
    | "active"
    | "inactive"
    | "draft"

  recordingNotes?: string

  priority: number

  approved: boolean

  createdAt: string
  updatedAt: string
}
```

---

## 4.2 Casting philosophy

The ideal voices should feel:

- warm
- trustworthy
- calm
- clear
- grounded
- adult-oriented
- natural

Avoid:

- exaggerated broadcaster delivery
- hyper-radio energy
- over-teaching tone
- cartoon educational performance
- forced “Welshness”

The ideal emotional feel is:

> “A thoughtful native Welsh speaker guiding you calmly.”

---

## 4.3 Dialect coverage

Initial recommendation:

- one trusted North Wales voice
- one trusted South Wales voice

This alone may create a major improvement in perceived quality.

Additional voices may later provide:

- freshness
- natural listening variation
- wider representation
- specialised educational tones

However:

Too many voices too early may reduce coherence.

---

# 5. Audio Storage Model

## 5.1 Recording structure

Each word may support multiple recordings.

Suggested conceptual shape:

```ts
AudioRecording = {
  id: string

  wordId: string
  listId?: string

  voiceProfileId?: string

  variant:
    | "normal"
    | "assisted"

  source:
    | "human"
    | "elevenlabs"
    | "azure"

  dialect:
    | "north"
    | "south"
    | "both"
    | "standard"

  status:
    | "pending"
    | "approved"
    | "rejected"

  priority: number

  storagePath: string

  durationMs?: number

  createdAt: string
  updatedAt: string
}
```

---

## 5.2 Multiple recordings per word

A single word may have:

- multiple human recordings
- multiple dialect recordings
- multiple assisted variants
- Azure fallback recordings

The system should support future expansion without requiring structural redesign.

---

## 5.3 Backward compatibility

Existing `audioUrl` fields may remain temporarily.

Long-term audio should resolve dynamically through the recording system.

Azure-generated audio remains important as fallback infrastructure.

---

## 5.4 Experimental ElevenLabs generation metadata

During the experimental ElevenLabs phase, each word may store lightweight generation and review metadata alongside its audio fields.

Suggested fields:

- `elevenLabsGenerationMode`
- `preferredElevenLabsGenerationMode`
- `elevenLabsPronunciationHint`
- audio review status metadata

`elevenLabsGenerationMode` records how the current ElevenLabs file was made.

`preferredElevenLabsGenerationMode` records how the word should be regenerated in future.

Current generation modes:

- `direct`
- `azure_transform`

This distinction matters because the best current file and the best future regeneration route may differ. A word may currently use an Azure-transformed rescue file while still being marked for future direct ElevenLabs regeneration once pronunciation hints, voice choice, or model behaviour improves.

`elevenLabsPronunciationHint` may be used for specific problem words where direct generation is close but needs guidance. Hints should be tried before Azure transform where appropriate, while still allowing Azure -> ElevenLabs as a rescue route for words that remain unreliable.

---

# 6. Audio Selection Logic

## 6.1 Selection goals

The resolver should:

- prioritise approved human audio
- respect dialect preference
- avoid dead-end missing audio states
- remain deterministic and testable
- preserve consistency and trust

---

## 6.2 North Wales preference example

Selection order:

1. Approved North Wales human recording
2. Approved Both/neutral human recording
3. Approved South Wales human recording
4. Azure fallback recording

---

## 6.3 South Wales preference example

Selection order:

1. Approved South Wales human recording
2. Approved Both/neutral human recording
3. Approved North Wales human recording
4. Azure fallback recording

---

## 6.4 Mixed Welsh

Mixed Welsh may:

- rotate approved recordings gently
- vary exposure over time
- avoid excessive repetition

However:

Avoid:

- chaotic randomisation
- abrupt tone changes
- inconsistent pacing between adjacent words

Voice variation should feel:

- intentional
- coherent
- calm

---

# 7. Contributor Recording System

## 7.1 Contributor role

Recording contributors should NOT receive full admin access.

Recommended roles:

### Founder/admin

Can:

- create assignments
- review recordings
- approve/reject takes
- manage priorities
- manage voice profiles
- manage audio routing

### Contributor

Can:

- access assigned recording sessions
- record words
- redo takes
- pause sessions
- view progress

Contributors should not access:

- content management
- app settings
- analytics
- other admin tooling

---

# 8. Recording Workflow Philosophy

## 8.1 Recording should feel frictionless

The recording experience should prioritise:

- rhythm
- flow
- clarity
- confidence
- low cognitive load

Avoid:

- excessive buttons
- file management
- complicated setup
- repeated save dialogs
- intimidating audio workflows

The contributor should focus on:

- pronunciation
- pacing
- consistency

not:

- software mechanics.

---

## 8.2 Recording session structure

A contributor receives:

- assigned word lists
- recording variant for the session
- estimated completion time
- progress tracking
- optional pronunciation notes
- dialect notes where needed

Normal and Assisted recordings should normally be recorded in separate contributor sessions rather than alternating after every word.

This is preferred because repeated switching creates unnecessary cognitive load.

Contributors tend to perform more consistently when they remain in one pacing mode.

Separate sessions improve:

- rhythm
- pacing consistency
- articulation consistency
- contributor flow

The contributor should ideally stay in one recording mindset during a session.

Preferred assignment structure:

### Assignment
North Wales Core Set

### Contains
- Normal recordings session
- Assisted recordings session

Contributor session cards may therefore read:

- Foundations Core Set — Normal recordings
- Foundations Core Set — Assisted recordings

Avoid presenting the ordinary workflow as:

- Foundations Core Set — Normal + Assisted

Mixed-mode recording may still be useful for future experimentation, internal tooling, or admin override flows.

However:

The preferred default should be separate sessions for separate recording variants.

The interface should display:

- large centred Welsh word
- optional English meaning
- optional contributor notes
- current recording variant
- clear recording state
- progress count
- estimated time remaining

---

## 8.3 Keyboard-first workflow

Recommended controls:

### Spacebar
Start/stop recording.

### Left arrow
Previous item.

### Right arrow
Next item.

### Backspace or R
Redo current recording.

### Escape
Pause/leave session.

The workflow should feel:

> fast, rhythmic, and low-friction.

---

## 8.4 Recording state clarity

The interface must make recording state extremely obvious.

The recording screen should ideally remain in one recording variant mode during a session.

Contributors should not need to repeatedly switch mentally between Normal and Assisted pacing.

The UI should therefore avoid constant visible NORMAL / ASSISTED mode switching during ordinary flow.

Recommended behaviour:

### Not recording
Neutral calm interface.

### Recording
- red accent state
- pulsing indicator
- visible timer
- clear “Recording…” label

Contributors should never feel uncertain about recording state.

---

## 8.5 Redo philosophy

Redo must feel:

- safe
- immediate
- obvious
- non-destructive

Recommended copy:

> “Redo this take”

Avoid making contributors anxious about mistakes.

---

# 9. Recording Modes

## 9.1 Initial MVP recommendation

Initial implementation should use:

## manual keyboard-controlled recording

rather than fully automated continuous recording.

This is:

- simpler
- safer
- easier to debug
- easier to review
- lower technical risk

---

## 9.2 Future continuous recording mode

Future versions may support:

- continuous audio capture
- voice activity detection (VAD)
- automatic segmentation
- automatic clip assignment

Potential workflow:

1. Start session once
2. Continuous recording begins
3. Speaker says word
4. Silence detected
5. Clip auto-sliced
6. Confirmation tone
7. Next word appears

This may eventually create an extremely elegant recording flow.

However:

This should be treated as a future enhancement, not an MVP requirement.

---

# 10. Contributor Playback Review

## 10.1 Playback philosophy

Automatic playback after every take should NOT be enabled by default.

Reason:

- breaks recording rhythm
- slows sessions significantly
- increases friction
- increases fatigue

---

## 10.2 Recommended review flow

After recording:

- show success state
- show Play button
- show Redo button
- optionally auto-advance

Contributors may manually review recordings if desired.

---

## 10.3 Optional review mode

Potential contributor preference:

### Review each take

If enabled:

- stop after each recording
- contributor reviews manually
- contributor confirms before continuing

If disabled:

- auto-save
- auto-advance
- flow-first recording mode

---

# 11. Admin Approval Workflow

## 11.1 Review system

Admins should be able to:

- listen to recordings
- compare variants
- approve/reject takes
- mark preferred recordings
- compare against Azure fallback
- request retakes
- bulk approve batches

---

## 11.2 Approval philosophy

Approval should prioritise:

- clarity
- natural pacing
- pronunciation trust
- consistency
- warmth
- intelligibility

Avoid optimising for:

- theatrical performance
- exaggerated diction
- over-production

---

# 12. Audio Processing Pipeline

## 12.1 Automatic processing

Uploaded recordings should automatically receive:

- silence trimming
- loudness normalisation
- gentle compression
- fade smoothing
- lightweight cleanup
- final encoding

The goal is:

- consistency
- clarity
- calm premium sound

---

## 12.2 Preserve naturalness

Processing should remain subtle.

Avoid:

- aggressive denoising artifacts
- harsh compression
- synthetic enhancement
- over-cleaned speech

The recordings should still feel:

- human
- intimate
- natural

---

## 12.3 File formats

Recommended:

### Store master
WAV

### Deliver to app
MP3 or Opus

Potential future support:

- adaptive streaming
- CDN optimisation
- replay caching

---

# 13. Recording Environment Standards

## 13.1 Home recording is acceptable

The system should intentionally support:

## controlled home recording

A professional studio is not required.

---

## 13.2 Recommended setup

Recommended:

- quiet room
- curtains/soft furnishings
- close microphone position
- dynamic USB microphone
- pop filter
- headphones

Avoid:

- kitchens
- bathrooms
- highly reflective rooms
- distant microphone placement

---

## 13.3 Simplicity matters

The setup should remain:

- easy
- low-storage
- non-intimidating
- quick to assemble

Avoid:

- large booths
- heavy acoustic systems
- complex interfaces
- technical engineering requirements

---

# 14. Rights & Permissions

## 14.1 Usage agreement

Contributors should explicitly grant permission for:

- in-app usage
- educational usage
- future app versions
- commercial product usage

---

## 14.2 AI training

Voice recordings should NOT automatically permit:

- AI voice cloning
- voice model training
- synthetic speech generation

These should require explicit separate agreement.

---

# 15. Suggested Initial Rollout

## Phase 1

Build:

- recording interface
- upload pipeline
- admin review tooling
- voice profile structure

Use local/internal testing first.

---

## Phase 2

Trial:

- founder recordings
- neighbours/local Welsh speakers
- small-scale experimentation

Record:

- first 100–200 words

Test:

- emotional response
- clarity
- pacing
- learner trust

---

## Phase 3

Hire:

- one trusted North Wales voice
- one trusted South Wales voice

Record:

- core foundational corpus
- normal recording sessions
- assisted recording sessions

---

## Phase 4

Expand:

- educational content
- spelling basics
- support lists
- sentence moments

Continue using Azure as fallback infrastructure.

---

# 16. Strategic Principle

The Trusted Welsh Voices system should remain:

- careful
- respectful
- premium
- human
- calm
- trustworthy

This system should deepen the quality of Spelio’s core experience rather than adding noise, complexity, or feature bloat.

The long-term goal is not:

> “lots of audio.”

The goal is:

> beautifully crafted Welsh listening that helps learners feel confident spelling Welsh.
