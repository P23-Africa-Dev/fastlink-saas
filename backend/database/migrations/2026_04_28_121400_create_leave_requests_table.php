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
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type');
            $table->text('reason')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('duration_days', 5, 2);
            $table->string('status')->default('pending');
            $table->text('supervisor_note')->nullable();
            $table->date('modified_start_date')->nullable();
            $table->date('modified_end_date')->nullable();
            $table->decimal('modified_duration_days', 5, 2)->nullable();
            $table->text('sender_response_note')->nullable();
            $table->timestamp('sender_responded_at')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->text('decision_note')->nullable();
            $table->timestamps();

            $table->index(['status', 'start_date']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
