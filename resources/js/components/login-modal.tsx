import { Form } from '@inertiajs/react';
import { LogIn, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

interface LoginModalProps {
    trigger?: React.ReactNode;
    defaultOpen?: boolean;
}

export function LoginModal({ trigger, defaultOpen = false }: LoginModalProps) {
    const [open, setOpen] = useState(defaultOpen);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const fillDemoAdmin = () => {
        setEmail('admin@gmail.com');
        setPassword('password');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="overflow-hidden border-border/80 p-0 shadow-2xl sm:max-w-[440px]">
                {/* Header with emerald gradient motif */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 px-6 pt-7 pb-6 text-white">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-md">
                                <ShieldCheck className="size-5 text-emerald-300" />
                            </div>
                            <span className="text-xs font-semibold tracking-wider text-emerald-200 uppercase">
                                Secure Portal
                            </span>
                        </div>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[11px] text-emerald-100">
                            v1.0
                        </span>
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-white">
                        Equb Management System
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-xs text-emerald-100/90">
                        የኢትዮጵያ ዲጂታል ዕቁብ አስተዳደር — Secure Staff & Member
                        Authentication
                    </DialogDescription>
                </div>

                <div className="p-6">
                    {/* Quick Demo Credentials Pill */}
                    <div className="mb-5 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs dark:bg-emerald-950/20">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                            <Sparkles className="size-4 shrink-0" />
                            <span>
                                Quick Demo: <strong>admin@gmail.com</strong>
                            </span>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={fillDemoAdmin}
                            className="h-7 border-emerald-500/40 text-xs hover:bg-emerald-500/20"
                        >
                            Fill Credentials
                        </Button>
                    </div>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="modal-email"
                                        className="text-xs font-medium"
                                    >
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                        <Input
                                            id="modal-email"
                                            type="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            placeholder="admin@gmail.com"
                                            className="pl-9 text-sm"
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="modal-password"
                                        className="text-xs font-medium"
                                    >
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <PasswordInput
                                            id="modal-password"
                                            name="password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            required
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className="text-sm"
                                        />
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="modal-remember"
                                            name="remember"
                                        />
                                        <Label
                                            htmlFor="modal-remember"
                                            className="cursor-pointer text-xs"
                                        >
                                            Remember me
                                        </Label>
                                    </div>
                                    <span className="text-muted-foreground">
                                        Admin & Member Access
                                    </span>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 font-medium text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-700"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Spinner className="mr-2" />
                                    ) : (
                                        <LogIn className="mr-2 size-4" />
                                    )}
                                    Sign In to Equb Dashboard
                                </Button>
                            </>
                        )}
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
