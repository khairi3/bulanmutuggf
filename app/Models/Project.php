<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_IN_VERIFICATION = 'in_verification';

    public const STATUS_VERIFIED = 'verified';

    public const STATUS_QUALIFIED = 'qualified';

    public const STATUS_UNQUALIFIED = 'unqualified';

    public const STATUS_NOT_QUALIFIED = self::STATUS_UNQUALIFIED;

    public const STATUS_FINALISED = 'finalised';

    public const STATUS_JUDGING = 'judging';

    public const STATUS_ANNOUNCED = 'announced';

    /** Label status sesuai PRD Bagian 3 & 5.5. */
    public const STATUS_LABELS = [
        self::STATUS_DRAFT => 'Draft',
        self::STATUS_SUBMITTED => 'Submitted',
        self::STATUS_IN_VERIFICATION => 'Dalam Verifikasi',
        self::STATUS_VERIFIED => 'Terverifikasi',
        self::STATUS_QUALIFIED => 'Lolos Convention',
        self::STATUS_UNQUALIFIED => 'Tidak Lolos',
        self::STATUS_FINALISED => 'Finalised',
        self::STATUS_JUDGING => 'Dinilai Juri',
        self::STATUS_ANNOUNCED => 'Hasil Diumumkan',
    ];

    /** Status di mana peserta masih boleh mengubah charter & lampiran. */
    public const EDITABLE_STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_SUBMITTED,
        self::STATUS_IN_VERIFICATION,
        self::STATUS_QUALIFIED,
    ];

    /** Status yang sudah masuk tahap Convention Day (materi final terkunci). */
    public const CONVENTION_STATUSES = [
        self::STATUS_FINALISED,
        self::STATUS_JUDGING,
        self::STATUS_ANNOUNCED,
    ];

    protected $fillable = [
        'stream_id',
        'registration_code',
        'code_history',
        'title',
        'status',
        'leader_employee_id',
        'current_version_id',
        'submitted_at',
        'finalised_at',
        'is_locked',
    ];

    protected $appends = ['status_label'];

    protected function casts(): array
    {
        return [
            'code_history' => 'array',
            'submitted_at' => 'datetime',
            'finalised_at' => 'datetime',
            'is_locked' => 'boolean',
        ];
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? (string) $this->status;
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'leader_employee_id');
    }

    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(CharterVersion::class, 'current_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(CharterVersion::class)->orderBy('version_no', 'desc');
    }

    public function charterVersions(): HasMany
    {
        return $this->hasMany(CharterVersion::class)->orderBy('version_no', 'desc');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(CategoryOption::class, 'project_categories')->withTimestamps();
    }

    public function teamMembers(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'team_members')
            ->withPivot(['member_role', 'can_edit'])
            ->withTimestamps();
    }

    public function files(): HasMany
    {
        return $this->hasMany(ProjectFile::class);
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    public function visits(): HasMany
    {
        return $this->hasMany(VerificationVisit::class)->orderByDesc('visit_date');
    }

    public function scoreSheets(): HasMany
    {
        return $this->hasMany(ScoreSheet::class);
    }

    public function selectionDecision(): HasOne
    {
        return $this->hasOne(SelectionDecision::class);
    }

    public function finalResult(): HasOne
    {
        return $this->hasOne(FinalResult::class);
    }

    /**
     * Filter project yang melibatkan karyawan tertentu (ketua atau anggota).
     */
    public function scopeInvolving(Builder $query, int $employeeId): Builder
    {
        return $query->where(function ($q) use ($employeeId) {
            $q->where('leader_employee_id', $employeeId)
                ->orWhereHas('teamMembers', fn ($tm) => $tm->where('employee_id', $employeeId));
        });
    }

    public function isMember(int $employeeId): bool
    {
        return $this->leader_employee_id === $employeeId ||
               $this->teamMembers()->where('employee_id', $employeeId)->exists();
    }

    public function isEditableStatus(): bool
    {
        return ! $this->is_locked && in_array($this->status, self::EDITABLE_STATUSES, true);
    }

    public function canEdit(User $user): bool
    {
        if ($user->hasRole('admin')) {
            return ! $this->is_locked;
        }

        if (! $this->isEditableStatus()) {
            return false;
        }

        $empId = $user->employee_id;
        if (! $empId) {
            return false;
        }

        if ($this->leader_employee_id === $empId) {
            return true;
        }

        $member = $this->teamMembers()->where('employee_id', $empId)->first();

        return $member && $member->can_edit;
    }

    /**
     * Opsi kategori yang menjadi dasar ranking & kuota (lihat Stream::rankingDimension()).
     */
    public function rankingOption(): ?CategoryOption
    {
        $dimension = $this->stream?->rankingDimension();
        if (! $dimension) {
            return null;
        }

        $categories = $this->relationLoaded('categories') ? $this->categories : $this->categories()->get();

        return $categories->firstWhere('dimension_id', $dimension->id);
    }

    /**
     * Label kategori lengkap, misal "Beginner · Mechanization · Estate PG1".
     */
    public function categoryLabel(): string
    {
        $categories = $this->relationLoaded('categories') ? $this->categories : $this->categories()->with('dimension')->get();

        return $categories
            ->sortBy(fn ($opt) => $opt->dimension?->code_order ?? 99)
            ->pluck('name')
            ->implode(' · ');
    }
}
