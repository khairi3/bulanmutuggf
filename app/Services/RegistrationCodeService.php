<?php

namespace App\Services;

use App\Models\CategoryOption;
use App\Models\Project;
use App\Models\RegistrationSequence;
use App\Models\Stream;
use Illuminate\Support\Facades\DB;

class RegistrationCodeService
{
    /**
     * Generate unique registration code with row locking to prevent duplicates.
     */
    public function generateCode(Stream $stream, array $categoryOptionIds): string
    {
        return DB::transaction(function () use ($stream, $categoryOptionIds) {
            $prefix = $this->determinePrefix($stream, $categoryOptionIds);

            // Row lock on registration_sequences for this stream and prefix
            $sequence = RegistrationSequence::where('stream_id', $stream->id)
                ->where('prefix', $prefix)
                ->lockForUpdate()
                ->first();

            // Find highest existing number from projects table for this prefix to avoid collisions with seeded/pre-existing data
            $highestProjectNumber = (int) (Project::where('registration_code', 'LIKE', "{$prefix}-%")
                ->pluck('registration_code')
                ->map(function ($code) {
                    $parts = explode('-', $code);

                    return (int) end($parts);
                })
                ->max() ?? 0);

            if (! $sequence) {
                $sequence = RegistrationSequence::create([
                    'stream_id' => $stream->id,
                    'prefix' => $prefix,
                    'last_number' => $highestProjectNumber,
                ]);

                // Re-lock the newly created row
                $sequence = RegistrationSequence::where('id', $sequence->id)
                    ->lockForUpdate()
                    ->first();
            } else {
                // If sequence table is behind existing projects in DB, sync it up
                if ($sequence->last_number < $highestProjectNumber) {
                    $sequence->update(['last_number' => $highestProjectNumber]);
                }
            }

            $nextNumber = max($sequence->last_number, $highestProjectNumber) + 1;

            // Collision check: verify code is truly unused, increment if already taken
            while (Project::where('registration_code', "{$prefix}-".sprintf('%03d', $nextNumber))->exists()) {
                $nextNumber++;
            }

            $sequence->update(['last_number' => $nextNumber]);

            $formattedNumber = sprintf('%03d', $nextNumber);

            return "{$prefix}-{$formattedNumber}";
        });
    }

    /**
     * Determine code prefix based on stream and chosen category options.
     */
    public function determinePrefix(Stream $stream, array $categoryOptionIds): string
    {
        if ($stream->code === Stream::CODE_K3) {
            return 'SIGAP';
        }

        if ($stream->code === Stream::CODE_ENERGY) {
            return 'ENRG';
        }

        if ($stream->code === Stream::CODE_TPM) {
            return 'TPM';
        }

        // For CIC and generic streams, order options by dimension code_order
        if (! empty($categoryOptionIds)) {
            $options = CategoryOption::with('dimension')
                ->whereIn('id', $categoryOptionIds)
                ->get()
                ->sortBy(fn ($opt) => $opt->dimension?->code_order ?? 99);

            $abbrs = $options->pluck('abbreviation')->implode('');
            if (! empty($abbrs)) {
                return $abbrs;
            }
        }

        return $stream->code;
    }
}
