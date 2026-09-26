<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoreItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'score_sheet_id',
        'parameter_id',
        'score',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'float',
        ];
    }

    public function sheet(): BelongsTo
    {
        return $this->belongsTo(ScoreSheet::class, 'score_sheet_id');
    }

    public function parameter(): BelongsTo
    {
        return $this->belongsTo(ScoringParameter::class, 'parameter_id');
    }
}
