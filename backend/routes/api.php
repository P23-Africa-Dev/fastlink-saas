<?php

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CalendarController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\IndustryController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LeadFollowupController;
use App\Http\Controllers\Api\V1\LeadDriveController;
use App\Http\Controllers\Api\V1\LeadStatusController;
use App\Http\Controllers\Api\V1\LeadAnalyticsController;
use App\Http\Controllers\Api\V1\LeaveRequestController;
use App\Http\Controllers\Api\V1\LocationController;
use App\Http\Controllers\Api\V1\MeetingController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProjectTagController;
use App\Http\Controllers\Api\V1\Settings\CompanySettingController;
use App\Http\Controllers\Api\V1\Settings\ProfileController;
use App\Http\Controllers\Api\V1\Settings\SupervisorPasscodeController;
use App\Http\Controllers\Api\V1\SpreadsheetController;
use App\Http\Controllers\Api\V1\SubtaskController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', [HealthController::class, 'check'])->name('api.health');
    Route::post('/auth/login', [AuthController::class, 'login'])->name('api.auth.login');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:6,1')
        ->name('api.auth.forgot-password');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:6,1')
        ->name('api.auth.reset-password');
    Route::get('/google/calendar/callback', [\App\Http\Controllers\Api\V1\GoogleCalendarConnectionController::class, 'callback'])
        ->name('api.google.calendar.callback');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me'])->name('api.auth.me');
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.auth.logout');

        Route::get('/dashboard/stats', [DashboardController::class, 'stats'])
            ->middleware('role:admin|supervisor|staff')
            ->name('api.dashboard.stats');
        Route::get('/dashboard/pipeline-stats', [DashboardController::class, 'pipelineStats'])
            ->middleware('role:admin|supervisor|staff')
            ->name('api.dashboard.pipeline-stats');
        Route::get('/dashboard/daily-tasks', [DashboardController::class, 'dailyTasks'])
            ->middleware('role:admin|supervisor|staff')
            ->name('api.dashboard.daily-tasks');

        // Calendar events aggregation (read) and task creation (write)
        Route::get('/calendar/events', [CalendarController::class, 'events'])
            ->middleware('role:admin|supervisor|staff')
            ->name('api.calendar.events');
        Route::get('/calendar/meetings', [MeetingController::class, 'calendarMeetings'])
            ->middleware('role:admin|supervisor|staff')
            ->name('api.calendar.meetings');
        Route::get('/google/calendar/status', [\App\Http\Controllers\Api\V1\GoogleCalendarConnectionController::class, 'status'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/google/calendar/connect', [\App\Http\Controllers\Api\V1\GoogleCalendarConnectionController::class, 'connect'])
            ->middleware('role:admin|supervisor|staff');
        Route::delete('/google/calendar/disconnect', [\App\Http\Controllers\Api\V1\GoogleCalendarConnectionController::class, 'disconnect'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/calendar/tasks', [CalendarController::class, 'storeTask'])
            ->middleware('auth:sanctum')
            ->name('api.calendar.store-task');

        Route::get('/meetings', [MeetingController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/meetings', [MeetingController::class, 'store'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/meetings/{meeting}', [MeetingController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::put('/meetings/{meeting}', [MeetingController::class, 'update'])
            ->middleware('role:admin|supervisor|staff');
        Route::delete('/meetings/{meeting}', [MeetingController::class, 'destroy'])
            ->middleware('role:admin|supervisor|staff');

        // Location hierarchy (read-only, available to all authenticated users)
        Route::get('/countries', [LocationController::class, 'countries'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/states', [LocationController::class, 'states'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/lgas', [LocationController::class, 'lgas'])
            ->middleware('role:admin|supervisor|staff');

        // Canonical industry list for lead forms/import
        Route::get('/industries', [IndustryController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');

        Route::get('/users/supervisors', [UserController::class, 'supervisors'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/users/assignable', [UserController::class, 'assignable'])
            ->middleware('auth:sanctum')
            ->name('api.users.assignable');
        Route::get('/users', [UserController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/users', [UserController::class, 'store'])
            ->middleware('role:admin|supervisor');
        Route::get('/users/{user}', [UserController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('/users/{user}', [UserController::class, 'update'])
            ->middleware('role:admin|supervisor');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])
            ->middleware('role:admin|supervisor');

        Route::get('crm/drives', [LeadDriveController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('crm/drives', [LeadDriveController::class, 'store'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('crm/drives/{drive}', [LeadDriveController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('crm/drives/{drive}', [LeadDriveController::class, 'update'])
            ->middleware('role:admin|supervisor|staff');
        Route::delete('crm/drives/{drive}', [LeadDriveController::class, 'destroy'])
            ->middleware('role:admin|supervisor|staff');

        Route::get('/crm/lead-analytics', [LeadAnalyticsController::class, 'index'])
            ->middleware('role:admin|supervisor');
        Route::get('/crm/lead-analytics/timeline', [LeadAnalyticsController::class, 'timeline'])
            ->middleware('role:admin|supervisor');
        Route::get('/crm/lead-analytics/top-uploaders', [LeadAnalyticsController::class, 'topUploaders'])
            ->middleware('role:admin|supervisor');

        Route::apiResource('crm/statuses', LeadStatusController::class)
            ->parameters(['statuses' => 'status'])
            ->middleware('role:admin|supervisor');

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

        Route::get('/crm/leads/{lead}/followups', [LeadFollowupController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/crm/leads/{lead}/followups', [LeadFollowupController::class, 'store'])
            ->middleware('role:admin|supervisor|staff');
        Route::put('/crm/followups/{followup}', [LeadFollowupController::class, 'update'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/crm/followups/{followup}/approve', [LeadFollowupController::class, 'approve'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/crm/followups/{followup}/reject', [LeadFollowupController::class, 'reject'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/crm/followups/{followup}/attachments/{attachment}/view', [LeadFollowupController::class, 'viewAttachment'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/crm/followups/{followup}/attachments/{attachment}/download', [LeadFollowupController::class, 'downloadAttachment'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/crm/followups/attachments/{attachment}/view', [LeadFollowupController::class, 'viewAttachmentById'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/crm/followups/attachments/{attachment}/download', [LeadFollowupController::class, 'downloadAttachmentById'])
            ->middleware('role:admin|supervisor|staff');

        // Backward-compatible aliases for follow-up workflow endpoints.
        Route::get('/leads/{lead}/followups', [LeadFollowupController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/leads/{lead}/followups', [LeadFollowupController::class, 'store'])
            ->middleware('role:admin|supervisor|staff');
        Route::put('/followups/{followup}', [LeadFollowupController::class, 'update'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/followups/{followup}/approve', [LeadFollowupController::class, 'approve'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/followups/{followup}/reject', [LeadFollowupController::class, 'reject'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/followups/{followup}/attachments/{attachment}/view', [LeadFollowupController::class, 'viewAttachment'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/followups/{followup}/attachments/{attachment}/download', [LeadFollowupController::class, 'downloadAttachment'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/followups/attachments/{attachment}/view', [LeadFollowupController::class, 'viewAttachmentById'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/followups/attachments/{attachment}/download', [LeadFollowupController::class, 'downloadAttachmentById'])
            ->middleware('role:admin|supervisor|staff');

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

        Route::get('/projects/tags', [ProjectTagController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/projects/tags', [ProjectTagController::class, 'store'])
            ->middleware('role:admin|supervisor');
        Route::post('/projects/tags/{tag}/assign', [ProjectTagController::class, 'assign'])
            ->middleware('role:admin|supervisor');

        Route::get('/tasks/kanban', [TaskController::class, 'kanban'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/tasks', [TaskController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/tasks', [TaskController::class, 'store'])
            ->middleware('auth:sanctum');
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

        // Subtask routes (nested under tasks)
        Route::get('/tasks/{task}/subtasks', [SubtaskController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/tasks/{task}/subtasks', [SubtaskController::class, 'store'])
            ->middleware('role:admin|supervisor');

        // Subtask update / delete (top-level resource)
        Route::put('/subtasks/{subtask}', [SubtaskController::class, 'update'])
            ->middleware('role:admin|supervisor|staff');
        Route::delete('/subtasks/{subtask}', [SubtaskController::class, 'destroy'])
            ->middleware('role:admin|supervisor');

        Route::get('/attendance', [AttendanceController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/attendance/sign-in', [AttendanceController::class, 'signIn'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/attendance/sign-out', [AttendanceController::class, 'signOut'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/attendance/calendar', [AttendanceController::class, 'calendar'])
            ->middleware('role:admin|supervisor|staff');

        Route::get('/leave-requests/calendar', [LeaveRequestController::class, 'calendar'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/leave-requests', [LeaveRequestController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/leave-requests', [LeaveRequestController::class, 'store'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/leave-requests/{leaveRequest}', [LeaveRequestController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('/leave-requests/{leaveRequest}', [LeaveRequestController::class, 'update'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/leave-requests/{leaveRequest}/cancel', [LeaveRequestController::class, 'cancel'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/leave-requests/{leaveRequest}/decide', [LeaveRequestController::class, 'decide'])
            ->middleware('role:admin|supervisor');
        Route::post('/leave-requests/{leaveRequest}/respond', [LeaveRequestController::class, 'respond'])
            ->middleware('role:admin|supervisor|staff');

        Route::get('/notifications', [NotificationController::class, 'index'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsRead'])
            ->middleware('role:admin|supervisor|staff');
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead'])
            ->middleware('role:admin|supervisor|staff');
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])
            ->middleware('role:admin|supervisor|staff');

        Route::get('/activity-logs', [ActivityLogController::class, 'index'])
            ->middleware('role:admin');

        Route::get('/settings/profile', [ProfileController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('/settings/profile', [ProfileController::class, 'update'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('/settings/appearance', [ProfileController::class, 'updateAppearance'])
            ->middleware('role:admin|supervisor|staff');
        Route::get('/settings/company', [CompanySettingController::class, 'show'])
            ->middleware('role:admin|supervisor|staff');
        Route::patch('/settings/company', [CompanySettingController::class, 'update'])
            ->middleware(['role:admin|supervisor', 'company.settings.access']);
        Route::get('/settings/company/passcodes', [SupervisorPasscodeController::class, 'index'])
            ->middleware('role:admin');
        Route::post('/settings/company/passcodes', [SupervisorPasscodeController::class, 'generate'])
            ->middleware('role:admin');
        Route::delete('/settings/company/passcodes/{passcode}', [SupervisorPasscodeController::class, 'revoke'])
            ->middleware('role:admin');
        Route::post('/settings/company/verify-passcode', [SupervisorPasscodeController::class, 'verifyPasscode'])
            ->middleware('role:supervisor');
        Route::post('/settings/company/validate-device-token', [SupervisorPasscodeController::class, 'validateDeviceToken'])
            ->middleware('role:supervisor');
    });
});

// Non-versioned aliases for meeting integration requirements.
Route::middleware(['auth:sanctum', 'role:admin|supervisor|staff'])->group(function () {
    Route::post('/meetings', [MeetingController::class, 'store']);
    Route::put('/meetings/{meeting}', [MeetingController::class, 'update']);
    Route::delete('/meetings/{meeting}', [MeetingController::class, 'destroy']);
    Route::get('/calendar/meetings', [MeetingController::class, 'calendarMeetings']);
});
