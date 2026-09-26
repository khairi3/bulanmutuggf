<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Phase extends Model
{
    use HasFactory;

    public const REGISTRATION = 'registration';

    public const VERIFICATION = 'verification';

    public const SELECTION = 'selection';

    public const FINALISATION = 'finalisation';

    public const JUDGING = 'judging';

    public const ANNOUNCEMENT = 'announcement';

    protected $fillable = [
        'stream_id',
        'phase_type',
        'start_at',
        'end_at',
        'is_locked',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'is_locked' => 'boolean',
        ];
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function isOpen(): bool
    {
        if ($this->is_locked) {
            return false;
        }

        $now = now();

        return (! $this->start_at || $this->start_at <= $now) &&
               (! $this->end_at || $this->end_at >= $now);
    }
}
