<?php

namespace App\Services;

use App\Models\SupervisorAccessToken;
use App\Models\SupervisorPasscode;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SupervisorPasscodeService
{
    /**
     * Generate a new passcode for a supervisor.
     *
     * Returns an array with the model and the PLAIN-TEXT passcode.
     * The plain-text value is shown once to the admin and never stored.
     *
     * @return array{passcode: SupervisorPasscode, plain: string}
     */
    public function generate(
        User   $supervisor,
        User   $generatedBy,
        ?Carbon $expiresAt = null,
    ): array {
        // Revoke any existing active passcode for this supervisor before issuing
        // a new one. A supervisor can only have one active passcode at a time so
        // the admin cannot accidentally leave orphaned grants floating.
        $this->revokeAllForSupervisor($supervisor->id);

        $plain = $this->makePlainPasscode();

        $passcode = SupervisorPasscode::create([
            'supervisor_id' => $supervisor->id,
            'passcode_hash' => Hash::make($plain),
            'expires_at'    => $expiresAt,
            'is_active'     => true,
            'generated_by'  => $generatedBy->id,
        ]);

        return ['passcode' => $passcode, 'plain' => $plain];
    }

    /**
     * Verify a plain-text passcode and, if valid, issue a session token and
     * optionally a device token.
     *
     * @return array{session_token: string, device_token: string|null}
     *
     * @throws \RuntimeException when no usable passcode exists or the passcode
     *                           does not match.
     */
    public function verify(
        User   $supervisor,
        string $plain,
        bool   $rememberDevice = false,
    ): array {
        $passcode = SupervisorPasscode::query()
            ->where('supervisor_id', $supervisor->id)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->latest()
            ->first();

        if (! $passcode) {
            throw new \RuntimeException('No active passcode found for this supervisor.', 403);
        }

        if (! Hash::check($plain, $passcode->passcode_hash)) {
            throw new \RuntimeException('The passcode is incorrect.', 403);
        }

        // Issue a short-lived session token (2 hours)
        $sessionToken = $this->issueToken($supervisor, $passcode, 'session', now()->addHours(2));

        // Optionally issue a long-lived device token tied to passcode expiry
        $deviceToken = null;
        if ($rememberDevice) {
            $deviceToken = $this->issueToken($supervisor, $passcode, 'device', $passcode->expires_at);
        }

        return [
            'session_token' => $sessionToken,
            'device_token'  => $deviceToken,
        ];
    }

    /**
     * Validate an access token (session or device) for a given supervisor.
     * Returns the token model if valid, null otherwise.
     */
    public function validateToken(User $supervisor, string $rawToken): ?SupervisorAccessToken
    {
        $hash = hash('sha256', $rawToken);

        $token = SupervisorAccessToken::query()
            ->with('passcode')
            ->where('supervisor_id', $supervisor->id)
            ->where('token_hash', $hash)
            ->first();

        if (! $token) {
            return null;
        }

        if (! $token->isValid()) {
            // Lazy clean-up: delete expired / invalidated tokens on encounter.
            $token->delete();
            return null;
        }

        return $token;
    }

    /**
     * Revoke a specific passcode and cascade-delete its access tokens.
     */
    public function revoke(SupervisorPasscode $passcode): void
    {
        // Deleting the passcode cascades to supervisor_access_tokens via FK.
        $passcode->delete();
    }

    /**
     * Revoke all active passcodes and their tokens for a supervisor.
     */
    public function revokeAllForSupervisor(int $supervisorId): void
    {
        // Cascading FK on supervisor_access_tokens handles token cleanup.
        SupervisorPasscode::query()
            ->where('supervisor_id', $supervisorId)
            ->delete();
    }

    /**
     * List all passcodes for a supervisor (including revoked/expired).
     */
    public function listForSupervisor(int $supervisorId)
    {
        return SupervisorPasscode::query()
            ->with('generatedBy:id,name,email')
            ->where('supervisor_id', $supervisorId)
            ->latest()
            ->get();
    }

    /**
     * List all passcodes across all supervisors.
     */
    public function listAll()
    {
        return SupervisorPasscode::query()
            ->with(['supervisor:id,name,email', 'generatedBy:id,name,email'])
            ->latest()
            ->get();
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Issue a raw access token, store its SHA-256 hash, return the raw value.
     */
    private function issueToken(
        User               $supervisor,
        SupervisorPasscode $passcode,
        string             $type,
        ?Carbon            $expiresAt,
    ): string {
        $raw  = Str::random(40);
        $hash = hash('sha256', $raw);

        SupervisorAccessToken::create([
            'supervisor_id' => $supervisor->id,
            'passcode_id'   => $passcode->id,
            'token_hash'    => $hash,
            'type'          => $type,
            'expires_at'    => $expiresAt,
        ]);

        return $raw;
    }

    /**
     * Generate a human-readable, easy-to-type random passcode.
     * Format: XXXX-XXXX (8 uppercase alpha-numeric characters).
     */
    private function makePlainPasscode(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes O/0, I/1
        $part1 = '';
        $part2 = '';

        for ($i = 0; $i < 4; $i++) {
            $part1 .= $chars[random_int(0, strlen($chars) - 1)];
            $part2 .= $chars[random_int(0, strlen($chars) - 1)];
        }

        return "{$part1}-{$part2}";
    }
}
