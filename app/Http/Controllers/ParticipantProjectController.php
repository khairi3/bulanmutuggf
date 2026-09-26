<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\CharterVersion;
use App\Models\Employee;
use App\Models\Event;
use App\Models\Feedback;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\Stream;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\RegistrationCodeService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ParticipantProjectController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected RegistrationCodeService $codeService
    ) {}

    /**
     * Display Participant Dashboard ("Project Saya" - PAR-07).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $employee = $user->employee;

        $projects = [];
        if ($employee) {
            $projects = Project::with([
                'stream',
                'leader',
                'categories.dimension',
                'currentVersion',
                'teamMembers.employee',
            ])
                ->where(function ($q) use ($employee) {
                    $q->where('leader_employee_id', $employee->id)
                        ->orWhereHas('teamMembers', fn ($tm) => $tm->where('employee_id', $employee->id));
                })
                ->latest()
                ->get();
        }

        $activeEvent = Event::active();

        return Inertia::render('Participant/Dashboard', [
            'projects' => $projects,
            'activeEvent' => $activeEvent,
        ]);
    }

    /**
     * Show 6-step registration wizard (PAR-01).
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $activeEvent = Event::active();
        if (! $activeEvent) {
            return redirect()->route('participant.dashboard')
                ->with('error', 'Tidak ada event Bulan Mutu yang sedang aktif.');
        }

        $streams = $activeEvent->streams()
            ->with(['categoryDimensions.options', 'phases'])
            ->where('is_active', true)
            ->get();

        $user = $request->user();

        return Inertia::render('Participant/Projects/RegisterWizard', [
            'activeEvent' => $activeEvent,
            'streams' => $streams,
            'currentEmployee' => $user->employee,
        ]);
    }

    /**
     * Autosave draft project (PAR-02).
     */
    public function storeDraft(Request $request): JsonResponse
    {
        $user = $request->user();
        $leaderEmployeeId = $user->employee_id;

        if (! $leaderEmployeeId) {
            return response()->json(['success' => false, 'message' => 'Profil karyawan tidak ditemukan.'], 422);
        }

        $projectId = $request->input('project_id');
        $streamId = $request->input('stream_id');
        $title = $request->input('title') ?: 'Draft Project BMG';

        if (! $streamId) {
            return response()->json(['success' => false, 'message' => 'Pilih stream terlebih dahulu.'], 422);
        }

        $project = DB::transaction(function () use ($projectId, $streamId, $leaderEmployeeId, $title, $request, $user) {
            $project = $projectId ? Project::find($projectId) : null;

            if (! $project) {
                $project = Project::create([
                    'stream_id' => $streamId,
                    'title' => $title,
                    'status' => Project::STATUS_DRAFT,
                    'leader_employee_id' => $leaderEmployeeId,
                ]);

                // Attach leader as team member
                TeamMember::firstOrCreate([
                    'project_id' => $project->id,
                    'employee_id' => $leaderEmployeeId,
                ], [
                    'member_role' => 'leader',
                    'can_edit' => true,
                ]);
            } else {
                $project->update([
                    'stream_id' => $streamId,
                    'title' => $title,
                ]);
            }

            // Sync categories if provided
            if ($request->has('category_option_ids')) {
                $project->categories()->sync($request->input('category_option_ids'));
            }

            // Sync additional team members if provided
            if ($request->has('member_employee_ids')) {
                $memberIds = array_unique((array) $request->input('member_employee_ids'));
                // Keep leader
                TeamMember::where('project_id', $project->id)
                    ->where('member_role', '!=', 'leader')
                    ->whereNotIn('employee_id', $memberIds)
                    ->delete();

                foreach ($memberIds as $mId) {
                    if ($mId != $leaderEmployeeId) {
                        TeamMember::firstOrCreate([
                            'project_id' => $project->id,
                            'employee_id' => $mId,
                        ], [
                            'member_role' => 'member',
                            'can_edit' => false,
                        ]);
                    }
                }
            }

            // Save draft charter version (v1 or update draft)
            $charterData = [
                'title' => $title,
                'executive_summary' => $request->input('executive_summary'),
                'problem_statement' => $request->input('problem_statement'),
                'goal_statement' => $request->input('goal_statement'),
                'milestones' => $request->input('milestones', []),
                'initiatives' => $request->input('initiatives', []),
                'results' => $request->input('results', []),
                'change_note' => 'Autosave Draft',
                'created_by' => $user->id,
            ];

            $version = CharterVersion::updateOrCreate(
                ['project_id' => $project->id, 'version_no' => 1],
                $charterData
            );

            $project->update(['current_version_id' => $version->id]);

            return $project;
        });

        return response()->json([
            'success' => true,
            'project_id' => $project->id,
            'saved_at' => now()->format('H:i:s'),
        ]);
    }

    /**
     * Submit project registration and generate registration code (PAR-03 & NOT-01).
     */
    public function submit(Request $request): RedirectResponse
    {
        $user = $request->user();
        $leaderEmployee = $user->employee;

        if (! $leaderEmployee) {
            abort(403, 'Hanya karyawan terdaftar yang dapat mendaftar.');
        }

        $request->validate([
            'stream_id' => ['required', 'exists:streams,id'],
            'title' => ['required', 'string', 'max:150'],
            'executive_summary' => ['required', 'string', 'max:1500'],
            'problem_statement' => ['required', 'string', 'max:1500'],
            'goal_statement' => ['required', 'string', 'max:1000'],
            'category_option_ids' => ['required', 'array', 'min:1'],
            'category_option_ids.*' => ['exists:category_options,id'],
            'member_employee_ids' => ['array'],
            'member_employee_ids.*' => ['exists:employees,id'],
            'milestones' => ['required', 'array', 'min:1'],
            'milestones.*.milestone' => ['required', 'string'],
            'initiatives' => ['required', 'array', 'min:1'],
            'initiatives.*.initiative' => ['required', 'string'],
            'agree_originality' => ['accepted'],
        ], [
            'agree_originality.accepted' => 'Anda wajib mencentang pernyataan orisinalitas karya.',
            'category_option_ids.required' => 'Pilihan kategori stream wajib dilengkapi.',
            'milestones.min' => 'Key Milestone wajib diisi minimal 1 baris.',
            'initiatives.min' => 'Inisiatif perbaikan wajib diisi minimal 1 item.',
        ]);

        $stream = Stream::with('categoryDimensions')->findOrFail($request->input('stream_id'));

        // Validate Team Size (CFG-06)
        $memberIds = array_unique((array) $request->input('member_employee_ids', []));
        $allTeamIds = array_unique(array_merge([$leaderEmployee->id], $memberIds));
        $teamCount = count($allTeamIds);

        if ($teamCount < $stream->team_min || $teamCount > $stream->team_max) {
            throw ValidationException::withMessages([
                'member_employee_ids' => "Jumlah anggota tim untuk stream {$stream->name} harus antara {$stream->team_min} sampai {$stream->team_max} orang (saat ini {$teamCount} orang).",
            ]);
        }

        // Validate max projects per employee in this stream
        foreach ($allTeamIds as $empId) {
            $existingCount = Project::where('stream_id', $stream->id)
                ->where('status', '!=', Project::STATUS_DRAFT)
                ->where(function ($q) use ($empId) {
                    $q->where('leader_employee_id', $empId)
                        ->orWhereHas('teamMembers', fn ($tm) => $tm->where('employee_id', $empId));
                })
                ->count();

            if ($existingCount >= $stream->max_projects_per_employee) {
                $emp = Employee::find($empId);
                throw ValidationException::withMessages([
                    'member_employee_ids' => "Karyawan {$emp->full_name} ({$emp->employee_index}) telah mencapai batas maksimal ({$stream->max_projects_per_employee}) project di stream ini.",
                ]);
            }
        }

        // Submit transaction with row locking code generation
        $project = DB::transaction(function () use ($request, $stream, $leaderEmployee, $allTeamIds, $user) {
            $projectId = $request->input('project_id');
            $project = $projectId ? Project::find($projectId) : null;

            if (! $project) {
                $project = Project::create([
                    'stream_id' => $stream->id,
                    'title' => $request->input('title'),
                    'leader_employee_id' => $leaderEmployee->id,
                    'status' => Project::STATUS_DRAFT,
                ]);
            }

            // Generate Unique Registration Code (PAR-03)
            $regCode = $this->codeService->generateCode($stream, $request->input('category_option_ids'));

            $project->update([
                'title' => $request->input('title'),
                'stream_id' => $stream->id,
                'registration_code' => $regCode,
                'status' => Project::STATUS_SUBMITTED,
                'submitted_at' => now(),
            ]);

            // Sync categories
            $project->categories()->sync($request->input('category_option_ids'));

            // Sync team members
            $project->teamMembers()->delete();
            foreach ($allTeamIds as $empId) {
                $isLeader = ($empId === $leaderEmployee->id);
                TeamMember::create([
                    'project_id' => $project->id,
                    'employee_id' => $empId,
                    'member_role' => $isLeader ? 'leader' : 'member',
                    'can_edit' => $isLeader,
                ]);
            }

            // Save Snapshot v1 (PAR-06)
            $version = CharterVersion::updateOrCreate(
                ['project_id' => $project->id, 'version_no' => 1],
                [
                    'title' => $project->title,
                    'executive_summary' => $request->input('executive_summary'),
                    'problem_statement' => $request->input('problem_statement'),
                    'goal_statement' => $request->input('goal_statement'),
                    'milestones' => $request->input('milestones', []),
                    'initiatives' => $request->input('initiatives', []),
                    'results' => $request->input('results', []),
                    'change_note' => 'Pengajuan Pertama (Initial Submission)',
                    'created_by' => $user->id,
                    'created_at' => now(),
                ]
            );

            $project->update(['current_version_id' => $version->id]);

            // Notifications for all members (NOT-01)
            $usersToNotify = User::whereIn('employee_id', $allTeamIds)->get();
            foreach ($usersToNotify as $u) {
                Notification::send(
                    userId: $u->id,
                    type: 'project_submitted',
                    title: "Registrasi Berhasil: {$project->title}",
                    message: "Project tim Anda berhasil diajukan dengan Kode Registrasi: {$regCode}.",
                    link: "/participant/projects/{$project->id}"
                );
            }

            AuditLog::log(
                action: 'SUBMIT_PROJECT',
                entityType: 'Project',
                entityId: $project->id,
                after: ['registration_code' => $regCode, 'status' => Project::STATUS_SUBMITTED],
                reason: "Pengajuan registrasi project berhasil terbit kode: {$regCode}"
            );

            return $project;
        });

        return redirect()->route('participant.projects.show', $project->id)
            ->with('success', "Selamat! Project Anda berhasil diajukan dengan Kode Registrasi: {$project->registration_code}");
    }

    /**
     * Show project detail and charter versions.
     */
    public function show(Project $project): Response
    {
        $this->authorize('view', $project);

        $project->load([
            'stream',
            'leader',
            'categories.dimension',
            'currentVersion',
            'versions.creator.employee',
            'teamMembers.employee',
            'files.uploader.employee',
            'feedbacks' => fn ($q) => $q->where('status', Feedback::STATUS_SENT)
                ->whereNull('parent_id')
                ->with(['author.employee', 'replies.author.employee'])
                ->latest('created_at'),
        ]);

        return Inertia::render('Participant/Projects/Show', [
            'project' => $project,
        ]);
    }

    /**
     * Mark verifier feedback as read by participant (VER-05, PAR-08).
     */
    public function markFeedbackRead(Request $request, Feedback $feedback): JsonResponse
    {
        $project = $feedback->project;
        $this->authorize('view', $project);

        if (! $feedback->read_at) {
            $feedback->update(['read_at' => now()]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Update project charter snapshot (v1 -> v2 versioning) (PAR-06).
     */
    public function updateCharter(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'executive_summary' => ['required', 'string', 'max:1500'],
            'problem_statement' => ['required', 'string', 'max:1500'],
            'goal_statement' => ['required', 'string', 'max:1000'],
            'change_note' => ['required', 'string', 'max:255'],
            'milestones' => ['required', 'array', 'min:1'],
            'initiatives' => ['required', 'array', 'min:1'],
            'results' => ['nullable', 'array'],
        ], [
            'change_note.required' => 'Catatan perubahan wajib diisi untuk riwayat versi charter.',
        ]);

        $user = $request->user();

        DB::transaction(function () use ($project, $request, $user) {
            $nextVersion = ($project->versions()->max('version_no') ?: 1) + 1;

            $version = CharterVersion::create([
                'project_id' => $project->id,
                'version_no' => $nextVersion,
                'title' => $request->input('title'),
                'executive_summary' => $request->input('executive_summary'),
                'problem_statement' => $request->input('problem_statement'),
                'goal_statement' => $request->input('goal_statement'),
                'milestones' => $request->input('milestones', []),
                'initiatives' => $request->input('initiatives', []),
                'results' => $request->input('results', []),
                'change_note' => $request->input('change_note'),
                'created_by' => $user->id,
                'created_at' => now(),
            ]);

            $project->update([
                'title' => $request->input('title'),
                'current_version_id' => $version->id,
            ]);

            AuditLog::log(
                action: 'UPDATE_CHARTER_VERSION',
                entityType: 'Project',
                entityId: $project->id,
                after: ['version_no' => $nextVersion, 'change_note' => $request->input('change_note')],
                reason: "Pembaruan charter versi {$nextVersion}: {$request->input('change_note')}"
            );
        });

        return back()->with('success', 'Project Charter berhasil diperbarui ke versi baru!');
    }

    /**
     * Upload supporting document or video link (PAR-04, PAR-05, 3.7).
     */
    public function uploadFile(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        if ($request->has('external_url') && $request->input('external_url')) {
            $request->validate([
                'external_url' => ['required', 'url', 'max:500'],
                'original_name' => ['required', 'string', 'max:255'],
            ]);

            $project->files()->create([
                'charter_version_id' => $project->current_version_id,
                'file_category' => 'final_video',
                'external_url' => $request->input('external_url'),
                'original_name' => $request->input('original_name'),
                'uploaded_by' => $request->user()->id,
            ]);

            return back()->with('success', 'Tautan video berhasil ditambahkan.');
        }

        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:pdf,ppt,pptx,xls,xlsx,jpg,jpeg,png,mp4',
                'max:102400', // max 100MB for video
            ],
            'file_category' => ['nullable', 'string', 'in:supporting,final_presentation,final_video,visit_photo'],
        ]);

        $uploadedFile = $request->file('file');
        $ext = $uploadedFile->getClientOriginalExtension();
        $uuid = Str::uuid()->toString();
        $eventId = $project->stream?->event_id ?? 'default';

        // PRD 6.3: events/{event_id}/projects/{project_id}/{uuid}.{ext}
        $storageDir = "private/events/{$eventId}/projects/{$project->id}";
        $path = $uploadedFile->storeAs($storageDir, "{$uuid}.{$ext}");

        $project->files()->create([
            'charter_version_id' => $project->current_version_id,
            'file_category' => $request->input('file_category', 'supporting'),
            'storage_path' => $path,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'mime_type' => $uploadedFile->getMimeType(),
            'size_bytes' => $uploadedFile->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Berkas berhasil diunggah.');
    }

    /**
     * Secure file download via policy (Task 3.7).
     */
    public function downloadFile(Request $request, Project $project, ProjectFile $file): StreamedResponse|RedirectResponse
    {
        $this->authorize('downloadFile', [$project, $file]);

        if ($file->external_url) {
            return redirect()->away($file->external_url);
        }

        if (! Storage::exists($file->storage_path)) {
            abort(404, 'Berkas tidak ditemukan di server.');
        }

        return Storage::download($file->storage_path, $file->original_name);
    }

    /**
     * Finalise Project: locks all project data before Convention Day (PAR-11).
     */
    public function finaliseProject(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        if ($project->is_locked || $project->status === Project::STATUS_FINALISED) {
            return back()->with('info', 'Project sudah di-finalise sebelumnya dan terkunci.');
        }

        if ($project->status !== Project::STATUS_QUALIFIED) {
            throw ValidationException::withMessages([
                'status' => 'Hanya project yang telah Lolos Seleksi Convention Day yang dapat di-Finalise.',
            ]);
        }

        $request->validate([
            'confirmation_code' => ['required', 'string'],
        ], [
            'confirmation_code.required' => 'Ketikkan kode registrasi project untuk mengonfirmasi penguncian.',
        ]);

        if (trim($request->input('confirmation_code')) !== trim($project->registration_code)) {
            throw ValidationException::withMessages([
                'confirmation_code' => "Kode konfirmasi salah. Harap ketik persis sama dengan kode registrasi: {$project->registration_code}",
            ]);
        }

        // Checklist kelengkapan presentasi (PAR-11)
        $hasPresentation = $project->files()->where('file_category', 'final_presentation')->exists();
        if (! $hasPresentation) {
            throw ValidationException::withMessages([
                'files' => 'Anda wajib mengunggah file Presentasi Final (PDF) sebelum Finalise Project.',
            ]);
        }

        DB::transaction(function () use ($project) {
            $project->update([
                'status' => Project::STATUS_FINALISED,
                'finalised_at' => now(),
                'is_locked' => true,
            ]);

            AuditLog::log(
                action: 'FINALISE_PROJECT',
                entityType: 'Project',
                entityId: $project->id,
                after: ['status' => Project::STATUS_FINALISED, 'finalised_at' => now()],
                reason: "Peserta memfinalisasi materi Convention Day untuk {$project->registration_code}"
            );
        });

        return back()->with('success', "Selamat! Project {$project->registration_code} berhasil di-Finalise dan data telah dikunci untuk penjurian Convention Day.");
    }
}
