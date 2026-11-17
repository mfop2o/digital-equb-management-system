# DATABASE DESIGN — Digital Equb Management System

> **Status:** Phase 1 deliverable (proposed schema; not yet migrated).
> **Engine:** MySQL 8.4, InnoDB, `utf8mb4_0900_ai_ci`.
> **Related:** `DATABASE_ERD.md`, `SYSTEM_ARCHITECTURE.md`, `REQUIREMENTS.md`.

---

## 1. Design principles

1. **Financial facts are append-only.** Verified payments, journal entries, disbursements, approvals, and audit records are never updated in place or deleted.
2. **Balances and member colors are derived, not stored.** Obligation balances, available funds, and GREEN/RED/BLUE come from verified payments, completed payouts, and dates.
3. **Money is exact.** All monetary columns are `DECIMAL(15,2)` (ETB, 2 decimal places). No `FLOAT`/`DOUBLE` anywhere.
4. **Rules are versioned.** `equb_group_rules` rows are immutable once active; cycles store a `rule_snapshot` JSON, and obligations store the amount/date values that applied when they were generated.
5. **Obligations, payments, and verifications are separate.** "Paid" is never a mutable boolean.
6. **Every financial table is group-scoped.** `equb_group_id` is present (directly or through a parent) so authorization and reporting can always filter safely.
7. **Destructive deletes are prohibited for financial data.** `ON DELETE RESTRICT` on financial foreign keys; lifecycle is modeled with status columns.
8. **Idempotency is enforced by the database.** Unique keys on posting keys, payment idempotency keys, payment references, schedule items, and sequence scopes prevent duplicates under retries/concurrency.
9. **Double-entry ledger.** Every movement posts balanced `journal_entry_lines`; posted entries are immutable and corrected by reversal.
10. **Unconfirmed policy is explicit.** Policy enums include `UNDECIDED`; schema supports every option without committing to one.

---

## 2. Conventions

| Concern        | Convention                                                                               |
| -------------- | ---------------------------------------------------------------------------------------- |
| Table names    | plural `snake_case`                                                                      |
| Primary keys   | `BIGINT UNSIGNED AUTO_INCREMENT` (`id`)                                                  |
| Foreign keys   | `<singular>_id`, `BIGINT UNSIGNED`, indexed                                              |
| Money          | `DECIMAL(15,2) NOT NULL DEFAULT 0.00`; currency `CHAR(3)` default `ETB`                  |
| Business dates | `DATE` (organization local date, Gregorian storage)                                      |
| Instants       | `TIMESTAMP` stored UTC; displayed `Africa/Addis_Ababa`                                   |
| Enums          | `VARCHAR(32)` + PHP backed enum + `CHECK` constraint where stable                        |
| Booleans       | `TINYINT(1)`; explicit column defaults                                                   |
| JSON snapshots | `JSON` used for immutable calculation evidence, never as the only source of truth        |
| Soft delete    | Used only for operational master data where history permits; never for financial records |
| Timestamps     | `created_at`, `updated_at` unless append-only (then `created_at` only)                   |
| Index names    | Laravel default (`table_column_index`, `table_column_unique`)                            |
| Charset        | `utf8mb4` / `utf8mb4_0900_ai_ci`                                                         |

**Deletion policy:**

- `RESTRICT` — any table reachable from money: members, groups, memberships, obligations, payments, payouts, ledger, penalties, refunds.
- `CASCADE` — pure child records with no independent financial meaning (journal lines, schedule items may be `RESTRICT` because schedules are financial planning records; agreement acceptances `CASCADE` only if membership is deleted, which is prohibited).
- `SET NULL` — optional actor references if a user is ever removed from the system. In practice users are deactivated, not deleted.

---

## 3. Schema map

| Domain            | Tables                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity & access | `users`, `password_reset_tokens`, `sessions`, `passkeys`, Spatie (`roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`) |
| Members           | `member_profiles`, `member_identifications`, `member_verifications`, `member_payout_accounts`                                                                 |
| Groups            | `equb_groups`, `equb_group_user`, `equb_group_rules`, `equb_group_agreements`, `equb_agreement_acceptances`                                                   |
| Membership        | `equb_memberships`, `membership_requests`                                                                                                                     |
| Cycles            | `equb_cycles`, `contribution_periods`, `deposit_rounds`                                                                                                       |
| Obligations       | `deposit_obligations`, `contribution_obligations`                                                                                                             |
| Payments          | `payments`, `payment_allocations`, `payment_verifications`, `receipts`                                                                                        |
| Payouts           | `payout_schedules`, `payout_schedule_items`, `payouts`, `payout_approvals`, `payout_disbursements`                                                            |
| Finance           | `financial_accounts`, `journal_entries`, `journal_entry_lines`, `financial_adjustments`, `reconciliations`, `reconciliation_items`                            |
| Penalties & exits | `penalties`, `penalty_waivers`, `payment_extensions`, `withdrawal_requests`, `refunds`, `complaints`                                                          |
| Communication     | `notifications`, `notification_preferences`, `notification_templates`, `communication_logs`, `announcements`, `announcement_reads`                            |
| Platform          | `app_settings`, `audit_logs`, `attachments`, `number_sequences`, `jobs`, `failed_jobs`, `cache`, `cache_locks`                                                |
| Read models       | `v_obligation_balances`, `v_membership_cycle_financials`, `v_group_financial_summary` (views, no storage)                                                     |

Approximate count: 55 physical tables including framework/Spatie tables.

---

## 4. Identity and access

### 4.1 `users` (starter table, extended)

| Column                           | Type            | Constraints / notes                                           |
| -------------------------------- | --------------- | ------------------------------------------------------------- |
| `id`                             | BIGINT UNSIGNED | PK                                                            |
| `name`                           | VARCHAR(255)    | required                                                      |
| `email`                          | VARCHAR(255)    | UNIQUE, nullable if phone-only member login is enabled        |
| `email_verified_at`              | TIMESTAMP       | nullable                                                      |
| `phone`                          | VARCHAR(32)     | nullable                                                      |
| `phone_normalized`               | VARCHAR(32)     | UNIQUE, nullable; E.164-style normalized                      |
| `password`                       | VARCHAR(255)    | hashed, required                                              |
| `status`                         | VARCHAR(32)     | `active`, `inactive`, `suspended`, `locked`; default `active` |
| `last_login_at`                  | TIMESTAMP       | nullable                                                      |
| `deactivated_at`                 | TIMESTAMP       | nullable                                                      |
| `deactivation_reason`            | VARCHAR(500)    | nullable                                                      |
| `must_change_password`           | TINYINT(1)      | default 0                                                     |
| `two_factor_*`, `remember_token` | starter columns | unchanged                                                     |
| `created_at`, `updated_at`       | TIMESTAMP       |                                                               |

Indexes: `email` unique, `phone_normalized` unique, `status`.

> Hard deletion is prohibited. `ProfileController@destroy` must be replaced with a deactivation/anonymization workflow before financial tables exist.

### 4.2 Spatie tables (package migrations)

`roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions` with the package's standard columns. Six seeded roles: `super-admin`, `admin`, `organizer`, `treasurer`, `auditor`, `member`. Group-scoped authority is **not** modeled in Spatie teams; it lives in `equb_group_user`.

### 4.3 `passkeys`, `password_reset_tokens`, `sessions`

Starter/Fortify tables. `passkeys` belongs to `users` with cascade on user delete (users are not deleted in practice). Session rows are operational only.

---

## 5. Members

### 5.1 `member_profiles`

| Column                     | Type            | Constraints / notes                                                                                      |
| -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                                                                       |
| `user_id`                  | BIGINT UNSIGNED | FK → `users.id`, NULL, `RESTRICT`; optional portal login                                                 |
| `member_number`            | VARCHAR(32)     | UNIQUE, immutable, generated by `NumberSequenceService`                                                  |
| `first_name`               | VARCHAR(100)    | required                                                                                                 |
| `middle_name`              | VARCHAR(100)    | nullable                                                                                                 |
| `last_name`                | VARCHAR(100)    | required                                                                                                 |
| `gender`                   | VARCHAR(16)     | `male`, `female`, `other`, `undisclosed`; nullable                                                       |
| `date_of_birth`            | DATE            | nullable                                                                                                 |
| `phone_normalized`         | VARCHAR(32)     | UNIQUE, required                                                                                         |
| `alternate_phone`          | VARCHAR(32)     | nullable                                                                                                 |
| `email`                    | VARCHAR(255)    | nullable                                                                                                 |
| `region`                   | VARCHAR(100)    | nullable                                                                                                 |
| `city`                     | VARCHAR(100)    | nullable                                                                                                 |
| `subcity`                  | VARCHAR(100)    | nullable                                                                                                 |
| `woreda`                   | VARCHAR(100)    | nullable                                                                                                 |
| `house_number`             | VARCHAR(50)     | nullable                                                                                                 |
| `photo_attachment_id`      | BIGINT UNSIGNED | FK → `attachments.id`, NULL                                                                              |
| `status`                   | VARCHAR(32)     | `pending_verification`, `active`, `suspended`, `inactive`, `blacklisted`; default `pending_verification` |
| `verified_at`              | TIMESTAMP       | nullable                                                                                                 |
| `verified_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                                                                                |
| `notes`                    | TEXT            | nullable                                                                                                 |
| `archived_at`              | TIMESTAMP       | nullable                                                                                                 |
| `created_at`, `updated_at` | TIMESTAMP       |                                                                                                          |

Indexes: `member_number` unique, `phone_normalized` unique, `status`, `(last_name, first_name)`, `user_id`.

> `phone_normalized` is required even when phone login is not yet enabled, because it is the primary duplicate-detection key for Ethiopian members.

### 5.2 `member_identifications`

| Column                     | Type            | Constraints / notes                                               |
| -------------------------- | --------------- | ----------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                                |
| `member_profile_id`        | BIGINT UNSIGNED | FK → `member_profiles.id`, `RESTRICT`                             |
| `type`                     | VARCHAR(32)     | `national_id`, `passport`, `driver_license`, `kebele_id`, `other` |
| `number_encrypted`         | TEXT            | encrypted cast                                                    |
| `number_hash`              | CHAR(64)        | SHA-256 of normalized number; UNIQUE for duplicate detection      |
| `number_last4`             | CHAR(4)         | display/masking only                                              |
| `issued_on`                | DATE            | nullable                                                          |
| `expires_on`               | DATE            | nullable                                                          |
| `issuing_authority`        | VARCHAR(150)    | nullable                                                          |
| `attachment_id`            | BIGINT UNSIGNED | FK → `attachments.id`, nullable                                   |
| `created_at`, `updated_at` | TIMESTAMP       |                                                                   |

Indexes: `number_hash` unique, `member_profile_id`.

### 5.3 `member_verifications`

Append-only KYC decision trail.

| Column                   | Type            | Constraints / notes                   |
| ------------------------ | --------------- | ------------------------------------- |
| `id`                     | BIGINT UNSIGNED | PK                                    |
| `member_profile_id`      | BIGINT UNSIGNED | FK → `member_profiles.id`, `RESTRICT` |
| `decision`               | VARCHAR(16)     | `approved`, `rejected`                |
| `reviewer_user_id`       | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`           |
| `decided_at`             | TIMESTAMP       | required                              |
| `reason`                 | VARCHAR(500)    | required for rejection                |
| `evidence_attachment_id` | BIGINT UNSIGNED | FK → `attachments.id`, nullable       |
| `created_at`             | TIMESTAMP       |                                       |

Index: `(member_profile_id, decided_at)`.

### 5.4 `member_payout_accounts`

| Column                     | Type            | Constraints / notes                                  |
| -------------------------- | --------------- | ---------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                   |
| `member_profile_id`        | BIGINT UNSIGNED | FK → `member_profiles.id`, `RESTRICT`                |
| `channel`                  | VARCHAR(24)     | `bank`, `mobile_money`                               |
| `provider_name`            | VARCHAR(100)    | e.g. bank name or mobile operator                    |
| `account_name`             | VARCHAR(150)    | required                                             |
| `account_number_encrypted` | TEXT            | encrypted                                            |
| `account_number_hash`      | CHAR(64)        | duplicate detection                                  |
| `account_number_last4`     | CHAR(4)         | masked display                                       |
| `branch`                   | VARCHAR(120)    | nullable                                             |
| `status`                   | VARCHAR(16)     | `pending`, `verified`, `rejected`; default `pending` |
| `verified_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                            |
| `verified_at`              | TIMESTAMP       | nullable                                             |
| `created_at`, `updated_at` | TIMESTAMP       |                                                      |

Unique: `(member_profile_id, channel, account_number_hash)`. Index: `status`.

---

## 6. Equb groups and rules

### 6.1 `equb_groups`

| Column                     | Type              | Constraints / notes                                                                                     |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED   | PK                                                                                                      |
| `group_number`             | VARCHAR(32)       | UNIQUE, immutable                                                                                       |
| `name`                     | VARCHAR(150)      | required                                                                                                |
| `description`              | TEXT              | nullable                                                                                                |
| `status`                   | VARCHAR(24)       | `draft`, `depositing`, `ready`, `active`, `paused`, `completed`, `closed`, `cancelled`; default `draft` |
| `capacity`                 | SMALLINT UNSIGNED | required, > 0                                                                                           |
| `currency`                 | CHAR(3)           | default `ETB`; single-currency v1                                                                       |
| `timezone`                 | VARCHAR(64)       | default `Africa/Addis_Ababa`                                                                            |
| `created_by`               | BIGINT UNSIGNED   | FK → `users.id`, `RESTRICT`                                                                             |
| `activated_at`             | TIMESTAMP         | nullable                                                                                                |
| `closed_at`                | TIMESTAMP         | nullable                                                                                                |
| `closure_reason`           | VARCHAR(500)      | nullable                                                                                                |
| `archived_at`              | TIMESTAMP         | nullable                                                                                                |
| `created_at`, `updated_at` | TIMESTAMP         |                                                                                                         |

Indexes: `group_number` unique, `status`, `name`.

> `current_cycle_id` is intentionally **not** stored to avoid a circular foreign key; the current cycle is the latest non-cancelled cycle queried with an index on `(equb_group_id, status, cycle_number)`.

### 6.2 `equb_group_user` (group-scoped staff authority)

| Column          | Type            | Constraints / notes                                        |
| --------------- | --------------- | ---------------------------------------------------------- |
| `id`            | BIGINT UNSIGNED | PK                                                         |
| `equb_group_id` | BIGINT UNSIGNED | FK → `equb_groups.id`, `CASCADE` (assignment only)         |
| `user_id`       | BIGINT UNSIGNED | FK → `users.id`, `CASCADE`                                 |
| `group_role`    | VARCHAR(24)     | `admin`, `organizer`, `treasurer`, `auditor`, `supervisor` |
| `assigned_by`   | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                                |
| `assigned_at`   | TIMESTAMP       | required                                                   |
| `revoked_at`    | TIMESTAMP       | nullable                                                   |
| `revoked_by`    | BIGINT UNSIGNED | FK → `users.id`, nullable                                  |

Unique: `(equb_group_id, user_id, group_role)` — one assignment per role; re-assignment after revocation reactivates rather than duplicates. Index: `(user_id, revoked_at)`.

> Global role is checked by Spatie; this table adds the group scope. Policies require both.

### 6.3 `equb_group_rules` (versioned)

| Column                                  | Type              | Constraints / notes                                                                                          |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `id`                                    | BIGINT UNSIGNED   | PK                                                                                                           |
| `equb_group_id`                         | BIGINT UNSIGNED   | FK → `equb_groups.id`, `RESTRICT`                                                                            |
| `version`                               | SMALLINT UNSIGNED | required; unique with group                                                                                  |
| `status`                                | VARCHAR(16)       | `draft`, `active`, `retired`, `rejected`; default `draft`                                                    |
| `active_flag`                           | TINYINT UNSIGNED  | NULL or `1`; unique `(equb_group_id, active_flag)` guarantees one active version                             |
| `contribution_amount`                   | DECIMAL(15,2)     | > 0                                                                                                          |
| `currency`                              | CHAR(3)           | `ETB`                                                                                                        |
| `contribution_frequency`                | VARCHAR(16)       | `weekly`, `biweekly`, `monthly`, `quarterly`, `custom`                                                       |
| `contribution_interval_days`            | SMALLINT UNSIGNED | required only for `custom`                                                                                   |
| `contribution_due_offset_days`          | SMALLINT UNSIGNED | days from period open to due date                                                                            |
| `grace_days`                            | SMALLINT UNSIGNED | default 0                                                                                                    |
| `capacity`                              | SMALLINT UNSIGNED | must not exceed group capacity                                                                               |
| `deposit_rounds_count`                  | TINYINT UNSIGNED  | 0..n; **not assumed to be 3**                                                                                |
| `payout_mode`                           | VARCHAR(16)       | `predetermined`, `random`, `manual`, `hybrid`                                                                |
| `payout_commencement_mode`              | VARCHAR(32)       | `after_all_deposits`, `scheduled_date`, `manual_approval`, `hybrid`, `undecided`                             |
| `payout_commencement_date`              | DATE              | nullable                                                                                                     |
| `payout_formula`                        | VARCHAR(32)       | `contributions_only`, `contributions_plus_deposits`, `contributions_minus_deductions`, `custom`, `undecided` |
| `deposit_fund_treatment`                | VARCHAR(32)       | `undecided`, `included_in_first_payout`, `distributed_separately`, `reserve`, `other`                        |
| `partial_contributions_allowed`         | TINYINT(1)        | default 0                                                                                                    |
| `overpayment_policy`                    | VARCHAR(24)       | `reject`, `credit_next`, `refund`; default `reject`                                                          |
| `penalty_policy`                        | VARCHAR(16)       | `none`, `fixed`, `percentage`, `daily`, `undecided`; default `none`                                          |
| `penalty_value`                         | DECIMAL(15,2)     | nullable                                                                                                     |
| `penalty_grace_days`                    | SMALLINT UNSIGNED | default 0                                                                                                    |
| `penalty_cap_amount`                    | DECIMAL(15,2)     | nullable                                                                                                     |
| `penalty_deduct_from_payout`            | TINYINT(1)        | default 0                                                                                                    |
| `withdrawal_policy`                     | VARCHAR(32)       | `no_refund`, `deposits_only`, `pro_rata_contributions`, `custom`, `undecided`                                |
| `allow_multiple_group_membership`       | TINYINT(1)        | default 1                                                                                                    |
| `allow_conflicting_staff_roles`         | TINYINT(1)        | default 0                                                                                                    |
| `maker_checker_payments`                | TINYINT(1)        | default 1                                                                                                    |
| `maker_checker_payouts`                 | TINYINT(1)        | default 1                                                                                                    |
| `payout_before_full_collection_allowed` | TINYINT(1)        | default 0                                                                                                    |
| `settings`                              | JSON              | extensible policy values not yet modeled                                                                     |
| `effective_from`                        | DATE              | nullable until active                                                                                        |
| `created_by`                            | BIGINT UNSIGNED   | FK → `users.id`, `RESTRICT`                                                                                  |
| `activated_by`                          | BIGINT UNSIGNED   | FK → `users.id`, nullable                                                                                    |
| `activated_at`                          | TIMESTAMP         | nullable                                                                                                     |
| `created_at`, `updated_at`              | TIMESTAMP         |                                                                                                              |

Indexes: unique `(equb_group_id, version)`, unique `(equb_group_id, active_flag)`, `(equb_group_id, status)`.

> Once `status = active`, financial columns are immutable. Editing creates a new draft version. `active_flag = 1` for the active row and `NULL` for all others (MySQL permits multiple NULLs in a unique index).

### 6.4 `equb_group_agreements`

| Column                     | Type              | Constraints / notes                  |
| -------------------------- | ----------------- | ------------------------------------ |
| `id`                       | BIGINT UNSIGNED   | PK                                   |
| `equb_group_id`            | BIGINT UNSIGNED   | FK → `equb_groups.id`, `RESTRICT`    |
| `rule_version_id`          | BIGINT UNSIGNED   | FK → `equb_group_rules.id`, nullable |
| `version`                  | SMALLINT UNSIGNED | unique with group                    |
| `title`                    | VARCHAR(200)      | required                             |
| `body`                     | MEDIUMTEXT        | required (rendered/plain text)       |
| `attachment_id`            | BIGINT UNSIGNED   | FK → `attachments.id`, nullable      |
| `status`                   | VARCHAR(16)       | `draft`, `active`, `retired`         |
| `effective_from`           | DATE              | nullable                             |
| `created_by`               | BIGINT UNSIGNED   | FK → `users.id`, `RESTRICT`          |
| `created_at`, `updated_at` | TIMESTAMP         |                                      |

### 6.5 `equb_agreement_acceptances`

| Column                    | Type            | Constraints / notes                         |
| ------------------------- | --------------- | ------------------------------------------- |
| `id`                      | BIGINT UNSIGNED | PK                                          |
| `equb_group_agreement_id` | BIGINT UNSIGNED | FK → `equb_group_agreements.id`, `RESTRICT` |
| `equb_membership_id`      | BIGINT UNSIGNED | FK → `equb_memberships.id`, `RESTRICT`      |
| `accepted_at`             | TIMESTAMP       | required                                    |
| `ip_address`              | VARCHAR(45)     | nullable                                    |
| `user_agent`              | VARCHAR(255)    | nullable                                    |
| `evidence_attachment_id`  | BIGINT UNSIGNED | FK → `attachments.id`, nullable             |
| `created_at`              | TIMESTAMP       |                                             |

Unique: `(equb_group_agreement_id, equb_membership_id)`.

---

## 7. Membership

### 7.1 `equb_memberships`

| Column                     | Type            | Constraints / notes                                                                                    |
| -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `id`                       | BIGINT UNSIGNED | PK                                                                                                     |
| `equb_group_id`            | BIGINT UNSIGNED | FK → `equb_groups.id`, `RESTRICT`                                                                      |
| `member_profile_id`        | BIGINT UNSIGNED | FK → `member_profiles.id`, `RESTRICT`                                                                  |
| `membership_number`        | VARCHAR(48)     | UNIQUE                                                                                                 |
| `status`                   | VARCHAR(24)     | `invited`, `requested`, `pending_approval`, `active`, `suspended`, `withdrawn`, `removed`, `completed` |
| `joined_at`                | DATE            | nullable                                                                                               |
| `activated_at`             | TIMESTAMP       | nullable                                                                                               |
| `exited_at`                | TIMESTAMP       | nullable                                                                                               |
| `exit_reason`              | VARCHAR(500)    | nullable                                                                                               |
| `approved_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                                                                              |
| `approved_at`              | TIMESTAMP       | nullable                                                                                               |
| `created_at`, `updated_at` | TIMESTAMP       |                                                                                                        |

Unique: `(equb_group_id, member_profile_id)` — one membership record per person per group; re-joining reactivates the same record, preserving history. Index: `(equb_group_id, status)`, `(member_profile_id, status)`.

### 7.2 `membership_requests`

| Column                     | Type            | Constraints / notes                            |
| -------------------------- | --------------- | ---------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                             |
| `equb_group_id`            | BIGINT UNSIGNED | FK → `equb_groups.id`, `RESTRICT`              |
| `member_profile_id`        | BIGINT UNSIGNED | FK → `member_profiles.id`, `RESTRICT`          |
| `requested_by`             | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                    |
| `status`                   | VARCHAR(16)     | `pending`, `approved`, `rejected`, `cancelled` |
| `reason`                   | VARCHAR(500)    | nullable                                       |
| `decision_reason`          | VARCHAR(500)    | nullable                                       |
| `reviewed_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                      |
| `reviewed_at`              | TIMESTAMP       | nullable                                       |
| `created_at`, `updated_at` | TIMESTAMP       |                                                |

Unique: `(equb_group_id, member_profile_id, status)` is **not** used because only one pending request should exist while history keeps decisions. Enforce "one open request" in the service inside a transaction; add index `(equb_group_id, member_profile_id, status)`.

---

## 8. Cycles, periods, deposit rounds

### 8.1 `equb_cycles`

| Column                     | Type              | Constraints / notes                                                             |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED   | PK                                                                              |
| `equb_group_id`            | BIGINT UNSIGNED   | FK → `equb_groups.id`, `RESTRICT`                                               |
| `cycle_number`             | SMALLINT UNSIGNED | unique with group                                                               |
| `status`                   | VARCHAR(24)       | `planned`, `deposit_stage`, `ready`, `active`, `closing`, `closed`, `cancelled` |
| `rule_version_id`          | BIGINT UNSIGNED   | FK → `equb_group_rules.id`, `RESTRICT`                                          |
| `rule_snapshot`            | JSON              | immutable copy of effective rule values                                         |
| `agreement_version_id`     | BIGINT UNSIGNED   | FK → `equb_group_agreements.id`, nullable                                       |
| `started_on`               | DATE              | nullable                                                                        |
| `deposit_stage_closed_on`  | DATE              | nullable                                                                        |
| `activated_on`             | DATE              | nullable                                                                        |
| `closing_started_on`       | DATE              | nullable                                                                        |
| `closed_on`                | DATE              | nullable                                                                        |
| `closure_notes`            | TEXT              | nullable                                                                        |
| `created_by`               | BIGINT UNSIGNED   | FK → `users.id`, `RESTRICT`                                                     |
| `created_at`, `updated_at` | TIMESTAMP         |                                                                                 |

Unique: `(equb_group_id, cycle_number)`. Index: `(equb_group_id, status)`.

### 8.2 `contribution_periods`

| Column                     | Type              | Constraints / notes                   |
| -------------------------- | ----------------- | ------------------------------------- |
| `id`                       | BIGINT UNSIGNED   | PK                                    |
| `equb_cycle_id`            | BIGINT UNSIGNED   | FK → `equb_cycles.id`, `RESTRICT`     |
| `sequence`                 | SMALLINT UNSIGNED | unique with cycle                     |
| `label`                    | VARCHAR(100)      | e.g. `2026-01`                        |
| `opens_on`                 | DATE              | required                              |
| `due_on`                   | DATE              | required, `>= opens_on`               |
| `closes_on`                | DATE              | required, `>= due_on`                 |
| `status`                   | VARCHAR(16)       | `pending`, `open`, `closed`, `locked` |
| `amount_due_snapshot`      | DECIMAL(15,2)     | > 0                                   |
| `grace_days_snapshot`      | SMALLINT UNSIGNED | default 0                             |
| `generated_at`             | TIMESTAMP         | nullable                              |
| `created_at`, `updated_at` | TIMESTAMP         |                                       |

Unique: `(equb_cycle_id, sequence)`, `(equb_cycle_id, due_on)`. Check: `opens_on <= due_on <= closes_on`.

### 8.3 `deposit_rounds`

| Column                     | Type             | Constraints / notes                                  |
| -------------------------- | ---------------- | ---------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED  | PK                                                   |
| `equb_cycle_id`            | BIGINT UNSIGNED  | FK → `equb_cycles.id`, `RESTRICT`                    |
| `sequence`                 | TINYINT UNSIGNED | unique with cycle; 1..n                              |
| `label`                    | VARCHAR(100)     | required                                             |
| `amount_per_member`        | DECIMAL(15,2)    | > 0                                                  |
| `opens_on`                 | DATE             | required                                             |
| `due_on`                   | DATE             | required                                             |
| `closes_on`                | DATE             | required                                             |
| `status`                   | VARCHAR(16)      | `pending`, `open`, `closed`, `approved`, `cancelled` |
| `requires_previous_close`  | TINYINT(1)       | default 1                                            |
| `approved_by`              | BIGINT UNSIGNED  | FK → `users.id`, nullable                            |
| `approved_at`              | TIMESTAMP        | nullable                                             |
| `created_at`, `updated_at` | TIMESTAMP        |                                                      |

Unique: `(equb_cycle_id, sequence)`. Check: `opens_on <= due_on <= closes_on`. Index: `(equb_cycle_id, status)`.

> The number of rounds is `equb_group_rules.deposit_rounds_count`; the application generates exactly that many rows and supports any `n >= 0`.

---

## 9. Obligations

Obligations record **what is due**. They never record payment status directly; balances come from allocations of verified payments.

### 9.1 `deposit_obligations`

| Column                     | Type              | Constraints / notes                    |
| -------------------------- | ----------------- | -------------------------------------- |
| `id`                       | BIGINT UNSIGNED   | PK                                     |
| `deposit_round_id`         | BIGINT UNSIGNED   | FK → `deposit_rounds.id`, `RESTRICT`   |
| `equb_membership_id`       | BIGINT UNSIGNED   | FK → `equb_memberships.id`, `RESTRICT` |
| `amount_due`               | DECIMAL(15,2)     | snapshot, > 0                          |
| `due_on`                   | DATE              | snapshot                               |
| `grace_days`               | SMALLINT UNSIGNED | snapshot                               |
| `generated_at`             | TIMESTAMP         | required                               |
| `cancelled_at`             | TIMESTAMP         | nullable                               |
| `cancellation_reason`      | VARCHAR(500)      | nullable                               |
| `created_at`, `updated_at` | TIMESTAMP         |                                        |

Unique: `(deposit_round_id, equb_membership_id)` — idempotent generation. Index: `(equb_membership_id, due_on)`, `(deposit_round_id, due_on)`.

### 9.2 `contribution_obligations`

| Column                     | Type              | Constraints / notes                        |
| -------------------------- | ----------------- | ------------------------------------------ |
| `id`                       | BIGINT UNSIGNED   | PK                                         |
| `contribution_period_id`   | BIGINT UNSIGNED   | FK → `contribution_periods.id`, `RESTRICT` |
| `equb_membership_id`       | BIGINT UNSIGNED   | FK → `equb_memberships.id`, `RESTRICT`     |
| `amount_due`               | DECIMAL(15,2)     | snapshot, > 0                              |
| `due_on`                   | DATE              | snapshot                                   |
| `grace_days`               | SMALLINT UNSIGNED | snapshot                                   |
| `generated_at`             | TIMESTAMP         | required                                   |
| `cancelled_at`             | TIMESTAMP         | nullable                                   |
| `cancellation_reason`      | VARCHAR(500)      | nullable                                   |
| `created_at`, `updated_at` | TIMESTAMP         |                                            |

Unique: `(contribution_period_id, equb_membership_id)`. Index: `(equb_membership_id, due_on)`, `(contribution_period_id, due_on)`.

### 9.3 Read models

```sql
CREATE VIEW v_obligation_balances AS
SELECT 'deposit' AS obligation_type,
       o.id AS obligation_id,
       o.deposit_round_id AS source_id,
       o.equb_membership_id,
       o.amount_due,
       COALESCE(SUM(a.amount), 0.00) AS verified_amount,
       (o.amount_due - COALESCE(SUM(a.amount), 0.00)) AS balance,
       o.due_on,
       o.grace_days
FROM deposit_obligations o
LEFT JOIN payment_allocations a
       ON a.deposit_obligation_id = o.id
LEFT JOIN payments p
       ON p.id = a.payment_id AND p.status = 'verified'
WHERE o.cancelled_at IS NULL
GROUP BY o.id
UNION ALL
SELECT 'contribution', o.id, o.contribution_period_id, o.equb_membership_id,
       o.amount_due, COALESCE(SUM(a.amount), 0.00),
       (o.amount_due - COALESCE(SUM(a.amount), 0.00)),
       o.due_on, o.grace_days
FROM contribution_obligations o
LEFT JOIN payment_allocations a
       ON a.contribution_obligation_id = o.id
LEFT JOIN payments p
       ON p.id = a.payment_id AND p.status = 'verified'
WHERE o.cancelled_at IS NULL
GROUP BY o.id;
```

> The `p.status = 'verified'` predicate must be inside the `ON` clause, not `WHERE`, so unpaid obligations still appear. MySQL views are live; no refresh is required. For heavy reporting, use indexed aggregate queries rather than `SELECT *` from the view.

**Overdue** is derived: `balance > 0 AND CURRENT_DATE > DATE_ADD(due_on, INTERVAL grace_days DAY)`. Never stored as a member financial status.

---

## 10. Payments

### 10.1 `payments`

| Column                     | Type            | Constraints / notes                                                          |
| -------------------------- | --------------- | ---------------------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                                           |
| `equb_group_id`            | BIGINT UNSIGNED | FK → `equb_groups.id`, `RESTRICT`                                            |
| `equb_cycle_id`            | BIGINT UNSIGNED | FK → `equb_cycles.id`, `RESTRICT`                                            |
| `equb_membership_id`       | BIGINT UNSIGNED | FK → `equb_memberships.id`, `RESTRICT`                                       |
| `member_profile_id`        | BIGINT UNSIGNED | FK → `member_profiles.id`, `RESTRICT` (denormalized for member queries)      |
| `submitted_by_user_id`     | BIGINT UNSIGNED | FK → `users.id`, nullable (member portal); the recorder when staff-entered   |
| `payment_type`             | VARCHAR(16)     | `deposit`, `contribution`, `penalty`, `other`                                |
| `amount`                   | DECIMAL(15,2)   | > 0                                                                          |
| `currency`                 | CHAR(3)         | `ETB`                                                                        |
| `method`                   | VARCHAR(24)     | `cash`, `bank_transfer`, `mobile_money`, `cheque`, `other`                   |
| `reference`                | VARCHAR(100)    | nullable; unique per group + method when present                             |
| `paid_on`                  | DATE            | required                                                                     |
| `status`                   | VARCHAR(24)     | `submitted`, `under_review`, `verified`, `rejected`, `cancelled`, `reversed` |
| `idempotency_key`          | VARCHAR(100)    | UNIQUE, required; server/client generated once                               |
| `evidence_attachment_id`   | BIGINT UNSIGNED | FK → `attachments.id`, nullable                                              |
| `notes`                    | TEXT            | nullable                                                                     |
| `verified_at`              | TIMESTAMP       | nullable; set once                                                           |
| `verified_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                                                    |
| `created_at`, `updated_at` | TIMESTAMP       |                                                                              |

Indexes: unique `idempotency_key`; unique `(equb_group_id, method, reference)` where reference is not null (enforced with a generated `reference_key` column or application + index); `(equb_membership_id, status)`; `(equb_cycle_id, status)`; `(equb_group_id, paid_on)`; `(payment_type, status)`.

> `payments.status = verified` is the **only** signal that money counts. `payment_verifications` is the append-only evidence trail for why.

### 10.2 `payment_allocations`

| Column                       | Type            | Constraints / notes                      |
| ---------------------------- | --------------- | ---------------------------------------- |
| `id`                         | BIGINT UNSIGNED | PK                                       |
| `payment_id`                 | BIGINT UNSIGNED | FK → `payments.id`, `RESTRICT`           |
| `deposit_obligation_id`      | BIGINT UNSIGNED | FK → `deposit_obligations.id`, NULL      |
| `contribution_obligation_id` | BIGINT UNSIGNED | FK → `contribution_obligations.id`, NULL |
| `penalty_id`                 | BIGINT UNSIGNED | FK → `penalties.id`, NULL                |
| `amount`                     | DECIMAL(15,2)   | > 0                                      |
| `created_at`                 | TIMESTAMP       |                                          |

Constraints:

- `CHECK ((deposit_obligation_id IS NOT NULL) + (contribution_obligation_id IS NOT NULL) + (penalty_id IS NOT NULL) = 1)`
- Unique: `(payment_id, deposit_obligation_id)`, `(payment_id, contribution_obligation_id)`, `(payment_id, penalty_id)` (MySQL treats NULLs as distinct, which is acceptable because only one target is non-null per row).
- `SUM(payment_allocations.amount) <= payments.amount` per payment (service invariant + optional trigger).

Index: `(deposit_obligation_id)`, `(contribution_obligation_id)`, `(penalty_id)`.

> A single payment may be split across obligations (e.g., arrears) when policy permits. The allocation total cannot exceed the payment amount.

### 10.3 `payment_verifications` (append-only)

| Column             | Type            | Constraints / notes                          |
| ------------------ | --------------- | -------------------------------------------- |
| `id`               | BIGINT UNSIGNED | PK                                           |
| `payment_id`       | BIGINT UNSIGNED | FK → `payments.id`, `RESTRICT`               |
| `decision`         | VARCHAR(16)     | `verified`, `rejected`                       |
| `amount_verified`  | DECIMAL(15,2)   | equals payment amount on verify; 0 on reject |
| `verifier_user_id` | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                  |
| `decided_at`       | TIMESTAMP       | required                                     |
| `reason`           | VARCHAR(500)    | required on reject                           |
| `created_at`       | TIMESTAMP       |                                              |

Unique: `payment_id` — one terminal verification per payment record. Re-submission creates a new payment row. Corrections after verification use a reversal payment plus `financial_adjustments`, never a second verification.

### 10.4 `receipts`

| Column                | Type            | Constraints / notes                                |
| --------------------- | --------------- | -------------------------------------------------- |
| `id`                  | BIGINT UNSIGNED | PK                                                 |
| `receipt_number`      | VARCHAR(40)     | UNIQUE, from `NumberSequenceService`               |
| `receipt_type`        | VARCHAR(16)     | `payment`, `payout`, `refund`                      |
| `receiptable_type`    | VARCHAR(60)     | `payments`, `payouts`, `refunds`                   |
| `receiptable_id`      | BIGINT UNSIGNED | source row                                         |
| `issued_to_member_id` | BIGINT UNSIGNED | FK → `member_profiles.id`, `RESTRICT`              |
| `amount`              | DECIMAL(15,2)   | snapshot                                           |
| `currency`            | CHAR(3)         | `ETB`                                              |
| `snapshot`            | JSON            | immutable names/amounts/dates for PDF regeneration |
| `pdf_attachment_id`   | BIGINT UNSIGNED | FK → `attachments.id`, nullable                    |
| `issued_by`           | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                        |
| `issued_at`           | TIMESTAMP       | required                                           |
| `voided_at`           | TIMESTAMP       | nullable                                           |
| `void_reason`         | VARCHAR(500)    | nullable                                           |
| `created_at`          | TIMESTAMP       |                                                    |

Unique: `receipt_number`, `(receiptable_type, receiptable_id)`. Indexes: `(issued_to_member_id, issued_at)`, `receipt_type`.

> Receipts store a JSON snapshot so later edits cannot alter an issued document. Voiding marks the receipt and posts an adjusting entry; it never deletes the row.

---

## 11. Payouts

### 11.1 `payout_schedules`

| Column                     | Type            | Constraints / notes                                   |
| -------------------------- | --------------- | ----------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                    |
| `equb_cycle_id`            | BIGINT UNSIGNED | FK → `equb_cycles.id`, `RESTRICT`, UNIQUE             |
| `method`                   | VARCHAR(16)     | `predetermined`, `random`, `manual`, `hybrid`         |
| `status`                   | VARCHAR(16)     | `draft`, `active`, `locked`, `completed`, `cancelled` |
| `created_by`               | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                           |
| `activated_at`             | TIMESTAMP       | nullable                                              |
| `locked_at`                | TIMESTAMP       | nullable                                              |
| `created_at`, `updated_at` | TIMESTAMP       |                                                       |

### 11.2 `payout_schedule_items`

| Column                     | Type              | Constraints / notes                                             |
| -------------------------- | ----------------- | --------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED   | PK                                                              |
| `payout_schedule_id`       | BIGINT UNSIGNED   | FK → `payout_schedules.id`, `RESTRICT`                          |
| `equb_membership_id`       | BIGINT UNSIGNED   | FK → `equb_memberships.id`, `RESTRICT`                          |
| `position`                 | SMALLINT UNSIGNED | > 0                                                             |
| `scheduled_on`             | DATE              | required                                                        |
| `status`                   | VARCHAR(16)       | `scheduled`, `rescheduled`, `completed`, `skipped`, `cancelled` |
| `selection_method`         | VARCHAR(16)       | `predetermined`, `random`, `manual`                             |
| `selection_evidence`       | JSON              | seed/hash/actor reason for random/manual                        |
| `rescheduled_from_id`      | BIGINT UNSIGNED   | FK → `payout_schedule_items.id`, nullable                       |
| `created_by`               | BIGINT UNSIGNED   | FK → `users.id`, `RESTRICT`                                     |
| `created_at`, `updated_at` | TIMESTAMP         |                                                                 |

Unique: `(payout_schedule_id, position)`, `(payout_schedule_id, equb_membership_id)`. Index: `(equb_membership_id)`, `(scheduled_on, status)`.

> The unique membership constraint enforces **one payout per member per cycle** (default policy). If the business later allows multiple payouts, this requires an explicit, migrated policy change — not a silent relaxation.

### 11.3 `payouts`

| Column                     | Type            | Constraints / notes                                                                                                                      |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                                                                                                       |
| `payout_schedule_item_id`  | BIGINT UNSIGNED | FK → `payout_schedule_items.id`, `RESTRICT`, UNIQUE                                                                                      |
| `equb_cycle_id`            | BIGINT UNSIGNED | FK → `equb_cycles.id`, `RESTRICT`                                                                                                        |
| `equb_membership_id`       | BIGINT UNSIGNED | FK → `equb_memberships.id`, `RESTRICT`                                                                                                   |
| `status`                   | VARCHAR(32)     | `draft`, `pending_approval`, `approved`, `rejected`, `disbursement_pending`, `disbursed`, `completed`, `failed`, `reversed`, `cancelled` |
| `gross_amount`             | DECIMAL(15,2)   | >= 0                                                                                                                                     |
| `deductions_amount`        | DECIMAL(15,2)   | default 0                                                                                                                                |
| `net_amount`               | DECIMAL(15,2)   | `gross - deductions`, >= 0                                                                                                               |
| `currency`                 | CHAR(3)         | `ETB`                                                                                                                                    |
| `calculation_snapshot`     | JSON            | inputs and formula used                                                                                                                  |
| `requested_by`             | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                                                                                                              |
| `requested_at`             | TIMESTAMP       | required                                                                                                                                 |
| `approved_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                                                                                                                |
| `approved_at`              | TIMESTAMP       | nullable                                                                                                                                 |
| `rejected_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                                                                                                                |
| `rejected_at`              | TIMESTAMP       | nullable                                                                                                                                 |
| `rejection_reason`         | VARCHAR(500)    | nullable                                                                                                                                 |
| `disbursed_at`             | TIMESTAMP       | nullable                                                                                                                                 |
| `completed_at`             | TIMESTAMP       | nullable                                                                                                                                 |
| `reversed_at`              | TIMESTAMP       | nullable                                                                                                                                 |
| `reversal_reason`          | VARCHAR(500)    | nullable                                                                                                                                 |
| `created_at`, `updated_at` | TIMESTAMP       |                                                                                                                                          |

Unique: `payout_schedule_item_id` — one payout case per schedule item. Indexes: `(equb_cycle_id, status)`, `(equb_membership_id, status)`.

**State rule:** `completed` is set only by the disbursement workflow. `approved` alone never changes member status to BLUE.

### 11.4 `payout_approvals` (append-only)

| Column             | Type            | Constraints / notes           |
| ------------------ | --------------- | ----------------------------- |
| `id`               | BIGINT UNSIGNED | PK                            |
| `payout_id`        | BIGINT UNSIGNED | FK → `payouts.id`, `RESTRICT` |
| `decision`         | VARCHAR(16)     | `approved`, `rejected`        |
| `approver_user_id` | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`   |
| `decided_at`       | TIMESTAMP       | required                      |
| `comments`         | VARCHAR(500)    | nullable                      |
| `created_at`       | TIMESTAMP       |                               |

Index: `(payout_id, decided_at)`. Service enforces exactly one active approval decision per payout attempt; reversal opens a new attempt with its own history.

### 11.5 `payout_disbursements`

| Column                     | Type            | Constraints / notes                                        |
| -------------------------- | --------------- | ---------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                         |
| `payout_id`                | BIGINT UNSIGNED | FK → `payouts.id`, `RESTRICT`                              |
| `amount`                   | DECIMAL(15,2)   | > 0                                                        |
| `method`                   | VARCHAR(24)     | `cash`, `bank_transfer`, `mobile_money`, `cheque`, `other` |
| `reference`                | VARCHAR(100)    | nullable                                                   |
| `paid_on`                  | DATE            | required                                                   |
| `evidence_attachment_id`   | BIGINT UNSIGNED | FK → `attachments.id`, nullable                            |
| `disbursed_by`             | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                                |
| `recorded_at`              | TIMESTAMP       | required                                                   |
| `is_reversal`              | TINYINT(1)      | default 0                                                  |
| `reverses_disbursement_id` | BIGINT UNSIGNED | FK → `payout_disbursements.id`, nullable                   |
| `notes`                    | TEXT            | nullable                                                   |
| `created_at`               | TIMESTAMP       |                                                            |

Unique: `payout_id` where `is_reversal = 0` (one real disbursement). Because MySQL unique indexes cannot be partial, use a generated column `active_disbursement_key = IF(is_reversal = 0, payout_id, NULL)` with a unique index, or enforce via service plus `payouts.status` transition. Reversals are new rows linked to the original.

---

## 12. Finance (double-entry)

### 12.1 `financial_accounts`

| Column                     | Type            | Constraints / notes                                                                |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                                                 |
| `scope_key`                | VARCHAR(40)     | `org` or `group:<id>`; required                                                    |
| `equb_group_id`            | BIGINT UNSIGNED | FK → `equb_groups.id`, nullable (org-level accounts)                               |
| `code`                     | VARCHAR(10)     | chart-of-accounts code                                                             |
| `name`                     | VARCHAR(150)    | required                                                                           |
| `type`                     | VARCHAR(16)     | `asset`, `liability`, `equity`, `income`, `expense`                                |
| `subtype`                  | VARCHAR(32)     | `cash`, `bank`, `mobile_money`, `receivable`, `fund`, `penalty`, `refund`, `other` |
| `currency`                 | CHAR(3)         | `ETB`                                                                              |
| `is_system`                | TINYINT(1)      | seeded accounts cannot be deleted                                                  |
| `is_active`                | TINYINT(1)      | default 1                                                                          |
| `created_by`               | BIGINT UNSIGNED | FK → `users.id`, nullable                                                          |
| `created_at`, `updated_at` | TIMESTAMP       |                                                                                    |

Unique: `(scope_key, code)`. Index: `(equb_group_id, type)`.

### 12.2 `journal_entries` (append-only)

| Column           | Type            | Constraints / notes                                                                       |
| ---------------- | --------------- | ----------------------------------------------------------------------------------------- |
| `id`             | BIGINT UNSIGNED | PK                                                                                        |
| `entry_number`   | VARCHAR(40)     | UNIQUE, from sequence service                                                             |
| `equb_group_id`  | BIGINT UNSIGNED | FK → `equb_groups.id`, `RESTRICT`                                                         |
| `equb_cycle_id`  | BIGINT UNSIGNED | FK → `equb_cycles.id`, nullable                                                           |
| `entry_date`     | DATE            | business date                                                                             |
| `description`    | VARCHAR(255)    | required                                                                                  |
| `source_type`    | VARCHAR(60)     | `payments`, `payouts`, `penalties`, `refunds`, `financial_adjustments`, `reconciliations` |
| `source_id`      | BIGINT UNSIGNED | nullable for opening balances                                                             |
| `posting_key`    | VARCHAR(120)    | UNIQUE idempotency key, e.g. `payment:123:verified`                                       |
| `reversal_of_id` | BIGINT UNSIGNED | FK → `journal_entries.id`, nullable                                                       |
| `posted_by`      | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                                                               |
| `posted_at`      | TIMESTAMP       | required                                                                                  |
| `created_at`     | TIMESTAMP       |                                                                                           |

Indexes: `posting_key` unique, `entry_number` unique, `(equb_group_id, entry_date)`, `(source_type, source_id)`, `reversal_of_id`.

> No `updated_at`: posted entries are immutable. Status is derived from the existence of a reversal that points at the entry.

### 12.3 `journal_entry_lines` (append-only)

| Column                 | Type              | Constraints / notes                                     |
| ---------------------- | ----------------- | ------------------------------------------------------- |
| `id`                   | BIGINT UNSIGNED   | PK                                                      |
| `journal_entry_id`     | BIGINT UNSIGNED   | FK → `journal_entries.id`, `RESTRICT`                   |
| `line_number`          | SMALLINT UNSIGNED | unique with entry                                       |
| `financial_account_id` | BIGINT UNSIGNED   | FK → `financial_accounts.id`, `RESTRICT`                |
| `member_profile_id`    | BIGINT UNSIGNED   | FK → `member_profiles.id`, nullable (member sub-ledger) |
| `debit`                | DECIMAL(15,2)     | default 0                                               |
| `credit`               | DECIMAL(15,2)     | default 0                                               |
| `memo`                 | VARCHAR(255)      | nullable                                                |
| `created_at`           | TIMESTAMP         |                                                         |

Constraints:

- `CHECK (debit >= 0 AND credit >= 0)`
- `CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))` — each line is one-sided.
- Unique `(journal_entry_id, line_number)`.
- Index `(financial_account_id, journal_entry_id)`, `(member_profile_id)`.
- Balanced-entry invariant is validated in `FinancialLedgerService` inside the transaction (and by a scheduled integrity check).

### 12.4 `financial_adjustments`

| Column                     | Type            | Constraints / notes                                           |
| -------------------------- | --------------- | ------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                            |
| `equb_group_id`            | BIGINT UNSIGNED | FK → `equb_groups.id`, `RESTRICT`                             |
| `equb_cycle_id`            | BIGINT UNSIGNED | FK → `equb_cycles.id`, nullable                               |
| `adjustment_type`          | VARCHAR(16)     | `correction`, `reversal`, `write_off`, `other`                |
| `reason`                   | VARCHAR(500)    | required                                                      |
| `amount`                   | DECIMAL(15,2)   | > 0                                                           |
| `debit_account_id`         | BIGINT UNSIGNED | FK → `financial_accounts.id`, `RESTRICT`                      |
| `credit_account_id`        | BIGINT UNSIGNED | FK → `financial_accounts.id`, `RESTRICT`                      |
| `status`                   | VARCHAR(24)     | `draft`, `pending_approval`, `approved`, `posted`, `rejected` |
| `requested_by`             | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                                   |
| `requested_at`             | TIMESTAMP       | required                                                      |
| `approved_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                                     |
| `approved_at`              | TIMESTAMP       | nullable                                                      |
| `journal_entry_id`         | BIGINT UNSIGNED | FK → `journal_entries.id`, nullable                           |
| `created_at`, `updated_at` | TIMESTAMP       |                                                               |

Index: `(equb_group_id, status)`, `journal_entry_id`.

> Maker-checker: `requested_by <> approved_by` when the group requires it. Posting creates exactly one journal entry with `posting_key = adjustment:<id>`.

### 12.5 `reconciliations`

| Column                     | Type            | Constraints / notes                                      |
| -------------------------- | --------------- | -------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                       |
| `equb_group_id`            | BIGINT UNSIGNED | FK → `equb_groups.id`, `RESTRICT`                        |
| `equb_cycle_id`            | BIGINT UNSIGNED | FK → `equb_cycles.id`, nullable                          |
| `period_start`             | DATE            | required                                                 |
| `period_end`               | DATE            | required                                                 |
| `status`                   | VARCHAR(16)     | `draft`, `submitted`, `reviewed`, `approved`, `rejected` |
| `prepared_by`              | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                              |
| `prepared_at`              | TIMESTAMP       | required                                                 |
| `reviewed_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                                |
| `reviewed_at`              | TIMESTAMP       | nullable                                                 |
| `difference_amount`        | DECIMAL(15,2)   | derived and stored for report snapshot                   |
| `notes`                    | TEXT            | nullable                                                 |
| `created_at`, `updated_at` | TIMESTAMP       |                                                          |

Unique: `(equb_group_id, period_start, period_end, equb_cycle_id)`.

### 12.6 `reconciliation_items`

| Column                 | Type            | Constraints / notes                      |
| ---------------------- | --------------- | ---------------------------------------- |
| `id`                   | BIGINT UNSIGNED | PK                                       |
| `reconciliation_id`    | BIGINT UNSIGNED | FK → `reconciliations.id`, `RESTRICT`    |
| `financial_account_id` | BIGINT UNSIGNED | FK → `financial_accounts.id`, `RESTRICT` |
| `system_balance`       | DECIMAL(15,2)   | required                                 |
| `actual_balance`       | DECIMAL(15,2)   | required                                 |
| `difference`           | DECIMAL(15,2)   | `actual - system`                        |
| `note`                 | VARCHAR(500)    | nullable                                 |

Unique: `(reconciliation_id, financial_account_id)`.

---

## 13. Penalties, extensions, withdrawals, refunds, complaints

### 13.1 `penalties`

| Column                       | Type            | Constraints / notes                                         |
| ---------------------------- | --------------- | ----------------------------------------------------------- |
| `id`                         | BIGINT UNSIGNED | PK                                                          |
| `equb_group_id`              | BIGINT UNSIGNED | FK → `equb_groups.id`, `RESTRICT`                           |
| `equb_cycle_id`              | BIGINT UNSIGNED | FK → `equb_cycles.id`, `RESTRICT`                           |
| `equb_membership_id`         | BIGINT UNSIGNED | FK → `equb_memberships.id`, `RESTRICT`                      |
| `contribution_obligation_id` | BIGINT UNSIGNED | FK → `contribution_obligations.id`, nullable                |
| `penalty_type`               | VARCHAR(24)     | `late_payment`, `default`, `other`                          |
| `assessment_key`             | VARCHAR(80)     | e.g. `late:obligation:123:2026-01-31`; UNIQUE               |
| `assessed_on`                | DATE            | required                                                    |
| `amount`                     | DECIMAL(15,2)   | > 0                                                         |
| `status`                     | VARCHAR(16)     | `assessed`, `partially_paid`, `paid`, `waived`, `cancelled` |
| `calculation_snapshot`       | JSON            | rule/value/days used                                        |
| `waived_amount`              | DECIMAL(15,2)   | default 0 (projection of approved waivers)                  |
| `created_at`, `updated_at`   | TIMESTAMP       |                                                             |

Unique: `assessment_key`. Indexes: `(equb_membership_id, status)`, `(equb_cycle_id, status)`, `(contribution_obligation_id)`.

> `assessment_key` makes penalty assessment idempotent: rerunning the scheduler cannot duplicate a penalty.

### 13.2 `penalty_waivers`

| Column                     | Type            | Constraints / notes               |
| -------------------------- | --------------- | --------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                |
| `penalty_id`               | BIGINT UNSIGNED | FK → `penalties.id`, `RESTRICT`   |
| `amount`                   | DECIMAL(15,2)   | > 0, <= penalty remaining         |
| `reason`                   | VARCHAR(500)    | required                          |
| `status`                   | VARCHAR(16)     | `pending`, `approved`, `rejected` |
| `requested_by`             | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`       |
| `requested_at`             | TIMESTAMP       | required                          |
| `reviewed_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable         |
| `reviewed_at`              | TIMESTAMP       | nullable                          |
| `decision_reason`          | VARCHAR(500)    | nullable                          |
| `created_at`, `updated_at` | TIMESTAMP       |                                   |

Index: `(penalty_id, status)`. Unique approval per waiver attempt enforced in service (requester ≠ reviewer when maker-checker is on).

### 13.3 `payment_extensions`

| Column                       | Type            | Constraints / notes                            |
| ---------------------------- | --------------- | ---------------------------------------------- |
| `id`                         | BIGINT UNSIGNED | PK                                             |
| `contribution_obligation_id` | BIGINT UNSIGNED | FK → `contribution_obligations.id`, `RESTRICT` |
| `requested_by`               | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                    |
| `requested_at`               | TIMESTAMP       | required                                       |
| `extend_until`               | DATE            | required, > current due date                   |
| `reason`                     | VARCHAR(500)    | required                                       |
| `status`                     | VARCHAR(16)     | `pending`, `approved`, `rejected`, `cancelled` |
| `reviewed_by`                | BIGINT UNSIGNED | FK → `users.id`, nullable                      |
| `reviewed_at`                | TIMESTAMP       | nullable                                       |
| `decision_reason`            | VARCHAR(500)    | nullable                                       |
| `created_at`, `updated_at`   | TIMESTAMP       |                                                |

Index: `(contribution_obligation_id, status)`. Approved extensions write an audit record and update the obligation's effective due date via a separate `due_on_effective` column (add if extension semantics apply to penalty/overdue calculations) rather than mutating the snapshot.

### 13.4 `withdrawal_requests`

| Column                     | Type            | Constraints / notes                                         |
| -------------------------- | --------------- | ----------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                          |
| `equb_membership_id`       | BIGINT UNSIGNED | FK → `equb_memberships.id`, `RESTRICT`                      |
| `requested_by`             | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                                 |
| `requested_at`             | TIMESTAMP       | required                                                    |
| `effective_date`           | DATE            | required                                                    |
| `reason`                   | VARCHAR(500)    | required                                                    |
| `status`                   | VARCHAR(16)     | `pending`, `approved`, `rejected`, `processed`, `cancelled` |
| `reviewed_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                                   |
| `reviewed_at`              | TIMESTAMP       | nullable                                                    |
| `decision_reason`          | VARCHAR(500)    | nullable                                                    |
| `refund_id`                | BIGINT UNSIGNED | FK → `refunds.id`, nullable                                 |
| `created_at`, `updated_at` | TIMESTAMP       |                                                             |

Index: `(equb_membership_id, status)`.

### 13.5 `refunds`

| Column                     | Type            | Constraints / notes                                                          |
| -------------------------- | --------------- | ---------------------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                                           |
| `equb_group_id`            | BIGINT UNSIGNED | FK → `equb_groups.id`, `RESTRICT`                                            |
| `equb_membership_id`       | BIGINT UNSIGNED | FK → `equb_memberships.id`, `RESTRICT`                                       |
| `withdrawal_request_id`    | BIGINT UNSIGNED | FK → `withdrawal_requests.id`, nullable, UNIQUE                              |
| `amount`                   | DECIMAL(15,2)   | >= 0                                                                         |
| `calculation_snapshot`     | JSON            | inputs, policy, formula                                                      |
| `status`                   | VARCHAR(24)     | `draft`, `pending_approval`, `approved`, `rejected`, `disbursed`, `reversed` |
| `requested_by`             | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                                                  |
| `approved_by`              | BIGINT UNSIGNED | FK → `users.id`, nullable                                                    |
| `approved_at`              | TIMESTAMP       | nullable                                                                     |
| `disbursed_by`             | BIGINT UNSIGNED | FK → `users.id`, nullable                                                    |
| `disbursed_at`             | TIMESTAMP       | nullable                                                                     |
| `method`                   | VARCHAR(24)     | nullable                                                                     |
| `reference`                | VARCHAR(100)    | nullable                                                                     |
| `journal_entry_id`         | BIGINT UNSIGNED | FK → `journal_entries.id`, nullable                                          |
| `created_at`, `updated_at` | TIMESTAMP       |                                                                              |

Index: `(equb_group_id, status)`, `(equb_membership_id)`.

> Refund calculation follows `equb_group_rules.withdrawal_policy`. `undecided` blocks processing; the system never invents a formula.

### 13.6 `complaints`

| Column                     | Type            | Constraints / notes                                   |
| -------------------------- | --------------- | ----------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                    |
| `equb_group_id`            | BIGINT UNSIGNED | FK → `equb_groups.id`, `RESTRICT`                     |
| `equb_membership_id`       | BIGINT UNSIGNED | FK → `equb_memberships.id`, nullable                  |
| `raised_by`                | BIGINT UNSIGNED | FK → `users.id`, `RESTRICT`                           |
| `subject`                  | VARCHAR(200)    | required                                              |
| `description`              | TEXT            | required                                              |
| `status`                   | VARCHAR(16)     | `open`, `in_review`, `resolved`, `rejected`, `closed` |
| `assigned_to`              | BIGINT UNSIGNED | FK → `users.id`, nullable                             |
| `resolution`               | TEXT            | nullable                                              |
| `resolved_at`              | TIMESTAMP       | nullable                                              |
| `created_at`, `updated_at` | TIMESTAMP       |                                                       |

Index: `(equb_group_id, status)`, `(assigned_to, status)`.

---

## 14. Communication

### 14.1 `notifications` (Laravel database channel)

`id` CHAR(36) PK, `type` VARCHAR(255), `notifiable_type`/`notifiable_id`, `data` JSON, `read_at` TIMESTAMP, timestamps. Index: `(notifiable_type, notifiable_id, read_at)`.

### 14.2 `notification_preferences`

`id`, `user_id` FK, `notification_type` VARCHAR(80), `channel` VARCHAR(16) `database|email|sms`, `enabled` TINYINT(1), timestamps. Unique `(user_id, notification_type, channel)`.

### 14.3 `notification_templates`

`id`, `template_key` VARCHAR(80), `channel` VARCHAR(16), `locale` VARCHAR(8) default `en`, `subject` VARCHAR(200) nullable, `body` MEDIUMTEXT, `is_active` TINYINT(1), timestamps. Unique `(template_key, channel, locale)`.

### 14.4 `communication_logs`

`id`, `channel` VARCHAR(16), `recipient` VARCHAR(255), `notification_template_id` FK nullable, `notifiable_type`/`notifiable_id` nullable, `status` VARCHAR(16) `queued|sent|delivered|failed`, `provider_message_id` VARCHAR(190) nullable, `error` TEXT nullable, `sent_at` TIMESTAMP nullable, timestamps. Index: `(status, created_at)`, `(recipient)`.

### 14.5 `announcements`

`id`, `equb_group_id` FK nullable (null = organization-wide), `title` VARCHAR(200), `body` MEDIUMTEXT, `audience` VARCHAR(24) `all|group_members|staff|role`, `created_by` FK, `published_at` TIMESTAMP nullable, `expires_at` TIMESTAMP nullable, timestamps. Index: `(equb_group_id, published_at)`.

### 14.6 `announcement_reads`

`id`, `announcement_id` FK, `user_id` FK, `read_at` TIMESTAMP. Unique `(announcement_id, user_id)`.

---

## 15. Platform tables

### 15.1 `app_settings`

| Column                     | Type            | Constraints / notes                                                                               |
| -------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `id`                       | BIGINT UNSIGNED | PK                                                                                                |
| `key`                      | VARCHAR(120)    | UNIQUE, dot notation (`organization.name`)                                                        |
| `value`                    | TEXT            | nullable                                                                                          |
| `value_type`               | VARCHAR(16)     | `string`, `integer`, `boolean`, `decimal`, `json`, `encrypted`                                    |
| `category`                 | VARCHAR(40)     | `organization`, `currency`, `security`, `notifications`, `receipts`, `payments`, `business_rules` |
| `is_public`                | TINYINT(1)      | safe to share with frontend                                                                       |
| `updated_by`               | BIGINT UNSIGNED | FK → `users.id`, nullable                                                                         |
| `created_at`, `updated_at` | TIMESTAMP       |                                                                                                   |

Encrypted values use Laravel's `encrypted` cast; secrets are never read into frontend props.

### 15.2 `audit_logs` (append-only)

| Column                  | Type            | Constraints / notes                                                |
| ----------------------- | --------------- | ------------------------------------------------------------------ |
| `id`                    | BIGINT UNSIGNED | PK                                                                 |
| `user_id`               | BIGINT UNSIGNED | FK → `users.id`, nullable                                          |
| `equb_group_id`         | BIGINT UNSIGNED | FK → `equb_groups.id`, nullable                                    |
| `event`                 | VARCHAR(80)     | required (`payment.verified`, `payout.disbursed`, `role.assigned`) |
| `auditable_type`        | VARCHAR(60)     | nullable                                                           |
| `auditable_id`          | BIGINT UNSIGNED | nullable                                                           |
| `before`                | JSON            | nullable                                                           |
| `after`                 | JSON            | nullable                                                           |
| `changed_fields`        | JSON            | nullable                                                           |
| `transaction_reference` | VARCHAR(120)    | nullable (links to posting key/receipt)                            |
| `request_id`            | VARCHAR(64)     | nullable                                                           |
| `ip_address`            | VARCHAR(45)     | nullable                                                           |
| `user_agent`            | VARCHAR(255)    | nullable                                                           |
| `created_at`            | TIMESTAMP       |                                                                    |

Indexes: `(auditable_type, auditable_id)`, `(user_id, created_at)`, `(equb_group_id, event, created_at)`, `event`.

> No `updated_at`, no application update/delete routes. Production DB privileges should deny `UPDATE`/`DELETE` on this table.

### 15.3 `attachments`

| Column            | Type            | Constraints / notes                                                                           |
| ----------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `id`              | BIGINT UNSIGNED | PK                                                                                            |
| `disk`            | VARCHAR(40)     | `private` (default)                                                                           |
| `path`            | VARCHAR(500)    | UNIQUE                                                                                        |
| `original_name`   | VARCHAR(255)    | required                                                                                      |
| `mime_type`       | VARCHAR(120)    | required                                                                                      |
| `size_bytes`      | BIGINT UNSIGNED | required                                                                                      |
| `checksum_sha256` | CHAR(64)        | required, indexed                                                                             |
| `category`        | VARCHAR(24)     | `kyc`, `payment_evidence`, `payout_evidence`, `receipt`, `agreement`, `announcement`, `other` |
| `visibility`      | VARCHAR(16)     | `private`, `signed`                                                                           |
| `attachable_type` | VARCHAR(60)     | nullable                                                                                      |
| `attachable_id`   | BIGINT UNSIGNED | nullable                                                                                      |
| `uploaded_by`     | BIGINT UNSIGNED | FK → `users.id`, nullable                                                                     |
| `created_at`      | TIMESTAMP       |                                                                                               |

Index: `(attachable_type, attachable_id)`, `category`, `checksum_sha256`.

### 15.4 `number_sequences`

| Column          | Type            | Constraints / notes                                        |
| --------------- | --------------- | ---------------------------------------------------------- |
| `id`            | BIGINT UNSIGNED | PK                                                         |
| `sequence_key`  | VARCHAR(40)     | e.g. `member`, `group`, `payment_receipt`, `journal_entry` |
| `scope`         | VARCHAR(80)     | e.g. `org`, `group:12`, `year:2026`                        |
| `period`        | VARCHAR(10)     | e.g. `2026`; empty string when not period-based            |
| `current_value` | BIGINT UNSIGNED | default 0                                                  |
| `updated_at`    | TIMESTAMP       |                                                            |

Unique: `(sequence_key, scope, period)`. Allocation uses `SELECT ... FOR UPDATE`, increments, formats, and commits atomically.

### 15.5 Framework tables

`password_reset_tokens`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`. Standard Laravel schemas; not financial.

---

## 16. Key relationships and constraint summary

| Parent                  | Child                      | Relationship    | Deletion                   |
| ----------------------- | -------------------------- | --------------- | -------------------------- |
| `users`                 | `member_profiles`          | 1:0..1          | RESTRICT                   |
| `member_profiles`       | `member_identifications`   | 1:n             | RESTRICT                   |
| `member_profiles`       | `member_payout_accounts`   | 1:n             | RESTRICT                   |
| `equb_groups`           | `equb_group_user`          | 1:n             | CASCADE (assignments only) |
| `equb_groups`           | `equb_group_rules`         | 1:n (versioned) | RESTRICT                   |
| `equb_groups`           | `equb_memberships`         | 1:n             | RESTRICT                   |
| `member_profiles`       | `equb_memberships`         | 1:n             | RESTRICT                   |
| `equb_groups`           | `equb_cycles`              | 1:n             | RESTRICT                   |
| `equb_cycles`           | `contribution_periods`     | 1:n             | RESTRICT                   |
| `equb_cycles`           | `deposit_rounds`           | 1:n             | RESTRICT                   |
| `deposit_rounds`        | `deposit_obligations`      | 1:n             | RESTRICT                   |
| `contribution_periods`  | `contribution_obligations` | 1:n             | RESTRICT                   |
| `equb_memberships`      | `*_obligations`            | 1:n             | RESTRICT                   |
| `payments`              | `payment_allocations`      | 1:n             | RESTRICT                   |
| `payments`              | `payment_verifications`    | 1:1             | RESTRICT                   |
| `obligations`           | `payment_allocations`      | 1:n             | RESTRICT                   |
| `equb_cycles`           | `payout_schedules`         | 1:1             | RESTRICT                   |
| `payout_schedules`      | `payout_schedule_items`    | 1:n             | RESTRICT                   |
| `payout_schedule_items` | `payouts`                  | 1:1             | RESTRICT                   |
| `payouts`               | `payout_approvals`         | 1:n             | RESTRICT                   |
| `payouts`               | `payout_disbursements`     | 1:n (1 active)  | RESTRICT                   |
| `journal_entries`       | `journal_entry_lines`      | 1:n             | RESTRICT                   |
| `financial_accounts`    | `journal_entry_lines`      | 1:n             | RESTRICT                   |
| `equb_memberships`      | `penalties`, `withdrawals` | 1:n             | RESTRICT                   |
| `refunds`               | `receipts`                 | 1:1 (logical)   | RESTRICT                   |

**Constraint highlights:**

- `payments.idempotency_key` UNIQUE.
- `journal_entries.posting_key` UNIQUE.
- `deposit_obligations(deposit_round_id, equb_membership_id)` UNIQUE.
- `contribution_obligations(contribution_period_id, equb_membership_id)` UNIQUE.
- `payout_schedule_items(payout_schedule_id, equb_membership_id)` UNIQUE.
- `payouts.payout_schedule_item_id` UNIQUE.
- `receipts.receipt_number` UNIQUE; `(receiptable_type, receiptable_id)` UNIQUE.
- `penalties.assessment_key` UNIQUE.
- `equb_memberships(equb_group_id, member_profile_id)` UNIQUE.
- `equb_group_rules(equb_group_id, active_flag)` UNIQUE (single active version).
- `member_identifications.number_hash` UNIQUE.
- `member_profiles.phone_normalized` UNIQUE.
- `number_sequences(sequence_key, scope, period)` UNIQUE.
- CHECK `journal_entry_lines` one-sided debit/credit.
- CHECK `payment_allocations` exactly one obligation target.
- CHECK date ordering on periods and rounds.
- CHECK `payouts.net_amount = gross_amount - deductions_amount` (MySQL 8 enforces deterministic CHECK expressions).

---

## 17. Derived member status (no color column)

`MemberStatusService` computes status from facts. Equivalent SQL for a group dashboard:

```sql
-- Pseudocode: per membership in the current cycle
CASE
  WHEN EXISTS (
    SELECT 1 FROM payouts po
    WHERE po.equb_membership_id = m.id
      AND po.equb_cycle_id = :cycle
      AND po.status IN ('disbursed','completed')
  ) THEN 'BLUE'
  WHEN COALESCE((
    SELECT SUM(a.amount)
    FROM contribution_obligations o
    JOIN payment_allocations a ON a.contribution_obligation_id = o.id
    JOIN payments p ON p.id = a.payment_id AND p.status = 'verified'
    WHERE o.equb_membership_id = m.id
      AND o.contribution_period_id = :current_period
      AND o.cancelled_at IS NULL
  ), 0) >= (
    SELECT o.amount_due FROM contribution_obligations o
    WHERE o.equb_membership_id = m.id
      AND o.contribution_period_id = :current_period
  ) THEN 'GREEN'
  ELSE 'RED'
END AS member_color
```

Overdue is a separate boolean:

```sql
EXISTS (
  SELECT 1 FROM v_obligation_balances b
  WHERE b.equb_membership_id = m.id
    AND b.balance > 0
    AND CURRENT_DATE > DATE_ADD(b.due_on, INTERVAL b.grace_days DAY)
) AS is_overdue
```

`NOT_APPLICABLE` (neutral) is returned when the cycle is in deposit stage, the membership is suspended/withdrawn, or no current period is open.

> Never add a `color`/`status_color` column. Any caching layer must be explicitly rebuildable and invalidated by payment verification, payout completion, period change, or cycle change.

---

## 18. Transaction, locking, and idempotency

| Operation            | Transaction   | Locks                                       | Idempotency                                                     |
| -------------------- | ------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Verify payment       | yes           | `payments` row, obligation rows             | `payment_verifications.payment_id` unique; `posting_key` unique |
| Submit payment       | yes           | sequence row                                | `payments.idempotency_key` unique; reference unique             |
| Generate obligations | yes           | cycle/period/round row                      | unique obligation keys                                          |
| Disburse payout      | yes           | payout row, schedule item, account balances | `payout_disbursements` one active; `posting_key` unique         |
| Approve payout       | yes           | payout row                                  | status transition + approvals insert                            |
| Assess penalties     | yes (batched) | obligation chunk                            | `penalties.assessment_key` unique                               |
| Close cycle          | yes           | cycle, reconciliation                       | status transition; no new obligations after lock                |
| Allocate number      | yes           | `number_sequences` row                      | unique scope key                                                |
| Post journal entry   | yes           | account rows (optional)                     | `posting_key` unique                                            |

Application-level rule: read balances with `lockForUpdate()` before any payout or refund; re-check after acquiring locks. Unique constraints are the last line of defense, not the first.

---

## 19. Data integrity invariants

1. Every `journal_entries` row has ≥ 2 lines and `SUM(debit) = SUM(credit)`.
2. No journal line has both debit and credit, and none is zero on both sides.
3. `payments.amount >= SUM(payment_allocations.amount for that payment)`.
4. An allocation targets exactly one of deposit obligation, contribution obligation, or penalty.
5. A payment with `status = verified` has exactly one `payment_verifications` row with `decision = verified`.
6. A payment with `status = rejected` has exactly one verification row with `decision = rejected`.
7. `payouts.net_amount = gross_amount - deductions_amount` and `net_amount >= 0`.
8. A payout cannot reach `completed` without a non-reversal disbursement row.
9. `payout_schedule_items` has at most one item per membership per schedule (one payout per cycle by default).
10. A membership cannot have two active obligations for the same period/round.
11. `receipts` are unique per source and number.
12. `audit_logs`, `journal_entries`, `journal_entry_lines`, `payment_verifications`, and `payout_disbursements` cannot be updated/deleted through application code.
13. Every financial row is reachable to an `equb_group_id`; queries are always group-scoped.
14. `equb_group_rules` has exactly one active version per group at any time.
15. Rule snapshots exist on cycles and obligations before any money is accepted.

---

## 20. Index and performance strategy

- Index every foreign key (InnoDB does not auto-index the referencing side in all cases; explicit indexes are created via constrained columns).
- Composite indexes follow query patterns:
    - `payments (equb_cycle_id, status)`, `(equb_membership_id, status)`, `(equb_group_id, paid_on)`.
    - `contribution_obligations (contribution_period_id, equb_membership_id)` unique, `(equb_membership_id, due_on)`.
    - `journal_entry_lines (financial_account_id, journal_entry_id)` for balances.
    - `audit_logs (equb_group_id, event, created_at)`.
    - `payout_schedule_items (scheduled_on, status)`.
- Avoid per-member loops; use aggregate queries and `withSum`/subqueries.
- Dashboard status query must be benchmarked at 500 members with realistic allocations; target < 500 ms.
- `EXPLAIN ANALYZE` on all report queries before Phase 8 release.
- Partitioning is **not** planned for v1; row counts are within MySQL 8 single-table limits.

---

## 21. Retention, anonymization, and deletion

- Financial records (payments, obligations, payouts, ledger, receipts, penalties, refunds, audit) are retained for at least 7 years or per legal advice (D-19).
- Members with financial history are never deleted: `member_profiles.status` becomes `inactive`/`blacklisted`; PII is anonymized only through an explicit, audited retention job that preserves financial references.
- Users are deactivated (`users.status`, `deactivated_at`) and sessions revoked. Email/phone may be replaced with anonymized values on request after legal review.
- Groups with financial history are `closed`, never deleted.
- Attachments follow a retention policy per category; financial evidence is retained even if the UI is cleaned up.
- No cascading deletes may ever reach `payments`, `payouts`, `journal_*`, `receipts`, `penalties`, `refunds`, or `audit_logs`.

---

## 22. Migration order

Migrations are dependency-ordered and reversible:

1. Framework/auth extensions (`users` columns, `passkeys`, `sessions`, framework tables) — most already exist.
2. Spatie permission tables.
3. `app_settings`, `number_sequences`, `attachments`, `audit_logs`.
4. `member_profiles`, `member_identifications`, `member_verifications`, `member_payout_accounts`.
5. `equb_groups`, `equb_group_user`, `equb_group_rules`, `equb_group_agreements`.
6. `equb_memberships`, `membership_requests`, `equb_agreement_acceptances`.
7. `equb_cycles`, `contribution_periods`, `deposit_rounds`.
8. `deposit_obligations`, `contribution_obligations`.
9. `financial_accounts`, `journal_entries`, `journal_entry_lines`.
10. `payments`, `payment_allocations`, `payment_verifications`, `receipts`.
11. `payout_schedules`, `payout_schedule_items`, `payouts`, `payout_approvals`, `payout_disbursements`.
12. `financial_adjustments`, `reconciliations`, `reconciliation_items`.
13. `penalties`, `penalty_waivers`, `payment_extensions`, `withdrawal_requests`, `refunds`, `complaints`.
14. `notifications` (Laravel), `notification_*`, `communication_logs`, `announcements`, `announcement_reads`.
15. Database views (`v_obligation_balances`, `v_membership_cycle_financials`, `v_group_financial_summary`).
16. Indexes/checks added in dedicated migrations after table creation for clarity.

Each migration must be tested forward and backward on a clean database. Destructive migrations require a backup and explicit review.

---

## 23. Seeded baseline data

| Seeder                       | Content                                                                        | Environment                          |
| ---------------------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| `RolesAndPermissionsSeeder`  | Six roles; granular permissions; role matrix from `REQUIREMENTS.md`            | all                                  |
| `ChartOfAccountsSeeder`      | Baseline accounts per group scope from §5.5 of architecture                    | all (idempotent)                     |
| `SettingsSeeder`             | Organization defaults, ETB, timezone, receipt prefixes, safe business defaults | all                                  |
| `NotificationTemplateSeeder` | Core templates (payment verified, payout approved, overdue, etc.)              | all                                  |
| `DemoDataSeeder`             | Sample groups/members/cycles                                                   | local/testing only, never production |

Seeders must be idempotent (`updateOrCreate`/`firstOrCreate`) and must not create accounts with known passwords outside local/testing.

---

## 24. Open schema decisions

These are deliberately not hardcoded. The schema supports each option; the business owner must choose before the relevant phase.

| Decision                           | Schema support                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| D-01 deposit fund treatment        | `equb_group_rules.deposit_fund_treatment`, `payout_formula`, ledger account mapping |
| D-02 payout commencement           | `payout_commencement_mode` + date; cycle status gates                               |
| D-03 BLUE persistence              | Status service per cycle; no stored color                                           |
| D-04 multiple group membership     | `allow_multiple_group_membership` + membership uniqueness                           |
| D-05 partial contributions         | `partial_contributions_allowed`; allocation rows support splits                     |
| D-06 payout selection              | `payout_mode` + `payout_schedule_items.selection_method/evidence`                   |
| D-07 penalties                     | `penalty_policy/value/grace/cap`; `assessment_key` idempotency                      |
| D-08 withdrawal formula            | `withdrawal_policy`; `refunds.calculation_snapshot`                                 |
| D-09 payout composition            | `payout_formula`; `deductions_amount` + snapshot                                    |
| D-10 member login                  | `users.email`/`phone_normalized` nullable strategy                                  |
| D-12 maker-checker                 | `maker_checker_payments`, `maker_checker_payouts`; actor columns                    |
| D-16 overpayment                   | `overpayment_policy`; allocation constraints                                        |
| D-17 payout before full collection | `payout_before_full_collection_allowed`                                             |
| D-18 penalty deduction             | `penalty_deduct_from_payout`                                                        |
| D-19 retention                     | status/`archived_at`; no hard deletes                                               |
| D-20 multi-org                     | current schema assumes one org; `scope_key` and group scoping ease later expansion  |

---

## 25. Validation of this design against the brief

| Brief requirement                                         | Schema evidence                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| Initial deposit rounds are configurable, not always three | `deposit_rounds.sequence` 1..n; `deposit_rounds_count`               |
| Deposits distinct from contributions                      | separate obligation and ledger accounts; `payments.payment_type`     |
| No assumption about deposit fund distribution             | `deposit_fund_treatment = undecided` + `payout_formula`              |
| BLUE priority, overdue separate                           | status service + `v_obligation_balances`; no color column            |
| Approval ≠ disbursement                                   | `payouts.status` + `payout_approvals` + `payout_disbursements`       |
| No unverified payments in verified totals                 | allocations join `payments.status = verified`                        |
| No duplicate payouts                                      | unique schedule item + payout per item                               |
| Traceable ledger                                          | append-only journal + `posting_key` + source links                   |
| No hard deletes of financial records                      | RESTRICT FKs + status columns + audit                                |
| Multi-role and group-scoped authority                     | Spatie roles + `equb_group_user`                                     |
| Maker-checker                                             | actor columns + group policy flags                                   |
| Audit trail                                               | append-only `audit_logs` with before/after and transaction reference |
