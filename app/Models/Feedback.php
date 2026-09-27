<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Feedback extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'feedbacks';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SENT = 'sent';

    /** Bagian charter yang bisa ditautkan feedback (VER-05). */
    public const SECTIONS = [
        'title' => 'Judul Project',
        'executive_summary' => 'Executive Summary',
        'problem_statement' => 'Problem Statement',
        'goal_statement' => 'Goal Statement',
        'milestones' => 'Key Milestone',
        'initiatives' => 'Initiatives',
        'results' => 'Results',
        'files' => 'Lampiran',
    ];

    protected $fillable = [
        'project_id',
        'author_user_id',
        'parent_id',
        'charter_section',
        'body',
        'status',
        'is_resolved',
        'resolved_at',
        'resolved_by',
        'sent_at',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'is_resolved' => 'boolean',
            'resolved_at' => 'datetime',
            'sent_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function isResolved(): bool
    {
        return (bool) $this->is_resolved;
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('created_at');
    }
}
