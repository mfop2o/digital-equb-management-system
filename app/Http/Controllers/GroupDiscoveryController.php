<?php

namespace App\Http\Controllers;

use App\Enums\GroupStatus;
use App\Enums\GroupVisibility;
use App\Enums\MembershipStatus;
use App\Models\EqubGroup;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public group discovery: browse and filter joinable public groups.
 */
class GroupDiscoveryController extends Controller
{
    /**
     * Group statuses that accept new members.
     *
     * @var array<int, string>
     */
    protected const JOINABLE_STATUSES = [
        GroupStatus::Registration,
        GroupStatus::DepositStage,
        GroupStatus::Active,
    ];

    public function index(Request $request): Response
    {
        $groups = EqubGroup::query()
            ->where('visibility', GroupVisibility::Public->value)
            ->whereIn('status', self::JOINABLE_STATUSES)
            ->with(['activeRule'])
            ->withCount('activeMemberships')
            ->when($request->filled('search'), fn ($q) => $q->search($request->input('search')))
            ->when($request->filled('frequency'), fn ($q) => $q->whereHas('activeRule', fn ($r) => $r->where('contribution_frequency', $request->input('frequency'))))
            ->when($request->filled('min_amount'), fn ($q) => $q->whereHas('activeRule', fn ($r) => $r->where('contribution_amount', '>=', $request->input('min_amount'))))
            ->when($request->filled('max_amount'), fn ($q) => $q->whereHas('activeRule', fn ($r) => $r->where('contribution_amount', '<=', $request->input('max_amount'))))
            ->when($request->filled('location'), fn ($q) => $q->where('location', 'like', '%'.$request->input('location').'%'))
            ->when($request->filled('max_size'), fn ($q) => $q->where('max_members', '<=', $request->input('max_size')))
            ->when($request->filled('has_slots') && $request->boolean('has_slots'), function ($q) {
                $q->whereColumn('active_memberships_count', '<', 'max_members');
            })
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('explore/index', [
            'groups' => $groups,
            'filters' => $request->only([
                'search', 'frequency', 'min_amount', 'max_amount', 'location', 'max_size', 'has_slots',
            ]),
        ]);
    }

    public function show(EqubGroup $group): Response
    {
        abort_unless(
            $group->visibility === GroupVisibility::Public
                && in_array($group->status, self::JOINABLE_STATUSES, true),
            404,
        );

        $group->load(['activeRule'])
            ->loadCount(['activeMemberships']);

        return Inertia::render('explore/show', [
            'group' => $group,
        ]);
    }
}
