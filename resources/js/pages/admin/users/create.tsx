import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    roles: string[];
    canAssignSuperAdmin: boolean;
};

export default function CreateUser({ roles, canAssignSuperAdmin }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        email: string;
        phone: string;
        roles: string[];
    }>({
        name: '',
        email: '',
        phone: '',
        roles: [],
    });

    const toggleRole = (role: string, checked: boolean) => {
        setData(
            'roles',
            checked
                ? [...data.roles, role]
                : data.roles.filter((item) => item !== role),
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/admin/users', { preserveScroll: true });
    };

    setLayoutProps({
        breadcrumbs: [
            { title: 'Users', href: '/admin/users' },
            { title: 'Invite user', href: '/admin/users/create' },
        ],
    });

    return (
        <>
            <Head title="Invite user" />

            <PageContainer>
                <PageHeader
                    title="Invite user"
                    description="The account is created immediately, but the person receives a single-use link to set their own password. No password is ever emailed."
                    actions={
                        <Button asChild variant="outline">
                            <Link href="/admin/users">
                                <ArrowLeft />
                                Back to users
                            </Link>
                        </Button>
                    }
                />

                <form
                    onSubmit={submit}
                    className="max-w-2xl space-y-6 rounded-lg border p-5"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            autoComplete="name"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(event) =>
                                setData('email', event.target.value)
                            }
                            autoComplete="email"
                            required
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                            id="phone"
                            value={data.phone}
                            onChange={(event) =>
                                setData('phone', event.target.value)
                            }
                            autoComplete="tel"
                            placeholder="09xx xxx xxx"
                        />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <Label>Roles</Label>
                            <p className="text-xs text-muted-foreground">
                                Multiple roles are allowed. The account receives
                                the combined permissions.
                                {canAssignSuperAdmin
                                    ? ''
                                    : ' Only a super administrator can grant the super-admin role.'}
                            </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            {roles.map((role) => (
                                <label
                                    key={role}
                                    className="flex items-center gap-2 rounded-md border p-3"
                                >
                                    <Checkbox
                                        checked={data.roles.includes(role)}
                                        onCheckedChange={(checked) =>
                                            toggleRole(role, checked === true)
                                        }
                                    />
                                    <span className="text-sm capitalize">
                                        {role.replaceAll('-', ' ')}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.roles} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={processing}>
                            <Send />
                            Send invitation
                        </Button>
                        <Button asChild variant="ghost">
                            <Link href="/admin/users">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </>
    );
}
