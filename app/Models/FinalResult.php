<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinalResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'ranking_option_id',
        'verification_score',
        'judging_score',
        'final_score',
        'rank_in_category',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'verification_score' => 'float',
            'judging_score' => 'float',
            'final_score' => 'float',
            'rank_in_category' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function rankingOption(): BelongsTo
    {
        return $this->belongsTo(CategoryOption::class, 'ranking_option_id');
    }
}
