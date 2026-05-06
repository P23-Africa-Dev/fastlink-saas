<?php

namespace App\Http\Requests\LeadFollowup;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadFollowupRequest extends FormRequest
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
            'content' => ['required', 'array'],
            'form_schema' => ['nullable', 'array'],
            'form_schema.fields' => ['nullable', 'array'],
            'form_schema.fields.*.label' => ['required_with:form_schema.fields', 'string', 'max:255'],
            'form_schema.fields.*.type' => ['required_with:form_schema.fields', 'string', 'in:text,textarea,radio,checkbox,select,date,number'],
            'form_schema.fields.*.required' => ['nullable', 'boolean'],
            'form_schema.fields.*.options' => ['nullable', 'array'],
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*' => ['file', 'max:10240'],
        ];
    }
}
