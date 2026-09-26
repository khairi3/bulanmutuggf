<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoryOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'dimension_id',
        'name',
        'abbreviation',
        'sort_order',
        'quota',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'quota' => 'integer',
        ];
    }

    public function dimension(): BelongsTo
    {
        return $this->belongsTo(CategoryDimension::class, 'dimension_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }
}
