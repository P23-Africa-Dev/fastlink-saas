<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Keep API auth stateless (Bearer tokens) to avoid CSRF requirements on /api routes.

        $middleware->alias([
            'role'                    => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission'              => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission'      => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'company.settings.access' => \App\Http\Middleware\RequireCompanySettingsAccess::class,
            'organization'            => \App\Http\Middleware\SetCurrentOrganization::class,
            'super_admin'             => \App\Http\Middleware\EnsureSuperAdmin::class,
        ]);

        // Organization context must be set BEFORE route model binding. Otherwise
        // OrganizationScope sees a null org and applies whereRaw('1 = 0'), causing
        // 404s on every {lead}/{drive}/{followup}/… binding while create/list still work.
        $middleware->prependToPriorityList(
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \App\Http\Middleware\SetCurrentOrganization::class,
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Always return JSON payloads for API routes.
        $exceptions->shouldRenderJsonWhen(
            fn(Request $request, \Throwable $e) => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(function (ValidationException $e, Request $request) {
            if (!$request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if (!$request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'errors' => (object) [],
            ], 401);
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if (!$request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Forbidden.',
                'errors' => (object) [],
            ], 403);
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if (!$request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
                'errors' => (object) [],
            ], 404);
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, Request $request) {
            if (!$request->is('api/*')) {
                return null;
            }

            // Route model binding wraps ModelNotFoundException; never leak Eloquent text.
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
                'errors' => (object) [],
            ], 404);
        });

        $exceptions->render(function (\Throwable $e, Request $request) {
            if (!$request->is('api/*') || $e instanceof ValidationException || $e instanceof AuthenticationException || $e instanceof AuthorizationException || $e instanceof ModelNotFoundException) {
                return null;
            }

            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;

            return response()->json([
                'success' => false,
                'message' => $status >= 500 ? 'Server error.' : ($e->getMessage() ?: 'Request failed.'),
                'errors' => config('app.debug') ? ['exception' => $e->getMessage()] : (object) [],
            ], $status);
        });
    })->create();
