<?php

namespace App\Http\Requests\Groups;

use App\Enums\ContributionFrequency;
use App\Enums\InitialDepositTreatment;
use App\Enums\PayoutCommencementRule;
use App\Enums\RotationMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConfigureRulesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('rules.configure');
    }

    public function rules(): array
    {
        return [
            'contribution_amount' => ['required', 'numeric', 'min:1'],
            'contribution_frequency' => ['required', 'string', Rule::enum(ContributionFrequency::class)],
            'expected_members' => ['required', 'integer', 'min:2'],

            'initial_deposit_rounds' => ['required', 'integer', 'min:0', 'max:12'],
            'initial_deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'initial_deposit_treatment' => ['required', 'string', Rule::enum(InitialDepositTreatment::class)],

            'payout_commencement_rule' => ['required', 'string', Rule::enum(PayoutCommencementRule::class)],
            'payout_commencement_date' => ['nullable', 'date'],
            'rotation_method' => ['required', 'string', Rule::enum(RotationMethod::class)],

            'allow_partial_contributions' => ['required', 'boolean'],
            'late_penalty_enabled' => ['required', 'boolean'],
            'late_penalty_fixed_amount' => ['nullable', 'numeric', 'min:0'],
            'late_penalty_daily_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'late_penalty_grace_days' => ['required', 'integer', 'min:0', 'max:30'],
            'terms_and_conditions' => ['nullable', 'string'],

            // While a group is operating, rule changes must reference a passed
            // member-governance decision (validated in the controller).
            'decision_id' => ['nullable', 'integer', 'exists:group_decisions,id'],
        ];
    }
}
