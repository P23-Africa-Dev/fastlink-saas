<?php

namespace App\Http\Requests\Lead;

use Illuminate\Foundation\Http\FormRequest;

class ImportLeadRequest extends FormRequest
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
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:10240'],
            'status' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'string', 'max:100'],
            'currency' => ['nullable', 'string', 'size:3'],
            'drive_id' => ['nullable', 'integer', 'exists:lead_drives,id'],
            'status_id' => ['nullable', 'integer', 'exists:lead_statuses,id'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
