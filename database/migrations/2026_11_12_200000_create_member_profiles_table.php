<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('member_number', 32)->unique();
            $table->string('first_name', 100);
            $table->string('middle_name', 100);
            $table->string('last_name', 100);
            $table->string('phone', 32);
            $table->string('phone_normalized', 32)->unique();
            $table->string('alternative_phone', 32)->nullable();
            $table->string('email', 255)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 16)->nullable();
            $table->string('occupation', 150)->nullable();
            $table->string('address_city', 100)->default('Addis Ababa');
            $table->string('address_subcity', 100)->nullable();
            $table->string('address_woreda', 50)->nullable();
            $table->string('address_house_no', 50)->nullable();
            $table->string('status', 32)->default('active')->index();
            $table->string('kyc_status', 32)->default('unverified')->index();
            $table->string('profile_photo_path', 500)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['first_name', 'last_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_profiles');
    }
};
