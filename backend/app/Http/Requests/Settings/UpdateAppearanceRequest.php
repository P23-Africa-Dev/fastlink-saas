<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppearanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Any authenticated user can set their appearance.
    }

    public function rules(): array
    {
        return [
            'appearance' => [
                'required',
                Rule::in(['light', 'dark', 'system']),
            ],
        ];
    }
}
