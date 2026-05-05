<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Lga;
use App\Models\State;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * GET /api/v1/countries
     *
     * Returns all countries ordered by name.
     * The default country (Nigeria) is flagged with is_default: true.
     */
    public function countries(): JsonResponse
    {
        $countries = Country::query()
            ->orderByRaw("CASE WHEN LOWER(name) = 'nigeria' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $nigeriaId = $countries->where('name', 'Nigeria')->value('id');

        $data = $countries->map(fn(Country $c) => [
            'id'         => $c->id,
            'name'       => $c->name,
            'code'       => $c->code,
            'is_default' => $c->id === $nigeriaId,
        ]);

        return $this->success($data, 'Countries fetched.');
    }

    /**
     * GET /api/v1/states?country_id={id}
     *
     * Returns all states for a given country.
     * If country_id is omitted, returns states for Nigeria.
     */
    public function states(Request $request): JsonResponse
    {
        $request->validate([
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
        ]);

        $countryId = $request->filled('country_id')
            ? (int) $request->input('country_id')
            : Country::query()->whereRaw('LOWER(name) = ?', ['nigeria'])->value('id');

        if ($countryId === null) {
            return $this->success([], 'No states found.');
        }

        $states = State::query()
            ->where('country_id', $countryId)
            ->orderBy('name')
            ->get(['id', 'country_id', 'name']);

        return $this->success($states, 'States fetched.');
    }

    /**
     * GET /api/v1/lgas?state_id={id}
     *
     * Returns all LGAs for a given state.
     */
    public function lgas(Request $request): JsonResponse
    {
        $request->validate([
            'state_id' => ['required', 'integer', 'exists:states,id'],
        ]);

        $lgas = Lga::query()
            ->where('state_id', (int) $request->input('state_id'))
            ->orderBy('name')
            ->get(['id', 'state_id', 'name']);

        return $this->success($lgas, 'LGAs fetched.');
    }
}
