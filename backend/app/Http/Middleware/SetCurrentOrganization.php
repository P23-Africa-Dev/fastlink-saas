<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Support\OrganizationContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentOrganization
{
    public function __construct(
        private readonly OrganizationContext $context,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Platform routes do not require an org context.
        if ($request->is('api/v1/platform') || $request->is('api/v1/platform/*')) {
            $this->context->bypassScope(true);

            return $next($request);
        }

        // Auth switch / me endpoints may run before org is fully selected.
        if ($request->is('api/v1/auth/me')
            || $request->is('api/v1/auth/logout')
            || $request->is('api/v1/auth/organizations/*/switch')
        ) {
            $orgId = $this->resolveOrgId($request, $user);
            if ($orgId) {
                $this->activate($orgId, $user, requireMembership: false);
            }

            return $next($request);
        }

        $orgId = $this->resolveOrgId($request, $user);

        if (! $orgId) {
            return response()->json([
                'success' => false,
                'message' => 'No organization selected. Switch to a workspace first.',
                'errors' => (object) [],
            ], 403);
        }

        if (! $this->activate($orgId, $user, requireMembership: true)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this organization.',
                'errors' => (object) [],
            ], 403);
        }

        return $next($request);
    }

    private function resolveOrgId(Request $request, $user): ?int
    {
        $header = $request->header('X-Organization-Id');
        if ($header !== null && $header !== '' && is_numeric($header)) {
            return (int) $header;
        }

        return $user->current_organization_id ? (int) $user->current_organization_id : null;
    }

    private function activate(int $orgId, $user, bool $requireMembership): bool
    {
        $organization = Organization::query()->find($orgId);

        if (! $organization || $organization->isSuspended()) {
            return false;
        }

        if ($requireMembership || ! $user->is_super_admin) {
            $membership = OrganizationUser::query()
                ->where('organization_id', $orgId)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->first();

            if (! $membership) {
                // Super admins can browse platform without membership, but
                // tenant routes still require membership unless bypassed above.
                if ($requireMembership) {
                    return false;
                }
            }
        }

        $this->context->set($organization);
        $this->context->bypassScope(false);
        setPermissionsTeamId($orgId);

        return true;
    }
}
