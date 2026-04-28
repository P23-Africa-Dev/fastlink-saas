<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $permissions = [
            'dashboard.view',
            'users.manage',
            'crm.manage',
            'projects.manage',
            'tasks.manage',
            'attendance.manage',
            'leave.manage',
            'spreadsheets.manage',
        ];

        foreach ($permissions as $name) {
            Permission::query()->firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $admin = Role::query()->firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $supervisor = Role::query()->firstOrCreate(['name' => 'supervisor', 'guard_name' => 'web']);
        $staff = Role::query()->firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);

        $admin->syncPermissions(Permission::all());
        $supervisor->syncPermissions([
            'dashboard.view',
            'crm.manage',
            'projects.manage',
            'tasks.manage',
            'attendance.manage',
            'leave.manage',
            'spreadsheets.manage',
        ]);
        $staff->syncPermissions([
            'dashboard.view',
            'crm.manage',
            'tasks.manage',
            'attendance.manage',
            'leave.manage',
            'spreadsheets.manage',
        ]);
    }
}
