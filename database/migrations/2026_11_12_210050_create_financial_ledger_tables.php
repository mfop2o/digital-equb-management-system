<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('scope_key', 40); // 'org' or 'group:{id}'
            $table->foreignId('equb_group_id')->nullable()->constrained('equb_groups')->cascadeOnDelete();
            $table->string('code', 10); // e.g. 1010, 2010
            $table->string('name', 150);
            $table->string('type', 24); // asset, liability, equity, income, expense
            $table->string('subtype', 32)->nullable(); // cash, bank, mobile_money, receivable, fund, etc.
            $table->char('currency', 3)->default('ETB');
            $table->boolean('is_system')->default(true);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['scope_key', 'code']);
            $table->index(['equb_group_id', 'type']);
        });

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->string('entry_number', 40)->unique();
            $table->foreignId('equb_group_id')->constrained('equb_groups')->cascadeOnDelete();
            $table->foreignId('equb_cycle_id')->nullable()->constrained('equb_cycles')->nullOnDelete();
            $table->date('entry_date');
            $table->string('description', 255);
            $table->string('source_type', 60); // payments, payouts, etc.
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('posting_key', 120)->unique();
            $table->foreignId('reversal_of_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('posted_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['equb_group_id', 'entry_date']);
            $table->index(['source_type', 'source_id']);
        });

        Schema::create('journal_entry_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->unsignedSmallInteger('line_number');
            $table->foreignId('financial_account_id')->constrained('financial_accounts')->cascadeOnDelete();
            $table->foreignId('member_profile_id')->nullable()->constrained('member_profiles')->nullOnDelete();
            $table->decimal('debit', 15, 2)->default(0.00);
            $table->decimal('credit', 15, 2)->default(0.00);
            $table->string('memo', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['journal_entry_id', 'line_number']);
            $table->index(['financial_account_id', 'journal_entry_id']);
            $table->index('member_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_entry_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('financial_accounts');
    }
};
