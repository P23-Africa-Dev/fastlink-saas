<?php

namespace Tests\Feature\Api;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['role' => 'staff']);
    }

    /** @test */
    public function can_fetch_calendar_events_for_date_range(): void
    {
        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Create various events
        Attendance::create([
            'user_id' => $this->user->id,
            'date' => $startDate->copy()->addDays(2),
            'signed_in_at' => $startDate->copy()->addDays(2)->setHour(9),
            'signed_out_at' => $startDate->copy()->addDays(2)->setHour(17),
        ]);

        LeaveRequest::create([
            'user_id' => $this->user->id,
            'supervisor_id' => User::factory()->create(['role' => 'supervisor'])->id,
            'type' => 'annual',
            'start_date' => $startDate->copy()->addDays(5),
            'end_date' => $startDate->copy()->addDays(7),
            'duration_days' => 3,
            'status' => 'approved',
        ]);

        Project::create([
            'name' => 'Test Project',
            'status' => 'in_progress',
            'start_date' => $startDate->copy()->addDays(1),
            'due_date' => $startDate->copy()->addDays(10),
            'created_by' => $this->user->id,
        ]);

        Task::create([
            'title' => 'Test Task',
            'status' => 'todo',
            'start_date' => $startDate->copy()->addDays(3),
            'due_date' => $startDate->copy()->addDays(6),
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->getJson(
            '/api/v1/calendar/events',
            [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ]
        );

        $response->assertOk();
        $data = $response->json('data');

        // Should have 4 events
        $this->assertCount(4, $data);

        // Verify event types are present
        $types = collect($data)->pluck('type');
        $this->assertTrue($types->contains('attendance'));
        $this->assertTrue($types->contains('leave'));
        $this->assertTrue($types->contains('project'));
        $this->assertTrue($types->contains('task'));

        // Verify event structure
        foreach ($data as $event) {
            $this->assertArrayHasKey('id', $event);
            $this->assertArrayHasKey('type', $event);
            $this->assertArrayHasKey('title', $event);
            $this->assertArrayHasKey('start_date', $event);
            $this->assertArrayHasKey('end_date', $event);
            $this->assertArrayHasKey('status', $event);
            $this->assertArrayHasKey('meta', $event);
        }
    }

    /** @test */
    public function can_filter_calendar_events_by_type(): void
    {
        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        Attendance::create([
            'user_id' => $this->user->id,
            'date' => $startDate->copy()->addDays(2),
            'signed_in_at' => $startDate->copy()->addDays(2)->setHour(9),
        ]);

        Task::create([
            'title' => 'Test Task',
            'status' => 'todo',
            'start_date' => $startDate->copy()->addDays(3),
            'due_date' => $startDate->copy()->addDays(6),
            'created_by' => $this->user->id,
        ]);

        // Filter by attendance type
        $response = $this->actingAs($this->user)->getJson(
            '/api/v1/calendar/events',
            [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'type' => 'attendance',
            ]
        );

        $response->assertOk();
        $data = $response->json('data');

        // Should only have attendance events
        $this->assertCount(1, $data);
        $this->assertEquals('attendance', $data[0]['type']);
    }

    /** @test */
    public function can_handle_multi_day_leave_spans(): void
    {
        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        $leave = LeaveRequest::create([
            'user_id' => $this->user->id,
            'supervisor_id' => User::factory()->create(['role' => 'supervisor'])->id,
            'type' => 'annual',
            'start_date' => $startDate->copy()->addDays(5),
            'end_date' => $startDate->copy()->addDays(12),
            'duration_days' => 8,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->user)->getJson(
            '/api/v1/calendar/events',
            [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'type' => 'leave',
            ]
        );

        $response->assertOk();
        $data = $response->json('data');

        $this->assertCount(1, $data);
        $leaveEvent = $data[0];

        // Verify leave event spans multiple days
        $leaveStart = Carbon::createFromFormat('Y-m-d', $leaveEvent['start_date']);
        $leaveEnd = Carbon::createFromFormat('Y-m-d', $leaveEvent['end_date']);
        $this->assertTrue($leaveEnd->gt($leaveStart));
        $this->assertEquals('approved', $leaveEvent['status']);
        $this->assertEquals($leave->id, $leaveEvent['meta']['leave_id']);
    }

    /** @test */
    public function can_create_task_from_calendar(): void
    {
        $supervisor = User::factory()->create(['role' => 'supervisor']);

        $response = $this->actingAs($supervisor)->postJson(
            '/api/v1/calendar/tasks',
            [
                'title' => 'Follow up leads',
                'start_date' => '2026-06-01',
                'due_date' => '2026-06-03',
                'description' => 'Make follow-up calls',
                'priority' => 'high',
                'assigned_to' => $this->user->id,
            ]
        );

        $response->assertCreated();
        $data = $response->json('data');

        // Verify task was created with correct data
        $this->assertEquals('Follow up leads', $data['title']);
        $this->assertEquals('2026-06-01', $data['start_date']);
        $this->assertEquals('2026-06-03', $data['due_date']);
        $this->assertEquals('Make follow-up calls', $data['description']);
        $this->assertEquals('high', $data['priority']);
        $this->assertEquals('todo', $data['status']);

        // Verify task exists in database
        $this->assertDatabaseHas('tasks', [
            'title' => 'Follow up leads',
            'start_date' => '2026-06-01',
            'due_date' => '2026-06-03',
        ]);
    }

    /** @test */
    public function can_create_task_with_project_assignment(): void
    {
        $supervisor = User::factory()->create(['role' => 'supervisor']);
        $project = Project::create([
            'name' => 'Test Project',
            'status' => 'in_progress',
            'created_by' => $supervisor->id,
        ]);

        $response = $this->actingAs($supervisor)->postJson(
            '/api/v1/calendar/tasks',
            [
                'title' => 'Task for project',
                'start_date' => '2026-06-01',
                'due_date' => '2026-06-05',
                'description' => 'Task linked to project',
                'project_id' => $project->id,
                'assigned_to' => $this->user->id,
            ]
        );

        $response->assertCreated();
        $data = $response->json('data');

        // Verify task is linked to project
        $this->assertEquals($project->id, $data['project_id']);
        $this->assertEquals('Test Project', $data['project']['name']);
    }

    /** @test */
    public function cannot_create_task_without_required_fields(): void
    {
        $supervisor = User::factory()->create(['role' => 'supervisor']);

        $response = $this->actingAs($supervisor)->postJson(
            '/api/v1/calendar/tasks',
            [
                'start_date' => '2026-06-01',
                // missing title and due_date
            ]
        );

        $response->assertUnprocessable();
        $errors = $response->json('errors');

        $this->assertArrayHasKey('title', $errors);
        $this->assertArrayHasKey('due_date', $errors);
    }

    /** @test */
    public function cannot_create_task_with_due_date_before_start_date(): void
    {
        $supervisor = User::factory()->create(['role' => 'supervisor']);

        $response = $this->actingAs($supervisor)->postJson(
            '/api/v1/calendar/tasks',
            [
                'title' => 'Invalid task',
                'start_date' => '2026-06-05',
                'due_date' => '2026-06-01', // before start_date
            ]
        );

        $response->assertUnprocessable();
        $errors = $response->json('errors');

        $this->assertArrayHasKey('due_date', $errors);
    }

    /** @test */
    public function cannot_fetch_events_without_required_dates(): void
    {
        $response = $this->actingAs($this->user)->getJson(
            '/api/v1/calendar/events',
            [] // missing start_date and end_date
        );

        $response->assertUnprocessable();
        $errors = $response->json('errors');

        $this->assertArrayHasKey('start_date', $errors);
        $this->assertArrayHasKey('end_date', $errors);
    }

    /** @test */
    public function handles_overlapping_events_correctly(): void
    {
        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Create overlapping events
        $projectStart = $startDate->copy()->addDays(5);
        $projectEnd = $projectStart->copy()->addDays(10);

        Project::create([
            'name' => 'Project A',
            'status' => 'in_progress',
            'start_date' => $projectStart,
            'due_date' => $projectEnd,
            'created_by' => $this->user->id,
        ]);

        Task::create([
            'title' => 'Task within project',
            'status' => 'todo',
            'start_date' => $projectStart->copy()->addDays(2),
            'due_date' => $projectStart->copy()->addDays(5),
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->getJson(
            '/api/v1/calendar/events',
            [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ]
        );

        $response->assertOk();
        $data = $response->json('data');

        // Should have both events
        $this->assertCount(2, $data);
    }

    /** @test */
    public function handles_large_datasets_efficiently(): void
    {
        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Create multiple events (simulating realistic load)
        for ($i = 0; $i < 10; $i++) {
            Attendance::create([
                'user_id' => $this->user->id,
                'date' => $startDate->copy()->addDays($i),
                'signed_in_at' => $startDate->copy()->addDays($i)->setHour(9),
            ]);

            Task::create([
                'title' => "Task $i",
                'status' => 'todo',
                'start_date' => $startDate->copy()->addDays($i),
                'due_date' => $startDate->copy()->addDays($i + 2),
                'created_by' => $this->user->id,
            ]);
        }

        $response = $this->actingAs($this->user)->getJson(
            '/api/v1/calendar/events',
            [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ]
        );

        $response->assertOk();
        $data = $response->json('data');

        // Should have 20 events (10 attendance + 10 tasks)
        $this->assertCount(20, $data);
    }

    /** @test */
    public function staff_cannot_create_tasks_from_calendar(): void
    {
        $response = $this->actingAs($this->user)->postJson(
            '/api/v1/calendar/tasks',
            [
                'title' => 'Test task',
                'start_date' => '2026-06-01',
                'due_date' => '2026-06-05',
            ]
        );

        // Staff role should be forbidden
        $response->assertForbidden();
    }

    /** @test */
    public function can_fetch_attendance_events_with_clock_times(): void
    {
        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        $attendance = Attendance::create([
            'user_id' => $this->user->id,
            'date' => $startDate->copy()->addDays(2),
            'signed_in_at' => $startDate->copy()->addDays(2)->setHour(9)->setMinute(30),
            'signed_out_at' => $startDate->copy()->addDays(2)->setHour(17)->setMinute(45),
        ]);

        $response = $this->actingAs($this->user)->getJson(
            '/api/v1/calendar/events',
            [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'type' => 'attendance',
            ]
        );

        $response->assertOk();
        $data = $response->json('data');

        $this->assertCount(1, $data);
        $event = $data[0];

        // Verify times are included
        $this->assertEquals('09:30:00', $event['meta']['signed_in_at']);
        $this->assertEquals('17:45:00', $event['meta']['signed_out_at']);
    }

    /** @test */
    public function events_sorted_by_start_date(): void
    {
        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Create events in non-sequential order
        Task::create([
            'title' => 'Task 3',
            'status' => 'todo',
            'start_date' => $startDate->copy()->addDays(10),
            'due_date' => $startDate->copy()->addDays(12),
            'created_by' => $this->user->id,
        ]);

        Task::create([
            'title' => 'Task 1',
            'status' => 'todo',
            'start_date' => $startDate->copy()->addDays(2),
            'due_date' => $startDate->copy()->addDays(4),
            'created_by' => $this->user->id,
        ]);

        Task::create([
            'title' => 'Task 2',
            'status' => 'todo',
            'start_date' => $startDate->copy()->addDays(5),
            'due_date' => $startDate->copy()->addDays(7),
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->getJson(
            '/api/v1/calendar/events',
            [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ]
        );

        $response->assertOk();
        $data = $response->json('data');

        // Verify events are sorted by start_date
        $this->assertEquals('Task 1', $data[0]['title']);
        $this->assertEquals('Task 2', $data[1]['title']);
        $this->assertEquals('Task 3', $data[2]['title']);
    }
}
