<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. CFG-08: Bobot nilai akhir per stream (Verifikasi vs Juri)
        Schema::table('streams', function (Blueprint $table) {
            $table->unsignedTinyInteger('verification_weight')->default(30)->after('is_active');
            $table->unsignedTinyInteger('judging_weight')->default(70)->after('verification_weight');
        });

        // 2. REP-01: Gelar juara & bobot pada final_results
        Schema::table('final_results', function (Blueprint $table) {
            $table->unsignedTinyInteger('verification_weight')->default(30)->after('judging_score');
            $table->unsignedTinyInteger('judging_weight')->default(70)->after('verification_weight');
            $table->string('award_title', 100)->nullable()->after('rank_in_category');
        });

        // 3. PAR-09: Resolusi feedback
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->timestamp('resolved_at')->nullable()->after('is_resolved');
            $table->foreignId('resolved_by')->nullable()->after('resolved_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('resolved_by');
            $table->dropColumn('resolved_at');
        });

        Schema::table('final_results', function (Blueprint $table) {
            $table->dropColumn(['verification_weight', 'judging_weight', 'award_title']);
        });

        Schema::table('streams', function (Blueprint $table) {
            $table->dropColumn(['verification_weight', 'judging_weight']);
        });
    }
};
