<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoryDimension extends Model
{
    use HasFactory;

    protected $fillable = [
        'stream_id',
        'code',
        'name',
        'code_order',
        'is_required',
    ];

    protected function casts(): array
    {
        return [
            'code_order' => 'integer',
            'is_required' => 'boolean',
        ];
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(CategoryOption::class, 'dimension_id')->orderBy('sort_order');
    }
}
