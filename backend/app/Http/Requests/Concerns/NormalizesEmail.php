<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Support\Str;

/**
 * Lowercases and trims the "email" input before validation so email
 * matching is case-insensitive across login, password reset, and
 * user management (emails are stored lowercase).
 */
trait NormalizesEmail
{
    protected function prepareForValidation(): void
    {
        $email = $this->input('email');

        if (is_string($email)) {
            $this->merge(['email' => Str::lower(trim($email))]);
        }
    }
}
