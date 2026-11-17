import { Head, Link, useForm, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarClock,
    Coins,
    Compass,
    Lock,
    MapPin,
    RotateCw,
    ShieldCheck,
    Users,
    Vote,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { formatEtb } from '@/components/money';
import { PageContainer } from '@/components/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import type { EqubGroup, EqubGroupRule, GovernanceMembership, GroupVisibility } from '@/types';

setLayoutProps({
    breadcrumbs: [
        { title: 'Discover Groups', href: '/explore' },
        { title: 'Group Detail', href: '#' },
    ],
});

type Props = {
    group: EqubGroup & {
        active_memberships_count: number;
        active_rule?: EqubGroupRule | null;
    };
};

const FREQ_LABEL: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
};

const ROTATION_LABEL: Record<string, string> = {
    lottery: 'Lottery Draw',
    predetermined: 'Pre-determined Order',
    committee: 'Committee Decision',
};

const VISIBILITY_LABEL: Record<GroupVisibility, string> = {
    public: 'Public',
    private: 'Private',
    invite_only: 'Invite Only',
};

function StatItem({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#759B46]/10 text-[#759B46]">
                <Icon className="size-5" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
                {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
            </div>
        </div>
    );
}

export default function ExploreShow({ group }: Props) {
    const { t } = useTranslation();
    useFlashToast();

    const rule = group.active_rule;
    const memberCount = group.active_memberships_count ?? 0;
    const slots = group.max_members - memberCount;
    const isFull = slots <= 0;
    const fillPct = Math.min(100, (memberCount / (group.max_members || 1)) * 100);

    const { post, processing } = useForm({});

    function handleJoin(e: FormEvent) {
        e.preventDefault();
        post(`/groups/${group.id}/join`);
    }

    return (
        <>
            <Head title={`${group.name} — Equb Circle`} />

            <PageContainer>
                {/* Back link */}
                <div>
                    <Link
                        href="/explore"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Discover
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main detail card */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Group header */}
                        <Card className="rounded-2xl border-border/70 shadow-xs overflow-hidden">
                            {/* Accent bar */}
                            <div
                                className="h-1.5 w-full"
                                style={{ backgroundColor: isFull ? '#d1d5db' : '#759B46' }}
                            />
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-xl">{group.name}</CardTitle>
                                        <CardDescription className="font-mono text-xs mt-1">
                                            {group.group_code}
                                        </CardDescription>
                                    </div>
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                            group.visibility === 'public'
                                                ? 'border-[#759B46]/30 bg-[#759B46]/10 text-[#759B46]'
                                                : 'border-border bg-muted text-muted-foreground',
                                        )}
                                    >
                                        {VISIBILITY_LABEL[group.visibility ?? 'public']}
                                    </span>
                                </div>

                                {group.description && (
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        {group.description}
                                    </p>
                                )}

                                {group.location && (
                                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <MapPin className="size-4 shrink-0" />
                                        {group.location}
                                    </p>
                                )}
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Member fill */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <Users className="size-4" />
                                            {memberCount} of {group.max_members} members
                                        </span>
                                        {isFull ? (
                                            <span className="font-medium text-muted-foreground">Group Full</span>
                                        ) : (
                                            <span className="font-semibold text-[#759B46]">
                                                {slots} open slot{slots !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${fillPct}%`,
                                                backgroundColor: isFull ? '#9ca3af' : '#759B46',
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rule details */}
                        {rule && (
                            <Card className="rounded-2xl border-border/70 shadow-xs">
                                <CardHeader>
                                    <CardTitle className="text-base">Circle Rules & Terms</CardTitle>
                                    <CardDescription>
                                        These rules are immutable once the group activates.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <StatItem
                                            icon={RotateCw}
                                            label="Contribution Amount"
                                            value={formatEtb(rule.contribution_amount)}
                                            sub={FREQ_LABEL[rule.contribution_frequency] ?? rule.contribution_frequency}
                                        />
                                        <StatItem
                                            icon={ShieldCheck}
                                            label="Initial Security Deposit"
                                            value={formatEtb(rule.initial_deposit_amount)}
                                            sub={`× ${rule.initial_deposit_rounds} round(s)`}
                                        />
                                        <StatItem
                                            icon={Coins}
                                            label="Estimated Pot per Round"
                                            value={formatEtb(rule.estimated_pot_amount)}
                                            sub="Before deductions"
                                        />
                                        <StatItem
                                            icon={Vote}
                                            label="Payout Method"
                                            value={ROTATION_LABEL[rule.rotation_method] ?? rule.rotation_method}
                                        />
                                    </div>

                                    {/* Payout commencement */}
                                    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Payouts commence when
                                        </p>
                                        <p className="text-sm text-foreground">
                                            {rule.payout_commencement_rule === 'deposit_completion_and_date'
                                                ? 'All deposits collected AND scheduled date reached'
                                                : rule.payout_commencement_rule === 'deposit_completion_only'
                                                  ? 'All initial deposits collected'
                                                  : rule.payout_commencement_rule === 'scheduled_date_only'
                                                    ? 'Scheduled commencement date reached'
                                                    : 'Manual approval by group organizer'}
                                        </p>
                                        {rule.payout_commencement_date && (
                                            <p className="text-xs text-muted-foreground">
                                                Target date:{' '}
                                                {new Date(rule.payout_commencement_date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Penalty info */}
                                    {rule.late_penalty_enabled && (
                                        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                                            <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium text-foreground">Late payment penalty applies</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Grace: {rule.late_penalty_grace_days} day(s) ·{' '}
                                                    Fixed: {formatEtb(rule.late_penalty_fixed_amount)} ·{' '}
                                                    Daily rate: {rule.late_penalty_daily_rate}%
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Membership admission */}
                                    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                                        <Lock className="size-4 shrink-0 text-muted-foreground" />
                                        <span className="text-foreground">
                                            Admission:{' '}
                                            <span className="font-medium">
                                                {rule.membership_mode === 'auto_admit'
                                                    ? 'Automatic — join instantly after request'
                                                    : 'Approval required — organizer reviews requests'}
                                            </span>
                                        </span>
                                    </div>

                                    {rule.terms_and_conditions && (
                                        <details className="rounded-xl border border-border/60">
                                            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30 rounded-xl">
                                                Terms & Conditions
                                            </summary>
                                            <div className="border-t border-border/40 px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                {rule.terms_and_conditions}
                                            </div>
                                        </details>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar: Join CTA */}
                    <div className="space-y-4">
                        <Card className="rounded-2xl border-border/70 shadow-xs sticky top-20">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Compass className="size-5 text-[#759B46]" />
                                    Join This Circle
                                </CardTitle>
                                <CardDescription>
                                    {isFull
                                        ? 'This group has reached its maximum membership capacity.'
                                        : rule?.membership_mode === 'auto_admit'
                                          ? 'Request to join — your membership will be activated automatically.'
                                          : 'Request to join — the group organizer will review your application.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!isFull && (
                                    <>
                                        {rule && (
                                            <div className="rounded-xl bg-[#759B46]/5 border border-[#759B46]/20 p-3 space-y-1.5 text-sm">
                                                <p className="text-xs font-semibold text-[#759B46] uppercase tracking-wide">
                                                    What you commit to
                                                </p>
                                                <ul className="space-y-1 text-muted-foreground">
                                                    <li>
                                                        Initial deposit:{' '}
                                                        <span className="font-medium text-foreground">
                                                            {formatEtb(rule.initial_deposit_amount)} ×{' '}
                                                            {rule.initial_deposit_rounds} round(s)
                                                        </span>
                                                    </li>
                                                    <li>
                                                        {FREQ_LABEL[rule.contribution_frequency]} contribution:{' '}
                                                        <span className="font-medium text-foreground">
                                                            {formatEtb(rule.contribution_amount)}
                                                        </span>
                                                    </li>
                                                    <li>
                                                        Members cap:{' '}
                                                        <span className="font-medium text-foreground">
                                                            {group.max_members}
                                                        </span>
                                                    </li>
                                                </ul>
                                            </div>
                                        )}

                                        <form onSubmit={handleJoin}>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="w-full bg-[#759B46] hover:bg-[#5F8037] text-white font-medium"
                                            >
                                                {processing
                                                    ? 'Submitting request…'
                                                    : rule?.membership_mode === 'auto_admit'
                                                      ? 'Join Now'
                                                      : 'Request to Join'}
                                            </Button>
                                        </form>

                                        <p className="text-center text-xs text-muted-foreground">
                                            You need an account to join.{' '}
                                            <Link
                                                href="/register"
                                                className="text-[#759B46] hover:underline font-medium"
                                            >
                                                Register free
                                            </Link>
                                        </p>
                                    </>
                                )}

                                {isFull && (
                                    <div className="rounded-xl border border-border/60 bg-muted/20 py-6 text-center text-sm text-muted-foreground">
                                        This circle is currently full.
                                        <br />
                                        <Link
                                            href="/explore"
                                            className="mt-2 inline-block text-[#759B46] hover:underline font-medium text-xs"
                                        >
                                            Browse other circles →
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Governance info */}
                        <Card className="rounded-2xl border-border/70 shadow-xs">
                            <CardContent className="pt-5 space-y-2 text-sm">
                                <p className="font-semibold text-foreground">Member-governed</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Once active, group rule changes require a passed member vote.
                                    Every decision and vote is permanently recorded.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageContainer>
        </>
    );
}
