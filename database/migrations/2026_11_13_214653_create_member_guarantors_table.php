<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_guarantors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_profile_id')->constrained('member_profiles')->cascadeOnDelete();
            $table->string('guarantor_first_name', 100);
            $table->string('guarantor_middle_name', 100)->nullable();
            $table->string('guarantor_last_name', 100);
            $table->string('guarantor_phone', 32)->nullable();
            $table->string('guarantor_relationship', 100)->nullable();
            $table->string('guarantor_address', 255)->nullable();
            $table->string('guarantor_id_type', 32)->nullable();
            $table->string('guarantor_id_number', 100)->nullable();
            $table->string('guarantor_occupation', 150)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->index(['member_profile_id', 'is_primary']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_guarantors');
    }
};
