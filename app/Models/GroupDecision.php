<?php

namespace App\Models;

use App\Enums\GroupDecisionStatus;
use App\Enums\GroupDecisionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GroupDecision extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'type' => GroupDecisionType::class,
            'status' => GroupDecisionStatus::class,
            'decision_payload' => 'array',
            'closes_at' => 'datetime',
            'closed_at' => 'datetime',
            'approves_count' => 'integer',
            'rejects_count' => 'integer',
            'abstains_count' => 'integer',
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
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by_user_id');
    }

    /**
     * @return HasMany<GroupDecisionVote, $this>
     */
    public function votes(): HasMany
    {
        return $this->hasMany(GroupDecisionVote::class);
    }

    /**
     * @return HasMany<GroupDecisionVote, $this>
     */
    public function votesOf(User $user): HasMany
    {
        return $this->votes()->where('user_id', $user->id);
    }

    public function isOpen(): bool
    {
        return $this->status === GroupDecisionStatus::Open;
    }

    /**
     * Whether the voting window has elapsed (decision may be lazily closed).
     */
    public function isPastClosesAt(): bool
    {
        return $this->closes_at->isPast();
    }

    /**
     * Whether this decision passed (more approvals than rejections).
     */
    public function isPassed(): bool
    {
        return $this->status === GroupDecisionStatus::Passed;
    }
}
