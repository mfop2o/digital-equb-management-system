import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    KeyRound,
    Lock,
    LockOpen,
    RotateCcw,
    ShieldCheck,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

type ManagedUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    status_label: string;
    roles: string[];
    email_verified_at: string | null;
    last_login_at: string | null;
    must_change_password: boolean;
    is_super_admin: boolean;
    is_auditor: boolean;
    is_self: boolean;
};

type Props = {
    managedUser: ManagedUser;
    assignableRoles: string[];
    canAssignRoles: boolean;
    canResetPassword: boolean;
    canDeactivate: boolean;
    canActivate: boolean;
    canUnlock: boolean;
};

export default function EditUser({
    managedUser,
    assignableRoles,
    canAssignRoles,
    canResetPassword,
    canDeactivate,
    canActivate,
    canUnlock,
}: Props) {
    const [deactivateOpen, setDeactivateOpen] = useState(false);

    const detailsForm = useForm({
        name: managedUser.name,
        email: managedUser.email,
        phone: managedUser.phone ?? '',
    });

    const rolesForm = useForm<{ roles: string[] }>({
        roles: managedUser.roles,
    });

    const deactivateForm = useForm({ reason: '' });

    const submitDetails = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        detailsForm.patch(`/admin/users/${managedUser.id}`, {
            preserveScroll: true,
        });
    };

    const submitRoles = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        rolesForm.put(`/admin/users/${managedUser.id}/roles`, {
            preserveScroll: true,
        });
    };

    const toggleRole = (role: string, checked: boolean) => {
        rolesForm.setData(
            'roles',
            checked
                ? [...rolesForm.data.roles, role]
                : rolesForm.data.roles.filter((item) => item !== role),
        );
    };

    const submitDeactivate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        deactivateForm.post(`/admin/users/${managedUser.id}/deactivate`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeactivateOpen(false);
                deactivateForm.reset();
            },
        });
    };

    setLayoutProps({
        breadcrumbs: [{ title: 'Users', href: '/admin/users' }],
    });

    return (
        <>
            <Head title={`Manage ${managedUser.name}`} />

            <PageContainer>
                <PageHeader
                    title={managedUser.name}
                    description="Update account details, roles, and access state. Role and status changes are audited."
                    actions={
                        <Button asChild variant="outline">
                            <Link href="/admin/users">
                                <ArrowLeft />
                                Back to users
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <section className="space-y-4 rounded-lg border p-5">
                            <h2 className="font-semibold">Account details</h2>

                            <form
                                onSubmit={submitDetails}
                                className="space-y-4"
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full name</Label>
                                    <Input
                                        id="name"
                                        value={detailsForm.data.name}
                                        onChange={(event) =>
                                            detailsForm.setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={detailsForm.errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={detailsForm.data.email}
                                        onChange={(event) =>
                                            detailsForm.setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={detailsForm.errors.email}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="phone">
                                        Phone (optional)
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={detailsForm.data.phone}
                                        onChange={(event) =>
                                            detailsForm.setData(
                                                'phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={detailsForm.errors.phone}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={detailsForm.processing}
                                >
                                    Save changes
                                </Button>
                            </form>
                        </section>

                        <section className="space-y-4 rounded-lg border p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold">Roles</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Permissions are the union of all
                                        assigned roles.
                                    </p>
                                </div>
                                {managedUser.is_super_admin && (
                                    <Badge variant="outline">Super admin</Badge>
                                )}
                            </div>

                            {managedUser.is_self && (
                                <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
                                    You cannot change your own roles. Ask
                                    another super administrator to make this
                                    change.
                                </p>
                            )}

                            <form onSubmit={submitRoles} className="space-y-4">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {assignableRoles.map((role) => (
                                        <label
                                            key={role}
                                            className="flex items-center gap-2 rounded-md border p-3"
                                        >
                                            <Checkbox
                                                checked={rolesForm.data.roles.includes(
                                                    role,
                                                )}
                                                disabled={
                                                    !canAssignRoles ||
                                                    managedUser.is_self
                                                }
                                                onCheckedChange={(checked) =>
                                                    toggleRole(
                                                        role,
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <span className="text-sm capitalize">
                                                {role.replaceAll('-', ' ')}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={rolesForm.errors.roles} />
                                <Button
                                    type="submit"
                                    disabled={
                                        !canAssignRoles ||
                                        managedUser.is_self ||
                                        rolesForm.processing
                                    }
                                >
                                    Save roles
                                </Button>
                            </form>
                        </section>
                    </div>

                    <aside className="space-y-6">
                        <section className="space-y-4 rounded-lg border p-5">
                            <h2 className="font-semibold">Account state</h2>

                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Status
                                </span>
                                <StatusBadge
                                    status={managedUser.status}
                                    label={managedUser.status_label}
                                />
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Email verified
                                </span>
                                <Badge
                                    variant={
                                        managedUser.email_verified_at
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                >
                                    {managedUser.email_verified_at
                                        ? 'Yes'
                                        : 'No'}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Password change
                                </span>
                                <Badge
                                    variant={
                                        managedUser.must_change_password
                                            ? 'outline'
                                            : 'secondary'
                                    }
                                >
                                    {managedUser.must_change_password
                                        ? 'Required'
                                        : 'Not required'}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Last sign-in
                                </span>
                                <span className="text-xs">
                                    {managedUser.last_login_at
                                        ? new Date(
                                              managedUser.last_login_at,
                                          ).toLocaleString()
                                        : 'Never'}
                                </span>
                            </div>
                        </section>

                        <section className="space-y-3 rounded-lg border p-5">
                            <h2 className="font-semibold">Access actions</h2>

                            {canResetPassword && (
                                <ConfirmDialog
                                    trigger={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-start"
                                        >
                                            <KeyRound />
                                            Send password reset link
                                        </Button>
                                    }
                                    title="Reset this password?"
                                    description="The current password will stop working immediately. The user receives a single-use link to set a new password."
                                    confirmLabel="Send reset link"
                                    destructive={false}
                                    onConfirm={() =>
                                        router.post(
                                            `/admin/users/${managedUser.id}/reset-password`,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                />
                            )}

                            {canDeactivate &&
                                managedUser.status === 'active' && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="w-full justify-start"
                                        onClick={() => setDeactivateOpen(true)}
                                    >
                                        <Lock />
                                        Deactivate account
                                    </Button>
                                )}

                            {canActivate && managedUser.status !== 'active' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() =>
                                        router.post(
                                            `/admin/users/${managedUser.id}/activate`,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <LockOpen />
                                    Reactivate account
                                </Button>
                            )}

                            {canUnlock && managedUser.status === 'locked' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() =>
                                        router.post(
                                            `/admin/users/${managedUser.id}/unlock`,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <RotateCcw />
                                    Unlock account
                                </Button>
                            )}

                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                                Accounts are never deleted. Deactivation closes
                                open sessions and preserves all history.
                            </div>
                        </section>
                    </aside>
                </div>
            </PageContainer>

            <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
                <DialogContent>
                    <form onSubmit={submitDeactivate} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Deactivate account</DialogTitle>
                            <DialogDescription>
                                The user is signed out and cannot sign in again
                                until reactivated. Financial history is kept.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-2">
                            <Label htmlFor="reason">Reason (optional)</Label>
                            <textarea
                                id="reason"
                                value={deactivateForm.data.reason}
                                onChange={(event) =>
                                    deactivateForm.setData(
                                        'reason',
                                        event.target.value,
                                    )
                                }
                                rows={3}
                                maxLength={500}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            />
                            <InputError
                                message={deactivateForm.errors.reason}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeactivateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={deactivateForm.processing}
                            >
                                Deactivate
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
