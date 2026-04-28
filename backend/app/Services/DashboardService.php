<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Lead;
use App\Models\LeaveRequest;
use App\Models\Project;
use App\Models\Spreadsheet;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

class DashboardService
{
    public function stats(): array
    {
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        $usersTotal = User::count();
        $usersActive = User::active()->count();

        $leadsTotal = Lead::count();
        $leadsNew = Lead::where('status', 'new')->count();
        $leadsWon = Lead::where('status', 'won')->count();
        $leadsLost = Lead::where('status', 'lost')->count();
        $pipelineValue = (float) Lead::whereNotNull('estimated_value')->sum('estimated_value');

        $projectsTotal = Project::count();
        $projectsActive = Project::where('status', 'in_progress')->count();

        $tasksTotal = Task::count();
        $tasksCompleted = Task::where('status', 'completed')->count();
        $tasksTodo = Task::whereIn('status', ['todo', 'in_progress', 'review'])->count();

        $attendanceToday = Attendance::whereDate('date', $today)->count();
        $leavePending = LeaveRequest::where('status', 'pending')->count();

        $spreadsheetsTotal = Spreadsheet::count();

        $conversionRate = $leadsTotal > 0 ? round(($leadsWon / $leadsTotal) * 100, 2) : 0.0;

        $monthlyLeads = Lead::whereBetween('created_at', [$monthStart, $monthEnd])->count();
        $monthlyTasksCompleted = Task::where('status', 'completed')
            ->whereBetween('updated_at', [$monthStart, $monthEnd])
            ->count();

        return [
            'overview' => [
                'users_total' => $usersTotal,
                'users_active' => $usersActive,
                'leads_total' => $leadsTotal,
                'projects_total' => $projectsTotal,
                'tasks_total' => $tasksTotal,
                'attendance_today' => $attendanceToday,
                'leave_pending' => $leavePending,
                'spreadsheets_total' => $spreadsheetsTotal,
            ],
            'crm' => [
                'new' => $leadsNew,
                'won' => $leadsWon,
                'lost' => $leadsLost,
                'pipeline_value' => $pipelineValue,
                'conversion_rate' => $conversionRate,
            ],
            'projects' => [
                'active' => $projectsActive,
                'completed_tasks' => $tasksCompleted,
                'pending_tasks' => $tasksTodo,
            ],
            'monthly' => [
                'new_leads' => $monthlyLeads,
                'completed_tasks' => $monthlyTasksCompleted,
            ],
        ];
    }
}
