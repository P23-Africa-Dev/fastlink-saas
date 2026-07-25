<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Models\LeadDrive;
use App\Models\LeadStatus;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use App\Support\OrganizationContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class OrganizationProvisioner
{
    public function __construct(
        private readonly OrganizationContext $context,
    ) {}

    /**
     * Create a new organization with settings, default CRM workflows, and first admin.
     *
     * @param  array{name: string, slug?: string, timezone?: string|null, admin_name?: string, admin_email: string}  $data
     * @return array{organization: Organization, admin: User, temporary_password: string|null}
     */
    public function provision(array $data, User $createdBy): array
    {
        return DB::transaction(function () use ($data, $createdBy) {
            $slug = $data['slug'] ?? Str::slug($data['name']);
            $slug = $this->uniqueSlug($slug);

            $organization = Organization::query()->create([
                'name' => $data['name'],
                'slug' => $slug,
                'status' => 'active',
                'timezone' => $data['timezone'] ?? config('app.timezone', 'UTC'),
                'created_by' => $createdBy->id,
            ]);

            $this->bootstrapOrganization($organization);

            $result = $this->attachAdmin(
                $organization,
                $data['admin_email'],
                $data['admin_name'] ?? Str::before($data['admin_email'], '@'),
                $createdBy
            );

            return [
                'organization' => $organization,
                'admin' => $result['user'],
                'temporary_password' => $result['temporary_password'],
            ];
        });
    }

    public function bootstrapOrganization(Organization $organization): void
    {
        $previous = $this->context->organization();
        $this->context->set($organization);
        $this->context->bypassScope(false);
        setPermissionsTeamId($organization->id);

        try {
            CompanySetting::withoutOrganizationScope()->firstOrCreate(
                ['organization_id' => $organization->id],
                [
                    'company_name' => $organization->name,
                    'opening_time' => '09:00:00',
                    'closing_time' => '18:00:00',
                    'working_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    'timezone' => $organization->timezone ?? config('app.timezone', 'UTC'),
                    'pipeline_privacy' => CompanySetting::defaultPipelinePrivacy(),
                ]
            );

            $this->seedWorkflowDefaults($organization->id);
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        } finally {
            $this->context->set($previous);
            if ($previous) {
                setPermissionsTeamId($previous->id);
            } else {
                setPermissionsTeamId(null);
            }
        }
    }

    public function seedWorkflowDefaults(int $organizationId): void
    {
        $drives = [
            ['name' => 'Inbound', 'slug' => 'inbound', 'description' => 'Inbound leads pipeline', 'color' => '#2563eb', 'position' => 1, 'is_default' => true],
            ['name' => 'Outbound', 'slug' => 'outbound', 'description' => 'Outbound prospecting pipeline', 'color' => '#0891b2', 'position' => 2, 'is_default' => false],
        ];

        foreach ($drives as $drive) {
            LeadDrive::withoutOrganizationScope()->updateOrCreate(
                ['organization_id' => $organizationId, 'slug' => $drive['slug']],
                [...$drive, 'organization_id' => $organizationId]
            );
        }

        $statuses = [
            ['name' => 'New', 'slug' => 'new', 'color' => '#64748b', 'position' => 1, 'is_default' => true, 'is_won' => false, 'is_lost' => false],
            ['name' => 'Contacted', 'slug' => 'contacted', 'color' => '#0284c7', 'position' => 2, 'is_default' => false, 'is_won' => false, 'is_lost' => false],
            ['name' => 'Qualified', 'slug' => 'qualified', 'color' => '#7c3aed', 'position' => 3, 'is_default' => false, 'is_won' => false, 'is_lost' => false],
            ['name' => 'Proposal', 'slug' => 'proposal', 'color' => '#d97706', 'position' => 4, 'is_default' => false, 'is_won' => false, 'is_lost' => false],
            ['name' => 'Won', 'slug' => 'won', 'color' => '#16a34a', 'position' => 5, 'is_default' => false, 'is_won' => true, 'is_lost' => false],
            ['name' => 'Lost', 'slug' => 'lost', 'color' => '#dc2626', 'position' => 6, 'is_default' => false, 'is_won' => false, 'is_lost' => true],
        ];

        foreach ($statuses as $status) {
            LeadStatus::withoutOrganizationScope()->updateOrCreate(
                ['organization_id' => $organizationId, 'slug' => $status['slug']],
                [...$status, 'organization_id' => $organizationId]
            );
        }
    }

    /**
     * @return array{user: User, temporary_password: string|null}
     */
    public function attachAdmin(Organization $organization, string $email, string $name, User $invitedBy): array
    {
        $email = Str::lower(trim($email));
        $temporaryPassword = null;

        $user = User::withTrashed()->where('email', $email)->first();

        if ($user && $user->trashed()) {
            $user->restore();
            $temporaryPassword = Str::password(12, letters: true, numbers: true, symbols: false);
            $user->update([
                'name' => $name,
                'password' => $temporaryPassword,
                'suspended_at' => null,
            ]);
        } elseif (! $user) {
            $temporaryPassword = Str::password(12, letters: true, numbers: true, symbols: false);
            $user = User::query()->create([
                'name' => $name,
                'email' => $email,
                'password' => $temporaryPassword,
            ]);
        }

        $this->addMembership($organization, $user, 'admin', $invitedBy);

        // Always land the first admin in the org they were just provisioned for.
        $user->forceFill(['current_organization_id' => $organization->id])->save();

        return ['user' => $user->fresh(), 'temporary_password' => $temporaryPassword];
    }

    public function addMembership(Organization $organization, User $user, string $role, ?User $invitedBy = null): OrganizationUser
    {
        $membership = OrganizationUser::query()->updateOrCreate(
            [
                'organization_id' => $organization->id,
                'user_id' => $user->id,
            ],
            [
                'status' => 'active',
                'invited_by' => $invitedBy?->id,
                'joined_at' => now(),
            ]
        );

        setPermissionsTeamId($organization->id);
        // Ensure global role templates exist
        Role::findOrCreate($role, 'web');
        $user->syncRoles([$role]);

        return $membership;
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base !== '' ? $base : 'org';
        $candidate = $slug;
        $i = 1;

        while (Organization::query()->where('slug', $candidate)->exists()) {
            $candidate = $slug . '-' . $i;
            $i++;
        }

        return $candidate;
    }
}
