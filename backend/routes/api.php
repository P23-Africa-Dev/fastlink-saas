<?php

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LeadDriveController;
use App\Http\Controllers\Api\V1\LeadStatusController;
use App\Http\Controllers\Api\V1\LeaveRequestController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\SpreadsheetController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — FastLink SaaS Backend
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api automatically via bootstrap/app.php.
| Authentication will be added via Sanctum once users/auth flow is built.
|
*/

Route::prefix('v1')->group(function () {

    // Public endpoints
    Route::get('/health', [HealthController::class, 'check'])->name('api.health');
    Route::post('/auth/login', [AuthController::class, 'login'])->name('api.auth.login');

    Route::middleware('auth:sanctum')->group(function () {
        // Authentication
        Route::get('/auth/me', [AuthController::class, 'me'])->name('api.auth.me');
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.auth.logout');

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats'])
            ->middleware('role:admin|supervisor|staff')
            ->name('api.dashboard.stats');

        // User management
        Route::get('/users', [UserController::class, 'index'])
            ->middleware('role:admin');
        Route::post('/users', [UserController::class, 'store'])
            ->middleware('role:admin|supervisor');
        Route::get('/users/{user}', [UserController::class, 'show'])
            ->middleware('role:admin');
        Route::patch('/users/{user}', [UserController::class, 'update'])
            ->middleware('role:admin');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])
            ->middleware('role:admin');

        // CRM: drives and statuses
        Route::apiResource('crm/drives', LeadDriveController::class)
            ->parameters(['drives' => 'drive'])
            ->middleware('role:admin|supervisor');

        Route::apiResource('crm/statuses', LeadStatusController::class)
            ->parameters(['statuses' => 'status'])
            ->middleware('role:admin|supervisor');

        // CRM: leads and activities
        Route::get('/crm/leads', [LeadController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/crm/leads', [LeadController::class, 'store'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/crm/leads/import', [LeadController::class, 'import'])
            ->middleware('role:admin|supervisor');
        Route::get('/crm/leads/{lead}', [LeadController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('/crm/leads/{lead}', [LeadController::class, 'update'])
            ->middleware('role:admin|supervisor|staff');
        Route::delete('/crm/leads/{lead}', [LeadController::class, 'destroy'])
            ->middleware('role:admin|supervisor');

        Route::get('/crm/leads/{lead}/activities', [LeadController::class, 'activities'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/crm/leads/{lead}/activities', [LeadController::class, 'storeActivity'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('/crm/activities/{activity}', [LeadController::class, 'updateActivity'])
            ->middleware('role:admin|supervisor|staff');

        // Spreadsheet module
        Route::get('/spreadsheets', [SpreadsheetController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/spreadsheets', [SpreadsheetController::class, 'store'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/spreadsheets/{spreadsheet}', [SpreadsheetController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/spreadsheets/{spreadsheet}/download', [SpreadsheetController::class, 'download'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('/spreadsheets/{spreadsheet}', [SpreadsheetController::class, 'update'])
            ->middleware('role:admin|supervisor|staff');
        Route::delete('/spreadsheets/{spreadsheet}', [SpreadsheetController::class, 'destroy'])
            ->middleware('role:admin|supervisor');

        // Projects + Gantt
        Route::get('/projects/gantt', [ProjectController::class, 'gantt'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/projects', [ProjectController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/projects', [ProjectController::class, 'store'])
            ->middleware('role:admin|supervisor');
        Route::get('/projects/{project}', [ProjectController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('/projects/{project}', [ProjectController::class, 'update'])
            ->middleware('role:admin|supervisor');
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])
            ->middleware('role:admin|supervisor');

        // Tasks + Kanban
        Route::get('/tasks/kanban', [TaskController::class, 'kanban'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/tasks', [TaskController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/tasks', [TaskController::class, 'store'])
            ->middleware('role:admin|supervisor');
        Route::get('/tasks/{task}', [TaskController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('/tasks/{task}', [TaskController::class, 'update'])
            ->middleware('role:admin|supervisor|staff');
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])
            ->middleware('role:admin|supervisor');
        Route::patch('/tasks/{task}/reorder', [TaskController::class, 'reorder'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/tasks/{task}/comments', [TaskController::class, 'addComment'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/tasks/{task}/assign', [TaskController::class, 'assign'])
            ->middleware('role:admin|supervisor');

        // Attendance
        Route::get('/attendance', [AttendanceController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/attendance/sign-in', [AttendanceController::class, 'signIn'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/attendance/sign-out', [AttendanceController::class, 'signOut'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/attendance/calendar', [AttendanceController::class, 'calendar'])
            ->middleware('role:admin|supervisor|staff');

        // Leave requests
        Route::get('/leave-requests/calendar', [LeaveRequestController::class, 'calendar'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/leave-requests', [LeaveRequestController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/leave-requests', [LeaveRequestController::class, 'store'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/leave-requests/{leaveRequest}', [LeaveRequestController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/leave-requests/{leaveRequest}/decide', [LeaveRequestController::class, 'decide'])
            ->middleware('role:admin|supervisor');
        Route::post('/leave-requests/{leaveRequest}/respond', [LeaveRequestController::class, 'respond'])
            ->middleware('role:admin|supervisor|staff');
    });
});
