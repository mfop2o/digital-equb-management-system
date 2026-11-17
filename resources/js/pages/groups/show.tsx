import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    CircleDot,
    Coins,
    Edit3,
    RotateCw,
    ShieldCheck,
    Sparkles,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { GroupNavigation } from '@/components/group-navigation';
import { formatEtb } from '@/components/money';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { SummaryCard } from '@/components/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import type { EqubGroup, EqubMembership, MemberProfile } from '@/types';

type SimpleMember = Pick<
    MemberProfile,
    | 'id'
    | 'member_number'
    | 'first_name'
    | 'middle_name'
    | 'last_name'
    | 'phone'
>;

type Props = {
    group: EqubGroup;
    availableMembers: SimpleMember[];
};

const STATUS_LABEL: Record<string, string> = {
    draft: 'Draft',
    registration: 'Registration',
    deposit_stage: 'Deposit Stage',
    active: 'Active & Rotating',
    completed: 'Completed',
    suspended: 'Suspended',
    cancelled: 'Cancelled',
};

function EnrollDialog({
    group,
    availableMembers,
}: {
    group: EqubGroup;
    availableMembers: SimpleMember[];
}) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        member_profile_id: '',
        role: 'member',
        payout_order_number: '1',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(`/groups/${group.id}/enroll`, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                >
                    <UserPlus className="size-4" />
                    Enroll member
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Users className="size-5 text-emerald-600" />
                        Enroll member into {group.name}
                    </DialogTitle>
                    <DialogDescription>
                        Select a registered member to join this Equb circle.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="member_profile_id">Member</Label>
                        <select
                            id="member_profile_id"
                            value={data.member_profile_id}
                            onChange={(e) =>
                                setData('member_profile_id', e.target.value)
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            required
                        >
                            <option value="">
                                Choose member from central registry…
                            </option>
                            {availableMembers.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.first_name} {m.middle_name} (
                                    {m.member_number}) — {m.phone}
                                </option>
                            ))}
                        </select>
                        {errors.member_profile_id && (
                            <p className="text-xs text-destructive">
                                {errors.member_profile_id}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="role">Group role</Label>
                        <select
                            id="role"
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <option value="member">Regular member (አባል)</option>
                            <option value="organizer">
                                Equb organizer (ዳኛ)
                            </option>
                            <option value="treasurer">
                                Treasurer (ገንዘብ ያዥ)
                            </option>
                            <option value="auditor">Auditor (ተቆጣጣሪ)</option>
                        </select>
                    </div>

                    {group.active_rule?.rotation_method === 'predetermined' &&
                        data.role === 'member' && (
                            <div className="space-y-1.5">
                                <Label htmlFor="payout_order_number">
                                    Payout rotation number
                                </Label>
                                <Input
                                    id="payout_order_number"
                                    type="number"
                                    min={1}
                                    value={data.payout_order_number}
                                    onChange={(e) =>
                                        setData(
                                            'payout_order_number',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="1 = receives the first pot"
                                    className="font-mono"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Fixed payout order agreed for predetermined
                                    rotation.
                                </p>
                            </div>
                        )}

                    {data.role === 'organizer' &&
                        (group.active_rule?.initial_deposit_rounds ?? 0) >
                            0 && (
                            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-800 dark:text-blue-300">
                                Organizers are active members and must satisfy
                                the same initial deposit obligations as everyone
                                else.
                            </div>
                        )}

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={processing}
                        >
                            {processing ? 'Enrolling…' : 'Enroll in circle'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ConfigureRulesDialog({ group }: { group: EqubGroup }) {
    const [open, setOpen] = useState(false);
    const rule = group.active_rule;

    const { data, setData, post, processing, errors } = useForm({
        contribution_amount: rule ? String(rule.contribution_amount) : '1000',
        contribution_frequency: rule ? rule.contribution_frequency : 'monthly',
        expected_members: rule
            ? String(rule.expected_members)
            : String(group.max_members),
        initial_deposit_rounds: rule
            ? String(rule.initial_deposit_rounds)
            : '2',
        initial_deposit_amount: rule
            ? String(rule.initial_deposit_amount)
            : '500',
        initial_deposit_treatment: rule
            ? rule.initial_deposit_treatment
            : 'retained',
        payout_commencement_rule: rule
            ? rule.payout_commencement_rule
            : 'deposit_completion_and_date',
        payout_commencement_date: rule?.payout_commencement_date ?? '',
        rotation_method: rule ? rule.rotation_method : 'predetermined',
        allow_partial_contributions: rule
            ? rule.allow_partial_contributions
            : false,
        late_penalty_enabled: rule ? rule.late_penalty_enabled : true,
        late_penalty_fixed_amount: rule
            ? String(rule.late_penalty_fixed_amount)
            : '50',
        late_penalty_daily_rate: rule
            ? String(rule.late_penalty_daily_rate)
            : '0',
        late_penalty_grace_days: rule ? rule.late_penalty_grace_days : 3,
        terms_and_conditions: rule?.terms_and_conditions ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(`/groups/${group.id}/rules`, {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Edit3 className="size-4" />
                    Configure rules
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Edit3 className="size-4 text-emerald-600" />
                        Configure financial rules — {group.name}
                    </DialogTitle>
                    <DialogDescription>
                        Financial rules are versioned. Saving creates version{' '}
                        {(rule?.version ?? 0) + 1} with an immutable audit
                        record.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="cfr-amt">
                                Contribution amount (ETB)
                            </Label>
                            <Input
                                id="cfr-amt"
                                type="number"
                                min={1}
                                step="0.01"
                                value={data.contribution_amount}
                                onChange={(e) =>
                                    setData(
                                        'contribution_amount',
                                        e.target.value,
                                    )
                                }
                                required
                                className="font-mono"
                            />
                            {errors.contribution_amount && (
                                <p className="text-xs text-destructive">
                                    {errors.contribution_amount}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cfr-freq">Frequency</Label>
                            <select
                                id="cfr-freq"
                                value={data.contribution_frequency}
                                onChange={(e) =>
                                    setData(
                                        'contribution_frequency',
                                        e.target
                                            .value as typeof data.contribution_frequency,
                                    )
                                }
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="monthly">Monthly (በወር)</option>
                                <option value="biweekly">
                                    Bi-weekly (በሁለት ሳምንት)
                                </option>
                                <option value="weekly">Weekly (በሳምንት)</option>
                                <option value="daily">Daily (በየቀኑ)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="cfr-dep-rounds">
                                Deposit rounds
                            </Label>
                            <Input
                                id="cfr-dep-rounds"
                                type="number"
                                min={0}
                                max={12}
                                value={data.initial_deposit_rounds}
                                onChange={(e) =>
                                    setData(
                                        'initial_deposit_rounds',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cfr-dep-amt">
                                Deposit amount per round (ETB)
                            </Label>
                            <Input
                                id="cfr-dep-amt"
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.initial_deposit_amount}
                                onChange={(e) =>
                                    setData(
                                        'initial_deposit_amount',
                                        e.target.value,
                                    )
                                }
                                className="font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="cfr-rot">Rotation method</Label>
                            <select
                                id="cfr-rot"
                                value={data.rotation_method}
                                onChange={(e) =>
                                    setData(
                                        'rotation_method',
                                        e.target
                                            .value as typeof data.rotation_method,
                                    )
                                }
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="predetermined">
                                    Predetermined fixed order
                                </option>
                                <option value="lottery">
                                    Lottery draw (ዕጣ)
                                </option>
                                <option value="committee">
                                    Committee selection
                                </option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cfr-grace">
                                Late penalty grace (days)
                            </Label>
                            <Input
                                id="cfr-grace"
                                type="number"
                                min={0}
                                max={30}
                                value={data.late_penalty_grace_days}
                                onChange={(e) =>
                                    setData(
                                        'late_penalty_grace_days',
                                        Number(e.target.value),
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={processing}
                        >
                            {processing ? 'Saving…' : 'Save new rules version'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RuleRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-right text-xs font-semibold capitalize">
                {value}
            </dd>
        </div>
    );
}

export default function ShowGroup({ group, availableMembers }: Props) {
    const { can } = usePermissions();
    const { t } = useTranslation();
    const rule = group.active_rule;
    const memberships = group.memberships ?? [];
    const activeCount =
        group.active_memberships_count ?? memberships.length ?? 0;
    const pot = rule
        ? Number(rule.contribution_amount) * rule.expected_members
        : null;

    const activateGroup = () => {
        router.post(`/groups/${group.id}/activate`);
    };

    const ruleRows: Array<[string, ReactNode]> = rule
        ? [
              ['Contribution amount', formatEtb(rule.contribution_amount)],
              ['Frequency', rule.contribution_frequency],
              ['Expected members', `${rule.expected_members} members`],
              ['Deposit rounds', `${rule.initial_deposit_rounds} rounds`],
              [
                  'Deposit per round',
                  rule.initial_deposit_rounds > 0
                      ? formatEtb(rule.initial_deposit_amount)
                      : 'Not applicable',
              ],
              ['Deposit treatment', 'Retained by the group'],
              [
                  'Commencement condition',
                  rule.payout_commencement_rule.replace(/_/g, ' '),
              ],
              [
                  'Commencement date',
                  rule.payout_commencement_date ??
                      'Immediate after deposit completion',
              ],
              ['Rotation mechanism', rule.rotation_method],
              [
                  'Partial contributions',
                  rule.allow_partial_contributions
                      ? 'Permitted'
                      : 'Exact full payments only',
              ],
              [
                  'Late payment penalty',
                  rule.late_penalty_enabled
                      ? `Enabled · ${rule.late_penalty_grace_days} day grace`
                      : 'Disabled',
              ],
          ]
        : [];

    setLayoutProps({
        breadcrumbs: [
            { title: 'Equb Groups', href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
        ],
    });

    return (
        <>
            <Head title={`${group.name} — ${t('groups.circleDetail')}`} />

            <PageContainer>
                <PageHeader
                    eyebrow={`${t('groups.groupCode')}: ${group.group_code}`}
                    title={group.name}
                    description={
                        group.category
                            ? `${t('groups.category')}: ${group.category}`
                            : undefined
                    }
                    icon={CircleDot}
                    backHref="/groups"
                    backLabel={t('nav.equbGroups')}
                    actions={
                        <>
                            <StatusBadge
                                status={group.status}
                                label={
                                    STATUS_LABEL[group.status] ?? group.status
                                }
                            />
                            {rule && (
                                <Badge
                                    variant="outline"
                                    className="font-mono text-[11px]"
                                >
                                    {t('groups.ruleVersion')} {rule.version}
                                </Badge>
                            )}
                            {can('rules.configure') && (
                                <ConfigureRulesDialog group={group} />
                            )}
                            {can('memberships.approve') &&
                                group.status !== 'completed' &&
                                group.status !== 'cancelled' && (
                                    <EnrollDialog
                                        group={group}
                                        availableMembers={availableMembers}
                                    />
                                )}
                            {can('groups.activate') &&
                                group.status === 'draft' && (
                                    <ConfirmDialog
                                        title={t('groups.activateGroup')}
                                        description={`This will formally activate "${group.name}". Once activated, rotating contribution cycles and deposit rounds can begin.`}
                                        onConfirm={activateGroup}
                                        trigger={
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                            >
                                                {t('groups.activateGroup')}
                                            </Button>
                                        }
                                        destructive={false}
                                        confirmLabel={t('common.confirm')}
                                    />
                                )}
                        </>
                    }
                />

                <GroupNavigation groupId={group.id} />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label={t('groups.activeMembers')}
                        value={`${activeCount} / ${group.max_members}`}
                        hint={t('groups.maxMembers')}
                        icon={Users}
                        tone="emerald"
                    />
                    <SummaryCard
                        label={t('groups.contributionAmount')}
                        value={rule ? formatEtb(rule.contribution_amount) : '—'}
                        hint={
                            rule
                                ? `${t('groups.contributionFrequency')}: ${rule.contribution_frequency}`
                                : 'Pending rule'
                        }
                        icon={Coins}
                        tone="blue"
                    />
                    <SummaryCard
                        label={t('groups.depositRounds')}
                        value={rule ? `${rule.initial_deposit_rounds}` : '—'}
                        hint={
                            rule && rule.initial_deposit_rounds > 0
                                ? `${formatEtb(rule.initial_deposit_amount)} per round`
                                : 'No initial deposit'
                        }
                        icon={ShieldCheck}
                        tone="emerald"
                    />
                    <SummaryCard
                        label={t('groups.rotationMethod')}
                        value={
                            rule?.rotation_method === 'predetermined'
                                ? 'Fixed order'
                                : (rule?.rotation_method ?? '—')
                        }
                        hint={
                            pot !== null
                                ? `Pot: ${formatEtb(pot)}`
                                : t('groups.rotationMethod')
                        }
                        icon={RotateCw}
                        tone="violet"
                    />
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    {rule ? (
                        <Card className="rounded-2xl border border-border/70 shadow-xs lg:col-span-2">
                            <CardHeader className="flex flex-row items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-semibold">
                                        {t('groups.activeRules')}
                                    </CardTitle>
                                    <CardDescription>
                                        Version {rule.version} ·{' '}
                                        {rule.configured_by?.name ??
                                            'System administrator'}
                                    </CardDescription>
                                </div>
                                {pot !== null && (
                                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                        {formatEtb(pot)}
                                    </span>
                                )}
                            </CardHeader>
                            <CardContent>
                                <dl className="grid gap-x-8 sm:grid-cols-2">
                                    {ruleRows.map(([label, value]) => (
                                        <RuleRow
                                            key={label}
                                            label={label}
                                            value={value}
                                        />
                                    ))}
                                </dl>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="rounded-2xl border border-border/70 shadow-xs lg:col-span-2">
                            <CardContent className="py-4">
                                <EmptyState
                                    title="No active rules"
                                    description="Configure contribution and deposit rules to start operating this circle."
                                />
                            </CardContent>
                        </Card>
                    )}

                    <Card className="rounded-2xl border border-border/70 shadow-xs">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Sparkles className="size-4 text-emerald-600" />
                                Circle Overview
                            </CardTitle>
                            <CardDescription>
                                Status, member capacity and cycle summary
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="mb-1.5 flex items-center justify-between text-xs">
                                    <span className="font-medium text-muted-foreground">
                                        Member Capacity
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {activeCount} / {group.max_members}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-emerald-500 transition-all"
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                (activeCount /
                                                    group.max_members) *
                                                    100,
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5 rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Cycle Pot Size
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                        {pot !== null ? formatEtb(pot) : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Payout Schedule
                                    </span>
                                    <span className="font-medium text-foreground capitalize">
                                        {rule?.contribution_frequency ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Rotation Method
                                    </span>
                                    <span className="font-medium text-foreground capitalize">
                                        {rule?.rotation_method ?? '—'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-2xl border border-border/70 shadow-xs">
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div>
                            <CardTitle className="text-base">
                                Enrolled members &amp; payout rotation
                            </CardTitle>
                            <CardDescription>
                                {activeCount} active members of{' '}
                                {group.max_members} maximum capacity
                            </CardDescription>
                        </div>
                        {can('memberships.approve') && (
                            <EnrollDialog
                                group={group}
                                availableMembers={availableMembers}
                            />
                        )}
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            rows={memberships}
                            getRowKey={(m: EqubMembership) => m.id}
                            empty={
                                <EmptyState
                                    title="No members enrolled"
                                    description="Enroll registered members to begin this Equb circle."
                                    action={
                                        can('memberships.approve') ? (
                                            <EnrollDialog
                                                group={group}
                                                availableMembers={
                                                    availableMembers
                                                }
                                            />
                                        ) : undefined
                                    }
                                />
                            }
                            columns={[
                                {
                                    key: 'name',
                                    header: 'Member',
                                    mobileLabel: 'Member',
                                    render: (m) => (
                                        <div>
                                            <div className="text-sm font-semibold">
                                                {m.member_profile?.full_name ??
                                                    '—'}
                                            </div>
                                            <div className="font-mono text-xs text-muted-foreground">
                                                {m.membership_number} ·{' '}
                                                {m.member_profile?.phone}
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'role',
                                    header: 'Role',
                                    mobileLabel: 'Role',
                                    render: (m) => (
                                        <Badge
                                            variant={
                                                m.role === 'organizer'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className="text-xs capitalize"
                                        >
                                            {m.role}
                                        </Badge>
                                    ),
                                },
                                {
                                    key: 'order',
                                    header: 'Payout order',
                                    mobileLabel: 'Payout order',
                                    render: (m) => (
                                        <span className="font-mono text-sm font-semibold">
                                            {m.payout_order_number
                                                ? `#${m.payout_order_number}`
                                                : m.role === 'organizer'
                                                  ? 'Organizer'
                                                  : '—'}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'status',
                                    header: 'Enrollment',
                                    mobileLabel: 'Enrollment',
                                    render: (m) => (
                                        <StatusBadge status={m.status} />
                                    ),
                                },
                                {
                                    key: 'joined',
                                    header: 'Joined',
                                    mobileLabel: 'Joined',
                                    hideOnMobile: true,
                                    render: (m) => (
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(
                                                m.joined_at,
                                            ).toLocaleDateString()}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'actions',
                                    header: '',
                                    className: 'text-right',
                                    cellClassName: 'text-right',
                                    render: (m) =>
                                        m.member_profile &&
                                        can('members.view') ? (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="ghost"
                                            >
                                                <Link
                                                    href={`/members/${m.member_profile_id}`}
                                                >
                                                    Profile
                                                </Link>
                                            </Button>
                                        ) : null,
                                },
                            ]}
                        />
                    </CardContent>
                </Card>
            </PageContainer>
        </>
    );
}
