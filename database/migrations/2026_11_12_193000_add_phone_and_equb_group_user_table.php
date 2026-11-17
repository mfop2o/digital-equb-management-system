<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add member/staff phone identity and the group assignment pivot.
     *
     * `equb_group_user` deliberately has no foreign key to `equb_groups` yet:
     * that table is created in Phase 3. The pivot already uses the final column
     * names so Phase 3 only needs to add the missing constraint.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 32)->nullable()->after('email');
            $table->string('phone_normalized', 32)->nullable()->unique()->after('phone');
        });

        Schema::create('equb_group_user', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('equb_group_id')->index();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 32)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['equb_group_id', 'user_id']);
            $table->index(['user_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equb_group_user');

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['phone_normalized']);
            $table->dropColumn(['phone', 'phone_normalized']);
        });
    }
};
