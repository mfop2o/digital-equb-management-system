import { useForm } from '@inertiajs/react';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Payment } from '@/types/equb';

interface Props {
    payment: Payment | null;
    groupId: number;
    verifyRoute: string; // URL where to post
    open: boolean;
    onClose: () => void;
}

export function VerifyPaymentModal({
    payment,
    groupId: _groupId,
    verifyRoute,
    open,
    onClose,
}: Props) {
    if (!payment) return null;

    const [decision, setDecision] = useState<'verified' | 'rejected'>(
        'verified',
    );

    const { data, setData, post, processing, errors, reset } = useForm({
        decision: 'verified',
        reason: '',
    });

    const handleDecisionChange = (dec: 'verified' | 'rejected') => {
        setDecision(dec);
        setData('decision', dec);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(verifyRoute, {
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
                        <ShieldCheck className="h-5 w-5 text-blue-600" />
                        Verify Payment Evidence
                    </DialogTitle>
                    <DialogDescription>
                        Review transaction details and verify maker-checker
                        compliance.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-semibold text-emerald-600">
                            {Number(payment.amount).toLocaleString()} ETB
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Payment Method:
                        </span>
                        <span className="capitalize">
                            {payment.method?.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Reference #:
                        </span>
                        <span className="font-mono font-medium">
                            {payment.reference || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Date Paid:
                        </span>
                        <span>{payment.paid_on}</span>
                    </div>
                    {payment.notes && (
                        <div className="border-t pt-1.5 text-xs text-muted-foreground">
                            Note: {payment.notes}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Verification Decision *</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleDecisionChange('verified')}
                                className={`flex items-center justify-center gap-1.5 rounded-md border p-2.5 text-sm font-medium transition-all ${
                                    decision === 'verified'
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                                        : 'hover:bg-muted'
                                }`}
                            >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                Approve & Verify
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDecisionChange('rejected')}
                                className={`flex items-center justify-center gap-1.5 rounded-md border p-2.5 text-sm font-medium transition-all ${
                                    decision === 'rejected'
                                        ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                                        : 'hover:bg-muted'
                                }`}
                            >
                                <XCircle className="h-4 w-4 text-rose-600" />
                                Reject
                            </button>
                        </div>
                    </div>

                    {decision === 'rejected' && (
                        <div className="animate-in space-y-1.5 fade-in-50">
                            <Label htmlFor="reason" className="text-rose-600">
                                Rejection Reason *
                            </Label>
                            <textarea
                                id="reason"
                                rows={3}
                                placeholder="Explain why payment evidence was rejected (e.g. invalid reference, insufficient amount)..."
                                value={data.reason}
                                onChange={(e) =>
                                    setData('reason', e.target.value)
                                }
                                className="w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-sm focus:border-ring focus:outline-none"
                                required
                            />
                            {errors.reason && (
                                <p className="text-xs text-destructive">
                                    {errors.reason}
                                </p>
                            )}
                        </div>
                    )}

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
                            className={
                                decision === 'verified'
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-rose-600 text-white hover:bg-rose-700'
                            }
                        >
                            {decision === 'verified'
                                ? 'Confirm Approval'
                                : 'Confirm Rejection'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
