<?php

namespace App\Http\Requests\Lead;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeadActivityRequest extends FormRequest
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
            'type' => ['required', 'string', Rule::in(['note', 'email', 'call', 'meeting', 'task', 'status_change', 'follow_up', 'proposal_sent', 'document', 'other'])],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'old_value' => ['nullable', 'string'],
            'new_value' => ['nullable', 'string'],
            'scheduled_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'is_completed' => ['nullable', 'boolean'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
