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
            ->withCount('lgas')
            ->orderBy('name')
            ->orderByDesc('lgas_count')
            ->orderBy('id')
            ->get(['id', 'country_id', 'name']);

        // Some databases may contain duplicate state rows after repeated seeding.
        // Return one canonical row per state name, preferring the row that has LGAs.
        $canonical = [];
        foreach ($states as $state) {
            $key = mb_strtolower(trim((string) $state->name));
            if (!isset($canonical[$key])) {
                $canonical[$key] = [
                    'id' => $state->id,
                    'country_id' => $state->country_id,
                    'name' => $state->name,
                ];
            }
        }

        return $this->success(array_values($canonical), 'States fetched.');
    }

    /**
     * GET /api/v1/lgas?state_id={id}
     *
     * Returns all LGAs for a given state.
     */
    public function lgas(Request $request): JsonResponse
    {
        // Accept both snake_case and camelCase for compatibility with existing clients.
        if (!$request->filled('state_id') && $request->filled('stateId')) {
            $request->merge(['state_id' => $request->input('stateId')]);
        }

        $request->validate([
            'state_id' => ['required', 'integer', 'exists:states,id'],
        ]);

        $stateId = (int) $request->input('state_id');

        $lgas = Lga::query()
            ->where('state_id', $stateId)
            ->orderBy('name')
            ->get(['id', 'state_id', 'name']);

        // If selected state has no LGAs, attempt to resolve a same-name sibling state
        // in the same country that does have LGAs (handles duplicated state rows).
        if ($lgas->isEmpty()) {
            $state = State::query()->find($stateId);

            if ($state !== null) {
                $fallbackStateId = State::query()
                    ->where('country_id', $state->country_id)
                    ->whereRaw('LOWER(name) = ?', [mb_strtolower((string) $state->name)])
                    ->whereKeyNot($state->id)
                    ->whereHas('lgas')
                    ->value('id');

                if ($fallbackStateId !== null) {
                    $lgas = Lga::query()
                        ->where('state_id', (int) $fallbackStateId)
                        ->orderBy('name')
                        ->get(['id', 'state_id', 'name']);
                }
            }
        }

        return $this->success($lgas, 'LGAs fetched.');
    }
}
