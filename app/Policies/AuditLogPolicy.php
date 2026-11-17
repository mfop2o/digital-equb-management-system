<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;

/**
 * Audit entries are append-only and readable by anyone with `audit.view`.
 */
class AuditLogPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can('audit.view');
    }

    public function view(User $actor, AuditLog $auditLog): bool
    {
        return $actor->can('audit.view');
    }

    public function create(User $actor): bool
    {
        return false;
    }

    public function update(User $actor, AuditLog $auditLog): bool
    {
        return false;
    }

    public function delete(User $actor, AuditLog $auditLog): bool
    {
        return false;
    }
}
