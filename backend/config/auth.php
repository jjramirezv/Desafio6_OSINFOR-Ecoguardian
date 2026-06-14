<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | Authentication is not implemented in this task (S1-BE-01: minimal API).
    | Guards, providers and password brokers are intentionally left empty and
    | do not reference any Eloquent model. They will be configured in a later
    | task once users/authentication are in scope.
    |
    */

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'web'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    'guards' => [
        //
    ],

    'providers' => [
        //
    ],

    'passwords' => [
        //
    ],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];
