import { Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowUpRight,
    CircleDot,
    Coins,
    ScrollText,
    ShieldCheck,
    TrendingUp,
    UserCheck,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';

type Metric = { key: string; label: string; value: number; hint: string };
type RecentGroup = {
    id: number;
    name: string;
    group_code: string;
    status: string;
    status_label: string;
    max_members: number;
    active_members_count: number;
    contribution_amount: number;
    contribution_frequency: string;
};
type RecentMember = {
    id: number;
    member_number: string;
    full_name: string;
    phone: string;
    status: string;
    kyc_status: string;
    created_at: string;
};
type Props = {
    metrics: Metric[];
    recentGroups?: RecentGroup[];
    recentMembers?: RecentMember[];
    account: {
        name: string;
        email: string;
        roles: string[];
        status: string;
        status_label: string;
        last_login_at: string | null;
        two_factor_enabled: boolean;
    };
};

const METRIC_CONFIG: Record<
    string,
    { icon: LucideIcon; color: string; bg: string }
> = {
    groups: {
        icon: CircleDot,
        color: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 ring-emerald-500/20',
    },
    members: {
        icon: Users,
        color: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 ring-emerald-500/20',
    },
    users: {
        icon: ShieldCheck,
        color: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 ring-emerald-500/20',
    },
    audit: {
        icon: ScrollText,
        color: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-500/10 ring-slate-500/20',
    },
};

const GROUP_STATUS_COLORS: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800',
    registration:
        'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300',
    deposit_stage:
        'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300',
    draft: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
    completed: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    suspended: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

function MetricCard({ metric }: { metric: Metric }) {
    const cfg = METRIC_CONFIG[metric.key] ?? {
        icon: TrendingUp,
        color: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 ring-emerald-500/20',
    };
    const Icon = cfg.icon;

    return (
        <div className="group relative flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 text-card-foreground shadow-xs transition-all duration-200 hover:shadow-md hover:border-emerald-500/30">
            <div className="min-w-0 space-y-1 flex-1">
                <p className="truncate text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {metric.label}
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl tabular-nums">
                    {metric.value.toLocaleString()}
                </p>
                <p className="truncate text-xs text-muted-foreground/80">
                    {metric.hint}
                </p>
            </div>
            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105 ${cfg.bg}`}>
                <Icon className={`size-5 ${cfg.color}`} />
            </div>
        </div>
    );
}

function MemberStatusBadge({ status }: { status: string }) {
    if (status === 'verified')
        return (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800">
                Verified
            </span>
        );
    return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400">
            Unverified
        </span>
    );
}

export default function Dashboard({
    metrics,
    recentGroups = [],
    recentMembers = [],
    account,
}: Props) {
    const { can } = usePermissions();
    const { t } = useTranslation();
    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? 'Good morning'
            : hour < 17
              ? 'Good afternoon'
              : 'Good evening';
    const firstName = account.name.split(' ')[0];

    setLayoutProps({
        breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
    });

    return (
        <>
            <Head title={t('nav.dashboard')} />
            <PageContainer size="wide" className="space-y-6">
                {/* ── Top Bar ── */}
                <div className="border-b border-border/50 pb-3">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {greeting}, {firstName}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {t('dashboard.subtitle')}
                    </p>
                </div>

                {/* ── Metric Cards ── */}
                {metrics.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {metrics.map((m) => (
                            <MetricCard key={m.key} metric={m} />
                        ))}
                    </div>
                )}

                {/* ── Main Activity Grid ── */}
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Equb Groups — 3 cols */}
                    <Card className="rounded-2xl border border-border/70 shadow-xs lg:col-span-3">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <CircleDot className="size-4 text-emerald-600" />
                                    {t('nav.equbGroups')}
                                </CardTitle>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {t('groups.description')}
                                </p>
                            </div>
                            {can('groups.view') && (
                                <Link
                                    href="/groups"
                                    className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                                >
                                    {t('dashboard.viewAllGroups')}{' '}
                                    <ArrowUpRight className="size-3.5" />
                                </Link>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                                    <CircleDot className="size-8 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">
                                        {t('dashboard.noRecentGroups')}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {recentGroups.map((g) => (
                                        <div
                                            key={g.id}
                                            className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                                                    {g.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-0.5 flex items-center gap-2">
                                                        <span className="truncate text-sm font-semibold text-foreground">
                                                            {g.name}
                                                        </span>
                                                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                                            {g.group_code}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Coins className="size-3.5 shrink-0 text-emerald-600" />
                                                        <span className="font-medium text-foreground">
                                                            {Number(
                                                                g.contribution_amount,
                                                            ).toLocaleString()}{' '}
                                                            ETB
                                                        </span>
                                                        <span className="text-muted-foreground/40">·</span>
                                                        <Users className="size-3.5 shrink-0" />
                                                        <span>
                                                            {g.active_members_count}/{g.max_members} members
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-3 flex shrink-0 items-center gap-2.5">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${GROUP_STATUS_COLORS[g.status] ?? 'bg-slate-100 text-slate-500'}`}
                                                >
                                                    {g.status_label}
                                                </span>
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                                >
                                                    <Link href={`/groups/${g.id}`}>
                                                        {t('common.view')}
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Members — 2 cols */}
                    <Card className="rounded-2xl border border-border/70 shadow-xs lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <UserCheck className="size-4 text-emerald-600" />
                                    {t('nav.members')}
                                </CardTitle>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {t('members.subtitle')}
                                </p>
                            </div>
                            {can('members.view') && (
                                <Link
                                    href="/members"
                                    className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                                >
                                    {t('dashboard.viewAllMembers')}{' '}
                                    <ArrowUpRight className="size-3.5" />
                                </Link>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentMembers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                                    <Users className="size-8 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">
                                        {t('dashboard.noRecentMembers')}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {recentMembers.map((m) => (
                                        <div
                                            key={m.id}
                                            className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold text-xs">
                                                    {m.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-foreground">
                                                        {m.full_name}
                                                    </p>
                                                    <div className="mt-0.5 flex items-center gap-2">
                                                        <MemberStatusBadge
                                                            status={m.kyc_status}
                                                        />
                                                        <span className="font-mono text-[11px] text-muted-foreground">
                                                            {m.phone}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="ghost"
                                                className="ml-2 h-8 rounded-lg shrink-0 text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                            >
                                                <Link href={`/members/${m.id}`}>
                                                    {t('common.view')}
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </PageContainer>
        </>
    );
}
