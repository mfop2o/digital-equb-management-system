import { Head, useForm, setLayoutProps } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    MinusCircle,
    Vote,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { EmptyState } from '@/components/empty-state';
import { GroupNavigation } from '@/components/group-navigation';
import { Pagination } from '@/components/pagination';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import type {
    EqubGroup,
    GovernanceMembership,
    GroupDecision,
    GroupDecisionStatus,
    GroupDecisionType,
    Paginated,
    VoteChoice,
} from '@/types';

type Props = {
    group: EqubGroup;
    decisions: Paginated<GroupDecision>;
    myMembership: GovernanceMembership | null;
    myVotes: Record<number, VoteChoice>;
};

// ─── Status badge helpers ────────────────────────────────────────────────────

const STATUS_ICON: Record<GroupDecisionStatus, React.ElementType> = {
    open: Clock,
    passed: CheckCircle2,
    failed: XCircle,
    cancelled: MinusCircle,
};

const STATUS_CLS: Record<GroupDecisionStatus, string> = {
    open: 'border-[#759B46]/30 bg-[#759B46]/10 text-[#759B46]',
    passed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400',
    failed: 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400',
    cancelled: 'border-border bg-muted text-muted-foreground',
};

const TYPE_LABEL: Record<GroupDecisionType, string> = {
    general: 'General Decision',
    rule_change: 'Rule Change',
};

const VOTE_CLS: Record<VoteChoice, string> = {
    approve: 'bg-[#759B46]/10 border-[#759B46]/30 text-[#759B46] hover:bg-[#759B46]/20',
    reject: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400',
    abstain: 'bg-muted border-border text-muted-foreground hover:bg-muted/80',
};

// ─── New Decision Dialog ─────────────────────────────────────────────────────

function NewDecisionDialog({ groupId }: { groupId: number }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        type: 'general' as GroupDecisionType,
        closes_at: '',
    });

    // Default closes_at to 7 days from now
    function handleOpen(isOpen: boolean) {
        if (isOpen && !data.closes_at) {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            const iso = d.toISOString().slice(0, 16);
            setData('closes_at', iso);
        }
        setOpen(isOpen);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post(`/groups/${groupId}/governance/decisions`, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#759B46] hover:bg-[#5F8037] text-white font-medium gap-2">
                    <Vote className="size-4" />
                    {t('governance.newDecision')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('governance.newDecision')}</DialogTitle>
                    <DialogDescription>
                        Open a new group decision. All active members can vote until the closing date.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="title">{t('governance.decisionTitle')} *</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Increase contribution by 500 ETB"
                            autoFocus
                        />
                        {errors.title && (
                            <p className="text-xs text-destructive">{errors.title}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description">{t('governance.decisionDescription')}</Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Provide rationale or context for this decision…"
                        />
                        {errors.description && (
                            <p className="text-xs text-destructive">{errors.description}</p>
                        )}
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                        <Label>{t('governance.decisionType')}</Label>
                        <Select
                            value={data.type}
                            onValueChange={(v) => setData('type', v as GroupDecisionType)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">{t('governance.typeGeneral')}</SelectItem>
                                <SelectItem value="rule_change">{t('governance.typeRuleChange')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {data.type === 'rule_change' && (
                            <p className="text-xs text-muted-foreground">
                                {t('governance.ruleChangeNotice')}
                            </p>
                        )}
                        {errors.type && (
                            <p className="text-xs text-destructive">{errors.type}</p>
                        )}
                    </div>

                    {/* Closes at */}
                    <div className="space-y-1.5">
                        <Label htmlFor="closes_at">{t('governance.closesAt')} *</Label>
                        <Input
                            id="closes_at"
                            type="datetime-local"
                            value={data.closes_at}
                            onChange={(e) => setData('closes_at', e.target.value)}
                        />
                        {errors.closes_at && (
                            <p className="text-xs text-destructive">{errors.closes_at}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-[#759B46] hover:bg-[#5F8037] text-white font-medium"
                    >
                        {processing ? 'Opening decision…' : 'Open for Voting'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Vote Dialog ─────────────────────────────────────────────────────────────

function VoteDialog({
    groupId,
    decision,
    myVote,
}: {
    groupId: number;
    decision: GroupDecision;
    myVote?: VoteChoice;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing } = useForm({ vote: '' as VoteChoice | '' });

    function handleVote(e: FormEvent) {
        e.preventDefault();
        if (!data.vote) return;
        post(`/groups/${groupId}/governance/decisions/${decision.id}/vote`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    if (myVote) {
        return (
            <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', VOTE_CLS[myVote])}>
                {t('governance.votedAlready').replace('{vote}', myVote)}
            </span>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-[#759B46]/40 text-[#759B46] hover:bg-[#759B46]/10 font-medium gap-1">
                    <Vote className="size-3.5" />
                    {t('governance.castVote')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t('governance.castVote')}</DialogTitle>
                    <DialogDescription className="line-clamp-2">{decision.title}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleVote} className="space-y-3 pt-1">
                    <div className="grid grid-cols-3 gap-2">
                        {(['approve', 'reject', 'abstain'] as VoteChoice[]).map((choice) => (
                            <button
                                key={choice}
                                type="button"
                                onClick={() => setData('vote', choice)}
                                className={cn(
                                    'rounded-lg border px-3 py-3 text-sm font-medium capitalize transition-all',
                                    VOTE_CLS[choice],
                                    data.vote === choice ? 'ring-2 ring-offset-1 ring-[#759B46]' : '',
                                )}
                            >
                                {t(`governance.${choice}` as Parameters<typeof t>[0])}
                            </button>
                        ))}
                    </div>
                    <Button
                        type="submit"
                        disabled={processing || !data.vote}
                        className="w-full bg-[#759B46] hover:bg-[#5F8037] text-white font-medium"
                    >
                        {processing ? 'Recording vote…' : 'Confirm Vote'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Decision Card ────────────────────────────────────────────────────────────

function DecisionCard({
    decision,
    group,
    myMembership,
    myVote,
}: {
    decision: GroupDecision;
    group: EqubGroup;
    myMembership: GovernanceMembership | null;
    myVote?: VoteChoice;
}) {
    const { t } = useTranslation();
    const { can } = usePermissions();
    const StatusIcon = STATUS_ICON[decision.status];
    const isOpen = decision.status === 'open';
    const closesDate = new Date(decision.closes_at);
    const isPast = closesDate < new Date();
    const canVote = can('governance.vote') && myMembership?.status === 'active';

    const total =
        (decision.approves_count ?? 0) +
        (decision.rejects_count ?? 0) +
        (decision.abstains_count ?? 0);

    const pct = (n: number) =>
        total > 0 ? Math.round((n / total) * 100) : 0;

    // Close decision form
    const { post: postClose, processing: closing } = useForm({});
    function handleClose() {
        postClose(`/groups/${group.id}/governance/decisions/${decision.id}/close`, {
            preserveScroll: true,
        });
    }

    return (
        <Card className="rounded-2xl border-border/70 shadow-xs">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            {/* Status badge */}
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
                                    STATUS_CLS[decision.status],
                                )}
                            >
                                <StatusIcon className="size-3" />
                                {t(`governance.status.${decision.status}` as Parameters<typeof t>[0])}
                            </span>
                            {/* Type badge */}
                            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {TYPE_LABEL[decision.type]}
                            </span>
                        </div>
                        <CardTitle className="text-sm font-semibold text-foreground leading-snug">
                            {decision.title}
                        </CardTitle>
                        {decision.description && (
                            <CardDescription className="mt-1 text-xs line-clamp-2">
                                {decision.description}
                            </CardDescription>
                        )}
                    </div>

                    {/* Vote CTA */}
                    <div className="shrink-0">
                        {isOpen && canVote ? (
                            <VoteDialog
                                groupId={group.id}
                                decision={decision}
                                myVote={myVote}
                            />
                        ) : isOpen && !canVote ? (
                            <span className="text-xs text-muted-foreground">
                                {t('governance.notEligible')}
                            </span>
                        ) : null}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Vote tally bars */}
                <div className="space-y-1.5">
                    {/* Approve */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="w-14 text-muted-foreground">{t('governance.approve')}</span>
                        <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct(decision.approves_count ?? 0)}%`, backgroundColor: '#759B46' }}
                            />
                        </div>
                        <span className="w-16 text-right text-muted-foreground">
                            {decision.approves_count ?? 0} ({pct(decision.approves_count ?? 0)}%)
                        </span>
                    </div>
                    {/* Reject */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="w-14 text-muted-foreground">{t('governance.reject')}</span>
                        <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-red-400 transition-all"
                                style={{ width: `${pct(decision.rejects_count ?? 0)}%` }}
                            />
                        </div>
                        <span className="w-16 text-right text-muted-foreground">
                            {decision.rejects_count ?? 0} ({pct(decision.rejects_count ?? 0)}%)
                        </span>
                    </div>
                    {/* Abstain */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="w-14 text-muted-foreground">{t('governance.abstain')}</span>
                        <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-slate-400 transition-all"
                                style={{ width: `${pct(decision.abstains_count ?? 0)}%` }}
                            />
                        </div>
                        <span className="w-16 text-right text-muted-foreground">
                            {decision.abstains_count ?? 0} ({pct(decision.abstains_count ?? 0)}%)
                        </span>
                    </div>
                </div>

                {/* Footer row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    <span>
                        {isOpen && !isPast
                            ? t('governance.votingOpenUntil').replace(
                                  '{date}',
                                  closesDate.toLocaleString(),
                              )
                            : decision.closed_at
                              ? `Closed ${new Date(decision.closed_at).toLocaleDateString()}`
                              : `Voting closed ${closesDate.toLocaleDateString()}`}
                    </span>
                    <span>
                        By{' '}
                        <span className="font-medium text-foreground">
                            {decision.created_by?.name ?? 'a member'}
                        </span>
                    </span>

                    {/* Close button — if open and voting window has elapsed */}
                    {isOpen && isPast && can('governance.view') && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-medium border-border"
                            onClick={handleClose}
                            disabled={closing}
                        >
                            {closing ? 'Closing…' : t('governance.closeNow')}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GovernanceIndex({ group, decisions, myMembership, myVotes }: Props) {
    const { t } = useTranslation();
    const { can: canDo } = usePermissions();

    useFlashToast();

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('nav.equbGroups'), href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            { title: t('governance.title'), href: `/groups/${group.id}/governance` },
        ],
    });

    return (
        <>
            <Head title={`${t('governance.title')} — ${group.name}`} />

            <PageContainer>
                <GroupNavigation groupId={group.id} />

                <PageHeader
                    title={t('governance.title')}
                    description={t('governance.description')}
                    icon={Vote}
                    actions={
                        canDo('governance.create') ? (
                            <NewDecisionDialog groupId={group.id} />
                        ) : undefined
                    }
                />

                {/* Decisions list */}
                {decisions.data.length === 0 ? (
                    <EmptyState
                        title={t('governance.noDecisions')}
                        description={t('governance.noDecisionsHint')}
                        action={
                            canDo('governance.create') ? (
                                <NewDecisionDialog groupId={group.id} />
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="space-y-4">
                        {decisions.data.map((decision) => (
                            <DecisionCard
                                key={decision.id}
                                decision={decision}
                                group={group}
                                myMembership={myMembership}
                                myVote={myVotes[decision.id]}
                            />
                        ))}
                    </div>
                )}

                <Pagination paginator={decisions} />
            </PageContainer>
        </>
    );
}
