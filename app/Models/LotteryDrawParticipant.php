<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LotteryDrawParticipant extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_eligible' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<LotteryDraw, $this>
     */
    public function draw(): BelongsTo
    {
        return $this->belongsTo(LotteryDraw::class, 'lottery_draw_id');
    }

    /**
     * @return BelongsTo<EqubMembership, $this>
     */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(EqubMembership::class, 'equb_membership_id');
    }
}
