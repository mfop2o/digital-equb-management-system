<?php

namespace App\Support;

/**
 * Single source of truth for the permission catalog.
 *
 * Permissions are grouped by the module they protect. The seeder, the role
 * editor, and the permissions reference page all read from here so a new
 * permission cannot drift between code paths.
 */
final class PermissionCatalog
{
    /**
     * @var array<string, array<int, string>>
     */
    public const GROUPED = [
        'administration' => [
            'settings.view',
            'settings.update',
            'users.view',
            'users.create',
            'users.update',
            'users.deactivate',
            'users.unlock',
            'users.reset_password',
            'users.assign_roles',
            'roles.view',
            'roles.manage',
            'permissions.manage',
            'audit.view',
        ],
        'members' => [
            'members.view',
            'members.view_own',
            'members.create',
            'members.update',
            'members.deactivate',
            'members.verify',
            'members.override_duplicate',
            'members.view_sensitive',
        ],
        'groups' => [
            'groups.view',
            'groups.create',
            'groups.update',
            'groups.activate',
            'groups.close',
            'groups.assign_staff',
            'rules.view',
            'rules.configure',
            'rules.activate',
            'rules.approve',
            'agreements.view',
            'agreements.manage',
        ],
        'memberships' => [
            'memberships.view',
            'memberships.request',
            'memberships.approve',
            'memberships.reject',
            'memberships.suspend',
            'memberships.withdraw',
        ],
        'deposits' => [
            'deposits.view',
            'deposits.generate',
            'deposits.record',
            'deposits.verify',
            'deposits.approve_stage',
        ],
        'contributions' => [
            'contributions.view',
            'contributions.generate',
            'contributions.record',
            'contributions.verify',
        ],
        'payments' => [
            'payments.view',
            'payments.record',
            'payments.submit_own',
            'payments.verify',
            'payments.reverse',
            'receipts.view',
            'receipts.view_own',
            'receipts.void',
        ],
        'payouts' => [
            'payouts.view',
            'payouts.view_own',
            'payouts.schedule',
            'payouts.request',
            'payouts.approve',
            'payouts.disburse',
            'payouts.reverse',
        ],
        'finance' => [
            'ledger.view',
            'ledger.post',
            'adjustments.request',
            'adjustments.approve',
            'reconciliations.view',
            'reconciliations.prepare',
            'reconciliations.review',
            'reconciliations.approve',
            'reports.view_financial',
            'reports.export',
        ],
        'penalties' => [
            'penalties.view',
            'penalties.assess',
            'penalties.waive',
            'penalties.extend',
        ],
        'exits' => [
            'withdrawals.request',
            'withdrawals.approve',
            'refunds.process',
            'complaints.view',
            'complaints.manage',
        ],
        'governance' => [
            'governance.view',
            'governance.create',
            'governance.vote',
        ],
        'communication' => [
            'notifications.view_own',
            'notifications.manage',
            'announcements.view',
            'announcements.manage',
        ],
        'dashboard' => [
            'dashboard.view',
        ],
    ];

    /**
     * All permission names in catalog order.
     *
     * @return array<int, string>
     */
    public static function names(): array
    {
        return array_merge(...array_values(self::GROUPED));
    }

    /**
     * Role to permission mapping.
     *
     * `super-admin` receives the full catalog implicitly. The other roles
     * receive explicit grants. This lives in the catalog (not the seeder) so
     * group-scoped authority can be derived from the same single source.
     *
     * @var array<string, array<int, string>>
     */
    public const ROLE_PERMISSIONS = [
        'admin' => [
            'settings.view',
            'users.view', 'users.create', 'users.update', 'users.deactivate', 'users.unlock', 'users.reset_password', 'users.assign_roles',
            'roles.view', 'audit.view',
            'members.view', 'members.create', 'members.update', 'members.deactivate', 'members.verify', 'members.view_sensitive',
            'groups.view', 'groups.create', 'groups.update', 'groups.assign_staff',
            'rules.view', 'rules.approve',
            'agreements.view', 'agreements.manage',
            'memberships.view', 'memberships.approve', 'memberships.reject', 'memberships.suspend',
            'deposits.view', 'deposits.record', 'deposits.verify', 'deposits.approve_stage',
            'contributions.view', 'contributions.record', 'contributions.verify',
            'payments.view', 'payments.record', 'payments.verify', 'receipts.view',
            'payouts.view', 'payouts.schedule', 'payouts.request', 'payouts.approve',
            'ledger.view', 'adjustments.approve', 'reconciliations.view',
            'penalties.view', 'penalties.waive',
            'withdrawals.approve', 'complaints.view', 'complaints.manage',
            'notifications.view_own', 'notifications.manage', 'announcements.view', 'announcements.manage',
            'reports.view_financial', 'reports.export', 'dashboard.view',
        ],
        'organizer' => [
            'members.view', 'members.create', 'members.update', 'members.verify',
            'groups.view', 'groups.create', 'groups.update',
            'rules.view', 'rules.configure',
            'agreements.view', 'agreements.manage',
            'memberships.view', 'memberships.approve', 'memberships.reject', 'memberships.suspend',
            'governance.view', 'governance.create',
            'deposits.view', 'deposits.generate',
            'contributions.view', 'contributions.generate',
            'payments.view', 'payouts.view', 'payouts.schedule', 'payouts.request',
            'reports.view_financial', 'reports.export', 'dashboard.view',
            'notifications.view_own', 'announcements.view',
        ],
        'treasurer' => [
            'members.view',
            'groups.view',
            'rules.view',
            'memberships.view',
            'governance.view',
            'deposits.view', 'deposits.record', 'deposits.verify',
            'contributions.view', 'contributions.record', 'contributions.verify',
            'payments.view', 'payments.record', 'payments.verify', 'receipts.view', 'receipts.void',
            'payouts.view', 'payouts.request', 'payouts.disburse',
            'ledger.view', 'reconciliations.view', 'reconciliations.prepare',
            'penalties.view', 'penalties.assess', 'penalties.waive', 'penalties.extend',
            'refunds.process', 'reports.view_financial', 'reports.export', 'dashboard.view',
            'notifications.view_own', 'announcements.view',
        ],
        'auditor' => [
            'members.view', 'groups.view', 'rules.view', 'agreements.view', 'memberships.view',
            'governance.view',
            'deposits.view', 'contributions.view', 'payments.view', 'receipts.view',
            'payouts.view', 'ledger.view', 'reconciliations.view', 'penalties.view',
            'reports.view_financial', 'audit.view', 'dashboard.view',
            'notifications.view_own', 'announcements.view',
        ],
        'member' => [
            'members.view_own', 'memberships.request', 'memberships.view',
            'groups.view', 'groups.create',
            'governance.view', 'governance.vote', 'governance.create',
            'payments.submit_own', 'receipts.view_own', 'payouts.view_own',
            'withdrawals.request', 'notifications.view_own', 'announcements.view', 'dashboard.view',
        ],
    ];

    /**
     * The module that owns a permission, if known.
     */
    public static function moduleFor(string $permission): ?string
    {
        foreach (self::GROUPED as $module => $permissions) {
            if (in_array($permission, $permissions, true)) {
                return $module;
            }
        }

        return null;
    }
}
