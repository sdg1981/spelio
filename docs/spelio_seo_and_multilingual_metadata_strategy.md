# Spelio SEO and Multilingual Metadata Strategy

Version: 1.0  
Status: Strategy only - no app implementation yet

## 1. Product SEO Philosophy

Spelio should use SEO to make its genuinely useful public pages understandable to search engines and share previews. It should not become a marketing system, keyword dashboard, or content-growth machine.

The public positioning should stay close to the product:

- calm Welsh spelling practice
- hear -> recall -> spell
- adult-oriented
- focused practice, not a full Welsh course
- lightweight Welsh spelling basics pages
- short, useful explanations rather than lesson-style content

SEO copy should sound like Spelio: restrained, clear, and practical. Avoid exaggerated claims, childish educational phrasing, urgency, ranking language, or generic "learn fast" promises.

Good metadata for Spelio should help a learner understand:

- what the page is
- whether it is about Welsh spelling specifically
- whether it is a practice page, explanation page, shared list, or utility page
- whether the page is intended to be indexed or just shared

## 2. Current Routing and Metadata Problem Summary

Spelio is currently a React/Vite single-page app with custom path-to-screen logic in `src/App.tsx`. It does not use React Router for the public frontend.

Current metadata is defined statically in `index.html`:

- one document title for all public pages
- one meta description for all public pages
- one canonical URL pointing to `https://spelio.app`
- one OG/Twitter metadata set pointing to the homepage
- no route-aware metadata component
- no React Helmet / Helmet Async
- no manual per-route `document.title` updates
- no true fallback or 404 metadata

This means standalone public pages such as `/spelling-basics`, `/spelling-basics/dd`, `/how-spelio-works`, `/word-lists`, `/about`, and shared list URLs all inherit homepage metadata.

The practical issues are:

- public content pages do not have unique titles or descriptions
- all routes incorrectly canonicalise to the homepage
- social sharing previews do not reflect the shared page
- temporary custom list pages are shareable but not distinguished from permanent public pages
- unknown routes fall back to the homepage rather than a true not-found page
- Welsh interface routes exist, but there is no multilingual metadata strategy yet

## 3. Recommended MVP Metadata Strategy

For MVP, implement a small route-aware metadata layer, not a heavy SEO system.

Metadata generation should remain deterministic, simple, and route-aware. Do not introduce SSR, prerendering pipelines, crawler-specific rendering systems, SEO frameworks, or heavy metadata infrastructure during MVP unless there is clear evidence that search indexing limitations materially affect discovery. Keep the implementation suitable for the current Vite/React single-page app.

The metadata layer should define metadata close to the public route model and support:

- document title
- meta description
- canonical URL
- robots handling, especially `noindex`
- OG title
- OG description
- OG URL
- OG image
- Twitter card equivalents
- optional Welsh metadata where Welsh page/interface content exists

The strongest MVP candidates for unique indexed metadata are:

1. Homepage
2. How Spelio Works
3. Word Lists
4. Spelling Basics index
5. Individual Spelling Basics topic pages
6. About
7. Privacy

Shared built-in word-list URLs should have unique metadata if the list can be resolved. These routes are useful and shareable, but their indexing priority is lower than Spelling Basics pages.

Temporary custom-list URLs should have useful share metadata, but should usually be `noindex` because they expire and may contain user-generated content.

Do not add a CMS-style SEO editor, analytics dashboard, keyword fields, or admin metadata management for MVP.

## 4. English/Welsh Metadata Handling

English should remain the primary indexed version for now.

Welsh metadata should be supported where Welsh interface or Welsh content exists, but Spelio should avoid overbuilding multilingual SEO before the URL strategy is stable.

Recommended MVP approach:

- Treat `/` as the primary canonical English homepage.
- Treat English metadata as the default metadata source.
- Support Welsh title and description fields in the metadata model.
- Use Welsh metadata when the active interface route or resolved page is Welsh.
- Do not create a separate Welsh metadata management system.
- Do not automatically translate metadata with ad hoc runtime logic.
- Keep Welsh metadata manually written, short, and natural.
- Preserve Welsh characters and diacritics in metadata by default, including words and letters such as `dŵr`, `tŷ`, `Cymraeg`, `Ŵ`, and `Ŷ`.
- Only sanitise or ASCII-normalise metadata where technically necessary for a specific field, integration, or external system.

For `/cy`, the recommended MVP decision is:

- Do not index `/cy` as a separate Welsh homepage yet.
- Canonicalise `/cy` to `/` for now.
- Keep Welsh interface support for users, but avoid adding multilingual indexing complexity until Spelio has a clearer Welsh URL and content strategy.

Reasoning:

- `/cy` currently changes interface language rather than representing a fully separate Welsh content edition.
- Static `<html lang="en">` currently does not reflect Welsh route state.
- Indexing `/cy` without complete Welsh route metadata, language tags, and hreflang would create avoidable ambiguity.

Future Welsh indexing can be added deliberately once Spelio has a stable multilingual URL plan.

## 5. Canonical URL Rules

Canonical URLs should describe the preferred indexable URL for each public page.

Recommended rules:

- `/` canonicalises to `https://spelio.app/`.
- `/cy` canonicalises to `https://spelio.app/` for MVP.
- `/how-spelio-works` canonicalises to itself.
- `/word-lists` canonicalises to itself.
- `/spelling-basics` canonicalises to itself.
- `/spelling-basics/:slug` canonicalises to itself when the slug is valid.
- `/spelling-basics/wy` should canonicalise to `/spelling-basics/w`, matching the current in-app redirect behavior.
- `/about` canonicalises to itself.
- `/privacy` canonicalises to itself.
- `/feedback` can canonicalise to itself if indexed, or be `noindex` if treated as utility-only.
- `/list/:slug` canonicalises to itself when the built-in list is active and the slug is valid.
- `/list/:slug?mode=practice-test` should either canonicalise to `/list/:slug` or to the full practice-test URL, depending on whether practice-test mode is intended to be indexable as separate content.
- `/custom-list/new` canonicalises to itself if indexed.
- `/custom-list/:id/share` should usually be `noindex`; canonical can point to itself for sharing consistency.
- `/custom/:id` should usually be `noindex`; canonical can point to itself for sharing consistency.
- `/custom/:id?mode=practice-test` should usually be `noindex`; canonical can include the practice-test mode if the share preview should distinguish it.
- Unknown paths should not canonicalise to the homepage if a 404 route is added. They should use a not-found canonical or `noindex`.

For MVP, canonical generation should be deterministic and based on route parsing, not on the current browser URL blindly.

## 6. noindex Rules

Use `noindex` sparingly and intentionally.

Recommended `index, follow` pages:

- `/`
- `/how-spelio-works`
- `/word-lists`
- `/spelling-basics`
- `/spelling-basics/:slug`
- `/about`
- `/privacy`
- valid `/list/:slug` built-in shared list pages, if Spelio wants them discoverable

Recommended `noindex, follow` pages:

- `/cy` for MVP, while it canonicalises to `/`
- `/feedback`, if treated as a utility page rather than public content
- `/custom-list/new`, if Spelio does not want the creation form indexed
- `/custom-list/:id/share`
- `/custom/:id`
- `/custom/:id?mode=practice-test`
- `/practice?...`
- state-only practice or end screens if they ever become routable
- unknown or invalid routes
- expired, missing, invalid, or moderation-blocked custom list pages

Temporary custom lists should be shareable without becoming search landing pages.

Reasons to `noindex` custom lists:

- they expire after 14 days
- they may contain user-generated content
- they are primarily shared by link or QR code
- their content is not part of Spelio's stable public editorial surface

## 7. OG/Social Sharing Rules

OG and Twitter metadata should support useful, calm sharing previews. The goal is accurate context, not promotional language.

Default OG image:

- Use the existing Spelio OG image for general public pages.
- Keep one high-quality default image for MVP.
- Do not create many page-specific social images yet.

Recommended OG rules:

- Homepage uses product-level title and description.
- How Spelio Works uses route-specific title and description.
- Spelling Basics index uses a spelling-basics-specific title and description.
- Individual Spelling Basics topics use topic-specific titles and descriptions.
- Built-in shared word-list pages use the list display name where available.
- Built-in practice-test links should include "practice test" in the OG title or description if the mode is active.
- Custom list pages should use the custom list title when available, with a safe fallback such as "Custom Welsh spelling list".
- Expired or missing custom list pages should not generate misleading share titles.

Recommended default social copy:

- Title: `Spelio - Welsh Spelling Practice App`
- Description: `Spelio is a focused Welsh spelling practice app for learners. Listen to Welsh, learn spelling patterns, recall words and type the correct spelling.`

Avoid social text such as:

- "Master Welsh spelling fast"
- "The best Welsh spelling app"
- "Fun spelling games for kids"
- "Boost your Welsh instantly"
- "Unlock your full potential"

## 8. Spelling Basics Page Metadata Strategy

Spelling Basics pages are the strongest candidates for individual metadata.

They are:

- stable public content
- lightweight and useful
- aligned with learner search intent
- specific enough to deserve unique titles and descriptions
- directly connected to focused practice

Early manual search observations suggest the strongest organic opportunity is not generic "learn Welsh" SEO, but specific Welsh spelling and pronunciation intent: Welsh digraphs and sounds, Welsh orthography questions, pronunciation of high-confusion Welsh words, and selected place names. This should guide future page prioritisation without overriding Spelio's calm, quality-led SEO philosophy.

Future research may also assess carefully curated Welsh place-name and personal-name pronunciation pages around search demand such as "how to pronounce [Welsh place name]", "how to pronounce [Welsh name]", "Welsh name pronunciation", and "Welsh place-name pronunciation". These should not become mass-generated SEO pages. Any future value should come from trusted Welsh audio, spelling explanation, pronunciation guidance, links back to relevant Foundations patterns, and genuine public usefulness.

Recommended indexed pages:

- `/spelling-basics`
- `/spelling-basics/phonetic`
- `/spelling-basics/why-welsh-looks-different`
- `/spelling-basics/ff`
- `/spelling-basics/dd`
- `/spelling-basics/ll`
- `/spelling-basics/ch`
- `/spelling-basics/rh`
- `/spelling-basics/w`
- `/spelling-basics/y`
- `/spelling-basics/accents`

Recommended title pattern:

- `{Topic title} - Spelio`
- For sound pages: `Welsh {pattern} sound and spelling - Spelio`

Recommended description pattern:

- one plain sentence
- mention Welsh spelling
- mention the specific sound, accent, or pattern
- optionally mention examples or focused practice
- avoid sounding like a full Welsh lesson

Example metadata:

| Route | Recommended title | Recommended description |
| --- | --- | --- |
| `/spelling-basics` | `Welsh spelling basics - Spelio` | `Simple Welsh spelling notes for adults, covering sounds, accents, and patterns that help with focused practice.` |
| `/spelling-basics/phonetic` | `Welsh is mostly phonetic - Spelio` | `A short guide to why Welsh spelling is often more regular than it first looks, with sounds and examples for practice.` |
| `/spelling-basics/why-welsh-looks-different` | `Why Welsh looks different from English - Spelio` | `A calm explanation of Welsh spelling patterns such as dd, ll, ch, rh, ff, w, and y.` |
| `/spelling-basics/ff` | `Welsh ff sound and spelling - Spelio` | `Learn how Welsh ff works, why it differs from single f, and practise recognising it in common Welsh words.` |
| `/spelling-basics/dd` | `Welsh dd sound and spelling - Spelio` | `A short guide to the Welsh dd sound, with examples and focused spelling practice.` |
| `/spelling-basics/ll` | `Welsh ll sound and spelling - Spelio` | `Learn to recognise the Welsh ll sound pattern in common words and practise spelling it with Spelio.` |
| `/spelling-basics/ch` | `Welsh ch sound and spelling - Spelio` | `A simple guide to Welsh ch, how it differs from English ch, and how to recognise it in spelling practice.` |
| `/spelling-basics/rh` | `Welsh rh sound and spelling - Spelio` | `Learn to notice rh as a Welsh spelling pattern, with examples and focused practice.` |
| `/spelling-basics/w` | `Welsh w as a vowel - Spelio` | `A short guide to Welsh w as a vowel sound, with examples such as dŵr, cwm, byw, and bwrdd.` |
| `/spelling-basics/y` | `Welsh y as a vowel - Spelio` | `Learn how Welsh y can sound in common words and practise recognising it as part of Welsh spelling.` |
| `/spelling-basics/accents` | `Welsh accents and long vowels - Spelio` | `A short guide to Welsh accents, long vowel sounds, and why small marks can change words.` |

Note: metadata should preserve Welsh characters and diacritics by default. Sanitise or ASCII-normalise only where a specific technical constraint requires it.

## 9. Shared Word-List Metadata Strategy

Built-in shared word-list routes use `/list/:slug`.

These pages are public and shareable. They can be indexed if Spelio wants each official list to be discoverable, but their SEO priority is lower than Spelling Basics pages.

Recommended metadata:

- Title: `{List name} | Spelio`
- Description: use the list description if available and suitable; otherwise use a calm fallback.
- Canonical: `/list/:slug`
- OG title: same as title or slightly shorter
- OG description: list description or fallback
- OG URL: canonical URL

Fallback description:

`Practise this Welsh word list in Spelio. Hear each word, recall it, and type the spelling in a focused session.`

Practice-test mode:

- If `?mode=practice-test` is active, social metadata should reflect practice-test mode.
- Recommended title: `{List name} practice test - Spelio`
- Recommended description: `Open a focused Welsh spelling practice test for this word list, with audio-first prompts and reduced assistance.`

Indexing decision for practice-test mode:

- Prefer canonicalising practice-test mode to `/list/:slug` for MVP.
- Keep OG URL and share URL accurate if the link is being shared as a practice test.
- Avoid creating duplicate indexed pages for the same list unless practice tests become a stable public content type.

Invalid or inactive list slugs:

- should not silently use homepage metadata
- should eventually render a not-found state
- should be `noindex`

## 10. Custom List Metadata Strategy

Custom list routes are useful for sharing, but should not be treated as permanent indexed content.

Relevant routes:

- `/custom-list/new`
- `/custom-list/:id/share`
- `/custom/:id`
- `/custom/:id?mode=practice-test`

Recommended handling:

- `/custom-list/new` can have unique metadata, but may be `noindex` if Spelio wants search results to focus on content rather than utility forms.
- `/custom-list/:id/share` should be `noindex, follow`.
- `/custom/:id` should be `noindex, follow`.
- `/custom/:id?mode=practice-test` should be `noindex, follow`.
- Expired, missing, or failed custom list states should be `noindex`.

Recommended custom list share metadata:

- Title: `{List title} | Spelio`
- Description: `Open this custom Welsh spelling list in Spelio and practise with audio, recall, and typed answers.`
- Practice-test title: `{List title} practice test - Spelio`
- Practice-test description: `Open a focused practice test for this custom Welsh spelling list.`

Fallback title:

`Custom Welsh spelling list - Spelio`

Fallback description:

`Open a custom Welsh spelling list in Spelio for focused spelling practice.`

Custom list metadata must be defensive:

- trim overly long titles
- avoid exposing rejected or unavailable content
- avoid indexing temporary user-generated pages
- use safe fallbacks while list data is loading

## 11. Future hreflang Approach

Do not overbuild hreflang for MVP.

For now:

- English remains the primary indexed version.
- `/cy` should canonicalise to `/`.
- Welsh metadata fields can be added to the metadata model.
- The app can set Welsh metadata when users are on Welsh interface routes, but indexing should remain English-first.

Future hreflang should be considered when:

- Spelio has stable Welsh-language public URLs
- Welsh page content is equivalent enough to English pages
- `<html lang>` can be set accurately per route
- canonical URLs are language-specific
- every indexable English page has a clear Welsh alternate, or missing alternates are handled intentionally

Possible future URL model:

- English: `/spelling-basics/dd`
- Welsh: `/cy/spelling-basics/dd`

Future hreflang tags for equivalent pages:

```html
<link rel="alternate" hreflang="en" href="https://spelio.app/spelling-basics/dd" />
<link rel="alternate" hreflang="cy" href="https://spelio.app/cy/spelling-basics/dd" />
<link rel="alternate" hreflang="x-default" href="https://spelio.app/spelling-basics/dd" />
```

Do not add hreflang until the Welsh route strategy is real and consistent. Incorrect hreflang is worse than no hreflang.

## 12. Recommended Implementation Plan in Phases

### Phase 1: Minimal Metadata Infrastructure

Add a small route-aware metadata utility.

Scope:

- define a `PageMetadata` type
- define default metadata
- resolve metadata from the current path, query string, language, and any loaded list/topic data
- update title, meta description, canonical, robots, OG, and Twitter tags
- keep metadata definitions in code, close to route/content data
- avoid adding Helmet unless it clearly improves maintainability

Recommended output:

- one metadata resolver
- one small React component or hook used from `App.tsx`
- no admin UI
- no database-backed SEO fields

### Phase 2: Permanent Public Pages

Add unique metadata for stable public pages:

- `/`
- `/how-spelio-works`
- `/word-lists`
- `/spelling-basics`
- `/about`
- `/privacy`
- `/feedback`, with a deliberate index/noindex decision

Also fix canonical URLs so these pages no longer point to the homepage.

### Phase 3: Spelling Basics Topic Pages

Add unique indexed metadata for each Spelling Basics topic.

Scope:

- title and description per topic
- canonical per topic
- OG and Twitter fields derived from the same metadata
- `/spelling-basics/wy` canonicalises to `/spelling-basics/w`
- invalid topic slugs become not-found or `noindex`

This is the highest-value SEO content phase.

### Phase 4: Shared Built-In Word Lists

Add dynamic metadata for `/list/:slug`.

Scope:

- use active list name and description
- use calm fallback copy when list data is unavailable
- decide whether built-in shared lists are indexable
- canonicalise practice-test mode to the main list URL for MVP
- keep practice-test OG metadata accurate for shared links

### Phase 5: Custom List Sharing Metadata

Add share-focused metadata for custom list routes.

Scope:

- dynamic title from custom list title
- safe fallback while loading
- `noindex, follow`
- practice-test share metadata
- expired/missing/error states remain `noindex`

This phase is about better link previews, not search indexing.

### Phase 6: Not-Found and Invalid Route Handling

Add a true public not-found screen.

Scope:

- unknown public paths render a not-found state instead of homepage
- invalid slugs render not-found or an appropriate unavailable state
- not-found pages use `noindex`
- canonical should not point to the homepage

This prevents accidental homepage metadata on bad URLs.

### Phase 7: Multilingual Foundation

Prepare for future Welsh indexing without enabling full hreflang yet.

Scope:

- support Welsh metadata fields
- set `html lang` based on active interface/content language
- keep `/cy` canonicalised to `/` for MVP
- document criteria for when `/cy` or `/cy/...` routes should become indexable
- add hreflang only when Welsh URLs and equivalent Welsh content are stable

This keeps Spelio ready for multilingual growth without adding premature complexity.
