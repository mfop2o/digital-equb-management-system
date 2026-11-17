<?php

namespace App\Providers;

use App\Listeners\RecordRoleChange;
use App\Models\AuditLog;
use App\Models\User;
use App\Observers\UserObserver;
use App\Policies\AuditLogPolicy;
use App\Policies\PermissionPolicy;
use App\Policies\RolePolicy;
use App\Policies\UserPolicy;
use App\Services\AuditService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Events\RoleAttachedEvent;
use Spatie\Permission\Events\RoleDetachedEvent;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        User::observe(UserObserver::class);

        Event::listen(RoleAttachedEvent::class, RecordRoleChange::class);
        Event::listen(RoleDetachedEvent::class, RecordRoleChange::class);

        $this->registerAuthorization();
    }

    /**
     * Register policies and the super-admin bypass.
     */
    private function registerAuthorization(): void
    {
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(Permission::class, PermissionPolicy::class);
        Gate::policy(AuditLog::class, AuditLogPolicy::class);

        Gate::before(function (User $user, string $ability): ?bool {
            if (! $user->isSuperAdmin()) {
                return null;
            }

            $this->auditOverride($ability);

            return true;
        });
    }

    /**
     * Record a mutating super-admin override once per ability and request.
     *
     * Read-only checks are intentionally not logged; otherwise every page load
     * would add noise to the audit trail. The marker lives on the request so a
     * long-lived application instance cannot suppress later requests.
     */
    private function auditOverride(string $ability): void
    {
        if (app()->runningInConsole()) {
            return;
        }

        $request = request();

        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return;
        }

        $key = 'equb.audit_override.'.$request->method().'|'.$ability;

        if ($request->attributes->has($key)) {
            return;
        }

        $request->attributes->set($key, true);

        app(AuditService::class)->log('authorization.super_admin_override', null, [], [
            'ability' => $ability,
            'method' => $request->method(),
            'path' => $request->path(),
        ]);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
