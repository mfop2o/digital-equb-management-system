<?php

namespace App\Models;

use App\Enums\GroupRole;
use App\Enums\GroupStatus;
use App\Enums\GroupVisibility;
use App\Enums\MembershipStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class EqubGroup extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'status' => GroupStatus::class,
            'visibility' => GroupVisibility::class,
            'max_members' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * @return HasMany<EqubGroupRule, $this>
     */
    public function rules(): HasMany
    {
        return $this->hasMany(EqubGroupRule::class);
    }

    /**
     * @return HasOne<EqubGroupRule, $this>
     */
    public function activeRule(): HasOne
    {
        return $this->hasOne(EqubGroupRule::class)->where('is_active', true)->latestOfMany();
    }

    /**
     * @return HasMany<EqubMembership, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(EqubMembership::class);
    }

    /**
     * @return HasMany<EqubMembership, $this>
     */
    public function activeMemberships(): HasMany
    {
        return $this->hasMany(EqubMembership::class)->where('status', MembershipStatus::Active->value);
    }

    /**
     * @return HasMany<EqubMembership, $this>
     */
    public function organizers(): HasMany
    {
        return $this->hasMany(EqubMembership::class)->where('role', GroupRole::Organizer->value);
    }

    /**
     * @return HasMany<EqubMembership, $this>
     */
    public function treasurers(): HasMany
    {
        return $this->hasMany(EqubMembership::class)->where('role', GroupRole::Treasurer->value);
    }

    /**
     * @return BelongsToMany<MemberProfile, $this>
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(MemberProfile::class, 'equb_memberships', 'equb_group_id', 'member_profile_id')
            ->withPivot(['id', 'membership_number', 'role', 'payout_order_number', 'status', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function staffUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'equb_group_user', 'equb_group_id', 'user_id')
            ->withPivot(['role', 'is_active'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<MembershipRequest, $this>
     */
    public function requests(): HasMany
    {
        return $this->hasMany(MembershipRequest::class);
    }

    /**
     * @return HasMany<GroupDecision, $this>
     */
    public function decisions(): HasMany
    {
        return $this->hasMany(GroupDecision::class)->orderByDesc('id');
    }

    /**
     * Currently open member-governance decisions.
     *
     * @return HasMany<GroupDecision, $this>
     */
    public function openDecisions(): HasMany
    {
        return $this->hasMany(GroupDecision::class)->where('status', GroupDecisionStatus::Open->value);
    }

    /**
     * @return HasMany<EqubCycle, $this>
     */
    public function cycles(): HasMany
    {
        return $this->hasMany(EqubCycle::class)->orderBy('cycle_number');
    }

    /**
     * @return HasOne<EqubCycle, $this>
     */
    public function activeCycle(): HasOne
    {
        return $this->hasOne(EqubCycle::class)->latestOfMany();
    }

    /**
     * @return HasMany<DepositRound, $this>
     */
    public function depositRounds(): HasMany
    {
        return $this->hasMany(DepositRound::class)->orderBy('sequence');
    }

    /**
     * @return HasMany<ContributionPeriod, $this>
     */
    public function contributionPeriods(): HasMany
    {
        return $this->hasMany(ContributionPeriod::class)->orderBy('sequence');
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return HasMany<Payout, $this>
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class)->orderBy('payout_sequence');
    }

    /**
     * @return HasMany<Penalty, $this>
     */
    public function penalties(): HasMany
    {
        return $this->hasMany(Penalty::class)->orderByDesc('id');
    }

    /**
     * @return HasMany<MemberWithdrawal, $this>
     */
    public function withdrawals(): HasMany
    {
        return $this->hasMany(MemberWithdrawal::class)->orderByDesc('id');
    }

    /**
     * @return HasMany<JournalEntry, $this>
     */
    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class)->orderByDesc('entry_date');
    }

    public function scopeSearch($query, ?string $term)
    {
        if (blank($term)) {
            return $query;
        }

        $term = trim($term);

        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
                ->orWhere('group_code', 'like', "%{$term}%")
                ->orWhere('category', 'like', "%{$term}%")
                ->orWhere('location', 'like', "%{$term}%");
        });
    }

    public function isFull(): bool
    {
        return $this->activeMemberships()->count() >= $this->max_members;
    }
}
