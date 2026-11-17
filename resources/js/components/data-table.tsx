import type { ReactNode } from 'react';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/utils';

export type DataTableColumn<T> = {
    key: string;
    header: ReactNode;
    className?: string;
    cellClassName?: string;
    render: (row: T) => ReactNode;
    /** Label shown in the stacked mobile card; defaults to a string header. */
    mobileLabel?: ReactNode;
    /** Hide this column entirely in the mobile card layout. */
    hideOnMobile?: boolean;
};

export function DataTable<T>({
    columns,
    rows,
    getRowKey,
    empty,
}: {
    columns: DataTableColumn<T>[];
    rows: T[];
    getRowKey: (row: T) => string | number;
    empty?: ReactNode;
}) {
    if (rows.length === 0) {
        return (
            <>
                {empty ?? (
                    <EmptyState
                        title="No records found"
                        description="Try changing or clearing the filters."
                    />
                )}
            </>
        );
    }

    return (
        <>
            {/* Desktop / tablet table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-xs md:block">
                <table className="w-full min-w-[44rem] border-collapse text-sm">
                    <thead className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className={cn(
                                        'px-4 py-3 font-medium',
                                        column.className,
                                    )}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={getRowKey(row)}
                                className="border-t transition-colors hover:bg-muted/30"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={cn(
                                            'px-4 py-3 align-middle',
                                            column.cellClassName,
                                        )}
                                    >
                                        {column.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="grid gap-3 md:hidden">
                {rows.map((row) => {
                    const detailColumns = columns.filter(
                        (column) =>
                            !column.hideOnMobile &&
                            column.header !== '' &&
                            column.mobileLabel !== null,
                    );
                    const actionColumns = columns.filter(
                        (column) =>
                            !column.hideOnMobile &&
                            (column.header === '' ||
                                column.mobileLabel === null),
                    );

                    return (
                        <div
                            key={getRowKey(row)}
                            className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs"
                        >
                            <div className="space-y-2">
                                {detailColumns.map((column) => (
                                    <div
                                        key={column.key}
                                        className="flex items-start justify-between gap-4 text-sm"
                                    >
                                        <span className="shrink-0 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                            {column.mobileLabel ??
                                                (typeof column.header ===
                                                'string'
                                                    ? column.header
                                                    : column.key)}
                                        </span>
                                        <div className="min-w-0 text-right">
                                            {column.render(row)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {actionColumns.length > 0 && (
                                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-3">
                                    {actionColumns.map((column) => (
                                        <div key={column.key}>
                                            {column.render(row)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
