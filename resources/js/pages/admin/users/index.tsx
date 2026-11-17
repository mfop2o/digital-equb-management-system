import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import type { FormEvent } from 'react';
import { DataTable } from '@/components/data-table';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formString } from '@/lib/form-data';
import type { Paginated } from '@/types';

type ManagedUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    status_label: string;
    roles: string[];
    email_verified_at: string | null;
    last_login_at: string | null;
    must_change_password: boolean;
    is_super_admin: boolean;
    is_auditor: boolean;
    is_self: boolean;
};

type Props = {
    users: Paginated<ManagedUser>;
    filters: {
        search: string;
        status: string;
        role: string;
    };
    roles: string[];
    statuses: { value: string; label: string }[];
    canCreate: boolean;
};

function formatDateTime(value: string | null): string {
    if (!value) {
        return 'Never';
    }

    return new Date(value).toLocaleString();
}

export default function UsersIndex({
    users,
    filters,
    roles,
    statuses,
    canCreate,
}: Props) {
    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);

        router.get(
            '/admin/users',
            {
                search: formString(form.get('search')),
                status: formString(form.get('status')),
                role: formString(form.get('role')),
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    setLayoutProps({
        breadcrumbs: [{ title: 'Users', href: '/admin/users' }],
    });

    return (
        <>
            <Head title="Users" />

            <PageContainer>
                <PageHeader
                    title="Users"
                    description="Provision staff accounts, assign roles, and manage access. Accounts are deactivated, never deleted."
                    actions={
                        canCreate ? (
                            <Button asChild>
                                <Link href="/admin/users/create">
                                    <UserPlus />
                                    Invite user
                                </Link>
                            </Button>
                        ) : undefined
                    }
                />

                <form
                    onSubmit={applyFilters}
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Search name, email, phone"
                        aria-label="Search users"
                    />
                    <select
                        name="status"
                        defaultValue={filters.status}
                        aria-label="Filter by status"
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                    >
                        <option value="">All statuses</option>
                        {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    <select
                        name="role"
                        defaultValue={filters.role}
                        aria-label="Filter by role"
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                    >
                        <option value="">All roles</option>
                        {roles.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2">
                        <Button type="submit" variant="secondary">
                            Apply
                        </Button>
                        <Button asChild variant="ghost">
                            <Link href="/admin/users">Reset</Link>
                        </Button>
                    </div>
                </form>

                <DataTable
                    rows={users.data}
                    getRowKey={(user) => user.id}
                    columns={[
                        {
                            key: 'user',
                            header: 'User',
                            render: (user) => (
                                <div className="space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">
                                            {user.name}
                                        </span>
                                        {user.is_super_admin && (
                                            <Badge variant="outline">
                                                Super admin
                                            </Badge>
                                        )}
                                        {user.is_self && (
                                            <Badge variant="secondary">
                                                You
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {user.email}
                                        {user.phone ? ` · ${user.phone}` : ''}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: 'roles',
                            header: 'Roles',
                            render: (user) =>
                                user.roles.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">
                                        No roles
                                    </span>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles.map((role) => (
                                            <Badge
                                                key={role}
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {role.replaceAll('-', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                ),
                        },
                        {
                            key: 'status',
                            header: 'Status',
                            render: (user) => (
                                <div className="space-y-1">
                                    <StatusBadge
                                        status={user.status}
                                        label={user.status_label}
                                    />
                                    {user.must_change_password && (
                                        <div className="text-xs text-muted-foreground">
                                            Password change pending
                                        </div>
                                    )}
                                    {!user.email_verified_at && (
                                        <div className="text-xs text-muted-foreground">
                                            Invitation not accepted
                                        </div>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'last_login',
                            header: 'Last sign-in',
                            render: (user) => (
                                <span className="text-xs text-muted-foreground">
                                    {formatDateTime(user.last_login_at)}
                                </span>
                            ),
                        },
                        {
                            key: 'actions',
                            header: '',
                            className: 'text-right',
                            cellClassName: 'text-right',
                            render: (user) => (
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/admin/users/${user.id}/edit`}>
                                        Open
                                    </Link>
                                </Button>
                            ),
                        },
                    ]}
                />

                <Pagination paginator={users} />
            </PageContainer>
        </>
    );
}
