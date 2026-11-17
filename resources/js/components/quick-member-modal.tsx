import { useForm } from '@inertiajs/react';
import { UserCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuickMemberModalProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function QuickMemberModal({
    trigger,
    onSuccess,
}: QuickMemberModalProps) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        phone: '',
        email: '',
        address_city: 'Addis Ababa',
        address_subcity: '',
        id_type: 'national_id',
        id_number: '',
        guarantor_1_first_name: '',
        guarantor_1_middle_name: '',
        guarantor_1_last_name: '',
        guarantor_1_phone: '',
        guarantor_1_relationship: '',
        guarantor_1_address: '',
        guarantor_1_id_type: '',
        guarantor_1_id_number: '',
        guarantor_1_occupation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/members', {
            onSuccess: () => {
                setOpen(false);
                reset();
                onSuccess?.();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        <UserPlus className="mr-1.5 size-4" />
                        Quick Register Member
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-[560px]">
                <DialogHeader className="mb-4 border-b pb-3">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <UserPlus className="size-5 text-emerald-600" />
                        Register Equb Member
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Create a central member profile. The member can then
                        participate in multiple Equb circles.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="qm-first" className="text-xs">
                                First Name *
                            </Label>
                            <Input
                                id="qm-first"
                                value={data.first_name}
                                onChange={(e) =>
                                    setData('first_name', e.target.value)
                                }
                                placeholder="Abebe"
                                required
                                className="h-9 text-sm"
                            />
                            {errors.first_name && (
                                <p className="text-[11px] text-destructive">
                                    {errors.first_name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="qm-middle" className="text-xs">
                                Father's Name *
                            </Label>
                            <Input
                                id="qm-middle"
                                value={data.middle_name}
                                onChange={(e) =>
                                    setData('middle_name', e.target.value)
                                }
                                placeholder="Bikila"
                                required
                                className="h-9 text-sm"
                            />
                            {errors.middle_name && (
                                <p className="text-[11px] text-destructive">
                                    {errors.middle_name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="qm-last" className="text-xs">
                                Grandfather *
                            </Label>
                            <Input
                                id="qm-last"
                                value={data.last_name}
                                onChange={(e) =>
                                    setData('last_name', e.target.value)
                                }
                                placeholder="Demissie"
                                required
                                className="h-9 text-sm"
                            />
                            {errors.last_name && (
                                <p className="text-[11px] text-destructive">
                                    {errors.last_name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="qm-phone" className="text-xs">
                                Phone Number *
                            </Label>
                            <Input
                                id="qm-phone"
                                type="tel"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                                placeholder="0911223344"
                                required
                                className="h-9 text-sm"
                            />
                            {errors.phone && (
                                <p className="text-[11px] text-destructive">
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="qm-email" className="text-xs">
                                Email (Optional)
                            </Label>
                            <Input
                                id="qm-email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                placeholder="member@example.com"
                                className="h-9 text-sm"
                            />
                            {errors.email && (
                                <p className="text-[11px] text-destructive">
                                    {errors.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="qm-city" className="text-xs">
                                City
                            </Label>
                            <Input
                                id="qm-city"
                                value={data.address_city}
                                onChange={(e) =>
                                    setData('address_city', e.target.value)
                                }
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="qm-subcity" className="text-xs">
                                Sub-city / Kifle Ketema
                            </Label>
                            <Input
                                id="qm-subcity"
                                value={data.address_subcity}
                                onChange={(e) =>
                                    setData('address_subcity', e.target.value)
                                }
                                placeholder="Bole, Kirkos, Yeka…"
                                className="h-9 text-sm"
                            />
                        </div>
                    </div>

                    {/* ID Document */}
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                        <div className="text-xs font-semibold text-foreground">
                            Identification Card (KYC)
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="qm-idtype" className="text-xs">
                                    ID Type
                                </Label>
                                <select
                                    id="qm-idtype"
                                    value={data.id_type}
                                    onChange={(e) =>
                                        setData('id_type', e.target.value)
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                >
                                    <option value="national_id">
                                        National ID (Fayda / ፋይዳ)
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
                            <div className="space-y-1">
                                <Label htmlFor="qm-idnum" className="text-xs">
                                    ID Number *
                                </Label>
                                <Input
                                    id="qm-idnum"
                                    value={data.id_number}
                                    onChange={(e) =>
                                        setData('id_number', e.target.value)
                                    }
                                    placeholder="ET-FAN-123456"
                                    required
                                    className="h-9 text-xs"
                                />
                                {errors.id_number && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.id_number}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Guarantor */}
                    <div className="space-y-2 rounded-lg border bg-emerald-50/30 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <UserCheck className="size-3.5 text-emerald-600" />
                            Guarantor
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="qm-g1first" className="text-xs">
                                    First Name
                                </Label>
                                <Input
                                    id="qm-g1first"
                                    value={data.guarantor_1_first_name}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_first_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Tadesse"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="qm-g1middle"
                                    className="text-xs"
                                >
                                    Father's Name
                                </Label>
                                <Input
                                    id="qm-g1middle"
                                    value={data.guarantor_1_middle_name}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_middle_name',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="qm-g1last" className="text-xs">
                                    Grandfather
                                </Label>
                                <Input
                                    id="qm-g1last"
                                    value={data.guarantor_1_last_name}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_last_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Bekele"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="qm-g1phone" className="text-xs">
                                    Phone
                                </Label>
                                <Input
                                    id="qm-g1phone"
                                    type="tel"
                                    value={data.guarantor_1_phone}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_phone',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="09xxxxxxxx"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="qm-g1rel" className="text-xs">
                                    Relationship
                                </Label>
                                <Input
                                    id="qm-g1rel"
                                    value={data.guarantor_1_relationship}
                                    onChange={(e) =>
                                        setData(
                                            'guarantor_1_relationship',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Brother, Colleague"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={processing}
                        >
                            {processing ? 'Registering…' : 'Register Member'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
