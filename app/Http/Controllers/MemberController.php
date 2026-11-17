<?php

namespace App\Http\Controllers;

use App\Http\Requests\Members\StoreMemberRequest;
use App\Http\Requests\Members\UpdateMemberRequest;
use App\Models\MemberProfile;
use App\Services\MemberService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    public function __construct(
        protected MemberService $memberService,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', MemberProfile::class);

        $members = MemberProfile::query()
            ->search($request->input('search'))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('kyc_status'), fn ($q) => $q->where('kyc_status', $request->input('kyc_status')))
            ->with(['primaryIdentification', 'guarantors'])
            ->withCount('memberships')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('members/index', [
            'members' => $members,
            'filters' => $request->only(['search', 'status', 'kyc_status']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', MemberProfile::class);

        return Inertia::render('members/create');
    }

    public function store(StoreMemberRequest $request): RedirectResponse
    {
        $profile = $this->memberService->createMember($request->validated(), $request->user());

        return redirect()->route('members.show', $profile)
            ->with('success', "Member {$profile->full_name} ({$profile->member_number}) registered successfully.");
    }

    public function show(MemberProfile $member): Response
    {
        $this->authorize('view', $member);

        $member->load([
            'identifications',
            'guarantors',
            'memberships.group.activeRule',
            'createdBy',
        ]);

        return Inertia::render('members/show', [
            'member' => $member,
        ]);
    }

    public function edit(MemberProfile $member): Response
    {
        $this->authorize('update', $member);

        return Inertia::render('members/edit', [
            'member' => $member,
        ]);
    }

    public function update(UpdateMemberRequest $request, MemberProfile $member): RedirectResponse
    {
        $this->memberService->updateMember($member, $request->validated(), $request->user());

        return redirect()->route('members.show', $member)
            ->with('success', 'Member profile updated successfully.');
    }

    public function verify(Request $request, MemberProfile $member): RedirectResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'string', 'in:verified,rejected'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'rejection_reason' => ['required_if:decision,rejected', 'nullable', 'string', 'max:1000'],
        ]);

        $this->memberService->verifyMember(
            profile: $member,
            verifier: $request->user(),
            decision: $validated['decision'],
            notes: $validated['notes'] ?? null,
            rejectionReason: $validated['rejection_reason'] ?? null
        );

        return back()->with('success', 'Member KYC verification status updated.');
    }
}
