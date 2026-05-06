<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lead_followups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->json('content')->nullable();
            $table->json('form_schema')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'created_at']);
            $table->index('created_by');
        });

        Schema::create('lead_followup_update_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('followup_id')->constrained('lead_followups')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('original_data')->nullable();
            $table->json('proposed_changes');
            $table->string('status')->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['followup_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index('requested_by');
            $table->index('approver_id');
        });

        Schema::create('lead_followup_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('followup_id')->constrained('lead_followups')->cascadeOnDelete();
            $table->string('action');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['followup_id', 'created_at']);
            $table->index('action');
        });

        Schema::create('lead_followup_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('followup_id')->constrained('lead_followups')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('disk')->default('local');
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();

            $table->index(['followup_id', 'created_at']);
            $table->index('uploaded_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_followup_attachments');
        Schema::dropIfExists('lead_followup_activities');
        Schema::dropIfExists('lead_followup_update_requests');
        Schema::dropIfExists('lead_followups');
    }
};
