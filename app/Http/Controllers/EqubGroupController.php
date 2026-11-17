<?php

namespace App\Http\Controllers;

use App\Enums\GroupDecisionType;
use App\Enums\GroupRole;
use App\Enums\GroupStatus;
use App\Http\Requests\Groups\ConfigureRulesRequest;
use App\Http\Requests\Groups\EnrollMemberRequest;
use App\Http\Requests\Groups\StoreEqubGroupRequest;
use App\Models\EqubGroup;
use App\Models\GroupDecision;
use App\Models\MemberProfile;
use App\Services\EqubGroupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EqubGroupController extends Controller
{
    public function __construct(
        protected EqubGroupService $equbGroupService,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', EqubGroup::class);

        $groups = EqubGroup::query()
            ->search($request->input('search'))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->with(['activeRule'])
            ->withCount(['memberships', 'activeMemberships'])
            ->latest('id')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('groups/index', [
            'groups' => $groups,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', EqubGroup::class);

        return Inertia::render('groups/create');
    }

    public function store(StoreEqubGroupRequest $request): RedirectResponse
    {
        $group = $this->equbGroupService->createGroup(
            groupData: $request->only(['name', 'description', 'category', 'location', 'visibility', 'max_members']),
            ruleData: $request->except(['name', 'description', 'category', 'location', 'visibility', 'max_members']),
            creator: $request->user(),
        );

        return redirect()->route('groups.show', $group)
            ->with('success', "Equb Group '{$group->name}' ({$group->group_code}) created successfully.");
    }

    public function show(EqubGroup $group): Response
    {
        $this->authorize('view', $group);

        $group->load([
            'activeRule',
            'rules.configuredBy',
            'memberships.memberProfile.primaryIdentification',
            'staffUsers',
            'createdBy',
            'requests' => fn ($q) => $q->where('status', 'pending')->with('memberProfile.user'),
        ]);

        $group->loadCount(['memberships', 'activeMemberships']);

        // Available active members not yet enrolled in this group (for enrollment dialog)
        $availableMembers = MemberProfile::query()
            ->where('status', 'active')
            ->whereDoesntHave('memberships', fn ($q) => $q->where('equb_group_id', $group->id))
            ->orderBy('first_name')
            ->limit(50)
            ->get(['id', 'member_number', 'first_name', 'middle_name', 'last_name', 'phone']);

        return Inertia::render('groups/show', [
            'group' => $group,
            'availableMembers' => $availableMembers,
        ]);
    }

    public function configureRules(ConfigureRulesRequest $request, EqubGroup $group): RedirectResponse
    {
        $this->authorize('configureRules', $group);

        // Member governance gate: once a group is operating (deposit stage or
        // active rotation), its rules are immutable unless a passed
        // `rule_change` decision authorizes the new version.
        if (in_array($group->status, [GroupStatus::DepositStage, GroupStatus::Active], true)) {
            $decision = GroupDecision::find($request->validated('decision_id'));

            if (! $decision
                || $decision->equb_group_id !== $group->id
                || $decision->type !== GroupDecisionType::RuleChange
                || ! $decision->isPassed()
            ) {
                throw ValidationException::withMessages([
                    'decision_id' => 'Operating groups require a passed rule-change decision from member governance before rules may change.',
                ]);
            }
        }

        $version = ($group->rules()->max('version') ?? 0) + 1;

        $this->equbGroupService->configureRules(
            group: $group,
            data: $request->validated(),
            actor: $request->user(),
            version: $version,
        );

        return redirect()->back()->with('success', "Group rules updated to version {$version}.");
    }

    public function enroll(EnrollMemberRequest $request, EqubGroup $group): RedirectResponse
    {
        $this->authorize('enrollMembers', $group);

        $memberProfile = MemberProfile::findOrFail($request->validated('member_profile_id'));
        $role = GroupRole::from($request->validated('role'));

        $this->equbGroupService->enrollMember(
            group: $group,
            profile: $memberProfile,
            role: $role,
            payoutOrder: $request->validated('payout_order_number'),
            actor: $request->user(),
        );

        return redirect()->back()->with('success', "Member {$memberProfile->full_name} enrolled into {$group->name}.");
    }

    public function activate(Request $request, EqubGroup $group): RedirectResponse
    {
        $this->authorize('activate', $group);

        $this->equbGroupService->activateGroup($group, $request->user());

        return redirect()->back()->with('success', "Equb Group {$group->name} has been activated.");
    }
}
