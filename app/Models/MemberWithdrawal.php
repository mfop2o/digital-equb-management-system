<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberWithdrawal extends Model
{
    use HasFactory;

    protected $fillable = [
        'equb_group_id',
        'equb_membership_id',
        'member_profile_id',
        'reason',
        'status',
        'settlement_type',
        'settlement_amount',
        'requested_by',
        'approved_by',
        'settled_by',
        'settled_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'settlement_amount' => 'decimal:2',
            'settled_at' => 'datetime',
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
    public function settler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'settled_by');
    }
}
