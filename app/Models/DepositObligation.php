<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DepositObligationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DepositObligation extends Model
{
    use HasFactory;

    protected $fillable = [
        'deposit_round_id',
        'equb_membership_id',
        'member_profile_id',
        'amount_due',
        'amount_paid',
        'due_on',
        'grace_days',
        'status',
        'is_exempt',
        'exemption_reason',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => DepositObligationStatus::class,
            'amount_due' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'due_on' => 'date',
            'grace_days' => 'integer',
            'is_exempt' => 'boolean',
            'generated_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<DepositRound, $this>
     */
    public function round(): BelongsTo
    {
        return $this->belongsTo(DepositRound::class, 'deposit_round_id');
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
     * @return HasMany<PaymentAllocation, $this>
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'deposit_obligation_id');
    }

    public function remainingBalance(): float
    {
        if ($this->is_exempt) {
            return 0.00;
        }

        return max(0.00, (float) $this->amount_due - (float) $this->amount_paid);
    }

    public function isFullyPaid(): bool
    {
        return $this->is_exempt || $this->remainingBalance() <= 0.00;
    }
}
