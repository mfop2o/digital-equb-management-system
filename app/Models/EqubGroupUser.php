<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Carbon;

/**
 * Staff assignment to a group.
 *
 * Authority for group-scoped actions requires an active row here. The group
 * model itself arrives in Phase 3; until then the pivot keeps the final shape.
 *
 * @property int $id
 * @property int $equb_group_id
 * @property int $user_id
 * @property string|null $role
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class EqubGroupUser extends Pivot
{
    /**
     * @var string
     */
    protected $table = 'equb_group_user';

    /**
     * @var bool
     */
    public $incrementing = true;

    /**
     * @var list<string>
     */
    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
