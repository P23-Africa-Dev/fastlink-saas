<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'status' => ['nullable', 'string', Rule::in(['todo', 'in_progress', 'review', 'completed'])],
            'priority' => ['nullable', 'string', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'order' => ['nullable', 'integer', 'min:0'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['integer', 'exists:users,id'],
        ];
    }
}
