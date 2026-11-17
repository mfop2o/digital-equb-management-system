<?php

namespace App\Http\Controllers;

use App\Http\Requests\Membership\JoinByCodeRequest;
use App\Http\Requests\Membership\JoinGroupRequest;
use App\Http\Requests\Membership\ReviewMembershipRequest;
use App\Models\EqubGroup;
use App\Models\MembershipRequest;
use App\Services\MembershipRequestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MembershipRequestController extends Controller
{
    public function __construct(
        protected MembershipRequestService $service,
    ) {}

    /**
     * Request to join a public group.
     */
    public function store(JoinGroupRequest $request, EqubGroup $group): RedirectResponse
    {
        $this->service->requestToJoin($group, $request->user(), $request->validated('notes'));

        return redirect()->back()
            ->with('success', 'Your membership request was submitted. Group organizers will review it.');
    }

    /**
     * Join a private/invite-only group via invite code.
     */
    public function joinByCode(JoinByCodeRequest $request): RedirectResponse
    {
        $membershipRequest = $this->service->joinByCode(
            $request->validated('code'),
            $request->user(),
            $request->validated('notes'),
        );

        return redirect()->route('groups.show', $membershipRequest->group)
            ->with('success', 'Your membership request was submitted via invite code.');
    }

    /**
     * Approve a pending membership request (enrolls the member).
     */
    public function approve(ReviewMembershipRequest $request, EqubGroup $group, MembershipRequest $membershipRequest): RedirectResponse
    {
        $this->service->approve($membershipRequest, $request->user());

        return redirect()->back()->with('success', 'Membership request approved; the member was enrolled.');
    }

    /**
     * Reject a pending membership request.
     */
    public function reject(ReviewMembershipRequest $request, EqubGroup $group, MembershipRequest $membershipRequest): RedirectResponse
    {
        $this->service->reject($membershipRequest, $request->user(), $request->validated('reason'));

        return redirect()->back()->with('success', 'Membership request rejected.');
    }
}
