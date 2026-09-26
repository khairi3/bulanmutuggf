<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CharterVersion extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = [
        'project_id',
        'version_no',
        'title',
        'executive_summary',
        'problem_statement',
        'goal_statement',
        'milestones',
        'initiatives',
        'results',
        'change_note',
        'created_by',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'version_no' => 'integer',
            'milestones' => 'array',
            'initiatives' => 'array',
            'results' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function files(): HasMany
    {
        return $this->hasMany(ProjectFile::class, 'charter_version_id');
    }
}
