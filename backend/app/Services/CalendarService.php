<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Project;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CalendarService
{
    /**
     * Get unified calendar events for a date range.
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @param ?string $type Filter by event type (attendance, leave, project, task)
     * @return Collection
     */
    public function getEvents(Carbon $startDate, Carbon $endDate, ?string $type = null): Collection
    {
        $events = collect();

        // Include specified type or all types if no filter
        if ($type === null || $type === 'attendance') {
            $events = $events->merge($this->getAttendanceEvents($startDate, $endDate));
        }

        if ($type === null || $type === 'leave') {
            $events = $events->merge($this->getLeaveEvents($startDate, $endDate));
        }

        if ($type === null || $type === 'project') {
            $events = $events->merge($this->getProjectEvents($startDate, $endDate));
        }

        if ($type === null || $type === 'task') {
            $events = $events->merge($this->getTaskEvents($startDate, $endDate));
        }

        // Sort events by start_date
        return $events->sortBy('start_date')->values();
    }

    /**
     * Get attendance events within date range.
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return Collection
     */
    private function getAttendanceEvents(Carbon $startDate, Carbon $endDate): Collection
    {
        return Attendance::query()
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get()
            ->map(function (Attendance $attendance) {
                $title = 'Attendance';
                if ($attendance->signed_in_at && $attendance->signed_out_at) {
                    $title = 'Clock In/Out';
                } elseif ($attendance->signed_in_at) {
                    $title = 'Clocked In';
                }

                return [
                    'id' => "attendance_{$attendance->id}",
                    'type' => 'attendance',
                    'title' => $title,
                    'start_date' => $attendance->date->format('Y-m-d'),
                    'end_date' => $attendance->date->format('Y-m-d'),
                    'status' => 'completed',
                    'meta' => [
                        'attendance_id' => $attendance->id,
                        'signed_in_at' => $attendance->signed_in_at?->format('H:i:s'),
                        'signed_out_at' => $attendance->signed_out_at?->format('H:i:s'),
                    ],
                ];
            });
    }

    /**
     * Get leave request events within date range.
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return Collection
     */
    private function getLeaveEvents(Carbon $startDate, Carbon $endDate): Collection
    {
        return LeaveRequest::query()
            ->whereBetween('start_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orWhereBetween('end_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orWhere(function ($query) use ($startDate, $endDate) {
                $query->where('start_date', '<=', $startDate->toDateString())
                    ->where('end_date', '>=', $endDate->toDateString());
            })
            ->get()
            ->map(function (LeaveRequest $leave) {
                return [
                    'id' => "leave_{$leave->id}",
                    'type' => 'leave',
                    'title' => ucfirst(str_replace('_', ' ', $leave->type ?? 'Leave')) . ' Request',
                    'start_date' => $leave->start_date->format('Y-m-d'),
                    'end_date' => $leave->end_date->format('Y-m-d'),
                    'status' => $leave->status,
                    'meta' => [
                        'leave_id' => $leave->id,
                        'type' => $leave->type,
                        'reason' => $leave->reason,
                        'duration_days' => (int) $leave->duration_days,
                    ],
                ];
            });
    }

    /**
     * Get project events within date range.
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return Collection
     */
    private function getProjectEvents(Carbon $startDate, Carbon $endDate): Collection
    {
        return Project::query()
            ->whereBetween('start_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orWhereBetween('due_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orWhere(function ($query) use ($startDate, $endDate) {
                $query->where('start_date', '<=', $startDate->toDateString())
                    ->where('due_date', '>=', $endDate->toDateString());
            })
            ->where('deleted_at', null)
            ->get()
            ->map(function (Project $project) {
                return [
                    'id' => "project_{$project->id}",
                    'type' => 'project',
                    'title' => $project->name,
                    'start_date' => $project->start_date?->format('Y-m-d'),
                    'end_date' => $project->due_date?->format('Y-m-d'),
                    'status' => $project->status,
                    'meta' => [
                        'project_id' => $project->id,
                        'description' => $project->description,
                        'priority' => $project->priority,
                        'is_valuable' => $project->is_valuable,
                    ],
                ];
            });
    }

    /**
     * Get task events within date range.
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return Collection
     */
    private function getTaskEvents(Carbon $startDate, Carbon $endDate): Collection
    {
        return Task::query()
            ->whereBetween('start_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orWhereBetween('due_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orWhere(function ($query) use ($startDate, $endDate) {
                $query->where('start_date', '<=', $startDate->toDateString())
                    ->where('due_date', '>=', $endDate->toDateString());
            })
            ->where('deleted_at', null)
            ->get()
            ->map(function (Task $task) {
                return [
                    'id' => "task_{$task->id}",
                    'type' => 'task',
                    'title' => $task->title,
                    'start_date' => $task->start_date?->format('Y-m-d'),
                    'end_date' => $task->due_date?->format('Y-m-d'),
                    'status' => $task->status,
                    'meta' => [
                        'task_id' => $task->id,
                        'project_id' => $task->project_id,
                        'description' => $task->description,
                        'priority' => $task->priority,
                        'completed_at' => $task->completed_at?->format('Y-m-d H:i:s'),
                    ],
                ];
            });
    }
}
