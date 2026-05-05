<?php

namespace App\Http\Requests\ProjectTag;

use Illuminate\Foundation\Http\FormRequest;

class AssignProjectTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }
}
