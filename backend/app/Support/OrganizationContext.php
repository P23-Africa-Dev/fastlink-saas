<?php

namespace App\Support;

use App\Models\Organization;

/**
 * Request-scoped current organization context.
 * Future multi-tenant seam: all tenant queries should read organizationId() from here.
 */
class OrganizationContext
{
    private ?Organization $organization = null;

    private bool $bypassScope = false;

    public function set(?Organization $organization): void
    {
        $this->organization = $organization;
    }

    public function clear(): void
    {
        $this->organization = null;
    }

    public function organization(): ?Organization
    {
        return $this->organization;
    }

    public function id(): ?int
    {
        return $this->organization?->id;
    }

    public function check(): Organization
    {
        if (! $this->organization) {
            abort(403, 'No organization context.');
        }

        return $this->organization;
    }

    public function bypassScope(bool $bypass = true): void
    {
        $this->bypassScope = $bypass;
    }

    public function shouldBypassScope(): bool
    {
        return $this->bypassScope;
    }
}
