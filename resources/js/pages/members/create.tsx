import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MemberFormData = {
    first_name: string;
    middle_name: string;
    last_name: string;
    phone: string;
    alternative_phone: string;
    email: string;
    date_of_birth: string;
    gender: string;
    occupation: string;
    address_city: string;
    address_subcity: string;
    address_woreda: string;
    address_house_no: string;
    notes: string;
    id_type: string;
    id_number: string;
    issuing_authority: string;
    issue_date: string;
    expiry_date: string;
    // Guarantor 1 (primary)
    guarantor_1_first_name: string;
    guarantor_1_middle_name: string;
    guarantor_1_last_name: string;
    guarantor_1_phone: string;
    guarantor_1_relationship: string;
    guarantor_1_address: string;
    guarantor_1_id_type: string;
    guarantor_1_id_number: string;
    guarantor_1_occupation: string;
    // Guarantor 2 (secondary)
    guarantor_2_first_name: string;
    guarantor_2_middle_name: string;
    guarantor_2_last_name: string;
    guarantor_2_phone: string;
    guarantor_2_relationship: string;
    guarantor_2_address: string;
    guarantor_2_id_type: string;
    guarantor_2_id_number: string;
    guarantor_2_occupation: string;
};

export default function CreateMember() {
    const { data, setData, post, processing, errors } = useForm<MemberFormData>(
        {
            first_name: '',
            middle_name: '',
            last_name: '',
            phone: '',
            alternative_phone: '',
            email: '',
            date_of_birth: '',
            gender: '',
            occupation: '',
            address_city: 'Addis Ababa',
            address_subcity: '',
            address_woreda: '',
            address_house_no: '',
            notes: '',
            id_type: '',
            id_number: '',
            issuing_authority: '',
            issue_date: '',
            expiry_date: '',
            guarantor_1_first_name: '',
            guarantor_1_middle_name: '',
            guarantor_1_last_name: '',
            guarantor_1_phone: '',
            guarantor_1_relationship: '',
            guarantor_1_address: '',
            guarantor_1_id_type: '',
            guarantor_1_id_number: '',
            guarantor_1_occupation: '',
            guarantor_2_first_name: '',
            guarantor_2_middle_name: '',
            guarantor_2_last_name: '',
            guarantor_2_phone: '',
            guarantor_2_relationship: '',
            guarantor_2_address: '',
            guarantor_2_id_type: '',
            guarantor_2_id_number: '',
            guarantor_2_occupation: '',
        },
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/members');
    };

    setLayoutProps({
        breadcrumbs: [
            { title: 'Members', href: '/members' },
            { title: 'Register', href: '/members/create' },
        ],
    });

    return (
        <>
            <Head title="Register Member" />

            <PageContainer>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/members">
                            <ChevronLeft />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Register New Member
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Create a central member profile. The member can be
                            enrolled into Equb groups after registration.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    {/* Personal Information */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Full legal name as on identification document
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input
                                    id="first_name"
                                    value={data.first_name}
                                    onChange={(e) =>
                                        setData('first_name', e.target.value)
                                    }
                                    placeholder="e.g. Abebe"
                                    required
                                />
                                {errors.first_name && (
                                    <p className="text-xs text-destructive">
                                        {errors.first_name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="middle_name">
                                    Father's Name *
                                </Label>
                                <Input
                                    id="middle_name"
                                    value={data.middle_name}
                                    onChange={(e) =>
                                        setData('middle_name', e.target.value)
                                    }
                                    placeholder="e.g. Kebede"
                                    required
                                />
                                {errors.middle_name && (
                                    <p className="text-xs text-destructive">
                                        {errors.middle_name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="last_name">
                                    Grand Father's Name *
                                </Label>
                                <Input
                                    id="last_name"
                                    value={data.last_name}
                                    onChange={(e) =>
                                        setData('last_name', e.target.value)
                                    }
                                    placeholder="e.g. Alemu"
                                    required
                                />
                                {errors.last_name && (
                                    <p className="text-xs text-destructive">
                                        {errors.last_name}
                                    </p>
                                )}
                            </div>

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
                                {errors.date_of_birth && (
                                    <p className="text-xs text-destructive">
                                        {errors.date_of_birth}
                                    </p>
                                )}
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
                                    <option value="">Select gender</option>
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
                                    placeholder="e.g. Teacher, Merchant"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact</CardTitle>
                            <CardDescription>
                                Primary phone is required. Must be a valid
                                Ethiopian number.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="phone">Mobile Phone *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                    placeholder="09xxxxxxxx or +2519xxxxxxxx"
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
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder="Optional"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Address</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="address_city">City *</Label>
                                <Input
                                    id="address_city"
                                    value={data.address_city}
                                    onChange={(e) =>
                                        setData('address_city', e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="address_subcity">
                                    Sub-city (ክፍለ ከተማ)
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
                                    placeholder="e.g. Bole, Kirkos"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="address_woreda">Woreda</Label>
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
                                    House Number
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

                    {/* Identification */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Identification (Optional)</CardTitle>
                            <CardDescription>
                                Attach a government-issued ID for KYC
                                verification
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="id_type">ID Type</Label>
                                <select
                                    id="id_type"
                                    value={data.id_type}
                                    onChange={(e) =>
                                        setData('id_type', e.target.value)
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                >
                                    <option value="">None</option>
                                    <option value="national_id">
                                        National Digital ID (ፋይዳ)
                                    </option>
                                    <option value="kebele_id">
                                        Kebele ID (የነዋሪነት)
                                    </option>
                                    <option value="passport">Passport</option>
                                    <option value="driver_license">
                                        Driver License
                                    </option>
                                </select>
                            </div>

                            {data.id_type && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="id_number">
                                            ID Number *
                                        </Label>
                                        <Input
                                            id="id_number"
                                            value={data.id_number}
                                            onChange={(e) =>
                                                setData(
                                                    'id_number',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        {errors.id_number && (
                                            <p className="text-xs text-destructive">
                                                {errors.id_number}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="issuing_authority">
                                            Issuing Authority
                                        </Label>
                                        <Input
                                            id="issuing_authority"
                                            value={data.issuing_authority}
                                            onChange={(e) =>
                                                setData(
                                                    'issuing_authority',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Guarantor 1 (Primary) */}
                    <Card className="border-emerald-200 bg-emerald-50/30 lg:col-span-2 dark:border-emerald-900 dark:bg-emerald-950/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                                    1
                                </span>
                                Guarantor (Primary) *
                            </CardTitle>
                            <CardDescription>
                                A guarantor vouches for this member. At least
                                one guarantor is required.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="g1_first">First Name *</Label>
                                <Input
                                    id="g1_first"
                                    value={data.guarantor_1_first_name}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_first_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. Tadesse"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g1_middle">Father's Name</Label>
                                <Input
                                    id="g1_middle"
                                    value={data.guarantor_1_middle_name}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_middle_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g1_last">
                                    Grandfather's Name *
                                </Label>
                                <Input
                                    id="g1_last"
                                    value={data.guarantor_1_last_name}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_last_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. Bekele"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g1_phone">Phone</Label>
                                <Input
                                    id="g1_phone"
                                    type="tel"
                                    value={data.guarantor_1_phone}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_phone',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="09xxxxxxxx"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g1_rel">
                                    Relationship to Member
                                </Label>
                                <Input
                                    id="g1_rel"
                                    value={data.guarantor_1_relationship}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_relationship',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. Brother, Colleague, Friend"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g1_occ">Occupation</Label>
                                <Input
                                    id="g1_occ"
                                    value={data.guarantor_1_occupation}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_occupation',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="g1_addr">Address</Label>
                                <Input
                                    id="g1_addr"
                                    value={data.guarantor_1_address}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_address',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="City, Sub-city, Woreda"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g1_idtype">ID Type</Label>
                                <select
                                    id="g1_idtype"
                                    value={data.guarantor_1_id_type}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_id_type',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                >
                                    <option value="">None</option>
                                    <option value="national_id">
                                        National ID (ፋይዳ)
                                    </option>
                                    <option value="kebele_id">Kebele ID</option>
                                    <option value="passport">Passport</option>
                                    <option value="driver_license">
                                        Driver License
                                    </option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g1_idnum">ID Number</Label>
                                <Input
                                    id="g1_idnum"
                                    value={data.guarantor_1_id_number}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_id_number',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Optional"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Guarantor 2 (Secondary - optional) */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-xs font-bold text-white">
                                    2
                                </span>
                                Guarantor (Secondary)
                                <span className="text-xs font-normal text-muted-foreground">
                                    — Optional
                                </span>
                            </CardTitle>
                            <CardDescription>
                                A second guarantor provides additional backing.
                                Leave blank if not needed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="g2_first">First Name</Label>
                                <Input
                                    id="g2_first"
                                    value={data.guarantor_2_first_name}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_2_first_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g2_middle">Father's Name</Label>
                                <Input
                                    id="g2_middle"
                                    value={data.guarantor_2_middle_name}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_2_middle_name',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g2_last">
                                    Grandfather's Name
                                </Label>
                                <Input
                                    id="g2_last"
                                    value={data.guarantor_2_last_name}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_2_last_name',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g2_phone">Phone</Label>
                                <Input
                                    id="g2_phone"
                                    type="tel"
                                    value={data.guarantor_2_phone}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_2_phone',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="09xxxxxxxx"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g2_rel">
                                    Relationship to Member
                                </Label>
                                <Input
                                    id="g2_rel"
                                    value={data.guarantor_2_relationship}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_2_relationship',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. Sister, Neighbor"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g2_occ">Occupation</Label>
                                <Input
                                    id="g2_occ"
                                    value={data.guarantor_2_occupation}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_2_occupation',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="g2_addr">Address</Label>
                                <Input
                                    id="g2_addr"
                                    value={data.guarantor_2_address}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_2_address',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="City, Sub-city, Woreda"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g2_idtype">ID Type</Label>
                                <select
                                    id="g2_idtype"
                                    value={data.guarantor_2_id_type}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_2_id_type',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                >
                                    <option value="">None</option>
                                    <option value="national_id">
                                        National ID (ፋይዳ)
                                    </option>
                                    <option value="kebele_id">Kebele ID</option>
                                    <option value="passport">Passport</option>
                                    <option value="driver_license">
                                        Driver License
                                    </option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="g2_idnum">ID Number</Label>
                                <Input
                                    id="g2_idnum"
                                    value={data.guarantor_2_id_number}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_2_id_number',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3 lg:col-span-3">
                        <Button asChild variant="outline">
                            <Link href="/members">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Registering…' : 'Register Member'}
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </>
    );
}
