<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Konflik Kepentingan (PRD 2.3)
    |--------------------------------------------------------------------------
    | Verifikator/juri selalu diblokir dari project di mana ia anggota tim.
    | Jika opsi ini aktif, project dari unit kerja yang sama juga diblokir.
    */
    'block_same_unit' => env('BMG_BLOCK_SAME_UNIT', false),

    /*
    |--------------------------------------------------------------------------
    | Batas Upload (PAR-04, PAR-05)
    |--------------------------------------------------------------------------
    */
    'upload' => [
        'max_document_kb' => env('BMG_MAX_DOCUMENT_KB', 20480), // 20 MB
        'max_video_kb' => env('BMG_MAX_VIDEO_KB', 102400),      // 100 MB
        'max_files_per_project' => env('BMG_MAX_FILES_PER_PROJECT', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pengingat Deadline (NOT-04): H-3 dan H-1
    |--------------------------------------------------------------------------
    */
    'reminder_days' => [3, 1],
];
