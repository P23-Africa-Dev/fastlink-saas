<?php

namespace App\Http\Requests\Spreadsheet;

use Illuminate\Foundation\Http\FormRequest;

class StoreSpreadsheetRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,pdf,doc,docx,txt', 'max:20480'],
        ];
    }
}
