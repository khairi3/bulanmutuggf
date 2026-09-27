<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Stream;
use App\Services\SelectionService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SelectionController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected SelectionService $selectionService,
    ) {}

    /**
     * Halaman Seleksi Convention Day (VER-09, ADM-03).
     */
    public function index(Request $request): Response
    {
        $streams = Stream::where('is_active', true)->get();
        $streamId = $request->input('stream_id', $streams->first()?->id);
        $selectedStream = $streams->firstWhere('id', $streamId) ?? $streams->first();

        $rankings = $selectedStream
            ? $this->selectionService->ranking($selectedStream)
            : collect();

        return Inertia::render('Admin/Selection/Index', [
            'streams' => $streams,
            'selectedStream' => $selectedStream,
            'rankings' => $rankings,
            'isPublished' => $selectedStream?->isSelectionPublished() ?? false,
            'publishedAt' => $selectedStream?->selection_published_at?->format('d M Y H:i'),
        ]);
    }

    /**
     * Simpan Draf Keputusan Seleksi (VER-09).
     */
    public function storeDraft(Request $request): RedirectResponse
    {
        $request->validate([
            'stream_id' => ['required', 'exists:streams,id'],
            'project_ids' => ['required', 'array'],
            'project_ids.*' => ['exists:projects,id'],
            'qualified_ids' => ['nullable', 'array'],
            'qualified_ids.*' => ['exists:projects,id'],
        ]);

        $stream = Stream::findOrFail($request->input('stream_id'));
        $projectIds = $request->input('project_ids', []);
        $qualifiedIds = $request->input('qualified_ids', []);

        $this->selectionService->saveDecisions($stream, $projectIds, $qualifiedIds, $request->user());

        return back()->with('success', 'Draf keputusan seleksi berhasil disimpan.');
    }

    /**
     * Finalise & Publikasikan Hasil Seleksi Resmi (ADM-03, NOT-05, VER-10).
     */
    public function publish(Request $request, Stream $stream): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole(['admin', 'verifier'])) {
            abort(403, 'Hanya Administrator atau Verifikator yang memiliki wewenang memfinalisasi hasil seleksi.');
        }

        // Simpan keputusan seleksi yang tercentang jika dikirimkan bersama form finalisasi
        if ($request->has('project_ids')) {
            $this->selectionService->saveDecisions(
                $stream,
                $request->input('project_ids', []),
                $request->input('qualified_ids', []),
                $user
            );
        }

        $result = $this->selectionService->publish($stream, $user);

        $msg = ($result['newly_qualified'] ?? 0) > 0
            ? "Pembaruan seleksi {$stream->name} berhasil dikirim ke Juri! Sebanyak {$result['newly_qualified']} project susulan baru berhasil ditambahkan (total {$result['qualified']} tim lolos)."
            : "Seleksi {$stream->name} berhasil difinalisasi! Sebanyak {$result['qualified']} tim dinyatakan Lolos Convention Day dan telah masuk ke Dashboard Juri untuk penilaian.";

        return back()->with('success', $msg);
    }

    /**
     * Admin Override Keputusan Seleksi (ADM-03) - Wajib Alasan.
     */
    public function override(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole('admin')) {
            abort(403, 'Akses ditolak.');
        }

        $validated = $request->validate([
            'decision' => ['required', 'in:qualified,not_qualified'],
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ], [
            'reason.required' => 'Alasan override keputusan seleksi wajib dicantumkan dalam audit log.',
            'reason.min' => 'Alasan minimal 5 karakter.',
        ]);

        $this->selectionService->override(
            project: $project,
            decision: $validated['decision'],
            admin: $user,
            reason: $validated['reason']
        );

        $statusLabel = $validated['decision'] === 'qualified' ? 'Lolos Convention' : 'Tidak Lolos';

        return back()->with('success', "Status project {$project->registration_code} berhasil di-override menjadi {$statusLabel}.");
    }
}
