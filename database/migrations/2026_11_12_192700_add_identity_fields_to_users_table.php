<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add identity lifecycle fields to the users table.
     *
     * Users are never hard-deleted once financial data references them, so
     * deactivation is modelled explicitly. `must_change_password` forces a
     * rotation after an administrator sets a temporary password.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('status', 32)->default('active')->after('email_verified_at')->index();
            $table->timestamp('last_login_at')->nullable()->after('status');
            $table->timestamp('deactivated_at')->nullable()->after('last_login_at');
            $table->string('deactivation_reason', 500)->nullable()->after('deactivated_at');
            $table->boolean('must_change_password')->default(false)->after('deactivation_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn([
                'status',
                'last_login_at',
                'deactivated_at',
                'deactivation_reason',
                'must_change_password',
            ]);
        });
    }
};
