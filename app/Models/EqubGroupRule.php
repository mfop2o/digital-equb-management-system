<?php

namespace App\Models;

use App\Enums\ContributionFrequency;
use App\Enums\InitialDepositTreatment;
use App\Enums\MembershipMode;
use App\Enums\PayoutCommencementRule;
use App\Enums\RotationMethod;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EqubGroupRule extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'contribution_amount' => 'decimal:2',
            'contribution_frequency' => ContributionFrequency::class,
            'expected_members' => 'integer',
            'initial_deposit_rounds' => 'integer',
            'initial_deposit_amount' => 'decimal:2',
            'initial_deposit_treatment' => InitialDepositTreatment::class,
            'membership_mode' => MembershipMode::class,
            'payout_commencement_rule' => PayoutCommencementRule::class,
            'payout_commencement_date' => 'date',
            'rotation_method' => RotationMethod::class,
            'allow_partial_contributions' => 'boolean',
            'late_penalty_enabled' => 'boolean',
            'late_penalty_fixed_amount' => 'decimal:2',
            'late_penalty_daily_rate' => 'decimal:2',
            'late_penalty_grace_days' => 'integer',
            'is_active' => 'boolean',
            'version' => 'integer',
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
     * @return BelongsTo<User, $this>
     */
    public function configuredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'configured_by_user_id');
    }

    /**
     * Calculate total regular pot for one round based on expected member count.
     */
    public function getEstimatedPotAmountAttribute(): float
    {
        return (float) $this->contribution_amount * $this->expected_members;
    }

    /**
     * Calculate total initial deposit target per paying member.
     */
    public function getTotalInitialDepositPerMemberAttribute(): float
    {
        return (float) $this->initial_deposit_amount * $this->initial_deposit_rounds;
    }
}
