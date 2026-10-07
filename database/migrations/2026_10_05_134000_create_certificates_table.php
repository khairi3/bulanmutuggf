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
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('certificate_number')->unique();
            $table->string('type')->default('participation'); // participation, finalist, winner
            $table->string('role_in_team')->default('Anggota Tim'); // Ketua Tim, Anggota Tim
            $table->string('award_title')->nullable(); // e.g. Juara 1 Lean Six Sigma
            $table->date('issued_at');
            $table->string('verify_code', 64)->unique();
            $table->timestamps();

            $table->unique(['project_id', 'employee_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
