<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_identifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_profile_id')->constrained('member_profiles')->cascadeOnDelete();
            $table->string('id_type', 32);
            $table->string('id_number', 100);
            $table->date('issue_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('issuing_authority', 150)->nullable();
            $table->string('id_card_front_path', 500)->nullable();
            $table->string('id_card_back_path', 500)->nullable();
            $table->boolean('is_primary')->default(true);
            $table->timestamps();

            $table->index(['id_type', 'id_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_identifications');
    }
};
