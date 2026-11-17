<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CycleStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EqubCycle extends Model
{
    use HasFactory;

    protected $fillable = [
        'equb_group_id',
        'cycle_number',
        'status',
        'rule_version_id',
        'rule_snapshot',
        'started_on',
        'deposit_stage_closed_on',
        'activated_on',
        'closing_started_on',
        'closed_on',
        'closure_notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => CycleStatus::class,
            'rule_snapshot' => 'array',
            'started_on' => 'date',
            'deposit_stage_closed_on' => 'date',
            'activated_on' => 'date',
            'closing_started_on' => 'date',
            'closed_on' => 'date',
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
     * @return BelongsTo<EqubGroupRule, $this>
     */
    public function ruleVersion(): BelongsTo
    {
        return $this->belongsTo(EqubGroupRule::class, 'rule_version_id');
    }

    /**
     * @return HasMany<DepositRound, $this>
     */
    public function depositRounds(): HasMany
    {
        return $this->hasMany(DepositRound::class, 'equb_cycle_id')->orderBy('sequence');
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'equb_cycle_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
