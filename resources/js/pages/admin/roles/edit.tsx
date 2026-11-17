import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type PermissionRow = {
    name: string;
    assigned: boolean;
};

type PermissionGroup = {
    module: string;
    permissions: PermissionRow[];
};

type Props = {
    role: {
        id: number;
        name: string;
        is_super_admin: boolean;
    };
    groups: PermissionGroup[];
    canManagePermissions: boolean;
};

export default function EditRole({
    role,
    groups,
    canManagePermissions,
}: Props) {
    const initialPermissions = groups.flatMap((group) =>
        group.permissions
            .filter((permission) => permission.assigned)
            .map((permission) => permission.name),
    );

    const { data, setData, put, processing, errors, isDirty } = useForm<{
        permissions: string[];
    }>({
        permissions: initialPermissions,
    });

    const togglePermission = (permission: string, checked: boolean) => {
        setData(
            'permissions',
            checked
                ? [...data.permissions, permission]
                : data.permissions.filter((item) => item !== permission),
        );
    };

    const toggleModule = (group: PermissionGroup, checked: boolean) => {
        const names = group.permissions.map((permission) => permission.name);

        setData(
            'permissions',
            checked
                ? [...new Set([...data.permissions, ...names])]
                : data.permissions.filter((name) => !names.includes(name)),
        );
    };

    const moduleChecked = (group: PermissionGroup): boolean =>
        group.permissions.every((permission) =>
            data.permissions.includes(permission.name),
        );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(`/admin/roles/${role.id}/permissions`, { preserveScroll: true });
    };

    setLayoutProps({
        breadcrumbs: [{ title: 'Roles', href: '/admin/roles' }],
    });

    return (
        <>
            <Head title={`Role: ${role.name}`} />

            <PageContainer>
                <PageHeader
                    title={role.name.replaceAll('-', ' ')}
                    description="Grant or revoke granular permissions for this role. Changes take effect immediately and are audited."
                    actions={
                        <Button asChild variant="outline">
                            <Link href="/admin/roles">
                                <ArrowLeft />
                                Back to roles
                            </Link>
                        </Button>
                    }
                />

                {role.is_super_admin && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
                        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                        <p>
                            Super administrators bypass every authorization
                            check. This matrix is maintained for audit clarity,
                            not as their effective permission source.
                        </p>
                    </div>
                )}

                {!canManagePermissions && (
                    <Badge variant="outline">
                        Read-only: you cannot change role permissions.
                    </Badge>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {groups.map((group) => (
                            <Card key={group.module}>
                                <CardHeader className="flex flex-row items-start justify-between gap-3">
                                    <div>
                                        <CardTitle className="capitalize">
                                            {group.module}
                                        </CardTitle>
                                        <CardDescription>
                                            {group.permissions.length}{' '}
                                            permissions
                                        </CardDescription>
                                    </div>
                                    <label className="flex items-center gap-2 text-xs">
                                        <Checkbox
                                            checked={moduleChecked(group)}
                                            disabled={!canManagePermissions}
                                            onCheckedChange={(checked) =>
                                                toggleModule(
                                                    group,
                                                    checked === true,
                                                )
                                            }
                                        />
                                        All
                                    </label>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                    {group.permissions.map((permission) => (
                                        <label
                                            key={permission.name}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={data.permissions.includes(
                                                    permission.name,
                                                )}
                                                disabled={!canManagePermissions}
                                                onCheckedChange={(checked) =>
                                                    togglePermission(
                                                        permission.name,
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <code className="text-xs">
                                                {permission.name}
                                            </code>
                                        </label>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <InputError message={errors.permissions} />

                    {canManagePermissions && (
                        <div className="flex items-center gap-2">
                            <Button
                                type="submit"
                                disabled={processing || !isDirty}
                            >
                                Save permissions
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                {data.permissions.length} selected
                            </span>
                        </div>
                    )}
                </form>
            </PageContainer>
        </>
    );
}
