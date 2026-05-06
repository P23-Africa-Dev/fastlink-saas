<?php

namespace App\Http\Requests\LeadFollowup;

use Illuminate\Foundation\Http\FormRequest;

class ReviewLeadFollowupUpdateRequest extends FormRequest
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
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
