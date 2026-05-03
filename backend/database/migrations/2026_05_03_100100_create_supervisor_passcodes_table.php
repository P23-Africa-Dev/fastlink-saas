<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_passcodes', function (Blueprint $table) {
            $table->id();
            // The supervisor this passcode grants access for
            $table->foreignId('supervisor_id')
                ->constrained('users')
                ->cascadeOnDelete();
            // bcrypt hash of the plain-text passcode shown to admin once
            $table->string('passcode_hash');
            // NULL means the passcode never expires
            $table->timestamp('expires_at')->nullable();
            // Whether this passcode is still usable (admin can revoke early)
            $table->boolean('is_active')->default(true);
            // Which admin generated this passcode
            $table->foreignId('generated_by')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->timestamps();

            $table->index(['supervisor_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_passcodes');
    }
};
