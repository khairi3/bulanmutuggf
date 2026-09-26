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
    ];

    protected function casts(): array
    {
        return [
            'team_min' => 'integer',
            'team_max' => 'integer',
            'max_projects_per_employee' => 'integer',
            'is_active' => 'boolean',
        ];
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
