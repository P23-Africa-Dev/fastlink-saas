<?php

namespace App\Services\Crm;

use App\Models\CompanySetting;
use App\Models\LeadDrive;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Central pipeline (lead drive) visibility rules.
 *
 * Runs inside the current organization context (OrganizationScope).
 * Visibility filters apply within a single organization only.
 */
class LeadDriveVisibility
{
    /**
     * @return array{
     *     enabled: bool,
     *     staff_can_create_pipelines: bool,
     *     staff_can_create_open_pipelines: bool,
     *     default_visibility: string,
     *     higher_roles_can_unlock: bool
     * }
     */
    public function privacySettings(): array
    {
        $defaults = [
            'enabled' => true,
            'staff_can_create_pipelines' => true,
            'staff_can_create_open_pipelines' => false,
            'default_visibility' => 'open',
            'higher_roles_can_unlock' => true,
        ];

        $stored = CompanySetting::singleton()->pipeline_privacy;

        if (! is_array($stored)) {
            return $defaults;
        }

        return array_merge($defaults, $stored);
    }

    public function isPrivacyEnabled(): bool
    {
        return (bool) ($this->privacySettings()['enabled'] ?? true);
    }

    public function roleOf(User $user): string
    {
        if ($user->hasRole('admin')) {
            return 'admin';
        }

        if ($user->hasRole('supervisor')) {
            return 'supervisor';
        }

        return 'staff';
    }

    public function canView(User $user, LeadDrive $drive): bool
    {
        if (! $this->isPrivacyEnabled() || ! $drive->is_private) {
            return true;
        }

        if ($drive->created_by !== null && (int) $drive->created_by === (int) $user->id) {
            return true;
        }

        $role = $this->roleOf($user);

        if ($role === 'admin') {
            return true;
        }

        if ($role === 'supervisor' && $drive->privacy_locked_by_role === 'staff') {
            return true;
        }

        return false;
    }

    /**
     * @param  Builder<LeadDrive>  $query
     * @return Builder<LeadDrive>
     */
    public function applyVisibleTo(Builder $query, User $user): Builder
    {
        if (! $this->isPrivacyEnabled()) {
            return $query;
        }

        $role = $this->roleOf($user);

        if ($role === 'admin') {
            return $query;
        }

        return $query->where(function (Builder $q) use ($user, $role) {
            $q->where('is_private', false)
                ->orWhere('created_by', $user->id);

            if ($role === 'supervisor') {
                $q->orWhere(function (Builder $inner) {
                    $inner->where('is_private', true)
                        ->where('privacy_locked_by_role', 'staff');
                });
            }
        });
    }

    public function canCreate(User $user): bool
    {
        $role = $this->roleOf($user);

        if ($role === 'admin' || $role === 'supervisor') {
            return true;
        }

        return (bool) ($this->privacySettings()['staff_can_create_pipelines'] ?? true);
    }

    public function canCreateOpen(User $user): bool
    {
        $role = $this->roleOf($user);

        if ($role === 'admin' || $role === 'supervisor') {
            return true;
        }

        return (bool) ($this->privacySettings()['staff_can_create_open_pipelines'] ?? false);
    }

    public function canManage(User $user, LeadDrive $drive): bool
    {
        if (! $this->canView($user, $drive)) {
            return false;
        }

        $role = $this->roleOf($user);

        if ($role === 'admin') {
            return true;
        }

        if ($drive->created_by !== null && (int) $drive->created_by === (int) $user->id) {
            return true;
        }

        if ($role === 'supervisor') {
            if (! $drive->is_private) {
                return true;
            }

            return $drive->privacy_locked_by_role === 'staff';
        }

        return false;
    }

    public function canUnlock(User $user, LeadDrive $drive): bool
    {
        if ($drive->created_by !== null && (int) $drive->created_by === (int) $user->id) {
            return true;
        }

        if (! ($this->privacySettings()['higher_roles_can_unlock'] ?? true)) {
            return false;
        }

        $role = $this->roleOf($user);

        if ($role === 'admin') {
            return true;
        }

        if ($role === 'supervisor' && $drive->privacy_locked_by_role === 'staff') {
            return true;
        }

        return false;
    }

    /**
     * @return array{is_private: bool, privacy_locked_by_role: string|null}
     */
    public function resolvePrivacyOnCreate(User $user, ?bool $isPrivate): array
    {
        $role = $this->roleOf($user);
        $defaultVisibility = $this->privacySettings()['default_visibility'] ?? 'open';

        if ($role === 'staff') {
            $wantPrivate = $isPrivate ?? true;

            if (! $wantPrivate && ! $this->canCreateOpen($user)) {
                $wantPrivate = true;
            }

            return [
                'is_private' => $wantPrivate,
                'privacy_locked_by_role' => $wantPrivate ? 'staff' : null,
            ];
        }

        $wantPrivate = $isPrivate ?? ($defaultVisibility === 'private');

        return [
            'is_private' => $wantPrivate,
            'privacy_locked_by_role' => $wantPrivate ? $role : null,
        ];
    }

    /**
     * @return array{is_private?: bool, privacy_locked_by_role?: string|null}
     */
    public function resolvePrivacyOnUpdate(User $user, LeadDrive $drive, ?bool $isPrivate): array
    {
        if ($isPrivate === null) {
            return [];
        }

        if (! $isPrivate) {
            if ($drive->is_private && ! $this->canUnlock($user, $drive)) {
                abort(403, 'You are not allowed to make this pipeline open.');
            }

            return [
                'is_private' => false,
                'privacy_locked_by_role' => null,
            ];
        }

        return [
            'is_private' => true,
            'privacy_locked_by_role' => $this->roleOf($user),
        ];
    }

    /**
     * @return array{can_edit: bool, can_delete: bool}
     */
    public function abilityFlags(User $user, LeadDrive $drive): array
    {
        $canManage = $this->canManage($user, $drive);

        return [
            'can_edit' => $canManage,
            'can_delete' => $canManage,
        ];
    }
}
