<?php

return [
    'enabled' => (bool) env('GOOGLE_CALENDAR_ENABLED', false),

    'calendar' => [
        'id' => env('GOOGLE_CALENDAR_ID', 'primary'),
        'timezone' => env('GOOGLE_CALENDAR_TIMEZONE', 'Africa/Lagos'),
    ],

    'oauth' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect_uri' => env('GOOGLE_REDIRECT_URI'),
        'success_redirect' => env('GOOGLE_OAUTH_SUCCESS_REDIRECT_URL'),
        'failure_redirect' => env('GOOGLE_OAUTH_FAILURE_REDIRECT_URL'),
        'state_ttl_minutes' => (int) env('GOOGLE_OAUTH_STATE_TTL', 10),
        'scopes' => [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/calendar',
        ],
    ],

    'api' => [
        'timeout' => (int) env('GOOGLE_API_TIMEOUT', 30),
        'max_retries' => (int) env('GOOGLE_API_MAX_RETRIES', 2),
    ],
];
