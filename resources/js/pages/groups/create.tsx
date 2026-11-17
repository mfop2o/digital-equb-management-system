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

type GroupFormData = {
    name: string;
    description: string;
    category: string;
    max_members: string;
    contribution_amount: string;
    contribution_frequency: string;
    expected_members: string;
    initial_deposit_rounds: string;
    initial_deposit_amount: string;
    initial_deposit_treatment: string;
    payout_commencement_rule: string;
    payout_commencement_date: string;
    rotation_method: string;
    allow_partial_contributions: boolean;
    late_penalty_enabled: boolean;
    late_penalty_fixed_amount: string;
    late_penalty_grace_days: string;
    terms_and_conditions: string;
};

export default function CreateGroup() {
    const { data, setData, post, processing, errors } = useForm<GroupFormData>({
        name: '',
        description: '',
        category: 'General',
        max_members: '20',
        contribution_amount: '',
        contribution_frequency: 'monthly',
        expected_members: '20',
        // Confirmed: initial deposits are accumulated and retained by the group.
        initial_deposit_rounds: '0',
        initial_deposit_amount: '0',
        initial_deposit_treatment: 'retained',
        payout_commencement_rule: 'deposit_completion_and_date',
        payout_commencement_date: '',
        // D-06 default: predetermined order
        rotation_method: 'predetermined',
        // D-05 default: no partial contributions
        allow_partial_contributions: false,
        // D-07 default: penalties enabled
        late_penalty_enabled: true,
        late_penalty_fixed_amount: '0',
        late_penalty_grace_days: '3',
        terms_and_conditions: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/groups');
    };

    const hasInitialDeposit = parseInt(data.initial_deposit_rounds) > 0;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Equb Groups', href: '/groups' },
            { title: 'New Group', href: '/groups/create' },
        ],
    });

    return (
        <>
            <Head title="New Equb Group" />

            <PageContainer>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/groups">
                            <ChevronLeft />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Create New Equb Group
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configure the group's rules. Financial policies can
                            be updated until the group is activated.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    {/* Group Info */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Group Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="name">Group Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="e.g. Bole Ladies Monthly Equb"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    value={data.category}
                                    onChange={(e) =>
                                        setData('category', e.target.value)
                                    }
                                    placeholder="e.g. Family, Workplace, Community"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="max_members">
                                    Maximum Members *
                                </Label>
                                <Input
                                    id="max_members"
                                    type="number"
                                    min={2}
                                    value={data.max_members}
                                    onChange={(e) =>
                                        setData('max_members', e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    className="w-full rounded-md border border-input bg-background p-2 text-sm"
                                    rows={3}
                                    placeholder="Optional group description…"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contribution Rules */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contribution Rules</CardTitle>
                            <CardDescription>
                                How much and how often members contribute
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="contribution_amount">
                                    Amount per Period (ETB) *
                                </Label>
                                <Input
                                    id="contribution_amount"
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
                                />
                                {errors.contribution_amount && (
                                    <p className="text-xs text-destructive">
                                        {errors.contribution_amount}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="contribution_frequency">
                                    Frequency *
                                </Label>
                                <select
                                    id="contribution_frequency"
                                    value={data.contribution_frequency}
                                    onChange={(e) =>
                                        setData(
                                            'contribution_frequency',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                >
                                    <option value="daily">Daily (በየቀኑ)</option>
                                    <option value="weekly">
                                        Weekly (በሳምንት)
                                    </option>
                                    <option value="biweekly">
                                        Bi-Weekly (በሁለት ሳምንት)
                                    </option>
                                    <option value="monthly">
                                        Monthly (በወር)
                                    </option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="expected_members">
                                    Expected Members
                                </Label>
                                <Input
                                    id="expected_members"
                                    type="number"
                                    min={2}
                                    value={data.expected_members}
                                    onChange={(e) =>
                                        setData(
                                            'expected_members',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="rotation_method">
                                    Payout Rotation *
                                </Label>
                                <select
                                    id="rotation_method"
                                    value={data.rotation_method}
                                    onChange={(e) =>
                                        setData(
                                            'rotation_method',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                >
                                    <option value="predetermined">
                                        Predetermined Fixed Order
                                    </option>
                                    <option value="lottery">
                                        Lottery Draw (ዕጣ)
                                    </option>
                                    <option value="committee">
                                        Committee Selection
                                    </option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Initial Deposit Rounds */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Initial Deposit Rounds</CardTitle>
                            <CardDescription>
                                Members pay initial deposits before regular Equb
                                rotation begins.
                                <strong className="mt-1 block text-foreground">
                                    Initial deposits are accumulated and
                                    retained by the group. They are kept
                                    separate from regular contributions and
                                    payout funds. The eventual distribution or
                                    refund policy is still pending business
                                    confirmation.
                                </strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="initial_deposit_rounds">
                                    Number of Initial Deposit Rounds
                                </Label>
                                <Input
                                    id="initial_deposit_rounds"
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
                                />
                                <p className="text-xs text-muted-foreground">
                                    0 = no initial deposit stage
                                </p>
                            </div>

                            {hasInitialDeposit && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="initial_deposit_amount">
                                            Amount per Round (ETB)
                                        </Label>
                                        <Input
                                            id="initial_deposit_amount"
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
                                        />
                                    </div>

                                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm sm:col-span-2 dark:border-blue-900 dark:bg-blue-950/30">
                                        <p className="font-medium">
                                            Retained Deposits
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Every active member must satisfy the
                                            configured deposit obligations
                                            before the regular payout stage
                                            begins. Verified deposits are
                                            recorded in a separate ledger
                                            account and are not treated as
                                            contributions.
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payout Commencement */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payout Commencement</CardTitle>
                            <CardDescription>
                                When regular Equb payouts start
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="payout_commencement_rule">
                                    Commencement Trigger
                                </Label>
                                <select
                                    id="payout_commencement_rule"
                                    value={data.payout_commencement_rule}
                                    onChange={(e) =>
                                        setData(
                                            'payout_commencement_rule',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                >
                                    <option value="deposit_completion_and_date">
                                        Deposits + Date + Approval (Recommended)
                                    </option>
                                    <option value="deposit_completion_only">
                                        Deposit Completion Only
                                    </option>
                                    <option value="scheduled_date_only">
                                        Scheduled Date Only
                                    </option>
                                    <option value="manual_admin_approval">
                                        Manual Admin Approval Only
                                    </option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="payout_commencement_date">
                                    Target Start Date
                                </Label>
                                <Input
                                    id="payout_commencement_date"
                                    type="date"
                                    value={data.payout_commencement_date}
                                    onChange={(e) =>
                                        setData(
                                            'payout_commencement_date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Penalty Rules */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Late Payment Penalties</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-center gap-3 sm:col-span-2">
                                <input
                                    id="late_penalty_enabled"
                                    type="checkbox"
                                    checked={data.late_penalty_enabled}
                                    onChange={(e) =>
                                        setData(
                                            'late_penalty_enabled',
                                            e.target.checked,
                                        )
                                    }
                                    className="size-4 rounded border"
                                />
                                <Label htmlFor="late_penalty_enabled">
                                    Enable late payment penalties
                                </Label>
                            </div>

                            {data.late_penalty_enabled && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="late_penalty_fixed_amount">
                                            Fixed Penalty Amount (ETB)
                                        </Label>
                                        <Input
                                            id="late_penalty_fixed_amount"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={
                                                data.late_penalty_fixed_amount
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'late_penalty_fixed_amount',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="late_penalty_grace_days">
                                            Grace Period (days)
                                        </Label>
                                        <Input
                                            id="late_penalty_grace_days"
                                            type="number"
                                            min={0}
                                            max={30}
                                            value={data.late_penalty_grace_days}
                                            onChange={(e) =>
                                                setData(
                                                    'late_penalty_grace_days',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3 lg:col-span-3">
                        <Button asChild variant="outline">
                            <Link href="/groups">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating…' : 'Create Equb Group'}
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </>
    );
}
