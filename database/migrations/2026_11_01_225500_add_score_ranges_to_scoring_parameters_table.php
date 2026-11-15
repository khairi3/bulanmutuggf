<?php

use App\Models\Stream;
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
        Schema::table('scoring_parameters', function (Blueprint $table) {
            $table->decimal('min_score', 5, 2)->default(1.00)->after('weight');
            $table->decimal('max_score', 5, 2)->default(5.00)->after('min_score');
            $table->decimal('not_pass_min', 5, 2)->default(1.00)->after('max_score');
            $table->decimal('not_pass_max', 5, 2)->default(1.00)->after('not_pass_min');
            $table->decimal('follow_up_min', 5, 2)->default(2.00)->after('not_pass_max');
            $table->decimal('follow_up_max', 5, 2)->default(3.00)->after('follow_up_min');
            $table->decimal('pass_min', 5, 2)->default(4.00)->after('follow_up_max');
            $table->decimal('pass_max', 5, 2)->default(5.00)->after('pass_min');
            $table->string('not_pass_label')->nullable()->after('pass_max');
            $table->string('follow_up_label')->nullable()->after('not_pass_label');
            $table->string('pass_label')->nullable()->after('follow_up_label');
        });

        // Set default 1-15 range for EMI stream (Energy Management Implementation)
        $energyStream = Stream::where('code', Stream::CODE_ENERGY)->first();
        if ($energyStream) {
            $energyStream->scoringParameters()->update([
                'min_score' => 1.00,
                'max_score' => 15.00,
                'not_pass_min' => 1.00,
                'not_pass_max' => 5.00,
                'follow_up_min' => 6.00,
                'follow_up_max' => 10.00,
                'pass_min' => 11.00,
                'pass_max' => 15.00,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scoring_parameters', function (Blueprint $table) {
            $table->dropColumn([
                'min_score',
                'max_score',
                'not_pass_min',
                'not_pass_max',
                'follow_up_min',
                'follow_up_max',
                'pass_min',
                'pass_max',
                'not_pass_label',
                'follow_up_label',
                'pass_label',
            ]);
        });
    }
};
