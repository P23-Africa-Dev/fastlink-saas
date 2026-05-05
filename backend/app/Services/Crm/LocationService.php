<?php

namespace App\Services\Crm;

use App\Models\Country;
use App\Models\Lga;
use App\Models\State;

/**
 * Resolves free-text location strings (from CSV import or user input) to
 * database IDs.  Lookups are built once per request and cached in-memory.
 */
class LocationService
{
    /** @var array<string, int>  e.g. ['nigeria' => 1, 'ng' => 1] */
    private array $countryLookup = [];

    /** @var array<int, array<string, int>>  state lookup per country_id */
    private array $stateLookup = [];

    /** @var array<int, array<string, int>>  lga lookup per state_id */
    private array $lgaLookup = [];

    private ?int $nigeriaId = null;

    // -------------------------------------------------------------------------
    // Public resolution helpers
    // -------------------------------------------------------------------------

    /**
     * Resolve a country name or ISO code to its DB id.
     * Returns null silently if not found.
     */
    public function resolveCountryId(?string $value): ?int
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $key = $this->key($value);
        $lookup = $this->countryLookup();

        return $lookup[$key] ?? null;
    }

    /**
     * Resolve a state name to its DB id, scoped to the given country.
     * If no country is given, defaults to Nigeria.
     */
    public function resolveStateId(?string $value, ?int $countryId = null): ?int
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $cid    = $countryId ?? $this->defaultCountryId();
        $key    = $this->key($value);
        $lookup = $this->stateLookupFor($cid);

        return $lookup[$key] ?? null;
    }

    /**
     * Resolve an LGA name to its DB id, scoped to the given state.
     */
    public function resolveLgaId(?string $value, ?int $stateId = null): ?int
    {
        if ($value === null || trim($value) === '' || $stateId === null) {
            return null;
        }

        $key    = $this->key($value);
        $lookup = $this->lgaLookupFor($stateId);

        return $lookup[$key] ?? null;
    }

    /**
     * Resolve a free-text row (from CSV) to [country_id, state_id, lga_id].
     * Any unresolved level is silently null — the import is never failed.
     *
     * @return array{country_id: int|null, state_id: int|null, lga_id: int|null}
     */
    public function resolveRow(?string $countryInput, ?string $stateInput, ?string $lgaInput): array
    {
        $countryId = $this->resolveCountryId($countryInput);
        $stateId   = $this->resolveStateId($stateInput, $countryId);
        $lgaId     = $this->resolveLgaId($lgaInput, $stateId);

        return [
            'country_id' => $countryId,
            'state_id'   => $stateId,
            'lga_id'     => $lgaId,
        ];
    }

    /**
     * Return the DB id for Nigeria (or null if not seeded yet).
     */
    public function defaultCountryId(): ?int
    {
        if ($this->nigeriaId !== null) {
            return $this->nigeriaId;
        }

        $ng = Country::query()->whereRaw('LOWER(name) = ?', ['nigeria'])->value('id');
        $this->nigeriaId = $ng;

        return $this->nigeriaId;
    }

    // -------------------------------------------------------------------------
    // Lazy lookup builders
    // -------------------------------------------------------------------------

    /** @return array<string, int> */
    private function countryLookup(): array
    {
        if ($this->countryLookup !== []) {
            return $this->countryLookup;
        }

        Country::query()->select(['id', 'name', 'code'])->orderBy('id')->each(function (Country $c) {
            $this->countryLookup[$this->key($c->name)] = $c->id;
            $this->countryLookup[$this->key($c->code)] = $c->id;
        });

        return $this->countryLookup;
    }

    /** @return array<string, int> */
    private function stateLookupFor(int $countryId): array
    {
        if (isset($this->stateLookup[$countryId])) {
            return $this->stateLookup[$countryId];
        }

        $map = [];
        State::query()->where('country_id', $countryId)->select(['id', 'name'])->each(function (State $s) use (&$map) {
            $map[$this->key($s->name)] = $s->id;
        });

        $this->stateLookup[$countryId] = $map;

        return $map;
    }

    /** @return array<string, int> */
    private function lgaLookupFor(int $stateId): array
    {
        if (isset($this->lgaLookup[$stateId])) {
            return $this->lgaLookup[$stateId];
        }

        $map = [];
        Lga::query()->where('state_id', $stateId)->select(['id', 'name'])->each(function (Lga $l) use (&$map) {
            $map[$this->key($l->name)] = $l->id;
        });

        $this->lgaLookup[$stateId] = $map;

        return $map;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function key(string $value): string
    {
        return strtolower(trim($value));
    }
}
