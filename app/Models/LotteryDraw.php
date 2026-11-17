<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LotteryDraw extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'eligible_participants' => 'array',
            'draw_evidence' => 'array',
            'eligible_count' => 'integer',
            'payout_sequence' => 'integer',
            'conducted_at' => 'datetime',
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
     * @return BelongsTo<EqubMembership, $this>
     */
    public function winningMembership(): BelongsTo
    {
        return $this->belongsTo(EqubMembership::class, 'winning_membership_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function conductedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'conducted_by');
    }

    /**
     * @return HasMany<LotteryDrawParticipant, $this>
     */
    public function participants(): HasMany
    {
        return $this->hasMany(LotteryDrawParticipant::class, 'lottery_draw_id');
    }

    /**
     * @return HasMany<Payout, $this>
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'lottery_draw_id');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function isConfirmed(): bool
    {
        return $this->status === 'winner_confirmed';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
