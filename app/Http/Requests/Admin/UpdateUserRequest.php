<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        return $target instanceof User
            && ($this->user()?->can('update', $target) ?? false);
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower($this->input('email'))]);
        }

        if (is_string($this->input('phone')) && trim($this->input('phone')) === '') {
            $this->merge(['phone' => null]);
        }
    }

    /**
     * The validated, normalized account attributes.
     *
     * @return array{name: string, email: string, phone: string|null}
     */
    public function accountAttributes(): array
    {
        return [
            'name' => $this->string('name')->toString(),
            'email' => $this->string('email')->toString(),
            'phone' => $this->filled('phone') ? $this->string('phone')->toString() : null,
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $target = $this->route('user');
        $targetId = $target instanceof User ? $target->id : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($targetId),
            ],
            'phone' => ['nullable', 'string', 'max:32'],
        ];
    }
}
