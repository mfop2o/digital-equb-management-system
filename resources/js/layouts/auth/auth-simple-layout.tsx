import { useState } from 'react';
import type { AuthLayoutProps } from '@/types';
import logoImage from '../../../images/logo.png';

function AuthLogo() {
    const [imgError, setImgError] = useState(false);
    const logoSrc = (logoImage as string) || '/assets/logo.png';

    return (
        <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-white p-2 shadow-md dark:bg-card">
            {imgError ? (
                <span className="text-2xl font-bold text-emerald-600">EMS</span>
            ) : (
                <img
                    src={logoSrc}
                    alt="Digital Equb Management System"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('/assets/logo.png')) {
                            target.src = '/assets/logo.png';
                        } else if (!target.src.endsWith('/logo.png')) {
                            target.src = '/logo.png';
                        } else {
                            setImgError(true);
                        }
                    }}
                />
            )}
        </div>
    );
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-border/70 bg-card px-8 pt-8 pb-8 shadow-xl text-card-foreground">
                    {/* Circle logo + title */}
                    <div className="mb-8 flex flex-col items-center gap-3">
                        <AuthLogo />
                        <h1 className="text-center text-base leading-snug font-semibold text-foreground">
                            {title || 'Digital Equb Management System'}
                        </h1>
                        {description && (
                            <p className="text-center text-xs text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    {children}
                </div>
            </div>
            <footer className="mt-6 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} Ethio Innovation Software
                Development PLC
            </footer>
        </div>
    );
}
