# Simplified Content Architecture Migration

Date: 2026-06-27

## Target Architecture

Spelio's current active content model is:

```text
Collections
  Word Lists
    Words
```

Collections carry top-level product structure such as Learning, Practice Library, teacher collections, GCSE collections, custom collections, and future collection types.

Word Lists belong to one collection, have explicit `order`, and may optionally point to an explicit `nextListId`.

Words belong to one word list and keep their existing spelling, audio, dialect, and review metadata.

## Progression Behaviour

Normal recommendation progression now uses:

1. `nextListId` traversal when present and usable.
2. collection/list order when explicit progression links are absent or exhausted.
3. existing least-seen fallback when there is no later incomplete list.

This supports Learning Journeys, Practice Library lists, teacher collections, GCSE collections, and custom collections without stage buckets or Focus Categories. Collection order determines which collection comes first; word-list order determines the normal catalogue/display order and fallback recommendation order inside each collection/category display; explicit `nextListId` handles curated progression exceptions.

Admin Collections pages should be the normal place to arrange word-list order and curated progression order. They should expose clear links to the word lists in the collection where that navigation has been implemented.

Practice Library seeded topic lists use their database/admin `order` values as the public catalogue order. Category grouping remains lightweight display metadata, but it must not silently reorder lists in a way that contradicts admin order.

## Catalogue Order vs Progression Order

Catalogue order and progression order are related but distinct product concepts:

- Catalogue/display order is the word-list order used when active public lists are grouped and displayed on the Word Lists page or inside a Practice Library category.
- Curated progression is the explicit `nextListId` path after the current list is progression-complete.
- `nextListId` is the strongest progression signal. Continue learning should walk the explicit chain and skip only active lists that already have the same full-completion state used for the Word Lists completion tick.
- Attempted, amber/in-progress, progression-complete, or unresolved-difficulty lists are still unfinished for this purpose and should not be skipped.
- If no usable `nextListId` path remains because the chain is empty, exhausted, broken, looping, or only contains tick-completed lists, recommendations may fall back to collection/list order, then the existing weakest/least-seen fallback.
- Do not introduce a separate progression order number unless a future content need proves it necessary.
- Do not reintroduce stages or focus categories for progression.

For the current launch Practice Library, catalogue order and fallback progression order intentionally use the same Most Common topic sequence from each list's `order` value so the homepage recommendation does not contradict the public library or admin editing UI.

Practice Library categories such as Animals, Food & Drink, Places & Travel, and People & Home are catalogue/display groupings. They are not Focus Categories. If those groupings need durable metadata later, represent them with explicit catalogue/display metadata rather than resurrecting legacy `focus_categories`.

Future browsable extras such as `Animals 1`, `Animals 2`, and `Animals 3` should not reuse stages or focus categories. If they simply need a curated path, set `nextListId` explicitly. If they must remain visible in the catalogue but excluded from default fallback recommendations, add a small explicit progression metadata field such as `includeInProgression` / `include_in_default_progression`, or a local Spelio-owned progression allowlist for seeded content. Do not add that field until there is active content that needs the distinction; `nextListId` plus collection/list order is enough for the current Learning, Practice Library, teacher, custom, and GCSE paths.

## Legacy Metadata Dependency Classification

| Dependency | Classification | Current role | Removal blocker |
| ---------- | -------------- | ------------ | --------------- |
| `stages` table | Compatibility only | Direct legacy admin route and export snapshot structure. Not part of normal admin editing. | Admin loaders/export still query it for compatibility. |
| `word_lists.stage_id` | Compatibility only | Preserved on existing records, public loader field, old export/import field, and limited catalogue display fallback. New content should not rely on it. | Public/admin loaders still select it and import/export still serializes it. |
| `focus_categories` table | Compatibility only | Direct legacy admin route and export snapshot structure. Not an active editorial structure. | Admin loaders/export still query it for compatibility. |
| `word_lists.focus_category_id` | Compatibility only | Preserved on existing records and old export/import fields. Must not be used for Practice Library categories. | Import/export and repository writes still include it for compatibility. |
| Recommendation stage fallback | Dead | Previously grouped fallback recommendations by `stage`. | Removed; covered by collection/list order tests. |
| Practice Library focus grouping | Dead | No live grouping responsibility. | None; Practice Library display uses catalogue display mapping. |

## Why Full Schema Removal Should Wait

Dropping `stage_id`, `focus_category_id`, `stages`, and `focus_categories` is conceptually correct, but not yet a safe single-step migration because:

1. Public and admin Supabase loaders still select `stage_id`, `stages(name)`, and `focus_category_id`.
2. Admin word-list create/edit preserves existing `stage_id` and `focus_category_id` values, but neither field is required or assigned for new lists.
3. Admin export schema version `1.5` still includes `stages`, `focusCategories`, `stage`, `stageId`, `focus`, and `focusCategoryId`.
4. Import validation still accepts and normalizes old snake-case and camel-case stage/focus fields.
5. Existing migration history inserts values into these columns before any future drop migration would run, so app code and export compatibility need to change before the final schema drop.

## Safe Removal Sequence

1. Update public catalogue fallback so non-special collections group by collection/list display metadata, not `stage`.
2. Stage and focus selectors are already removed from normal admin list creation/editing.
3. Version admin export to a new schema that omits stage/focus fields while keeping import compatibility for older exports.
4. Remove stage/focus joins, repository writes, and public loader selects.
5. Add a final database migration to drop `word_lists.stage_id`, `word_lists.focus_category_id`, `public.stages`, and `public.focus_categories`.

Until those steps are complete, stage/focus fields are compatibility metadata only and should not be used for new product behaviour, normal admin editing, Practice Library categories, ordering, recommendations, progression, or session generation.
