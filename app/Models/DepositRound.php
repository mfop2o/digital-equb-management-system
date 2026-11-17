<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DepositRoundStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DepositRound extends Model
{
    use HasFactory;

    protected $fillable = [
        'equb_group_id',
        'equb_cycle_id',
        'sequence',
        'label',
        'amount_per_member',
        'opens_on',
        'due_on',
        'closes_on',
        'status',
        'requires_previous_close',
        'approved_by',
        'approved_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => DepositRoundStatus::class,
            'amount_per_member' => 'decimal:2',
            'opens_on' => 'date',
            'due_on' => 'date',
            'closes_on' => 'date',
            'requires_previous_close' => 'boolean',
            'approved_at' => 'datetime',
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
     * @return HasMany<DepositObligation, $this>
     */
    public function obligations(): HasMany
    {
        return $this->hasMany(DepositObligation::class, 'deposit_round_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
