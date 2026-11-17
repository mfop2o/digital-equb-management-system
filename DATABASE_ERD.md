# DATABASE ERD — Digital Equb Management System

> **Status:** Phase 1 deliverable. Visual companion to `DATABASE_DESIGN.md`.
> **Notation:** Crow's-foot. `||--o{` = one-to-many, `||--||` = one-to-one, `}o--||` = many-to-one.
> Financial tables use restrictive deletes; only non-financial assignment/config children cascade.

---

## 1. Domain overview

```mermaid
erDiagram
    users ||--o{ member_profiles : "may login as"
    users ||--o{ equb_group_user : "staff assignment"
    users ||--o{ audit_logs : "acts"

    member_profiles ||--o{ member_identifications : has
    member_profiles ||--o{ member_verifications : "KYC decisions"
    member_profiles ||--o{ member_payout_accounts : "receives via"
    member_profiles ||--o{ equb_memberships : joins
    member_profiles ||--o{ payments : makes
    member_profiles ||--o{ receipts : "issued to"
    member_profiles ||--o{ journal_entry_lines : "sub-ledger"

    equb_groups ||--o{ equb_group_user : "staff"
    equb_groups ||--o{ equb_group_rules : "versioned rules"
    equb_groups ||--o{ equb_group_agreements : agreements
    equb_groups ||--o{ equb_memberships : contains
    equb_groups ||--o{ equb_cycles : runs
    equb_groups ||--o{ financial_accounts : "chart of accounts"
    equb_groups ||--o{ payments : "receives"
    equb_groups ||--o{ payouts : "disburses"
    equb_groups ||--o{ penalties : assesses
    equb_groups ||--o{ refunds : pays

    equb_cycles ||--o{ contribution_periods : schedules
    equb_cycles ||--o{ deposit_rounds : schedules
    equb_cycles ||--o{ payout_schedules : "one per cycle"
    equb_cycles ||--o{ payouts : "one per member"
    equb_cycles ||--o{ financial_adjustments : corrects
    equb_cycles ||--o{ reconciliations : "reviewed"

    contribution_periods ||--o{ contribution_obligations : "due amounts"
    deposit_rounds ||--o{ deposit_obligations : "due amounts"
    equb_memberships ||--o{ contribution_obligations : owes
    equb_memberships ||--o{ deposit_obligations : owes
    equb_memberships ||--o{ penalties : "may incur"
    equb_memberships ||--o{ withdrawal_requests : requests

    payments ||--o{ payment_allocations : allocates
    payments ||--o| payment_verifications : "decided by"
    payment_allocations }o--o| contribution_obligations : settles
    payment_allocations }o--o| deposit_obligations : settles
    payment_allocations }o--o| penalties : settles

    payout_schedules ||--o{ payout_schedule_items : orders
    payout_schedule_items ||--o| payouts : "becomes"
    payouts ||--o{ payout_approvals : "decided"
    payouts ||--o{ payout_disbursements : "paid by"
    payouts ||--o| receipts : "receipt"

    journal_entries ||--o{ journal_entry_lines : "balanced lines"
    financial_accounts ||--o{ journal_entry_lines : "posted to"
    journal_entries ||--o| journal_entries : "reversal of"

    withdrawal_requests ||--o| refunds : "may produce"
    refunds ||--o| receipts : "receipt"
    penalties ||--o{ penalty_waivers : "waived by"
    contribution_obligations ||--o{ payment_extensions : "extended"

    announcements ||--o{ announcement_reads : "read by"
```

---

## 2. Identity, members, and groups

```mermaid
erDiagram
    users {
        bigint id PK
        string name
        string email UK
        string phone_normalized UK
        string password
        string status
        timestamp deactivated_at
    }

    member_profiles {
        bigint id PK
        bigint user_id FK
        string member_number UK
        string first_name
        string last_name
        string phone_normalized UK
        string status
        timestamp verified_at
    }

    member_identifications {
        bigint id PK
        bigint member_profile_id FK
        string type
        text number_encrypted
        char number_hash UK
        string number_last4
    }

    member_verifications {
        bigint id PK
        bigint member_profile_id FK
        bigint reviewer_user_id FK
        string decision
        timestamp decided_at
        string reason
    }

    member_payout_accounts {
        bigint id PK
        bigint member_profile_id FK
        string channel
        string provider_name
        text account_number_encrypted
        char account_number_hash
        string status
    }

    equb_groups {
        bigint id PK
        string group_number UK
        string name
        string status
        smallint capacity
        char currency
        timestamp activated_at
    }

    equb_group_user {
        bigint id PK
        bigint equb_group_id FK
        bigint user_id FK
        string group_role
        timestamp assigned_at
        timestamp revoked_at
    }

    equb_group_rules {
        bigint id PK
        bigint equb_group_id FK
        smallint version
        string status
        tinyint active_flag UK
        decimal contribution_amount
        string contribution_frequency
        string payout_mode
        string payout_commencement_mode
        string payout_formula
        string deposit_fund_treatment
        int deposit_rounds_count
    }

    equb_group_agreements {
        bigint id PK
        bigint equb_group_id FK
        bigint rule_version_id FK
        smallint version
        string status
        date effective_from
    }

    equb_memberships {
        bigint id PK
        bigint equb_group_id FK
        bigint member_profile_id FK
        string membership_number UK
        string status
        date joined_at
        timestamp activated_at
        timestamp exited_at
    }

    membership_requests {
        bigint id PK
        bigint equb_group_id FK
        bigint member_profile_id FK
        bigint requested_by FK
        string status
        timestamp reviewed_at
    }

    equb_agreement_acceptances {
        bigint id PK
        bigint equb_group_agreement_id FK
        bigint equb_membership_id FK
        timestamp accepted_at
        string ip_address
    }

    users ||--o| member_profiles : "portal account"
    member_profiles ||--o{ member_identifications : has
    member_profiles ||--o{ member_verifications : "reviewed"
    member_profiles ||--o{ member_payout_accounts : "paid via"
    member_profiles ||--o{ equb_memberships : "joins"
    equb_groups ||--o{ equb_group_user : "assigned staff"
    users ||--o{ equb_group_user : "staff role"
    equb_groups ||--o{ equb_group_rules : "versions"
    equb_groups ||--o{ equb_group_agreements : "terms"
    equb_group_rules ||--o{ equb_group_agreements : "basis"
    equb_groups ||--o{ equb_memberships : contains
    equb_groups ||--o{ membership_requests : "receives"
    member_profiles ||--o{ membership_requests : "requests"
    equb_memberships ||--o{ equb_agreement_acceptances : accepts
    equb_group_agreements ||--o{ equb_agreement_acceptances : "accepted as"
```

**Key constraints**

- `users.email` unique nullable; `users.phone_normalized` unique nullable.
- `member_profiles.phone_normalized` unique (duplicate detection).
- `member_identifications.number_hash` unique (duplicate detection without exposing raw ID).
- `equb_group_rules (equb_group_id, version)` unique; `(equb_group_id, active_flag)` unique for a single active version.
- `equb_memberships (equb_group_id, member_profile_id)` unique.
- `equb_group_user (equb_group_id, user_id, group_role)` unique; revocation uses `revoked_at`.

---

## 3. Cycles, periods, obligations

```mermaid
erDiagram
    equb_groups ||--o{ equb_cycles : "runs"
    equb_group_rules ||--o{ equb_cycles : "snapshotted into"
    equb_cycles ||--o{ contribution_periods : "has periods"
    equb_cycles ||--o{ deposit_rounds : "has rounds"
    contribution_periods ||--o{ contribution_obligations : "generates"
    deposit_rounds ||--o{ deposit_obligations : "generates"
    equb_memberships ||--o{ contribution_obligations : owes
    equb_memberships ||--o{ deposit_obligations : owes

    equb_cycles {
        bigint id PK
        bigint equb_group_id FK
        smallint cycle_number UK
        bigint rule_version_id FK
        json rule_snapshot
        string status
        date started_on
        date activated_on
        date closed_on
    }

    contribution_periods {
        bigint id PK
        bigint equb_cycle_id FK
        smallint sequence UK
        date opens_on
        date due_on
        date closes_on
        string status
        decimal amount_due_snapshot
        smallint grace_days_snapshot
    }

    deposit_rounds {
        bigint id PK
        bigint equb_cycle_id FK
        tinyint sequence UK
        decimal amount_per_member
        date opens_on
        date due_on
        date closes_on
        string status
    }

    contribution_obligations {
        bigint id PK
        bigint contribution_period_id FK
        bigint equb_membership_id FK
        decimal amount_due
        date due_on
        smallint grace_days
        timestamp cancelled_at
    }

    deposit_obligations {
        bigint id PK
        bigint deposit_round_id FK
        bigint equb_membership_id FK
        decimal amount_due
        date due_on
        smallint grace_days
        timestamp cancelled_at
    }

    withdrawal_requests {
        bigint id PK
        bigint equb_membership_id FK
        string status
        date effective_date
    }

    contribution_obligations ||--o{ payment_extensions : "extended by"
    equb_memberships ||--o{ withdrawal_requests : requests
```

**Key constraints**

- `equb_cycles (equb_group_id, cycle_number)` unique.
- `contribution_periods (equb_cycle_id, sequence)` unique; `(equb_cycle_id, due_on)` unique.
- `deposit_rounds (equb_cycle_id, sequence)` unique.
- `contribution_obligations (contribution_period_id, equb_membership_id)` unique.
- `deposit_obligations (deposit_round_id, equb_membership_id)` unique.
- Date checks: `opens_on <= due_on <= closes_on`.
- Obligations snapshot `amount_due`, `due_on`, `grace_days`; rule changes never rewrite them.

---

## 4. Payments and finance

```mermaid
erDiagram
    equb_groups ||--o{ payments : receives
    equb_cycles ||--o{ payments : "during"
    equb_memberships ||--o{ payments : submits
    member_profiles ||--o{ payments : "on behalf of"

    payments ||--o{ payment_allocations : split
    payments ||--o| payment_verifications : "terminal decision"
    payments ||--o| receipts : "payment receipt"

    deposit_obligations ||--o{ payment_allocations : settled_by
    contribution_obligations ||--o{ payment_allocations : settled_by
    penalties ||--o{ payment_allocations : settled_by

    financial_accounts ||--o{ journal_entry_lines : "accounted in"
    journal_entries ||--o{ journal_entry_lines : "balanced"
    journal_entries ||--o| journal_entries : "reversal"
    payments ||--o| journal_entries : "source"
    payouts ||--o| journal_entries : "source"
    refunds ||--o| journal_entries : "source"
    financial_adjustments ||--o| journal_entries : "posts"

    reconciliations ||--o{ reconciliation_items : "per account"
    financial_accounts ||--o{ reconciliation_items : "compared"

    payments {
        bigint id PK
        bigint equb_group_id FK
        bigint equb_cycle_id FK
        bigint equb_membership_id FK
        string payment_type
        decimal amount
        string method
        string reference
        string status
        string idempotency_key UK
        timestamp verified_at
    }

    payment_allocations {
        bigint id PK
        bigint payment_id FK
        bigint deposit_obligation_id FK
        bigint contribution_obligation_id FK
        bigint penalty_id FK
        decimal amount
    }

    payment_verifications {
        bigint id PK
        bigint payment_id FK
        string decision
        decimal amount_verified
        bigint verifier_user_id FK
        timestamp decided_at
    }

    receipts {
        bigint id PK
        string receipt_number UK
        string receipt_type
        string receiptable_type
        bigint receiptable_id
        decimal amount
        json snapshot
        timestamp issued_at
    }

    financial_accounts {
        bigint id PK
        string scope_key
        bigint equb_group_id FK
        string code
        string name
        string type
        string subtype
        tinyint is_system
    }

    journal_entries {
        bigint id PK
        bigint equb_group_id FK
        bigint equb_cycle_id FK
        string entry_number UK
        date entry_date
        string source_type
        bigint source_id
        string posting_key UK
        bigint reversal_of_id FK
        timestamp posted_at
    }

    journal_entry_lines {
        bigint id PK
        bigint journal_entry_id FK
        bigint financial_account_id FK
        bigint member_profile_id FK
        decimal debit
        decimal credit
    }

    financial_adjustments {
        bigint id PK
        bigint equb_group_id FK
        string adjustment_type
        decimal amount
        string status
        bigint requested_by FK
        bigint approved_by FK
        bigint journal_entry_id FK
    }

    reconciliations {
        bigint id PK
        bigint equb_group_id FK
        date period_start
        date period_end
        string status
        decimal difference_amount
    }

    reconciliation_items {
        bigint id PK
        bigint reconciliation_id FK
        bigint financial_account_id FK
        decimal system_balance
        decimal actual_balance
        decimal difference
    }
```

**Key constraints**

- `payments.idempotency_key` unique.
- `payment_verifications.payment_id` unique (one terminal decision per payment row).
- `payment_allocations`: exactly one of `deposit_obligation_id`, `contribution_obligation_id`, `penalty_id` is set.
- `journal_entries.posting_key` unique.
- `journal_entry_lines`: one-sided debit/credit, total debits = total credits per entry.
- `receipts.receipt_number` unique; `(receiptable_type, receiptable_id)` unique.
- `financial_accounts (scope_key, code)` unique.
- `reconciliation_items (reconciliation_id, financial_account_id)` unique.

---

## 5. Payouts

```mermaid
erDiagram
    equb_cycles ||--|| payout_schedules : "one"
    payout_schedules ||--o{ payout_schedule_items : orders
    equb_memberships ||--o{ payout_schedule_items : "scheduled as"
    payout_schedule_items ||--o| payouts : "becomes"
    payouts ||--o{ payout_approvals : "decisions"
    payouts ||--o{ payout_disbursements : "disbursements"
    payouts ||--o| receipts : "payout receipt"

    payout_schedules {
        bigint id PK
        bigint equb_cycle_id FK
        string method
        string status
        timestamp activated_at
        timestamp locked_at
    }

    payout_schedule_items {
        bigint id PK
        bigint payout_schedule_id FK
        bigint equb_membership_id FK
        smallint position
        date scheduled_on
        string status
        string selection_method
        json selection_evidence
    }

    payouts {
        bigint id PK
        bigint payout_schedule_item_id FK
        bigint equb_cycle_id FK
        bigint equb_membership_id FK
        string status
        decimal gross_amount
        decimal deductions_amount
        decimal net_amount
        json calculation_snapshot
        bigint requested_by FK
        bigint approved_by FK
        timestamp disbursed_at
        timestamp completed_at
    }

    payout_approvals {
        bigint id PK
        bigint payout_id FK
        string decision
        bigint approver_user_id FK
        timestamp decided_at
        string comments
    }

    payout_disbursements {
        bigint id PK
        bigint payout_id FK
        decimal amount
        string method
        string reference
        bigint disbursed_by FK
        timestamp recorded_at
        tinyint is_reversal
    }
```

**Key constraints**

- `payout_schedules.equb_cycle_id` unique (one schedule per cycle).
- `payout_schedule_items (payout_schedule_id, position)` unique.
- `payout_schedule_items (payout_schedule_id, equb_membership_id)` unique — one payout per member per cycle by default.
- `payouts.payout_schedule_item_id` unique.
- `payouts.net_amount = gross_amount - deductions_amount`.
- One non-reversal disbursement per payout (generated key or service + status).
- `completed_at` only set after a non-reversal disbursement exists.

**State machine (payout)**

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> pending_approval: request
    pending_approval --> approved: approve
    pending_approval --> rejected: reject
    approved --> disbursement_pending: prepare
    disbursement_pending --> disbursed: disburse
    disbursed --> completed: finalize + receipt
    approved --> cancelled: cancel
    disbursed --> reversed: reverse
    completed --> reversed: reverse
    rejected --> draft: revise
```

> BLUE is set only at `disbursed`/`completed`, never at `approved`.

---

## 6. Penalties, exits, refunds, complaints

```mermaid
erDiagram
    equb_memberships ||--o{ penalties : incurs
    contribution_obligations ||--o{ penalties : "late against"
    penalties ||--o{ penalty_waivers : waived
    contribution_obligations ||--o{ payment_extensions : extended
    equb_memberships ||--o{ withdrawal_requests : requests
    withdrawal_requests ||--o| refunds : produces
    refunds ||--o| receipts : "refund receipt"
    equb_memberships ||--o{ complaints : raises
    equb_group_rules ||--o{ penalties : "policy basis"

    penalties {
        bigint id PK
        bigint equb_group_id FK
        bigint equb_membership_id FK
        bigint contribution_obligation_id FK
        string penalty_type
        string assessment_key UK
        decimal amount
        string status
        json calculation_snapshot
        decimal waived_amount
    }

    penalty_waivers {
        bigint id PK
        bigint penalty_id FK
        decimal amount
        string status
        bigint requested_by FK
        bigint reviewed_by FK
    }

    payment_extensions {
        bigint id PK
        bigint contribution_obligation_id FK
        date extend_until
        string status
        bigint reviewed_by FK
    }

    withdrawal_requests {
        bigint id PK
        bigint equb_membership_id FK
        date effective_date
        string status
        bigint reviewed_by FK
        bigint refund_id FK
    }

    refunds {
        bigint id PK
        bigint equb_group_id FK
        bigint equb_membership_id FK
        bigint withdrawal_request_id FK
        decimal amount
        json calculation_snapshot
        string status
        bigint approved_by FK
        bigint disbursed_by FK
        bigint journal_entry_id FK
    }

    complaints {
        bigint id PK
        bigint equb_group_id FK
        bigint equb_membership_id FK
        bigint raised_by FK
        string subject
        string status
        bigint assigned_to FK
    }
```

**Key constraints**

- `penalties.assessment_key` unique (idempotent scheduler).
- Waivers cannot exceed the penalty remaining amount (service invariant).
- `refunds.withdrawal_request_id` unique (one refund per withdrawal case).
- Refunds cannot be disbursed without approval and a ledger posting.

---

## 7. Communication, settings, audit

```mermaid
erDiagram
    users ||--o{ notifications : receives
    users ||--o{ notification_preferences : configures
    users ||--o{ announcement_reads : reads
    announcements ||--o{ announcement_reads : tracked
    notification_templates ||--o{ communication_logs : "renders"
    users ||--o{ audit_logs : acts
    equb_groups ||--o{ audit_logs : scopes
    users ||--o{ attachments : uploads
    users ||--o{ app_settings : updates

    notifications {
        char id PK
        string type
        string notifiable_type
        bigint notifiable_id
        json data
        timestamp read_at
    }

    notification_preferences {
        bigint id PK
        bigint user_id FK
        string notification_type
        string channel
        tinyint enabled
    }

    notification_templates {
        bigint id PK
        string template_key
        string channel
        string locale
        string subject
        text body
    }

    communication_logs {
        bigint id PK
        string channel
        string recipient
        bigint notification_template_id FK
        string status
        string provider_message_id
        text error
    }

    announcements {
        bigint id PK
        bigint equb_group_id FK
        string title
        text body
        string audience
        timestamp published_at
    }

    announcement_reads {
        bigint id PK
        bigint announcement_id FK
        bigint user_id FK
        timestamp read_at
    }

    audit_logs {
        bigint id PK
        bigint user_id FK
        bigint equb_group_id FK
        string event
        string auditable_type
        bigint auditable_id
        json before
        json after
        string transaction_reference
        timestamp created_at
    }

    app_settings {
        bigint id PK
        string key UK
        text value
        string value_type
        string category
        tinyint is_public
    }

    attachments {
        bigint id PK
        string disk
        string path UK
        string original_name
        string mime_type
        bigint size_bytes
        char checksum_sha256
        string category
        string attachable_type
        bigint attachable_id
    }

    number_sequences {
        bigint id PK
        string sequence_key
        string scope
        string period
        bigint current_value
    }
```

**Key constraints**

- `notification_preferences (user_id, notification_type, channel)` unique.
- `notification_templates (template_key, channel, locale)` unique.
- `announcement_reads (announcement_id, user_id)` unique.
- `app_settings.key` unique.
- `number_sequences (sequence_key, scope, period)` unique.
- `attachments.path` unique; `checksum_sha256` indexed.

---

## 8. Full relationship index

| Parent                     | Child                        | Cardinality         | FK action           |
| -------------------------- | ---------------------------- | ------------------- | ------------------- |
| `users`                    | `member_profiles`            | 1 : 0..1            | RESTRICT            |
| `users`                    | `equb_group_user`            | 1 : n               | CASCADE             |
| `users`                    | `audit_logs`                 | 1 : n               | SET NULL / RESTRICT |
| `member_profiles`          | `member_identifications`     | 1 : n               | RESTRICT            |
| `member_profiles`          | `member_verifications`       | 1 : n               | RESTRICT            |
| `member_profiles`          | `member_payout_accounts`     | 1 : n               | RESTRICT            |
| `member_profiles`          | `equb_memberships`           | 1 : n               | RESTRICT            |
| `member_profiles`          | `payments`                   | 1 : n               | RESTRICT            |
| `member_profiles`          | `receipts`                   | 1 : n               | RESTRICT            |
| `member_profiles`          | `journal_entry_lines`        | 1 : n               | RESTRICT            |
| `equb_groups`              | `equb_group_user`            | 1 : n               | CASCADE             |
| `equb_groups`              | `equb_group_rules`           | 1 : n               | RESTRICT            |
| `equb_groups`              | `equb_group_agreements`      | 1 : n               | RESTRICT            |
| `equb_groups`              | `equb_memberships`           | 1 : n               | RESTRICT            |
| `equb_groups`              | `membership_requests`        | 1 : n               | RESTRICT            |
| `equb_groups`              | `equb_cycles`                | 1 : n               | RESTRICT            |
| `equb_groups`              | `financial_accounts`         | 1 : n               | RESTRICT            |
| `equb_groups`              | `payments`                   | 1 : n               | RESTRICT            |
| `equb_groups`              | `payout_schedules`           | 1 : n (via cycles)  | RESTRICT            |
| `equb_groups`              | `penalties`                  | 1 : n               | RESTRICT            |
| `equb_groups`              | `refunds`                    | 1 : n               | RESTRICT            |
| `equb_groups`              | `complaints`                 | 1 : n               | RESTRICT            |
| `equb_groups`              | `audit_logs`                 | 1 : n               | RESTRICT/SET NULL   |
| `equb_group_rules`         | `equb_cycles`                | 1 : n               | RESTRICT            |
| `equb_group_rules`         | `equb_group_agreements`      | 1 : n               | RESTRICT            |
| `equb_group_agreements`    | `equb_agreement_acceptances` | 1 : n               | RESTRICT            |
| `equb_memberships`         | `equb_agreement_acceptances` | 1 : n               | RESTRICT            |
| `equb_memberships`         | `deposit_obligations`        | 1 : n               | RESTRICT            |
| `equb_memberships`         | `contribution_obligations`   | 1 : n               | RESTRICT            |
| `equb_memberships`         | `payments`                   | 1 : n               | RESTRICT            |
| `equb_memberships`         | `payout_schedule_items`      | 1 : n               | RESTRICT            |
| `equb_memberships`         | `payouts`                    | 1 : n               | RESTRICT            |
| `equb_memberships`         | `penalties`                  | 1 : n               | RESTRICT            |
| `equb_memberships`         | `withdrawal_requests`        | 1 : n               | RESTRICT            |
| `equb_memberships`         | `refunds`                    | 1 : n               | RESTRICT            |
| `equb_memberships`         | `complaints`                 | 1 : n               | RESTRICT            |
| `equb_cycles`              | `contribution_periods`       | 1 : n               | RESTRICT            |
| `equb_cycles`              | `deposit_rounds`             | 1 : n               | RESTRICT            |
| `equb_cycles`              | `payments`                   | 1 : n               | RESTRICT            |
| `equb_cycles`              | `payout_schedules`           | 1 : 1               | RESTRICT            |
| `equb_cycles`              | `payouts`                    | 1 : n               | RESTRICT            |
| `equb_cycles`              | `financial_adjustments`      | 1 : n               | RESTRICT            |
| `equb_cycles`              | `reconciliations`            | 1 : n               | RESTRICT            |
| `contribution_periods`     | `contribution_obligations`   | 1 : n               | RESTRICT            |
| `deposit_rounds`           | `deposit_obligations`        | 1 : n               | RESTRICT            |
| `contribution_obligations` | `payment_allocations`        | 1 : n               | RESTRICT            |
| `deposit_obligations`      | `payment_allocations`        | 1 : n               | RESTRICT            |
| `penalties`                | `payment_allocations`        | 1 : n               | RESTRICT            |
| `penalties`                | `penalty_waivers`            | 1 : n               | RESTRICT            |
| `contribution_obligations` | `payment_extensions`         | 1 : n               | RESTRICT            |
| `payments`                 | `payment_allocations`        | 1 : n               | RESTRICT            |
| `payments`                 | `payment_verifications`      | 1 : 0..1            | RESTRICT            |
| `payments`                 | `receipts`                   | 1 : 0..1            | RESTRICT            |
| `payments`                 | `journal_entries`            | 1 : n (source)      | RESTRICT            |
| `payout_schedules`         | `payout_schedule_items`      | 1 : n               | RESTRICT            |
| `payout_schedule_items`    | `payouts`                    | 1 : 0..1            | RESTRICT            |
| `payouts`                  | `payout_approvals`           | 1 : n               | RESTRICT            |
| `payouts`                  | `payout_disbursements`       | 1 : n               | RESTRICT            |
| `payouts`                  | `receipts`                   | 1 : 0..1            | RESTRICT            |
| `payouts`                  | `journal_entries`            | 1 : n (source)      | RESTRICT            |
| `refunds`                  | `receipts`                   | 1 : 0..1            | RESTRICT            |
| `refunds`                  | `journal_entries`            | 1 : n (source)      | RESTRICT            |
| `financial_accounts`       | `journal_entry_lines`        | 1 : n               | RESTRICT            |
| `journal_entries`          | `journal_entry_lines`        | 1 : n               | RESTRICT            |
| `journal_entries`          | `journal_entries`            | 1 : 0..1 (reversal) | RESTRICT            |
| `financial_adjustments`    | `journal_entries`            | 1 : 0..1            | RESTRICT            |
| `reconciliations`          | `reconciliation_items`       | 1 : n               | RESTRICT            |
| `financial_accounts`       | `reconciliation_items`       | 1 : n               | RESTRICT            |
| `withdrawal_requests`      | `refunds`                    | 1 : 0..1            | RESTRICT            |
| `announcements`            | `announcement_reads`         | 1 : n               | CASCADE             |
| `users`                    | `notifications`              | 1 : n               | CASCADE             |
| `notification_templates`   | `communication_logs`         | 1 : n               | SET NULL            |

---

## 9. Cardinality rules that matter financially

1. **One membership per member per group.** Rejoining reactivates the same membership row so obligations and history remain continuous.
2. **One deposit obligation per membership per round.** Idempotent generation cannot duplicate dues.
3. **One contribution obligation per membership per period.** Same reason.
4. **One payout schedule per cycle.**
5. **One schedule item per membership per cycle (default).** Enforced by a unique key, not just service logic.
6. **One payout case per schedule item.**
7. **One terminal verification per payment.** Corrections create new payment records plus ledger adjustments.
8. **One receipt per financial source.** Receipts are never renumbered.
9. **One active rule version per group.** Enforced by the `active_flag` unique trick.
10. **One refund per withdrawal case.**
11. **One penalty per assessment key.** Prevents scheduler duplication.
12. **One ledger posting per `posting_key`.** Prevents double posting on retry.

---

## 10. Derived read models

```mermaid
flowchart LR
    DO[deposit_obligations] --> V1[v_obligation_balances]
    CO[contribution_obligations] --> V1
    PA[payment_allocations] --> V1
    P[payments verified] --> V1
    V1 --> S[MemberStatusService]
    PY[payouts completed] --> S
    CP[contribution_periods current] --> S
    S --> D[Group dashboard<br/>GREEN / RED / BLUE + overdue]
    M[equb_memberships] --> V2[v_membership_cycle_financials]
    V2 --> D
    JE[journal_entry_lines] --> V3[v_group_financial_summary]
    PY --> V3
    V3 --> D
```

No persisted color, obligation balance, or available-funds column exists. Any materialized cache must be rebuildable and invalidated by the events listed in `SYSTEM_ARCHITECTURE.md` §8.

---

## 11. ERD verification checklist

- [ ] Every financial FK is `RESTRICT` (no cascade toward money).
- [ ] Every money column is `DECIMAL(15,2)` with an explicit currency.
- [ ] Every financial state change has an allowed-transition map in a PHP enum.
- [ ] Every duplicate-sensitive operation has a unique key, not just a service check.
- [ ] Every posted journal entry is balanced and immutable.
- [ ] Every completed payout has a disbursement row.
- [ ] Every verified payment has a verification row.
- [ ] Every rule version used by a cycle is snapshotted.
- [ ] Every group-scoped query can join to `equb_group_id` without ambiguity.
- [ ] No table stores a member color or a mutable "paid" boolean.
