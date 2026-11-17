<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penalties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->foreignId('equb_membership_id')->constrained('equb_memberships')->cascadeOnDelete();
            $table->foreignId('member_profile_id')->constrained('member_profiles')->cascadeOnDelete();
            $table->foreignId('contribution_obligation_id')->nullable()->constrained('contribution_obligations')->nullOnDelete();
            $table->string('reason', 255);
            $table->decimal('amount', 15, 2);
            $table->char('currency', 3)->default('ETB');
            $table->string('status', 24)->default('pending'); // pending, paid, waived
            $table->timestamp('assessed_at')->useCurrent();
            $table->foreignId('assessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('waived_at')->nullable();
            $table->foreignId('waived_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('waiver_reason')->nullable();
            $table->timestamps();

            $table->index(['equb_group_id', 'status']);
            $table->index(['equb_membership_id', 'status']);
            $table->index(['member_profile_id', 'status']);
        });

        Schema::create('penalty_waiver_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penalty_id')->constrained('penalties')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->text('reason');
            $table->string('status', 24)->default('pending'); // pending, approved, rejected
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('decision_reason')->nullable();
            $table->timestamps();

            $table->index(['penalty_id', 'status']);
        });

        Schema::create('member_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->foreignId('equb_membership_id')->constrained('equb_memberships')->cascadeOnDelete();
            $table->foreignId('member_profile_id')->constrained('member_profiles')->cascadeOnDelete();
            $table->text('reason');
            $table->string('status', 24)->default('requested'); // requested, approved, rejected, settled
            $table->string('settlement_type', 32)->default('deferred_cycle_end'); // deferred_cycle_end, immediate, no_refund
            $table->decimal('settlement_amount', 15, 2)->default(0.00);
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('settled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('settled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['equb_group_id', 'status']);
            $table->index(['equb_membership_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_withdrawals');
        Schema::dropIfExists('penalty_waiver_requests');
        Schema::dropIfExists('penalties');
    }
};
