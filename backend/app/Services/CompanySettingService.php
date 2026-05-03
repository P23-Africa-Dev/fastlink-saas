<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Models\User;

class CompanySettingService
{
    /**
     * Retrieve the singleton company settings row.
     */
    public function get(): CompanySetting
    {
        return CompanySetting::singleton();
    }

    /**
     * Update allowed fields and record which admin changed them.
     *
     * @param  array{
     *     company_name?: string|null,
     *     opening_time?: string,
     *     closing_time?: string,
     *     working_days?: list<string>,
     *     timezone?: string,
     * } $data
     */
    public function update(array $data, User $updatedBy): CompanySetting
    {
        $settings = $this->get();

        $settings->fill($data);
        $settings->updated_by = $updatedBy->id;
        $settings->save();

        return $settings->fresh(['updatedBy']);
    }
}
