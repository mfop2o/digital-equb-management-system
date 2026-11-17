import { Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import type { LocaleCode } from '@/i18n';

interface LanguageSwitcherProps {
    variant?: 'ghost' | 'outline' | 'default';
    size?: 'sm' | 'default' | 'icon';
    showLabel?: boolean;
    className?: string;
}

export function LanguageSwitcher({
    variant = 'ghost',
    size = 'sm',
    showLabel = true,
    className = '',
}: LanguageSwitcherProps) {
    const { locale, setLocale, availableLocales, currentConfig } =
        useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={`flex items-center gap-2 font-medium ${className}`}
                    title="Change Language / ቋንቋ ቀይር / Afaan Jijjiiri"
                >
                    <Globe className="size-4 shrink-0 opacity-80" />
                    <span className="text-sm">{currentConfig.flag}</span>
                    {showLabel && (
                        <span className="hidden text-xs font-medium sm:inline-block">
                            {currentConfig.nativeName}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1">
                <div className="px-2 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Select Language
                </div>
                {availableLocales.map((item) => (
                    <DropdownMenuItem
                        key={item.code}
                        onClick={() => setLocale(item.code as LocaleCode)}
                        className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm">{item.flag}</span>
                            <div className="flex flex-col text-left">
                                <span className="font-medium text-foreground">
                                    {item.nativeName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {item.label}
                                </span>
                            </div>
                        </div>
                        {locale === item.code && (
                            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
