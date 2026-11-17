# PROJECT_ANALYSIS — Digital Equb Management System

> **Status:** Phase 1 deliverable (read-only inspection). No application code was modified.
> **Repository:** `digital-equb-management-system`
> **Branch inspected:** `main` (working tree clean at inspection start)
> **Inspection date:** 2026-11-12
> **Inspector:** Senior architecture review

---

## 1. Executive summary

The repository is a **fresh Laravel 13 + React 19 + Inertia 3 starter kit** (`laravel/react-starter-kit`) with Fortify authentication, two-factor authentication, passkeys, email verification, Wayfinder-generated typed routes, Tailwind CSS 4, and shadcn/Radix UI primitives.

There is **no Equb business domain implemented yet**. The only application-specific screens are the welcome page, the placeholder dashboard, and the starter-kit profile/security/appearance settings pages.

The backend boots correctly against **MySQL 8.4.7**, and the five starter migrations are applied. At inspection time the baseline was red only for tooling reasons; those have since been resolved and verified (see §1.1). The remaining blockers are architectural/product decisions, not environment setup:

1. `spatie/laravel-permission` is **not installed**.
2. Public self-registration is enabled (Fortify), which is inappropriate for an internal financial system.
3. The starter kit's “delete my account” flow hard-deletes `users`; this will violate financial foreign keys once the ledger exists.
4. No domain tables, policies, services, enums, audit trail, or notification table exist.
5. No JS lockfile is committed, so frontend installs are not yet reproducible.

### 1.1 Verification addendum (after inspection)

To avoid presenting an unverified baseline, the following were executed after the read-only inspection:

| Action                        | Command                         | Verified result                                                         |
| ----------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| Install frontend dependencies | `npm install --no-package-lock` | 245 packages added, 0 vulnerabilities; no tracked files changed         |
| Production build              | `npm run build`                 | **Succeeded**; `public/build/manifest.json`, fonts, CSS, and JS emitted |
| Backend test suite            | `php artisan test`              | **42 passed, 147 assertions**                                           |
| TypeScript check              | `npm run types:check`           | **Passed** (no errors)                                                  |

The earlier `laravel:fonts` `getaddrinfo ENOTFOUND fonts.bunny.net` failure was a transient DNS/network problem, not a project defect; the retry completed and downloaded the Instrument Sans files successfully. A warning remains: optimized font fallbacks require the optional `fontaine` package (cosmetic only, build still succeeds).

A JS lockfile was intentionally **not** written (`--no-package-lock`) to avoid changing repository state during Phase 1; committing `package-lock.json` remains a Phase 1.5 task. `npm run check` currently reports formatting differences in Markdown files created during this phase; those are documentation-only and will be resolved with `vp check --fix` in Phase 1.5.

The existing application is a good, modern foundation and **should be extended, not replaced**. Recommended next step: a short **Foundation Hardening** phase (Phase 1.5) to green the baseline and install only the required package (`spatie/laravel-permission`) before Phase 2 (authentication, users, roles, permissions, application shell).

---

## 2. Inspection method

The following read-only checks were performed. No secrets, passwords, or database credentials are reproduced in this document.

| Check                 | Method                                                     | Result                                                                                   |
| --------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Git state             | `git status`, `git log`                                    | Clean; branch `main`; 3 commits                                                          |
| PHP runtime           | `php -v`                                                   | PHP 8.4.15 (ZTS, Xdebug 3.4.7)                                                           |
| Laravel version       | `php artisan --version`, `php artisan about`               | Laravel 13.42.0                                                                          |
| Composer packages     | `composer show --direct`, `composer.json`, `composer.lock` | See §4                                                                                   |
| Database connectivity | `php artisan migrate:status`, `select version()`           | MySQL 8.4.7 reachable; 5 migrations applied                                              |
| Routes                | `php artisan route:list`                                   | 46 routes registered (starter kit + Fortify)                                             |
| Test baseline         | `php artisan test`                                         | Initially blocked by missing Vite manifest; after build: **42 passed, 147 assertions**   |
| Frontend deps         | Filesystem inspection, then `npm install`                  | Initially absent; installed after inspection; no JS lockfile; `pnpm` not installed       |
| Frontend build        | `npm run build`                                            | Initially absent; **succeeded after inspection** (manifest + Wayfinder output generated) |
| Config                | `.env` key names only (values not reproduced)              | MySQL configured; session/cache/queue drivers noted                                      |
| CI                    | `.github/workflows/tests.yml`                              | Composer setup → `composer ci:check` on Ubuntu/PHP 8.3/Node 22                           |

> **Secret handling:** `.env` was inspected only for configuration _keys_ required for the analysis. No password, key, token, or credential value is included here.

---

## 3. Verified technology versions

### 3.1 Runtime and platform

| Component | Version                 | Notes                                                                                                        |
| --------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| PHP       | **8.4.15**              | `composer.json` requires `^8.3`; CI uses 8.3                                                                 |
| Composer  | **2.10.2**              | SSL/TLS protection reported disabled (environment warning)                                                   |
| Laravel   | **13.42.0**             | Laravel 13 conventions (attribute-based `#[Fillable]`, `#[Hidden]`, `Route::inertia`, Inertia 3 integration) |
| MySQL     | **8.4.7**               | InnoDB expected; `utf8mb4` is the framework default                                                          |
| Node.js   | **24.19.0**             | CI uses Node 22                                                                                              |
| npm       | **11.17.0**             | `pnpm` is **not installed**                                                                                  |
| OS        | Windows (WAMP PHP path) | Development target; production target not yet defined                                                        |

Required PHP extensions present: `bcmath`, `fileinfo`, `gd`, `intl`, `mbstring`, `openssl`, `pdo_mysql`, `zip`. This supports precise money arithmetic, image handling, localization, and MySQL access.

### 3.2 Backend packages (declared / installed)

| Package                     | Declared   | Installed         | Purpose                                           |
| --------------------------- | ---------- | ----------------- | ------------------------------------------------- |
| `laravel/framework`         | `^13.17`   | **13.42.0**       | Framework                                         |
| `inertiajs/inertia-laravel` | `^3.0`     | **3.7.0**         | Inertia server adapter                            |
| `laravel/fortify`           | `^1.37.2`  | **1.42.0**        | Authentication backend                            |
| `laravel/wayfinder`         | `^0.1.14`  | **0.1.23**        | Typed TypeScript route/action generation          |
| `laravel/tinker`            | `^3.0`     | **3.1.0**         | REPL                                              |
| `laravel/chisel`            | `^0.1.0`   | **0.1.1**         | Starter-kit feature installer (leftover; see §10) |
| `phpunit/phpunit`           | `^12.5.23` | **12.5.43**       | Tests (PHPUnit, **not Pest**)                     |
| `larastan/larastan`         | `^3.9`     | **3.15.0**        | Static analysis (level 7)                         |
| `laravel/pint`              | `^1.27`    | **1.32.3**        | Code style                                        |
| `laravel/pail`              | `^1.2.5`   | **1.3.0**         | Log tailing                                       |
| `laravel/sail`              | `^1.53`    | **1.70.0**        | Docker helper (not required on WAMP)              |
| `fakerphp/faker`            | `^1.24`    | **1.24.1**        | Factories                                         |
| `spatie/laravel-permission` | —          | **NOT INSTALLED** | Required by the project brief                     |

### 3.3 Frontend packages (declared ranges)

| Package                                              | Declared                                        | Purpose                       |
| ---------------------------------------------------- | ----------------------------------------------- | ----------------------------- |
| `react` / `react-dom`                                | `^19.2.0`                                       | UI                            |
| `@inertiajs/react`                                   | `^3.0.0`                                        | Inertia client                |
| `@inertiajs/vite`                                    | `^3.0.0`                                        | Inertia Vite integration      |
| `typescript`                                         | `^5.7.2`                                        | Type safety (`strict: true`)  |
| `tailwindcss`                                        | `^4.0.0` (`@tailwindcss/vite` `^4.1.11`)        | Styling                       |
| `vite`                                               | aliased to `@voidzero-dev/vite-plus-core@1.4.0` | Build tool (Vite+)            |
| `vite-plus`                                          | `1.4.0`                                         | Vite+ wrapper (`vp` CLI)      |
| `@vitejs/plugin-react`                               | `^6.1.1`                                        | React plugin                  |
| `babel-plugin-react-compiler`                        | `^1.0.0`                                        | React Compiler                |
| `@laravel/passkeys`                                  | `^0.2.0`                                        | Passkey/WebAuthn client       |
| `@laravel/vite-plugin-wayfinder`                     | `^0.1.3`                                        | Route generation during build |
| Radix UI packages                                    | various                                         | Accessible primitives         |
| `lucide-react`                                       | `^0.475.0`                                      | Icons                         |
| `sonner`                                             | `^2.0.0`                                        | Toasts                        |
| `class-variance-authority`, `clsx`, `tailwind-merge` | various                                         | Styling utilities             |
| `input-otp`                                          | `^1.4.2`                                        | 2FA input                     |

> There is **no lockfile** (`package-lock.json`, `pnpm-lock.yaml`) and **no `node_modules`** at inspection time. Reproducible installs are not currently guaranteed.

---

## 4. Current project structure

```
app/
├── Actions/Fortify/            CreateNewUser, ResetUserPassword
├── Concerns/                   PasswordValidationRules, ProfileValidationRules
├── Console/Commands/           InstallFeaturesCommand (chisel leftover)
├── Http/
│   ├── Controllers/
│   │   ├── Controller.php
│   │   └── Settings/           ProfileController, SecurityController
│   ├── Middleware/             HandleAppearance, HandleInertiaRequests
│   └── Requests/Settings/      Profile/Password/2FA requests
├── Models/                     User only
├── Providers/                  AppServiceProvider, FortifyServiceProvider
└── ...

bootstrap/app.php               Routing, middleware, exception configuration
config/                         app, auth, cache, database, filesystems, fortify,
                                inertia, logging, mail, queue, services, session
database/
├── factories/UserFactory.php
├── migrations/                 users, cache, jobs, passkeys, 2FA columns
└── seeders/DatabaseSeeder.php

resources/
├── css/app.css                 Tailwind 4 theme + shadcn tokens
├── js/
│   ├── app.tsx                 Inertia app, layout resolution, theme init
│   ├── components/             app shell, nav, settings, 24 shadcn/Radix primitives
│   ├── hooks/                  appearance, clipboard, current URL, flash, mobile, 2FA
│   ├── layouts/                app (sidebar/header), auth (card/simple/split), settings
│   ├── lib/utils.ts
│   ├── pages/                  welcome, dashboard, auth/*, settings/*
│   └── types/                  auth, navigation, ui, global, vite-env
└── views/app.blade.php         Inertia root template (per-page Vite entry)

routes/
├── web.php                     `/` and `/dashboard`
├── settings.php                profile, security, appearance, passkey well-known
└── console.php

tests/
├── Feature/                    Auth, settings, dashboard, example
└── Unit/ExampleTest.php
```

### 4.1 Frontend integration notes specific to this starter kit

These are important because they differ from older Laravel/Inertia kits:

- **Inertia 3** is used. `app.tsx` uses `createInertiaApp({ layout, strictMode, withApp })`.
- Layouts are resolved **by page component name** in `resources/js/app.tsx` (`auth/*`, `settings/*`, default app layout). New module pages inherit `AppLayout` automatically.
- `resources/views/app.blade.php` loads a **page-specific Vite entry**:
  `@vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])`.
  Every new page therefore needs a real `.tsx` file at the matching path.
- **Wayfinder** generates `resources/js/routes`, `resources/js/actions`, and `resources/js/wayfinder` (all gitignored). These do not currently exist. TypeScript imports such as `@/routes` fail until `php artisan wayfinder:generate --with-form` or a Vite build/dev run generates them.
- **React Compiler** is enabled through Babel. Code must remain compiler-compatible (avoid patterns that mutate props/state during render).
- The UI baseline is **shadcn/Radix + Tailwind 4 tokens** in `resources/css/app.css`. There is no `tailwind.config.js` (Tailwind 4 CSS-first configuration).
- `config/inertia.php` has **SSR enabled** (`http://127.0.0.1:13714`) but no SSR bundle is present. This must be resolved deliberately (run SSR or disable it) to avoid confusing runtime behavior.

### 4.2 Authentication implementation

- Fortify features enabled: registration, password reset, email verification, 2FA (confirmed, password-confirmed), passkeys (password-confirmed).
- Login identifier: `email` (`config/fortify.php`).
- Login rate limit: 5/min per email+IP; passkeys 10/min; 2FA 5/min.
- `User` implements `MustVerifyEmail` and `PasskeyUser`; uses `HasFactory`, `Notifiable`, `PasskeyAuthenticatable`, `TwoFactorAuthenticatable`.
- `#[Fillable(['name', 'email', 'password'])]` and `#[Hidden([...])]` use Laravel 13 attributes.
- `CreateNewUser` validates name/email/password and creates a user.
- `ProfileController::destroy` logs the user out and **hard-deletes** the user.
- The dashboard route requires `auth` + `verified`.
- **No roles, permissions, policies, or gates exist.**

### 4.3 Routes (46 registered)

Application routes:

| Method | URI                              | Name                   | Handler                                            |
| ------ | -------------------------------- | ---------------------- | -------------------------------------------------- |
| GET    | `/`                              | `home`                 | `Route::inertia('welcome')`                        |
| GET    | `/dashboard`                     | `dashboard`            | `Route::inertia('dashboard')`, `auth` + `verified` |
| GET    | `/settings/profile`              | `profile.edit`         | `ProfileController@edit`                           |
| PATCH  | `/settings/profile`              | `profile.update`       | `ProfileController@update`                         |
| DELETE | `/settings/profile`              | `profile.destroy`      | `ProfileController@destroy`                        |
| GET    | `/settings/security`             | `security.edit`        | `SecurityController@edit`                          |
| PUT    | `/settings/password`             | `user-password.update` | `SecurityController@update`                        |
| GET    | `/settings/appearance`           | `appearance.edit`      | `Route::inertia`                                   |
| GET    | `/.well-known/passkey-endpoints` | `well-known.passkeys`  | Closure                                            |

The remainder are Fortify auth routes, Inertia devtools routes (development), and local storage routes.

### 4.4 Migrations and models

Applied migrations (batch 1):

1. `0001_01_01_000000_create_users_table` — `users`, `password_reset_tokens`, `sessions`
2. `0001_01_01_000001_create_cache_table`
3. `0001_01_01_000002_create_jobs_table`
4. `2024_01_01_000000_create_passkeys_table`
5. `2025_08_14_170933_add_two_factor_columns_to_users_table`

Only `App\Models\User` exists. There are **no Equb domain tables or models**.

### 4.5 Database and environment status

- `.env` has `DB_CONNECTION=mysql`, a local MySQL port, a database named `equb_management`, and `root` as the username. **The password is intentionally not reproduced.**
- MySQL 8.4.7 responded and `php artisan migrate:status` reports all 5 migrations as `Ran`. **The database connection works.**
- `SESSION_DRIVER=file`, `CACHE_STORE=file`, `QUEUE_CONNECTION=database`, `MAIL_MAILER=log`, `FILESYSTEM_DISK=local`.
- `APP_ENV=local`, `APP_DEBUG=true`, `APP_URL=http://localhost:8000`, timezone `UTC`, locale `en`.
- `.env.example` defaults to **SQLite** and `SESSION_DRIVER=database`, which does **not** match the working MySQL/file configuration. Onboarding another developer from `.env.example` will produce a different environment.

### 4.6 Notifications and queue

- `notifications` table is **absent** (Laravel's database notification channel needs it).
- `QUEUE_CONNECTION=database` is configured and `jobs`/`failed_jobs` exist.
- No queue worker or scheduler is configured for development.

---

## 5. What already works

- Laravel application boots; `php artisan` commands work.
- MySQL connection works; starter migrations are applied.
- Fortify authentication, password reset, email verification, 2FA, and passkeys are wired end-to-end.
- Inertia + React + TypeScript + Tailwind 4 render pipeline is present.
- Responsive app shell with collapsible sidebar, header, breadcrumbs, user menu, dark/light/system appearance.
- Profile and security settings pages.
- Existing feature tests for auth, settings, dashboard, and examples (currently blocked only by the missing asset manifest).
- GitHub Actions CI workflow (Ubuntu, PHP 8.3, Node 22) that runs lint, static analysis, and tests after `composer setup`.
- Pint, Larastan level 7, strict TypeScript, and Vite+ formatting/linting are configured.

---

## 6. Requirements coverage assessment

Legend: **Implemented** = production-usable; **Partial** = starter/placeholder; **Missing** = not present.

| Module                              | Status      | Assessment                                                                                                                                                               |
| ----------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Authentication & user management | **Partial** | Login/logout/reset/profile exist. No user admin, activation/deactivation, invitations, role assignment, phone login, or account lockout. Public registration is enabled. |
| 2. Roles & permissions              | **Missing** | Spatie not installed; no policies/gates; no permission matrix.                                                                                                           |
| 3. Member management                | **Missing** | No member profile, KYC, member number, or status.                                                                                                                        |
| 4. Equb group management            | **Missing** | No groups, staff assignment, capacity, or lifecycle.                                                                                                                     |
| 5. Equb rules & configuration       | **Missing** | No versioned rules, frequencies, deposit configuration, penalties, rotation, or terms.                                                                                   |
| 6. Membership & enrollment          | **Missing** | No requests, approvals, agreements, suspension, withdrawal.                                                                                                              |
| 7. Initial deposits                 | **Missing** | No rounds, obligations, verification, accumulation, or stage approval.                                                                                                   |
| 8. Contributions                    | **Missing** | No periods, obligations, payments, evidence, verification, receipts.                                                                                                     |
| 9. Member status classification     | **Missing** | No `MemberStatusService`; no GREEN/RED/BLUE logic; no overdue secondary flag.                                                                                            |
| 10. Payout scheduling & rotation    | **Missing** | No schedules, positions, rotation methods, duplicate prevention.                                                                                                         |
| 11. Payout management               | **Missing** | No approval/disbursement separation, funds check, receipts, BLUE transition.                                                                                             |
| 12. Financial management            | **Missing** | No chart of accounts, double-entry ledger, balances, adjustments, reconciliation.                                                                                        |
| 13. Penalties/defaults/withdrawals  | **Missing** | No penalty engine, extensions, waivers, refunds, disputes.                                                                                                               |
| 14. Notifications                   | **Missing** | No notifications table, templates, SMS/email adapters, announcements.                                                                                                    |
| 15. Reports & analytics             | **Missing** | Only placeholder dashboard cards.                                                                                                                                        |
| 16. Audit & system settings         | **Missing** | No audit logs, settings store, sequence generator.                                                                                                                       |
| UI/UX design system                 | **Partial** | Good shadcn/Radix + Tailwind 4 base. No domain components (data table, money input, status badges, summary cards, date filters, confirm dialogs).                        |
| Testing                             | **Partial** | Auth/settings tests exist; no domain tests. SQLite in-memory test DB diverges from MySQL.                                                                                |
| Deployment                          | **Missing** | No production deployment, queue worker, scheduler, backup, or monitoring configuration.                                                                                  |

---

## 7. Technical problems and risks

Severity: **Critical** blocks financial correctness/security; **High** blocks a phase; **Medium** should be fixed soon; **Low** cleanup.

| ID   | Severity          | Finding                                                                                                          | Impact                                                                                             | Recommendation                                                                                                                                |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | Critical          | Public self-registration is enabled.                                                                             | Anyone can create an account in an internal financial system.                                      | Disable Fortify registration; create users via admin invitation or supervised onboarding.                                                     |
| A-02 | Critical          | No roles/permissions/policies.                                                                                   | No authorization boundary; IDOR and privilege escalation likely once modules exist.                | Install `spatie/laravel-permission`; seed roles/permissions; add policies and `can:` middleware from day one.                                 |
| A-03 | Critical          | Starter `ProfileController@destroy` hard-deletes users.                                                          | Will fail with restrictive financial foreign keys, or destroy audit identity if cascades are used. | Replace with deactivation/anonymization workflow; never delete users with financial history.                                                  |
| A-04 | High              | No financial data model or ledger.                                                                               | Cannot guarantee balances, traceability, or corrections.                                           | Implement the double-entry ledger and immutable posting design in `DATABASE_DESIGN.md`.                                                       |
| A-05 | High              | `spatie/laravel-permission` absent.                                                                              | Required feature cannot start.                                                                     | `composer require spatie/laravel-permission`; publish/run its migration; seed roles.                                                          |
| A-06 | ~~High~~ Resolved | Test suite required a built frontend.                                                                            | Baseline was red; now green after `npm run build`.                                                 | Keep build step documented and run it before tests in CI/local.                                                                               |
| A-07 | High              | No JS lockfile and no `node_modules`.                                                                            | Non-reproducible frontend installs; CI and developers may get different trees.                     | Standardize on one package manager (`npm`, since it is installed), commit `package-lock.json`, remove/ignore `pnpm-workspace.yaml` if unused. |
| A-08 | High              | Wayfinder output is generated but gitignored and currently absent.                                               | TS imports from `@/routes` fail until generation.                                                  | Document `php artisan wayfinder:generate --with-form` in setup; ensure `npm run build/dev` generates it.                                      |
| A-09 | High              | No `notifications` table.                                                                                        | In-app/database notifications cannot persist.                                                      | `php artisan notifications:table` + migrate in Phase 2.                                                                                       |
| A-10 | High              | Money handling strategy not defined.                                                                             | Floats or inconsistent rounding would corrupt financial records.                                   | Use `DECIMAL(15,2)` columns + a `Money` value object based on integer santim; no float casts.                                                 |
| A-11 | Medium            | `.env.example` (SQLite, database session) contradicts working `.env` (MySQL, file session).                      | New developer/CI setup mismatch; hidden bugs.                                                      | Align `.env.example` with the supported MySQL/local setup and document required services.                                                     |
| A-12 | Medium            | `config/inertia.php` enables SSR without an SSR bundle.                                                          | Potential confusing runtime behavior; SSR is unnecessary initially.                                | Disable SSR for now or add `npm run build:ssr` + SSR server to the runbook.                                                                   |
| A-13 | Medium            | Chisel leftovers (`chisel.php`, `chisel-paths.php`, `InstallFeaturesCommand`, `composer.json` post-update hook). | Confusing setup path; `install:features` can modify the project unexpectedly.                      | Remove after confirming no more starter features are needed; remove the composer hook.                                                        |
| A-14 | Medium            | `DatabaseSeeder` creates `test@example.com` with a well-known password.                                          | Dangerous if seeded in a shared/staging environment.                                               | Replace with idempotent role/permission seeding + an explicit local-only admin creation command.                                              |
| A-15 | Medium            | Timezone `UTC`, locale `en`, app name `Laravel`, currency nowhere configured.                                    | Due dates, reports, and receipts will be ambiguous for Ethiopian operations.                       | Store timestamps in UTC, display in `Africa/Addis_Ababa`; add ETB currency + organization settings; decide Amharic localization scope.        |
| A-16 | Medium            | Tests use SQLite in-memory while production uses MySQL 8.4.                                                      | Decimal, CHECK, locking, and collation behavior differ.                                            | Run financial/concurrency tests against MySQL in CI; keep SQLite only for fast unit tests if desired.                                         |
| A-17 | Medium            | No domain factories/seeders.                                                                                     | Tests will be slow to write and fragile.                                                           | Add factories per aggregate with meaningful states.                                                                                           |
| A-18 | Medium            | No file-upload security policy.                                                                                  | KYC/payment evidence could leak or accept malicious files.                                         | Private disk, MIME/size validation, checksums, signed URLs, retention policy.                                                                 |
| A-19 | Medium            | No audit trail.                                                                                                  | Financial disputes cannot be investigated.                                                         | Append-only `audit_logs` + explicit financial event logging.                                                                                  |
| A-20 | Low               | Starter README is one line.                                                                                      | Poor onboarding.                                                                                   | Replace with setup, architecture links, and runbook.                                                                                          |
| A-21 | Low               | `APP_DEBUG=true` in local only (correct), but no production env checklist.                                       | Risk of debug leakage in production.                                                               | Add production checklist: `APP_DEBUG=false`, HTTPS, secure cookies, trusted proxies, log level.                                               |
| A-22 | Low               | `public/build` is correctly not committed, but no documented build step exists.                                  | New developers would see test failures.                                                            | Document `npm install && npm run build` and CI parity (also listed in the Phase 1.5 checklist).                                               |

### 7.1 Test baseline detail

At inspection time `php artisan test` failed because the root Blade template calls `@vite(...)` and no Vite manifest existed. That failure was **environmental**, not a logic failure in the starter tests. After installing frontend dependencies and running `npm run build`, the suite passes: **42 tests, 147 assertions**. This is the baseline gate for all subsequent phases.

The remaining caveat is that `phpunit.xml` uses SQLite in-memory. Financial, constraint, locking, and concurrency behavior must be tested against MySQL 8 before Phase 4; the current SQLite baseline is sufficient only for the starter's auth/settings suite.

### 7.2 Security findings summary

- Public registration must be disabled.
- No authorization layer yet.
- Account deletion conflicts with financial record retention.
- No audit trail for privileged or financial actions.
- No maker-checker controls yet.
- No file-upload controls yet.
- No security headers/CSP.
- No login lockout/account status enforcement beyond Fortify throttling.
- No PII encryption strategy for national IDs and payout accounts.
- Member accounts may not have email addresses; email-only login is a likely inclusion problem (see open decisions).

### 7.3 Data integrity findings summary

- No financial schema yet; no foreign keys, indexes, unique constraints, or transactions for domain data.
- No immutable ledger; no reversal/adjustment model.
- No concurrency-safe document numbering.
- No duplicate-payment/duplicate-payout prevention.
- No historical rule versioning; changing group rules later could silently alter past obligations if not designed correctly.

---

## 8. Verified runtime status

| Item                        | Status                         | Evidence                                                                        |
| --------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| PHP/Laravel boot            | **Works**                      | `php artisan --version` → 13.42.0; `php artisan about` succeeds                 |
| MySQL connection            | **Works**                      | `select version()` → 8.4.7; `migrate:status` lists 5 applied migrations         |
| Route registration          | **Works**                      | `php artisan route:list` → 46 routes                                            |
| Backend HTTP tests          | **Works**                      | `php artisan test` → 42 passed, 147 assertions                                  |
| Frontend dependency install | **Installed after inspection** | `npm install --no-package-lock`; no lockfile committed yet                      |
| Frontend production build   | **Works**                      | `npm run build` emitted `public/build/manifest.json` and assets                 |
| Wayfinder generated types   | **Generated**                  | `resources/js/routes`, `actions`, `wayfinder` created by the build (gitignored) |
| Queue worker                | **Not running**                | Configuration only                                                              |
| Scheduler                   | **Not configured**             | No scheduled commands                                                           |

> The starter suite is green after building assets. Do not “fix” future test failures by weakening asset assertions; keep the build step in CI and local setup documentation.

---

## 9. Recommended foundation hardening (before Phase 2)

These are small, low-risk changes that should be completed and verified as one pull request:

1. **Install and configure `spatie/laravel-permission`**
    - Publish config/migration, run migration, add `HasRoles` to `User`, seed the six roles and granular permissions.
    - Cache permissions in production.
2. **Disable public registration**
    - Remove `Features::registration()` from Fortify and the registration UI route.
    - Provide admin-created users and/or invitations instead.
3. **Make the test baseline green**
    - Standardize on npm, add `package-lock.json`, run `npm install`, `npm run build`.
    - Re-run `php artisan test`; document the exact command sequence.
4. **Resolve Wayfinder generation**
    - Document `php artisan wayfinder:generate --with-form`; ensure build/dev runs it.
5. **Align environments**
    - Update `.env.example` to the supported MySQL setup and consistent session/cache/queue drivers; add a `README.md` setup section.
    - Set `APP_NAME`, timezone policy (`UTC` storage, `Africa/Addis_Ababa` display), ETB currency setting.
6. **Remove Chisel leftovers** once starter features are finalized.
7. **Replace destructive account deletion** with a deactivation/anonymization design.
8. **Add the `notifications` table** and a notification preferences table.
9. **Decide SSR**: disable it for initial development or add an SSR runbook.
10. **Add CI parity**: MySQL service for financial tests (Phase 2+), Node version alignment, build step before tests.

> These are recommendations only. **No code was changed in Phase 1.**

---

## 10. Files that must not be casually changed

| File / area                                                      | Reason                                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `app/Models/User.php`                                            | Core identity model; Fortify/passkey/2FA traits and Laravel 13 attributes. Extend carefully. |
| `config/fortify.php`, `app/Providers/FortifyServiceProvider.php` | Authentication pipeline; changing features changes tests and security posture.               |
| `bootstrap/app.php`                                              | Middleware/exception pipeline.                                                               |
| `config/database.php`                                            | Connection semantics (strict mode, utf8mb4). Do not weaken strict mode.                      |
| `resources/views/app.blade.php`                                  | Per-page Vite entry and Inertia 3 root; page paths must match.                               |
| `resources/js/app.tsx`                                           | Layout resolution by component name; new modules must fit this convention.                   |
| `vite.config.ts`                                                 | Vite+, React Compiler, Wayfinder, Tailwind 4, formatting/lint rules.                         |
| Existing auth/settings tests                                     | They define the starter contract; extend rather than delete.                                 |

---

## 11. Key architectural conclusions

1. **Extend the starter kit.** Its auth, 2FA, passkeys, layout, and tooling are current and well chosen. Replacing it would add risk with no benefit.
2. **Use a modular monolith.** Keep one Laravel app; group business behavior by domain module; keep Eloquent models centralized for schema clarity.
3. **Version group rules.** Financial rules must be snapshot into cycles/obligations so later edits cannot rewrite history.
4. **Separate obligations from payments.** Obligations describe what is due; payments describe money submitted; verifications describe who accepted it and when. This prevents “paid” from being a mutable flag.
5. **Use a double-entry ledger.** Balances are derived, not hand-edited. Corrections are reversals/adjustments.
6. **Compute member color status; never store it.** `MemberStatusService` derives GREEN/RED/BLUE from verified obligations and completed payouts, plus a separate overdue flag.
7. **Separate approval from disbursement.** Approved payouts are not completed payouts.
8. **Make unresolved financial rules configurable and block activation until configured.** Do not silently choose a policy.

---

## 12. Recommended next phase

**Phase 1.5 — Foundation Hardening** (short), then **Phase 2 — Identity, Access, and Application Shell**.

Phase 2 scope: Spatie roles/permissions, user administration, activation/deactivation, password management, role assignment, policies, permission-aware navigation, member-facing layout, authenticated dashboard skeleton, audit foundation, and tests for unauthorized access.

See `IMPLEMENTATION_ROADMAP.md` for dependencies, exit criteria, and the decision gates that must be confirmed before Phase 4 (deposits) and Phase 6 (payouts).
