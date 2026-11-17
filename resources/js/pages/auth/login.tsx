import { Form, Head } from '@inertiajs/react';
import { Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <>
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Email */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="email"
                                className="text-sm text-slate-600"
                            >
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="h-11 rounded-lg border-slate-200 pl-9 text-sm"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Password */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="password"
                                    className="text-sm text-slate-600"
                                >
                                    Password
                                </Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-xs text-emerald-600 hover:text-emerald-700"
                                        tabIndex={5}
                                    >
                                        Forgot password?
                                    </TextLink>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-slate-400" />
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className="h-11 rounded-lg border-slate-200 pl-9 text-sm"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="remember"
                                name="remember"
                                tabIndex={3}
                            />
                            <Label
                                htmlFor="remember"
                                className="cursor-pointer text-sm font-normal text-slate-500"
                            >
                                Remember me
                            </Label>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            className="h-11 w-full rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            {processing ? <Spinner className="mr-2" /> : null}
                            Log in
                        </Button>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-center text-xs font-medium text-emerald-800">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Digital Equb Management System',
    description: '',
};
