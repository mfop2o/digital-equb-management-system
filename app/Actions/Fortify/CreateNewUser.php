<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Enums\KycStatus;
use App\Models\User;
use App\Services\MemberService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a self-registered user plus their member profile.
     *
     * Self-registered accounts start as active members with an unverified
     * email (standard Laravel verification flow) and a member profile whose
     * KYC remains unverified until identity verification is attached.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        $normalizedPhone = User::normalizePhone($input['phone'] ?? null);

        Validator::make($input, [
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'phone' => [
                'required',
                'string',
                'max:32',
                function ($attribute, $value, $fail) use ($normalizedPhone) {
                    if ($normalizedPhone && User::where('phone_normalized', $normalizedPhone)->exists()) {
                        $fail('The phone has already been taken.');
                    }
                },
            ],
            'password' => $this->passwordRules(),
            'terms' => ['accepted'],
        ])->validate();

        return DB::transaction(function () use ($input) {
            $user = User::create([
                'name' => trim(sprintf('%s %s %s', $input['first_name'], $input['middle_name'], $input['last_name'])),
                'email' => $input['email'],
                'phone' => $input['phone'],
                'password' => Hash::make($input['password']),
            ]);

            $user->assignRole('member');

            app(MemberService::class)->createMember([
                'user_id' => $user->id,
                'first_name' => $input['first_name'],
                'middle_name' => $input['middle_name'],
                'last_name' => $input['last_name'],
                'phone' => $input['phone'],
                'email' => $input['email'],
                'kyc_status' => KycStatus::Unverified->value,
            ], creator: $user);

            return $user;
        });
    }
}
