<?php

namespace App\Services;

use App\Enums\KycStatus;
use App\Enums\MemberStatus;
use App\Models\MemberIdentification;
use App\Models\MemberProfile;
use App\Models\MemberVerification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MemberService
{
    public function __construct(
        protected AuditService $auditService,
    ) {}

    /**
     * Create a new central member profile.
     */
    public function createMember(array $data, ?User $creator = null): MemberProfile
    {
        return DB::transaction(function () use ($data, $creator) {
            $memberNumber = $this->generateMemberNumber();

            $phoneNormalized = User::normalizePhone($data['phone'] ?? null);
            if (! $phoneNormalized) {
                throw ValidationException::withMessages([
                    'phone' => 'A valid phone number is required.',
                ]);
            }

            if (MemberProfile::where('phone_normalized', $phoneNormalized)->exists()) {
                throw ValidationException::withMessages([
                    'phone' => 'A member with this phone number is already registered.',
                ]);
            }

            $profile = MemberProfile::create([
                'user_id' => $data['user_id'] ?? null,
                'member_number' => $memberNumber,
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'],
                'phone_normalized' => $phoneNormalized,
                'alternative_phone' => $data['alternative_phone'] ?? null,
                'email' => $data['email'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'gender' => $data['gender'] ?? null,
                'occupation' => $data['occupation'] ?? null,
                'address_city' => $data['address_city'] ?? 'Addis Ababa',
                'address_subcity' => $data['address_subcity'] ?? null,
                'address_woreda' => $data['address_woreda'] ?? null,
                'address_house_no' => $data['address_house_no'] ?? null,
                'status' => MemberStatus::Active,
                'kyc_status' => KycStatus::Unverified,
                'notes' => $data['notes'] ?? null,
                'created_by_user_id' => $creator?->id,
            ]);

            if (! empty($data['id_type']) && ! empty($data['id_number'])) {
                $this->attachIdentification($profile, [
                    'id_type' => $data['id_type'],
                    'id_number' => $data['id_number'],
                    'issuing_authority' => $data['issuing_authority'] ?? null,
                    'issue_date' => $data['issue_date'] ?? null,
                    'expiry_date' => $data['expiry_date'] ?? null,
                    'is_primary' => true,
                ]);
            }

            // Save guarantor(s) if provided
            for ($gi = 1; $gi <= 2; $gi++) {
                $gfn = $data["guarantor_{$gi}_first_name"] ?? null;
                $gln = $data["guarantor_{$gi}_last_name"] ?? null;
                if ($gfn && $gln) {
                    $profile->guarantors()->create([
                        'guarantor_first_name' => $gfn,
                        'guarantor_middle_name' => $data["guarantor_{$gi}_middle_name"] ?? null,
                        'guarantor_last_name' => $gln,
                        'guarantor_phone' => $data["guarantor_{$gi}_phone"] ?? null,
                        'guarantor_relationship' => $data["guarantor_{$gi}_relationship"] ?? null,
                        'guarantor_address' => $data["guarantor_{$gi}_address"] ?? null,
                        'guarantor_id_type' => $data["guarantor_{$gi}_id_type"] ?? null,
                        'guarantor_id_number' => $data["guarantor_{$gi}_id_number"] ?? null,
                        'guarantor_occupation' => $data["guarantor_{$gi}_occupation"] ?? null,
                        'is_primary' => $gi === 1,
                    ]);
                }
            }

            $this->auditService->log(
                event: 'member.created',
                auditable: $profile,
                after: $profile->only(['id', 'member_number', 'first_name', 'last_name', 'phone_normalized']),
            );

            return $profile;
        });
    }

    /**
     * Update an existing member profile.
     */
    public function updateMember(MemberProfile $profile, array $data, ?User $updater = null): MemberProfile
    {
        return DB::transaction(function () use ($profile, $data) {
            $before = $profile->toArray();

            if (isset($data['phone'])) {
                $phoneNormalized = User::normalizePhone($data['phone']);
                if ($phoneNormalized && MemberProfile::where('phone_normalized', $phoneNormalized)->where('id', '!=', $profile->id)->exists()) {
                    throw ValidationException::withMessages([
                        'phone' => 'Another member is already registered with this phone number.',
                    ]);
                }
                $data['phone_normalized'] = $phoneNormalized;
            }

            $profile->update($data);

            $this->auditService->log(
                event: 'member.updated',
                auditable: $profile,
                before: $before,
                after: $profile->toArray(),
            );

            return $profile;
        });
    }

    /**
     * Attach an identification card / document to a member profile.
     */
    public function attachIdentification(MemberProfile $profile, array $idData): MemberIdentification
    {
        return DB::transaction(function () use ($profile, $idData) {
            if (! empty($idData['is_primary'])) {
                $profile->identifications()->update(['is_primary' => false]);
            }

            $id = $profile->identifications()->create($idData);

            // When ID is attached, mark KYC as verified directly (no manual approval needed)
            if ($profile->kyc_status === KycStatus::Unverified) {
                $profile->update(['kyc_status' => KycStatus::Verified]);
            }

            $this->auditService->log(
                event: 'member.id_attached',
                auditable: $profile,
                after: ['id_type' => $id->id_type->value ?? $id->id_type, 'id_number' => $id->id_number],
            );

            return $id;
        });
    }

    /**
     * Perform KYC verification decision for a member.
     *
     * @deprecated KYC approve/reject removed — ID attachment now sets status to verified directly.
     */
    public function verifyMember(
        MemberProfile $profile,
        User $verifier,
        string $decision,
        ?string $notes = null,
        ?string $rejectionReason = null,
    ): MemberVerification {
        return DB::transaction(function () use ($profile, $verifier, $decision, $notes, $rejectionReason) {
            $newKycStatus = $decision === 'verified' ? KycStatus::Verified : KycStatus::Rejected;

            $verification = MemberVerification::create([
                'member_profile_id' => $profile->id,
                'verified_by_user_id' => $verifier->id,
                'decision' => $decision,
                'rejection_reason' => $rejectionReason,
                'notes' => $notes,
                'verified_at' => now(),
            ]);

            $profile->update(['kyc_status' => $newKycStatus]);

            $this->auditService->log(
                event: 'member.kyc_decision',
                auditable: $profile,
                after: [
                    'decision' => $decision,
                    'kyc_status' => $newKycStatus->value,
                    'verifier_id' => $verifier->id,
                ],
            );

            return $verification;
        });
    }

    /**
     * Generate unique, non-colliding member identification number.
     */
    protected function generateMemberNumber(): string
    {
        $lastId = DB::table('member_profiles')->max('id') ?? 0;
        $nextId = $lastId + 1;

        return sprintf('EQB-M-%05d', $nextId);
    }
}
