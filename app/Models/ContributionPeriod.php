<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContributionPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'equb_group_id',
        'equb_cycle_id',
        'sequence',
        'label',
        'opens_on',
        'due_on',
        'closes_on',
        'status',
        'amount_due_snapshot',
        'grace_days_snapshot',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'opens_on' => 'date',
            'due_on' => 'date',
            'closes_on' => 'date',
            'amount_due_snapshot' => 'decimal:2',
            'grace_days_snapshot' => 'integer',
            'generated_at' => 'datetime',
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
     * @return HasMany<ContributionObligation, $this>
     */
    public function obligations(): HasMany
    {
        return $this->hasMany(ContributionObligation::class, 'contribution_period_id');
    }
}
