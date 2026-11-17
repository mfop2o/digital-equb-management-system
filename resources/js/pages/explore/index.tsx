import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    Compass,
    Filter,
    Hash,
    MapPin,
    RotateCw,
    Search,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { EmptyState } from '@/components/empty-state';
import { formatEtb } from '@/components/money';
import { Pagination } from '@/components/pagination';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import type { EqubGroup, EqubGroupRule, GroupVisibility, Paginated } from '@/types';

setLayoutProps({ breadcrumbs: [{ title: 'Discover Groups', href: '/explore' }] });

type Filters = {
    search?: string;
    frequency?: string;
    min_amount?: string;
    max_amount?: string;
    location?: string;
    max_size?: string;
    has_slots?: string;
};

type Props = {
    groups: Paginated<EqubGroup & { active_memberships_count: number }>;
    filters: Filters;
};

const FREQ_LABEL: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
};

const VISIBILITY_BADGE: Record<GroupVisibility, string> = {
    public: 'bg-[#759B46]/10 text-[#759B46] border-[#759B46]/30',
    private: 'bg-muted text-muted-foreground border-border',
    invite_only: 'bg-muted text-muted-foreground border-border',
};

const VISIBILITY_LABEL: Record<GroupVisibility, string> = {
    public: 'Public',
    private: 'Private',
    invite_only: 'Invite Only',
};

function GroupCard({ group }: { group: EqubGroup & { active_memberships_count: number } }) {
    const rule = group.active_rule as EqubGroupRule | null | undefined;
    const memberCount = group.active_memberships_count ?? 0;
    const slots = group.max_members - memberCount;
    const fillPct = Math.min(100, (memberCount / (group.max_members || 1)) * 100);
    const isFull = slots <= 0;

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:border-[#759B46]/50 hover:shadow-md">
            {/* Top accent bar */}
            <div
                className="h-1 w-full"
                style={{ background: isFull ? '#d1d5db' : '#759B46' }}
            />

            <div className="flex flex-1 flex-col gap-3 p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground leading-snug">
                            {group.name}
                        </h3>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {group.group_code}
                        </p>
                    </div>
                    <span
                        className={cn(
                            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            VISIBILITY_BADGE[group.visibility ?? 'public'],
                        )}
                    >
                        {VISIBILITY_LABEL[group.visibility ?? 'public']}
                    </span>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-2 gap-2">
                    {rule && (
                        <>
                            <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Contribution
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-foreground">
                                    {formatEtb(rule.contribution_amount)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {FREQ_LABEL[rule.contribution_frequency] ?? rule.contribution_frequency}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Deposit
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-foreground">
                                    {formatEtb(rule.initial_deposit_amount)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    × {rule.initial_deposit_rounds} round(s)
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Member fill bar */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Users className="size-3" />
                            {memberCount} / {group.max_members} members
                        </span>
                        {isFull ? (
                            <span className="font-medium text-muted-foreground">Full</span>
                        ) : (
                            <span className="font-medium text-[#759B46]">
                                {slots} slot{slots !== 1 ? 's' : ''} open
                            </span>
                        )}
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${fillPct}%`,
                                backgroundColor: isFull ? '#9ca3af' : '#759B46',
                            }}
                        />
                    </div>
                </div>

                {group.location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{group.location}</span>
                    </p>
                )}

                {/* CTA */}
                <div className="mt-auto pt-1">
                    <Link href={`/explore/${group.id}`}>
                        <Button
                            size="sm"
                            className="w-full bg-[#759B46] hover:bg-[#5F8037] text-white font-medium text-xs"
                            disabled={isFull}
                        >
                            {isFull ? 'Group Full' : 'View & Request to Join'}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function JoinByCodeDialog() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        invite_code: '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/groups/join-by-code', {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 font-medium border-border">
                    <Hash className="size-4" />
                    {t('explore.joinByCode')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t('explore.joinByCode')}</DialogTitle>
                    <DialogDescription>
                        {t('explore.joinByCodeDescription')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="invite_code">{t('explore.code')}</Label>
                        <Input
                            id="invite_code"
                            placeholder="e.g. EQB-ABCD1234"
                            value={data.invite_code}
                            onChange={(e) => setData('invite_code', e.target.value.trim().toUpperCase())}
                            className="font-mono tracking-wide"
                            autoFocus
                        />
                        {errors.invite_code && (
                            <p className="text-xs text-destructive">{errors.invite_code}</p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-[#759B46] hover:bg-[#5F8037] text-white font-medium"
                        disabled={processing || !data.invite_code}
                    >
                        {processing ? 'Requesting…' : t('explore.submitJoin')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function ExploreIndex({ groups, filters }: Props) {
    const { t } = useTranslation();
    useFlashToast();

    const [localFilters, setLocalFilters] = useState<Filters>({ ...filters });
    const [filtersOpen, setFiltersOpen] = useState(false);

    function applyFilters(e: FormEvent) {
        e.preventDefault();
        router.get('/explore', stripEmpty(localFilters), { preserveState: true });
    }

    function clearFilters() {
        setLocalFilters({});
        router.get('/explore', {}, { preserveState: false });
    }

    function stripEmpty(obj: Record<string, string | undefined>) {
        return Object.fromEntries(
            Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''),
        );
    }

    const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

    return (
        <>
            <Head title={t('explore.title')} />

            <PageContainer>
                <PageHeader
                    title={t('explore.title')}
                    description={t('explore.description')}
                    icon={Compass}
                    actions={<JoinByCodeDialog />}
                />

                {/* Search + filter bar */}
                <form onSubmit={applyFilters} className="space-y-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={t('explore.search')}
                                value={localFilters.search ?? ''}
                                onChange={(e) =>
                                    setLocalFilters((p) => ({ ...p, search: e.target.value }))
                                }
                                className="pl-9"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2 border-border"
                            onClick={() => setFiltersOpen((o) => !o)}
                        >
                            <Filter className="size-4" />
                            Filters
                            {hasActiveFilters && (
                                <span className="flex size-5 items-center justify-center rounded-full bg-[#759B46] text-[10px] font-bold text-white">
                                    ✓
                                </span>
                            )}
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#759B46] hover:bg-[#5F8037] text-white font-medium"
                        >
                            {t('explore.applyFilters')}
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={clearFilters}
                                className="gap-1 text-muted-foreground"
                            >
                                <X className="size-4" />
                                {t('explore.clearFilters')}
                            </Button>
                        )}
                    </div>

                    {/* Expanded filters panel */}
                    {filtersOpen && (
                        <div className="grid gap-4 rounded-xl border border-border/70 bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 shadow-xs">
                            {/* Frequency */}
                            <div className="space-y-1.5">
                                <Label>{t('explore.frequency')}</Label>
                                <Select
                                    value={localFilters.frequency ?? ''}
                                    onValueChange={(v) =>
                                        setLocalFilters((p) => ({
                                            ...p,
                                            frequency: v === '__any' ? undefined : v,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('explore.anyFrequency')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__any">{t('explore.anyFrequency')}</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Min amount */}
                            <div className="space-y-1.5">
                                <Label>{t('explore.minAmount')}</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={localFilters.min_amount ?? ''}
                                    onChange={(e) =>
                                        setLocalFilters((p) => ({ ...p, min_amount: e.target.value }))
                                    }
                                />
                            </div>

                            {/* Max amount */}
                            <div className="space-y-1.5">
                                <Label>{t('explore.maxAmount')}</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="Any"
                                    value={localFilters.max_amount ?? ''}
                                    onChange={(e) =>
                                        setLocalFilters((p) => ({ ...p, max_amount: e.target.value }))
                                    }
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-1.5">
                                <Label>{t('explore.location')}</Label>
                                <Input
                                    placeholder={t('explore.locationPlaceholder')}
                                    value={localFilters.location ?? ''}
                                    onChange={(e) =>
                                        setLocalFilters((p) => ({ ...p, location: e.target.value }))
                                    }
                                />
                            </div>

                            {/* Max group size */}
                            <div className="space-y-1.5">
                                <Label>{t('explore.maxSize')}</Label>
                                <Select
                                    value={localFilters.max_size ?? ''}
                                    onValueChange={(v) =>
                                        setLocalFilters((p) => ({
                                            ...p,
                                            max_size: v === '__any' ? undefined : v,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('explore.anySize')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__any">{t('explore.anySize')}</SelectItem>
                                        <SelectItem value="10">Up to 10</SelectItem>
                                        <SelectItem value="20">Up to 20</SelectItem>
                                        <SelectItem value="30">Up to 30</SelectItem>
                                        <SelectItem value="50">Up to 50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Has open slots */}
                            <div className="flex items-center gap-2 pt-5">
                                <input
                                    type="checkbox"
                                    id="has_slots"
                                    className="size-4 rounded accent-[#759B46]"
                                    checked={localFilters.has_slots === '1'}
                                    onChange={(e) =>
                                        setLocalFilters((p) => ({
                                            ...p,
                                            has_slots: e.target.checked ? '1' : undefined,
                                        }))
                                    }
                                />
                                <Label htmlFor="has_slots" className="cursor-pointer text-sm">
                                    {t('explore.hasSlots')}
                                </Label>
                            </div>
                        </div>
                    )}
                </form>

                {/* Result count */}
                <p className="text-sm text-muted-foreground">
                    {t('explore.groupsFound').replace('{count}', String(groups.total))}
                </p>

                {/* Groups grid */}
                {groups.data.length === 0 ? (
                    <EmptyState
                        title={t('explore.noGroups')}
                        description={t('explore.noGroupsHint')}
                        action={
                            hasActiveFilters ? (
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                    className="gap-1 font-medium"
                                >
                                    <X className="size-4" />
                                    Clear filters
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {groups.data.map((group) => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                    </div>
                )}

                <Pagination paginator={groups} />
            </PageContainer>
        </>
    );
}
