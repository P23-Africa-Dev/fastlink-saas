<?php

namespace App\Http\Requests\Meeting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMeetingRequest extends FormRequest
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
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'start_at' => ['sometimes', 'date'],
            'end_at' => ['sometimes', 'date'],
            'timezone' => ['sometimes', 'timezone'],
            'guest_ids' => ['sometimes', 'array', 'max:100'],
            'guest_ids.*' => ['integer', 'distinct', Rule::exists('users', 'id')],
            'guest_emails' => ['sometimes', 'array', 'max:100'],
            'guest_emails.*' => ['email:rfc', 'distinct'],
            'project_id' => ['sometimes', 'nullable', 'integer', Rule::exists('projects', 'id')],
            'task_id' => ['sometimes', 'nullable', 'integer', Rule::exists('tasks', 'id')],
            'reminder_minutes' => ['sometimes', 'array'],
            'reminder_minutes.*' => ['integer', 'min:5', 'max:10080'],
            'is_recurring' => ['sometimes', 'boolean'],
            'auto_record' => ['sometimes', 'boolean'],
            'share_meeting_link' => ['sometimes', 'boolean'],
            'share_calendar_link' => ['sometimes', 'boolean'],
            'agenda' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'status' => ['sometimes', Rule::in(['scheduled', 'cancelled'])],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $start = $this->input('start_at');
            $end = $this->input('end_at');

            if ($start === null || $end === null) {
                return;
            }

            if (strtotime((string) $end) <= strtotime((string) $start)) {
                $validator->errors()->add('end_at', 'End time must be after start time.');
            }
        });
    }
}
