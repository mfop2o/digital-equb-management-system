<?php

namespace App\Models;

use App\Enums\KycStatus;
use App\Enums\MemberStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    protected $appends = ['full_name'];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'status' => MemberStatus::class,
            'kyc_status' => KycStatus::class,
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (MemberProfile $profile): void {
            if ($profile->isDirty('phone')) {
                $profile->phone_normalized = User::normalizePhone($profile->phone);
            }
        });
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * @return HasMany<MemberIdentification, $this>
     */
    public function identifications(): HasMany
    {
        return $this->hasMany(MemberIdentification::class);
    }

    /**
     * @return HasOne<MemberIdentification, $this>
     */
    public function primaryIdentification(): HasOne
    {
        return $this->hasOne(MemberIdentification::class)->where('is_primary', true);
    }

    /**
     * @return HasMany<MemberVerification, $this>
     */
    public function verifications(): HasMany
    {
        return $this->hasMany(MemberVerification::class);
    }

    /**
     * @return HasMany<MemberGuarantor, $this>
     */
    public function guarantors(): HasMany
    {
        return $this->hasMany(MemberGuarantor::class);
    }

    /**
     * @return HasMany<EqubMembership, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(EqubMembership::class);
    }

    /**
     * @return BelongsToMany<EqubGroup, $this>
     */
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(EqubGroup::class, 'equb_memberships', 'member_profile_id', 'equb_group_id')
            ->withPivot(['id', 'membership_number', 'role', 'payout_order_number', 'status', 'joined_at'])
            ->withTimestamps();
    }

    public function scopeSearch($query, ?string $term)
    {
        if (blank($term)) {
            return $query;
        }

        $term = trim($term);

        return $query->where(function ($q) use ($term) {
            $q->where('member_number', 'like', "%{$term}%")
                ->orWhere('first_name', 'like', "%{$term}%")
                ->orWhere('middle_name', 'like', "%{$term}%")
                ->orWhere('last_name', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%")
                ->orWhere('phone_normalized', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%");
        });
    }

    public function isVerified(): bool
    {
        return $this->kyc_status === KycStatus::Verified;
    }
}
