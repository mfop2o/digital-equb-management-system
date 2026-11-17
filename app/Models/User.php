<?php

namespace App\Models;

use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property string|null $phone_normalized
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property UserStatus $status
 * @property Carbon|null $last_login_at
 * @property Carbon|null $deactivated_at
 * @property string|null $deactivation_reason
 * @property bool $must_change_password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'phone', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * The model's default attribute values.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => UserStatus::class,
            'last_login_at' => 'datetime',
            'deactivated_at' => 'datetime',
            'must_change_password' => 'boolean',
            /* @chisel-2fa */
            'two_factor_confirmed_at' => 'datetime',
            /* @end-chisel-2fa */
        ];
    }

    /**
     * Keep the normalized phone in sync with the display value.
     */
    protected static function booted(): void
    {
        static::saving(function (User $user): void {
            if ($user->isDirty('phone')) {
                $user->phone_normalized = self::normalizePhone($user->phone);
            }
        });
    }

    /**
     * Normalize an Ethiopian phone number to an E.164-style value.
     *
     * `0912 345 678`, `+251912345678`, and `251912345678` all normalize to
     * `+251912345678`. Values outside the expected shape are still reduced to
     * digits with a leading `+`, so the database unique index remains useful.
     */
    public static function normalizePhone(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        if (str_starts_with($digits, '0')) {
            $digits = '251'.substr($digits, 1);
        } elseif (strlen($digits) === 9) {
            $digits = '251'.$digits;
        }

        return '+'.$digits;
    }

    /**
     * Whether the account is allowed to authenticate.
     */
    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    /**
     * Whether this user holds the unrestricted system administration role.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super-admin');
    }

    /**
     * A pure auditor may view records but must never mutate them.
     *
     * A user who also holds an operational role is not treated as read-only.
     */
    public function isAuditor(): bool
    {
        return $this->hasRole('auditor')
            && ! $this->hasAnyRole(['super-admin', 'admin', 'organizer', 'treasurer']);
    }

    /**
     * Active staff assignments to an Equb group.
     *
     * @return HasMany<EqubGroupUser, $this>
     */
    public function groupAssignments(): HasMany
    {
        return $this->hasMany(EqubGroupUser::class);
    }

    /**
     * Associated member profile if this user is also registered as a member.
     *
     * @return HasOne<MemberProfile, $this>
     */
    public function memberProfile(): HasOne
    {
        return $this->hasOne(MemberProfile::class);
    }

    /**
     * Whether the user may act inside the given group.
     *
     * Super-admins are global. Every other user needs an active assignment.
     */
    public function hasGroupAccess(int $equbGroupId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->groupAssignments()
            ->where('equb_group_id', $equbGroupId)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Deactivate the account without deleting it or its financial history.
     */
    public function deactivate(?string $reason = null): void
    {
        $this->forceFill([
            'status' => UserStatus::Inactive,
            'deactivated_at' => now(),
            'deactivation_reason' => $reason,
        ])->save();
    }

    /**
     * Reactivate a previously deactivated account.
     */
    public function activate(): void
    {
        $this->forceFill([
            'status' => UserStatus::Active,
            'deactivated_at' => null,
            'deactivation_reason' => null,
        ])->save();
    }
}
