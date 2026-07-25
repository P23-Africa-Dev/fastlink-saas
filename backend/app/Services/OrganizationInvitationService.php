<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationUser;
use App\Models\User;
use App\Notifications\OrganizationInvitationNotification;
use App\Notifications\UserAccountCreatedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrganizationInvitationService
{
    public function __construct(
        private readonly OrganizationProvisioner $provisioner,
    ) {}

    public function invite(Organization $organization, string $email, string $role, User $invitedBy): OrganizationInvitation
    {
        $email = Str::lower(trim($email));

        // Cancel prior pending invites for same email/org
        OrganizationInvitation::query()
            ->where('organization_id', $organization->id)
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->delete();

        $invitation = OrganizationInvitation::query()->create([
            'organization_id' => $organization->id,
            'email' => $email,
            'role' => $role,
            'token' => OrganizationInvitation::generateToken(),
            'invited_by' => $invitedBy->id,
            'expires_at' => now()->addDays(7),
        ]);

        $user = User::query()->where('email', $email)->first();
        if ($user) {
            $user->notify(new OrganizationInvitationNotification($invitation));
        } else {
            // Notify via on-demand notification to email
            \Illuminate\Support\Facades\Notification::route('mail', $email)
                ->notify(new OrganizationInvitationNotification($invitation));
        }

        return $invitation;
    }

    /**
     * @param  array{password?: string, name?: string}  $payload
     * @return array{user: User, organization: Organization, temporary_password: string|null}
     */
    public function accept(string $token, array $payload = []): array
    {
        $invitation = OrganizationInvitation::query()
            ->where('token', $token)
            ->first();

        if (! $invitation || $invitation->isAccepted() || $invitation->isExpired()) {
            abort(422, 'This invitation is invalid or has expired.');
        }

        $organization = $invitation->organization;
        if (! $organization || $organization->isSuspended()) {
            abort(422, 'This organization is not available.');
        }

        return DB::transaction(function () use ($invitation, $organization, $payload) {
            $email = $invitation->email;
            $temporaryPassword = null;
            $user = User::withTrashed()->where('email', $email)->first();

            if ($user && $user->trashed()) {
                $user->restore();
            }

            if (! $user) {
                $password = $payload['password'] ?? null;
                if (! $password) {
                    abort(422, 'Password is required to create your account.');
                }
                $user = User::query()->create([
                    'name' => $payload['name'] ?? Str::before($email, '@'),
                    'email' => $email,
                    'password' => $password,
                ]);
            } elseif (! empty($payload['password'])) {
                $user->update(['password' => $payload['password']]);
            }

            if (! empty($payload['name'])) {
                $user->update(['name' => $payload['name']]);
            }

            $this->provisioner->addMembership(
                $organization,
                $user,
                $invitation->role,
                $invitation->invitedBy
            );

            $user->forceFill(['current_organization_id' => $organization->id])->save();

            $invitation->update(['accepted_at' => now()]);

            return [
                'user' => $user->fresh(),
                'organization' => $organization,
                'temporary_password' => $temporaryPassword,
            ];
        });
    }
}
