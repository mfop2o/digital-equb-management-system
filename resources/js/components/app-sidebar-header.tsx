import { Breadcrumbs } from '@/components/breadcrumbs';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur transition-[height] ease-linear supports-[backdrop-filter]:bg-background/60 sm:px-4 md:h-16">
            <SidebarTrigger className="-ml-1 shrink-0" />
            {breadcrumbs.length > 0 && (
                <Separator
                    orientation="vertical"
                    className="mr-1 hidden h-5 sm:block"
                />
            )}
            <div className="min-w-0 flex-1">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <LanguageSwitcher variant="outline" size="sm" showLabel />
            </div>
        </header>
    );
}
