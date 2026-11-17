<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lottery draws — one per payout round/sequence position.
     *
     * Business rules (confirmed):
     * - A separate lottery occurs for each payout round.
     * - A member can receive only one payout per cycle.
     * - Previous winners are excluded from subsequent lotteries.
     * - Members with overdue contributions are excluded.
     * - Members must have current required contribution verified before receiving payout.
     * - Record participants, selected winner, date, time, round, and audit information.
     * - Lottery results must not be silently changed or replaced (append-only winner record).
     */
    public function up(): void
    {
        Schema::create('lottery_draws', function (Blueprint $table) {
            $table->id();

            $table->foreignId('equb_group_id')
                ->constrained('equb_groups')
                ->restrictOnDelete();

            $table->foreignId('equb_cycle_id')
                ->constrained('equb_cycles')
                ->restrictOnDelete();

            // Which payout sequence position this draw is for
            $table->unsignedSmallInteger('payout_sequence');

            // Status: pending → conducted → winner_confirmed → cancelled
            $table->string('status', 24)->default('pending');

            // The winning membership (set when winner_confirmed)
            $table->foreignId('winning_membership_id')
                ->nullable()
                ->constrained('equb_memberships')
                ->restrictOnDelete();

            // Serialized list of eligible membership IDs at time of draw
            $table->json('eligible_participants')->nullable();

            // Count snapshot for audit
            $table->unsignedSmallInteger('eligible_count')->default(0);

            // The draw method used: random_server | committee | predetermined
            $table->string('draw_method', 32)->default('random_server');

            // Server-side randomness seed/evidence for auditability
            $table->string('random_seed', 255)->nullable();

            // JSON evidence blob: contains algorithm, seed, draw result, excluded members, reasons
            $table->json('draw_evidence')->nullable();

            // Who conducted the draw
            $table->foreignId('conducted_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('conducted_at')->nullable();

            // Witness information (name, role, signature reference)
            $table->string('witnessed_by_name', 150)->nullable();
            $table->string('witnessed_by_role', 100)->nullable();

            // Notes / override justification
            $table->text('notes')->nullable();

            // Immutability guard: once winner_confirmed, this row must not change
            // (enforced at service layer; this column helps detect tampering)
            $table->string('result_hash', 64)->nullable();

            $table->timestamps();

            // One draw per payout sequence per cycle
            $table->unique(['equb_cycle_id', 'payout_sequence'], 'lottery_draws_cycle_sequence_unique');
            $table->index(['equb_group_id', 'status']);
            $table->index(['equb_cycle_id', 'status']);
        });

        // Participants junction — which memberships were eligible at draw time
        Schema::create('lottery_draw_participants', function (Blueprint $table) {
            $table->id();

            $table->foreignId('lottery_draw_id')
                ->constrained('lottery_draws')
                ->restrictOnDelete();

            $table->foreignId('equb_membership_id')
                ->constrained('equb_memberships')
                ->restrictOnDelete();

            // Was this member eligible (true) or excluded (false)?
            $table->boolean('is_eligible')->default(true);

            // If excluded, why
            $table->string('exclusion_reason', 255)->nullable();

            $table->timestamps();

            $table->unique(['lottery_draw_id', 'equb_membership_id'], 'ldp_draw_membership_unique');
            $table->index('lottery_draw_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lottery_draw_participants');
        Schema::dropIfExists('lottery_draws');
    }
};
