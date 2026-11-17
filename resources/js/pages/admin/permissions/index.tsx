import { Head, setLayoutProps } from '@inertiajs/react';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type PermissionGroup = {
    module: string;
    permissions: { name: string; roles: string[] }[];
};

export default function PermissionsIndex({
    groups,
    canManagePermissions,
}: {
    groups: PermissionGroup[];
    canManagePermissions: boolean;
}) {
    setLayoutProps({
        breadcrumbs: [{ title: 'Permissions', href: '/admin/permissions' }],
    });

    return (
        <>
            <Head title="Permissions" />

            <PageContainer>
                <PageHeader
                    title="Permissions"
                    description="The complete permission catalog and the roles currently granted each permission. Permissions are defined in code and cannot be created at runtime."
                    actions={
                        canManagePermissions ? (
                            <Badge variant="secondary">
                                Editable via role matrix
                            </Badge>
                        ) : undefined
                    }
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    {groups.map((group) => (
                        <Card key={group.module}>
                            <CardHeader>
                                <CardTitle className="capitalize">
                                    {group.module}
                                </CardTitle>
                                <CardDescription>
                                    {group.permissions.length} permissions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y">
                                    {group.permissions.map((permission) => (
                                        <div
                                            key={permission.name}
                                            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <code className="text-xs">
                                                {permission.name}
                                            </code>
                                            <div className="flex flex-wrap gap-1">
                                                {permission.roles.length ===
                                                0 ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        No roles
                                                    </span>
                                                ) : (
                                                    permission.roles.map(
                                                        (role) => (
                                                            <Badge
                                                                key={role}
                                                                variant="outline"
                                                                className="capitalize"
                                                            >
                                                                {role.replaceAll(
                                                                    '-',
                                                                    ' ',
                                                                )}
                                                            </Badge>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </PageContainer>
        </>
    );
}
