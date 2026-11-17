import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'emerald' | 'blue' | 'amber' | 'red' | 'violet';

const TONES: Record<Tone, { icon: string; tile: string }> = {
    default: {
        icon: 'text-emerald-700 dark:text-emerald-400',
        tile: 'bg-emerald-500/10 ring-emerald-500/20',
    },
    emerald: {
        icon: 'text-emerald-700 dark:text-emerald-400',
        tile: 'bg-emerald-500/10 ring-emerald-500/20',
    },
    blue: {
        icon: 'text-blue-700 dark:text-blue-400',
        tile: 'bg-blue-500/10 ring-blue-500/20',
    },
    amber: {
        icon: 'text-slate-700 dark:text-slate-300',
        tile: 'bg-slate-500/10 ring-slate-500/20',
    },
    red: {
        icon: 'text-rose-700 dark:text-rose-400',
        tile: 'bg-rose-500/10 ring-rose-500/20',
    },
    violet: {
        icon: 'text-purple-700 dark:text-purple-400',
        tile: 'bg-purple-500/10 ring-purple-500/20',
    },
};

export function SummaryCard({
    label,
    value,
    hint,
    icon: Icon,
    tone = 'default',
    className,
}: {
    label: string;
    value: string | number;
    hint?: string;
    icon?: LucideIcon;
    tone?: Tone;
    className?: string;
}) {
    const colors = TONES[tone];

    return (
        <div
            className={cn(
                'group relative flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 text-card-foreground shadow-xs transition-all duration-200 hover:shadow-md hover:border-emerald-500/30',
                className,
            )}
        >
            <div className="min-w-0 space-y-1.5 flex-1">
                <p className="truncate text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {label}
                </p>
                <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl text-foreground">
                    {value}
                </p>
                {hint && (
                    <p className="line-clamp-1 text-xs text-muted-foreground/90">
                        {hint}
                    </p>
                )}
            </div>
            {Icon && (
                <div
                    className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105',
                        colors.tile,
                    )}
                >
                    <Icon className={cn('size-5', colors.icon)} />
                </div>
            )}
        </div>
    );
}
