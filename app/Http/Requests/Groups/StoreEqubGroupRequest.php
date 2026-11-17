<?php

namespace App\Http\Requests\Groups;

use App\Enums\ContributionFrequency;
use App\Enums\InitialDepositTreatment;
use App\Enums\MembershipMode;
use App\Enums\PayoutCommencementRule;
use App\Enums\RotationMethod;
use App\Enums\GroupVisibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEqubGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('groups.create');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'category' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:120'],
            'visibility' => ['nullable', 'string', Rule::enum(GroupVisibility::class)],
            'max_members' => ['required', 'integer', 'min:2', 'max:1000'],

            // Initial rules configuration
            'contribution_amount' => ['required', 'numeric', 'min:1'],
            'contribution_frequency' => ['required', 'string', Rule::enum(ContributionFrequency::class)],
            'expected_members' => ['nullable', 'integer', 'min:2'],
            'membership_mode' => ['nullable', 'string', Rule::enum(MembershipMode::class)],

            // Initial deposit rounds & treatment (confirmed: retained; distribution policy pending)
            'initial_deposit_rounds' => ['required', 'integer', 'min:0', 'max:12'],
            'initial_deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'initial_deposit_treatment' => ['nullable', 'string', Rule::enum(InitialDepositTreatment::class)],

            // Payout commencement & rotation
            'payout_commencement_rule' => ['nullable', 'string', Rule::enum(PayoutCommencementRule::class)],
            'payout_commencement_date' => ['nullable', 'date', 'after:today'],
            'rotation_method' => ['required', 'string', Rule::enum(RotationMethod::class)],

            // Financial & penalty controls
            'allow_partial_contributions' => ['nullable', 'boolean'],
            'late_penalty_enabled' => ['nullable', 'boolean'],
            'late_penalty_fixed_amount' => ['nullable', 'numeric', 'min:0'],
            'late_penalty_daily_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'late_penalty_grace_days' => ['nullable', 'integer', 'min:0', 'max:30'],
            'terms_and_conditions' => ['nullable', 'string'],
        ];
    }
}
