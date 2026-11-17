import { useForm } from '@inertiajs/react';
import { CircleDot, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuickGroupModalProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function QuickGroupModal({ trigger, onSuccess }: QuickGroupModalProps) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        category: 'Business & Trade',
        max_members: '12',
        contribution_amount: '5000',
        contribution_frequency: 'monthly',
        expected_members: '12',
        // Confirmed: initial deposits are accumulated and retained by the group.
        initial_deposit_rounds: '2',
        initial_deposit_amount: '1000',
        initial_deposit_treatment: 'retained',
        rotation_method: 'predetermined',
        payout_commencement_rule: 'deposit_completion_and_date',
        allow_partial_contributions: false,
        late_penalty_enabled: true,
        late_penalty_fixed_amount: '100',
        late_penalty_grace_days: '3',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/groups', {
            onSuccess: () => {
                setOpen(false);
                reset();
                onSuccess?.();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
                    >
                        <Plus className="mr-1.5 size-4" />
                        New Equb Circle
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-[560px]">
                <DialogHeader className="mb-4 border-b pb-3">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <CircleDot className="size-5 text-emerald-600" />
                        Create New Equb Circle
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Configure group rules, contribution frequency, and
                        retained deposit rounds.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                            <Label htmlFor="qg-name" className="text-xs">
                                Group Name *
                            </Label>
                            <Input
                                id="qg-name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="e.g. Merkato Retailers Monthly Equb"
                                required
                                className="h-9 text-sm"
                            />
                            {errors.name && (
                                <p className="text-[11px] text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="qg-cat" className="text-xs">
                                Category
                            </Label>
                            <Input
                                id="qg-cat"
                                value={data.category}
                                onChange={(e) =>
                                    setData('category', e.target.value)
                                }
                                className="h-9 text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="qg-max" className="text-xs">
                                Max Members
                            </Label>
                            <Input
                                id="qg-max"
                                type="number"
                                min={2}
                                value={data.max_members}
                                onChange={(e) => {
                                    setData('max_members', e.target.value);
                                    setData('expected_members', e.target.value);
                                }}
                                required
                                className="h-9 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="qg-amount" className="text-xs">
                                Contribution Amount (ETB) *
                            </Label>
                            <Input
                                id="qg-amount"
                                type="number"
                                min={1}
                                step="0.01"
                                value={data.contribution_amount}
                                onChange={(e) =>
                                    setData(
                                        'contribution_amount',
                                        e.target.value,
                                    )
                                }
                                required
                                className="h-9 font-mono text-sm"
                            />
                            {errors.contribution_amount && (
                                <p className="text-[11px] text-destructive">
                                    {errors.contribution_amount}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="qg-freq" className="text-xs">
                                Contribution Frequency
                            </Label>
                            <select
                                id="qg-freq"
                                value={data.contribution_frequency}
                                onChange={(e) =>
                                    setData(
                                        'contribution_frequency',
                                        e.target.value,
                                    )
                                }
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                            >
                                <option value="monthly">Monthly (በወር)</option>
                                <option value="biweekly">
                                    Bi-Weekly (በሁለት ሳምንት)
                                </option>
                                <option value="weekly">Weekly (በሳምንት)</option>
                                <option value="daily">Daily (በየቀኑ)</option>
                            </select>
                        </div>
                    </div>

                    {/* Initial Deposit Rounds */}
                    <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                            <span>Initial Deposit Rounds</span>
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-normal">
                                Retained
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label
                                    htmlFor="qg-dep-rounds"
                                    className="text-xs"
                                >
                                    Number of Rounds
                                </Label>
                                <Input
                                    id="qg-dep-rounds"
                                    type="number"
                                    min={0}
                                    max={12}
                                    value={data.initial_deposit_rounds}
                                    onChange={(e) =>
                                        setData(
                                            'initial_deposit_rounds',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="qg-dep-amt" className="text-xs">
                                    Amount per Round (ETB)
                                </Label>
                                <Input
                                    id="qg-dep-amt"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={data.initial_deposit_amount}
                                    onChange={(e) =>
                                        setData(
                                            'initial_deposit_amount',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 font-mono text-xs"
                                />
                            </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Collected deposits are accumulated and retained by
                            the group, separate from contributions and payout
                            funds.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={processing}
                        >
                            {processing ? 'Creating…' : 'Create Group'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
