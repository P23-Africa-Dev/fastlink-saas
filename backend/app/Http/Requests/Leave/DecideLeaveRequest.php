<?php

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DecideLeaveRequest extends FormRequest
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
            'status' => ['required', 'string', Rule::in(['approved', 'rejected', 'modified'])],
            'supervisor_note' => ['nullable', 'string'],
            'decision_note' => ['nullable', 'string'],
            'modified_start_date' => ['required_if:status,modified', 'nullable', 'date'],
            'modified_end_date' => ['required_if:status,modified', 'nullable', 'date', 'after_or_equal:modified_start_date'],
        ];
    }
}
