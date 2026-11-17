# Self-Service Digital Equb Platform Plan

## Executive summary

The codebase has already been advanced into a self-service direction rather than a central-admin-controlled Equb workflow. The current foundation is aligned with the requested platform model:

- Public self-registration is enabled through Laravel Fortify in [config/fortify.php](config/fortify.php).
- Public group discovery and filtering are implemented in [app/Http/Controllers/GroupDiscoveryController.php](app/Http/Controllers/GroupDiscoveryController.php).
- Group creation and rule configuration are implemented in [app/Http/Controllers/EqubGroupController.php](app/Http/Controllers/EqubGroupController.php) and [app/Services/EqubGroupService.php](app/Services/EqubGroupService.php).
- Membership requests, invite codes, approval and auto-admit logic are handled in [app/Services/MembershipRequestService.php](app/Services/MembershipRequestService.php).
- Member governance and voting are implemented through [app/Http/Controllers/GroupGovernanceController.php](app/Http/Controllers/GroupGovernanceController.php) and governance migrations in [database/migrations/2026_11_17_000003_create_group_governance_tables.php](database/migrations/2026_11_17_000003_create_group_governance_tables.php).
- Group visibility and self-service fields were added in [database/migrations/2026_11_17_000001_add_self_service_fields_to_equb_groups_table.php](database/migrations/2026_11_17_000001_add_self_service_fields_to_equb_groups_table.php).

This means the project is not starting from zero. The priority is to preserve the working self-service foundation while closing the remaining product and governance gaps before broad rollout.

---

## 1. Current architecture assessment

### What is already in place

1. Identity and registration
   - Fortify supports public self-registration and email verification.
   - Per-user roles and permissions are modeled through the broader admin authorization layer.
   - A member profile layer exists and is associated with users and group participation.

2. Public discovery
   - Public groups can be listed and filtered by search, contribution amount, frequency, location, max size, and available capacity.
   - The group public surface is intentionally separated from internal operational controls.

3. Group creation and setup
   - Groups are created with a generated code and a versioned rule set.
   - Contribution amount, frequency, round rules, payout commencement, and retention policies are part of the first active rule version.
   - Group creators are registered in the staff pivot for organizer-level access, but the system keeps financial ownership separate from creator privilege.

4. Membership and join flow
   - Groups can accept direct requests or invite-only access.
   - Duplicate membership and pending-request prevention are enforced.
   - Auto-admission is supported through group rule mode while still allowing manual approval paths.

5. Member governance
   - Group decisions and vote records are persisted as separate tables.
   - Decision close-out logic is available to update the result once the voting window expires.
   - The governance model is designed to support requirement-based rule changes and operational decisions.

### Architectural strengths

- The model keeps operational financial logic separate from public discovery and group membership workflows.
- Role checks are grouped behind group permissions and Laravel policies/gates.
- Critical workflows use transactions, versioned rules, and audit logging.
- The code is already modularized around groups, memberships, deposits, contributions, payouts, and governance.

### Gaps to close for a production-ready self-service platform

- Public-facing user onboarding is present, but user identity verification workflow needs explicit product definition and operational enforcement.
- Private and invitation-only group flows need fuller UX and permission checks at the frontend and controller layer.
- Financial transparency and settlement rules still need product-owner decisions on deposit handling, refunds, and failover scenarios.
- Governance workflows need more evidence-based review, especially around rule changes after activation.
- Dispute management, notifications, and member financial statements still require final product workflow definition and integration.

---

## 2. Required database changes

The system already has the right structural direction. The main database additions that support the platform are:

1. Group self-service fields
   - `visibility`
   - `location`
   - `invite_code`
   - group status and staff association for group operations

2. Governance tables
   - `group_decisions`
   - `group_decision_votes`

These are already reflected in the migrations:

- [database/migrations/2026_11_17_000001_add_self_service_fields_to_equb_groups_table.php](database/migrations/2026_11_17_000001_add_self_service_fields_to_equb_groups_table.php)
- [database/migrations/2026_11_17_000003_create_group_governance_tables.php](database/migrations/2026_11_17_000003_create_group_governance_tables.php)

Recommended next additions, subject to decision approval:

- `member_verification` workflow status tracking and evidence metadata
- a dedicated `dispute_cases` table with evidence attachments and review metadata
- a `notification_delivery` log table
- immutable `financial_transaction_reconciliation` records for ledger matching and failed payment handling

---

## 3. New modules and workflows

### 3.1 Registration and member identity

- Self-registration through Fortify.
- Member profile creation and KYC/identity verification workflow.
- Role assignment for member, organizer, treasurer, auditor, and admin.
- Contact verification and fraud risk checks before a user is promoted to full access.

### 3.2 Group discovery and onboarding

- Public group listing with filtering and search.
- Group preview pages for public groups.
- Join request flow for public groups, invite code flow for private/invite-only groups.
- Capacity checks and duplicate-request protections.

### 3.3 Self-service group creation

- Create group with name, category, location, visibility, and max members.
- Set first-version rules including contribution amount, frequency, deposit policy, and payout timing.
- Create initial setup without unrestricted financial control.
- Activation only after required group members and rule checks pass.

### 3.4 Membership management

- Request to join, invite-based join, and approval flow.
- Auto-admit or manual approval per group rule.
- Member profile view with active memberships and status.
- Prevent unauthorized cross-group access and duplicate enrollments.

### 3.5 Governance and voting

- Open a decision with title, description, type, payload, and close deadline.
- Allow active members to vote approve/reject/abstain.
- Close decisions automatically when the voting window expires.
- Apply rule-change decisions only when the group is operating and the vote has passed.

### 3.6 Financial ledger and transparency

- Keep initial deposits, contribution collections, and payouts in separate accounting ledgers.
- Personal financial statements for each member.
- Group-level financial reports only for authorized members.
- Reconciliation, reversals, and failed-payment flags remain explicit and auditable.

---

## 4. Authorization and governance model

The platform should follow a layered policy model:

1. Platform-level identity and admin controls
   - Standard Laravel policies, permissions, and role checks.
   - Account-level access, admin oversight, and security enforcement.

2. Group-level governance rights
   - Active members are allowed to participate in governance decisions.
   - Only active memberships may vote, and the vote is tied to the user’s current profile membership state.
   - Rule changes after activation require a passed governance decision.

3. Operational permissions
   - Organizer, treasurer, and auditor roles should have field-specific permissions, not blanket financial authority.
   - The group creator should not be treated as a universal financial owner.

This is already reflected in the route-level authorization in [routes/web.php](routes/web.php) and the permission catalog used by the middleware layer.

---

## 5. Financial transaction architecture

The model should remain conservative and compliant with the requirement to avoid an internal wallet or custody model without an approved financial and regulatory model.

Recommended architecture:

- Separate ledgers for:
  - Initial deposits
  - Regular contributions
  - Payouts
  - Reversals and adjustments
- One payout per member per completed cycle.
- Winner selection is server-side only; the UI must never decide the winner.
- Payout status flow should remain: approved → disbursed → confirmed complete.
- Do not mark a payout as paid before proof of disbursement is recorded.
- Retained initial deposits should remain separate from payout calculation logic until a formal product approval defines the treatment policy.

This matches the current system principle already stated in code comments and in the accounting and payout-related services.

---

## 6. Migration strategy

Use additive migration, not a rewrite.

1. Keep existing working tables and models in place.
2. Add group visibility, invite codes, and governance tables as incremental, backward-compatible changes.
3. Keep existing admin and permissions flow while enabling independent self-service routes.
4. Introduce new UI pages without removing old management pages.
5. Treat financial rules as versioned and immutable after activation unless a governance decision approves a change.

This strategy reduces operational risk and preserves working functionality while enabling the self-service platform model.

---

## 7. Implementation phases

### Phase 1 — security and self-service foundation
- Confirm user registration and verified login flow.
- Confirm member profile creation.
- Confirm public group discovery.
- Confirm self-service membership request and invite code flow.

### Phase 2 — group creation and activation
- Validate group creation with rule configuration.
- Validate activation gates and group status transitions.
- Confirm organizer and staff role setup.

### Phase 3 — governance and rule control
- Finalize decision creation and voting flow.
- Validate rule change approval before activation-stage modifications.
- Add decision history and audit trail.

### Phase 4 — financial workflows
- Finalize deposit rounds and contribution obligation generation.
- Close the verification and reconciliation model for payments.
- Validate payout scheduling and disbursement separation.

### Phase 5 — transparency and risk controls
- Add dispute tracking, notifications, and member financial statements.
- Finalize fraud monitoring, rate limiting, and audit review.
- Implement a hard approval gate before any new financial custody or wallet model.

---

## 8. Decisions requiring product-owner approval

The following business policy questions should be resolved before final production rollout:

1. Initial deposit policy
   - Should retained initial deposits remain in a group reserve, be refunded, or be handled under a separate policy after cycle completion?

2. Membership modes
   - Should all groups default to approval-required, auto-admit, or allow a mix depending on visibility and group trust level?

3. Governance roles
   - Are coordinators and financial verifiers elected, assigned by group rule, or both?

4. Refund and withdrawal rules
   - What is the formal treatment for member withdrawals, deposit refunds, and partial settlement at cycle close?

5. Dispute and compliance process
   - What evidence standards, escalation path, and final resolution authority are required before a dispute is closed?

6. Financial custody model
   - Should the platform remain ledger-only, or is there a formal regulatory model for custody, settlement, or treasury handling?

---

## 9. Verified current status

The project has already implemented the foundational self-service requirements for:

- independent user registration,
- public discovery,
- group creation and rule setup,
- membership enrollment and duplicate prevention,
- member governance decisions and voting,
- and the current group status lifecycle.

The existing verification evidence is:

- `php artisan test tests/Feature/Groups/EqubGroupManagementTest.php`
- Result: 5 tests passed, 25 assertions, exit status success.

This confirms the current self-service group foundation is operational and stable under the project’s existing test suite.

---

## 10. Recommended next move

The next delivery should focus on the most business-critical remaining foundation items:

- user verification workflow and identity evidence capture,
- private/invite-only group UX and flows,
- member financial statement reporting,
- payout confirmation and reconciliation controls,
- dispute tracking and notifications.

This keeps the system aligned with the “independent digital financial community platform” goal without removing the working core that exists today.
