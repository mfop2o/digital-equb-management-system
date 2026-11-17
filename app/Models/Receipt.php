<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ReceiptType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Receipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'receipt_number',
        'receipt_type',
        'receiptable_type',
        'receiptable_id',
        'equb_group_id',
        'member_profile_id',
        'amount',
        'currency',
        'issued_at',
        'issued_by_user_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'receipt_type' => ReceiptType::class,
            'amount' => 'decimal:2',
            'issued_at' => 'datetime',
        ];
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function receiptable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<EqubGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(EqubGroup::class, 'equb_group_id');
    }

    /**
     * @return BelongsTo<MemberProfile, $this>
     */
    public function memberProfile(): BelongsTo
    {
        return $this->belongsTo(MemberProfile::class, 'member_profile_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by_user_id');
    }
}
