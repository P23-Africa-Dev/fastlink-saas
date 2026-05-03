<?php

namespace App\Http\Middleware;

use App\Services\SupervisorPasscodeService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate-keeps write access to company settings.
 *
 * Admins pass freely.
 * Supervisors must supply one of:
 *   - X-Supervisor-Session-Token : a short-lived token (2 h) issued by verify-passcode
 *   - X-Supervisor-Device-Token  : a long-lived token issued when "remember device" is requested
 *
 * All other roles are denied.
 */
class RequireCompanySettingsAccess
{
    public function __construct(
        private readonly SupervisorPasscodeService $passcodeService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'errors'  => (object) [],
            ], 401);
        }

        // Admins always have access.
        if ($user->hasRole('admin')) {
            return $next($request);
        }

        // Supervisors must prove they verified their passcode for this session.
        if ($user->hasRole('supervisor')) {
            $sessionToken = $request->header('X-Supervisor-Session-Token');
            $deviceToken  = $request->header('X-Supervisor-Device-Token');

            $rawToken = $sessionToken ?? $deviceToken;

            if (! $rawToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company settings access requires passcode verification.',
                    'errors'  => ['token' => ['Missing supervisor access token header.']],
                ], 403);
            }

            $token = $this->passcodeService->validateToken($user, $rawToken);

            if (! $token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supervisor access token is invalid or has expired. Please verify your passcode again.',
                    'errors'  => ['token' => ['Invalid or expired token.']],
                ], 403);
            }

            // Enforce that a session token cannot act as a device token and vice versa.
            if ($sessionToken && $token->type !== 'session') {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid token type for X-Supervisor-Session-Token header.',
                    'errors'  => ['token' => ['Token type mismatch.']],
                ], 403);
            }

            if ($deviceToken && $token->type !== 'device') {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid token type for X-Supervisor-Device-Token header.',
                    'errors'  => ['token' => ['Token type mismatch.']],
                ], 403);
            }

            return $next($request);
        }

        // Staff and any other roles are forbidden.
        return response()->json([
            'success' => false,
            'message' => 'Forbidden. Only admins and supervisors can modify company settings.',
            'errors'  => (object) [],
        ], 403);
    }
}
