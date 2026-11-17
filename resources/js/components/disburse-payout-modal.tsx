import { useForm } from '@inertiajs/react';
import { ArrowUpRight, Wallet } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Payout } from '@/types/equb';

interface Props {
    payout: Payout | null;
    groupId: number;
    open: boolean;
    onClose: () => void;
}

export function DisbursePayoutModal({ payout, groupId, open, onClose }: Props) {
    if (!payout) return null;

    const { data, setData, post, processing, errors, reset } = useForm({
        method: 'bank_transfer',
        account_reference: '',
        disbursed_on: new Date().toISOString().split('T')[0],
        disbursement_reference: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/groups/${groupId}/payouts/${payout.id}/disburse`, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-emerald-600" />
                        Disburse Equb Payout
                    </DialogTitle>
                    <DialogDescription>
                        Slot #{payout.payout_sequence} &bull; Recipient:{' '}
                        <span className="font-semibold text-foreground">
                            {payout.member_profile?.full_name}
                        </span>{' '}
                        &bull; Total Pot:{' '}
                        <span className="font-semibold text-emerald-600">
                            {Number(payout.amount).toLocaleString()} ETB
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="disb-method">
                            Disbursement Channel *
                        </Label>
                        <select
                            id="disb-method"
                            value={data.method}
                            onChange={(e) => setData('method', e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none"
                            required
                        >
                            <option value="bank_transfer">
                                Commercial Bank of Ethiopia (CBE)
                            </option>
                            <option value="telebirr">
                                Telebirr Mobile Wallet
                            </option>
                            <option value="cbe_birr">
                                CBE Birr Mobile Wallet
                            </option>
                            <option value="awash_bank">
                                Awash Bank Transfer
                            </option>
                            <option value="dashen_bank">
                                Dashen Bank / Amole
                            </option>
                            <option value="cash">
                                Direct Cash Disbursement
                            </option>
                        </select>
                        {errors.method && (
                            <p className="text-xs text-destructive">
                                {errors.method}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="account_ref">
                            Recipient Account / Phone Number
                        </Label>
                        <Input
                            id="account_ref"
                            placeholder="e.g. 100029384756 or +251911..."
                            value={data.account_reference}
                            onChange={(e) =>
                                setData('account_reference', e.target.value)
                            }
                        />
                        {errors.account_reference && (
                            <p className="text-xs text-destructive">
                                {errors.account_reference}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="disb_ref">
                            Disbursement Reference / Transaction ID *
                        </Label>
                        <Input
                            id="disb_ref"
                            placeholder="Bank transfer slip # or mobile money TxID"
                            value={data.disbursement_reference}
                            onChange={(e) =>
                                setData(
                                    'disbursement_reference',
                                    e.target.value,
                                )
                            }
                            required
                        />
                        {errors.disbursement_reference && (
                            <p className="text-xs text-destructive">
                                {errors.disbursement_reference}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="disb_date">Disbursement Date *</Label>
                        <Input
                            id="disb_date"
                            type="date"
                            value={data.disbursed_on}
                            onChange={(e) =>
                                setData('disbursed_on', e.target.value)
                            }
                            required
                        />
                        {errors.disbursed_on && (
                            <p className="text-xs text-destructive">
                                {errors.disbursed_on}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="disb_notes">Notes / Observations</Label>
                        <Input
                            id="disb_notes"
                            placeholder="Optional notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            <ArrowUpRight className="mr-1.5 h-4 w-4" />
                            {processing
                                ? 'Processing...'
                                : 'Confirm Disbursement'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
