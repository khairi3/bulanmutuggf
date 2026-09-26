<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VerificationVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'verifier_user_id',
        'visit_date',
        'location',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'visit_date' => 'date:Y-m-d',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verifier_user_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ProjectFile::class, 'verification_visit_id');
    }
}
