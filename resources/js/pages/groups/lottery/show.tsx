import { Head, setLayoutProps } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    Hash,
    Shield,
    Shuffle,
    Users,
    XCircle,
} from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { DetailItem, DetailList } from '@/components/detail-list';
import { GroupNavigation } from '@/components/group-navigation';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { EqubGroup, LotteryDraw } from '@/types/equb';

interface Props {
    group: EqubGroup;
    draw: LotteryDraw;
}

export default function LotteryShow({ group, draw }: Props) {
    const evidence = draw.draw_evidence as Record<string, unknown> | null;
    const winner = draw.winning_membership?.member_profile?.full_name;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Equb Groups', href: '/groups' },
            { title: group.name, href: `/groups/${group.id}` },
            {
                title: 'Lottery Draws',
                href: `/groups/${group.id}/lottery`,
            },
            { title: `Draw #${draw.payout_sequence}`, href: '#' },
        ],
    });

    return (
        <>
            <Head
                title={`Lottery Draw #${draw.payout_sequence} — ${group.name}`}
            />

            <PageContainer>
                <PageHeader
                    eyebrow="Lottery audit record"
                    title={`Draw #${draw.payout_sequence}`}
                    description={`Immutable record of the draw for ${group.name}. Results cannot be silently changed once confirmed.`}
                    icon={Shuffle}
                    backHref={`/groups/${group.id}/lottery`}
                    backLabel="All lottery draws"
                    actions={<StatusBadge status={draw.status} />}
                />

                <GroupNavigation groupId={group.id} />

                <div className="grid gap-5 lg:grid-cols-3">
                    <Card className="border-emerald-300/70 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Award className="size-5 text-emerald-600" />
                                Winner
                            </CardTitle>
                            <CardDescription>
                                Selected for payout slot #{draw.payout_sequence}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white">
                                    {(winner ?? '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                        {winner ?? 'No winner recorded'}
                                    </p>
                                    <p className="font-mono text-xs text-muted-foreground">
                                        {draw.winning_membership
                                            ?.membership_number ?? '—'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Shield className="size-4 text-blue-600" />
                                Draw details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DetailList>
                                <DetailItem
                                    label="Method"
                                    value={draw.draw_method?.replace('_', ' ')}
                                />
                                <DetailItem
                                    label="Conducted by"
                                    value={draw.conducted_by_user?.name}
                                />
                                <DetailItem
                                    label="Conducted at"
                                    value={
                                        draw.conducted_at
                                            ? new Date(
                                                  draw.conducted_at,
                                              ).toLocaleString()
                                            : null
                                    }
                                />
                                <DetailItem
                                    label="Witnessed by"
                                    value={
                                        draw.witnessed_by_name
                                            ? `${draw.witnessed_by_name} (${draw.witnessed_by_role})`
                                            : null
                                    }
                                />
                                <DetailItem
                                    label="Eligible participants"
                                    value={draw.eligible_count}
                                />
                            </DetailList>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Hash className="size-4 text-violet-600" />
                                Cryptographic audit evidence
                            </CardTitle>
                            <CardDescription>
                                Tamper-detection hash and CSPRNG seed for
                                independent verification.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="rounded-lg border bg-muted/50 p-3">
                                <p className="mb-1 text-[11px] font-medium text-muted-foreground uppercase">
                                    Result hash (SHA-256)
                                </p>
                                <p className="font-mono text-xs break-all">
                                    {draw.result_hash ?? '—'}
                                </p>
                            </div>
                            {draw.random_seed && (
                                <div className="rounded-lg border bg-muted/50 p-3">
                                    <p className="mb-1 text-[11px] font-medium text-muted-foreground uppercase">
                                        Random seed
                                    </p>
                                    <p className="font-mono text-xs break-all">
                                        {draw.random_seed}
                                    </p>
                                </div>
                            )}
                            {evidence && (
                                <details className="rounded-lg border bg-muted/50 p-3">
                                    <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground uppercase">
                                        Draw evidence payload
                                    </summary>
                                    <pre className="mt-2 max-h-64 overflow-auto font-mono text-xs">
                                        {JSON.stringify(evidence, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="size-4" />
                            Participants at draw time
                        </CardTitle>
                        <CardDescription>
                            {draw.participants?.length ?? 0} membership records
                            evaluated for eligibility.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-2 sm:px-6">
                        <DataTable
                            rows={draw.participants ?? []}
                            getRowKey={(p) => p.id}
                            empty={
                                <p className="px-4 py-6 text-sm text-muted-foreground">
                                    No participant records.
                                </p>
                            }
                            columns={[
                                {
                                    key: 'member',
                                    header: 'Member',
                                    mobileLabel: 'Member',
                                    render: (p) => (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {p.membership?.member_profile
                                                    ?.full_name ??
                                                    `Membership #${p.equb_membership_id}`}
                                            </span>
                                            {p.equb_membership_id ===
                                                draw.winning_membership_id && (
                                                <Badge className="bg-emerald-600 text-[10px] text-white">
                                                    Winner
                                                </Badge>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    key: 'membership',
                                    header: 'Membership #',
                                    mobileLabel: 'Membership',
                                    render: (p) => (
                                        <span className="font-mono text-xs">
                                            {p.membership?.membership_number ??
                                                '—'}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'eligible',
                                    header: 'Eligibility',
                                    mobileLabel: 'Eligibility',
                                    render: (p) =>
                                        p.is_eligible ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="size-4" />
                                                Eligible
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                                                <XCircle className="size-4" />
                                                Excluded
                                            </span>
                                        ),
                                },
                                {
                                    key: 'reason',
                                    header: 'Exclusion reason',
                                    mobileLabel: 'Reason',
                                    render: (p) => (
                                        <span className="text-xs text-muted-foreground">
                                            {p.exclusion_reason ?? '—'}
                                        </span>
                                    ),
                                },
                            ]}
                        />
                    </CardContent>
                </Card>
            </PageContainer>
        </>
    );
}
