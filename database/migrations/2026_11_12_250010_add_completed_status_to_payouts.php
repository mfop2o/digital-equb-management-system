<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Business rule (confirmed): A payout becomes PAID only after actual disbursement is recorded.
     * Adding `completed` status to make the final state explicit and separate from `disbursed`.
     * Also adds:
     * - completed_at timestamp so member status service can query it precisely
     * - lottery_draw_id FK so each payout is traceable to its lottery draw
     */
    public function up(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            // Final completion timestamp (set when status transitions to completed)
            $table->timestamp('completed_at')->nullable()->after('disbursed_on');

            // Link payout back to the lottery draw that selected this member
            // Nullable because predetermined rotation doesn't use lottery
            $table->foreignId('lottery_draw_id')
                ->nullable()
                ->after('equb_cycle_id')
                ->constrained('lottery_draws')
                ->nullOnDelete();

            // Eligibility snapshot stored at time of payout request
            $table->json('eligibility_snapshot')->nullable()->after('rejection_reason');

            $table->index(['equb_cycle_id', 'status']);
            $table->index(['equb_membership_id', 'equb_cycle_id']);
        });
    }

    public function down(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->dropForeign(['lottery_draw_id']);
            $table->dropColumn(['completed_at', 'lottery_draw_id', 'eligibility_snapshot']);
        });
    }
};
