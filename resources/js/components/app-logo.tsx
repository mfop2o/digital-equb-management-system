import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import logoImage from '../../images/logo.png';

export default function AppLogo() {
    const { name, logo_url } = usePage().props as {
        name?: string;
        logo_url?: string;
    };
    // One clean fallback: shared logo URL → bundled logo → letter mark.
    const [failed, setFailed] = useState(false);
    const initial = String(name ?? 'E')
        .charAt(0)
        .toUpperCase();

    return (
        <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-white p-0.5 shadow-xs dark:bg-card">
                {failed ? (
                    <span className="text-xs font-bold text-emerald-600">
                        {initial}
                    </span>
                ) : (
                    <img
                        src={logo_url || logoImage}
                        alt={name ?? 'Logo'}
                        className="h-full w-full object-contain"
                        onError={() => setFailed(true)}
                    />
                )}
            </div>
            {/* App name — hidden when sidebar is collapsed (icon mode) */}
            <span className="truncate text-sm leading-tight font-semibold group-data-[collapsible=icon]:hidden">
                {name}
            </span>
        </div>
    );
}
