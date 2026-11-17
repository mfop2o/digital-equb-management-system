<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Penalty extends Model
{
    use HasFactory;

    protected $fillable = [
        'equb_group_id',
        'equb_membership_id',
        'member_profile_id',
        'contribution_obligation_id',
        'reason',
        'amount',
        'currency',
        'status',
        'assessed_at',
        'assessed_by',
        'paid_at',
        'waived_at',
        'waived_by',
        'waiver_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'assessed_at' => 'datetime',
            'paid_at' => 'datetime',
            'waived_at' => 'datetime',
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
     * @return BelongsTo<ContributionObligation, $this>
     */
    public function obligation(): BelongsTo
    {
        return $this->belongsTo(ContributionObligation::class, 'contribution_obligation_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assessor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assessed_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function waiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'waived_by');
    }

    /**
     * @return HasMany<PenaltyWaiverRequest, $this>
     */
    public function waiverRequests(): HasMany
    {
        return $this->hasMany(PenaltyWaiverRequest::class, 'penalty_id');
    }
}
