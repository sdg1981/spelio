# Spelio — AI Design Direction & Visual Source of Truth v1.0

## Status

Foundational creative-direction and visual-governance document.

This document defines the canonical visual direction, branding rules, source-of-truth hierarchy, and AI-assisted design guidance for all future Spelio visual work.

It is intended to support:
- AI-assisted design generation
- Codex implementation work
- UI exploration
- landing-page design
- image generation
- mockups
- presentations
- future contributors
- visual consistency across the project

This document should evolve carefully and slowly.

It should preserve durable visual principles rather than temporary experiments.

---

# 1. Purpose

This document exists to:

- preserve visual consistency
- reduce design drift
- establish canonical visual references
- guide future AI-generated mockups and concepts
- clarify authoritative source files
- prevent accidental invention of unrelated visual systems
- maintain alignment between implementation and generated concepts

All future visual exploration should follow this document unless explicitly overridden.

---

# 2. Canonical Visual Source Hierarchy

When generating or implementing visual work for Spelio, use the following source-of-truth hierarchy.

Priority order:

1. Existing live implementation styles and layouts
2. Canonical design-reference screenshots
3. Existing logo assets
4. Existing public UI styling
5. Existing admin/control-panel styling
6. Product philosophy and MVP specifications
7. New exploratory concepts

Exploratory concepts should extend the existing direction rather than replace it arbitrarily.

---

# 3. Canonical Logo Assets

## 3.1 ChatGPT project-source environment

Inside ChatGPT project-source environments, the canonical logo asset is:

```text
spelio_logo.png
```

This uploaded logo asset should be treated as the canonical logo source for:
- image generation
- mockups
- concept visuals
- presentations
- homepage concepts
- social graphics
- marketing exploration

---

## 3.2 Codex / repository environment

Inside the actual repository/codebase environment, the canonical logo asset is:

```text
/designs/spelio_logo.svg
```

This SVG asset should be treated as the implementation source of truth.

Use the SVG wherever practical for:
- production UI
- responsive implementation
- scalable rendering
- favicons
- exported visuals
- future production assets

---

## 3.3 Logo rules

Do not:
- recreate the logo from memory
- invent alternate logos
- generate fake logo typography
- apply unrelated gradients/effects
- distort proportions
- substitute generic SaaS logos
- invent mascot branding
- create playful educational variants

Always prefer the real existing logo asset.

---

# 4. Canonical UI Design References

## 4.1 Design-reference files

Files beginning with:

```text
design-reference-
```

should be treated as canonical UI style references.

These files represent the current approved visual direction for:
- spacing
- typography
- visual density
- hierarchy
- colour balance
- surface treatment
- border softness
- shadow softness
- interaction tone
- responsive behaviour
- dark mode treatment
- overall emotional tone

---

## 4.2 Folder rules

### Inside repository / Codex environment

Canonical reference screenshots are expected inside:

```text
/designs
```

Examples:

```text
/designs/Design-Reference-Homepage.png
/designs/Design-Reference-How-Spelio-Works-Webpage.png
/designs/Design-Reference-Practice-Webpage.png
/designs/Design-Reference-Practice-End-Screen-Webpage.png
```

---

### Inside ChatGPT project-source environment

Reference screenshots may instead exist in the project root.

AI systems should still treat any files beginning with:

```text
design-reference-
```

as canonical visual references regardless of folder structure.

---

## 4.3 Design-reference philosophy

These screenshots should be treated as the primary source of truth for:
- overall feel
- layout rhythm
- emotional tone
- visual restraint
- spacing systems
- responsiveness
- typography scale
- UI polish direction

Future visual work should align with these references unless intentionally exploring a new direction.

---

# 5. Existing Codebase Styling

## 5.1 Front-end styles

When working inside the real repository/codebase, AI systems and contributors should also reference:
- existing frontend stylesheets
- Tailwind configuration
- shared design tokens
- component styling
- spacing systems
- animation behaviour
- dark mode implementation

The live implementation is an important source of truth.

Avoid generating concepts that ignore the actual implementation direction.

---

## 5.2 Admin/control-panel styling

The admin/control-panel interface intentionally has a different visual character from the public learner-facing interface.

Rules:

### Public learner UI
Should feel:
- calm
- premium
- restrained
- warm
- focused
- emotionally safe
- elegant

### Admin/control-panel UI
May feel:
- more functional
- denser
- operational
- tooling-oriented
- less emotionally styled

Do not accidentally merge the two visual systems together.

Public learner visuals should remain the primary emotional brand surface.

---

# 6. Visual Philosophy

Spelio should feel:

- calm
- premium
- restrained
- intelligent
- adult-oriented
- tactile
- focused
- emotionally safe
- beautifully crafted
- lightweight
- respectful

The product should feel like:

> a carefully designed spelling-practice tool

not:

> a loud educational game.

---

# 7. Calmness Philosophy

Calmness is an interaction principle, not a decorative visual theme.

Calm means:
- low distraction
- low cognitive load
- restrained feedback
- clean hierarchy
- focused interaction
- visual clarity
- emotionally safe interaction
- fast understanding

Calm does NOT mean:
- meditation-app styling
- nature branding
- countryside imagery
- wellness aesthetics
- rustic Welsh tourism visuals
- sleepy/sluggish interaction

Spelio should feel modern, precise, responsive, and thoughtfully crafted.

---

# 8. Visual Direction Rules

Preferred characteristics:
- warm off-white backgrounds
- restrained contrast
- subtle depth
- soft elevated surfaces
- clean spacing
- elegant typography
- low visual noise
- responsive layouts
- restrained animation
- editorial calmness

Avoid:
- heavy gradients
- childish educational styling
- cartoon visuals
- dashboard clutter
- loud gamification
- exaggerated SaaS aesthetics
- neon colours
- visual chaos
- enterprise heaviness
- decorative Welsh clichés

---

# 9. Typography Direction

Typography should feel:
- modern
- editorial
- elegant
- calm
- highly readable
- carefully spaced

Avoid:
- novelty fonts
- playful classroom fonts
- cartoon typography
- exaggerated rounded “kids app” styles

Typography should support:
- clarity
- confidence
- emotional restraint
- premium feel

---

# 10. Motion Direction

Animation and motion should be:
- subtle
- restrained
- premium
- lightweight
- functional

Allowed examples:
- soft fades
- restrained transitions
- subtle hover states
- gentle feedback motion
- small responsive polish

Avoid:
- bouncing
- confetti
- noisy celebration effects
- exaggerated motion
- attention-hacking animation
- arcade-style feedback

Motion should support:
- responsiveness
- tactility
- perceived quality

not:
- stimulation
- gamification
- spectacle

---

# 11. Image Generation Rules

When generating images, mockups, or concepts:

Always:
- reference the canonical logo asset
- align with design-reference screenshots
- preserve existing spacing rhythm
- preserve existing colour direction
- preserve calm visual tone
- preserve adult-oriented restraint
- preserve current UI hierarchy

Do not:
- invent unrelated branding
- introduce random new colours
- generate fantasy UI systems
- redesign the app into a gamified platform
- create childish educational aesthetics
- create visually noisy SaaS dashboards
- ignore the existing implementation direction

Concept generation should feel like:
- an extension of Spelio

not:
- an unrelated redesign exercise.

---

# 12. Relationship To Product Philosophy

Visual design should remain aligned with:
- MVP specification
- product philosophy
- learning philosophy
- trusted Welsh voices philosophy
- Welsh spelling basics philosophy

The emotional direction should consistently support:
- concentration
- trust
- confidence
- attentiveness
- careful listening
- meaningful repetition
- thoughtful beauty

---

# 13. Strategic Principle

Spelio’s visual identity should evolve carefully.

New visuals should strengthen:
- clarity
- calmness
- emotional safety
- premium quality
- learner trust
- visual consistency

rather than chasing:
- trends
- novelty
- visual spectacle
- gamified engagement patterns
- generic SaaS aesthetics
- noisy educational design

The long-term ambition is for Spelio to feel like:

> one of the most carefully crafted spelling-practice experiences available.

