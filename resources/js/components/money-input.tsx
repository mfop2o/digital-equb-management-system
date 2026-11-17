import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function MoneyInput({
    id,
    name,
    defaultValue,
    placeholder = '0.00',
    required = false,
    disabled = false,
    className,
}: {
    id?: string;
    name: string;
    defaultValue?: string | number;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <div className={cn('relative', className)}>
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-medium text-muted-foreground">
                ETB
            </span>
            <Input
                id={id ?? name}
                name={name}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                defaultValue={defaultValue}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className="pl-12 tabular-nums"
            />
        </div>
    );
}
