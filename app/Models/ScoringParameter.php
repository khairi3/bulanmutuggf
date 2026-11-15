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
        'min_score',
        'max_score',
        'not_pass_min',
        'not_pass_max',
        'follow_up_min',
        'follow_up_max',
        'pass_min',
        'pass_max',
        'not_pass_label',
        'follow_up_label',
        'pass_label',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'float',
            'sort_order' => 'integer',
            'min_score' => 'float',
            'max_score' => 'float',
            'not_pass_min' => 'float',
            'not_pass_max' => 'float',
            'follow_up_min' => 'float',
            'follow_up_max' => 'float',
            'pass_min' => 'float',
            'pass_max' => 'float',
        ];
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }
}
