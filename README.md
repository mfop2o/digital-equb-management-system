# Digital Equb Management System

Internal management system for Ethiopian Equb groups: members, deposits, contributions, payouts, reconciliation, audit, and reporting.

Built on Laravel 13 + React 19 + TypeScript + Inertia + Tailwind CSS 4, with MySQL 8 and Spatie Laravel Permission.

## Status

Phase 1 (analysis and architecture) and Phase 1.5 (foundation hardening) are implemented. Domain modules start at Phase 2. See [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md).

Planning documents:

- [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) — starter-kit assessment and verified baseline
- [REQUIREMENTS.md](REQUIREMENTS.md) — functional and non-functional requirements, open decisions
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) — modules, layers, security, ADRs
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md) — table-level schema and invariants
- [DATABASE_ERD.md](DATABASE_ERD.md) — domain ERDs and state machines
- [BUSINESS_WORKFLOWS.md](BUSINESS_WORKFLOWS.md) — workflows A–I
- [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) — phases, decision gates, exit criteria

## Requirements

| Tool     | Version |
| -------- | ------- |
| PHP      | 8.3+    |
| Composer | 2.x     |
| Node.js  | 22+     |
| npm      | 10+     |
| MySQL    | 8.0+    |

## Local setup (PowerShell)

```powershell
# 1. Backend dependencies
composer install

# 2. Environment
Copy-Item .env.example .env
php artisan key:generate

# 3. Create the MySQL database first, then set DB_* in .env
#    DB_DATABASE=equb_management

# 4. Schema and baseline roles/permissions
php artisan migrate
php artisan db:seed --class=RolesAndPermissionsSeeder

# 5. First administrator (password is prompted and never echoed)
php artisan equb:create-admin

# 6. Frontend
npm install
npm run build

# 7. Run
php artisan serve
```

Open `http://localhost:8000` and log in. Public registration is disabled by design; accounts are provisioned by an administrator.

### Linux/macOS

Use the same steps with shell commands:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan equb:create-admin
npm ci
npm run build
php artisan serve
```

### Environment notes

- `SESSION_DRIVER`, `CACHE_STORE`, and `QUEUE_CONNECTION` all use the database in the example environment, so run migrations before serving.
- Instants are stored in UTC (`APP_TIMEZONE=UTC`). Display time uses `APP_DISPLAY_TIMEZONE` (`Africa/Addis_Ababa` by default).
- `APP_CURRENCY=ETB` is the single supported currency for v1.
- Never commit `.env` or local credentials.

### Local development

```powershell
composer run dev      # serve + queue + logs + Vite
npm run dev           # Vite only
```

## Verification

Run the full gate before proposing a change:

```powershell
php artisan test
npm run types:check
npm run build
npm run check
vendor/bin/pint --test
vendor/bin/phpstan analyse
```

Financial and constraint tests must run against MySQL, not SQLite. The default `phpunit.xml` uses an in-memory SQLite database for fast starter tests; CI adds MySQL from Phase 4.

## Architecture summary

- Modular monolith: centralized models/enums, domain services in `app/Modules/*`, controllers grouped by module, policies in `app/Policies`.
- Spatie global roles plus an `equb_group_user` pivot for group-scoped authority.
- Obligations record what is due; payments record what was received; verifications record decisions. Balances are derived.
- Member colour (GREEN/RED/BLUE) is computed at read time. It is never stored.
- Double-entry ledger with immutable postings; corrections are reversals, never edits.
- Money is `DECIMAL(15,2)` and handled as integer santim through a value object.
- Financial records are never hard-deleted; users and members are deactivated.

## Security notes

- Public registration is disabled.
- Deactivation ends sessions and blocks login; accounts are never hard-deleted.
- The `audit_logs` table is append-only. Password hashes and tokens are never written to it.
- Baseline security headers are applied to every web response. CSP is report-only until hardening.
- Never commit `.env`, database credentials, API keys, or member PII.

## Roles

`super-admin`, `admin`, `organizer`, `treasurer`, `auditor`, `member`.

Permissions are granular (for example `payments.verify`, `payouts.approve`, `payouts.disburse`, `reconciliations.approve`). Roles are seeded by `RolesAndPermissionsSeeder`, which only adds permissions and never removes runtime grants.

## Open business decisions

Financial policy decisions (for example D-01 deposit fund treatment, D-02 payout commencement, D-06 recipient selection, D-08 refund formula, D-09 payout composition, D-16 overpayment) must be confirmed by the business owner before the affected phase. The system blocks on `undecided` instead of inventing a rule. See `REQUIREMENTS.md` and `IMPLEMENTATION_ROADMAP.md`.
