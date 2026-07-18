<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SetUserPasswordCommand extends Command
{
    protected $signature = 'user:set-password
                            {email : The user email address}
                            {password? : New password (min 8 chars). Omit to be prompted securely.}
                            {--restore : Restore the account if it was soft-deleted}
                            {--unsuspend : Clear suspended_at so the user can log in}';

    protected $description = 'Set a user\'s password (and optionally restore/unsuspend) so they can log in again.';

    public function handle(): int
    {
        $email = Str::lower(trim((string) $this->argument('email')));
        $password = $this->argument('password');

        /** @var User|null $user */
        $user = User::withTrashed()
            ->whereRaw('LOWER(TRIM(email)) = ?', [$email])
            ->first();

        if (! $user) {
            $this->error("No user found with email: {$email}");

            return self::FAILURE;
        }

        if ($user->trashed()) {
            if ($this->option('restore')) {
                $user->restore();
                $this->info("Restored soft-deleted account #{$user->id}.");
            } else {
                $this->error("Account #{$user->id} is soft-deleted. Re-run with --restore to reactivate it.");

                return self::FAILURE;
            }
        }

        if ($user->isSuspended()) {
            if ($this->option('unsuspend')) {
                $user->forceFill(['suspended_at' => null])->save();
                $this->info('Cleared suspension.');
            } else {
                $this->warn('Account is currently suspended. Pass --unsuspend to clear it.');
            }
        }

        if (! is_string($password) || $password === '') {
            $password = $this->secret('New password (min 8 characters)');
        }

        if (! is_string($password) || strlen($password) < 8) {
            $this->error('Password must be at least 8 characters.');

            return self::FAILURE;
        }

        // Plain assign — `hashed` cast hashes once.
        $user->forceFill([
            'email' => $email,
            'password' => $password,
        ])->save();

        $user->tokens()->delete();

        $roles = $user->getRoleNames()->implode(', ') ?: '(none)';
        $this->info("Password updated for {$email} (id={$user->id}, roles={$roles}).");
        $this->line('All existing API tokens for this user were revoked.');

        if ($roles === '(none)') {
            $this->warn('This user has no roles. They can log in but will be blocked from role-gated routes.');
            $this->line('Fix with: php artisan tinker then  User::find('.$user->id.')->syncRoles(["admin"]);');
        }

        return self::SUCCESS;
    }
}
