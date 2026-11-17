import { Eye } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

export function AuditorBanner() {
    const { isAuditor } = usePermissions();

    if (!isAuditor) {
        return null;
    }

    return (
        <div className="border-b border-border/70 bg-muted/50 px-4 py-2 text-foreground">
            <div className="flex items-center gap-2 text-xs font-medium">
                <Eye className="size-4 shrink-0 text-emerald-600" />
                <span>
                    <span className="font-semibold text-foreground">Read-only auditor mode:</span>{' '}
                    <span className="text-muted-foreground">
                        Auditor accounts can review records but cannot create, approve, or modify them.
                    </span>
                </span>
            </div>
        </div>
    );
}
