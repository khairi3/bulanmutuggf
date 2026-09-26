<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoringParameter extends Model
{
    use HasFactory;

    public const STAGE_VERIFICATION = 'verification';

    public const STAGE_JUDGING = 'judging';

    protected $fillable = [
        'stream_id',
        'stage',
        'name',
        'rubric',
        'weight',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'float',
            'sort_order' => 'integer',
        ];
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }
}
