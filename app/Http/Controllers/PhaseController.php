<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Phase;
use App\Models\Stream;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PhaseController extends Controller
{
    /**
     * Batch update phase dates and lock status for a stream (CFG-03).
     */
    public function update(Request $request, Stream $stream): RedirectResponse
    {
        $request->validate([
            'phases' => ['required', 'array'],
            'phases.*.id' => ['required', 'exists:phases,id'],
            'phases.*.start_at' => ['nullable', 'date'],
            'phases.*.end_at' => ['nullable', 'date', 'after_or_equal:phases.*.start_at'],
            'phases.*.is_locked' => ['nullable', 'boolean'],
        ]);

        foreach ($request->input('phases') as $phaseData) {
            $phase = Phase::where('stream_id', $stream->id)->find($phaseData['id']);
            if ($phase) {
                $phase->update([
                    'start_at' => $phaseData['start_at'] ? date('Y-m-d H:i:s', strtotime($phaseData['start_at'])) : null,
                    'end_at' => $phaseData['end_at'] ? date('Y-m-d H:i:s', strtotime($phaseData['end_at'])) : null,
                    'is_locked' => (bool) ($phaseData['is_locked'] ?? false),
                ]);
            }
        }

        AuditLog::log(
            action: 'UPDATE_PHASES',
            entityType: 'Stream',
            entityId: $stream->id,
            reason: "Pembaruan jadwal fase untuk stream {$stream->name}"
        );

        return back()->with('success', "Jadwal fase untuk stream {$stream->name} berhasil disimpan.");
    }
}
