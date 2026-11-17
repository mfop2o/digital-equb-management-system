<?php

namespace App\Http\Requests\Membership;

use Illuminate\Foundation\Http\FormRequest;

class JoinByCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:32'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
