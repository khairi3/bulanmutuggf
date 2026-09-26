<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectFile extends Model
{
    use HasFactory, SoftDeletes;

    public const CATEGORY_SUPPORTING = 'supporting';

    public const CATEGORY_FINAL_PRESENTATION = 'final_presentation';

    public const CATEGORY_FINAL_PRESENTATION_SOURCE = 'final_presentation_source';

    public const CATEGORY_FINAL_VIDEO = 'final_video';

    public const CATEGORY_VISIT_PHOTO = 'visit_photo';

    public const CATEGORIES = [
        self::CATEGORY_SUPPORTING,
        self::CATEGORY_FINAL_PRESENTATION,
        self::CATEGORY_FINAL_PRESENTATION_SOURCE,
        self::CATEGORY_FINAL_VIDEO,
        self::CATEGORY_VISIT_PHOTO,
    ];

    protected $appends = ['formatted_size'];

    protected $hidden = ['storage_path'];

    protected $fillable = [
        'project_id',
        'charter_version_id',
        'verification_visit_id',
        'file_category',
        'storage_path',
        'external_url',
        'original_name',
        'mime_type',
        'size_bytes',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function charterVersion(): BelongsTo
    {
        return $this->belongsTo(CharterVersion::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFormattedSizeAttribute(): string
    {
        if (! $this->size_bytes) {
            return '-';
        }
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = $this->size_bytes;
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2).' '.$units[$i];
    }
}
