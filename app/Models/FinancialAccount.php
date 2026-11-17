<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AccountType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'scope_key',
        'equb_group_id',
        'code',
        'name',
        'type',
        'subtype',
        'currency',
        'is_system',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => AccountType::class,
            'is_system' => 'boolean',
            'is_active' => 'boolean',
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
     * @return HasMany<JournalEntryLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class, 'financial_account_id');
    }

    public function currentBalance(): float
    {
        $debits = (float) $this->lines()->sum('debit');
        $credits = (float) $this->lines()->sum('credit');

        // Normal balance calculation based on account type
        return match ($this->type) {
            AccountType::Asset, AccountType::Expense => $debits - $credits,
            AccountType::Liability, AccountType::Equity, AccountType::Income => $credits - $debits,
        };
    }
}
