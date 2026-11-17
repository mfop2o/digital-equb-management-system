import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { PaginationLink } from '@/types';

function decodeLabel(label: string): string {
    return label
        .replaceAll('&laquo;', '«')
        .replaceAll('&raquo;', '»')
        .replaceAll('&lsaquo;', '‹')
        .replaceAll('&rsaquo;', '›')
        .replaceAll('&amp;', '&');
}

export function Pagination({
    paginator,
}: {
    paginator: {
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        links: PaginationLink[];
    };
}) {
    if (paginator.last_page <= 1) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {paginator.from ?? 0}–{paginator.to ?? 0} of{' '}
                {paginator.total}
            </p>
            <div className="flex flex-wrap items-center gap-1">
                {paginator.links.map((link, index) => {
                    if (link.url === null || link.label.includes('...')) {
                        return null;
                    }

                    return (
                        <Button
                            key={`${link.label}-${index}`}
                            asChild
                            size="sm"
                            variant={link.active ? 'secondary' : 'outline'}
                        >
                            <Link href={link.url} preserveScroll>
                                {decodeLabel(link.label)}
                            </Link>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
