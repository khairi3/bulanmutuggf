<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Feedback;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ScoringParameter;
use App\Models\Stream;
use App\Models\VerificationVisit;
use App\Services\ProjectAccessService;
use App\Services\ScoringService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VerifierController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected ProjectAccessService $access,
        protected ScoringService $scoringService,
    ) {}

    /**
     * Dashboard Verifikator Lapangan (VER-01, VER-02).
     */
    public function dashboard(Request $request): Response
    {
        $user = $request->user();

        // Base scoped query (assigned stream & no conflict of interest)
        $baseQuery = $this->access->verifierQuery($user);

        // Stats calculation
        $totalAssigned = (clone $baseQuery)->count();
        $unverified = (clone $baseQuery)->whereIn('status', [Project::STATUS_SUBMITTED, Project::STATUS_IN_VERIFICATION])->count();
        $verified = (clone $baseQuery)->whereIn('status', [
            Project::STATUS_VERIFIED,
            Project::STATUS_QUALIFIED,
            Project::STATUS_NOT_QUALIFIED,
            Project::STATUS_FINALISED,
            Project::STATUS_JUDGING,
            Project::STATUS_ANNOUNCED,
        ])->count();

        // Filters
        $query = (clone $baseQuery)->with([
            'stream',
            'categories.dimension',
            'leader',
            'scoreSheets' => fn ($q) => $q->where('scorer_user_id', $user->id)->where('stage', ScoringParameter::STAGE_VERIFICATION),
        ]);

        if ($streamId = $request->input('stream_id')) {
            $query->where('stream_id', $streamId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('registration_code', 'like', "%{$search}%");
            });
        }

        if ($categoryOptionId = $request->input('category_option_id')) {
            $query->whereHas('categories', fn ($q) => $q->where('category_options.id', $categoryOptionId));
        }

        $sortField = $request->input('sort', 'submitted_at');
        $sortOrder = $request->input('direction', 'desc');
        $allowedSorts = ['submitted_at', 'registration_code', 'title', 'status'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest('submitted_at');
        }

        $projects = $query->paginate(15)->withQueryString();

        // Map my score sheet status per project
        $projects->getCollection()->transform(function (Project $p) {
            $mySheet = $p->scoreSheets->first();
            $streamCode = $p->stream?->code;

            $levelOption = $p->categories->first(function ($c) {
                $dimCode = strtoupper((string) $c->dimension?->code);
                $dimName = strtolower((string) $c->dimension?->name);

                return $dimCode === 'LEVEL'
                    || str_contains($dimName, 'level')
                    || in_array(strtolower($c->name), ['beginner', 'middle', 'advance', 'advanced'], true);
            });

            if ($streamCode === Stream::CODE_CIC) {
                $levelName = $levelOption?->name ?? 'Lainnya';
                $groupKey = 'CIC_'.strtoupper($levelName);
                $groupLabel = "CIC — {$levelName}";
            } elseif ($streamCode === Stream::CODE_ENERGY) {
                $groupKey = 'ENERGY';
                $groupLabel = 'EMI (Energy Management Implementation)';
            } elseif ($streamCode === Stream::CODE_K3) {
                $groupKey = 'K3';
                $groupLabel = 'Bulan K3 (Keselamatan & Kesehatan Kerja)';
            } else {
                $groupKey = $streamCode ?: 'OTHER';
                $groupLabel = $p->stream?->name ?? 'Stream Lainnya';
            }

            return [
                'id' => $p->id,
                'registration_code' => $p->registration_code,
                'title' => $p->title,
                'status' => $p->status,
                'stream_id' => $p->stream_id,
                'stream_code' => $streamCode,
                'stream_name' => $p->stream?->name,
                'level_name' => $levelOption?->name,
                'group_key' => $groupKey,
                'group_label' => $groupLabel,
                'leader_name' => $p->leader?->full_name,
                'unit' => $p->leader?->unit,
                'categories' => $p->categories->pluck('name')->all(),
                'submitted_at' => $p->submitted_at?->format('d M Y H:i'),
                'my_score_status' => $mySheet?->status ?? 'none',
                'my_score' => $mySheet?->total_weighted,
            ];
        });

        // Filter options for dropdowns & Category tabs
        $assignedStreamIds = $this->access->assignmentsFor($user, 'verification')->pluck('stream_id')->unique();
        $streams = Stream::with(['categoryDimensions.options'])->whereIn('id', $assignedStreamIds)->get(['id', 'name', 'code']);

        // Build category summary counts across baseQuery
        $allProjectsForCounts = (clone $baseQuery)->with(['stream:id,code,name', 'categories.dimension'])->get();
        $groupCounts = [
            'ALL' => $allProjectsForCounts->count(),
            'CIC_BEGINNER' => 0,
            'CIC_MIDDLE' => 0,
            'CIC_ADVANCE' => 0,
            'ENERGY' => 0,
            'K3' => 0,
        ];

        foreach ($allProjectsForCounts as $proj) {
            $sCode = $proj->stream?->code;
            if ($sCode === Stream::CODE_CIC) {
                $lvl = $proj->categories->first(fn ($c) => in_array(strtolower($c->name), ['beginner', 'middle', 'advance', 'advanced'], true));
                $lvlUpper = strtoupper($lvl?->name ?? '');
                if ($lvlUpper === 'ADVANCED') {
                    $lvlUpper = 'ADVANCE';
                }
                if (isset($groupCounts["CIC_{$lvlUpper}"])) {
                    $groupCounts["CIC_{$lvlUpper}"]++;
                }
            } elseif ($sCode === Stream::CODE_ENERGY) {
                $groupCounts['ENERGY']++;
            } elseif ($sCode === Stream::CODE_K3) {
                $groupCounts['K3']++;
            }
        }

        return Inertia::render('Verifier/Dashboard', [
            'stats' => [
                'total' => $totalAssigned,
                'unverified' => $unverified,
                'verified' => $verified,
            ],
            'groupCounts' => $groupCounts,
            'projects' => $projects,
            'streams' => $streams,
            'filters' => $request->only(['stream_id', 'status', 'search', 'category_option_id', 'sort', 'direction']),
        ]);
    }

    /**
     * Halaman Detail Project untuk Verifikator (VER-03, VER-06, Task 4.9).
     */
    public function show(Request $request, Project $project): Response
    {
        $user = $request->user();

        if (! $this->access->canVerify($user, $project)) {
            abort(403, 'Anda tidak ditugaskan untuk memverifikasi project ini atau terdapat konflik kepentingan.');
        }

        // Task 4.9 & PRD 3.2: Transisi otomatis Submitted -> Dalam Verifikasi
        if ($project->status === Project::STATUS_SUBMITTED) {
            $project->update(['status' => Project::STATUS_IN_VERIFICATION]);

            AuditLog::log(
                action: 'START_VERIFICATION',
                entityType: 'Project',
                entityId: $project->id,
                after: ['status' => Project::STATUS_IN_VERIFICATION],
                reason: "Verifikator {$user->employee?->full_name} membuka project untuk verifikasi"
            );
        }

        // Load project relationships
        $project->load([
            'stream.categoryDimensions.options',
            'categories.dimension',
            'leader',
            'teamMembers.employee',
            'currentVersion',
            'charterVersions.creator.employee',
            'files.uploader.employee',
        ]);

        // Scoring parameters for verification stage
        $scoringParameters = $project->stream->scoringParameters()
            ->where('stage', ScoringParameter::STAGE_VERIFICATION)
            ->orderBy('sort_order')
            ->get();

        // Verifier's own score sheet
        $scoreSheet = $this->scoringService->sheetFor($project, $user, ScoringParameter::STAGE_VERIFICATION);
        $scoreSheet->load(['items.parameter']);

        // Feedbacks for this project
        // Note: Verifiers can see their own drafts + all sent feedbacks
        $feedbacks = Feedback::where('project_id', $project->id)
            ->where(function ($q) use ($user) {
                $q->where('status', Feedback::STATUS_SENT)
                    ->orWhere('author_user_id', $user->id);
            })
            ->with(['author.employee', 'replies.author.employee'])
            ->whereNull('parent_id')
            ->latest('created_at')
            ->get();

        // Verification visits
        $visits = VerificationVisit::where('project_id', $project->id)
            ->with(['verifier.employee', 'photos'])
            ->latest('visit_date')
            ->get();

        return Inertia::render('Verifier/Projects/Show', [
            'project' => $project,
            'scoringParameters' => $scoringParameters,
            'myScoreSheet' => $scoreSheet,
            'feedbacks' => $feedbacks,
            'visits' => $visits,
            'feedbackSections' => Feedback::SECTIONS,
        ]);
    }

    /**
     * Tulis Feedback untuk Peserta (VER-05, NOT-02).
     */
    public function storeFeedback(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();

        if (! $this->access->canVerify($user, $project)) {
            abort(403, 'Akses ditolak.');
        }

        $validated = $request->validate([
            'charter_section' => ['nullable', 'string', 'in:'.implode(',', array_keys(Feedback::SECTIONS))],
            'body' => ['required', 'string', 'max:2000'],
            'status' => ['required', 'in:draft,sent'],
            'parent_id' => ['nullable', 'exists:feedbacks,id'],
        ], [
            'body.required' => 'Isi catatan feedback tidak boleh kosong.',
            'body.max' => 'Isi feedback maksimal 2.000 karakter.',
        ]);

        $isSent = $validated['status'] === Feedback::STATUS_SENT;

        $feedback = Feedback::create([
            'project_id' => $project->id,
            'author_user_id' => $user->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'charter_section' => $validated['charter_section'] ?? null,
            'body' => $validated['body'],
            'status' => $validated['status'],
            'sent_at' => $isSent ? now() : null,
        ]);

        // If sent to participant, dispatch in-app notification to team (NOT-02)
        if ($isSent) {
            $leaderUserId = $project->leader?->user?->id;
            $teamUserIds = $project->teamMembers()->with('employee.user')->get()
                ->pluck('employee.user.id')
                ->push($leaderUserId)
                ->filter()
                ->unique();

            $sectionLabel = $feedback->charter_section
                ? (Feedback::SECTIONS[$feedback->charter_section] ?? $feedback->charter_section)
                : 'Project Charter';

            foreach ($teamUserIds as $uId) {
                Notification::send(
                    userId: $uId,
                    type: 'feedback_received',
                    title: "Catatan Verifikator Baru ({$sectionLabel})",
                    message: "Verifikator {$user->employee?->full_name} memberikan catatan pada bagian {$sectionLabel} untuk project {$project->registration_code}.",
                    link: "/participant/projects/{$project->id}?tab=feedback"
                );
            }
        }

        return back()->with('success', $isSent ? 'Catatan feedback berhasil dikirim ke tim peserta.' : 'Draf feedback berhasil disimpan.');
    }

    /**
     * Hapus Feedback Verifikator.
     */
    public function destroyFeedback(Project $project, Feedback $feedback): RedirectResponse
    {
        $user = auth()->user();

        if ($feedback->author_user_id !== $user->id) {
            abort(403, 'Anda hanya dapat menghapus feedback yang Anda tulis sendiri.');
        }

        $feedback->delete();

        return back()->with('success', 'Catatan feedback berhasil dihapus.');
    }

    /**
     * Catat Log Visit Lapangan & Unggah Foto Bukti (VER-04).
     */
    public function storeVisit(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();

        if (! $this->access->canVerify($user, $project)) {
            abort(403, 'Akses ditolak.');
        }

        $request->validate([
            'visit_date' => ['required', 'date'],
            'location' => ['required', 'string', 'max:200'],
            'notes' => ['nullable', 'string', 'max:3000'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['image', 'mimes:jpeg,png,jpg', 'max:10240'], // max 10MB per photo
        ], [
            'visit_date.required' => 'Tanggal kunjungan lapangan wajib diisi.',
            'location.required' => 'Lokasi kunjungan lapangan wajib diisi.',
            'photos.*.image' => 'File bukti harus berupa gambar (JPG/PNG).',
            'photos.*.max' => 'Ukuran setiap foto bukti maksimal 10MB.',
        ]);

        DB::transaction(function () use ($request, $project, $user) {
            $visit = VerificationVisit::create([
                'project_id' => $project->id,
                'verifier_user_id' => $user->id,
                'visit_date' => $request->input('visit_date'),
                'location' => $request->input('location'),
                'notes' => $request->input('notes'),
            ]);

            // Save photos
            if ($request->hasFile('photos')) {
                $eventYear = $project->stream?->event?->year ?? date('Y');

                foreach ($request->file('photos') as $file) {
                    $uuid = Str::uuid()->toString();
                    $ext = $file->getClientOriginalExtension();
                    $dir = "events/{$eventYear}/projects/{$project->id}/visits";
                    $filename = "{$uuid}.{$ext}";
                    $path = $file->storeAs($dir, $filename, 'local');

                    ProjectFile::create([
                        'project_id' => $project->id,
                        'verification_visit_id' => $visit->id,
                        'file_category' => 'visit_photo',
                        'storage_path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getClientMimeType() ?: 'image/jpeg',
                        'size_bytes' => $file->getSize(),
                        'uploaded_by' => $user->id,
                    ]);
                }
            }
        });

        return back()->with('success', 'Log kunjungan lapangan berhasil dicatat.');
    }

    /**
     * Simpan Draf Nilai atau Submit Final Penilaian (VER-06, VER-07, VER-08).
     */
    public function saveScore(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();

        if (! $this->access->canVerify($user, $project)) {
            abort(403, 'Akses ditolak.');
        }

        $isSubmit = (bool) $request->input('submit', false);
        $items = (array) $request->input('scores', []);

        $this->scoringService->saveSheet(
            project: $project,
            scorer: $user,
            stage: ScoringParameter::STAGE_VERIFICATION,
            items: $items,
            submit: $isSubmit
        );

        $msg = $isSubmit
            ? 'Penilaian verifikasi berhasil disubmit final dan nilai telah dikunci.'
            : 'Draf nilai berhasil disimpan.';

        return back()->with('success', $msg);
    }

    /**
     * Download secure file attachment atau foto visit (VER-03).
     */
    public function downloadFile(Project $project, ProjectFile $file): StreamedResponse
    {
        $user = auth()->user();

        if (! $this->access->canVerify($user, $project) && ! $user->hasRole('admin')) {
            abort(403, 'Akses file ditolak.');
        }

        if ($file->project_id !== $project->id) {
            abort(404, 'File tidak cocok dengan project.');
        }

        if (! Storage::disk('local')->exists($file->storage_path)) {
            abort(404, 'Berkas tidak ditemukan pada server.');
        }

        return Storage::disk('local')->download($file->storage_path, $file->original_name);
    }

    /**
     * Hapus Project yang sudah disubmit oleh Verifikator dengan alasan.
     */
    public function destroy(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();

        if (! $this->access->canVerify($user, $project)) {
            abort(403, 'Anda tidak ditugaskan untuk memverifikasi project ini atau terdapat konflik kepentingan.');
        }

        if ($project->status === Project::STATUS_DRAFT) {
            return back()->with('error', 'Project berstatus draft belum masuk ke tahap verifikasi.');
        }

        if ($project->is_locked || in_array($project->status, Project::CONVENTION_STATUSES, true)) {
            return back()->with('error', 'Project yang sudah masuk tahap Convention Day atau terkunci tidak dapat dihapus.');
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ], [
            'reason.required' => 'Alasan penghapusan project wajib diisi.',
            'reason.min' => 'Alasan penghapusan minimal 5 karakter.',
            'reason.max' => 'Alasan penghapusan maksimal 1.000 karakter.',
        ]);

        $reason = trim($validated['reason']);
        $title = $project->title;
        $regCode = $project->registration_code ?? ('ID: '.$project->id);
        $verifierName = $user->employee?->full_name ?? $user->name ?? 'Verifikator';

        DB::transaction(function () use ($project, $user, $reason, $title, $regCode, $verifierName) {
            // Notifikasi ke ketua dan anggota tim peserta
            $leaderUserId = $project->leader?->user?->id;
            $teamUserIds = $project->teamMembers()->with('employee.user')->get()
                ->pluck('employee.user.id')
                ->push($leaderUserId)
                ->filter()
                ->unique();

            foreach ($teamUserIds as $uId) {
                Notification::send(
                    userId: $uId,
                    type: 'project_deleted',
                    title: "Project Dihapus oleh Verifikator ({$regCode})",
                    message: "Project '{$title}' ({$regCode}) telah dihapus oleh Verifikator {$verifierName} dengan alasan: {$reason}",
                    link: null
                );
            }

            // Audit log
            AuditLog::log(
                action: 'DELETE_PROJECT_BY_VERIFIER',
                entityType: 'Project',
                entityId: $project->id,
                before: [
                    'title' => $title,
                    'registration_code' => $project->registration_code,
                    'status' => $project->status,
                    'stream_id' => $project->stream_id,
                    'leader_employee_id' => $project->leader_employee_id,
                ],
                reason: "Dihapus oleh Verifikator {$verifierName}: {$reason}"
            );

            // Simpan alasan dan user yang menghapus sebelum soft delete
            $project->update([
                'deletion_reason' => $reason,
                'deleted_by' => $user->id,
            ]);

            $project->delete();
        });

        return redirect()->route('verifier.dashboard')
            ->with('success', "Project \"{$regCode} - {$title}\" berhasil dihapus.");
    }
}
