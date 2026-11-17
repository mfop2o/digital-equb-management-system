<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupDecisionVote extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'voted_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<GroupDecision, $this>
     */
    public function decision(): BelongsTo
    {
        return $this->belongsTo(GroupDecision::class, 'group_decision_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
