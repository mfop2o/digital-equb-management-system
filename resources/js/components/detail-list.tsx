import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DetailList({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <dl className={cn('divide-y divide-border/60', className)}>
            {children}
        </dl>
    );
}

export function DetailItem({
    label,
    value,
    hint,
    mono = false,
    emphasis = false,
    className,
}: {
    label: ReactNode;
    value: ReactNode;
    hint?: ReactNode;
    mono?: boolean;
    emphasis?: boolean;
    className?: string;
}) {
    const empty =
        value === null ||
        value === undefined ||
        value === '' ||
        value === false;

    return (
        <div
            className={cn(
                'flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6',
                className,
            )}
        >
            <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </dt>
            <dd
                className={cn(
                    'min-w-0 text-sm font-medium break-words sm:text-right',
                    mono && 'font-mono text-xs',
                    emphasis &&
                        'font-semibold text-emerald-700 dark:text-emerald-400',
                )}
            >
                {empty ? '—' : value}
                {hint && (
                    <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                        {hint}
                    </span>
                )}
            </dd>
        </div>
    );
}

/**
 * Two-column detail layout that collapses to one column on small screens.
 * Pass `DetailItem` children — each item keeps its own label/value pairing.
 */
export function DetailGrid({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('grid gap-x-8 sm:grid-cols-2', className)}>
            {children}
        </div>
    );
}
