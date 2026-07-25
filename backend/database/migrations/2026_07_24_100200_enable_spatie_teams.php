<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Enable Spatie "teams" (team_id = organization_id).
 *
 * MySQL/MariaDB require foreign keys to be dropped before the composite
 * primary key can be rebuilt — otherwise alter table fails with errno 150.
 * This migration is also safe to re-run after a partial failure.
 */
return new class extends Migration
{
    public function up(): void
    {
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
        $pivotPermission = 'permission_id';
        $pivotRole = 'role_id';
        $driver = DB::getDriverName();

        Schema::disableForeignKeyConstraints();

        try {
            if (! Schema::hasColumn($tableNames['roles'], $columnNames['team_foreign_key'])) {
                Schema::table($tableNames['roles'], function (Blueprint $table) use ($columnNames) {
                    $table->unsignedBigInteger($columnNames['team_foreign_key'])->nullable()->after('id');
                    $table->index($columnNames['team_foreign_key'], 'roles_team_foreign_key_index');

                    $table->dropUnique(['name', 'guard_name']);
                    $table->unique(
                        [$columnNames['team_foreign_key'], 'name', 'guard_name'],
                        'roles_team_name_guard_unique'
                    );
                });
            }

            if (! Schema::hasColumn($tableNames['model_has_permissions'], $columnNames['team_foreign_key'])) {
                Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) use ($tableNames, $columnNames, $pivotPermission, $driver) {
                    $table->unsignedBigInteger($columnNames['team_foreign_key'])->default(0);
                    $table->index($columnNames['team_foreign_key'], 'model_has_permissions_team_foreign_key_index');

                    if ($driver !== 'sqlite') {
                        $table->dropForeign([$pivotPermission]);
                    }

                    $table->dropPrimary();

                    $table->primary(
                        [$columnNames['team_foreign_key'], $pivotPermission, $columnNames['model_morph_key'], 'model_type'],
                        'model_has_permissions_permission_model_type_primary'
                    );

                    if ($driver !== 'sqlite') {
                        $table->foreign($pivotPermission)
                            ->references('id')
                            ->on($tableNames['permissions'])
                            ->cascadeOnDelete();
                    }
                });
            }

            if (! Schema::hasColumn($tableNames['model_has_roles'], $columnNames['team_foreign_key'])) {
                Schema::table($tableNames['model_has_roles'], function (Blueprint $table) use ($tableNames, $columnNames, $pivotRole, $driver) {
                    $table->unsignedBigInteger($columnNames['team_foreign_key'])->default(0);
                    $table->index($columnNames['team_foreign_key'], 'model_has_roles_team_foreign_key_index');

                    if ($driver !== 'sqlite') {
                        $table->dropForeign([$pivotRole]);
                    }

                    $table->dropPrimary();

                    $table->primary(
                        [$columnNames['team_foreign_key'], $pivotRole, $columnNames['model_morph_key'], 'model_type'],
                        'model_has_roles_role_model_type_primary'
                    );

                    if ($driver !== 'sqlite') {
                        $table->foreign($pivotRole)
                            ->references('id')
                            ->on($tableNames['roles'])
                            ->cascadeOnDelete();
                    }
                });
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    public function down(): void
    {
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
        $pivotPermission = 'permission_id';
        $pivotRole = 'role_id';
        $driver = DB::getDriverName();

        Schema::disableForeignKeyConstraints();

        try {
            if (Schema::hasColumn($tableNames['model_has_roles'], $columnNames['team_foreign_key'])) {
                Schema::table($tableNames['model_has_roles'], function (Blueprint $table) use ($tableNames, $columnNames, $pivotRole, $driver) {
                    if ($driver !== 'sqlite') {
                        $table->dropForeign([$pivotRole]);
                    }
                    $table->dropPrimary();
                    $table->dropIndex('model_has_roles_team_foreign_key_index');
                    $table->dropColumn($columnNames['team_foreign_key']);
                    $table->primary(
                        [$pivotRole, $columnNames['model_morph_key'], 'model_type'],
                        'model_has_roles_role_model_type_primary'
                    );
                    if ($driver !== 'sqlite') {
                        $table->foreign($pivotRole)
                            ->references('id')
                            ->on($tableNames['roles'])
                            ->cascadeOnDelete();
                    }
                });
            }

            if (Schema::hasColumn($tableNames['model_has_permissions'], $columnNames['team_foreign_key'])) {
                Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) use ($tableNames, $columnNames, $pivotPermission, $driver) {
                    if ($driver !== 'sqlite') {
                        $table->dropForeign([$pivotPermission]);
                    }
                    $table->dropPrimary();
                    $table->dropIndex('model_has_permissions_team_foreign_key_index');
                    $table->dropColumn($columnNames['team_foreign_key']);
                    $table->primary(
                        [$pivotPermission, $columnNames['model_morph_key'], 'model_type'],
                        'model_has_permissions_permission_model_type_primary'
                    );
                    if ($driver !== 'sqlite') {
                        $table->foreign($pivotPermission)
                            ->references('id')
                            ->on($tableNames['permissions'])
                            ->cascadeOnDelete();
                    }
                });
            }

            if (Schema::hasColumn($tableNames['roles'], $columnNames['team_foreign_key'])) {
                Schema::table($tableNames['roles'], function (Blueprint $table) use ($columnNames) {
                    $table->dropUnique('roles_team_name_guard_unique');
                    $table->dropIndex('roles_team_foreign_key_index');
                    $table->dropColumn($columnNames['team_foreign_key']);
                    $table->unique(['name', 'guard_name']);
                });
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }
};
