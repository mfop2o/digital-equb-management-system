<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equb_cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->unsignedSmallInteger('cycle_number')->default(1);
            $table->string('status', 24)->default('planned');
            $table->foreignId('rule_version_id')->nullable()->constrained('equb_group_rules')->nullOnDelete();
            $table->json('rule_snapshot')->nullable();
            $table->date('started_on')->nullable();
            $table->date('deposit_stage_closed_on')->nullable();
            $table->date('activated_on')->nullable();
            $table->date('closing_started_on')->nullable();
            $table->date('closed_on')->nullable();
            $table->text('closure_notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['equb_group_id', 'cycle_number']);
            $table->index(['equb_group_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equb_cycles');
    }
};
