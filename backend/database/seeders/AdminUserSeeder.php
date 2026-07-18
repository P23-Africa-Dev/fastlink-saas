<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the application's admin account.
     */
    public function run(): void
    {
        $email = Str::lower(trim((string) env('FASTLINK_ADMIN_EMAIL', 'admin@fastlink.dev')));
        $password = (string) env('FASTLINK_ADMIN_PASSWORD', 'TempAdminPass123!');

        /** @var User $user */
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin',
                'email' => $email,
                // Plain password — User model's `hashed` cast hashes once.
                'password' => $password,
                'email_verified_at' => now(),
                'suspended_at' => null,
            ]
        );

        // Critical: without this the account can log in but cannot access
        // any role-gated dashboard routes.
        $user->syncRoles(['admin']);

        $this->command->info("Admin account ready: {$email} (role: admin)");
    }
}
