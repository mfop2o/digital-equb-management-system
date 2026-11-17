# BUSINESS RULES - Digital Equb Management System

> **Authority:** This document is the single, authoritative register of business rules that have been **confirmed by the business owner**. It is subordinate to nothing except a later written confirmation from the business owner. Where this document and an older statement elsewhere disagree, this document wins.
>
> **Last confirmed:** 2026-11-13
>
> **Status vocabulary**
>
> | Status      | Meaning                                                                                               |
> | ----------- | ----------------------------------------------------------------------------------------------------- |
> | `CONFIRMED` | Stated by the business owner. Must be implemented as written.                                         |
> | `PENDING`   | Not decided. The system must keep the behavior configurable/blocked and must **not** assume a policy. |
> | `DERIVED`   | Engineering consequence of a confirmed rule; not a new business policy.                               |
>
> **Hard rule:** No engineer, admin, or UI action may silently override a `CONFIRMED` rule or invent an answer to a `PENDING` decision.

---

## 1. How to use this document

1. Every financial module must cite the rule IDs it implements in its service, tests, and PR description.
2. A `PENDING` decision listed in §4 is a **gate**. Reaching the gate without a business answer stops the affected feature; everything else in the phase proceeds.
3. Rule text here is normative. Workflow diagrams, table comments, and UI copy must be updated to match this document, not the other way round.
4. Any change to this document requires a dated business-owner confirmation and an audit note in `IMPLEMENTATION_ROADMAP.md`.

### Related documents

| Document                    | Relationship                                                          |
| --------------------------- | --------------------------------------------------------------------- |
| `REQUIREMENTS.md`           | Functional requirement IDs and the open-decision register (§10).      |
| `BUSINESS_WORKFLOWS.md`     | Step-by-step operational flows for rules E–I.                         |
| `DATABASE_DESIGN.md`        | Tables, constraints, and invariants that enforce these rules.         |
| `DATABASE_ERD.md`           | Relationship and cardinality model.                                   |
| `SYSTEM_ARCHITECTURE.md`    | Services, transactions, events, and audit that implement these rules. |
| `IMPLEMENTATION_ROADMAP.md` | Phase in which each rule is built and its decision gate.              |

---

## 2. Rule groups at a glance

| Group                 | Prefix      | Confirmed rules | Built in phase |
| --------------------- | ----------- | --------------- | -------------- |
| Initial deposit stage | `BR-DEP-*`  | 8               | 4              |
| Regular contributions | `BR-CON-*`  | 6               | 5              |
| Lottery / draw        | `BR-LOT-*`  | 9               | 6              |
| Payout                | `BR-PAY-*`  | 7               | 6              |
| Member status         | `BR-STAT-*` | 7               | 5, 6           |
| Financial safety      | `BR-FIN-*`  | 9               | 4–7            |

---

## 3. Confirmed business rules

### 3.1 Initial deposit stage (`BR-DEP`)

| ID          | Confirmed rule                                                                                                                | Implementation implication                                                                                                                                          | Verified by                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `BR-DEP-01` | Each Equb group has a **configurable** number of initial deposit rounds.                                                      | `equb_group_rules.deposit_rounds_count` (0..n); generator creates exactly that many `deposit_rounds`. No hard-coded "three rounds".                                 | Round-count test for 0, 1, 3, 5.                |
| `BR-DEP-02` | Every **active** member must satisfy the required deposit obligations for the group's deposit stage.                          | Obligations generated per active membership per round; stage completion requires all required obligations verified (or explicitly waived under a confirmed policy). | Stage-completion gate test.                     |
| `BR-DEP-03` | Initial deposits are **accumulated and retained** by the group/cycle; they are not consumed by the deposit rounds themselves. | Deposit balance is cumulative and persistent. Retention is a liability/fund balance until a pending policy says otherwise (see §4).                                 | Deposit balance continuity across rounds.       |
| `BR-DEP-04` | Initial deposits are **separate from regular contributions** and **separate from payout funds**.                              | Distinct obligation tables, distinct payment allocations, distinct chart-of-accounts codes (`2010` deposits vs `2000` contributions).                               | No commingling query; separate ledger balances. |
| `BR-DEP-05` | The initial deposit stage must be **completed before normal payout operations begin**.                                        | Cycle status gate: `deposit_stage` → `ready` requires stage approval; payout/lottery services reject a cycle that has not passed the gate.                          | Payout blocked before stage approval.           |
| `BR-DEP-06` | Only **verified** deposit payments count toward deposit obligations.                                                          | Verified-payment join only; submitted/pending/rejected amounts excluded from totals.                                                                                | Pending deposit does not complete obligation.   |
| `BR-DEP-07` | Deposit obligations are **snapshotted** per round/member and cannot be rewritten by later rule changes.                       | `deposit_obligations.amount_due`/`due_on` snapshot; unique `(round, membership)`.                                                                                   | Rule-change-after-generation test.              |
| `BR-DEP-08` | Deposit stage progress and completion are **auditable** and require an authorized approval step.                              | `deposit_stage_closed_on`, approving actor, audit event `DepositStageApproved`.                                                                                     | Audit record + permission test.                 |

**Explicitly not decided (do not implement):** refundability, ownership/control, use for penalties/expenses, treatment on withdrawal. See §4.

### 3.2 Regular contributions (`BR-CON`)

| ID          | Confirmed rule                                                                                                           | Implementation implication                                                                            | Verified by                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `BR-CON-01` | Members continue making **regular contributions after** the deposit stage.                                               | Contribution periods begin only after the deposit stage gate; obligations are separate from deposits. | Period generation blocked before gate. |
| `BR-CON-02` | Contributions are **generated for every active member in every regular round** (contribution period).                    | Generator creates one obligation per active membership per period; unique `(period, membership)`.     | Obligation count test.                 |
| `BR-CON-03` | Only **verified payments** count as a completed contribution.                                                            | Verified-only allocation sums; pending/submitted never satisfies an obligation.                       | Pending ≠ GREEN / ≠ collected.         |
| `BR-CON-04` | A member who has received a payout **continues contributing** for the remaining periods, per the group rules.            | Payout completion does not cancel future obligations.                                                 | Post-payout obligation test.           |
| `BR-CON-05` | Contribution amounts and due dates are **snapshotted** per period and are not changed by later rule versions.            | `amount_due_snapshot`, `due_on`, `grace_days_snapshot`; obligations copy the snapshot.                | Historical immutability test.          |
| `BR-CON-06` | Overdue contributions are **derived** from unpaid balance and due date + grace; they are never stored as a color/status. | Read-time calculation; `isOverdue` is a separate flag.                                                | Overdue derivation test.               |

**Pending:** partial contribution policy and penalty calculation (§4).

### 3.3 Lottery / winner selection (`BR-LOT`)

| ID          | Confirmed rule                                                                                                   | Implementation implication                                                                                                                                               | Verified by                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `BR-LOT-01` | A **separate lottery** occurs for **each payout round**.                                                         | One `lottery_draws` row per payout round; each draw belongs to exactly one cycle round and one payout round.                                                             | Draw-per-round uniqueness test.                |
| `BR-LOT-02` | A member can receive **only one payout per cycle**.                                                              | DB uniqueness on membership per cycle plus service check; previous winners excluded from later draws.                                                                    | Duplicate-winner test (DB + concurrency).      |
| `BR-LOT-03` | **Previous winners are excluded** from subsequent lotteries in the same cycle.                                   | Participant snapshot excludes memberships with a payout in the cycle; exclusion reason recorded.                                                                         | Previous-winner exclusion test.                |
| `BR-LOT-04` | Members with **overdue contributions** are excluded from the lottery.                                            | Eligibility check uses derived overdue flag at draw time; excluded participants recorded with reason.                                                                    | Overdue exclusion test.                        |
| `BR-LOT-05` | A member must have their **current required contribution verified** before receiving a payout.                   | Eligibility gate: current period obligation fully covered by verified payments.                                                                                          | "Verified current contribution required" test. |
| `BR-LOT-06` | The system must **record lottery participants, the selected winner, date, time, round, and audit information**.  | Immutable `lottery_draws` + `lottery_draw_participants` with timestamps, actor, cycle/round, method, and evidence.                                                       | Draw record completeness test.                 |
| `BR-LOT-07` | Lottery results **must not be silently changed or replaced**.                                                    | Draws and participant rows are append-only; corrections are a new audited draw with a documented reason (and, if a winner was already paid, a payout reversal workflow). | Immutability + audit test.                     |
| `BR-LOT-08` | The **selected winner must pass eligibility checks** again before payout.                                        | `PayoutEligibilityService` re-checks membership, cycle, duplicate payout, overdue, current contribution at payout request and again at disbursement.                     | Winner-ineligible-at-payout test.              |
| `BR-LOT-09` | The lottery is **server-side** and its selection evidence is auditable; it is never a client-side random choice. | `LotteryService` uses a CSPRNG, persists method/seed/evidence, and logs the draw.                                                                                        | Server-side selection + audit test.            |

**Pending:** exact algorithm and witnessing procedure, and handling a winner who becomes ineligible before payout (§4). Until confirmed, the implementation uses the safe default in §4 and never retroactively edits a draw.

### 3.4 Payout (`BR-PAY`)

| ID          | Confirmed rule                                                                                  | Implementation implication                                                                                                                             | Verified by                      |
| ----------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| `BR-PAY-01` | Selected winners must **pass eligibility checks** before a payout is created.                   | Payout request validates draw winner, active membership, no prior payout, no overdue, verified current contribution.                                   | Request-eligibility test.        |
| `BR-PAY-02` | **Approval and actual disbursement must be separate** steps and distinct states.                | State machine `pending_approval` → `approved` → `disbursed` → `completed`; approval never records money movement.                                      | Approval-only test.              |
| `BR-PAY-03` | A payout becomes **PAID only after actual disbursement is recorded**.                           | `payout_disbursements` row (method, reference, date, evidence, actor) is required before `disbursed`/`completed`.                                      | No disbursement ⇒ not PAID/BLUE. |
| `BR-PAY-04` | **Every member must receive exactly one payout during a completed cycle.**                      | Cycle closure requires payout coverage = active memberships; one completed payout per membership; exceptions need a confirmed incomplete-cycle policy. | Cycle-closure coverage test.     |
| `BR-PAY-05` | Payout and deposit funds are **never mixed**; a payout cannot be funded from retained deposits. | `AvailableFundsService` uses the contribution/payout fund account only; deposits account excluded.                                                     | Funds-isolation test.            |
| `BR-PAY-06` | Payout amounts are **snapshotted and reproducible**; no silent deduction.                       | `calculation_snapshot`; deductions only from configured items; net ≥ 0.                                                                                | Formula snapshot test.           |
| `BR-PAY-07` | Payout history is **immutable**; failures/reversals create linked records and ledger reversals. | Append-only disbursements/approvals; reversal rows; audit trail.                                                                                       | Reversal-preserves-history test. |

**Pending:** approval hierarchy, incomplete-cycle handling, composition/deductions, and payout-before-full-collection (§4).

### 3.5 Member dashboard status (`BR-STAT`)

| ID           | Confirmed rule                                                                                       | Implementation implication                                                         | Verified by                       |
| ------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------- |
| `BR-STAT-01` | **BLUE** = the member has already received a payout in the **current cycle**.                        | BLUE iff a `disbursed`/`completed` payout exists for this membership and cycle.    | BLUE on disbursement test.        |
| `BR-STAT-02` | **GREEN** = current contribution is **fully verified** and the member has **not** received a payout. | Verified obligation total ≥ amount due; no completed payout.                       | GREEN test.                       |
| `BR-STAT-03` | **RED** = current contribution is **unpaid or not fully verified**.                                  | Includes unpaid, partial, pending, and rejected-only coverage.                     | RED on pending/partial test.      |
| `BR-STAT-04` | **BLUE has priority over GREEN and RED.**                                                            | Evaluation order: BLUE → GREEN → RED.                                              | BLUE + unpaid-contribution test.  |
| `BR-STAT-05` | **Overdue warnings are shown separately** from the primary color.                                    | `isOverdue` is a secondary flag; BLUE can also be overdue.                         | BLUE + overdue test.              |
| `BR-STAT-06` | Statuses are **derived from financial records**, never manually edited or stored as a color.         | `MemberStatusService` read-time computation; no `color` column; no admin override. | No-color-column + recompute test. |
| `BR-STAT-07` | A payout that is only **approved** does not produce BLUE.                                            | Only `disbursed`/`completed` produces BLUE.                                        | Approval-only status test.        |

### 3.6 Financial safety (`BR-FIN`)

| ID          | Confirmed rule                                                                            | Implementation implication                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `BR-FIN-01` | **Never mix** initial deposit funds with payout/contribution funds.                       | Separate obligation types, allocations, ledger accounts, and available-funds calculations.                                   |
| `BR-FIN-02` | **Never invent** refund, forfeiture, penalty, or distribution rules.                      | Any such behavior stays disabled/configurable until §4 is answered.                                                          |
| `BR-FIN-03` | **Never allow duplicate payouts** for the same member in a cycle.                         | Unique constraints + transactional service checks + concurrency tests.                                                       |
| `BR-FIN-04` | **Never treat an approved payout as a completed disbursement.**                           | Distinct states; completion requires a disbursement row.                                                                     |
| `BR-FIN-05` | **Preserve financial transaction history.**                                               | No hard deletes or silent updates of financial rows.                                                                         |
| `BR-FIN-06` | Use **auditable reversals and adjustments** for corrections.                              | Append-only reversal records linked to originals; balanced ledger reversal.                                                  |
| `BR-FIN-07` | Use **database transactions** for critical financial operations.                          | One transaction per state change; `lockForUpdate` on affected rows; rollback on any failure.                                 |
| `BR-FIN-08` | **Enforce authorization on all financial operations.**                                    | Policies/permissions on deposit stage approval, payment verification, lottery draw, payout request/approve/disburse/reverse. |
| `BR-FIN-09` | **Only verified payments** count in verified totals; unverified money is never spendable. | Verified-only joins in balances, available funds, status, and reports.                                                       |

---

## 4. Pending business decisions (hard gates)

These are **not** rules. They must not be implemented by assumption. The "safe behavior until confirmed" column describes what the system does today/will do by default; it is not a business policy.

| ID      | Pending decision                                           | Safe behavior until confirmed                                                                                             | Gate      | Related         |
| ------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------- | --------------- |
| `PD-01` | Are retained initial deposits **refundable**?              | Deposits are retained and reported as a separate balance; **no refund is calculated or paid**.                            | Phase 4/7 | D-01, D-08      |
| `PD-02` | Who **owns/controls** retained deposits?                   | Modeled as a group-held fund with no distribution logic; ownership label stays neutral.                                   | Phase 4/6 | D-01, D-09      |
| `PD-03` | Can deposits be used for **penalties or other expenses**?  | No. Deposit funds are never debited for penalties/expenses.                                                               | Phase 4/7 | D-01, D-07      |
| `PD-04` | How are deposits treated when a member **withdraws**?      | Withdrawal can be requested/reviewed, but no deposit refund/forfeiture is processed.                                      | Phase 7   | D-08            |
| `PD-05` | Exact **lottery algorithm and witnessing procedure**       | Server-side CSPRNG with recorded evidence and audit; method stays configurable. No client-side or unverifiable selection. | Phase 6   | D-06, BR-LOT-09 |
| `PD-06` | **Partial contribution** policy                            | Partial payments are not accepted unless a group rule explicitly enables them; no implicit part-payment completion.       | Phase 5   | D-05            |
| `PD-07` | **Penalty calculation** method, grace, caps                | Penalties disabled (`none`) until configured; overdue is still shown.                                                     | Phase 7   | D-07            |
| `PD-08` | Handling a **winner who becomes ineligible before payout** | Payout is blocked; the draw is not silently edited; resolution requires an authorized, audited decision.                  | Phase 6   | BR-LOT-07/08    |
| `PD-09` | **Approval hierarchy** (who may approve what)              | Maker-checker on by default: requester ≠ approver; approver ≠ disburser where configured.                                 | Phase 6   | D-12            |
| `PD-10` | **Incomplete cycle** handling                              | Cycle cannot be marked complete while payout coverage is incomplete; closure is blocked, not auto-forgiven.               | Phase 6/7 | BR-PAY-04       |

> `PD-06`, `PD-07`, `PD-09`, `PD-10` intentionally overlap with existing `D-05`, `D-07`, `D-12`; the `D-*` register in `REQUIREMENTS.md` remains the canonical open-decision list, and this table states the concrete safe behavior for the newly confirmed rule set.

---

## 5. Rule-to-workflow map

| Rule group  | Workflow section(s)                                                           |
| ----------- | ----------------------------------------------------------------------------- |
| `BR-DEP-*`  | `BUSINESS_WORKFLOWS.md` Workflow E — initial deposit rounds and verification. |
| `BR-CON-*`  | Workflow F — contribution periods and payment verification.                   |
| `BR-LOT-*`  | Workflow H — lottery, payout scheduling, approval, and disbursement.          |
| `BR-PAY-*`  | Workflow H — payout lifecycle and duplicate prevention.                       |
| `BR-STAT-*` | Workflow G — automatic member status classification.                          |
| `BR-FIN-*`  | Workflows E–I, `DATABASE_DESIGN.md` §18–19, `SYSTEM_ARCHITECTURE.md` §5.      |

---

## 6. Open questions that are _not_ business rules

Engineering choices already decided (money as `DECIMAL(15,2)` + integer santim value object, UTC storage with `Africa/Addis_Ababa` display, ETB currency, centralized models, modular monolith, no Spatie teams) are architectural decisions recorded in `SYSTEM_ARCHITECTURE.md` §18. They are not business policies and do not need business-owner sign-off, but they must not be changed silently either.

---

## 7. Change log

| Date       | Change                                                                                   | Confirmed by   |
| ---------- | ---------------------------------------------------------------------------------------- | -------------- |
| 2026-11-13 | Initial confirmed rule register created from the 2026-11-13 business-owner confirmation. | Business owner |
