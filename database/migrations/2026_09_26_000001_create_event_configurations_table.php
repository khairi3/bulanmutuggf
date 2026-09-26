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
        // 1. Events Table
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->unsignedSmallInteger('year')->index();
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft')->index();
            $table->decimal('final_weight_verification', 5, 2)->default(40.00);
            $table->decimal('final_weight_judging', 5, 2)->default(60.00);
            $table->timestamps();
        });

        // 2. Streams Table
        Schema::create('streams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('code', 30)->index(); // CIC, K3, ENERGY
            $table->string('name', 100);
            $table->string('code_pattern', 100)->default('{LEVEL}{IMPROVEMENT}{AREA}');
            $table->unsignedTinyInteger('team_min')->default(3);
            $table->unsignedTinyInteger('team_max')->default(7);
            $table->unsignedTinyInteger('max_projects_per_employee')->default(2);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        // 3. Phases Table
        Schema::create('phases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stream_id')->constrained('streams')->cascadeOnDelete();
            $table->enum('phase_type', ['registration', 'verification', 'selection', 'finalisation', 'judging', 'announcement'])->index();
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->boolean('is_locked')->default(false);
            $table->timestamps();

            $table->unique(['stream_id', 'phase_type']);
        });

        // 4. Category Dimensions Table
        Schema::create('category_dimensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stream_id')->constrained('streams')->cascadeOnDelete();
            $table->string('code', 30)->index(); // LEVEL, IMPROVEMENT, AREA, SIGAP
            $table->string('name', 100);
            $table->unsignedTinyInteger('code_order')->default(1);
            $table->boolean('is_required')->default(true);
            $table->timestamps();

            $table->unique(['stream_id', 'code']);
        });

        // 5. Category Options Table
        Schema::create('category_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dimension_id')->constrained('category_dimensions')->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('abbreviation', 30)->index();
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->unsignedSmallInteger('quota')->nullable();
            $table->timestamps();
        });

        // 6. Scoring Parameters Table
        Schema::create('scoring_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stream_id')->constrained('streams')->cascadeOnDelete();
            $table->enum('stage', ['verification', 'judging'])->index();
            $table->string('name', 150);
            $table->text('rubric')->nullable();
            $table->decimal('weight', 5, 2);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // 7. Registration Sequences Table
        Schema::create('registration_sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stream_id')->constrained('streams')->cascadeOnDelete();
            $table->string('prefix', 50)->index();
            $table->unsignedInteger('last_number')->default(0);
            $table->timestamps();

            $table->unique(['stream_id', 'prefix']);
        });

        // 8. Add foreign keys for assignments table (Phase 1 stubbed FKs)
        Schema::table('assignments', function (Blueprint $table) {
            $table->foreign('stream_id')->references('id')->on('streams')->nullOnDelete();
            $table->foreign('category_option_id')->references('id')->on('category_options')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropForeign(['stream_id']);
            $table->dropForeign(['category_option_id']);
        });

        Schema::dropIfExists('registration_sequences');
        Schema::dropIfExists('scoring_parameters');
        Schema::dropIfExists('category_options');
        Schema::dropIfExists('category_dimensions');
        Schema::dropIfExists('phases');
        Schema::dropIfExists('streams');
        Schema::dropIfExists('events');
    }
};
