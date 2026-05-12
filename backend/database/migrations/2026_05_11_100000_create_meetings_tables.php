<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->foreignId('organizer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('task_id')->nullable()->constrained('tasks')->nullOnDelete();

            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->string('timezone', 64)->default('Africa/Lagos');

            $table->string('status', 30)->default('scheduled');
            $table->string('approval_status', 30)->default('approved');

            $table->string('google_event_id', 255)->nullable()->unique();
            $table->string('google_calendar_id', 255)->nullable();
            $table->string('meet_link', 500)->nullable();
            $table->string('calendar_link', 500)->nullable();
            $table->json('external_guest_emails')->nullable();

            $table->boolean('share_meeting_link')->default(true);
            $table->boolean('share_calendar_link')->default(false);
            $table->boolean('is_recurring')->default(false);
            $table->boolean('auto_record')->default(false);

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['organizer_id', 'start_at']);
            $table->index(['start_at', 'end_at']);
            $table->index('status');
        });

        Schema::create('meeting_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('response_status', 20)->default('pending');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->unique(['meeting_id', 'user_id']);
            $table->index(['user_id', 'response_status']);
        });

        Schema::create('meeting_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->unsignedInteger('minutes_before')->default(15);
            $table->dateTime('scheduled_for');
            $table->timestamp('sent_at')->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['scheduled_for', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_reminders');
        Schema::dropIfExists('meeting_attendees');
        Schema::dropIfExists('meetings');
    }
};
