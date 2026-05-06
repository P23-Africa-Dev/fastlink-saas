<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class PipelineStatsRequest extends FormRequest
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
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'status' => ['nullable', 'string', 'max:100'],
        ];
    }
}
