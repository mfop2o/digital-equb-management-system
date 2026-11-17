<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number', 40)->unique();
            $table->string('receipt_type', 24)->default('payment'); // payment, payout, refund
            $table->string('receiptable_type', 60);
            $table->unsignedBigInteger('receiptable_id');
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->foreignId('member_profile_id')->constrained('member_profiles')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->char('currency', 3)->default('ETB');
            $table->timestamp('issued_at')->useCurrent();
            $table->foreignId('issued_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['receiptable_type', 'receiptable_id']);
            $table->index(['equb_group_id', 'receipt_type']);
            $table->index(['member_profile_id', 'issued_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
