import { Head, setLayoutProps } from '@inertiajs/react';
import {
    Braces,
    Fingerprint,
    GitCompareArrows,
    Network,
    ScrollText,
} from 'lucide-react';
import { DetailItem, DetailList } from '@/components/detail-list';
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

type AuditEntry = {
    id: number;
    event: string;
    user: { id: number; name: string } | null;
    equb_group_id: number | null;
    auditable_type: string | null;
    auditable_id: number | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    changed_fields: string[] | null;
    transaction_reference: string | null;
    request_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string | null;
    created_at_display: string | null;
};

function prettyType(type: string | null): string | null {
    if (!type) {
        return null;
    }

    return (
        type
            .split('\\')
            .pop()
            ?.replace(/([A-Z])/g, ' $1')
            .trim() ?? type
    );
}

function Payload({
    title,
    description,
    value,
    tone,
}: {
    title: string;
    description: string;
    value: Record<string, unknown> | null;
    tone: 'before' | 'after';
}) {
    const empty = value === null || Object.keys(value).length === 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <Badge
                        variant="outline"
                        className={
                            tone === 'after'
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400'
                                : 'border-slate-400/40 bg-slate-500/10 text-[10px] text-slate-600 dark:text-slate-300'
                        }
                    >
                        {tone === 'after' ? 'After' : 'Before'}
                    </Badge>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {empty ? (
                    <p className="text-sm text-muted-foreground">
                        No data recorded.
                    </p>
                ) : (
                    <pre className="max-h-96 overflow-auto rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                        {JSON.stringify(value, null, 2)}
                    </pre>
                )}
            </CardContent>
        </Card>
    );
}

export default function AuditShow({ log }: { log: AuditEntry }) {
    setLayoutProps({
        breadcrumbs: [{ title: 'Audit log', href: '/admin/audit' }],
    });

    return (
        <>
            <Head title={`Audit #${log.id}`} />

            <PageContainer>
                <PageHeader
                    eyebrow="Audit trail"
                    title={`Audit entry #${log.id}`}
                    description="A read-only snapshot of a single audited event."
                    icon={ScrollText}
                    backHref="/admin/audit"
                    backLabel="Audit log"
                    actions={
                        <>
                            <Badge
                                variant="outline"
                                className="font-mono text-[11px]"
                            >
                                {log.event}
                            </Badge>
                            <StatusBadge status="verified" label="Immutable" />
                        </>
                    }
                />

                <div className="grid gap-5 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Fingerprint className="size-4 text-emerald-600" />
                                Event context
                            </CardTitle>
                            <CardDescription>
                                {log.created_at_display ??
                                    log.created_at ??
                                    'Unknown time'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailList>
                                <DetailItem
                                    label="Actor"
                                    value={log.user?.name ?? 'System'}
                                />
                                <DetailItem
                                    label="Actor ID"
                                    mono
                                    value={log.user?.id ?? null}
                                />
                                <DetailItem
                                    label="Group ID"
                                    mono
                                    value={log.equb_group_id}
                                />
                                <DetailItem
                                    label="Subject type"
                                    value={prettyType(log.auditable_type)}
                                />
                                <DetailItem
                                    label="Subject ID"
                                    mono
                                    value={log.auditable_id}
                                />
                                <DetailItem
                                    label="Transaction"
                                    mono
                                    value={log.transaction_reference}
                                />
                                <DetailItem
                                    label="Request ID"
                                    mono
                                    value={log.request_id}
                                />
                                <DetailItem
                                    label="IP address"
                                    mono
                                    value={log.ip_address}
                                />
                                <DetailItem
                                    label="User agent"
                                    value={
                                        <span className="font-normal text-muted-foreground">
                                            {log.user_agent ?? '—'}
                                        </span>
                                    }
                                />
                            </DetailList>
                        </CardContent>
                    </Card>

                    <div className="space-y-5 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <GitCompareArrows className="size-4 text-blue-600" />
                                    Changed fields
                                </CardTitle>
                                <CardDescription>
                                    Field names only; values are shown below.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {log.changed_fields &&
                                log.changed_fields.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {log.changed_fields.map((field) => (
                                            <Badge
                                                key={field}
                                                variant="secondary"
                                                className="font-mono text-[11px]"
                                            >
                                                {field}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No changed fields recorded.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid gap-5 xl:grid-cols-2">
                            <Payload
                                title="Before"
                                description="Values prior to the event."
                                value={log.before}
                                tone="before"
                            />
                            <Payload
                                title="After"
                                description="Values after the event."
                                value={log.after}
                                tone="after"
                            />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Braces className="size-4 text-violet-600" />
                                    Traceability
                                </CardTitle>
                                <CardDescription>
                                    Correlation identifiers used to follow this
                                    action across requests.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DetailList>
                                    <DetailItem
                                        label="Request ID"
                                        mono
                                        value={log.request_id}
                                    />
                                    <DetailItem
                                        label="Transaction reference"
                                        mono
                                        value={log.transaction_reference}
                                    />
                                    <DetailItem
                                        label="Network"
                                        mono
                                        value={
                                            <span className="inline-flex items-center gap-1.5">
                                                <Network className="size-3.5 text-muted-foreground" />
                                                {log.ip_address ?? '—'}
                                            </span>
                                        }
                                    />
                                </DetailList>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageContainer>
        </>
    );
}
