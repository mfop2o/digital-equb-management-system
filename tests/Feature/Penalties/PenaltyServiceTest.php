<?php

declare(strict_types=1);

namespace Tests\Feature\Penalties;

use App\Enums\GroupStatus;
use App\Enums\MembershipStatus;
use App\Models\EqubGroup;
use App\Models\EqubMembership;
use App\Models\MemberProfile;
use App\Models\Penalty;
use App\Models\User;
use App\Services\PenaltyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PenaltyServiceTest extends TestCase
{
    use RefreshDatabase;

    private function makeGroup(User $actor): EqubGroup
    {
        return EqubGroup::create([
            'name' => 'Penalty Test Equb',
            'group_code' => 'GRP-'.Str::upper(Str::random(8)),
            'status' => GroupStatus::Active,
            'created_by_user_id' => $actor->id,
        ]);
    }

    private function makeUser(string $name = 'Test User'): User
    {
        return User::factory()->create(['name' => $name]);
    }

    private function makeMembership(EqubGroup $group, User $user): EqubMembership
    {
        $profile = MemberProfile::create([
            'user_id' => $user->id,
            'member_number' => 'MEM-'.Str::upper(Str::random(8)),
            'first_name' => 'Test',
            'middle_name' => 'P',
            'last_name' => 'User',
            'phone' => '09'.random_int(10000000, 99999999),
            'phone_normalized' => '+2519'.random_int(10000000, 99999999),
            'created_by_user_id' => $user->id,
        ]);

        return EqubMembership::create([
            'equb_group_id' => $group->id,
            'member_profile_id' => $profile->id,
            'role' => 'member',
            'status' => MembershipStatus::Active,
            'membership_number' => 'MBR-'.Str::upper(Str::random(8)),
            'payout_order_number' => 1,
            'joined_at' => now(),
        ]);
    }

    private function makePendingPenalty(EqubGroup $group, EqubMembership $membership, User $assessor): Penalty
    {
        return Penalty::create([
            'equb_group_id' => $group->id,
            'equb_membership_id' => $membership->id,
            'member_profile_id' => $membership->member_profile_id,
            'reason' => 'Late contribution payment',
            'amount' => '50.00',
            'currency' => 'ETB',
            'status' => 'pending',
            'assessed_at' => now()->subDays(5),
            'assessed_by' => $assessor->id,
        ]);
    }

    public function test_penalty_waiver_request_is_stored(): void
    {
        $requester = $this->makeUser('Requester');
        $group = $this->makeGroup($requester);
        $membership = $this->makeMembership($group, $requester);
        $penalty = $this->makePendingPenalty($group, $membership, $requester);

        $service = app(PenaltyService::class);
        $service->requestWaiver(
            penalty: $penalty,
            reason: 'Medical emergency prevented timely payment',
            requester: $requester,
        );

        $this->assertDatabaseHas('penalty_waiver_requests', [
            'penalty_id' => $penalty->id,
            'status' => 'pending',
            'requested_by' => $requester->id,
        ]);
    }

    public function test_penalty_waiver_maker_checker_blocks_self_review(): void
    {
        $requester = $this->makeUser('Self Reviewer');
        $group = $this->makeGroup($requester);
        $membership = $this->makeMembership($group, $requester);
        $penalty = $this->makePendingPenalty($group, $membership, $requester);

        $service = app(PenaltyService::class);
        $waiver = $service->requestWaiver(
            penalty: $penalty,
            reason: 'Medical emergency prevented timely payment in full',
            requester: $requester,
        );

        // Same user cannot review their own waiver — maker-checker
        $this->expectException(ValidationException::class);
        $service->reviewWaiver(
            request: $waiver,
            decision: 'approved',
            reason: 'Self-approved',
            reviewer: $requester,
        );
    }

    public function test_approved_waiver_marks_penalty_as_waived(): void
    {
        $requester = $this->makeUser('Requester2');
        $reviewer = $this->makeUser('Reviewer2');
        $group = $this->makeGroup($requester);
        $membership = $this->makeMembership($group, $requester);
        $penalty = $this->makePendingPenalty($group, $membership, $requester);

        $service = app(PenaltyService::class);
        $waiver = $service->requestWaiver(
            penalty: $penalty,
            reason: 'Emergency situation documented and verified by admin',
            requester: $requester,
        );

        $service->reviewWaiver(
            request: $waiver,
            decision: 'approved',
            reason: 'Verified — waiver granted',
            reviewer: $reviewer,
        );

        $this->assertDatabaseHas('penalties', [
            'id' => $penalty->id,
            'status' => 'waived',
        ]);
        $this->assertDatabaseHas('penalty_waiver_requests', [
            'id' => $waiver->id,
            'status' => 'approved',
        ]);
    }

    public function test_settle_penalty_marks_as_paid(): void
    {
        $actor = $this->makeUser('Settler');
        $group = $this->makeGroup($actor);
        $membership = $this->makeMembership($group, $actor);
        $penalty = $this->makePendingPenalty($group, $membership, $actor);

        $service = app(PenaltyService::class);
        $service->settlePenalty(
            penalty: $penalty,
            paymentData: [
                'method' => 'cash',
                'reference' => 'CASH-001',
                'paid_on' => now()->toDateString(),
            ],
            submitter: $actor,
        );

        $this->assertDatabaseHas('penalties', [
            'id' => $penalty->id,
            'status' => 'paid',
        ]);
    }

    public function test_get_group_penalties_returns_collection(): void
    {
        $actor = $this->makeUser('Actor');
        $group = $this->makeGroup($actor);
        $membership = $this->makeMembership($group, $actor);
        $this->makePendingPenalty($group, $membership, $actor);

        $service = app(PenaltyService::class);
        $penalties = $service->getGroupPenalties($group);

        $this->assertCount(1, $penalties);
        $this->assertEquals('pending', $penalties->first()->status);
    }

    public function test_cannot_waive_already_paid_penalty(): void
    {
        $actor = $this->makeUser('Actor3');
        $group = $this->makeGroup($actor);
        $membership = $this->makeMembership($group, $actor);
        $penalty = $this->makePendingPenalty($group, $membership, $actor);
        $penalty->update(['status' => 'paid']);
        $penalty->refresh();

        $service = app(PenaltyService::class);
        $this->expectException(ValidationException::class);
        $service->requestWaiver(
            penalty: $penalty,
            reason: 'Trying to waive an already paid penalty',
            requester: $actor,
        );
    }
}
