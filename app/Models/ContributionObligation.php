<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContributionObligation extends Model
{
    use HasFactory;

    protected $fillable = [
        'contribution_period_id',
        'equb_membership_id',
        'member_profile_id',
        'amount_due',
        'amount_paid',
        'due_on',
        'grace_days',
        'status',
        'is_late',
        'late_penalty_amount',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_due' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'late_penalty_amount' => 'decimal:2',
            'due_on' => 'date',
            'grace_days' => 'integer',
            'is_late' => 'boolean',
            'generated_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<ContributionPeriod, $this>
     */
    public function period(): BelongsTo
    {
        return $this->belongsTo(ContributionPeriod::class, 'contribution_period_id');
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
     * Payment allocations linking this obligation to payments.
     *
     * @return HasMany<PaymentAllocation, $this>
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'contribution_obligation_id');
    }

    public function remainingBalance(): float
    {
        return max(0.00, (float) $this->amount_due - (float) $this->amount_paid);
    }

    public function isFullyPaid(): bool
    {
        return $this->remainingBalance() <= 0.00;
    }

    public function isOverdue(): bool
    {
        if ($this->isFullyPaid()) {
            return false;
        }

        $graceDeadline = $this->due_on->copy()->addDays($this->grace_days);

        return now()->startOfDay()->greaterThan($graceDeadline);
    }
}
