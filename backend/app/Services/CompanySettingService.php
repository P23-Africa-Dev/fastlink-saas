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
        return CompanySetting::forCurrentOrganization();
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
     *     pipeline_privacy?: array<string, mixed>,
     * } $data
     */
    public function update(array $data, User $updatedBy): CompanySetting
    {
        $settings = $this->get();

        if (array_key_exists('pipeline_privacy', $data) && is_array($data['pipeline_privacy'])) {
            $data['pipeline_privacy'] = array_merge(
                CompanySetting::defaultPipelinePrivacy(),
                is_array($settings->pipeline_privacy) ? $settings->pipeline_privacy : [],
                $data['pipeline_privacy']
            );

            if (isset($data['pipeline_privacy']['default_visibility'])
                && ! in_array($data['pipeline_privacy']['default_visibility'], ['open', 'private'], true)
            ) {
                $data['pipeline_privacy']['default_visibility'] = 'open';
            }
        }

        $settings->fill($data);
        $settings->updated_by = $updatedBy->id;
        $settings->save();

        return $settings->fresh(['updatedBy']);
    }
}
