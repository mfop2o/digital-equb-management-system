<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equb_group_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->decimal('contribution_amount', 15, 2);
            $table->string('contribution_frequency', 32)->default('monthly');
            $table->unsignedInteger('expected_members')->default(10);

            // Initial deposit settings (confirmed: accumulated and retained; distribution policy pending)
            $table->unsignedInteger('initial_deposit_rounds')->default(0);
            $table->decimal('initial_deposit_amount', 15, 2)->default(0.00);
            $table->string('initial_deposit_treatment', 32)->default('retained');

            // Payout commencement & rotation (Business decision D-02 and D-06 defaults)
            $table->string('payout_commencement_rule', 50)->default('deposit_completion_and_date');
            $table->date('payout_commencement_date')->nullable();
            $table->string('rotation_method', 32)->default('predetermined');

            // Financial & penalty rules (Business decisions D-05, D-07, D-08 defaults)
            $table->boolean('allow_partial_contributions')->default(false);
            $table->boolean('late_penalty_enabled')->default(true);
            $table->decimal('late_penalty_fixed_amount', 15, 2)->default(0.00);
            $table->decimal('late_penalty_daily_rate', 5, 2)->default(0.00);
            $table->unsignedInteger('late_penalty_grace_days')->default(3);
            $table->string('withdrawal_refund_treatment', 32)->default('deferred_cycle_end');

            $table->longText('terms_and_conditions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('version')->default(1);
            $table->foreignId('configured_by_user_id')->constrained('users');
            $table->timestamps();

            $table->index(['equb_group_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equb_group_rules');
    }
};
