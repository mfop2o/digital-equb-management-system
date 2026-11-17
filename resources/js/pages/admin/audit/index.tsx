import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { FileSearch } from 'lucide-react';
import type { FormEvent } from 'react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formString } from '@/lib/form-data';
import type { Paginated } from '@/types';

type AuditRow = {
    id: number;
    event: string;
    user: { id: number; name: string } | null;
    equb_group_id: number | null;
    auditable_type: string | null;
    auditable_id: number | null;
    transaction_reference: string | null;
    ip_address: string | null;
    created_at: string | null;
    created_at_display: string | null;
};

type Props = {
    logs: Paginated<AuditRow>;
    filters: {
        event: string;
        user_id: string;
        from: string;
        to: string;
    };
    events: string[];
    users: { id: number; name: string }[];
};

function subjectLabel(row: AuditRow): string {
    if (row.auditable_type === null) {
        return '—';
    }

    return row.auditable_id === null
        ? row.auditable_type
        : `${row.auditable_type} #${row.auditable_id}`;
}

export default function AuditIndex({ logs, filters, events, users }: Props) {
    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);

        router.get(
            '/admin/audit',
            {
                event: formString(form.get('event')),
                user_id: formString(form.get('user_id')),
                from: formString(form.get('from')),
                to: formString(form.get('to')),
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    setLayoutProps({
        breadcrumbs: [{ title: 'Audit log', href: '/admin/audit' }],
    });

    return (
        <>
            <Head title="Audit log" />

            <PageContainer>
                <PageHeader
                    title="Audit log"
                    description="An append-only record of security and administration events. Entries are never edited or deleted."
                />

                <form
                    onSubmit={applyFilters}
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5"
                >
                    <select
                        name="event"
                        defaultValue={filters.event}
                        aria-label="Filter by event"
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                    >
                        <option value="">All events</option>
                        {events.map((event) => (
                            <option key={event} value={event}>
                                {event}
                            </option>
                        ))}
                    </select>

                    <select
                        name="user_id"
                        defaultValue={filters.user_id}
                        aria-label="Filter by actor"
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                    >
                        <option value="">All actors</option>
                        {users.map((user) => (
                            <option key={user.id} value={String(user.id)}>
                                {user.name}
                            </option>
                        ))}
                    </select>

                    <Input
                        type="date"
                        name="from"
                        defaultValue={filters.from}
                        aria-label="From date"
                    />

                    <Input
                        type="date"
                        name="to"
                        defaultValue={filters.to}
                        aria-label="To date"
                    />

                    <div className="flex items-center gap-2">
                        <Button type="submit" variant="secondary">
                            Apply
                        </Button>
                        <Button asChild variant="ghost">
                            <Link href="/admin/audit">Reset</Link>
                        </Button>
                    </div>
                </form>

                <DataTable
                    rows={logs.data}
                    getRowKey={(row) => row.id}
                    empty={
                        <EmptyState
                            title="No audit entries match the filters"
                            description="Clear the filters to see the full trail."
                        />
                    }
                    columns={[
                        {
                            key: 'event',
                            header: 'Event',
                            render: (row) => (
                                <div className="space-y-1">
                                    <Badge
                                        variant="outline"
                                        className="font-mono text-xs"
                                    >
                                        {row.event}
                                    </Badge>
                                    {row.transaction_reference && (
                                        <div className="font-mono text-xs text-muted-foreground">
                                            {row.transaction_reference}
                                        </div>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'actor',
                            header: 'Actor',
                            render: (row) =>
                                row.user === null ? (
                                    <span className="text-xs text-muted-foreground">
                                        System / unauthenticated
                                    </span>
                                ) : (
                                    <span className="text-sm">
                                        {row.user.name}
                                    </span>
                                ),
                        },
                        {
                            key: 'subject',
                            header: 'Subject',
                            render: (row) => (
                                <span className="text-xs text-muted-foreground">
                                    {subjectLabel(row)}
                                </span>
                            ),
                        },
                        {
                            key: 'group',
                            header: 'Group',
                            render: (row) => (
                                <span className="text-xs text-muted-foreground">
                                    {row.equb_group_id === null
                                        ? '—'
                                        : `#${row.equb_group_id}`}
                                </span>
                            ),
                        },
                        {
                            key: 'ip',
                            header: 'IP address',
                            render: (row) => (
                                <span className="font-mono text-xs text-muted-foreground">
                                    {row.ip_address ?? '—'}
                                </span>
                            ),
                        },
                        {
                            key: 'created_at',
                            header: 'When',
                            render: (row) => (
                                <span className="text-xs text-muted-foreground">
                                    {row.created_at_display ??
                                        row.created_at ??
                                        '—'}
                                </span>
                            ),
                        },
                        {
                            key: 'actions',
                            header: '',
                            className: 'text-right',
                            cellClassName: 'text-right',
                            render: (row) => (
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/admin/audit/${row.id}`}>
                                        <FileSearch />
                                        Inspect
                                    </Link>
                                </Button>
                            ),
                        },
                    ]}
                />

                <Pagination paginator={logs} />
            </PageContainer>
        </>
    );
}
