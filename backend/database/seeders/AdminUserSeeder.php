<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\OrganizationUser;
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
                'password' => $password,
                'email_verified_at' => now(),
                'suspended_at' => null,
                'is_super_admin' => true,
            ]
        );

        $org = Organization::query()->where('slug', 'fastlink')->first()
            ?? Organization::query()->first();

        if ($org) {
            $user->forceFill([
                'is_super_admin' => true,
                'current_organization_id' => $org->id,
            ])->save();

            OrganizationUser::query()->updateOrCreate(
                ['organization_id' => $org->id, 'user_id' => $user->id],
                ['status' => 'active', 'joined_at' => now()]
            );

            setPermissionsTeamId($org->id);
        }

        $user->syncRoles(['admin']);

        $this->command->info("Admin account ready: {$email} (role: admin, super_admin: yes)");
    }
}
