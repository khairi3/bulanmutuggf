<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stream extends Model
{
    use HasFactory;

    public const CODE_CIC = 'CIC';

    public const CODE_K3 = 'K3';

    public const CODE_ENERGY = 'ENERGY';

    protected $fillable = [
        'event_id',
        'code',
        'name',
        'code_pattern',
        'team_min',
        'team_max',
        'max_projects_per_employee',
        'is_active',
        'verification_weight',
        'judging_weight',
        'selection_published_at',
        'results_published_at',
        'auto_finalise',
    ];

    protected function casts(): array
    {
        return [
            'team_min' => 'integer',
            'team_max' => 'integer',
            'max_projects_per_employee' => 'integer',
            'is_active' => 'boolean',
            'verification_weight' => 'integer',
            'judging_weight' => 'integer',
            'selection_published_at' => 'datetime',
            'results_published_at' => 'datetime',
            'auto_finalise' => 'boolean',
        ];
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function stageParameters(string $stage)
    {
        return $this->scoringParameters()->where('stage', $stage)->get();
    }

    /**
     * Dimensi dasar ranking & kuota Convention Day: dimensi pertama yang opsinya
     * memiliki kuota (CFG-07), atau dimensi pertama bila tidak ada kuota.
     */
    public function rankingDimension(): ?CategoryDimension
    {
        $dimensions = $this->relationLoaded('categoryDimensions')
            ? $this->categoryDimensions
            : $this->categoryDimensions()->with('options')->get();

        return $dimensions->first(fn ($dim) => $dim->options->whereNotNull('quota')->isNotEmpty())
            ?? $dimensions->first();
    }

    /**
     * Dimensi pengelompokan dashboard juri (JUR-01): kategori Improvement untuk CIC.
     */
    public function groupingDimension(): ?CategoryDimension
    {
        $dimensions = $this->relationLoaded('categoryDimensions')
            ? $this->categoryDimensions
            : $this->categoryDimensions()->with('options')->get();

        return $dimensions->firstWhere('code', 'IMPROVEMENT') ?? $this->rankingDimension();
    }

    public function phase(string $phaseType): ?Phase
    {
        $phases = $this->relationLoaded('phases') ? $this->phases : $this->phases()->get();

        return $phases->firstWhere('phase_type', $phaseType);
    }

    public function isSelectionPublished(): bool
    {
        return $this->selection_published_at !== null;
    }

    public function isResultsPublished(): bool
    {
        return $this->results_published_at !== null;
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function phases(): HasMany
    {
        return $this->hasMany(Phase::class);
    }

    public function categoryDimensions(): HasMany
    {
        return $this->hasMany(CategoryDimension::class)->orderBy('code_order');
    }

    public function scoringParameters(): HasMany
    {
        return $this->hasMany(ScoringParameter::class)->orderBy('sort_order');
    }

    public function registrationSequences(): HasMany
    {
        return $this->hasMany(RegistrationSequence::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function isPhaseOpen(string $phaseType): bool
    {
        $phase = $this->phases()->where('phase_type', $phaseType)->first();
        if (! $phase || $phase->is_locked) {
            return false;
        }

        $now = now();

        return (! $phase->start_at || $phase->start_at <= $now) &&
               (! $phase->end_at || $phase->end_at >= $now);
    }
}
