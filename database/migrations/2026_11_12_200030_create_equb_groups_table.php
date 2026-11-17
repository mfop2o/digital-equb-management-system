<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equb_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('group_code', 32)->unique();
            $table->text('description')->nullable();
            $table->string('category', 100)->nullable();
            $table->string('status', 32)->default('draft')->index();
            $table->unsignedInteger('max_members')->default(50);
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['name', 'status']);
        });

        // Add foreign key constraint to the equb_group_user pivot table created in earlier migration
        if (Schema::hasTable('equb_group_user')) {
            Schema::table('equb_group_user', function (Blueprint $table) {
                $table->foreign('equb_group_id')->references('id')->on('equb_groups')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('equb_group_user')) {
            Schema::table('equb_group_user', function (Blueprint $table) {
                $table->dropForeign(['equb_group_id']);
            });
        }

        Schema::dropIfExists('equb_groups');
    }
};
