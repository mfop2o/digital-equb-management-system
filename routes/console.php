<?php

use App\Services\GroupDecisionService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Close member-governance decisions whose voting window has elapsed and
// record their tallies. The governance page also lazily closes due decisions,
// so this command is a safety net for groups nobody has visited recently.
Artisan::command('equb:close-decisions', function () {
    $closed = app(GroupDecisionService::class)->closeAllDue();

    $this->info("Closed {$closed} due decision(s).");
})->purpose('Close due group governance decisions and record tallies');
