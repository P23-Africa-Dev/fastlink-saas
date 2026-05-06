<?php

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;

class CalendarEventsRequest extends FormRequest
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
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'type' => ['nullable', 'string', 'in:attendance,leave,project,task'],
        ];
    }

    public function messages(): array
    {
        return [
            'start_date.required' => 'Start date is required.',
            'start_date.date_format' => 'Start date must be in YYYY-MM-DD format.',
            'end_date.required' => 'End date is required.',
            'end_date.date_format' => 'End date must be in YYYY-MM-DD format.',
            'end_date.after_or_equal' => 'End date must be after or equal to start date.',
            'type.in' => 'Type must be one of: attendance, leave, project, task.',
        ];
    }
}
