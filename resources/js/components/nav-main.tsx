import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({
    items,
    label,
}: {
    items: NavItem[];
    label?: string;
}) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const { isMobile, setOpenMobile } = useSidebar();

    return (
        <SidebarGroup className="px-2 py-1">
            {label && (
                <SidebarGroupLabelSimple>{label}</SidebarGroupLabelSimple>
            )}
            <SidebarMenu>
                {items.map((item) => {
                    const active = item.exact
                        ? isCurrentUrl(item.href)
                        : isCurrentOrParentUrl(item.href);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    'h-9 gap-2.5 rounded-lg transition-colors',
                                    active &&
                                        'bg-emerald-500/10 font-medium text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
                                )}
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => {
                                        if (isMobile) {
                                            setOpenMobile(false);
                                        }
                                    }}
                                >
                                    {item.icon && (
                                        <item.icon
                                            className={cn(
                                                'size-4',
                                                active &&
                                                    'text-emerald-600 dark:text-emerald-400',
                                            )}
                                        />
                                    )}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function SidebarGroupLabelSimple({ children }: { children: ReactNode }) {
    return (
        <div className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {children}
        </div>
    );
}
