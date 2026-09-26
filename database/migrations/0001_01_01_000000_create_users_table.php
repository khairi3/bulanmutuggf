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
        // 1. Employees table (Master Data Karyawan)
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_index', 50)->unique();
            $table->string('full_name')->index();
            $table->string('employee_level', 50)->nullable();
            $table->string('position')->nullable();
            $table->string('unit', 100)->nullable();
            $table->string('division', 100)->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone', 30)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        // 2. Users table (Autentikasi 1 karyawan = 1 akun)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->unique()->constrained('employees')->cascadeOnDelete();
            $table->string('password');
            $table->boolean('must_change_password')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // 3. Roles table (5 roles: admin, participant, verifier, judge, viewer)
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 100);
            $table->timestamps();
        });

        // 4. User Roles pivot table
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'role_id']);
        });

        // 5. Assignments table (Verifikator & Juri per stream/kategori)
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('stream_id')->nullable()->index();
            $table->enum('stage', ['verification', 'judging']);
            $table->unsignedBigInteger('category_option_id')->nullable()->index();
            $table->timestamps();
        });

        // 6. Audit Logs table (Append-only)
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100)->index();
            $table->string('entity_type', 100)->index();
            $table->unsignedBigInteger('entity_id')->nullable()->index();
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->text('reason')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });

        // 7. Password reset tokens table (by employee index or email)
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('employee_index', 50)->primary();
            $table->string('email')->nullable()->index();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // 8. Sessions table for database session driver
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('users');
        Schema::dropIfExists('employees');
    }
};
