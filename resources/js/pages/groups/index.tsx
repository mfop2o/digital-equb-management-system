import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    ArrowRight,
    CircleDot,
    Coins,
    Plus,
    RotateCw,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { Pagination } from '@/components/pagination';
import { PageContainer } from '@/components/page-container';
import { QuickGroupModal } from '@/components/quick-group-modal';
import { SummaryCard } from '@/components/summary-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import { formString } from '@/lib/form-data';
import { cn } from '@/lib/utils';
import type { EqubGroup, Paginated } from '@/types';

type Props = {
    groups: Paginated<EqubGroup>;
    filters: { search?: string; status?: string };
};

const STATUS_LABEL: Record<string, string> = {
    draft: 'Draft',
    registration: 'Registration',
    deposit_stage: 'Deposit Stage',
    active: 'Active',
    completed: 'Completed',
    suspended: 'Suspended',
    cancelled: 'Cancelled',
};

const STATUS_DOT: Record<string, string> = {
    active: 'bg-emerald-500',
    registration: 'bg-slate-400',
    deposit_stage: 'bg-emerald-600',
    draft: 'bg-slate-300',
    completed: 'bg-slate-400',
    suspended: 'bg-red-400',
    cancelled: 'bg-red-400',
};

const STATUS_BADGE: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900',
    registration:
        'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400',
    deposit_stage:
        'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300',
    draft: 'bg-slate-100 text-slate-500 ring-slate-200',
    completed: 'bg-slate-100 text-slate-500 ring-slate-200',
    suspended: 'bg-red-50 text-red-600 ring-red-200',
    cancelled: 'bg-red-50 text-red-600 ring-red-200',
};

function GroupCard({ group }: { group: EqubGroup }) {
    const rule = group.active_rule;
    const memberCount = group.active_memberships_count ?? 0;
    const fillPct = Math.min(100, (memberCount / group.max_members) * 100);
    const status = group.status;

    return (
        <Link
            href={`/groups/${group.id}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:border-emerald-500/40 hover:shadow-md"
        >
            {/* Top colour accent bar */}
            <div
                className={cn(
                    'h-1 w-full',
                    status === 'active'
                        ? 'bg-emerald-500'
                        : status === 'deposit_stage'
                          ? 'bg-emerald-600'
                          : status === 'suspended' || status === 'cancelled'
                            ? 'bg-red-400'
                            : 'bg-slate-300',
                )}
            />

            <div className="flex flex-1 flex-col gap-4 p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm leading-snug font-semibold text-foreground transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                            {group.name}
                        </h3>
                        <span className="font-mono text-[11px] text-muted-foreground">
                            {group.group_code}
                        </span>
                    </div>
                    {/* Status pill */}
                    <span
                        className={cn(
                            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1',
                            STATUS_BADGE[status] ?? STATUS_BADGE.draft,
                        )}
                    >
                        <span
                            className={cn(
                                'size-1.5 shrink-0 rounded-full',
                                STATUS_DOT[status] ?? 'bg-slate-300',
                            )}
                        />
                        {STATUS_LABEL[status] ?? status}
                    </span>
                </div>

                {/* Contribution amount */}
                {rule ? (
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                            <Coins className="size-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-mono text-base leading-none font-bold text-foreground">
                                {Number(
                                    rule.contribution_amount,
                                ).toLocaleString()}{' '}
                                <span className="text-xs font-normal text-muted-foreground">
                                    ETB
                                </span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                                {rule.contribution_frequency} contribution
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Coins className="size-4 shrink-0" />
                        <span>Rules not configured</span>
                    </div>
                )}

                {/* Members progress */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="size-3.5" />
                            Members
                        </span>
                        <span className="font-medium tabular-nums">
                            {memberCount} / {group.max_members}
                        </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all',
                                fillPct >= 100
                                    ? 'bg-emerald-500'
                                    : fillPct > 0
                                      ? 'bg-emerald-400'
                                      : 'bg-slate-300',
                            )}
                            style={{ width: `${fillPct}%` }}
                        />
                    </div>
                </div>

                {/* Category tag */}
                {group.category && (
                    <span className="self-start rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                        {group.category}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-5 py-3 dark:border-border/40">
                <span className="text-xs text-muted-foreground">
                    {rule?.initial_deposit_rounds
                        ? `${rule.initial_deposit_rounds} deposit rounds`
                        : 'No deposits'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 transition-all group-hover:gap-2 dark:text-emerald-400">
                    Manage <ArrowRight className="size-3.5" />
                </span>
            </div>
        </Link>
    );
}

export default function GroupsIndex({ groups, filters }: Props) {
    const { can } = usePermissions();
    const { t } = useTranslation();

    const applyFilters = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        router.get(
            '/groups',
            {
                search: formString(form.get('search')),
                status: formString(form.get('status')),
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const activeCount = groups.data.filter((g) => g.status === 'active').length;

    setLayoutProps({
        breadcrumbs: [{ title: 'Equb Groups', href: '/groups' }],
    });

    return (
        <>
            <Head title={t('groups.title')} />

            <PageContainer>
                {/* Header */}
                <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            {t('groups.title')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('groups.description')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {can('groups.create') && (
                            <>
                                <QuickGroupModal
                                    trigger={
                                        <Button className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
                                            <Plus className="mr-1.5 size-4" />
                                            {t('groups.createGroup')}
                                        </Button>
                                    }
                                />
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/groups/create">
                                        {t('common.create')}
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard
                        label={t('groups.title')}
                        value={groups.total}
                        hint="All configured groups"
                        icon={CircleDot}
                    />
                    <SummaryCard
                        label={t('common.active')}
                        value={activeCount}
                        hint="Currently collecting"
                        icon={RotateCw}
                    />
                    <SummaryCard
                        label={t('common.currency')}
                        value="ETB"
                        hint="Ethiopian Birr"
                        icon={Coins}
                    />
                </div>

                {/* Filters */}
                <form
                    onSubmit={applyFilters}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder={t('common.search')}
                        className="h-9 w-64 text-sm"
                    />
                    <select
                        name="status"
                        defaultValue={filters.status}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                        <option value="">{t('common.all')}</option>
                        {Object.entries(STATUS_LABEL).map(([v, l]) => (
                            <option key={v} value={v}>
                                {l}
                            </option>
                        ))}
                    </select>
                    <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        className="h-9"
                    >
                        {t('common.filter')}
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="h-9">
                        <Link href="/groups">{t('common.reset')}</Link>
                    </Button>
                </form>

                {/* Cards grid */}
                {groups.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                        <CircleDot className="size-12 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('groups.noGroups')}
                        </p>
                        {can('groups.create') && (
                            <QuickGroupModal
                                trigger={
                                    <Button
                                        size="sm"
                                        className="mt-2 bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        <Plus className="mr-1.5 size-4" />
                                        {t('groups.createGroup')}
                                    </Button>
                                }
                            />
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {groups.data.map((g) => (
                            <GroupCard key={g.id} group={g} />
                        ))}
                    </div>
                )}

                <Pagination paginator={groups} />
            </PageContainer>
        </>
    );
}
