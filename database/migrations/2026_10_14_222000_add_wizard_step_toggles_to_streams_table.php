<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('streams', function (Blueprint $table) {
            $table->boolean('enable_team')->default(true)->after('code_pattern');
            $table->boolean('enable_categories')->default(true)->after('enable_team');
            $table->boolean('enable_charter')->default(true)->after('enable_categories');
            $table->boolean('enable_attachments')->default(true)->after('enable_charter');
        });

        // Set Energy Management stream to disable charter step by default as requested
        DB::table('streams')
            ->where('code', 'ENERGY')
            ->update(['enable_charter' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('streams', function (Blueprint $table) {
            $table->dropColumn([
                'enable_team',
                'enable_categories',
                'enable_charter',
                'enable_attachments',
            ]);
        });
    }
};
