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
        Schema::create('spreadsheets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('original_filename');
            $table->string('stored_filename');
            $table->string('mime_type')->nullable();
            $table->string('disk')->default('local');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('extension', 20)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('last_edited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_edited_at')->nullable();
            $table->longText('sheet_data')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['created_by', 'last_edited_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('spreadsheets');
    }
};
