# Simplified Content Architecture Migration

Date: 2026-06-27

## Target Architecture

Spelio's long-term content model is:

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
2. collection/progression list order when explicit progression links are absent or exhausted.
3. existing least-seen fallback when there is no later incomplete list.

This supports Learning Journeys, Practice Library lists, teacher collections, GCSE collections, and custom collections without stage buckets. Collection order determines which collection comes first; list order determines progression inside each collection; explicit `nextListId` handles curated exceptions.

Practice Library seeded topic lists use the same lightweight catalogue display order for public grouping and recommendation fallback. This keeps learner-facing order aligned without reusing legacy `stage_id` or `focus_category_id` metadata.

## Catalogue Order vs Progression Order

Catalogue order and progression order are separate product concepts:

- Catalogue order controls how active public lists are grouped and displayed on the Word Lists page.
- Progression order controls the fallback recommendation path after the current list is progression-complete.
- `nextListId` is the strongest progression signal. If it points to an active incomplete list, it overrides catalogue/display order.
- If no usable `nextListId` path remains, recommendations fall back to collection and progression order, then the existing weakest/least-seen fallback.

For the current launch Practice Library, catalogue order and fallback progression order intentionally use the same Most Common topic sequence so the homepage recommendation does not contradict the public library.

Future browsable extras such as `Animals 1`, `Animals 2`, and `Animals 3` should not reuse stages or focus categories. If they simply need a curated path, set `nextListId` explicitly. If they must remain visible in the catalogue but excluded from default fallback recommendations, add a small explicit progression metadata field such as `includeInProgression` / `include_in_default_progression`, or a local Spelio-owned progression allowlist for seeded content. Do not add that field until there is active content that needs the distinction; `nextListId` plus collection/list order is enough for the current Learning, Practice Library, teacher, custom, and GCSE paths.

## Legacy Metadata Dependency Classification

| Dependency | Classification | Current role | Removal blocker |
| ---------- | -------------- | ------------ | --------------- |
| `stages` table | Legacy | Direct legacy admin route and export snapshot structure. | Admin loaders/export still query it for compatibility. |
| `word_lists.stage_id` | Legacy | Preserved on existing records, public loader field, old export/import field, and limited catalogue display fallback. | Public/admin loaders still select it and import/export still serializes it. |
| `focus_categories` table | Legacy | Direct legacy admin route and export snapshot structure. | Admin loaders/export still query it for compatibility. |
| `word_lists.focus_category_id` | Legacy | Preserved on existing records and old export/import fields. | Import/export and repository writes still include it for compatibility. |
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

Until those steps are complete, stage/focus fields are compatibility metadata only and should not be used for new product behaviour.
