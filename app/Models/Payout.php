<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PayoutStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payout extends Model
{
    use HasFactory;

    protected $fillable = [
        'equb_group_id',
        'equb_cycle_id',
        'lottery_draw_id',
        'equb_membership_id',
        'member_profile_id',
        'payout_sequence',
        'amount',
        'currency',
        'status',
        'method',
        'account_reference',
        'scheduled_on',
        'disbursed_on',
        'completed_at',
        'disbursement_reference',
        'requested_by',
        'approved_by',
        'approved_at',
        'disbursed_by',
        'notes',
        'rejection_reason',
        'eligibility_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'status' => PayoutStatus::class,
            'amount' => 'decimal:2',
            'scheduled_on' => 'date',
            'disbursed_on' => 'date',
            'approved_at' => 'datetime',
            'completed_at' => 'datetime',
            'eligibility_snapshot' => 'array',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * @return BelongsTo<EqubGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(EqubGroup::class, 'equb_group_id');
    }

    /**
     * @return BelongsTo<EqubCycle, $this>
     */
    public function cycle(): BelongsTo
    {
        return $this->belongsTo(EqubCycle::class, 'equb_cycle_id');
    }

    /**
     * @return BelongsTo<LotteryDraw, $this>
     */
    public function lotteryDraw(): BelongsTo
    {
        return $this->belongsTo(LotteryDraw::class, 'lottery_draw_id');
    }

    /**
     * @return BelongsTo<EqubMembership, $this>
     */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(EqubMembership::class, 'equb_membership_id');
    }

    /**
     * @return BelongsTo<MemberProfile, $this>
     */
    public function memberProfile(): BelongsTo
    {
        return $this->belongsTo(MemberProfile::class, 'member_profile_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function disburser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disbursed_by');
    }

    // -------------------------------------------------------------------------
    // Business-rule helpers
    // -------------------------------------------------------------------------

    /**
     * Business rule (confirmed): A payout is "paid" only after actual disbursement.
     * Approved alone does NOT count. Used for BLUE member status.
     */
    public function isConsideredPaid(): bool
    {
        return $this->status->isConsideredPaid();
    }

    public function isDisbursed(): bool
    {
        return $this->status === PayoutStatus::Disbursed;
    }

    public function isCompleted(): bool
    {
        return $this->status === PayoutStatus::Completed;
    }
}
