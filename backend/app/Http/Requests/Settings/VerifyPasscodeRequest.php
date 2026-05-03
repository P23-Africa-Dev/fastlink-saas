<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class VerifyPasscodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('supervisor') ?? false;
    }

    public function rules(): array
    {
        return [
            'passcode'       => ['required', 'string'],
            'remember_device' => ['sometimes', 'boolean'],
        ];
    }
}
