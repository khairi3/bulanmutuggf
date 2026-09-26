<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_CLOSED = 'closed';

    protected $fillable = [
        'name',
        'year',
        'status',
        'final_weight_verification',
        'final_weight_judging',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'final_weight_verification' => 'float',
            'final_weight_judging' => 'float',
        ];
    }

    public function streams(): HasMany
    {
        return $this->hasMany(Stream::class);
    }

    public static function active(): ?self
    {
        return self::where('status', self::STATUS_ACTIVE)->first();
    }
}
