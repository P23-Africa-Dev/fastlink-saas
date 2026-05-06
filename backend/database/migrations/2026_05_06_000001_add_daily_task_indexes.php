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
        Schema::table('tasks', function (Blueprint $table) {
            $table->index('start_date');
            $table->index('created_by');
            $table->index(['start_date', 'due_date', 'status'], 'tasks_start_due_status_idx');
        });

        Schema::table('task_user', function (Blueprint $table) {
            $table->index(['user_id', 'task_id'], 'task_user_user_task_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_user', function (Blueprint $table) {
            $table->dropIndex('task_user_user_task_idx');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['start_date']);
            $table->dropIndex(['created_by']);
            $table->dropIndex('tasks_start_due_status_idx');
        });
    }
};
