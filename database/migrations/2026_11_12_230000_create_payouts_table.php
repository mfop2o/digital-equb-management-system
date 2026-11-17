<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->foreignId('equb_cycle_id')->nullable()->constrained('equb_cycles')->nullOnDelete();
            $table->foreignId('equb_membership_id')->constrained('equb_memberships')->cascadeOnDelete();
            $table->foreignId('member_profile_id')->constrained('member_profiles')->cascadeOnDelete();
            $table->unsignedSmallInteger('payout_sequence');
            $table->decimal('amount', 15, 2);
            $table->char('currency', 3)->default('ETB');
            $table->string('status', 24)->default('scheduled'); // scheduled, pending_approval, approved, disbursed, cancelled
            $table->string('method', 24)->nullable(); // cash, bank_transfer, mobile_money
            $table->string('account_reference', 150)->nullable();
            $table->date('scheduled_on')->nullable();
            $table->date('disbursed_on')->nullable();
            $table->string('disbursement_reference', 100)->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('disbursed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->string('rejection_reason', 500)->nullable();
            $table->timestamps();

            $table->unique(['equb_group_id', 'payout_sequence']);
            $table->index(['equb_group_id', 'status']);
            $table->index(['equb_membership_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
