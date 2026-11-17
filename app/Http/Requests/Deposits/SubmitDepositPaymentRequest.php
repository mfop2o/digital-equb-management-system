<?php

declare(strict_types=1);

namespace App\Http\Requests\Deposits;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class SubmitDepositPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('deposits.record');
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:1'],
            'method' => ['required', new Enum(PaymentMethod::class)],
            'reference' => ['nullable', 'string', 'max:100'],
            'paid_on' => ['required', 'date'],
            'evidence_file_path' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
