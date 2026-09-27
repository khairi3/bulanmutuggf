<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Project;
use App\Models\ScoreSheet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controller Pembukaan Kunci Project dan Lembar Nilai (ADM-04, ADM-07).
 */
class AdminUnlockController extends Controller
{
    /**
     * Buka kunci project yang terkunci/finalised agar peserta dapat memperbaiki materi (ADM-04).
     */
    public function unlockProject(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole('admin')) {
            abort(403, 'Hanya Administrator yang berwenang membuka kunci project.');
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ], [
            'reason.required' => 'Alasan pembukaan kunci project wajib dicantumkan dalam audit log.',
            'reason.min' => 'Alasan minimal 5 karakter.',
        ]);

        $before = [
            'is_locked' => $project->is_locked,
            'status' => $project->status,
        ];

        DB::transaction(function () use ($project, $validated, $user, $before) {
            $newStatus = $project->status === Project::STATUS_FINALISED ? Project::STATUS_QUALIFIED : $project->status;

            $project->update([
                'is_locked' => false,
                'status' => $newStatus,
            ]);

            AuditLog::log(
                action: 'UNLOCK_PROJECT',
                entityType: 'Project',
                entityId: $project->id,
                before: $before,
                after: ['is_locked' => false, 'status' => $newStatus],
                reason: $validated['reason'],
                userId: $user->id
            );
        });

        return back()->with('success', "Kunci project {$project->registration_code} berhasil dibuka. Peserta kini dapat mengunggah revisi berkas.");
    }

    /**
     * Buka kunci lembar nilai verifikator atau juri agar evaluator dapat memperbaiki penilaian (ADM-04).
     */
    public function unlockScoreSheet(Request $request, ScoreSheet $scoreSheet): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole('admin')) {
            abort(403, 'Hanya Administrator yang berwenang membuka kunci lembar nilai.');
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ], [
            'reason.required' => 'Alasan pembukaan kunci lembar nilai wajib dicantumkan dalam audit log.',
            'reason.min' => 'Alasan minimal 5 karakter.',
        ]);

        $before = [
            'status' => $scoreSheet->status,
            'submitted_at' => $scoreSheet->submitted_at,
        ];

        DB::transaction(function () use ($scoreSheet, $validated, $user, $before) {
            $scoreSheet->update([
                'status' => 'draft',
                'submitted_at' => null,
            ]);

            AuditLog::log(
                action: 'UNLOCK_SCORE_SHEET',
                entityType: 'ScoreSheet',
                entityId: $scoreSheet->id,
                before: $before,
                after: ['status' => 'draft', 'submitted_at' => null],
                reason: $validated['reason'],
                userId: $user->id
            );
        });

        $roleName = $scoreSheet->stage === 'verification' ? 'verifikator' : 'juri';

        return back()->with('success', "Lembar nilai {$roleName} berhasil dibuka kembali menjadi draf untuk project {$scoreSheet->project?->registration_code}.");
    }
}
