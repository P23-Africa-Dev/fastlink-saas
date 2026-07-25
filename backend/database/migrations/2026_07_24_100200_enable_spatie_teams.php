<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $teams = true;
        $columnNames = [
            'team_foreign_key' => 'team_id',
            'model_morph_key' => 'model_id',
        ];
        $tableNames = [
            'roles' => 'roles',
            'permissions' => 'permissions',
            'model_has_permissions' => 'model_has_permissions',
            'model_has_roles' => 'model_has_roles',
        ];

        Schema::table($tableNames['roles'], function (Blueprint $table) use ($columnNames) {
            $table->unsignedBigInteger($columnNames['team_foreign_key'])->nullable()->after('id');
            $table->index($columnNames['team_foreign_key'], 'roles_team_foreign_key_index');

            $table->dropUnique(['name', 'guard_name']);
            $table->unique([$columnNames['team_foreign_key'], 'name', 'guard_name'], 'roles_team_name_guard_unique');
        });

        Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) use ($tableNames, $columnNames) {
            $table->unsignedBigInteger($columnNames['team_foreign_key'])->default(0);
            $table->index($columnNames['team_foreign_key'], 'model_has_permissions_team_foreign_key_index');

            if (DB::getDriverName() !== 'sqlite') {
                $table->dropPrimary('model_has_permissions_permission_model_type_primary');
            }

            $table->primary(
                [$columnNames['team_foreign_key'], 'permission_id', $columnNames['model_morph_key'], 'model_type'],
                'model_has_permissions_permission_model_type_primary'
            );
        });

        Schema::table($tableNames['model_has_roles'], function (Blueprint $table) use ($columnNames) {
            $table->unsignedBigInteger($columnNames['team_foreign_key'])->default(0);
            $table->index($columnNames['team_foreign_key'], 'model_has_roles_team_foreign_key_index');

            if (DB::getDriverName() !== 'sqlite') {
                $table->dropPrimary('model_has_roles_role_model_type_primary');
            }

            $table->primary(
                [$columnNames['team_foreign_key'], 'role_id', $columnNames['model_morph_key'], 'model_type'],
                'model_has_roles_role_model_type_primary'
            );
        });
    }

    public function down(): void
    {
        $columnNames = ['team_foreign_key' => 'team_id', 'model_morph_key' => 'model_id'];

        Schema::table('model_has_roles', function (Blueprint $table) use ($columnNames) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropPrimary('model_has_roles_role_model_type_primary');
            }
            $table->dropIndex('model_has_roles_team_foreign_key_index');
            $table->dropColumn($columnNames['team_foreign_key']);
            $table->primary(
                ['role_id', $columnNames['model_morph_key'], 'model_type'],
                'model_has_roles_role_model_type_primary'
            );
        });

        Schema::table('model_has_permissions', function (Blueprint $table) use ($columnNames) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropPrimary('model_has_permissions_permission_model_type_primary');
            }
            $table->dropIndex('model_has_permissions_team_foreign_key_index');
            $table->dropColumn($columnNames['team_foreign_key']);
            $table->primary(
                ['permission_id', $columnNames['model_morph_key'], 'model_type'],
                'model_has_permissions_permission_model_type_primary'
            );
        });

        Schema::table('roles', function (Blueprint $table) use ($columnNames) {
            $table->dropUnique('roles_team_name_guard_unique');
            $table->dropIndex('roles_team_foreign_key_index');
            $table->dropColumn($columnNames['team_foreign_key']);
            $table->unique(['name', 'guard_name']);
        });
    }
};
