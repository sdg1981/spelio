# DEVELOPMENT migration baseline reconciliation

This record documents the September 2026 repair of Supabase DEVELOPMENT project
`xxzugbaupdxqpkmwcuem`. It does not authorize or describe a PRODUCTION change.

## Historical source restoration

DEVELOPMENT recorded migration `202606250001_create_inactive_practice_collection`,
but commit `376c70e` later deleted its source file. Git contains no migration-
correctness rationale for the deletion. The exact last pre-deletion version from
`376c70e^` was restored byte-for-byte. Its SHA-256 is
`a989d2ac95d212e3ca282c6635fc612cdd4094ee733bedb8df89184f157c75ed`.

A direct DEVELOPMENT query confirmed that the complete `practice` collection row
still matches that migration, including `order_index = 3` and `is_active = false`.

## Evidence method

The audit compared:

- the authoritative `supabase_migrations.schema_migrations` ledger;
- complete public `word_lists` and `words` rows, not representative samples;
- PostgreSQL catalogs for columns, constraints, RLS, policies, function bodies,
  configuration, and ACL effects;
- later migrations, Git history, application code, and tests.

For the 17 topic-list migrations, all inserted list fields and all 203 expected
word rows were parsed from the SQL. Explicit later order, icon, Welsh metadata,
prompt-normalization, and editorial updates were then applied to that expected
model before comparison with DEVELOPMENT.

Classification meanings:

- **A — exact:** the migration's complete material effect is present.
- **B — divergent:** some effect is present, but the cumulative state differs.
- **C — missing:** the intended effect is absent.
- **D — superseded:** a later committed migration intentionally replaced an
  intermediate value; the cumulative final state was checked instead.

## Pre-reconciliation classification

| Version | Class | Evidence |
|---|---|---|
| `202606250005` | C | People & Family list absent; all 11 expected words absent. |
| `202606250006` | D | Weather list and all 10 words match after committed order, Welsh metadata, and lowercase-prompt updates. |
| `202606250007` | D | Colours list and all 10 words match the cumulative committed state. |
| `202606250008` | D | Clothing list and all 10 words match the cumulative committed state. |
| `202606250009` | D | Time & Calendar list and all 11 words match the cumulative committed state. |
| `202606250010` | D | Work list and all 10 words match; final icon is the later committed `Briefcase`. |
| `202606250011` | D | School & Learning list and all 10 words match, including the intentionally capitalized `Welsh` prompt. |
| `202606250012` | B | Home & Household list and all 10 words exist, but order was `6` rather than authoritative `4`. |
| `202606250013` | B | Travel & Transport list and all 10 words exist, but order was `4` rather than authoritative `6`. |
| `202606250014` | D | Nature & Landscape list and all 10 words match the cumulative committed state. |
| `202606250015` | D | Shopping list and all 10 words match the cumulative committed state. |
| `202606250016` | D | Body Parts list and all 10 words match the cumulative committed state. |
| `202606250017` | D | Sports list and all 10 words match the cumulative committed state. |
| `202606250018` | D | Leisure list and all 10 words match the cumulative committed state. |
| `202606250019` | D | Numbers list and all 10 words match the cumulative committed state. |
| `202606250020` | B | All 10 words match, but DEVELOPMENT retained `Meals & Eating` metadata while the current migration, application display map, and tests require `Meals & Dining`. |
| `202606250021` | D | Around Town list and all 10 words match the cumulative committed state. |
| `202606270001` | B | Sixteen expected order positions matched; People & Family was absent and Home, Places, and Travel had divergent positions. |
| `202606270002` | B | `icon_name` exists and 13 present mapped lists match; the People & Family icon was absent with its list. |
| `202606270003` | B | All 191 applicable existing prompts were normalized and the proper noun `Welsh` was preserved; 11 People & Family targets were absent. |
| `202606280001` | A | Work icon is exactly `Briefcase`. |
| `202606280002` | D | SI list, eight SI words, two added review words, predecessor link, and review order match; later title and markdown migrations deliberately superseded copy fields. |
| `202606280003` | D | Its intermediate cleanup RPC was replaced by `202606280004`. |
| `202606280004` | A | Zero-argument JSONB SECURITY DEFINER RPC, `search_path`, body MD5, PUBLIC revoke, and authenticated grant match. Other direct role grants are legacy Supabase automatic grants and are intentionally left for `202609230001`. |
| `202606290001` | B | Eighteen lists matched; People & Family was absent and Meals metadata was divergent. |
| `202606290002` | C | None of the four authoritative Meals & Dining metadata values matched. |
| `202607010001` | A | All three collection Welsh names and language pairs match. |
| `202607010002` | A | Both targeted row corrections match and no obsolete dialect-note phrases remain. |
| `202607150001` | D | Table, PK, checks, RLS, policy, comment, and RPC exist; the next migration deliberately superseded the event constraint, RPC body, and comment. |
| `202607150002` | A | Six-event constraint, final comment, policy, RPC signature/config/body MD5, PUBLIC revoke, and anon grant match. Other direct role grants are deferred to Data API hardening. |
| `202607150003` | A | All five lists match every updated English/Welsh title, description, and primer field. |
| `202608070001` | A | Both SI primer bodies and the targeted usage note contain the exact final non-Markdown copy. |

## Authoritative discrepancies and repair

Repository migrations, `src/lib/practice/wordListDisplay.ts`, and the focused
recommendation/display tests agree on the intended state:

- People & Family exists at position `3` with icon `UserRound` and 11 normalized
  prompt rows;
- the Practice catalogue uses the committed positions `1` through `20`;
- the meals list displays as `Most Common Meals & Dining` with its committed
  Welsh title and descriptions.

Migration `202609220001_reconcile_development_migration_baseline.sql` encodes
only those corrections. It is idempotent, preserves audio fields on existing
words, does not touch user-created lists, and does not change privileges.

The Data API privilege migration `202609230001` remains a separate change and
must not be applied as part of baseline reconciliation.
