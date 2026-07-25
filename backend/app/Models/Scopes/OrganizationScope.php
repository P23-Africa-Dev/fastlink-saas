<?php

namespace App\Models\Scopes;

use App\Support\OrganizationContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class OrganizationScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(OrganizationContext::class);

        if ($context->shouldBypassScope()) {
            return;
        }

        $orgId = $context->id();

        if ($orgId === null) {
            // No org context: return nothing for tenant models (fail closed),
            // except when running migrations/seeders/console without HTTP context
            // where callers should use withoutOrganizationScope() or set context.
            if (app()->runningInConsole() && ! app()->runningUnitTests()) {
                return;
            }

            $builder->whereRaw('1 = 0');

            return;
        }

        $builder->where($model->getTable() . '.organization_id', $orgId);
    }
}
