import { Link } from '@inertiajs/react';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
    title,
    description,
    actions,
    eyebrow,
    icon: Icon,
    backHref,
    backLabel = 'Back',
    className,
}: {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    eyebrow?: ReactNode;
    icon?: LucideIcon;
    backHref?: string;
    backLabel?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-start sm:justify-between',
                className,
            )}
        >
            <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                        <Icon className="size-5" />
                    </div>
                )}
                <div className="min-w-0 space-y-1">
                    {backHref && (
                        <Link
                            href={backHref}
                            className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-3.5" />
                            {backLabel}
                        </Link>
                    )}
                    {eyebrow && (
                        <p className="text-[11px] font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                            {eyebrow}
                        </p>
                    )}
                    <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="max-w-2xl text-sm text-pretty text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                    {actions}
                </div>
            )}
        </div>
    );
}
