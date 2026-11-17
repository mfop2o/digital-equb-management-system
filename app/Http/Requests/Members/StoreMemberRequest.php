<?php

namespace App\Http\Requests\Members;

use App\Enums\IdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('members.create');
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:32'],
            'alternative_phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female'])],
            'occupation' => ['nullable', 'string', 'max:150'],
            'address_city' => ['nullable', 'string', 'max:100'],
            'address_subcity' => ['nullable', 'string', 'max:100'],
            'address_woreda' => ['nullable', 'string', 'max:50'],
            'address_house_no' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],

            // Optional initial identification
            'id_type' => ['nullable', 'string', Rule::enum(IdType::class)],
            'id_number' => ['nullable', 'required_with:id_type', 'string', 'max:100'],
            'issuing_authority' => ['nullable', 'string', 'max:150'],
            'issue_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after:issue_date'],

            // Guarantor 1 (primary)
            'guarantor_1_first_name' => ['nullable', 'string', 'max:100'],
            'guarantor_1_middle_name' => ['nullable', 'string', 'max:100'],
            'guarantor_1_last_name' => ['nullable', 'string', 'max:100'],
            'guarantor_1_phone' => ['nullable', 'string', 'max:32'],
            'guarantor_1_relationship' => ['nullable', 'string', 'max:100'],
            'guarantor_1_address' => ['nullable', 'string', 'max:255'],
            'guarantor_1_id_type' => ['nullable', 'string', 'max:32'],
            'guarantor_1_id_number' => ['nullable', 'string', 'max:100'],
            'guarantor_1_occupation' => ['nullable', 'string', 'max:150'],

            // Guarantor 2 (secondary)
            'guarantor_2_first_name' => ['nullable', 'string', 'max:100'],
            'guarantor_2_middle_name' => ['nullable', 'string', 'max:100'],
            'guarantor_2_last_name' => ['nullable', 'string', 'max:100'],
            'guarantor_2_phone' => ['nullable', 'string', 'max:32'],
            'guarantor_2_relationship' => ['nullable', 'string', 'max:100'],
            'guarantor_2_address' => ['nullable', 'string', 'max:255'],
            'guarantor_2_id_type' => ['nullable', 'string', 'max:32'],
            'guarantor_2_id_number' => ['nullable', 'string', 'max:100'],
            'guarantor_2_occupation' => ['nullable', 'string', 'max:150'],
        ];
    }
}
