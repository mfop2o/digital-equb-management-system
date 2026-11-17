# REQUIREMENTS — Digital Equb Management System

> **Status:** Phase 1 deliverable. Requirements baseline for confirmation.
> **Companion documents:** `PROJECT_ANALYSIS.md`, `SYSTEM_ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `DATABASE_ERD.md`, `BUSINESS_WORKFLOWS.md`, `IMPLEMENTATION_ROADMAP.md`.

---

## 1. Purpose and scope

The system digitizes the complete lifecycle of Ethiopian Equb groups:

- group creation and rule configuration;
- member registration and enrollment;
- initial deposit rounds;
- recurring contributions and payment verification;
- automatic member status classification (GREEN / RED / BLUE plus overdue warning);
- payout scheduling, rotation, approval, and disbursement;
- financial ledger, penalties, refunds, and reconciliation;
- notifications, reporting, audit, and system administration.

### 1.1 In scope

- Multi-group operation inside **one organization**.
- Multiple Equb groups, each with independent rules, members, cycles, deposits, contributions, payouts, and financial records.
- Six operational roles with granular permissions and group-scoped authority.
- Manual payment evidence verification (cash, bank transfer, mobile money, cheque).
- Double-entry financial ledger with traceable adjustments.
- In-app notifications; extensible email/SMS adapters.
- PDF and Excel/CSV reporting.
- Audit trail for privileged and financial actions.

### 1.2 Out of scope (initial release)

- Multi-tenant SaaS (multiple independent organizations on one installation).
- Direct payment-gateway capture or automatic bank reconciliation.
- Native mobile applications.
- Loan/credit products, interest, or investment management.
- Tax filing or statutory accounting packages.
- Public marketplace or open self-service group discovery.
- Automated SMS/email delivery until a provider is selected and configured.

> Multi-tenant support can be added later behind an organization scoping layer, but it must not be retrofitted casually into financial keys. The initial design assumes one organization.

---

## 2. Actors

| Actor                             | Description                           | Typical access                                                                      |
| --------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| **Super Administrator**           | System owner/technical administrator. | Full system, all groups, roles/permissions, settings, audit.                        |
| **Administrator**                 | Operational manager.                  | Assigned groups; oversight, approvals, reports; limited user management.            |
| **Equb Organizer**                | Creates and runs groups.              | Group configuration, memberships, deposit rounds, schedules. Cannot disburse funds. |
| **Treasurer / Financial Officer** | Handles money operations.             | Record/verify payments, prepare payouts, record disbursements, financial reports.   |
| **Equb Member**                   | Participates in one or more groups.   | Own profile, groups, obligations, payment submissions, receipts, notifications.     |
| **Auditor / Supervisor**          | Independent reviewer.                 | Read-only financial records, audit logs, reports. No modifications.                 |

Supporting system actors:

- **Scheduler** — opens/closes periods, marks overdue obligations, sends reminders.
- **Queue worker** — notifications, exports, receipt generation, heavy reports.
- **System** — enforces invariants, posts ledger entries, writes audit records.

A person may hold multiple roles. A user may be staff in one group and a member in another **only if** the group rules and conflict-of-interest policy allow it (open decision D-13).

---

## 3. Glossary

| Term                      | Meaning                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Equb group**            | A savings/rotation circle with its own rules and members.                                                  |
| **Cycle**                 | One complete rotation lifecycle of a group, from deposit stage to closure.                                 |
| **Initial deposit round** | A pre-operation stage where each member contributes a configured amount. Groups may have 0..n rounds.      |
| **Contribution period**   | A recurring period (e.g., monthly) in which each active member owes the configured contribution.           |
| **Obligation**            | The amount a specific membership owes for a specific deposit round or contribution period.                 |
| **Payment**               | Money submitted by/for a member against an obligation, with evidence and a verification workflow.          |
| **Verified payment**      | A payment accepted by an authorized verifier. Only verified payments count financially.                    |
| **Payout**                | The distribution of group funds to the scheduled member.                                                   |
| **Payout schedule**       | The ordered list of recipients and dates for a cycle.                                                      |
| **Disbursement**          | The actual transfer/handover of payout money. Approval alone is not disbursement.                          |
| **GREEN**                 | Current contribution obligation fully verified; payout not yet received in the cycle.                      |
| **RED**                   | Current contribution obligation not fully verified; payout not yet received in the cycle.                  |
| **BLUE**                  | Payout completed in the current cycle (regardless of contribution status).                                 |
| **Overdue**               | A secondary flag: an obligation's deadline has passed and a balance remains. A BLUE member can be overdue. |
| **Ledger**                | Append-only double-entry record of financial postings.                                                     |
| **Reversal**              | A new, opposite posting that cancels a previous posting without deleting it.                               |

---

## 4. Functional requirements

Priority: **M** = mandatory for launch; **S** = should have; **C** = could have (later).

### 4.1 Authentication and user management (AUTH)

| ID      | Pri | Requirement                                          | Acceptance criteria                                                                           |
| ------- | --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| AUTH-01 | M   | Users log in with a unique identifier and password.  | Invalid credentials return a generic error; valid credentials create a session.               |
| AUTH-02 | M   | Users can log out.                                   | Session invalidated; protected pages redirect to login.                                       |
| AUTH-03 | M   | Password reset via verified email.                   | Token expires; password policy enforced; old sessions invalidated where possible.             |
| AUTH-04 | M   | Two-factor authentication is supported.              | Enroll, confirm, recover, disable (with password confirmation).                               |
| AUTH-05 | M   | Passkey authentication is supported.                 | Register, list, delete, and log in with a passkey.                                            |
| AUTH-06 | M   | Administrators can create users.                     | Unique email/identifier; role assignment; activation state.                                   |
| AUTH-07 | M   | Administrators can edit users.                       | Name, contact, roles, status; sensitive changes audited.                                      |
| AUTH-08 | M   | Administrators can activate/deactivate/lock users.   | Deactivated users cannot log in; existing sessions invalidated.                               |
| AUTH-09 | M   | Administrators can reset a user's password securely. | Temporary password or reset link; forced change on next login.                                |
| AUTH-10 | M   | Users can update their own profile.                  | Name/contact/photo; email change re-verifies; audit recorded.                                 |
| AUTH-11 | S   | Members can be invited to activate an account.       | Time-limited invitation; no public self-registration.                                         |
| AUTH-12 | S   | Login supports email **or** phone for members.       | Decision D-10; requires a unique normalized login identifier.                                 |
| AUTH-13 | S   | Account lockout after repeated failures.             | Configurable threshold/window; unlock by admin or time.                                       |
| AUTH-14 | S   | Active sessions can be reviewed and revoked.         | Session list with device/IP/time; revoke individually/all.                                    |
| AUTH-15 | M   | Self-service account deletion is disabled.           | Users are deactivated/anonymized through an authorized workflow; financial history preserved. |
| AUTH-16 | S   | Security events are audited.                         | Login success/failure, lockout, MFA change, password change, role change.                     |

### 4.2 Roles and permissions (RBAC)

| ID      | Pri | Requirement                                                                 | Acceptance criteria                                                        |
| ------- | --- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| RBAC-01 | M   | Six roles exist: super-admin, admin, organizer, treasurer, auditor, member. | Seeded idempotently; role names stable.                                    |
| RBAC-02 | M   | Granular permissions exist per module and action.                           | No authorization decision relies on role name alone.                       |
| RBAC-03 | M   | Role-permission assignment is configurable by super-admin.                  | Changes audited; permission cache invalidated.                             |
| RBAC-04 | M   | User-role assignment is configurable.                                       | Multiple roles allowed; changes audited.                                   |
| RBAC-05 | M   | Backend authorization is enforced by policies/gates.                        | Direct URL/request access is denied with 403 even if UI is hidden.         |
| RBAC-06 | M   | Group-scoped authority is enforced.                                         | Organizer/treasurer/auditor can access only assigned groups unless global. |
| RBAC-07 | M   | Financial approval permissions are separate from recording permissions.     | Maker-checker can be enforced per group/rule.                              |
| RBAC-08 | M   | Super-admin has a controlled override.                                      | `Gate::before` bypass is logged; super-admin accounts require MFA.         |
| RBAC-09 | M   | Permission-aware navigation and UI.                                         | Users see only permitted modules/actions; labels explain denied states.    |
| RBAC-10 | S   | Roles/permissions can be exported for review.                               | Matrix report for auditors.                                                |

### 4.3 Member management (MEM)

| ID     | Pri | Requirement                                    | Acceptance criteria                                                             |
| ------ | --- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| MEM-01 | M   | Register a member with a unique member number. | Generated atomically; immutable; searchable.                                    |
| MEM-02 | M   | Capture personal information.                  | Names, gender, date of birth, photo, notes.                                     |
| MEM-03 | M   | Capture contact information.                   | Phone unique/normalized; alternate phone; email optional.                       |
| MEM-04 | M   | Capture address.                               | Region, city, subcity, woreda, house number.                                    |
| MEM-05 | M   | Capture identification.                        | Type, number, issue date, document; encrypted at rest.                          |
| MEM-06 | M   | Verify member identity.                        | Verification record with reviewer, timestamp, document, decision.               |
| MEM-07 | M   | Manage member status.                          | Pending verification, active, suspended, inactive, blacklisted.                 |
| MEM-08 | M   | View member contribution history.              | Across groups, filtered by cycle/period/status; read-only.                      |
| MEM-09 | M   | View member payout history.                    | Scheduled, approved, disbursed, receipts.                                       |
| MEM-10 | M   | One central profile per person.                | A member may join multiple groups if rules allow (D-04).                        |
| MEM-11 | M   | Link a member profile to a user account.       | Optional: staff can manage members without login; account invitation later.     |
| MEM-12 | S   | Detect duplicate members.                      | Warn on same national ID/phone; require override reason with permission.        |
| MEM-13 | S   | Member portal.                                 | Members see only their own data; no access to other members' financial details. |
| MEM-14 | S   | Member payout account details.                 | Bank/mobile-money account, masked display, verification status.                 |

### 4.4 Equb group management (GRP)

| ID     | Pri | Requirement                                        | Acceptance criteria                                                           |
| ------ | --- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| GRP-01 | M   | Create a group.                                    | Name, unique group number, description, capacity, currency ETB.               |
| GRP-02 | M   | Edit group master data.                            | Changes audited; financial history immutable.                                 |
| GRP-03 | M   | Assign organizer(s).                               | Group-scoped assignment; only authorized users.                               |
| GRP-04 | M   | Assign treasurer(s).                               | Separation of duties enforced where configured.                               |
| GRP-05 | M   | Assign auditor/supervisor(s).                      | Read-only access.                                                             |
| GRP-06 | M   | Configure member capacity.                         | Cannot activate/enroll beyond capacity; exception requires authorization.     |
| GRP-07 | M   | Manage group lifecycle.                            | Draft → depositing → ready → active → paused/completed → closed/cancelled.    |
| GRP-08 | M   | Display group financial overview.                  | Total verified collections, payouts, available funds, outstanding, penalties. |
| GRP-09 | M   | Display group history/timeline.                    | Rule versions, status changes, approvals, cycle events.                       |
| GRP-10 | M   | Prevent deletion of groups with financial history. | Archive/close only; restrictive foreign keys.                                 |
| GRP-11 | S   | Group dashboard with member status grid.           | GREEN/RED/BLUE counts, labels, filters, overdue warnings.                     |
| GRP-12 | S   | Group announcements.                               | Publish to members; in-app; optional email/SMS.                               |

### 4.5 Equb rules and configuration (RULE)

| ID      | Pri | Requirement                                        | Acceptance criteria                                                    |
| ------- | --- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| RULE-01 | M   | Rules are configurable per group, never hardcoded. | All financial behavior reads from the active rule version.             |
| RULE-02 | M   | Rules are versioned.                               | Editing an active rule creates a new draft/version; history preserved. |
| RULE-03 | M   | Contribution amount and currency.                  | Positive decimal (ETB, 2 dp); snapshot into obligations.               |
| RULE-04 | M   | Contribution frequency.                            | Weekly, biweekly, monthly, quarterly, custom interval.                 |
| RULE-05 | M   | Contribution deadlines and grace period.           | Per-period due date logic; grace days configurable.                    |
| RULE-06 | M   | Number of members/capacity.                        | Positive integer; activation validates.                                |
| RULE-07 | M   | Initial deposit rounds.                            | 0..n; per-round amount and dates; not assumed to be 3.                 |
| RULE-08 | M   | Deposit deadlines.                                 | Opening, due, closing; validation `opens <= due <= closes`.            |
| RULE-09 | M   | Payout commencement configuration.                 | Mode and date; see D-02; no hardcoded condition.                       |
| RULE-10 | M   | Payout rotation method.                            | Predetermined, random, or manual; see D-06.                            |
| RULE-11 | M   | Payout amount composition.                         | Gross/deductions/net; see D-09.                                        |
| RULE-12 | M   | Penalty policy.                                    | None, fixed, percentage, daily; grace; cap; see D-07.                  |
| RULE-13 | M   | Partial contribution policy.                       | Allowed/not allowed; see D-05.                                         |
| RULE-14 | M   | Withdrawal policy and refund method.               | See D-08; no automatic confiscation.                                   |
| RULE-15 | M   | Group terms and agreements.                        | Versioned; members accept before activation.                           |
| RULE-16 | M   | Multiple-group participation policy.               | Org/group-level; see D-04.                                             |
| RULE-17 | M   | Deposit fund handling policy.                      | Undecided/included/separate/reserve; see D-01.                         |
| RULE-18 | M   | Activation validation.                             | Group cannot activate with incomplete or contradictory rules.          |

### 4.6 Membership and enrollment (ENR)

| ID     | Pri | Requirement                                  | Acceptance criteria                                                            |
| ------ | --- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| ENR-01 | M   | Add an existing member to a group.           | Capacity, duplicate membership, and eligibility checked.                       |
| ENR-02 | M   | Invite a member.                             | Invitation recorded; acceptance creates/activates membership.                  |
| ENR-03 | M   | Submit membership request.                   | Member or organizer; one open request per group/member.                        |
| ENR-04 | M   | Review membership request.                   | Approve/reject with reason; audit; notification.                               |
| ENR-05 | M   | Record agreement acceptance.                 | Agreement version, timestamp, IP/user-agent, evidence.                         |
| ENR-06 | M   | Set membership start date.                   | Cannot precede group activation; affects obligations.                          |
| ENR-07 | M   | Manage membership status.                    | Invited, requested, pending, active, suspended, withdrawn, removed, completed. |
| ENR-08 | M   | Request withdrawal.                          | Reason, effective date; approval required; refund per rules.                   |
| ENR-09 | M   | Remove/suspend member.                       | Authorized procedure; cannot erase financial history; notification.            |
| ENR-10 | M   | Enforce one membership per member per group. | Unique constraint + service validation.                                        |
| ENR-11 | S   | Transfer/replacement membership.             | Explicit workflow with balances and audit; later if required.                  |
| ENR-12 | S   | Waitlist when capacity is full.              | Ordered queue; promotion requires approval.                                    |

### 4.7 Initial deposit management (DEP)

| ID     | Pri | Requirement                                               | Acceptance criteria                                                       |
| ------ | --- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| DEP-01 | M   | Configure 0..n rounds per cycle.                          | Rule-driven; per-round amount/dates; unique round number.                 |
| DEP-02 | M   | Generate obligations for active memberships.              | One obligation per round/membership; idempotent; snapshot amount.         |
| DEP-03 | M   | Record submitted deposits.                                | Cash/bank/mobile/cheque; reference; evidence; submitter.                  |
| DEP-04 | M   | Verify/reject deposits.                                   | Authorized verifier; rejection reason; audit; notification.               |
| DEP-05 | M   | Track unpaid/partial deposits.                            | Balances derived from verified payments; overdue flagged.                 |
| DEP-06 | M   | Calculate accumulated deposits.                           | Per member and per round; derived from verified payments.                 |
| DEP-07 | M   | Close a deposit round.                                    | Only when authorized; unpaid obligations remain visible.                  |
| DEP-08 | M   | Open the next round.                                      | Sequential; cannot open before previous close unless configured.          |
| DEP-09 | M   | Approve completion of the deposit stage.                  | Authorized approval; conditions checked; audit.                           |
| DEP-10 | M   | Generate deposit reports.                                 | By round/member/status/date; export.                                      |
| DEP-11 | M   | Keep deposits distinguishable from contributions.         | Separate obligation/payment types and ledger accounts.                    |
| DEP-12 | M   | Prevent duplicate deposits.                               | Idempotency + unique reference where applicable.                          |
| DEP-13 | M   | Configure deposit fund treatment.                         | D-01; no silent distribution.                                             |
| DEP-14 | M   | Block normal payouts until the deposit stage is complete. | Cycle must pass the stage gate; payout/lottery services reject otherwise. |
| DEP-15 | M   | Retain and accumulate deposits separately.                | Deposit balances persist across rounds; never spent on payouts.           |

> Confirmed detail for this section lives in `BUSINESS_RULES.md` §3.1 (`BR-DEP-01`…`BR-DEP-08`). Refundability, ownership, use for penalties/expenses, and withdrawal treatment remain pending (`PD-01`…`PD-04`).

### 4.8 Contribution management (CON)

| ID     | Pri | Requirement                               | Acceptance criteria                                                                         |
| ------ | --- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| CON-01 | M   | Generate contribution periods from rules. | Sequential periods with open/due/close dates.                                               |
| CON-02 | M   | Generate member obligations.              | One per active membership/period; idempotent; snapshot amount.                              |
| CON-03 | M   | Notify members of obligations.            | In-app; email/SMS if configured.                                                            |
| CON-04 | M   | Record/submit payments.                   | Amount, method, reference, paid date, evidence.                                             |
| CON-05 | M   | Verify/reject payments.                   | Only verified payments increase collected funds.                                            |
| CON-06 | M   | Support partial payments if enabled.      | Multiple verified payments sum to obligation; status updates.                               |
| CON-07 | M   | Track unpaid and overdue obligations.     | Deadline + balance; secondary flag; notifications.                                          |
| CON-08 | M   | Generate receipts.                        | Unique receipt number; immutable snapshot; PDF.                                             |
| CON-09 | M   | View payment history.                     | Member/group/period filters; audit for corrections.                                         |
| CON-10 | M   | Enforce overpayment policy.               | Reject or credit per configuration (D-16).                                                  |
| CON-11 | M   | Close/lock periods.                       | No new obligations after lock; corrections only via authorized adjustment.                  |
| CON-12 | M   | Prevent duplicate payment posting.        | Unique reference/idempotency; transactional obligation update.                              |
| CON-13 | M   | Payment statuses.                         | Submitted, under review, verified, rejected, cancelled/reversed; obligation status derived. |

### 4.9 Automatic member status classification (STATUS)

| ID        | Pri | Requirement                                          | Acceptance criteria                                                                      |
| --------- | --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| STATUS-01 | M   | Backend calculates status; users cannot set it.      | `MemberStatusService` returns a DTO; no color field in DB.                               |
| STATUS-02 | M   | Priority: completed payout → BLUE.                   | Completed means disbursed/completed, not merely approved.                                |
| STATUS-03 | M   | Otherwise fully verified current obligation → GREEN. | Verified amount >= amount due; no pending review requirement.                            |
| STATUS-04 | M   | Otherwise → RED.                                     | Includes unpaid and pending/unverified payments.                                         |
| STATUS-05 | M   | Overdue is a separate secondary flag.                | BLUE can be overdue; UI shows warning alongside BLUE.                                    |
| STATUS-06 | M   | Status updates after payment verification/rejection. | Recomputed on next read; tests cover transitions.                                        |
| STATUS-07 | M   | Status updates after period/cycle changes.           | Current period and cycle are explicit inputs.                                            |
| STATUS-08 | M   | Status updates after payout completion.              | Completed disbursement flips member to BLUE.                                             |
| STATUS-09 | M   | Handle non-applicable states.                        | Deposit stage, suspended/withdrawn, no open period → neutral state, not false RED/GREEN. |
| STATUS-10 | M   | Dashboard displays labels + colors.                  | Accessible badges, legend, filters, counts.                                              |
| STATUS-11 | M   | Performance for large groups.                        | Aggregate query; no N+1 per member; target < 500 ms for 500 members.                     |

### 4.10 Payout scheduling and rotation (SCH)

| ID     | Pri | Requirement                                         | Acceptance criteria                                                     |
| ------ | --- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| SCH-01 | M   | Create a payout schedule for a cycle.               | Ordered positions and dates; one schedule per cycle.                    |
| SCH-02 | M   | Assign recipients.                                  | Predetermined/random/manual per rules; authorized actor; audited.       |
| SCH-03 | M   | Prevent duplicate recipient assignment.             | Default one payout per membership per cycle; DB + service.              |
| SCH-04 | M   | Random selection only when authorized.              | Server-side CSPRNG; audit seed/selection; not client-side.              |
| SCH-05 | M   | Manual selection only when rules allow.             | Permission + reason; audit.                                             |
| SCH-06 | M   | Reschedule with approval.                           | Original retained; audit; notifications.                                |
| SCH-07 | M   | Track upcoming/completed payouts.                   | Status timeline and calendar/list views.                                |
| SCH-08 | M   | Respect group agreements.                           | Rotation method and order snapshot in cycle.                            |
| SCH-09 | M   | Validate eligibility at scheduling and payout time. | Active membership, not already paid, not suspended, obligations policy. |
| SCH-10 | M   | Payout order visibility.                            | Members see their position but not unauthorized financial details.      |
| SCH-11 | M   | Run a separate lottery for each payout round.       | Exactly one draw per payout round; draw linked to cycle/round.          |
| SCH-12 | M   | Record lottery participants and exclusions.         | Snapshot participants with inclusion/exclusion reason; append-only.     |
| SCH-13 | M   | Exclude previous winners and overdue members.       | Eligibility evaluated at draw time; exclusions recorded.                |
| SCH-14 | M   | Require current contribution verified.              | Current period obligation fully covered by verified payments.           |
| SCH-15 | M   | Record winner, date, time, round, actor, evidence.  | Immutable draw record; audit event; no silent replacement.              |
| SCH-16 | M   | Re-check winner eligibility before payout.          | Payout request and disbursement re-validate all conditions.             |

### 4.11 Payout management (PAY)

| ID     | Pri | Requirement                                        | Acceptance criteria                                                                                                      |
| ------ | --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| PAY-01 | M   | Identify the scheduled recipient.                  | From schedule; mismatch requires explicit reschedule.                                                                    |
| PAY-02 | M   | Verify recipient eligibility.                      | Re-check status, duplicate payout, membership, cycle.                                                                    |
| PAY-03 | M   | Calculate payout amount.                           | Gross, deductions, net per rules; stored snapshot.                                                                       |
| PAY-04 | M   | Check available eligible funds.                    | Cannot exceed available funds; transactional lock.                                                                       |
| PAY-05 | M   | Request payout approval.                           | Requester recorded; pending state.                                                                                       |
| PAY-06 | M   | Approve/reject payout.                             | Authorized approver; comments; no self-approval if maker-checker.                                                        |
| PAY-07 | M   | Record actual disbursement.                        | Amount, method, reference, date, evidence, disburser.                                                                    |
| PAY-08 | M   | Mark payout completed only after disbursement.     | Approval alone remains approved/disbursement-pending.                                                                    |
| PAY-09 | M   | Generate payout receipt.                           | Unique receipt; immutable snapshot; PDF.                                                                                 |
| PAY-10 | M   | Update member to BLUE only on completion.          | Verified by status service.                                                                                              |
| PAY-11 | M   | Continue contributions after payout.               | Member remains obligated for remaining periods per rules.                                                                |
| PAY-12 | M   | Prevent duplicate completed payouts.               | Unique schedule + service + DB constraints.                                                                              |
| PAY-13 | M   | Handle payout failure/reversal.                    | Failed/reversed states; ledger reversal; audit.                                                                          |
| PAY-14 | M   | Payout history.                                    | All states, actors, timestamps, evidence, receipts.                                                                      |
| PAY-15 | M   | Maker-checker.                                     | Requester ≠ approver; approver ≠ disburser where configured.                                                             |
| PAY-16 | M   | Require one completed payout per member per cycle. | Cycle closure blocked until every active member has exactly one payout (or a confirmed incomplete-cycle policy applies). |
| PAY-17 | M   | Never fund a payout from retained deposits.        | Available funds use the contribution/payout fund only; deposits excluded.                                                |

> Confirmed lottery/payout detail lives in `BUSINESS_RULES.md` §3.3–3.4 (`BR-LOT-*`, `BR-PAY-*`). Lottery algorithm, approval hierarchy, winner-ineligibility handling, and incomplete cycles remain pending (`PD-05`…`PD-10`).

### 4.12 Financial management and accounting (FIN)

| ID     | Pri | Requirement                      | Acceptance criteria                                         |
| ------ | --- | -------------------------------- | ----------------------------------------------------------- |
| FIN-01 | M   | Chart of accounts per group/org. | System accounts seeded; custom accounts restricted.         |
| FIN-02 | M   | Double-entry journal.            | Every posted entry has balanced debits/credits.             |
| FIN-03 | M   | Immutable posted entries.        | No update/delete; corrections via reversal/adjustment.      |
| FIN-04 | M   | Traceable source links.          | Entry links to payment/payout/adjustment/refund.            |
| FIN-05 | M   | Derived balances.                | Account balances computed from ledger, not editable fields. |
| FIN-06 | M   | Available funds calculation.     | Defined per cycle/group; excludes unverified payments.      |
| FIN-07 | M   | Initial deposit balances.        | Separate tracking; treatment per D-01.                      |
| FIN-08 | M   | Regular contribution balances.   | Verified collections only.                                  |
| FIN-09 | M   | Payout totals.                   | Approved vs disbursed vs completed.                         |
| FIN-10 | M   | Penalties and refunds.           | Assessed, waived, paid, refunded; ledger-linked.            |
| FIN-11 | M   | Adjustments with approval.       | Reason, requester, approver, posting; audit.                |
| FIN-12 | M   | Reconciliation.                  | Account/period/system balance/difference; reviewer.         |
| FIN-13 | M   | Transaction references.          | Cash/bank/mobile/cheque reference; unique where applicable. |
| FIN-14 | M   | Financial reports.               | Ledger, trial balance, collections, payouts, outstanding.   |
| FIN-15 | M   | No silent overwrites.            | All financial mutations audited; restrictive deletion.      |

### 4.13 Penalties, defaults, withdrawals (PEN)

| ID     | Pri | Requirement                    | Acceptance criteria                                             |
| ------ | --- | ------------------------------ | --------------------------------------------------------------- |
| PEN-01 | M   | Identify late payments.        | Scheduled job marks overdue; idempotent.                        |
| PEN-02 | M   | Calculate penalties per rules. | Fixed/percentage/daily; grace/cap; deterministic.               |
| PEN-03 | M   | Assess penalties idempotently. | No duplicate penalty per obligation/assessment key.             |
| PEN-04 | M   | Notify members.                | In-app; email/SMS if configured.                                |
| PEN-05 | M   | Record defaults.               | Status and history; no automatic confiscation.                  |
| PEN-06 | M   | Payment extensions.            | Request, review, approve/reject; due-date effect audited.       |
| PEN-07 | M   | Penalty waivers with approval. | Reason, approver, ledger/audit; no self-approval.               |
| PEN-08 | M   | Withdrawal requests.           | Request, review, approval, effective date.                      |
| PEN-09 | M   | Refund calculation.            | Per rules (D-08); breakdown; approval; disbursement record.     |
| PEN-10 | M   | Suspension.                    | Authorized; effect on obligations/payouts defined.              |
| PEN-11 | M   | Dispute handling.              | Complaint record, assignment, resolution, audit.                |
| PEN-12 | M   | Member protection.             | No automatic removal/confiscation without documented procedure. |

### 4.14 Notifications and communication (NOT)

| ID     | Pri | Requirement                       | Acceptance criteria                                       |
| ------ | --- | --------------------------------- | --------------------------------------------------------- |
| NOT-01 | M   | In-app notifications.             | Database notifications; unread count; mark read.          |
| NOT-02 | M   | Contribution reminders.           | Scheduled before/after due date; deduplicated.            |
| NOT-03 | M   | Payment confirmations/rejections. | Sent on verification decision.                            |
| NOT-04 | M   | Payout reminders/confirmations.   | Scheduled and completed events.                           |
| NOT-05 | M   | Late-payment notifications.       | On overdue marking; configurable cadence.                 |
| NOT-06 | M   | Membership decisions.             | Approval/rejection/withdrawal.                            |
| NOT-07 | M   | Group announcements.              | Audience-scoped; read tracking.                           |
| NOT-08 | M   | Notification preferences.         | Per user/channel/type.                                    |
| NOT-09 | M   | Extensible channels.              | Contract for SMS/email providers; queued; retries.        |
| NOT-10 | M   | Delivery log.                     | Channel, recipient, template, status, provider ID, error. |
| NOT-11 | S   | Email templates.                  | Branded, localized, no sensitive data leakage.            |
| NOT-12 | S   | SMS integration.                  | Provider decision D-15; opt-in and cost controls.         |

### 4.15 Reports and analytics (REP)

| ID     | Pri | Requirement                 | Acceptance criteria                                    |
| ------ | --- | --------------------------- | ------------------------------------------------------ |
| REP-01 | M   | Overall dashboard.          | KPIs by permission scope; date filters.                |
| REP-02 | M   | Member reports.             | Status, obligations, payments, payouts.                |
| REP-03 | M   | Group reports.              | Financial overview, membership, rule snapshot.         |
| REP-04 | M   | Deposit reports.            | Rounds, paid/unpaid, accumulated.                      |
| REP-05 | M   | Contribution reports.       | Period, member, status, overdue.                       |
| REP-06 | M   | Payout reports.             | Scheduled/approved/disbursed/completed.                |
| REP-07 | M   | Unpaid contribution report. | Aging buckets; filters.                                |
| REP-08 | M   | Penalty report.             | Assessed/waived/paid; reasons.                         |
| REP-09 | M   | Financial summaries.        | Collections, payouts, available funds, reconciliation. |
| REP-10 | M   | Audit report.               | Actor, action, before/after, timestamp, reference.     |
| REP-11 | M   | Date filters.               | Presets + custom range; timezone-aware.                |
| REP-12 | M   | PDF export.                 | Branded; permission-checked; audited.                  |
| REP-13 | M   | Excel/CSV export.           | Streamed for large data; permission-checked; audited.  |
| REP-14 | S   | Scheduled reports.          | Queue-generated; delivered/stored securely.            |
| REP-15 | S   | Drill-down.                 | Summary → detail; no unauthorized data leakage.        |

### 4.16 Audit trail and system settings (AUD/SET)

| ID     | Pri | Requirement                                            | Acceptance criteria                                                             |
| ------ | --- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| AUD-01 | M   | Record actor, action, target, before/after, timestamp. | Append-only; no update/delete via app.                                          |
| AUD-02 | M   | Audit financial transitions.                           | Verification, approval, disbursement, adjustment, waiver, reversal.             |
| AUD-03 | M   | Audit rule changes.                                    | Previous/next version; approver.                                                |
| AUD-04 | M   | Audit role/permission changes.                         | Actor, target, diff.                                                            |
| AUD-05 | M   | Audit access to sensitive exports.                     | Who exported what, when, filters.                                               |
| AUD-06 | M   | Transaction references in audit.                       | Link to payment/payout/journal entry.                                           |
| AUD-07 | M   | Auditor read-only access.                              | No mutation endpoints/policies.                                                 |
| AUD-08 | M   | Tamper resistance.                                     | Append-only table, restrictive DB privileges in production, checksums optional. |
| SET-01 | M   | Organization information.                              | Name, logo, address, contact, registration number.                              |
| SET-02 | M   | Currency ETB.                                          | Single currency; formatting; no hardcoded symbols in code.                      |
| SET-03 | M   | Date/time settings.                                    | Storage UTC; display Africa/Addis_Ababa; optional Ethiopian calendar display.   |
| SET-04 | M   | Notification configuration.                            | Channel enablement, templates, sender identity.                                 |
| SET-05 | M   | Security configuration.                                | Password policy, session lifetime, MFA requirements, lockout.                   |
| SET-06 | M   | Receipt configuration.                                 | Prefix, numbering, footer, logo.                                                |
| SET-07 | M   | Payment settings.                                      | Methods, references, evidence requirements.                                     |
| SET-08 | M   | Business-rule defaults.                                | Safe defaults; unresolved rules must be explicitly configured.                  |
| SET-09 | M   | Settings changes audited.                              | Before/after; actor; timestamp.                                                 |
| SET-10 | S   | Maintenance mode/announcement banner.                  | Authorized toggle; audit.                                                       |

---

## 5. Role–permission matrix (summary)

This is a **baseline**, not the final seeded permission list. The seeder will contain granular permissions (for example `payments.verify`, `payouts.approve`, `payouts.disburse`, `adjustments.approve`). Group-scoped roles additionally require an assignment to the group.

Legend: **✓** allowed; **S** allowed only for assigned groups; **R** read-only; **—** denied; **A** approval only (cannot record).

| Capability                    | Super | Admin | Organizer | Treasurer | Auditor | Member     |
| ----------------------------- | ----- | ----- | --------- | --------- | ------- | ---------- |
| Manage system settings        | ✓     | —     | —         | —         | —       | —          |
| Manage users                  | ✓     | S     | —         | —         | —       | —          |
| Manage roles/permissions      | ✓     | —     | —         | —         | —       | —          |
| View all groups               | ✓     | S     | S         | S         | S       | own        |
| Create/edit groups            | ✓     | S     | S         | —         | —       | —          |
| Activate/close group          | ✓     | A     | request   | —         | —       | —          |
| Configure rules               | ✓     | A     | S         | —         | —       | —          |
| Assign group staff            | ✓     | S     | —         | —         | —       | —          |
| Register/edit members         | ✓     | S     | S         | —         | —       | —          |
| Verify member identity        | ✓     | S     | S         | —         | —       | —          |
| Approve membership            | ✓     | S     | S         | —         | —       | —          |
| Generate deposit rounds       | ✓     | —     | S         | —         | —       | —          |
| Record deposits               | ✓     | S     | —         | S         | —       | —          |
| Verify deposits               | ✓     | S     | —         | S*        | —       | —          |
| Approve deposit stage         | ✓     | A     | —         | —         | —       | —          |
| Generate contribution periods | ✓     | —     | S         | —         | —       | —          |
| Record payments               | ✓     | S     | —         | S         | —       | own submit |
| Verify/reject payments        | ✓     | S     | —         | S*        | —       | —          |
| Schedule payouts              | ✓     | A     | S         | —         | —       | —          |
| Request payout                | ✓     | S     | S         | S         | —       | —          |
| Approve payout                | ✓     | A     | —         | —         | —       | —          |
| Disburse payout               | ✓     | —     | —         | S         | —       | —          |
| Manage penalties/waivers      | ✓     | A     | —         | S         | —       | —          |
| Approve withdrawals/refunds   | ✓     | A     | —         | —         | —       | request    |
| View financial reports        | ✓     | S     | S         | S         | R       | own        |
| Export reports                | ✓     | S     | S         | S         | R       | own        |
| View audit logs               | ✓     | S     | —         | —         | R       | —          |
| System settings               | ✓     | —     | —         | —         | —       | —          |

\* A verifier cannot be the same user who submitted/recorded the payment when maker-checker is enabled. The same rule applies to payout approval vs disbursement.

**Member self-service:** view own profile, groups, obligations, verified payments, outstanding balance, payout position/status, receipts, notifications, and submit payment information/evidence. Members never see other members' financial details, KYC documents, or internal notes.

---

## 6. Business rules

Rules marked **CONFIRM** require business-owner confirmation before implementation. The system must keep them configurable and must not silently choose a policy.

> **Authoritative register:** `BUSINESS_RULES.md` holds the full confirmed rule text (`BR-DEP`, `BR-CON`, `BR-LOT`, `BR-PAY`, `BR-STAT`, `BR-FIN`) and the pending-decision gates (`PD-*`). This table is the requirement-level summary; if the two disagree, `BUSINESS_RULES.md` wins.

| ID    | Rule                                                                                                                           | Status                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| BR-01 | A group may have 0..n initial deposit rounds; the number is configured per group.                                              | Confirmed 2026-11-13 (`BR-DEP-01`)                                                              |
| BR-02 | Initial deposits are tracked separately from regular contributions.                                                            | Confirmed 2026-11-13 (`BR-DEP-04`)                                                              |
| BR-03 | Only verified payments count toward completed obligations and collected funds.                                                 | Confirmed 2026-11-13 (`BR-CON-03`)                                                              |
| BR-04 | A payout is completed only after an actual disbursement record exists.                                                         | Confirmed 2026-11-13 (`BR-PAY-03`)                                                              |
| BR-05 | A member who received a payout continues contributing for remaining periods, per rules.                                        | Confirmed 2026-11-13 (`BR-CON-04`)                                                              |
| BR-06 | BLUE takes priority over GREEN/RED; overdue is shown separately.                                                               | Confirmed 2026-11-13 (`BR-STAT-04/05`)                                                          |
| BR-07 | Member color is computed, never manually assigned or stored as the financial status.                                           | Confirmed 2026-11-13 (`BR-STAT-06`)                                                             |
| BR-08 | Financial history is never deleted or silently overwritten; corrections are traceable.                                         | Confirmed 2026-11-13 (`BR-FIN-05/06`)                                                           |
| BR-09 | One completed payout per member per cycle.                                                                                     | Confirmed 2026-11-13 (`BR-LOT-02`, `BR-PAY-04`)                                                 |
| BR-10 | Payout cannot exceed available eligible funds.                                                                                 | Confirmed by brief                                                                              |
| BR-11 | Payout recipient selection uses a separate lottery per payout round.                                                           | Confirmed 2026-11-13; exact algorithm/witness pending `PD-05`                                   |
| BR-12 | Penalties follow group rules and are never automatically confiscated.                                                          | CONFIRM mandatory/calculation (`PD-07`)                                                         |
| BR-13 | Withdrawal/refund requires authorized approval and a documented calculation.                                                   | CONFIRM formula `PD-01/PD-04`                                                                   |
| BR-14 | Members may join multiple groups only if the policy permits.                                                                   | CONFIRM                                                                                         |
| BR-15 | Partial contributions are allowed only if configured.                                                                          | CONFIRM (`PD-06`, D-05)                                                                         |
| BR-16 | Initial deposits are accumulated and retained, and are never mixed with payout funds.                                          | Confirmed 2026-11-13 (`BR-DEP-03/04`, `BR-FIN-01`); distribution/refund pending `PD-01`–`PD-03` |
| BR-17 | Normal payout operations cannot begin until the initial deposit stage is complete.                                             | Confirmed 2026-11-13 (`BR-DEP-05`)                                                              |
| BR-18 | Approval and disbursement are distinct states and may require different users.                                                 | Confirmed 2026-11-13 (`BR-PAY-02`)                                                              |
| BR-19 | A member cannot verify their own payment or approve their own payout/refund.                                                   | Default; CONFIRM org policy (`PD-09`)                                                           |
| BR-20 | Overpayments are rejected or credited per policy.                                                                              | CONFIRM (D-16)                                                                                  |
| BR-21 | Payouts may occur only after required obligations/conditions; policy configurable.                                             | Confirmed for deposit stage and current verified contribution (`BR-DEP-05`, `BR-LOT-05`)        |
| BR-22 | Effective group rule changes apply only to future periods/cycles; historical obligations retain snapshots.                     | Recommended; CONFIRM                                                                            |
| BR-23 | Members and staff with financial history are deactivated/anonymized, never hard-deleted.                                       | Recommended; CONFIRM retention                                                                  |
| BR-24 | Lottery/random selection uses a server-side cryptographically secure process and is auditable.                                 | Confirmed 2026-11-13 (`BR-LOT-09`)                                                              |
| BR-25 | Group capacity is enforced at enrollment and activation.                                                                       | Recommended; CONFIRM staff counting                                                             |
| BR-26 | A user may not hold conflicting roles in the same group (e.g., treasurer + auditor).                                           | CONFIRM                                                                                         |
| BR-27 | Penalties may be deducted from a payout only if the rule explicitly permits it.                                                | CONFIRM                                                                                         |
| BR-28 | Late-payment grace periods and penalty caps are configurable.                                                                  | CONFIRM (`PD-07`)                                                                               |
| BR-29 | Every active member must satisfy the deposit obligations; deposits accumulate and are retained.                                | Confirmed 2026-11-13 (`BR-DEP-02/03`)                                                           |
| BR-30 | Regular contributions are generated for every active member in every regular round.                                            | Confirmed 2026-11-13 (`BR-CON-02`)                                                              |
| BR-31 | Previous winners are excluded from subsequent lotteries in the same cycle.                                                     | Confirmed 2026-11-13 (`BR-LOT-03`)                                                              |
| BR-32 | Members with overdue contributions are excluded from the lottery.                                                              | Confirmed 2026-11-13 (`BR-LOT-04`)                                                              |
| BR-33 | The member's current required contribution must be verified before payout.                                                     | Confirmed 2026-11-13 (`BR-LOT-05`)                                                              |
| BR-34 | Lottery participants, winner, date, time, round, and audit information are recorded; results cannot be silently changed.       | Confirmed 2026-11-13 (`BR-LOT-06/07`)                                                           |
| BR-35 | The selected winner must pass eligibility checks again before payout.                                                          | Confirmed 2026-11-13 (`BR-LOT-08`)                                                              |
| BR-36 | Every member must receive exactly one payout during a completed cycle.                                                         | Confirmed 2026-11-13 (`BR-PAY-04`); incomplete-cycle handling pending `PD-10`                   |
| BR-37 | BLUE = payout received this cycle; GREEN = current contribution fully verified and no payout; RED = unpaid/not fully verified. | Confirmed 2026-11-13 (`BR-STAT-01`–`03`)                                                        |

---

## 7. Non-functional requirements

### 7.1 Security

| ID         | Requirement                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| NFR-SEC-01 | Enforce server-side authorization on every state-changing endpoint; frontend hiding is not security.               |
| NFR-SEC-02 | Use Laravel Form Requests for validation and Eloquent/query bindings to prevent mass assignment and SQL injection. |
| NFR-SEC-03 | Protect against CSRF (Inertia/Laravel default), XSS (React escaping + sanitize rich text), and clickjacking.       |
| NFR-SEC-04 | Require HTTPS in production; secure, HttpOnly, SameSite cookies; trusted proxies configured.                       |
| NFR-SEC-05 | Password policy: minimum 12 characters, mixed case, numbers, symbols, uncompromised check in production.           |
| NFR-SEC-06 | MFA required for super-admin, admin, treasurer, and auditor accounts.                                              |
| NFR-SEC-07 | Rate-limit login, password reset, payment submission, exports, and sensitive actions.                              |
| NFR-SEC-08 | Encrypt PII at rest (national ID, bank/mobile account numbers) and redact in logs.                                 |
| NFR-SEC-09 | Store uploaded evidence on a private disk; validate MIME/size; serve via authorized, time-limited URLs.            |
| NFR-SEC-10 | Maker-checker for payment verification, payout approval/disbursement, adjustments, waivers, refunds.               |
| NFR-SEC-11 | Append-only audit logs; restrict production DB privileges on audit/ledger tables.                                  |
| NFR-SEC-12 | No secrets in source control; secrets supplied via environment/secret manager.                                     |
| NFR-SEC-13 | Security headers (CSP, X-Content-Type-Options, Referrer-Policy, HSTS in production).                               |
| NFR-SEC-14 | Dependency scanning and patching cadence; Dependabot already configured.                                           |
| NFR-SEC-15 | Annual/periodic access review and immediate revocation on staff exit.                                              |

### 7.2 Financial integrity

| ID         | Requirement                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| NFR-FIN-01 | All money columns use `DECIMAL(15,2)`; no float arithmetic.                                          |
| NFR-FIN-02 | All multi-record financial operations run inside database transactions.                              |
| NFR-FIN-03 | Concurrency control (`lockForUpdate`) for obligations, payouts, accounts, and sequences.             |
| NFR-FIN-04 | Unique constraints and idempotency keys prevent duplicate payments/payouts.                          |
| NFR-FIN-05 | Every posted journal entry balances to zero.                                                         |
| NFR-FIN-06 | Posted entries are immutable; corrections are reversals/adjustments.                                 |
| NFR-FIN-07 | Balances are derived from the ledger, not edited directly.                                           |
| NFR-FIN-08 | Correctness tests cover unverified payments, duplicate payouts, over-disbursement, and BLUE+overdue. |
| NFR-FIN-09 | Monetary rounding is deterministic (half-up at calculation boundaries) and documented.               |
| NFR-FIN-10 | Reconciliation reports explain every difference; unresolved differences block cycle closure.         |

### 7.3 Performance and scalability

| ID          | Requirement                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| NFR-PERF-01 | Typical authenticated page: server response < 500 ms at p95 under normal load.                                 |
| NFR-PERF-02 | Group dashboard for 500 members: < 1 s p95 including status computation.                                       |
| NFR-PERF-03 | All list endpoints paginated server-side (default 25, max 100).                                                |
| NFR-PERF-04 | Avoid N+1 queries; use eager loading and aggregate queries.                                                    |
| NFR-PERF-05 | Exports/receipts/notifications queued for large datasets.                                                      |
| NFR-PERF-06 | Indexes support all foreign keys and common filters; reviewed with `EXPLAIN`.                                  |
| NFR-PERF-07 | Initial target: 100 groups, 10,000 members, 200,000 obligations, 500,000 payments without architecture change. |
| NFR-PERF-08 | Settings/permissions cached; cache invalidated on change.                                                      |

### 7.4 Reliability and availability

| ID         | Requirement                                                        |
| ---------- | ------------------------------------------------------------------ |
| NFR-REL-01 | Financial operations are atomic; partial states are impossible.    |
| NFR-REL-02 | Queue jobs are idempotent and retried safely.                      |
| NFR-REL-03 | Failed jobs are monitored and actionable.                          |
| NFR-REL-04 | Daily automated backups; RPO ≤ 24 h, RTO ≤ 4 h for launch.         |
| NFR-REL-05 | Restore procedure tested before go-live.                           |
| NFR-REL-06 | Health endpoint (`/up`) and basic monitoring/alerting.             |
| NFR-REL-07 | Maintenance mode and safe deployment procedure.                    |
| NFR-REL-08 | No destructive migrations in production without backup and review. |

### 7.5 Usability, accessibility, and design

| ID        | Requirement                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| NFR-UX-01 | Consistent design system: typography, spacing, colors, buttons, forms, tables, dialogs, badges. |
| NFR-UX-02 | GREEN/RED/BLUE always paired with a readable label and icon; never color alone.                 |
| NFR-UX-03 | WCAG 2.1 AA contrast; keyboard navigation; visible focus; screen-reader labels.                 |
| NFR-UX-04 | Responsive: desktop-first financial tables; usable mobile views for members.                    |
| NFR-UX-05 | Clear empty, loading, error, and permission-denied states.                                      |
| NFR-UX-06 | Destructive/financial actions require confirmation with a summary of consequences.              |
| NFR-UX-07 | Money displayed as `ETB 1,234.56`; dates unambiguous; timezone shown where relevant.            |
| NFR-UX-08 | No excessive animation, decoration, or overcrowded dashboards.                                  |
| NFR-UX-09 | Forms preserve input on validation errors and explain how to fix them.                          |
| NFR-UX-10 | UI text centralized for future Amharic localization.                                            |

### 7.6 Maintainability and quality

| ID         | Requirement                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| NFR-MNT-01 | Modular monolith with clear domain boundaries; no business logic in React components.                               |
| NFR-MNT-02 | Laravel conventions: controllers, Form Requests, services, policies, enums, events, listeners, jobs, notifications. |
| NFR-MNT-03 | TypeScript strict mode; no `any` without justification.                                                             |
| NFR-MNT-04 | Pint formatting; Larastan level 7; CI gate.                                                                         |
| NFR-MNT-05 | Tests for every financial invariant and authorization boundary.                                                     |
| NFR-MNT-06 | Factories/seeders for repeatable test data; no mock data in production financial tables.                            |
| NFR-MNT-07 | Documentation for architecture, schema, workflows, and runbooks.                                                    |
| NFR-MNT-08 | No duplicate business logic; shared services for money, status, ledger, sequences.                                  |
| NFR-MNT-09 | Backward-compatible migrations and phased rollout.                                                                  |
| NFR-MNT-10 | Code review checklist includes authorization, transactions, audit, and financial invariants.                        |

### 7.7 Compliance, privacy, and retention

| ID         | Requirement                                                                |
| ---------- | -------------------------------------------------------------------------- |
| NFR-PRV-01 | Collect only necessary PII; document purpose and access.                   |
| NFR-PRV-02 | Members can access their own records and receipts.                         |
| NFR-PRV-03 | Financial/audit records retained for at least 7 years or per legal advice. |
| NFR-PRV-04 | Anonymization replaces PII while preserving financial references.          |
| NFR-PRV-05 | Exports and documents are access-controlled and logged.                    |
| NFR-PRV-06 | Data-processing/consent language is reviewed by the business/legal owner.  |

### 7.8 Portability and operations

| ID         | Requirement                                                                                |
| ---------- | ------------------------------------------------------------------------------------------ |
| NFR-OPS-01 | Development on Windows (WAMP/PowerShell); production on Linux (Nginx + PHP-FPM + MySQL 8). |
| NFR-OPS-02 | Environment parity: same PHP minor, Node major, MySQL major between CI and production.     |
| NFR-OPS-03 | Queue worker supervised; scheduler via cron/systemd timer.                                 |
| NFR-OPS-04 | Structured logs with request IDs; no secrets/PII in logs.                                  |
| NFR-OPS-05 | Deployment runbook with build, migrate, cache, queue restart, smoke tests, rollback.       |
| NFR-OPS-06 | Static assets built in CI; no build on production web nodes.                               |

---

## 8. Data and reporting requirements

- Financial reports must be reproducible from immutable records (ledger + source documents).
- Every report must declare its date basis (payment date, verified date, due date, disbursement date) and timezone.
- Summary figures must reconcile to ledger/obligation details; differences must be explainable.
- Exports must include filters, generation timestamp, generator, and organization identity.
- Reports must respect group scoping and member privacy.
- PDF receipts and statements must use immutable snapshots (amounts, names, dates, receipt number) so later edits do not alter issued documents.
- Large exports must stream and be queued; they must not exhaust memory.
- The audit report must support filtering by actor, event, group, entity, and date.

---

## 9. Assumptions

1. One organization operates the installation; groups are not separate tenants.
2. Currency is ETB only; amounts have two decimal places.
3. Payments are verified manually from evidence or cash records; there is no automatic gateway reconciliation in the initial release.
4. Members may exist without a user login; staff can manage them. Account activation is optional.
5. Group rules can change between cycles but must not rewrite historical obligations.
6. A cycle has a bounded set of contribution periods and payout positions.
7. Staff can be assigned to multiple groups; member participation across groups is policy-controlled.
8. The organization will provide the actual financial policies for the open decisions before the affected phase begins.
9. Email is available for staff; member email may be absent, so phone-based access must be decided.
10. The system is not a bank; it records and verifies money movements but does not hold funds.

---

## 10. Open decisions requiring confirmation

The following decisions materially change financial behavior or security. Each has a safe default/placeholder in the design, but **none will be silently implemented as a business policy**. See `IMPLEMENTATION_ROADMAP.md` for the phase gate at which each must be answered.

| ID   | Decision                                  | Options                                                                       | Recommended default                                                           | Blocks       |
| ---- | ----------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------ |
| D-01 | Treatment of initial deposit money        | Included in first payout / distributed separately / held as reserve / other   | `undecided`; block payout commencement until configured                       | Phase 4/6    |
| D-02 | Payout commencement conditions            | All deposit rounds complete / scheduled date / both / manual approval / other | Configurable mode + explicit approval                                         | Phase 6      |
| D-03 | BLUE persistence                          | Whole cycle / until next cycle / until another condition                      | Whole cycle, recomputed per cycle                                             | Phase 5      |
| D-04 | Multiple group membership                 | Allowed / not allowed / per group / per member limit                          | Allowed, subject to group rule                                                | Phase 3      |
| D-05 | Partial contributions                     | Allowed / not allowed / minimum threshold                                     | Not allowed until configured                                                  | Phase 5      |
| D-06 | Payout recipient selection                | Predetermined / random / manual / hybrid                                      | Predetermined by default; others only if enabled                              | Phase 6      |
| D-07 | Penalties                                 | Mandatory / configurable / none                                               | Configurable; no penalty until configured                                     | Phase 7      |
| D-08 | Withdrawal/refund calculation             | No refund / deposits only / pro-rata verified contributions / custom          | No automatic refund; explicit approved calculation                            | Phase 7      |
| D-09 | Payout composition                        | Contributions only / +deposits / −penalties / −outstanding / −fees            | Configurable formula; no silent deduction                                     | Phase 6      |
| D-10 | Member login identifier                   | Email / phone / either / no member login                                      | Staff-managed members initially; phone decision required before member portal | Phase 2/3    |
| D-11 | Public registration                       | Open / invitation only / disabled                                             | Disabled                                                                      | Phase 1.5    |
| D-12 | Maker-checker policy                      | Always / above threshold / per group / off                                    | Always for payouts and adjustments; configurable for payments                 | Phase 2/6    |
| D-13 | Staff as members / conflicting roles      | Allowed / forbidden / per group                                               | Forbid treasurer+auditor in same group; staff membership requires approval    | Phase 3      |
| D-14 | Calendar display                          | Gregorian only / Gregorian + Ethiopian                                        | Store Gregorian; display Ethiopian optionally                                 | Phase 2      |
| D-15 | SMS/email providers                       | Provider TBD                                                                  | Keep channel contracts; log driver until configured                           | Phase 8      |
| D-16 | Overpayment handling                      | Reject / credit to next period / refund                                       | Reject by default                                                             | Phase 5      |
| D-17 | Payout before all contributions collected | Allowed / not allowed / per rule                                              | Not allowed by default; configurable                                          | Phase 6      |
| D-18 | Penalty deduction from payout             | Allowed / not allowed / per rule                                              | Not allowed unless explicitly configured                                      | Phase 7      |
| D-19 | Data retention/anonymization              | 7 years / other                                                               | 7 years, then anonymize; legal review                                         | Phase 9      |
| D-20 | Multi-organization                        | Single org / multi-tenant                                                     | Single org for v1                                                             | Architecture |
| D-21 | Deposit refundability                     | Refundable / non-refundable / conditional                                     | Retained; no refund calculated until confirmed (`PD-01`)                      | Phase 4/7    |
| D-22 | Ownership/control of retained deposits    | Group-held / member-owned / custodian / other                                 | Group-held fund with no distribution logic (`PD-02`)                          | Phase 4/6    |
| D-23 | Deposits for penalties/expenses           | Allowed / not allowed / capped                                                | Not allowed (`PD-03`)                                                         | Phase 4/7    |
| D-24 | Deposit treatment on withdrawal           | Refund / forfeit / partial / transfer                                         | Request allowed; no processing (`PD-04`)                                      | Phase 7      |
| D-25 | Lottery algorithm and witnessing          | CSPRNG / public verifiable draw / witnessed manual / hybrid                   | Server-side CSPRNG + recorded evidence + audit (`PD-05`)                      | Phase 6      |
| D-26 | Winner becomes ineligible before payout   | Re-draw / next eligible / hold / cancel                                       | Block payout; audited decision; never silently edit draw (`PD-08`)            | Phase 6      |
| D-27 | Approval hierarchy                        | Single approver / tiered / per amount / per group                             | Maker-checker defaults (`PD-09`)                                              | Phase 6      |
| D-28 | Incomplete cycle handling                 | Block closure / carry forward / partial completion / other                    | Block closure while coverage is incomplete (`PD-10`)                          | Phase 6/7    |

---

## 11. Definition of done for each phase

A phase is complete only when:

1. Functional requirements in scope are implemented and demonstrably working.
2. Authorization is enforced server-side and covered by tests.
3. Financial operations are transactional and invariant tests pass.
4. Migrations run forward and backward on a clean database and on a copy of realistic data.
5. PHP tests, TypeScript checks, Pint, and Larastan pass.
6. Routes are reviewed; no unintended public endpoints exist.
7. Seeders/factories are idempotent and safe outside local environments.
8. Audit and notification events are wired where required.
9. Documentation is updated (schema, workflow, decisions, runbook).
10. A short demo script and known-limitations list are provided.

---

## 12. Traceability

Each implementation pull request should reference:

- the requirement IDs it satisfies (e.g., `DEP-03`, `DEP-04`, `STATUS-06`);
- the business-rule IDs and decision IDs it depends on;
- the tests added;
- any schema changes and their migration/rollback plan.

This keeps financial behavior auditable from requirement to code to test.
