<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $email = env('FASTLINK_ADMIN_EMAIL', 'admin@fastlink.test');
        $password = env('FASTLINK_ADMIN_PASSWORD', 'password123');

        $admin = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Fastlink Admin',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );

        $admin->syncRoles(['admin']);
    }
}
