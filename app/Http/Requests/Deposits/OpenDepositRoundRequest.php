<?php

declare(strict_types=1);

namespace App\Http\Requests\Deposits;

use Illuminate\Foundation\Http\FormRequest;

class OpenDepositRoundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('deposits.generate');
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:100'],
            'amount_per_member' => ['required', 'numeric', 'min:1'],
            'opens_on' => ['required', 'date'],
            'due_on' => ['required', 'date', 'after_or_equal:opens_on'],
            'closes_on' => ['required', 'date', 'after_or_equal:due_on'],
            'requires_previous_close' => ['nullable', 'boolean'],
        ];
    }
}
