<?php

namespace App\Http\Requests\ProjectTag;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80', 'unique:project_tags,name'],
            'color' => ['nullable', 'string', 'max:20'],
        ];
    }
}
