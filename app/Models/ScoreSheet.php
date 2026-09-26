<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScoreSheet extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SUBMITTED = 'submitted';

    protected $fillable = [
        'project_id',
        'scorer_user_id',
        'stage',
        'status',
        'total_weighted',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'total_weighted' => 'float',
            'submitted_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function scorer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scorer_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ScoreItem::class);
    }

    public function isSubmitted(): bool
    {
        return $this->status === self::STATUS_SUBMITTED;
    }
}
