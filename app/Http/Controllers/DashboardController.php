<?php

namespace App\Http\Controllers;

use App\Enums\GroupStatus;
use App\Enums\KycStatus;
use App\Enums\UserStatus;
use App\Models\AuditLog;
use App\Models\EqubGroup;
use App\Models\MemberProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Permission-aware landing page.
 *
 * Phase 2 deliberately shows operational placeholders only. No financial value
 * is displayed until the accounting modules exist.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $metrics = [];

        // Equb Group metrics
        if ($user->can('groups.view')) {
            $totalGroups = EqubGroup::count();
            $activeGroups = EqubGroup::where('status', GroupStatus::Active)->count();

            $metrics[] = [
                'key' => 'groups',
                'label' => 'Equb Groups',
                'value' => $totalGroups,
                'hint' => "{$activeGroups} actively rotating",
            ];
        }

        // Member metrics
        if ($user->can('members.view')) {
            $totalMembers = MemberProfile::count();
            $verifiedMembers = MemberProfile::where('kyc_status', KycStatus::Verified)->count();

            $metrics[] = [
                'key' => 'members',
                'label' => 'Total Members',
                'value' => $totalMembers,
                'hint' => "{$verifiedMembers} KYC verified",
            ];
        }

        // System user metrics
        if ($user->can('users.view')) {
            $metrics[] = [
                'key' => 'users',
                'label' => 'Staff Users',
                'value' => User::where('status', UserStatus::Active)->count(),
                'hint' => 'Active operational accounts',
            ];
        }

        // Audit events today
        if ($user->can('audit.view')) {
            $metrics[] = [
                'key' => 'audit',
                'label' => 'Audit Events Today',
                'value' => AuditLog::whereDate('created_at', today())->count(),
                'hint' => 'Security & financial ledger trail',
            ];
        }

        // Recent groups for dashboard display
        $recentGroups = [];
        if ($user->can('groups.view')) {
            $recentGroups = EqubGroup::with('activeRule')
                ->withCount('activeMemberships')
                ->latest('id')
                ->limit(5)
                ->get()
                ->map(fn ($g) => [
                    'id' => $g->id,
                    'name' => $g->name,
                    'group_code' => $g->group_code,
                    'status' => $g->status->value,
                    'status_label' => $g->status->label(),
                    'max_members' => $g->max_members,
                    'active_members_count' => $g->active_memberships_count,
                    'contribution_amount' => $g->activeRule ? (float) $g->activeRule->contribution_amount : 0,
                    'contribution_frequency' => $g->activeRule ? $g->activeRule->contribution_frequency->value : 'monthly',
                ]);
        }

        // Recent members for dashboard display
        $recentMembers = [];
        if ($user->can('members.view')) {
            $recentMembers = MemberProfile::latest('id')
                ->limit(5)
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'member_number' => $m->member_number,
                    'full_name' => $m->full_name,
                    'phone' => $m->phone,
                    'status' => $m->status->value,
                    'kyc_status' => $m->kyc_status->value,
                    'created_at' => $m->created_at?->diffForHumans() ?? 'recently',
                ]);
        }

        return Inertia::render('dashboard', [
            'metrics' => $metrics,
            'recentGroups' => $recentGroups,
            'recentMembers' => $recentMembers,
            'account' => [
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames()->sort()->values()->all(),
                'status' => $user->status->value,
                'status_label' => $user->status->label(),
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
            ],
        ]);
    }
}
