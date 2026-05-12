<?php

namespace App\Http\Requests\Meeting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateMeetingRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
            'timezone' => ['nullable', 'timezone'],
            'guest_ids' => ['nullable', 'array', 'max:100'],
            'guest_ids.*' => ['integer', 'distinct', Rule::exists('users', 'id')],
            'guest_emails' => ['nullable', 'array', 'max:100'],
            'guest_emails.*' => ['email:rfc', 'distinct'],
            'project_id' => ['nullable', 'integer', Rule::exists('projects', 'id')],
            'task_id' => ['nullable', 'integer', Rule::exists('tasks', 'id')],
            'reminder_minutes' => ['nullable', 'array'],
            'reminder_minutes.*' => ['integer', 'min:5', 'max:10080'],
            'is_recurring' => ['nullable', 'boolean'],
            'auto_record' => ['nullable', 'boolean'],
            'share_meeting_link' => ['nullable', 'boolean'],
            'share_calendar_link' => ['nullable', 'boolean'],
            'agenda' => ['nullable', 'string', 'max:5000'],
            'approval_required' => ['nullable', 'boolean'],
        ];
    }
}
