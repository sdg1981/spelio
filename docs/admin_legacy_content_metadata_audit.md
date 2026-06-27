# Admin Legacy Content Metadata Audit

Date: 2026-06-27

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
| `stages` | Reference table for legacy list-stage labels. Admin joins it to resolve `word_lists.stage_id` to `list.stage`; export includes it. | Indirectly, only through resolved `list.stage` in recommendation fallback and non-Practice-Library catalogue grouping. | Rename/reframe | Reframe as "progression buckets" or "legacy progression groups". Do not remove until recommendation fallback no longer depends on `list.stage`. |
| `stage_id` | Foreign key on `word_lists`; selected in public/admin content loaders; editable in word-list admin; imported/exported. | Yes, indirectly. Public catalogue checks `stageId === "foundations"` for Foundations display, and recommendation fallback uses resolved `list.stage`. It does not directly affect session word selection. | Rename/reframe | Keep for now, but treat as a compatibility field backing a progression bucket. Prefer explicit `journey_group_id` / `catalogue_group_id` in a future migration. |
| `focus_categories` | Reference table for editorial list-purpose labels. Admin joins it to resolve `word_lists.focus_category_id` to `list.focus`; export includes it. | No learner-facing behaviour found. Not used by public catalogue grouping, ordering, recommendations, progression, or session generation. | Deprecate | Keep for import/export/admin compatibility only. Remove from primary mental model and avoid using it for Practice Library categories. |
| `focus_category_id` | Foreign key on `word_lists`; editable in word-list admin; imported/exported; shown in admin tables. | No learner-facing behaviour found. Session and recommendation tests confirm changing `focus` labels does not change recommendations or generated session words. | Deprecate | Keep as optional legacy/editorial metadata until import/export schema can version it out or replace it with explicit editorial tags. |

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
- Recommendations use `list.stage` as a fallback bucket after explicit `nextListId` traversal fails.
- Session generation does not read `stage` or `stageId`.
- Admin word-list edit reads and writes `stageId`.
- Import/export preserves `stage`, `stageId`, and the `stages` reference list.

Conceptual status:

`stage_id` is not a good product name under the current architecture. It is still behaviourally meaningful because `list.stage` affects fallback recommendations. The concept should be reframed as a progression bucket or replaced later by a clearer journey/progression grouping field.

Safe deprecation path:

1. Keep `stage_id` while recommendation fallback depends on `list.stage`.
2. Introduce an explicit replacement such as `progression_bucket_id`, `journey_group_id`, or `catalogue_group_id`.
3. Move public catalogue display overrides away from `stageId`.
4. Update import/export schema with backward compatibility from `stageId`.
5. Only then make `stage_id` nullable-unused and remove it in a later schema version.

### Focus Categories and focus_category_id

Storage:

- `public.focus_categories` is created in `supabase/migrations/202605070001_admin_content_schema.sql`.
- `public.word_lists.focus_category_id` is a nullable foreign key to `public.focus_categories(id)`.

Current records:

- Seeded focus records are `core-vocabulary`, `phrase`, `function-words`, `mixed`, `topic-vocabulary`, `spelling-pattern`, and `sentence`.
- Support content adds `welsh-spelling-basics`.
- Current Practice Library topic lists are seeded with `focus_category_id = "topic-vocabulary"`, which does not provide the category grouping learners need.

Code paths:

- Admin loaders join `focus_categories(name)` and expose it as `list.focus`.
- Admin word-list edit reads and writes `focusCategoryId`.
- Import/export preserves `focus`, `focusCategoryId`, and the `focusCategories` reference list.
- Public Supabase loading reads `focus_category_id` only into the public `focus` string.
- Public catalogue grouping does not use focus metadata.
- Recommendations, progression, and session generation do not use focus metadata.

Conceptual status:

`focus_category_id` is legacy/editorial metadata. It is not a current product architecture concept and should not be used for Practice Library categories.

Safe deprecation path:

1. Keep `focus_category_id` for import/export compatibility.
2. Stop presenting it as day-to-day content architecture.
3. If editorial tags are still useful, replace it with explicit tags or a more general editorial metadata field.
4. Version import/export so older payloads can still hydrate `focusCategoryId`.
5. Remove the admin field and schema reference only after active content no longer relies on the import/export shape.
