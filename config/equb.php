<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    |
    | Single-currency v1. Money is stored as DECIMAL(15,2) and handled with an
    | integer-santim value object; never float.
    |
    */

    'currency' => env('APP_CURRENCY', 'ETB'),

    'money' => [
        'decimal_places' => 2,
        'scale' => 100,
    ],

    /*
    |--------------------------------------------------------------------------
    | Timezones
    |--------------------------------------------------------------------------
    |
    | Instants are stored in UTC. Business dates are stored as DATE values and
    | displayed in the organization's timezone.
    |
    */

    'storage_timezone' => 'UTC',

    'display_timezone' => env('APP_DISPLAY_TIMEZONE', 'Africa/Addis_Ababa'),

    /*
    |--------------------------------------------------------------------------
    | Security policy
    |--------------------------------------------------------------------------
    |
    | Privileged staff must confirm two-factor authentication before using the
    | application. Set `EQUB_REQUIRE_TWO_FACTOR=false` only for local testing.
    |
    */

    'security' => [
        'require_two_factor' => env('EQUB_REQUIRE_TWO_FACTOR', true),

        'two_factor_roles' => [
            'super-admin',
            'admin',
            'organizer',
            'treasurer',
            'auditor',
        ],

        'password_confirmation_timeout' => env('EQUB_PASSWORD_CONFIRM_TIMEOUT', 10800),
    ],

];
