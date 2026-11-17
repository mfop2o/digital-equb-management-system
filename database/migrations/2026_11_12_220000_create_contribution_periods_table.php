<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contribution_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->foreignId('equb_cycle_id')->nullable()->constrained('equb_cycles')->cascadeOnDelete();
            $table->unsignedSmallInteger('sequence');
            $table->string('label', 100);
            $table->date('opens_on');
            $table->date('due_on');
            $table->date('closes_on');
            $table->string('status', 24)->default('pending'); // pending, open, closed, locked
            $table->decimal('amount_due_snapshot', 15, 2);
            $table->unsignedSmallInteger('grace_days_snapshot')->default(0);
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            $table->unique(['equb_group_id', 'sequence']);
            $table->index(['equb_group_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contribution_periods');
    }
};
