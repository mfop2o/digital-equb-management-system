import type { InertiaLinkProps } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { toUrl } from '@/lib/utils';

export type IsCurrentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
    startsWith?: boolean,
) => boolean;

export type IsCurrentOrParentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
) => boolean;

export type WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    ifTrue: TIfTrue,
    ifFalse?: TIfFalse,
) => TIfTrue | TIfFalse;

export type UseCurrentUrlReturn = {
    currentUrl: string;
    isCurrentUrl: IsCurrentUrlFn;
    isCurrentOrParentUrl: IsCurrentOrParentUrlFn;
    whenCurrentUrl: WhenCurrentUrlFn;
};

function normalizePath(path: string): string {
    const pathname = path.split(/[?#]/)[0] ?? path;

    if (pathname === '') {
        return '/';
    }

    const withLeadingSlash = pathname.startsWith('/')
        ? pathname
        : `/${pathname}`;

    return withLeadingSlash === '/'
        ? '/'
        : withLeadingSlash.replace(/\/+$/, '');
}

function pathFromHref(href: NonNullable<InertiaLinkProps['href']>): string {
    const urlString = toUrl(href);

    if (!urlString.startsWith('http')) {
        return normalizePath(urlString);
    }

    try {
        return normalizePath(new URL(urlString).pathname);
    } catch {
        return normalizePath(urlString);
    }
}

export function useCurrentUrl(): UseCurrentUrlReturn {
    const page = usePage();

    const currentUrlPath =
        typeof window !== 'undefined'
            ? new URL(page.url, window.location.origin).pathname
            : normalizePath(page.url);

    const isCurrentUrl: IsCurrentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
        startsWith: boolean = false,
    ) => {
        const urlToCompare = normalizePath(currentUrl ?? currentUrlPath);
        const urlString = pathFromHref(urlToCheck);

        if (!startsWith) {
            return urlString === urlToCompare;
        }

        // Compare complete path segments so `/groups` never lights up on
        // `/groups/12`, and `/members` never lights up on `/memberships`.
        return (
            urlToCompare === urlString ||
            urlToCompare.startsWith(urlString === '/' ? '/' : `${urlString}/`)
        );
    };

    const isCurrentOrParentUrl: IsCurrentOrParentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
    ) => {
        return isCurrentUrl(urlToCheck, currentUrl, true);
    };

    const whenCurrentUrl: WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        ifTrue: TIfTrue,
        ifFalse: TIfFalse = null as TIfFalse,
    ): TIfTrue | TIfFalse => {
        return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
    };

    return {
        currentUrl: currentUrlPath,
        isCurrentUrl,
        isCurrentOrParentUrl,
        whenCurrentUrl,
    };
}
