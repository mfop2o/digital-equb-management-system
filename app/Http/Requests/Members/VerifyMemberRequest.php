<?php

namespace App\Http\Requests\Members;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerifyMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('members.verify');
    }

    public function rules(): array
    {
        return [
            'decision' => ['required', 'string', Rule::in(['verified', 'rejected'])],
            'notes' => ['nullable', 'string', 'max:1000'],
            'rejection_reason' => ['nullable', 'required_if:decision,rejected', 'string', 'max:1000'],
        ];
    }
}
