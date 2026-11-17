import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageContainerProps = {
    children: ReactNode;
    className?: string;
    /** `wide` removes the reading-width cap for dense tables and ledgers. */
    size?: 'default' | 'wide';
};

/**
 * Standard page shell: consistent horizontal padding, vertical rhythm and
 * max width across every screen.
 */
export function PageContainer({
    children,
    className,
    size = 'default',
}: PageContainerProps) {
    return (
        <div
            className={cn(
                'mx-auto flex w-full flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6',
                size === 'wide' ? 'max-w-[1600px]' : 'max-w-7xl',
                className,
            )}
        >
            {children}
        </div>
    );
}
