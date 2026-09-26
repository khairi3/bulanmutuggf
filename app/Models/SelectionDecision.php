<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SelectionDecision extends Model
{
    use HasFactory;

    public const QUALIFIED = 'qualified';

    public const NOT_QUALIFIED = 'not_qualified';

    protected $fillable = [
        'project_id',
        'decision',
        'decided_by',
        'published_at',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
