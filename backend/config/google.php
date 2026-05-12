<?php

return [
    'enabled' => (bool) env('GOOGLE_CALENDAR_ENABLED', false),

    'service_account' => [
        'key_path' => env('GOOGLE_SERVICE_ACCOUNT_KEY_PATH', storage_path('app/google-service-account.json')),
    ],

    'calendar' => [
        'id' => env('GOOGLE_CALENDAR_ID', 'primary'),
        'timezone' => env('GOOGLE_CALENDAR_TIMEZONE', 'Africa/Lagos'),
    ],

    'api' => [
        'timeout' => (int) env('GOOGLE_API_TIMEOUT', 30),
        'max_retries' => (int) env('GOOGLE_API_MAX_RETRIES', 2),
    ],
];
