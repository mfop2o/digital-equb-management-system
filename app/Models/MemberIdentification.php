<?php

namespace App\Models;

use App\Enums\IdType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberIdentification extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'id_type' => IdType::class,
            'issue_date' => 'date',
            'expiry_date' => 'date',
            'is_primary' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<MemberProfile, $this>
     */
    public function memberProfile(): BelongsTo
    {
        return $this->belongsTo(MemberProfile::class);
    }
}
