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
            'parameters.*.weight' => ['required', 'numeric', 'min:0.01', 'max:100'],
            'parameters.*.min_score' => ['nullable', 'numeric'],
            'parameters.*.max_score' => ['nullable', 'numeric'],
            'parameters.*.not_pass_min' => ['nullable', 'numeric'],
            'parameters.*.not_pass_max' => ['nullable', 'numeric'],
            'parameters.*.follow_up_min' => ['nullable', 'numeric'],
            'parameters.*.follow_up_max' => ['nullable', 'numeric'],
            'parameters.*.pass_min' => ['nullable', 'numeric'],
            'parameters.*.pass_max' => ['nullable', 'numeric'],
            'parameters.*.not_pass_label' => ['nullable', 'string', 'max:100'],
            'parameters.*.follow_up_label' => ['nullable', 'string', 'max:100'],
            'parameters.*.pass_label' => ['nullable', 'string', 'max:100'],
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
                    'min_score' => isset($p['min_score']) && $p['min_score'] !== '' ? (float) $p['min_score'] : 1.00,
                    'max_score' => isset($p['max_score']) && $p['max_score'] !== '' ? (float) $p['max_score'] : ($stream->code === Stream::CODE_ENERGY ? 15.00 : 5.00),
                    'not_pass_min' => isset($p['not_pass_min']) && $p['not_pass_min'] !== '' ? (float) $p['not_pass_min'] : 1.00,
                    'not_pass_max' => isset($p['not_pass_max']) && $p['not_pass_max'] !== '' ? (float) $p['not_pass_max'] : ($stream->code === Stream::CODE_ENERGY ? 5.00 : 1.00),
                    'follow_up_min' => isset($p['follow_up_min']) && $p['follow_up_min'] !== '' ? (float) $p['follow_up_min'] : ($stream->code === Stream::CODE_ENERGY ? 6.00 : 2.00),
                    'follow_up_max' => isset($p['follow_up_max']) && $p['follow_up_max'] !== '' ? (float) $p['follow_up_max'] : ($stream->code === Stream::CODE_ENERGY ? 10.00 : 3.00),
                    'pass_min' => isset($p['pass_min']) && $p['pass_min'] !== '' ? (float) $p['pass_min'] : ($stream->code === Stream::CODE_ENERGY || $stage === 'judging' ? 11.00 : 4.00),
                    'pass_max' => isset($p['pass_max']) && $p['pass_max'] !== '' ? (float) $p['pass_max'] : ($stream->code === Stream::CODE_ENERGY || $stage === 'judging' ? 15.00 : 5.00),
                    'not_pass_label' => ! empty($p['not_pass_label']) ? trim($p['not_pass_label']) : ($stage === 'judging' ? 'Kurang' : 'Not Pass'),
                    'follow_up_label' => ! empty($p['follow_up_label']) ? trim($p['follow_up_label']) : ($stage === 'judging' ? 'Baik' : 'Need Follow Up'),
                    'pass_label' => ! empty($p['pass_label']) ? trim($p['pass_label']) : ($stage === 'judging' ? 'Sangat Baik' : 'Pass'),
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
