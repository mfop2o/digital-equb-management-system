<?php

declare(strict_types=1);

namespace App\Http\Requests\Deposits;

use Illuminate\Foundation\Http\FormRequest;

class VerifyDepositPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('deposits.verify');
    }

    public function rules(): array
    {
        return [
            'decision' => ['required', 'string', 'in:verified,rejected'],
            'reason' => ['required_if:decision,rejected', 'nullable', 'string', 'max:500'],
        ];
    }
}
