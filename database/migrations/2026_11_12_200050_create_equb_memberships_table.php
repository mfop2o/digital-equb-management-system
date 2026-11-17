<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equb_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->foreignId('member_profile_id')->constrained('member_profiles')->cascadeOnDelete();
            $table->string('membership_number', 32)->unique();
            $table->string('role', 32)->default('member');
            $table->unsignedInteger('payout_order_number')->nullable();
            $table->string('status', 32)->default('active')->index();
            $table->timestamp('joined_at')->useCurrent();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('terms_accepted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['equb_group_id', 'member_profile_id']);
            $table->index(['equb_group_id', 'status']);
            $table->index(['equb_group_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equb_memberships');
    }
};
