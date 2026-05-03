<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateSupervisorPasscodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') ?? false;
    }

    public function rules(): array
    {
        return [
            'supervisor_id' => [
                'required',
                'integer',
                // Must be an existing, non-deleted user with the supervisor role
                Rule::exists('users', 'id')->whereNull('deleted_at'),
            ],
            'expires_at' => [
                'sometimes',
                'nullable',
                'date',
                'after:now',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'supervisor_id.exists' => 'The specified supervisor does not exist.',
            'expires_at.after'     => 'The expiry date must be in the future.',
        ];
    }
}
