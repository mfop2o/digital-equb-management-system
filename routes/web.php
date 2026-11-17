<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ContributionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepositRoundController;
use App\Http\Controllers\EqubGroupController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\GroupDiscoveryController;
use App\Http\Controllers\GroupGovernanceController;
use App\Http\Controllers\LotteryController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MembershipRequestController;
use App\Http\Controllers\PayoutController;
use App\Http\Controllers\PenaltyController;
use App\Http\Controllers\WithdrawalController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect('/dashboard');
    }

    return Inertia::render('welcome');
})->name('home');

// Public group discovery (accessible to both guests and authenticated members)
Route::get('explore', [GroupDiscoveryController::class, 'index'])->name('explore.index');
Route::get('explore/{group}', [GroupDiscoveryController::class, 'show'])->name('explore.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Member Management (Module 3)
    Route::resource('members', MemberController::class);
    Route::post('members/{member}/verify', [MemberController::class, 'verify'])
        ->middleware('permission:members.verify')
        ->name('members.verify');

    // Equb Group Management & Configuration (Modules 4, 5, 6)
    Route::resource('groups', EqubGroupController::class);
    Route::post('groups/{group}/rules', [EqubGroupController::class, 'configureRules'])
        ->middleware('group.permission:rules.configure')
        ->name('groups.rules.update');
    Route::post('groups/{group}/enroll', [EqubGroupController::class, 'enroll'])
        ->middleware('group.permission:memberships.approve')
        ->name('groups.enroll');
    Route::post('groups/{group}/activate', [EqubGroupController::class, 'activate'])
        ->middleware('group.permission:groups.activate')
        ->name('groups.activate');

    // Self-service membership: join requests, invite codes, approvals
    Route::post('groups/join-by-code', [MembershipRequestController::class, 'joinByCode'])
        ->name('groups.join-by-code');
    Route::post('groups/{group}/join', [MembershipRequestController::class, 'store'])
        ->name('groups.join');
    Route::post('groups/{group}/requests/{membership_request}/approve', [MembershipRequestController::class, 'approve'])
        ->middleware('group.permission:memberships.approve')
        ->name('groups.requests.approve');
    Route::post('groups/{group}/requests/{membership_request}/reject', [MembershipRequestController::class, 'reject'])
        ->middleware('group.permission:memberships.reject')
        ->name('groups.requests.reject');

    // Member governance: group decisions and voting
    Route::prefix('groups/{group}/governance')->name('groups.governance.')->group(function () {
        Route::get('/', [GroupGovernanceController::class, 'index'])
            ->middleware('group.permission:governance.view')
            ->name('index');
        Route::post('/decisions', [GroupGovernanceController::class, 'store'])
            ->middleware('group.permission:governance.create')
            ->name('decisions.store');
        Route::post('/decisions/{decision}/vote', [GroupGovernanceController::class, 'vote'])
            ->middleware('group.permission:governance.vote')
            ->name('decisions.vote');
        Route::post('/decisions/{decision}/close', [GroupGovernanceController::class, 'close'])
            ->middleware('group.permission:governance.view')
            ->name('decisions.close');
    });

    // Initial Deposit Management (Module 7)
    Route::prefix('groups/{group}/deposits')->name('groups.deposits.')->group(function () {
        Route::get('/', [DepositRoundController::class, 'index'])->middleware('group.permission:deposits.view')->name('index');
        Route::post('/cycle', [DepositRoundController::class, 'createCycle'])->middleware('group.permission:deposits.generate')->name('cycle.store');
        Route::post('/rounds', [DepositRoundController::class, 'store'])->middleware('group.permission:deposits.generate')->name('rounds.store');
        Route::get('/rounds/{round}', [DepositRoundController::class, 'show'])->middleware('group.permission:deposits.view')->name('rounds.show');
        Route::post('/rounds/{round}/open', [DepositRoundController::class, 'open'])->middleware('group.permission:deposits.generate')->name('rounds.open');
        Route::post('/rounds/{round}/close', [DepositRoundController::class, 'close'])->middleware('group.permission:deposits.approve_stage')->name('rounds.close');
        Route::post('/obligations/{obligation}/pay', [DepositRoundController::class, 'submitPayment'])->middleware('group.permission:deposits.record')->name('obligations.pay');
        Route::post('/payments/{payment}/verify', [DepositRoundController::class, 'verifyPayment'])->middleware('group.permission:deposits.verify')->name('payments.verify');
    });

    // Contribution Management (Module 8) & Member Status Classification (Module 9)
    Route::prefix('groups/{group}/contributions')->name('groups.contributions.')->group(function () {
        Route::get('/', [ContributionController::class, 'index'])->middleware('group.permission:contributions.view')->name('index');
        Route::post('/generate', [ContributionController::class, 'generatePeriods'])->middleware('group.permission:contributions.generate')->name('generate');
        Route::get('/periods/{period}', [ContributionController::class, 'show'])->middleware('group.permission:contributions.view')->name('periods.show');
        Route::post('/periods/{period}/obligations', [ContributionController::class, 'generateObligations'])->middleware('group.permission:contributions.generate')->name('periods.obligations.generate');
        Route::post('/obligations/{obligation}/pay', [ContributionController::class, 'submitPayment'])->middleware('group.permission:contributions.record')->name('obligations.pay');
        Route::post('/payments/{payment}/verify', [ContributionController::class, 'verifyPayment'])->middleware('group.permission:contributions.verify')->name('payments.verify');
        Route::get('/status-board', [ContributionController::class, 'statusBoard'])->middleware('group.permission:contributions.view')->name('status-board');
    });

    // Payout Scheduling, Rotation, Approval & Disbursement (Modules 10 & 11)
    Route::prefix('groups/{group}/payouts')->name('groups.payouts.')->group(function () {
        Route::get('/', [PayoutController::class, 'index'])->middleware('group.permission:payouts.view')->name('index');
        Route::post('/schedule', [PayoutController::class, 'schedule'])->middleware('group.permission:payouts.schedule')->name('schedule');
        Route::get('/{payout}', [PayoutController::class, 'show'])->middleware('group.permission:payouts.view')->name('show');
        Route::post('/{payout}/request-approval', [PayoutController::class, 'requestApproval'])->middleware('group.permission:payouts.request')->name('request-approval');
        Route::post('/{payout}/approve', [PayoutController::class, 'approve'])->middleware('group.permission:payouts.approve')->name('approve');
        Route::post('/{payout}/disburse', [PayoutController::class, 'disburse'])->middleware('group.permission:payouts.disburse')->name('disburse');
        Route::post('/{payout}/complete', [PayoutController::class, 'complete'])->middleware('group.permission:payouts.disburse')->name('complete');
    });

    // Lottery Draws (Module 10B — lottery rotation method)
    Route::prefix('groups/{group}/lottery')->name('groups.lottery.')->group(function () {
        Route::get('/', [LotteryController::class, 'index'])->middleware('group.permission:payouts.view')->name('index');
        Route::get('/prepare', [LotteryController::class, 'prepare'])->middleware('group.permission:payouts.schedule')->name('prepare');
        Route::post('/conduct', [LotteryController::class, 'conduct'])->middleware('group.permission:payouts.schedule')->name('conduct');
        Route::post('/rerun', [LotteryController::class, 'rerun'])->middleware('group.permission:payouts.schedule')->name('rerun');
        Route::get('/{draw}', [LotteryController::class, 'show'])->middleware('group.permission:payouts.view')->name('show');
    });

    // Financial Ledger & Trial Balance (Module 12)
    Route::prefix('groups/{group}/finance')->name('groups.finance.')->group(function () {
        Route::get('/', [FinanceController::class, 'index'])->middleware('group.permission:ledger.view')->name('index');
        Route::get('/ledger', [FinanceController::class, 'ledger'])->middleware('group.permission:ledger.view')->name('ledger');
    });

    // Penalty Management & Waivers (Module 13)
    Route::prefix('groups/{group}/penalties')->name('groups.penalties.')->group(function () {
        Route::get('/', [PenaltyController::class, 'index'])->middleware('group.permission:penalties.view')->name('index');
        Route::post('/assess', [PenaltyController::class, 'assess'])->middleware('group.permission:penalties.assess')->name('assess');
        Route::post('/{penalty}/waiver', [PenaltyController::class, 'requestWaiver'])->middleware('group.permission:penalties.waive')->name('waiver.request');
        Route::post('/waiver-requests/{waiver}/review', [PenaltyController::class, 'reviewWaiver'])->middleware('group.permission:penalties.waive')->name('waiver.review');
        Route::post('/{penalty}/settle', [PenaltyController::class, 'settle'])->middleware('group.permission:penalties.assess')->name('settle');
    });

    // Member Withdrawal & Settlement (Module 14)
    Route::prefix('groups/{group}/withdrawals')->name('groups.withdrawals.')->group(function () {
        Route::get('/', [WithdrawalController::class, 'index'])->middleware('group.permission:withdrawals.approve')->name('index');
        Route::post('/memberships/{membership}', [WithdrawalController::class, 'store'])->middleware('group.permission:withdrawals.request')->name('store');
        Route::post('/{withdrawal}/review', [WithdrawalController::class, 'review'])->middleware('group.permission:withdrawals.approve')->name('review');
    });
});

Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('users', [UserController::class, 'index'])
            ->middleware('permission:users.view')
            ->name('users.index');

        Route::get('users/create', [UserController::class, 'create'])
            ->middleware('permission:users.create')
            ->name('users.create');

        Route::post('users', [UserController::class, 'store'])
            ->middleware(['permission:users.create', 'password.confirm'])
            ->name('users.store');

        Route::get('users/{user}/edit', [UserController::class, 'edit'])
            ->middleware('permission:users.view')
            ->name('users.edit');

        Route::patch('users/{user}', [UserController::class, 'update'])
            ->middleware(['permission:users.update', 'password.confirm'])
            ->name('users.update');

        Route::put('users/{user}/roles', [UserController::class, 'updateRoles'])
            ->middleware(['permission:users.assign_roles', 'password.confirm'])
            ->name('users.roles.update');

        Route::post('users/{user}/deactivate', [UserController::class, 'deactivate'])
            ->middleware(['permission:users.deactivate', 'password.confirm'])
            ->name('users.deactivate');

        Route::post('users/{user}/activate', [UserController::class, 'activate'])
            ->middleware(['permission:users.deactivate', 'password.confirm'])
            ->name('users.activate');

        Route::post('users/{user}/unlock', [UserController::class, 'unlock'])
            ->middleware(['permission:users.unlock', 'password.confirm'])
            ->name('users.unlock');

        Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])
            ->middleware(['permission:users.reset_password', 'password.confirm'])
            ->name('users.reset-password');

        Route::get('roles', [RoleController::class, 'index'])
            ->middleware('permission:roles.view')
            ->name('roles.index');

        Route::get('roles/{role}/edit', [RoleController::class, 'edit'])
            ->middleware('permission:roles.view')
            ->name('roles.edit');

        Route::put('roles/{role}/permissions', [RoleController::class, 'update'])
            ->middleware(['permission:permissions.manage', 'password.confirm'])
            ->name('roles.permissions.update');

        Route::get('permissions', [PermissionController::class, 'index'])
            ->middleware('permission:permissions.manage')
            ->name('permissions.index');

        Route::get('audit', [AuditLogController::class, 'index'])
            ->middleware('permission:audit.view')
            ->name('audit.index');

        Route::get('audit/{auditLog}', [AuditLogController::class, 'show'])
            ->middleware('permission:audit.view')
            ->name('audit.show');
    });

require __DIR__.'/settings.php';
