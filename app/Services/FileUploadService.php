<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\User;
use Illuminate\Http\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Upload berkas project (PAR-04, PAR-05, Task 3.6 & 3.7):
 *  - validasi MIME + ekstensi, batas ukuran per kategori
 *  - upload bertahap (chunked) untuk file besar dengan retry di sisi client
 *  - disimpan privat: events/{event_id}/projects/{project_id}/{uuid}.{ext}
 */
class FileUploadService
{
    /** Ekstensi => daftar MIME yang diterima. */
    public const ALLOWED = [
        'pdf' => ['application/pdf'],
        'ppt' => ['application/vnd.ms-powerpoint', 'application/octet-stream'],
        'pptx' => ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/octet-stream'],
        'xls' => ['application/vnd.ms-excel', 'application/octet-stream'],
        'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/octet-stream'],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'mp4' => ['video/mp4', 'application/mp4'],
    ];

    /** Ekstensi yang diizinkan per kategori berkas. */
    public const CATEGORY_EXTENSIONS = [
        ProjectFile::CATEGORY_SUPPORTING => ['pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'mp4'],
        ProjectFile::CATEGORY_FINAL_PRESENTATION => ['pdf'],
        ProjectFile::CATEGORY_FINAL_PRESENTATION_SOURCE => ['ppt', 'pptx'],
        ProjectFile::CATEGORY_FINAL_VIDEO => ['mp4'],
        ProjectFile::CATEGORY_VISIT_PHOTO => ['jpg', 'jpeg', 'png'],
    ];

    public const CHUNK_DIR = 'chunks';

    /**
     * Validasi & simpan berkas utuh.
     */
    public function store(Project $project, UploadedFile|File $file, string $originalName, string $category, User $uploader, ?int $visitId = null): ProjectFile
    {
        $this->assertCategory($category);
        $this->assertQuota($project, $category);

        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $size = $file->getSize();

        $this->assertType($extension, $mime, $category);
        $this->assertSize($extension, $size);

        $eventId = $project->stream?->event_id ?? 'default';
        $dir = "private/events/{$eventId}/projects/{$project->id}";
        $name = Str::uuid()->toString().'.'.$extension;

        $path = Storage::putFileAs($dir, $file, $name);

        // Final presentation / video hanya satu per project: ganti yang lama
        if (in_array($category, [ProjectFile::CATEGORY_FINAL_PRESENTATION, ProjectFile::CATEGORY_FINAL_PRESENTATION_SOURCE, ProjectFile::CATEGORY_FINAL_VIDEO], true)) {
            $project->files()->where('file_category', $category)->get()->each->delete();
        }

        return $project->files()->create([
            'charter_version_id' => $project->current_version_id,
            'verification_visit_id' => $visitId,
            'file_category' => $category,
            'storage_path' => $path,
            'original_name' => $originalName,
            'mime_type' => $mime,
            'size_bytes' => $size,
            'uploaded_by' => $uploader->id,
        ]);
    }

    /**
     * Tautan video eksternal (PAR-05): Google Drive / OneDrive / YouTube.
     */
    public function storeLink(Project $project, string $url, string $title, string $category, User $uploader): ProjectFile
    {
        $this->assertCategory($category);
        $this->assertQuota($project, $category);

        $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
        $allowedHosts = ['drive.google.com', 'docs.google.com', 'youtube.com', 'www.youtube.com', 'youtu.be', 'onedrive.live.com', '1drv.ms', 'sharepoint.com'];
        $ok = collect($allowedHosts)->contains(fn ($h) => $host === $h || str_ends_with($host, '.'.$h));

        if (! $ok || ! str_starts_with(strtolower($url), 'https://')) {
            throw ValidationException::withMessages([
                'external_url' => 'Tautan harus https dari Google Drive, OneDrive/SharePoint, atau YouTube.',
            ]);
        }

        if ($category === ProjectFile::CATEGORY_FINAL_VIDEO) {
            $project->files()->where('file_category', $category)->get()->each->delete();
        }

        return $project->files()->create([
            'charter_version_id' => $project->current_version_id,
            'file_category' => $category,
            'external_url' => $url,
            'original_name' => $title,
            'uploaded_by' => $uploader->id,
        ]);
    }

    /**
     * Terima satu potongan (chunk). Mengembalikan ProjectFile bila potongan terakhir.
     */
    public function storeChunk(
        Project $project,
        UploadedFile $chunk,
        string $uploadId,
        int $index,
        int $total,
        string $originalName,
        string $category,
        User $uploader,
    ): ?ProjectFile {
        $this->assertCategory($category);

        if (! preg_match('/^[A-Za-z0-9\-]{8,64}$/', $uploadId) || $index < 0 || $total < 1 || $index >= $total || $total > 200) {
            throw ValidationException::withMessages(['file' => 'Parameter upload bertahap tidak valid.']);
        }

        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (! in_array($extension, self::CATEGORY_EXTENSIONS[$category], true)) {
            throw ValidationException::withMessages(['file' => $this->typeMessage($category)]);
        }

        $disk = Storage::disk('local');
        $dir = self::CHUNK_DIR."/{$uploader->id}/{$uploadId}";
        $disk->putFileAs($dir, $chunk, sprintf('%05d.part', $index));

        $parts = collect($disk->files($dir))->filter(fn ($f) => str_ends_with($f, '.part'))->sort()->values();
        if ($parts->count() < $total) {
            return null;
        }

        // Semua potongan diterima: gabungkan lalu validasi seperti upload biasa
        $assembled = $disk->path("{$dir}/assembled.{$extension}");
        $out = fopen($assembled, 'wb');
        foreach ($parts as $part) {
            $in = fopen($disk->path($part), 'rb');
            stream_copy_to_stream($in, $out);
            fclose($in);
        }
        fclose($out);

        try {
            return $this->store($project, new File($assembled), $originalName, $category, $uploader);
        } finally {
            $disk->deleteDirectory($dir);
        }
    }

    public function maxKbFor(string $extension): int
    {
        return $extension === 'mp4'
            ? (int) config('bmg.upload.max_video_kb')
            : (int) config('bmg.upload.max_document_kb');
    }

    protected function assertCategory(string $category): void
    {
        if (! array_key_exists($category, self::CATEGORY_EXTENSIONS)) {
            throw ValidationException::withMessages(['file_category' => 'Kategori berkas tidak dikenal.']);
        }
    }

    protected function assertQuota(Project $project, string $category): void
    {
        if ($category === ProjectFile::CATEGORY_VISIT_PHOTO) {
            return;
        }

        $limit = (int) config('bmg.upload.max_files_per_project');
        $replaceable = in_array($category, [ProjectFile::CATEGORY_FINAL_PRESENTATION, ProjectFile::CATEGORY_FINAL_PRESENTATION_SOURCE, ProjectFile::CATEGORY_FINAL_VIDEO], true)
            && $project->files()->where('file_category', $category)->exists();

        $count = $project->files()->where('file_category', '!=', ProjectFile::CATEGORY_VISIT_PHOTO)->count();

        if (! $replaceable && $count >= $limit) {
            throw ValidationException::withMessages([
                'file' => "Maksimal {$limit} berkas per project. Hapus berkas lama yang tidak diperlukan terlebih dahulu.",
            ]);
        }
    }

    protected function assertType(string $extension, string $mime, string $category): void
    {
        $allowedExt = self::CATEGORY_EXTENSIONS[$category];

        if (! in_array($extension, $allowedExt, true) || ! in_array($mime, self::ALLOWED[$extension] ?? [], true)) {
            throw ValidationException::withMessages(['file' => $this->typeMessage($category)]);
        }
    }

    protected function assertSize(string $extension, int $bytes): void
    {
        $maxKb = $this->maxKbFor($extension);

        if ($bytes > $maxKb * 1024) {
            $mb = round($maxKb / 1024);
            $hint = $extension === 'mp4' ? ' Untuk video besar, tempelkan link Google Drive / OneDrive / YouTube unlisted.' : '';

            throw ValidationException::withMessages([
                'file' => "Ukuran berkas melebihi batas {$mb} MB.{$hint}",
            ]);
        }
    }

    protected function typeMessage(string $category): string
    {
        $list = strtoupper(implode(', ', self::CATEGORY_EXTENSIONS[$category]));

        return "Format berkas tidak didukung untuk kategori ini. Gunakan: {$list}.";
    }
}
