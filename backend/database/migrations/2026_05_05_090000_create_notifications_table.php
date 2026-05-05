<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 120);
            $table->string('title', 200);
            $table->text('message');
            $table->json('metadata')->nullable();
            $table->boolean('is_read')->default(false);
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            // Optional idempotency key to suppress duplicates from repeated actions.
            $table->string('dedupe_key', 191)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'is_read']);
            $table->index(['user_id', 'created_at']);
            $table->unique(['user_id', 'dedupe_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
