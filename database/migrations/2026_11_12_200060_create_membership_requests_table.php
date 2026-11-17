<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->foreignId('member_profile_id')->constrained('member_profiles')->cascadeOnDelete();
            $table->string('requested_role', 32)->default('member');
            $table->string('status', 32)->default('pending')->index();
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['equb_group_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_requests');
    }
};
