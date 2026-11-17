<?php

namespace App\Listeners;

use App\Services\AuditService;
use Illuminate\Support\Collection;
use Spatie\Permission\Contracts\Role;
use Spatie\Permission\Events\RoleAttachedEvent;
use Spatie\Permission\Events\RoleDetachedEvent;

/**
 * Audit role grants and revocations performed through Spatie.
 */
class RecordRoleChange
{
    public function __construct(private readonly AuditService $audit) {}

    public function handle(RoleAttachedEvent|RoleDetachedEvent $event): void
    {
        $name = $event instanceof RoleAttachedEvent ? 'role.attached' : 'role.detached';

        $this->audit->log($name, $event->model, [], [
            'roles' => $this->roleNames($event->rolesOrIds),
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function roleNames(mixed $rolesOrIds): array
    {
        if ($rolesOrIds instanceof Collection) {
            $rolesOrIds = $rolesOrIds->all();
        }

        if (! is_array($rolesOrIds)) {
            $rolesOrIds = [$rolesOrIds];
        }

        /** @var class-string<Role> $roleModel */
        $roleModel = config('permission.models.role');

        return collect($rolesOrIds)
            ->map(function ($role) use ($roleModel): ?string {
                if ($role instanceof Role) {
                    return $role->name;
                }

                return $roleModel::query()->whereKey($role)->value('name');
            })
            ->filter()
            ->values()
            ->all();
    }
}
