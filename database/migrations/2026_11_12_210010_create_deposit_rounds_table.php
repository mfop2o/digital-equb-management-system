<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposit_rounds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->foreignId('equb_cycle_id')->nullable()->constrained('equb_cycles')->cascadeOnDelete();
            $table->unsignedTinyInteger('sequence')->default(1);
            $table->string('label', 100);
            $table->decimal('amount_per_member', 15, 2);
            $table->date('opens_on');
            $table->date('due_on');
            $table->date('closes_on');
            $table->string('status', 24)->default('pending'); // pending, open, closed, approved, cancelled
            $table->boolean('requires_previous_close')->default(true);
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['equb_group_id', 'sequence']);
            $table->index(['equb_group_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposit_rounds');
    }
};
