<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('type', 32)->default('general');
            // For rule_change decisions: the proposed rule fields. Kept as a
            // snapshot so a passed decision can be applied to a new rule
            // version exactly as voted.
            $table->json('decision_payload')->nullable();
            $table->string('status', 16)->default('open')->index();
            $table->timestamp('closes_at')->index();
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->foreignId('closed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->unsignedInteger('approves_count')->default(0);
            $table->unsignedInteger('rejects_count')->default(0);
            $table->unsignedInteger('abstains_count')->default(0);
            $table->timestamps();

            $table->index(['equb_group_id', 'status']);
        });

        Schema::create('group_decision_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_decision_id')->constrained('group_decisions')->cascadeOnDelete();
            // One vote per user per decision. Members vote with their user
            // account; the active membership is validated at vote time.
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('vote', 8); // approve | reject | abstain
            $table->timestamp('voted_at')->useCurrent();

            $table->unique(['group_decision_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_decision_votes');
        Schema::dropIfExists('group_decisions');
    }
};
