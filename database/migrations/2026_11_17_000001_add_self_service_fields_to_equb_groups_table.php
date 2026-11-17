<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equb_groups', function (Blueprint $table) {
            $table->string('visibility', 20)->default('public')->after('status');
            $table->string('location', 120)->nullable()->after('category');
            $table->string('invite_code', 32)->nullable()->unique()->after('max_members');

            $table->index(['visibility', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('equb_groups', function (Blueprint $table) {
            $table->dropIndex(['visibility', 'status']);
            $table->dropColumn(['visibility', 'location', 'invite_code']);
        });
    }
};
