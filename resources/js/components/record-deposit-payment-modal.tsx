import { useForm } from '@inertiajs/react';
import { Banknote, CheckCircle2 } from 'lucide-react';
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
import type { DepositObligation } from '@/types/equb';

interface Props {
    obligation: DepositObligation | null;
    groupId: number;
    open: boolean;
    onClose: () => void;
}

export function RecordDepositPaymentModal({
    obligation,
    groupId,
    open,
    onClose,
}: Props) {
    if (!obligation) return null;

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: obligation.amount_due,
        method: 'bank_transfer',
        reference: '',
        paid_on: new Date().toISOString().split('T')[0],
        notes: '',
        evidence_file_path: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/groups/${groupId}/deposits/obligations/${obligation.id}/pay`, {
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
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        Record Initial Deposit Payment
                    </DialogTitle>
                    <DialogDescription>
                        Member:{' '}
                        <span className="font-semibold text-foreground">
                            {obligation.member_profile?.full_name}
                        </span>{' '}
                        ( Due: {Number(obligation.amount_due).toLocaleString()}{' '}
                        ETB)
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="amount">Payment Amount (ETB) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            required
                        />
                        {errors.amount && (
                            <p className="text-xs text-destructive">
                                {errors.amount}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="method">Payment Method *</Label>
                        <select
                            id="method"
                            value={data.method}
                            onChange={(e) => setData('method', e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none"
                            required
                        >
                            <option value="bank_transfer">
                                Bank Transfer (CBE, Awash, Dashen, etc.)
                            </option>
                            <option value="mobile_money">
                                Mobile Money (Telebirr, CBE Birr)
                            </option>
                            <option value="cash">Cash on Hand</option>
                            <option value="cheque">Cheque</option>
                            <option value="other">Other</option>
                        </select>
                        {errors.method && (
                            <p className="text-xs text-destructive">
                                {errors.method}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="reference">
                            Transaction Reference / Slip #
                        </Label>
                        <Input
                            id="reference"
                            placeholder="e.g. FT260849XXXX or Telebirr Trans ID"
                            value={data.reference}
                            onChange={(e) =>
                                setData('reference', e.target.value)
                            }
                        />
                        {errors.reference && (
                            <p className="text-xs text-destructive">
                                {errors.reference}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="paid_on">Date Paid *</Label>
                        <Input
                            id="paid_on"
                            type="date"
                            value={data.paid_on}
                            onChange={(e) => setData('paid_on', e.target.value)}
                            required
                        />
                        {errors.paid_on && (
                            <p className="text-xs text-destructive">
                                {errors.paid_on}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Notes / Remarks</Label>
                        <Input
                            id="notes"
                            placeholder="Optional notes or depositor name"
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
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            {processing ? 'Submitting...' : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
