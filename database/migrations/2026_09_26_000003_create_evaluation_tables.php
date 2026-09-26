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
        // 1. Feedbacks (VER-05, PAR-08, PAR-09) - threaded via parent_id
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('author_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('feedbacks')->cascadeOnDelete();
            $table->string('charter_section', 50)->nullable();
            $table->text('body');
            $table->string('status', 20)->default('draft'); // draft, sent
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['project_id', 'status']);
        });

        // 2. Verification Visits (VER-04) - photos live in project_files (visit_photo)
        Schema::create('verification_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('verifier_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('visit_date');
            $table->string('location', 200);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->foreignId('verification_visit_id')->nullable()->after('charter_version_id')
                ->constrained('verification_visits')->nullOnDelete();
        });

        // 3. Score Sheets (one per project x scorer x stage)
        Schema::create('score_sheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('scorer_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('stage', 20); // verification, judging
            $table->string('status', 20)->default('draft'); // draft, submitted
            $table->decimal('total_weighted', 6, 2)->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'scorer_user_id', 'stage']);
            $table->index(['project_id', 'stage']);
        });

        // 4. Score Items (score 0-100 per parameter)
        Schema::create('score_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('score_sheet_id')->constrained('score_sheets')->cascadeOnDelete();
            $table->foreignId('parameter_id')->constrained('scoring_parameters')->cascadeOnDelete();
            $table->decimal('score', 5, 2)->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['score_sheet_id', 'parameter_id']);
        });

        // 5. Selection Decisions (VER-09, ADM-03) - one per project
        Schema::create('selection_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained('projects')->cascadeOnDelete();
            $table->string('decision', 20); // qualified, not_qualified
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });

        // 6. Final Results (REP-01) - recomputed on recap, locked on publish
        Schema::create('final_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained('projects')->cascadeOnDelete();
            $table->foreignId('ranking_option_id')->nullable()->constrained('category_options')->nullOnDelete();
            $table->decimal('verification_score', 6, 2)->nullable();
            $table->decimal('judging_score', 6, 2)->nullable();
            $table->decimal('final_score', 6, 2)->nullable();
            $table->unsignedSmallInteger('rank_in_category')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        // 7. Publication markers per stream (selection + results announcement)
        Schema::table('streams', function (Blueprint $table) {
            $table->timestamp('selection_published_at')->nullable()->after('is_active');
            $table->timestamp('results_published_at')->nullable()->after('selection_published_at');
            $table->boolean('auto_finalise')->default(true)->after('results_published_at');
        });

        // 8. Registration code history (kode lama disimpan saat kategori diubah Admin)
        Schema::table('projects', function (Blueprint $table) {
            $table->json('code_history')->nullable()->after('registration_code');
        });

        // 9. Broadcast announcements (ADM-08)
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stream_id')->nullable()->constrained('streams')->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('body');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('code_history');
        });

        Schema::table('streams', function (Blueprint $table) {
            $table->dropColumn(['selection_published_at', 'results_published_at', 'auto_finalise']);
        });

        Schema::dropIfExists('final_results');
        Schema::dropIfExists('selection_decisions');
        Schema::dropIfExists('score_items');
        Schema::dropIfExists('score_sheets');

        Schema::table('project_files', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verification_visit_id');
        });

        Schema::dropIfExists('verification_visits');
        Schema::dropIfExists('feedbacks');
    }
};
