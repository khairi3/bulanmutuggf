<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Stream;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScoringParameterController extends Controller
{
    /**
     * Update/Save scoring parameters for a stream stage (CFG-05).
     * Requirement: SUM(weight) must equal exactly 100.00%.
     */
    public function updateStageParameters(Request $request, Stream $stream): RedirectResponse
    {
        $request->validate([
            'stage' => ['required', 'in:verification,judging'],
            'parameters' => ['required', 'array', 'min:1'],
            'parameters.*.name' => ['required', 'string', 'max:150'],
            'parameters.*.rubric' => ['nullable', 'string'],
            'parameters.*.weight' => ['required', 'numeric', 'min:1', 'max:100'],
        ]);

        $stage = $request->input('stage');
        $params = $request->input('parameters');

        // Validate sum of weights equals 100.00%
        $totalWeight = array_sum(array_column($params, 'weight'));
        if (round($totalWeight, 2) != 100.00) {
            return back()->with('error', "Gagal menyimpan: Total bobot parameter untuk tahap {$stage} harus tepat 100% (saat ini terhitung {$totalWeight}%).");
        }

        DB::transaction(function () use ($stream, $stage, $params) {
            // Delete old parameters for this stage
            $stream->scoringParameters()->where('stage', $stage)->delete();

            // Insert new parameters
            foreach ($params as $idx => $p) {
                $stream->scoringParameters()->create([
                    'stage' => $stage,
                    'name' => trim($p['name']),
                    'rubric' => $p['rubric'] ?? null,
                    'weight' => $p['weight'],
                    'sort_order' => $idx + 1,
                ]);
            }

            AuditLog::log(
                action: 'UPDATE_SCORING_PARAMETERS',
                entityType: 'Stream',
                entityId: $stream->id,
                reason: "Pembaruan parameter penilaian tahap {$stage} untuk stream {$stream->name} (Total Bobot: 100%)"
            );
        });

        $stageLabel = $stage === 'verification' ? 'Verifikasi' : 'Juri';

        return back()->with('success', "Parameter penilaian tahap {$stageLabel} stream {$stream->name} berhasil disimpan dengan total bobot 100%.");
    }
}
