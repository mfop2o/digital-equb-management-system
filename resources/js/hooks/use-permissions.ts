import { usePage } from '@inertiajs/react';

/**
 * Client-side permission helpers.
 *
 * These only decide what to render. Every action is re-checked on the server by
 * middleware and policies.
 */
export function usePermissions() {
    const { auth } = usePage().props;

    const can = (permission: string): boolean =>
        auth.is_super_admin || auth.permissions.includes(permission);

    return {
        user: auth.user,
        roles: auth.roles,
        permissions: auth.permissions,
        isSuperAdmin: auth.is_super_admin,
        isAuditor: auth.is_auditor,
        mustChangePassword: auth.must_change_password,
        twoFactorEnabled: auth.two_factor_enabled,
        can,
        canAny: (...permissions: string[]): boolean =>
            auth.is_super_admin ||
            permissions.some((permission) =>
                auth.permissions.includes(permission),
            ),
        hasRole: (role: string): boolean => auth.roles.includes(role),
    };
}
