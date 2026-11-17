import { Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    Briefcase,
    CalendarDays,
    IdCard,
    MapPin,
    Pencil,
    Phone,
    ShieldCheck,
    UserCheck,
    Users,
} from 'lucide-react';
import { DetailGrid, DetailItem, DetailList } from '@/components/detail-list';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { SummaryCard } from '@/components/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';
import type {
    MemberGuarantor,
    MemberIdentification,
    MemberProfile,
} from '@/types';

type Props = {
    member: MemberProfile;
};

function guarantorName(guarantor: MemberGuarantor): string {
    return [
        guarantor.guarantor_first_name,
        guarantor.guarantor_middle_name,
        guarantor.guarantor_last_name,
    ]
        .filter(Boolean)
        .join(' ');
}

function GuarantorCard({
    guarantor,
    index,
}: {
    guarantor: MemberGuarantor;
    index: number;
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center gap-2.5">
                <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        guarantor.is_primary ? 'bg-emerald-600' : 'bg-slate-400'
                    }`}
                >
                    {index}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {guarantorName(guarantor)}
                </span>
                {guarantor.is_primary && (
                    <Badge
                        variant="outline"
                        className="shrink-0 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400"
                    >
                        Primary
                    </Badge>
                )}
            </div>

            <DetailList className="mt-2 border-t border-border/60">
                <DetailItem label="Phone" value={guarantor.guarantor_phone} />
                <DetailItem
                    label="Relationship"
                    value={guarantor.guarantor_relationship}
                />
                <DetailItem
                    label="Occupation"
                    value={guarantor.guarantor_occupation}
                />
                <DetailItem
                    label="ID"
                    value={
                        guarantor.guarantor_id_number ? (
                            <span className="font-mono text-xs">
                                {guarantor.guarantor_id_type
                                    ? `${guarantor.guarantor_id_type.replace('_', ' ')} · `
                                    : ''}
                                {guarantor.guarantor_id_number}
                            </span>
                        ) : null
                    }
                />
                <DetailItem
                    label="Address"
                    value={guarantor.guarantor_address}
                />
            </DetailList>
        </div>
    );
}

function IdentificationCard({
    identification,
}: {
    identification: MemberIdentification;
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold capitalize">
                    <IdCard className="size-4 text-emerald-600" />
                    {identification.id_type.replace('_', ' ')}
                </span>
                {identification.is_primary && (
                    <Badge variant="outline" className="text-[10px]">
                        Primary
                    </Badge>
                )}
            </div>
            <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
                {identification.id_number}
            </p>
            {identification.issuing_authority && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {identification.issuing_authority}
                </p>
            )}
            {(identification.issue_date || identification.expiry_date) && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {identification.issue_date ?? '—'} →{' '}
                    {identification.expiry_date ?? 'No expiry'}
                </p>
            )}
        </div>
    );
}

export default function ShowMember({ member }: Props) {
    const { can } = usePermissions();
    const { t } = useTranslation();

    const KYC_LABEL: Record<string, string> = {
        verified: t('members.verified'),
        pending: t('members.pendingReview'),
        unverified: t('members.unverified'),
        rejected: t('common.rejected'),
    };

    const guarantors = member.guarantors ?? [];
    const identifications = member.identifications ?? [];
    const memberships = member.memberships ?? [];
    const membershipCount = member.memberships_count ?? memberships.length;

    const address = [
        member.address_house_no,
        member.address_woreda && `Woreda ${member.address_woreda}`,
        member.address_subcity,
        member.address_city,
    ]
        .filter(Boolean)
        .join(', ');

    setLayoutProps({
        breadcrumbs: [
            { title: t('nav.dashboard'), href: '/dashboard' },
            { title: t('members.title'), href: '/members' },
            { title: member.full_name, href: `/members/${member.id}` },
        ],
    });

    return (
        <>
            <Head title={`${member.full_name} — ${t('members.title')}`} />

            <PageContainer>
                <PageHeader
                    eyebrow={`${t('members.memberNumber')}: ${member.member_number}`}
                    title={member.full_name}
                    description={
                        [member.phone, member.occupation]
                            .filter(Boolean)
                            .join(' · ') || undefined
                    }
                    icon={UserCheck}
                    backHref="/members"
                    backLabel={t('members.title')}
                    actions={
                        <>
                            <StatusBadge
                                status={member.kyc_status}
                                label={
                                    KYC_LABEL[member.kyc_status] ??
                                    member.kyc_status
                                }
                            />
                            <StatusBadge status={member.status} />
                            {can('members.update') && (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/members/${member.id}/edit`}>
                                        <Pencil className="size-4" />
                                        {t('members.editProfile')}
                                    </Link>
                                </Button>
                            )}
                        </>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard
                        label={t('members.kycStatus')}
                        value={
                            KYC_LABEL[member.kyc_status] ?? member.kyc_status
                        }
                        hint="Identity verification state"
                        icon={ShieldCheck}
                        tone={
                            member.kyc_status === 'verified'
                                ? 'emerald'
                                : member.kyc_status === 'rejected'
                                  ? 'red'
                                  : 'default'
                        }
                    />
                    <SummaryCard
                        label={t('members.circlesJoined')}
                        value={membershipCount}
                        hint={t('nav.equbGroups')}
                        icon={Users}
                        tone="blue"
                    />
                    <SummaryCard
                        label={t('members.accountStatus')}
                        value={member.status}
                        hint={
                            guarantors.length > 0
                                ? `${guarantors.length} guarantor${
                                      guarantors.length === 1 ? '' : 's'
                                  } on file`
                                : 'No guarantor recorded'
                        }
                        icon={UserCheck}
                        tone={
                            member.status === 'active' ? 'emerald' : 'default'
                        }
                    />
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">
                                {t('members.personalDetails')}
                            </CardTitle>
                            <CardDescription>
                                Contact and address information captured at
                                registration.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailGrid>
                                <DetailItem
                                    label={t('members.fullName')}
                                    value={member.full_name}
                                />
                                <DetailItem
                                    label={t('members.memberNumber')}
                                    mono
                                    value={member.member_number}
                                />
                                <DetailItem
                                    label={t('members.phoneNumber')}
                                    value={
                                        <span className="inline-flex items-center gap-1.5">
                                            <Phone className="size-3.5 text-muted-foreground" />
                                            {member.phone}
                                        </span>
                                    }
                                />
                                <DetailItem
                                    label={t('members.alternativePhone')}
                                    value={member.alternative_phone}
                                />
                                <DetailItem
                                    label={t('members.email')}
                                    value={member.email}
                                />
                                <DetailItem
                                    label={t('members.dateOfBirth')}
                                    value={
                                        member.date_of_birth ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <CalendarDays className="size-3.5 text-muted-foreground" />
                                                {member.date_of_birth}
                                            </span>
                                        ) : null
                                    }
                                />
                                <DetailItem
                                    label={t('members.gender')}
                                    value={member.gender}
                                    className="capitalize"
                                />
                                <DetailItem
                                    label={t('members.occupation')}
                                    value={
                                        member.occupation ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Briefcase className="size-3.5 text-muted-foreground" />
                                                {member.occupation}
                                            </span>
                                        ) : null
                                    }
                                />
                                <DetailItem
                                    label={t('members.address')}
                                    value={
                                        address ? (
                                            <span className="inline-flex items-start gap-1.5">
                                                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                                {address}
                                            </span>
                                        ) : null
                                    }
                                    className="sm:col-span-2"
                                />
                                {member.notes && (
                                    <DetailItem
                                        label={t('common.notes')}
                                        value={
                                            <span className="font-normal whitespace-pre-wrap">
                                                {member.notes}
                                            </span>
                                        }
                                        className="sm:col-span-2"
                                    />
                                )}
                            </DetailGrid>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-5">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <UserCheck className="size-4 text-emerald-600" />
                                    {t('members.guarantor')}
                                    <Badge
                                        variant="secondary"
                                        className="ml-auto text-[10px]"
                                    >
                                        {guarantors.length}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {guarantors.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No guarantor recorded.
                                    </p>
                                ) : (
                                    guarantors.map((guarantor, index) => (
                                        <GuarantorCard
                                            key={guarantor.id}
                                            guarantor={guarantor}
                                            index={index + 1}
                                        />
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <IdCard className="size-4 text-blue-600" />
                                    {t('members.idDocument')}
                                    <Badge
                                        variant="secondary"
                                        className="ml-auto text-[10px]"
                                    >
                                        {identifications.length}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {identifications.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No identification on file.
                                    </p>
                                ) : (
                                    identifications.map((identification) => (
                                        <IdentificationCard
                                            key={identification.id}
                                            identification={identification}
                                        />
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="size-4 text-emerald-600" />
                            {t('nav.equbGroups')}
                        </CardTitle>
                        <CardDescription>
                            {membershipCount} circle
                            {membershipCount === 1 ? '' : 's'} joined
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {memberships.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t('members.notEnrolled')}
                            </p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {memberships.map((membership) => (
                                    <div
                                        key={membership.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:border-emerald-500/40"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {membership.group?.name ??
                                                    `Group #${membership.equb_group_id}`}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                                                {membership.role} ·{' '}
                                                {membership.membership_number}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                                            <StatusBadge
                                                status={membership.status}
                                            />
                                            {can('groups.view') &&
                                                membership.group && (
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        <Link
                                                            href={`/groups/${membership.equb_group_id}`}
                                                        >
                                                            {t('common.view')}
                                                        </Link>
                                                    </Button>
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </PageContainer>
        </>
    );
}
