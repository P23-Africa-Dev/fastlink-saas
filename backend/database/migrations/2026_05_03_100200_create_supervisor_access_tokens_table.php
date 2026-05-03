<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Supervisor access tokens are short-lived stateless tokens issued after a
     * supervisor successfully verifies their passcode. Two types exist:
     *
     *  - session : expires in 2 hours; used for a single visit to company setup
     *  - device  : long-lived; expires when the passcode expires (or never);
     *              stored by the frontend to skip passcode entry on return visits
     *
     * When a passcode is revoked or expires all its associated tokens become
     * invalid — the query always joins on passcode validity.
     */
    public function up(): void
    {
        Schema::create('supervisor_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supervisor_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('passcode_id')
                ->constrained('supervisor_passcodes')
                ->cascadeOnDelete();
            // SHA-256 hex of the random 40-byte token the client stores
            $table->string('token_hash', 64)->unique();
            $table->enum('type', ['session', 'device'])->default('session');
            // NULL = never expires (device tokens for never-expiring passcodes)
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['supervisor_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_access_tokens');
    }
};
