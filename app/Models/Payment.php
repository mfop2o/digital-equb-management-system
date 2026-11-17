<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'equb_group_id',
        'equb_cycle_id',
        'equb_membership_id',
        'member_profile_id',
        'submitted_by_user_id',
        'payment_type',
        'amount',
        'currency',
        'method',
        'reference',
        'paid_on',
        'status',
        'idempotency_key',
        'evidence_file_path',
        'notes',
        'verified_at',
        'verified_by',
    ];

    protected function casts(): array
    {
        return [
            'payment_type' => PaymentType::class,
            'method' => PaymentMethod::class,
            'status' => PaymentStatus::class,
            'amount' => 'decimal:2',
            'paid_on' => 'date',
            'verified_at' => 'datetime',
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
     * @return BelongsTo<EqubCycle, $this>
     */
    public function cycle(): BelongsTo
    {
        return $this->belongsTo(EqubCycle::class, 'equb_cycle_id');
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
    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * @return HasMany<PaymentAllocation, $this>
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'payment_id');
    }

    /**
     * @return HasMany<PaymentVerification, $this>
     */
    public function verifications(): HasMany
    {
        return $this->hasMany(PaymentVerification::class, 'payment_id');
    }
}
