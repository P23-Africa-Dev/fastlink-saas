<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Normalize stored user emails to trimmed lowercase.
     *
     * Done in PHP (not SQL LOWER/TRIM comparisons) so it works correctly
     * on MySQL with case-insensitive collations AND on SQLite.
     * Rows that would collide after normalization are left alone.
     */
    public function up(): void
    {
        $users = DB::table('users')->select('id', 'email')->get();

        foreach ($users as $user) {
            $normalized = mb_strtolower(trim((string) $user->email));

            if ($normalized === (string) $user->email || $normalized === '') {
                continue;
            }

            $conflict = DB::table('users')
                ->where('id', '!=', $user->id)
                ->whereRaw('LOWER(TRIM(email)) = ?', [$normalized])
                ->exists();

            if ($conflict) {
                continue;
            }

            DB::table('users')->where('id', $user->id)->update(['email' => $normalized]);
        }
    }

    public function down(): void
    {
        // Original casing / whitespace is not preserved; nothing to restore.
    }
};
