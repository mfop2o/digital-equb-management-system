import { cn } from '@/lib/utils';

const formatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const etbFormatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

/**
 * Format a decimal ETB value (string from DECIMAL(15,2)) for display.
 * Use this for rule snapshots and already-decimal amounts; use `Money` for
 * integer santim payloads.
 */
export function formatEtb(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    const amount = typeof value === 'number' ? value : Number(value);

    if (Number.isNaN(amount)) {
        return '—';
    }

    return etbFormatter.format(amount);
}

/**
 * Format an integer santim amount for display.
 *
 * Money is sent from the backend as integer santim so it never passes through
 * a floating-point calculation in the browser.
 */
export function formatSantim(santim: number): string {
    return formatter.format(santim / 100);
}

export function Money({
    santim,
    className,
}: {
    santim: number;
    className?: string;
}) {
    return (
        <span className={cn('font-medium tabular-nums', className)}>
            {formatSantim(santim)}
        </span>
    );
}
