import { cn } from '@/lib/utils';

/**
 * Neutral status pills. Financial statuses use the same restrained palette as
 * the rest of the app: emerald for settled/positive, blue for in-progress,
 * amber for review, red for failed/overdue, slate for neutral.
 */
const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
    // Account / membership
    active: {
        label: 'Active',
        cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900',
    },
    inactive: {
        label: 'Deactivated',
        cls: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
    },
    pending: {
        label: 'Pending',
        cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    },
    locked: {
        label: 'Locked',
        cls: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900',
    },
    suspended: {
        label: 'Suspended',
        cls: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900',
    },
    withdrawn: {
        label: 'Withdrawn',
        cls: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
    },
    expelled: {
        label: 'Expelled',
        cls: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900',
    },

    // Group / cycle lifecycle
    draft: {
        label: 'Draft',
        cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    },
    registration: {
        label: 'Registration',
        cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900',
    },
    deposit_stage: {
        label: 'Deposit Stage',
        cls: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800',
    },
    open: {
        label: 'Open',
        cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900',
    },
    closed: {
        label: 'Closed',
        cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    },
    completed: {
        label: 'Completed',
        cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900',
    },
    cancelled: {
        label: 'Cancelled',
        cls: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900',
    },

    // Payments / obligations
    verified: {
        label: 'Verified',
        cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900',
    },
    submitted: {
        label: 'Under Review',
        cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900',
    },
    overdue: {
        label: 'Overdue',
        cls: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900',
    },
    exempt: {
        label: 'Exempt',
        cls: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
    },
    rejected: {
        label: 'Rejected',
        cls: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900',
    },
    paid: {
        label: 'Paid',
        cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900',
    },
    unpaid: {
        label: 'Unpaid',
        cls: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900',
    },

    // Payout workflow
    scheduled: {
        label: 'Scheduled',
        cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    },
    pending_approval: {
        label: 'Pending Approval',
        cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900',
    },
    approved: {
        label: 'Approved',
        cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900',
    },
    disbursed: {
        label: 'Disbursed',
        cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900',
    },

    // Lottery
    winner_confirmed: {
        label: 'Winner Confirmed',
        cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900',
    },

    // Derived member colours
    green: {
        label: 'Green',
        cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900',
    },
    red: {
        label: 'Red',
        cls: 'bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900',
    },
    blue: {
        label: 'Blue',
        cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900',
    },
};

export function StatusBadge({
    status,
    label,
    className,
}: {
    status: string;
    label?: string;
    className?: string;
}) {
    const config = STATUS_STYLES[status] ?? {
        label: status.replace(/_/g, ' '),
        cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap capitalize',
                config.cls,
                className,
            )}
        >
            {label ?? config.label}
        </span>
    );
}
