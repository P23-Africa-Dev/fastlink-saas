<?php

namespace App\Providers;

use App\Services\Contracts\GoogleCalendarClient;
use App\Services\GoogleCalendarService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(GoogleCalendarClient::class, GoogleCalendarService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
