<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposit_obligations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deposit_round_id')->constrained('deposit_rounds')->cascadeOnDelete();
            $table->foreignId('equb_membership_id')->constrained('equb_memberships')->cascadeOnDelete();
            $table->foreignId('member_profile_id')->constrained('member_profiles')->cascadeOnDelete();
            $table->decimal('amount_due', 15, 2);
            $table->decimal('amount_paid', 15, 2)->default(0.00);
            $table->date('due_on');
            $table->unsignedSmallInteger('grace_days')->default(0);
            $table->string('status', 24)->default('pending'); // pending, submitted, verified, overdue, exempt
            $table->boolean('is_exempt')->default(false);
            $table->string('exemption_reason', 255)->nullable();
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamps();

            $table->unique(['deposit_round_id', 'equb_membership_id']);
            $table->index(['deposit_round_id', 'status']);
            $table->index(['member_profile_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposit_obligations');
    }
};
