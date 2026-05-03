<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Any authenticated user can update their own profile.
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'name'                  => ['sometimes', 'required', 'string', 'max:255'],
            'email'                 => [
                'sometimes',
                'required',
                'email',
                'max:255',
                // Must be unique in users except for the current user's own row
                "unique:users,email,{$userId},id,deleted_at,NULL",
            ],
            'current_password'      => ['required_with:password', 'string'],
            'password'              => ['sometimes', 'required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['sometimes', 'required_with:password', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required_with' => 'Your current password is required to set a new password.',
        ];
    }
}
