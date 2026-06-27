# Admin Legacy Content Metadata Audit

Date: 2026-06-27

Status update: recommendation fallback now uses explicit `nextListId`, then collection/list order. `stage_id` no longer drives progression recommendations.

## Scope

This audit covers the legacy `stages` and `focus_categories` reference tables and the `word_lists.stage_id` and `word_lists.focus_category_id` fields.

Current product architecture:

- Learning
  - Learning Journeys
  - Welsh Spelling Foundations
  - future concept-led journeys
- Practice Library
  - category-led topic collections
  - Animals, Food & Drink, People & Home, Places & Travel, etc.

## Verdict Table

| Item | Current role | Live behaviour affected | Verdict | Recommended action |
| ---- | ------------ | ----------------------- | ------- | ------------------ |
| `stages` | Reference table for legacy list-stage labels. Admin joins it to resolve `word_lists.stage_id` to `list.stage`; export includes it. | Transitional only. Public catalogue fallback can still display resolved `list.stage` for non-special collections, but progression recommendations no longer use it. | Deprecate | Remove from the future architecture. Keep only until admin import/export and catalogue fallback are versioned away from it. |
| `stage_id` | Foreign key on `word_lists`; selected in public/admin content loaders; editable in word-list admin; imported/exported. | Transitional only. Public catalogue checks `stageId === "foundations"` for one display override, but recommendations and session generation no longer use it. | Deprecate | Replace display fallback with collection/list metadata, then version import/export and drop the field/table in a later migration. |
| `focus_categories` | Reference table for legacy/editorial list-purpose labels. Admin still has a direct legacy route and export includes it for schema 1.5 compatibility. | No learner-facing behaviour found. Not used by public catalogue grouping, ordering, recommendations, progression, or session generation. | Deprecate | Removed from normal admin navigation and word-list editing. Keep only for old import/export compatibility until the export schema is versioned. |
| `focus_category_id` | Foreign key on `word_lists`; imported/exported and preserved on existing records. New normal admin word-list creation does not require or assign it. | No learner-facing behaviour found. Session and recommendation tests confirm changing `focus` labels does not change recommendations or generated session words. | Deprecate | Preserve existing values, allow null for new lists, version out of import/export before dropping the schema column. |

## Detailed Findings

### Stages and stage_id

Storage:

- `public.stages` is created in `supabase/migrations/202605070001_admin_content_schema.sql`.
- `public.word_lists.stage_id` is a nullable foreign key to `public.stages(id)`.
- The static JSON dataset does not carry `stageId`; local static content derives it from the list `stage` string.
- Live Supabase content uses `stage_id` on migrated word lists.

Current records:

- Seeded stage records are `foundations`, `core`, `spelling`, `usage`, and `confidence`.
- Support content adds `support`.
- Current Practice Library topic lists are seeded with `stage_id = "core"`, which is not semantically useful for the new category-led architecture.

Code paths:

- Public Supabase loader selects `stage_id` and `stages(name)`, then maps them to `WordList.stageId` and `WordList.stage`.
- Static loader derives `stageId` from `stage`.
- Public catalogue display uses `stageId === "foundations"` for the Welsh Spelling Foundations display override, and uses `list.stage` for fallback grouping outside the special Learning and Practice Library paths.
- Recommendations used to use `list.stage` as a fallback bucket after explicit `nextListId` traversal failed. They now use collection/list order instead.
- Session generation does not read `stage` or `stageId`.
- Admin word-list edit reads and writes `stageId`.
- Import/export preserves `stage`, `stageId`, and the `stages` reference list.

Conceptual status:

`stage_id` is not a good product name under the current architecture. It is no longer needed for progression recommendations, but remains present in admin editing, import/export, public content loading, and one catalogue display fallback.

Safe deprecation path:

1. Move public catalogue display overrides away from `stageId`.
2. Remove stage editing from the day-to-day word-list admin form.
3. Version import/export so older payloads can still be read while new exports omit `stages`, `stage`, and `stageId`.
4. Add a schema migration that drops `word_lists.stage_id`, then `public.stages`, after app code no longer selects or writes them.

### Focus Categories and focus_category_id

Storage:

- `public.focus_categories` is created in `supabase/migrations/202605070001_admin_content_schema.sql`.
- `public.word_lists.focus_category_id` is a nullable foreign key to `public.focus_categories(id)`.

Current records:

- Seeded focus records are `core-vocabulary`, `phrase`, `function-words`, `mixed`, `topic-vocabulary`, `spelling-pattern`, and `sentence`.
- Support content adds `welsh-spelling-basics`.
- Current Practice Library topic lists are seeded with `focus_category_id = "topic-vocabulary"`, which does not provide the category grouping learners need.

Code paths:

- Admin loaders join `focus_categories(name)` and expose it as `list.focus` for compatibility.
- Admin word-list edit preserves existing `focusCategoryId` values but no longer exposes an Internal Focus selector.
- Admin word-list creation now leaves `focusCategoryId` empty.
- Import/export preserves `focus`, `focusCategoryId`, and the `focusCategories` reference list.
- Public Supabase loading reads `focus_category_id` only into the public `focus` string.
- Public catalogue grouping does not use focus metadata.
- Recommendations, progression, and session generation do not use focus metadata.

Conceptual status:

`focus_category_id` is legacy/editorial metadata. It is not a current product architecture concept and should not be used for Practice Library categories.

Safe deprecation path:

1. Keep `focus_category_id` for import/export compatibility.
2. Keep it out of day-to-day content architecture and normal admin navigation.
3. If editorial tags are still useful, replace it with explicit tags or a more general editorial metadata field.
4. Version import/export so older payloads can still hydrate or ignore `focusCategoryId`.
5. Remove the admin field and schema reference only after active content no longer relies on the import/export shape.

## Dependency Classification

| Dependency | Classification | Notes |
| ---------- | -------------- | ----- |
| `stages` reference table | Transitional | Still used by admin loaders and export snapshots, but not required by the simplified product model. |
| `word_lists.stage_id` | Transitional | Still selected/written by admin and public content loaders, but no longer drives recommendation fallback. |
| `focus_categories` reference table | Legacy | Only supports the direct legacy admin route and export shape. |
| `word_lists.focus_category_id` | Legacy | Existing values are preserved, but new normal admin list creation leaves it empty and no live learner behaviour depends on it. |
| Public recommendation fallback by stage | Dead | Replaced by explicit `nextListId`, then collection/list order. |
| Practice Library category display by focus | Dead | The public catalogue uses collection/list display mapping instead. |
