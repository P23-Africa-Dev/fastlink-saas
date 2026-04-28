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
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('company')->nullable();
            $table->unsignedInteger('employee_count')->nullable();
            $table->unsignedSmallInteger('year_founded')->nullable();
            $table->string('industry')->nullable();
            $table->string('job_title')->nullable();
            $table->string('website')->nullable();
            $table->string('company_linkedin_profile')->nullable();
            $table->string('ceo_linkedin_profile')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->string('status')->default('new');
            $table->string('source')->nullable();
            $table->string('priority')->default('medium');
            $table->decimal('estimated_value', 14, 2)->nullable();
            $table->char('currency', 3)->default('USD');
            $table->json('interested_services')->nullable();
            $table->text('requirements')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('drive_id')->nullable()->constrained('lead_drives')->nullOnDelete();
            $table->foreignId('status_id')->nullable()->constrained('lead_statuses')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_contacted_at')->nullable();
            $table->timestamp('next_follow_up')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->string('lost_reason')->nullable();
            $table->string('source_type')->nullable();
            $table->string('source_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'priority']);
            $table->index(['company', 'email']);
            $table->index('next_follow_up');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
