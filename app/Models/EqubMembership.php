<?php

namespace App\Models;

use App\Enums\GroupRole;
use App\Enums\MembershipStatus;
use App\Enums\PayoutStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EqubMembership extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'role' => GroupRole::class,
            'status' => MembershipStatus::class,
            'payout_order_number' => 'integer',
            'joined_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<EqubGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(EqubGroup::class, 'equb_group_id');
    }

    /**
     * @return BelongsTo<MemberProfile, $this>
     */
    public function memberProfile(): BelongsTo
    {
        return $this->belongsTo(MemberProfile::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function isOrganizer(): bool
    {
        return $this->role === GroupRole::Organizer;
    }

    public function isTreasurer(): bool
    {
        return $this->role === GroupRole::Treasurer;
    }

    /**
     * @return HasMany<Payout, $this>
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }

    public function hasReceivedPayout(?int $cycleId = null): bool
    {
        return $this->payouts()
            ->when($cycleId, fn ($q) => $q->where('equb_cycle_id', $cycleId))
            ->whereIn('status', [
                PayoutStatus::Disbursed->value,
                PayoutStatus::Completed->value,
            ])
            ->exists();
    }
}
