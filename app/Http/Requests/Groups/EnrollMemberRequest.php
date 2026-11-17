<?php

namespace App\Http\Requests\Groups;

use App\Enums\GroupRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EnrollMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('memberships.approve');
    }

    public function rules(): array
    {
        return [
            'member_profile_id' => ['required', 'exists:member_profiles,id'],
            'role' => ['required', 'string', Rule::enum(GroupRole::class)],
            'payout_order_number' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
