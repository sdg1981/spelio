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
2. collection/list order when explicit progression links are absent or exhausted.
3. existing least-seen fallback when there is no later incomplete list.

This supports Learning Journeys, Practice Library lists, teacher collections, GCSE collections, and custom collections without stage buckets. Collection order determines which collection comes first; list order determines progression inside each collection; explicit `nextListId` handles curated exceptions.

## Legacy Metadata Dependency Classification

| Dependency | Classification | Current role | Removal blocker |
| ---------- | -------------- | ------------ | --------------- |
| `stages` table | Transitional | Admin reference records and export snapshot structure. | Admin loaders/export still query it. |
| `word_lists.stage_id` | Transitional | Admin edit value, public loader field, old export/import field, limited catalogue display fallback. | Public/admin loaders still select it and import/export still serializes it. |
| `focus_categories` table | Legacy | Direct legacy admin route and export snapshot structure. | Admin loaders/export still query it for compatibility. |
| `word_lists.focus_category_id` | Legacy | Preserved on existing records and old export/import fields. | Import/export and repository writes still include it for compatibility. |
| Recommendation stage fallback | Dead | Previously grouped fallback recommendations by `stage`. | Removed; covered by collection/list order tests. |
| Practice Library focus grouping | Dead | No live grouping responsibility. | None; Practice Library display uses catalogue display mapping. |

## Why Full Schema Removal Should Wait

Dropping `stage_id`, `focus_category_id`, `stages`, and `focus_categories` is conceptually correct, but not yet a safe single-step migration because:

1. Public and admin Supabase loaders still select `stage_id`, `stages(name)`, and `focus_category_id`.
2. Admin word-list create/edit still writes `stage_id`; `focus_category_id` is preserved when already present but no longer required or assigned for new lists.
3. Admin export schema version `1.5` still includes `stages`, `focusCategories`, `stage`, `stageId`, `focus`, and `focusCategoryId`.
4. Import validation still accepts and normalizes old snake-case and camel-case stage/focus fields.
5. Existing migration history inserts values into these columns before any future drop migration would run, so app code and export compatibility need to change before the final schema drop.

## Safe Removal Sequence

1. Update public catalogue fallback so non-special collections group by collection/list display metadata, not `stage`.
2. Remove stage selectors from day-to-day admin word-list editing. Focus selectors are already removed from normal admin list creation/editing.
3. Version admin export to a new schema that omits stage/focus fields while keeping import compatibility for older exports.
4. Remove stage/focus joins, repository writes, and public loader selects.
5. Add a final database migration to drop `word_lists.stage_id`, `word_lists.focus_category_id`, `public.stages`, and `public.focus_categories`.

Until those steps are complete, stage/focus fields are compatibility metadata only and should not be used for new product behaviour.
