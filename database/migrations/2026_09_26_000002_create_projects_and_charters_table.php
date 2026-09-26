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
        // 1. Projects Table
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stream_id')->constrained('streams')->cascadeOnDelete();
            $table->string('registration_code', 50)->nullable()->unique();
            $table->string('title', 150);
            $table->string('status', 50)->default('draft')->index();
            $table->foreignId('leader_employee_id')->constrained('employees')->cascadeOnDelete();
            $table->unsignedBigInteger('current_version_id')->nullable()->index();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('finalised_at')->nullable();
            $table->boolean('is_locked')->default(false);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['stream_id', 'status']);
            $table->index('leader_employee_id');
        });

        // 2. Project Categories Pivot Table
        Schema::create('project_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('category_option_id')->constrained('category_options')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['project_id', 'category_option_id']);
        });

        // 3. Team Members Table
        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('member_role', 20)->default('member'); // leader, member
            $table->boolean('can_edit')->default(false);
            $table->timestamps();

            $table->unique(['project_id', 'employee_id']);
        });

        // 4. Charter Versions (Immutable Snapshots)
        Schema::create('charter_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->unsignedSmallInteger('version_no');
            $table->string('title', 150);
            $table->text('executive_summary')->nullable();
            $table->text('problem_statement')->nullable();
            $table->text('goal_statement')->nullable();
            $table->json('milestones')->nullable();
            $table->json('initiatives')->nullable();
            $table->json('results')->nullable();
            $table->string('change_note', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['project_id', 'version_no']);
        });

        // 5. Project Files Table
        Schema::create('project_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->unsignedBigInteger('charter_version_id')->nullable()->index();
            $table->string('file_category', 50)->default('supporting'); // supporting, final_presentation, final_video, visit_photo
            $table->string('storage_path', 255)->nullable();
            $table->string('external_url', 500)->nullable();
            $table->string('original_name', 255);
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        // 6. In-App Notifications Table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 50)->index();
            $table->string('title', 200);
            $table->text('message');
            $table->string('link', 255)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('project_files');
        Schema::dropIfExists('charter_versions');
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('project_categories');
        Schema::dropIfExists('projects');
    }
};
