import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Clock, ShieldCheck, UserPlus, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { DataTable } from '@/components/data-table';
import { Pagination } from '@/components/pagination';
import { PageContainer } from '@/components/page-container';
import { QuickMemberModal } from '@/components/quick-member-modal';
import { StatusBadge } from '@/components/status-badge';
import { SummaryCard } from '@/components/summary-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import { formString } from '@/lib/form-data';
import type { MemberProfile, Paginated } from '@/types';

type Props = {
    members: Paginated<MemberProfile>;
    filters: {
        search?: string;
        status?: string;
        kyc_status?: string;
    };
};

const KYC_VARIANT: Record<string, string> = {
    verified:
        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400',
    pending:
        'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400',
    unverified:
        'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400',
    rejected:
        'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400',
};

export default function MembersIndex({ members, filters }: Props) {
    const { can } = usePermissions();
    const { t } = useTranslation();

    const applyFilters = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        router.get(
            '/members',
            {
                search: formString(form.get('search')),
                status: formString(form.get('status')),
                kyc_status: formString(form.get('kyc_status')),
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const verifiedCount = members.data.filter(
        (m) => m.kyc_status === 'verified',
    ).length;
    const pendingCount = members.data.filter(
        (m) => m.kyc_status === 'pending',
    ).length;

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('members.title'), href: '/members' },
        ],
    });

    return (
        <>
            <Head title={`${t('members.title')}`} />

            <PageContainer>
                {/* Header with Quick Member Modal */}
                <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            {t('members.title')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('members.centralRegistry')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {can('members.create') && (
                            <>
                                <QuickMemberModal
                                    trigger={
                                        <Button className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
                                            <UserPlus className="mr-1.5 size-4" />
                                            {t('members.registerMember')}
                                        </Button>
                                    }
                                />
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/members/create">
                                        {t('members.fullForm')}
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid w-full gap-4 sm:grid-cols-3">
                    <SummaryCard
                        label={t('members.totalMembers')}
                        value={members.total}
                        hint={t('members.centralRegistry')}
                        icon={Users}
                    />
                    <SummaryCard
                        label={t('members.kycVerified')}
                        value={verifiedCount}
                        hint={t('members.verified')}
                        icon={ShieldCheck}
                    />
                    <SummaryCard
                        label={t('members.pendingReview')}
                        value={pendingCount}
                        hint={t('common.pending')}
                        icon={Clock}
                    />
                </div>

                {/* Filters */}
                <form
                    onSubmit={applyFilters}
                    className="grid w-full gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder={t('members.searchPlaceholder')}
                        aria-label="Search members"
                        className="h-9 text-sm"
                    />
                    <select
                        name="status"
                        defaultValue={filters.status}
                        aria-label="Filter by status"
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs"
                    >
                        <option value="">{t('members.allStatuses')}</option>
                        <option value="active">{t('common.active')}</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>
                    <select
                        name="kyc_status"
                        defaultValue={filters.kyc_status}
                        aria-label="Filter by KYC status"
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs"
                    >
                        <option value="">{t('members.allKycStatuses')}</option>
                        <option value="unverified">
                            {t('members.unverified')}
                        </option>
                        <option value="pending">
                            {t('members.pendingReview')}
                        </option>
                        <option value="verified">
                            {t('members.verified')}
                        </option>
                        <option value="rejected">{t('common.rejected')}</option>
                    </select>
                    <div className="flex items-center gap-2">
                        <Button
                            type="submit"
                            variant="secondary"
                            size="sm"
                            className="h-9"
                        >
                            {t('members.applyFilter')}
                        </Button>
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-9"
                        >
                            <Link href="/members">{t('common.reset')}</Link>
                        </Button>
                    </div>
                </form>

                {/* Members Table */}
                <DataTable
                    rows={members.data}
                    getRowKey={(m) => m.id}
                    columns={[
                        {
                            key: 'member',
                            header: t('members.memberIdHeader'),
                            render: (m) => (
                                <div className="space-y-0.5">
                                    <div className="text-sm font-semibold text-foreground">
                                        {m.full_name}
                                    </div>
                                    <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                                        <span className="py-0.2 rounded bg-muted px-1.5 text-[11px]">
                                            {m.member_number}
                                        </span>
                                        <span>•</span>
                                        <span>{m.phone}</span>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: 'kyc',
                            header: t('members.kycDecision'),
                            render: (m) => (
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${KYC_VARIANT[m.kyc_status] ?? KYC_VARIANT.unverified}`}
                                >
                                    {m.kyc_status.replace('_', ' ')}
                                </span>
                            ),
                        },
                        {
                            key: 'status',
                            header: t('members.accountStatus'),
                            render: (m) => <StatusBadge status={m.status} />,
                        },
                        {
                            key: 'groups',
                            header: t('members.circlesJoined'),
                            render: (m) => (
                                <span className="rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                    {m.memberships_count ?? 0}{' '}
                                    {t('nav.equbGroups')}
                                </span>
                            ),
                        },
                        {
                            key: 'actions',
                            header: '',
                            className: 'text-right',
                            cellClassName: 'text-right',
                            render: (m) => (
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                >
                                    <Link href={`/members/${m.id}`}>
                                        {t('members.openProfile')}
                                    </Link>
                                </Button>
                            ),
                        },
                    ]}
                />

                <Pagination paginator={members} />
            </PageContainer>
        </>
    );
}
