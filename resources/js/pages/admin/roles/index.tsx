import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type RoleRow = {
    id: number;
    name: string;
    users_count: number;
    permissions_count: number;
    is_super_admin: boolean;
};

export default function RolesIndex({
    roles,
    canManagePermissions,
}: {
    roles: RoleRow[];
    canManagePermissions: boolean;
}) {
    setLayoutProps({
        breadcrumbs: [{ title: 'Roles', href: '/admin/roles' }],
    });

    return (
        <>
            <Head title="Roles" />

            <PageContainer>
                <PageHeader
                    title="Roles"
                    description="The six operational roles are fixed. Permissions attached to each role are configurable and audited."
                    actions={
                        canManagePermissions ? (
                            <Badge variant="secondary">
                                Permission editing enabled
                            </Badge>
                        ) : undefined
                    }
                />

                <DataTable
                    rows={roles}
                    getRowKey={(role) => role.id}
                    columns={[
                        {
                            key: 'role',
                            header: 'Role',
                            render: (role) => (
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-muted-foreground" />
                                    <span className="font-medium capitalize">
                                        {role.name.replaceAll('-', ' ')}
                                    </span>
                                    {role.is_super_admin && (
                                        <Badge variant="outline">
                                            Bypasses checks
                                        </Badge>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'users',
                            header: 'Users',
                            render: (role) => role.users_count,
                        },
                        {
                            key: 'permissions',
                            header: 'Permissions',
                            render: (role) => role.permissions_count,
                        },
                        {
                            key: 'actions',
                            header: '',
                            className: 'text-right',
                            cellClassName: 'text-right',
                            render: (role) => (
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/admin/roles/${role.id}/edit`}>
                                        Review
                                    </Link>
                                </Button>
                            ),
                        },
                    ]}
                />

                <p className="text-sm text-muted-foreground">
                    Super administrators pass every authorization check. Their
                    permission rows are kept aligned with the catalog for
                    reporting, but removing a row does not remove their bypass.
                </p>
            </PageContainer>
        </>
    );
}
