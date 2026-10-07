<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Event;
use App\Models\Stream;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    /**
     * Display all events and stream configurations.
     */
    public function index(Request $request): Response
    {
        $events = Event::with(['streams.phases', 'streams.categoryDimensions.options', 'streams.scoringParameters'])
            ->latest('year')
            ->get();

        $selectedEventId = $request->input('event_id', $events->firstWhere('status', Event::STATUS_ACTIVE)?->id ?? $events->first()?->id);
        $selectedEvent = $events->firstWhere('id', $selectedEventId) ?? $events->first();

        return Inertia::render('Admin/Events/Index', [
            'events' => $events,
            'selectedEvent' => $selectedEvent,
            'loginBackgroundImage' => \App\Models\Setting::get('login_background_image', '/images/login-bg-default.jpg'),
            'appHeaderBackgroundImage' => \App\Models\Setting::get('app_header_background_image', '/images/login-bg-plantation.jpg'),
            'certificateSettings' => [
                'isPublished' => \App\Models\Setting::get('certificate_published', '0') === '1',
                'signatory1Name' => \App\Models\Setting::get('certificate_signatory1_name', \App\Models\Setting::get('certificate_signatory_name', 'Tommy Wattimena')),
                'signatory1Title' => \App\Models\Setting::get('certificate_signatory1_title', \App\Models\Setting::get('certificate_signatory_title', 'Managing Director Great Giant Foods')),
                'signatory2Name' => \App\Models\Setting::get('certificate_signatory2_name', 'Steering Committee Chairman'),
                'signatory2Title' => \App\Models\Setting::get('certificate_signatory2_title', 'Head of Corporate Quality & CI'),
                'templateImage' => \App\Models\Setting::get('certificate_template_image', null),
                'showSystemTitle' => \App\Models\Setting::get('certificate_show_system_title', '0') === '1',
                'recipientNameTop' => (int) \App\Models\Setting::get('certificate_recipient_name_top', '107'),
            ],
        ]);
    }

    /**
     * Create a new event.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'year' => ['required', 'integer', 'min:2020', 'max:2100', 'unique:events,year'],
            'status' => ['required', 'in:draft,active,closed'],
            'final_weight_verification' => ['required', 'numeric', 'min:0', 'max:100'],
            'final_weight_judging' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        if (round($request->input('final_weight_verification') + $request->input('final_weight_judging'), 2) != 100.00) {
            return back()->with('error', 'Total bobot akhir (Verifikasi + Juri) harus tepat 100%.');
        }

        DB::transaction(function () use ($request, &$event) {
            // CFG-01: Only one event can be active at a time
            if ($request->input('status') === Event::STATUS_ACTIVE) {
                Event::where('status', Event::STATUS_ACTIVE)->update(['status' => Event::STATUS_CLOSED]);
            }

            $event = Event::create([
                'name' => $request->input('name'),
                'year' => $request->input('year'),
                'status' => $request->input('status'),
                'final_weight_verification' => $request->input('final_weight_verification'),
                'final_weight_judging' => $request->input('final_weight_judging'),
            ]);

            // Default streams initialization (CIC, K3, ENERGY, TPM)
            $streams = [
                ['code' => Stream::CODE_CIC, 'name' => 'Continuous Improvement Convention (CIC)', 'pattern' => '{LEVEL}{IMPROVEMENT}{AREA}-{NNN}'],
                ['code' => Stream::CODE_K3, 'name' => 'Bulan K3 (Keselamatan & Kesehatan Kerja)', 'pattern' => 'SIGAP-{NNN}'],
                ['code' => Stream::CODE_ENERGY, 'name' => 'Energy Management Implementation', 'pattern' => 'ENRG-{NNN}'],
                ['code' => Stream::CODE_TPM, 'name' => 'Total Productive Maintenance (TPM)', 'pattern' => 'TPM-{NNN}'],
            ];

            foreach ($streams as $s) {
                $stream = $event->streams()->create([
                    'code' => $s['code'],
                    'name' => $s['name'],
                    'code_pattern' => $s['pattern'],
                    'team_min' => 3,
                    'team_max' => 7,
                    'max_projects_per_employee' => 2,
                    'is_active' => true,
                ]);

                // Create default phases
                $phases = ['registration', 'verification', 'selection', 'finalisation', 'judging', 'announcement'];
                foreach ($phases as $phaseType) {
                    $stream->phases()->create([
                        'phase_type' => $phaseType,
                        'start_at' => now(),
                        'end_at' => now()->addMonths(2),
                        'is_locked' => false,
                    ]);
                }
            }

            AuditLog::log(
                action: 'CREATE_EVENT',
                entityType: 'Event',
                entityId: $event->id,
                after: $event->toArray(),
                reason: "Membuat event baru: {$event->name} ({$event->year})"
            );
        });

        return redirect()->route('admin.events.index', ['event_id' => $event->id])
            ->with('success', "Event {$event->name} berhasil dibuat!");
    }

    /**
     * Update event status and weights.
     */
    public function update(Request $request, Event $event): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'status' => ['required', 'in:draft,active,closed'],
            'final_weight_verification' => ['required', 'numeric', 'min:0', 'max:100'],
            'final_weight_judging' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        if (round($request->input('final_weight_verification') + $request->input('final_weight_judging'), 2) != 100.00) {
            return back()->with('error', 'Total bobot akhir (Verifikasi + Juri) harus tepat 100%.');
        }

        DB::transaction(function () use ($request, $event) {
            // CFG-01: Only one event can be active
            if ($request->input('status') === Event::STATUS_ACTIVE && $event->status !== Event::STATUS_ACTIVE) {
                Event::where('id', '!=', $event->id)
                    ->where('status', Event::STATUS_ACTIVE)
                    ->update(['status' => Event::STATUS_CLOSED]);
            }

            $before = $event->toArray();
            $event->update([
                'name' => $request->input('name'),
                'status' => $request->input('status'),
                'final_weight_verification' => $request->input('final_weight_verification'),
                'final_weight_judging' => $request->input('final_weight_judging'),
            ]);

            AuditLog::log(
                action: 'UPDATE_EVENT',
                entityType: 'Event',
                entityId: $event->id,
                before: $before,
                after: $event->toArray(),
                reason: "Memperbarui konfigurasi event {$event->name}"
            );
        });

        return back()->with('success', "Pengaturan event {$event->name} berhasil diperbarui.");
    }

    /**
     * Toggle stream active status (CFG-02).
     */
    public function toggleStream(Stream $stream): RedirectResponse
    {
        $newState = ! $stream->is_active;
        $stream->update(['is_active' => $newState]);

        AuditLog::log(
            action: 'TOGGLE_STREAM',
            entityType: 'Stream',
            entityId: $stream->id,
            after: ['is_active' => $newState],
            reason: $newState ? "Mengaktifkan stream {$stream->name}" : "Menonaktifkan stream {$stream->name}"
        );

        return back()->with('success', "Status stream {$stream->name} berhasil diubah.");
    }

    /**
     * Update team rules and code pattern (CFG-06).
     */
    public function updateStreamRules(Request $request, Stream $stream): RedirectResponse
    {
        $request->validate([
            'team_min' => ['required', 'integer', 'min:1', 'max:20'],
            'team_max' => ['required', 'integer', 'min:1', 'max:20', 'gte:team_min'],
            'max_projects_per_employee' => ['required', 'integer', 'min:1', 'max:10'],
            'code_pattern' => ['required', 'string', 'max:100'],
        ]);

        $stream->update([
            'team_min' => $request->input('team_min'),
            'team_max' => $request->input('team_max'),
            'max_projects_per_employee' => $request->input('max_projects_per_employee'),
            'code_pattern' => $request->input('code_pattern'),
        ]);

        AuditLog::log(
            action: 'UPDATE_STREAM_RULES',
            entityType: 'Stream',
            entityId: $stream->id,
            after: $stream->only(['team_min', 'team_max', 'max_projects_per_employee', 'code_pattern']),
            reason: "Pembaruan aturan tim dan pola kode untuk stream {$stream->name}"
        );

        return back()->with('success', "Aturan tim stream {$stream->name} berhasil disimpan.");
    }

    /**
     * Create a new stream for an event (CFG-02).
     */
    public function storeStream(Request $request, Event $event): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:20'],
            'code_pattern' => ['required', 'string', 'max:100'],
            'team_min' => ['required', 'integer', 'min:1', 'max:20'],
            'team_max' => ['required', 'integer', 'min:1', 'max:20', 'gte:team_min'],
            'max_projects_per_employee' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $stream = DB::transaction(function () use ($request, $event) {
            $stream = $event->streams()->create([
                'name' => $request->input('name'),
                'code' => strtoupper(trim($request->input('code'))),
                'code_pattern' => $request->input('code_pattern'),
                'team_min' => $request->input('team_min'),
                'team_max' => $request->input('team_max'),
                'max_projects_per_employee' => $request->input('max_projects_per_employee'),
                'is_active' => true,
            ]);

            // Create default phases
            $phases = ['registration', 'verification', 'selection', 'finalisation', 'judging', 'announcement'];
            foreach ($phases as $phaseType) {
                $stream->phases()->create([
                    'phase_type' => $phaseType,
                    'start_at' => now(),
                    'end_at' => now()->addMonths(2),
                    'is_locked' => false,
                ]);
            }

            AuditLog::log(
                action: 'CREATE_STREAM',
                entityType: 'Stream',
                entityId: $stream->id,
                after: $stream->toArray(),
                reason: "Menambahkan stream baru: {$stream->name} ke event {$event->name}"
            );

            return $stream;
        });

        return back()->with('success', "Stream perlombaan {$stream->name} berhasil ditambahkan!");
    }
}
