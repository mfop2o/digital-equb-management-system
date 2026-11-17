import { Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    CircleDot,
    Coins,
    Compass,
    KeyRound,
    LayoutGrid,
    LogOut,
    RotateCw,
    ScrollText,
    Shield,
    ShieldCheck,
    Shuffle,
    UserCheck,
    UserCircle,
    Users,
    Vote,
    X,
} from 'lucide-react';
import { useEffect } from 'react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { can } = usePermissions();
    const { t } = useTranslation();
    const { url, props } = usePage();
    const { setOpenMobile } = useSidebar();

    // Extract current group ID from URL path or page props.
    const groupMatch = url.match(/\/groups\/(\d+)/);
    const pageGroup = (props as { group?: { id?: number | string } }).group;
    const activeGroupId = groupMatch
        ? groupMatch[1]
        : pageGroup?.id
          ? String(pageGroup.id)
          : null;

    // A navigation click also closes the sheet, but this covers redirects and
    // browser back/forward when the sheet stays mounted.
    useEffect(() => {
        setOpenMobile(false);
    }, [url, setOpenMobile]);

    // Single flat navigation list — completely free of category separators.
    const navItems: NavItem[] = [
        {
            title: t('nav.dashboard'),
            href: dashboard(),
            icon: LayoutGrid,
            exact: true,
        },
        {
            title: t('nav.discoverGroups'),
            href: '/explore',
            icon: Compass,
        },
        ...(can('groups.view')
            ? [
                  {
                      title: t('nav.equbGroups'),
                      href: '/groups',
                      icon: CircleDot,
                      exact: true,
                  },
              ]
            : []),

        // When actively inside a group, show that circle's modules. Each entry
        // is permission-filtered because group-scoped roles differ.
        ...(activeGroupId
            ? [
                  {
                      title: t('groups.groupDetails'),
                      href: `/groups/${activeGroupId}`,
                      icon: CircleDot,
                      exact: true,
                  },
                  ...(can('deposits.view')
                      ? [
                            {
                                title: t('nav.initialDeposits'),
                                href: `/groups/${activeGroupId}/deposits`,
                                icon: ShieldCheck,
                            },
                        ]
                      : []),
                  ...(can('contributions.view')
                      ? [
                            {
                                title: t('nav.contributions'),
                                href: `/groups/${activeGroupId}/contributions`,
                                icon: RotateCw,
                            },
                        ]
                      : []),
                  ...(can('payouts.view')
                      ? [
                            {
                                title: t('nav.payoutSchedule'),
                                href: `/groups/${activeGroupId}/payouts`,
                                icon: Coins,
                            },
                            {
                                title: t('nav.lotteryDraws'),
                                href: `/groups/${activeGroupId}/lottery`,
                                icon: Shuffle,
                            },
                        ]
                      : []),
                  ...(can('governance.view')
                      ? [
                            {
                                title: t('nav.governance'),
                                href: `/groups/${activeGroupId}/governance`,
                                icon: Vote,
                            },
                        ]
                      : []),
                  ...(can('ledger.view')
                      ? [
                            {
                                title: t('nav.ledger'),
                                href: `/groups/${activeGroupId}/finance`,
                                icon: BookOpen,
                            },
                        ]
                      : []),
                  ...(can('penalties.view')
                      ? [
                            {
                                title: t('nav.penalties'),
                                href: `/groups/${activeGroupId}/penalties`,
                                icon: AlertTriangle,
                            },
                        ]
                      : []),
                  ...(can('withdrawals.approve')
                      ? [
                            {
                                title: t('nav.withdrawals'),
                                href: `/groups/${activeGroupId}/withdrawals`,
                                icon: LogOut,
                            },
                        ]
                      : []),
              ]
            : []),

        ...(can('members.view')
            ? [
                  {
                      title: t('nav.members'),
                      href: '/members',
                      icon: UserCheck,
                  },
              ]
            : []),
        {
            title: t('nav.profile'),
            href: '/settings/profile',
            icon: UserCircle,
        },
        {
            title: t('nav.security'),
            href: '/settings/security',
            icon: ShieldCheck,
        },
        ...(can('users.view')
            ? [
                  {
                      title: t('nav.users'),
                      href: '/admin/users',
                      icon: Users,
                  },
              ]
            : []),
        ...(can('roles.view')
            ? [
                  {
                      title: t('nav.roles'),
                      href: '/admin/roles',
                      icon: Shield,
                  },
              ]
            : []),
        ...(can('permissions.manage')
            ? [
                  {
                      title: t('nav.permissions'),
                      href: '/admin/permissions',
                      icon: KeyRound,
                  },
              ]
            : []),
        ...(can('audit.view')
            ? [
                  {
                      title: t('nav.auditLog'),
                      href: '/admin/audit',
                      icon: ScrollText,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader className="border-b border-sidebar-border/60 p-2">
                <div className="flex items-center gap-1">
                    <SidebarMenu className="min-w-0 flex-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href={dashboard()} prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-foreground md:hidden"
                        onClick={() => setOpenMobile(false)}
                        aria-label="Close navigation"
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                {props.auth && (props.auth as { user?: unknown }).user ? (
                    <NavUser />
                ) : (
                    <div className="flex flex-col gap-1.5 p-2">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs font-medium"
                        >
                            <Link href="/login">{t('auth.login', 'Log in')}</Link>
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            className="w-full justify-start bg-[#759B46] hover:bg-[#5F8037] text-white text-xs font-medium"
                        >
                            <Link href="/register">
                                {t('auth.register', 'Create account')}
                            </Link>
                        </Button>
                    </div>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
