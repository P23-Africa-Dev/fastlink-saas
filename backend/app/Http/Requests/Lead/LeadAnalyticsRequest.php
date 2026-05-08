<?php

namespace App\Http\Requests\Lead;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeadAnalyticsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'type' => ['nullable', Rule::in(['manual', 'imported', 'both'])],
            'period' => ['nullable', Rule::in(['today', 'week', 'month', 'custom'])],
            'start_date' => ['nullable', 'date_format:Y-m-d', 'required_if:period,custom'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'required_if:period,custom', 'after_or_equal:start_date'],
            'drive_id' => ['nullable', 'integer', 'exists:lead_drives,id'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'lga_id' => ['nullable', 'integer', 'exists:lgas,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
