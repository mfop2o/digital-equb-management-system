import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    if (breadcrumbs.length === 0) {
        return null;
    }

    const last = breadcrumbs[breadcrumbs.length - 1];

    return (
        <>
            {/* Mobile: keep the header light by showing only the current page. */}
            <Breadcrumb className="min-w-0 sm:hidden">
                <BreadcrumbList className="min-w-0 flex-nowrap">
                    <BreadcrumbItem className="min-w-0">
                        <BreadcrumbPage className="truncate text-sm font-medium">
                            {last.title}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Desktop: full trail, with long labels truncated. */}
            <Breadcrumb className="hidden min-w-0 sm:block">
                <BreadcrumbList className="min-w-0 flex-nowrap">
                    {breadcrumbs.map((item, index) => {
                        const isLast = index === breadcrumbs.length - 1;

                        return (
                            <Fragment key={`${item.title}-${index}`}>
                                <BreadcrumbItem className="min-w-0">
                                    {isLast ? (
                                        <BreadcrumbPage className="max-w-[22rem] truncate font-medium">
                                            {item.title}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink
                                            asChild
                                            className="max-w-[16rem] truncate"
                                        >
                                            <Link href={item.href}>
                                                {item.title}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && (
                                    <BreadcrumbSeparator className="shrink-0" />
                                )}
                            </Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </>
    );
}
