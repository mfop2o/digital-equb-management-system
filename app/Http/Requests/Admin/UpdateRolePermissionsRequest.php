<?php

namespace App\Http\Requests\Admin;

use App\Support\PermissionCatalog;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UpdateRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->route('role');

        return $role instanceof Role
            && ($this->user()?->can('syncPermissions', $role) ?? false);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'permissions' => ['present', 'array'],
            'permissions.*' => [
                'string',
                Rule::in(PermissionCatalog::names()),
                Rule::exists('permissions', 'name')->where('guard_name', 'web'),
            ],
        ];
    }
}
