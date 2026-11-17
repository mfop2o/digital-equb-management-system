<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->foreignId('equb_cycle_id')->nullable()->constrained('equb_cycles')->nullOnDelete();
            $table->foreignId('equb_membership_id')->constrained('equb_memberships')->cascadeOnDelete();
            $table->foreignId('member_profile_id')->constrained('member_profiles')->cascadeOnDelete();
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('payment_type', 24)->default('deposit'); // deposit, contribution, penalty, other
            $table->decimal('amount', 15, 2);
            $table->char('currency', 3)->default('ETB');
            $table->string('method', 24)->default('bank_transfer'); // bank_transfer, mobile_money, cash, cheque, other
            $table->string('reference', 100)->nullable();
            $table->date('paid_on');
            $table->string('status', 24)->default('submitted'); // submitted, under_review, verified, rejected, cancelled, reversed
            $table->string('idempotency_key', 100)->unique();
            $table->string('evidence_file_path', 255)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['equb_group_id', 'payment_type', 'status']);
            $table->index(['equb_membership_id', 'status']);
            $table->index(['member_profile_id', 'status']);
        });

        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->foreignId('deposit_obligation_id')->nullable()->constrained('deposit_obligations')->cascadeOnDelete();
            $table->unsignedBigInteger('contribution_obligation_id')->nullable();
            $table->unsignedBigInteger('penalty_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->timestamps();

            $table->index('deposit_obligation_id');
        });

        Schema::create('payment_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->string('decision', 24); // verified, rejected
            $table->decimal('amount_verified', 15, 2)->default(0.00);
            $table->foreignId('verifier_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('decided_at')->useCurrent();
            $table->string('reason', 500)->nullable();
            $table->timestamps();

            $table->index(['payment_id', 'decision']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_verifications');
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
    }
};
