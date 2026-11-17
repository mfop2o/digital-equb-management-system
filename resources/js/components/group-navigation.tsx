import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    CircleDot,
    Coins,
    LogOut,
    RotateCw,
    ShieldCheck,
    Shuffle,
    Vote,
    type LucideIcon,
} from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

type GroupNavigationProps = {
    groupId: number | string;
    className?: string;
};

type GroupNavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    exact?: boolean;
    visible: boolean;
};

export function GroupNavigation({ groupId, className }: GroupNavigationProps) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const { can } = usePermissions();
    const { t } = useTranslation();

    const items: GroupNavItem[] = [
        {
            href: `/groups/${groupId}`,
            label: t('groups.groupDetails'),
            icon: CircleDot,
            exact: true,
            visible: true,
        },
        {
            href: `/groups/${groupId}/deposits`,
            label: t('nav.initialDeposits'),
            icon: ShieldCheck,
            visible: can('deposits.view'),
        },
        {
            href: `/groups/${groupId}/contributions`,
            label: t('nav.contributions'),
            icon: RotateCw,
            visible: can('contributions.view'),
        },
        {
            href: `/groups/${groupId}/payouts`,
            label: t('nav.payoutSchedule'),
            icon: Coins,
            visible: can('payouts.view'),
        },
        {
            href: `/groups/${groupId}/lottery`,
            label: t('nav.lotteryDraws'),
            icon: Shuffle,
            visible: can('payouts.view'),
        },
        {
            href: `/groups/${groupId}/governance`,
            label: t('nav.governance'),
            icon: Vote,
            visible: can('governance.view'),
        },
        {
            href: `/groups/${groupId}/finance`,
            label: t('nav.ledger'),
            icon: BookOpen,
            visible: can('ledger.view'),
        },
        {
            href: `/groups/${groupId}/penalties`,
            label: t('nav.penalties'),
            icon: AlertTriangle,
            visible: can('penalties.view'),
        },
        {
            href: `/groups/${groupId}/withdrawals`,
            label: t('nav.withdrawals'),
            icon: LogOut,
            visible: can('withdrawals.approve'),
        },
    ].filter((item) => item.visible);

    return (
        <nav
            aria-label="Equb group sections"
            className={cn(
                '-mx-1 flex items-center gap-1 overflow-x-auto rounded-xl border border-border/60 bg-card p-1.5 shadow-sm md:mx-0 md:flex-wrap md:overflow-visible',
                className,
            )}
        >
            {items.map((item) => {
                const active = item.exact
                    ? isCurrentUrl(item.href)
                    : isCurrentOrParentUrl(item.href);
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'group inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors',
                            active
                                ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                    >
                        <Icon
                            className={cn(
                                'size-4 shrink-0',
                                active
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-muted-foreground group-hover:text-foreground',
                            )}
                        />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
