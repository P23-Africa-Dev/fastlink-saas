<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateCompanySettingRequest;
use App\Services\CompanySettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanySettingController extends Controller
{
    public function __construct(
        private readonly CompanySettingService $service,
    ) {}

    /**
     * GET /v1/settings/company
     *
     * Returns company settings. All authenticated roles can read.
     */
    public function show(Request $request): JsonResponse
    {
        $settings = $this->service->get();

        return $this->success($settings, 'Company settings fetched.');
    }

    /**
     * PATCH /v1/settings/company
     *
     * Updates company settings.
     * - Admin: freely, no extra header needed.
     * - Supervisor: must pass a valid X-Supervisor-Session-Token or
     *   X-Supervisor-Device-Token (enforced by RequireCompanySettingsAccess middleware).
     */
    public function update(UpdateCompanySettingRequest $request): JsonResponse
    {
        $settings = $this->service->update(
            $request->validated(),
            $request->user(),
        );

        return $this->success($settings, 'Company settings updated.');
    }
}
