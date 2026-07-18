<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Normalize all stored user emails to lowercase so lookups
     * (login, password reset) match regardless of typed case.
     * Rows whose lowercased email would collide with another row
     * (case-only duplicates) are left untouched to preserve the
     * unique constraint; those must be resolved manually.
     */
    public function up(): void
    {
        $users = DB::table('users')
            ->select('id', 'email')
            ->whereRaw('email != LOWER(email)')
            ->get();

        foreach ($users as $user) {
            $lower = mb_strtolower($user->email);

            $conflict = DB::table('users')
                ->whereRaw('LOWER(email) = ?', [$lower])
                ->where('id', '!=', $user->id)
                ->exists();

            if ($conflict) {
                continue;
            }

            DB::table('users')->where('id', $user->id)->update(['email' => $lower]);
        }
    }

    public function down(): void
    {
        // Original casing is not preserved; nothing to restore.
    }
};
