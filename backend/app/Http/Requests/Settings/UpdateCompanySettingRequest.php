<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanySettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization is handled by middleware.
    }

    public function rules(): array
    {
        return [
            'company_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'opening_time' => ['sometimes', 'required', 'date_format:H:i'],
            'closing_time' => ['sometimes', 'required', 'date_format:H:i', 'after:opening_time'],
            'working_days' => ['sometimes', 'required', 'array', 'min:1'],
            'working_days.*' => [
                'string',
                Rule::in(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
            ],
            'timezone' => ['sometimes', 'required', 'string', 'timezone:all'],
            'pipeline_privacy' => ['sometimes', 'required', 'array'],
            'pipeline_privacy.enabled' => ['sometimes', 'boolean'],
            'pipeline_privacy.staff_can_create_pipelines' => ['sometimes', 'boolean'],
            'pipeline_privacy.staff_can_create_open_pipelines' => ['sometimes', 'boolean'],
            'pipeline_privacy.default_visibility' => ['sometimes', 'string', Rule::in(['open', 'private'])],
            'pipeline_privacy.higher_roles_can_unlock' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'closing_time.after' => 'The closing time must be after the opening time.',
            'working_days.*.in' => 'Each working day must be a valid lowercase day name (e.g. monday).',
        ];
    }
}
