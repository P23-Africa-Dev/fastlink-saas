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
     * When the request is multipart/form-data (i.e. file uploads are present),
     * PHP delivers every non-file field as a plain string.  We JSON-decode
     * `content` and `form_schema` here so the downstream `array` rule passes.
     */
    protected function prepareForValidation(): void
    {
        $this->decodeJsonStringField('content');
        $this->decodeJsonStringField('form_schema');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title'                         => ['required', 'string', 'max:255'],
            'content'                       => ['required', 'array'],
            'form_schema'                   => ['nullable', 'array'],
            'form_schema.fields'            => ['nullable', 'array'],
            'form_schema.fields.*.label'    => ['required_with:form_schema.fields', 'string', 'max:255'],
            'form_schema.fields.*.type'     => ['required_with:form_schema.fields', 'string', 'in:text,textarea,radio,checkbox,select,date,number'],
            'form_schema.fields.*.required' => ['nullable', 'boolean'],
            'form_schema.fields.*.options'  => ['nullable', 'array'],
            'attachments'                   => ['nullable', 'array', 'max:10'],
            'attachments.*'                 => [
                'file',
                'max:10240',
                'mimes:jpeg,jpg,png,gif,webp,pdf,doc,docx,xls,xlsx,zip,txt,csv',
            ],
        ];
    }

    /** Decode a field from a JSON string into a PHP value in-place. */
    private function decodeJsonStringField(string $field): void
    {
        $value = $this->input($field);

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $this->merge([$field => $decoded]);
            }
        }
    }
}
