<?php

namespace App\Http\Requests\LeadDrive;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadDriveRequest extends FormRequest
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
        $driveId = $this->route('drive')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('lead_drives', 'slug')->ignore($driveId)],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:20'],
            'position' => ['nullable', 'integer', 'min:0'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
