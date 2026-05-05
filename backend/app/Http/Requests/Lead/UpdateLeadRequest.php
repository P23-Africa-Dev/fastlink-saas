<?php

namespace App\Http\Requests\Lead;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadRequest extends FormRequest
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
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company' => ['nullable', 'string', 'max:255'],
            'employee_count' => ['nullable', 'integer', 'min:1'],
            'year_founded' => ['nullable', 'integer', 'min:1800', 'max:2100'],
            'industry' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'company_linkedin_profile' => ['nullable', 'url', 'max:255'],
            'ceo_linkedin_profile' => ['nullable', 'url', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            // Structured location FK fields
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'lga_id' => ['nullable', 'integer', 'exists:lgas,id'],
            'status' => ['sometimes', 'string', Rule::in(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'])],
            'source' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', 'string', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'estimated_value' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'interested_services' => ['nullable', 'array'],
            'interested_services.*' => ['string', 'max:255'],
            'requirements' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'drive_id' => ['nullable', 'integer', 'exists:lead_drives,id'],
            'status_id' => ['nullable', 'integer', 'exists:lead_statuses,id'],
            'next_follow_up' => ['nullable', 'date'],
            'lost_reason' => ['nullable', 'string', 'max:255'],
            'source_type' => ['nullable', 'string', 'max:255'],
            'source_id' => ['nullable', 'string', 'max:255'],
        ];
    }
}
