<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equb_group_rules', function (Blueprint $table) {
            $table->string('membership_mode', 32)->default('approval_required')->after('expected_members');
        });
    }

    public function down(): void
    {
        Schema::table('equb_group_rules', function (Blueprint $table) {
            $table->dropColumn('membership_mode');
        });
    }
};
