<?php

namespace App\Http\Controllers;

use App\Models\Stream;
use App\Services\ExportService;
use App\Services\RecapService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RecapController extends Controller
{
    public function __construct(
        protected RecapService $recapService,
        protected ExportService $exportService,
    ) {}

    /**
     * Tampilan Rekapitulasi Nilai Akhir & Leaderboard (REP-01, ADM-05).
     */
    public function index(Request $request): Response
    {
        $streams = Stream::where('is_active', true)->get();
        $streamId = $request->input('stream_id', $streams->first()?->id);
        $selectedStream = $streams->firstWhere('id', $streamId) ?? $streams->first();

        $rankings = $selectedStream
            ? $this->recapService->recomputeRecap($selectedStream)
            : collect();

        return Inertia::render('Admin/Recap/Index', [
            'streams' => $streams,
            'selectedStream' => $selectedStream,
            'rankings' => $rankings,
            'isPublished' => $selectedStream?->isResultsPublished() ?? false,
            'publishedAt' => $selectedStream?->results_published_at?->format('d M Y H:i'),
        ]);
    }

    /**
     * Update penetapan gelar juara kustom oleh Admin (Juara 1, 2, 3, Harapan, Best Innovation).
     */
    public function updateAwards(Request $request, Stream $stream): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole('admin')) {
            abort(403, 'Akses ditolak.');
        }

        $request->validate([
            'awards' => ['required', 'array'],
        ]);

        $this->recapService->updateAwardTitles($stream, $request->input('awards', []), $user);

        return back()->with('success', 'Penetapan gelar juara berhasil diperbarui.');
    }

    /**
     * Admin Publikasi Pengumuman Pemenang Resmi (ADM-05, NOT-07).
     */
    public function publish(Request $request, Stream $stream): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole('admin')) {
            abort(403, 'Hanya Administrator yang memiliki wewenang mengumumkan pemenang.');
        }

        $result = $this->recapService->publishWinners($stream, $user);

        return back()->with(
            'success',
            "Pengumuman pemenang {$stream->name} berhasil dipublikasikan: {$result['total_winners']} tim peraih juara resmi diumumkan dan notifikasi telah dikirim ke seluruh tim peserta."
        );
    }

    /**
     * Export Excel / CSV multi-dataset (ADM-06, VER-11).
     */
    public function export(Request $request): StreamedResponse
    {
        $type = $request->input('type', 'final_ranking');
        $streamId = $request->input('stream_id');

        return $this->exportService->export($type, $streamId ? (int) $streamId : null);
    }
}
