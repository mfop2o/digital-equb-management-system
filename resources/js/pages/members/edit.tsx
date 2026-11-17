import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MemberProfile } from '@/types';

type Props = { member: MemberProfile };

export default function EditMember({ member }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        first_name: member.first_name,
        middle_name: member.middle_name,
        last_name: member.last_name,
        phone: member.phone,
        alternative_phone: member.alternative_phone ?? '',
        email: member.email ?? '',
        date_of_birth: member.date_of_birth ?? '',
        gender: member.gender ?? '',
        occupation: member.occupation ?? '',
        address_city: member.address_city,
        address_subcity: member.address_subcity ?? '',
        address_woreda: member.address_woreda ?? '',
        address_house_no: member.address_house_no ?? '',
        notes: member.notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/members/${member.id}`);
    };

    setLayoutProps({
        breadcrumbs: [
            { title: 'Members', href: '/members' },
            {
                title: 'Edit',
                href: `/members/${member.id}/edit`,
            },
        ],
    });

    return (
        <>
            <Head title={`Edit — ${member.full_name}`} />

            <PageContainer>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/members/${member.id}`}>
                            <ChevronLeft />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Edit Member
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {member.member_number} — {member.full_name}
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {(
                                [
                                    'first_name',
                                    'middle_name',
                                    'last_name',
                                ] as const
                            ).map((field) => (
                                <div key={field} className="space-y-1.5">
                                    <Label htmlFor={field}>
                                        {field === 'first_name'
                                            ? 'First Name'
                                            : field === 'middle_name'
                                              ? "Father's Name"
                                              : "Grand Father's Name"}{' '}
                                        *
                                    </Label>
                                    <Input
                                        id={field}
                                        value={data[field]}
                                        onChange={(e) =>
                                            setData(field, e.target.value)
                                        }
                                        required
                                    />
                                    {errors[field] && (
                                        <p className="text-xs text-destructive">
                                            {errors[field]}
                                        </p>
                                    )}
                                </div>
                            ))}

                            <div className="space-y-1.5">
                                <Label htmlFor="date_of_birth">
                                    Date of Birth
                                </Label>
                                <Input
                                    id="date_of_birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) =>
                                        setData('date_of_birth', e.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="gender">Gender</Label>
                                <select
                                    id="gender"
                                    value={data.gender}
                                    onChange={(e) =>
                                        setData('gender', e.target.value)
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                >
                                    <option value="">Select</option>
                                    <option value="male">Male (ወንድ)</option>
                                    <option value="female">Female (ሴት)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="occupation">Occupation</Label>
                                <Input
                                    id="occupation"
                                    value={data.occupation}
                                    onChange={(e) =>
                                        setData('occupation', e.target.value)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid content-start gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone">
                                        Mobile Phone *
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData('phone', e.target.value)
                                        }
                                        required
                                    />
                                    {errors.phone && (
                                        <p className="text-xs text-destructive">
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="alternative_phone">
                                        Alternative Phone
                                    </Label>
                                    <Input
                                        id="alternative_phone"
                                        type="tel"
                                        value={data.alternative_phone}
                                        onChange={(e) =>
                                            setData(
                                                'alternative_phone',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Address</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="address_city">City</Label>
                                    <Input
                                        id="address_city"
                                        value={data.address_city}
                                        onChange={(e) =>
                                            setData(
                                                'address_city',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="address_subcity">
                                        Sub-city
                                    </Label>
                                    <Input
                                        id="address_subcity"
                                        value={data.address_subcity}
                                        onChange={(e) =>
                                            setData(
                                                'address_subcity',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="address_woreda">
                                        Woreda
                                    </Label>
                                    <Input
                                        id="address_woreda"
                                        value={data.address_woreda}
                                        onChange={(e) =>
                                            setData(
                                                'address_woreda',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="address_house_no">
                                        House No.
                                    </Label>
                                    <Input
                                        id="address_house_no"
                                        value={data.address_house_no}
                                        onChange={(e) =>
                                            setData(
                                                'address_house_no',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end gap-3 lg:col-span-2">
                        <Button asChild variant="outline">
                            <Link href={`/members/${member.id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </>
    );
}
