<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Writer\XLSX\Writer;

class EmployeeImportService
{
    /**
     * Parse and validate file, returning preview and error report.
     */
    public function preview(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $filePath = $file->getRealPath();

        $rows = [];
        if ($extension === 'xlsx') {
            $reader = new XlsxReader;
            $reader->open($filePath);
            foreach ($reader->getSheetIterator() as $sheet) {
                foreach ($sheet->getRowIterator() as $row) {
                    $rows[] = array_map(fn ($val) => trim((string) $val), $row->toArray());
                }
                break; // read first sheet only
            }
            $reader->close();
        } else {
            // CSV / default
            $handle = fopen($filePath, 'r');
            if ($handle) {
                while (($data = fgetcsv($handle, 2000, ',')) !== false) {
                    $rows[] = array_map('trim', $data);
                }
                fclose($handle);
            }
        }

        if (empty($rows)) {
            return [
                'success' => false,
                'message' => 'File kosong atau format tidak terbaca.',
            ];
        }

        // Header mapping
        $headerRow = array_map('strtolower', array_shift($rows));
        $colMap = $this->mapHeaders($headerRow);

        if (! isset($colMap['employee_index']) || ! isset($colMap['full_name'])) {
            return [
                'success' => false,
                'message' => 'Kolom wajib tidak ditemukan. Pastikan ada kolom "employee_index" (atau NIK) dan "full_name" (atau Nama).',
            ];
        }

        $validRows = [];
        $errors = [];
        $seenIndices = [];

        // Preload existing indices to check duplicates in DB
        $existingIndices = Employee::pluck('employee_index')->flip()->toArray();

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // account for header & 1-based index

            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            $empIndex = $row[$colMap['employee_index']] ?? '';
            $fullName = $row[$colMap['full_name']] ?? '';
            $level = isset($colMap['employee_level']) ? ($row[$colMap['employee_level']] ?? null) : null;
            $position = isset($colMap['position']) ? ($row[$colMap['position']] ?? null) : null;
            $unit = isset($colMap['unit']) ? ($row[$colMap['unit']] ?? null) : null;
            $division = isset($colMap['division']) ? ($row[$colMap['division']] ?? null) : null;
            $email = isset($colMap['email']) ? ($row[$colMap['email']] ?? null) : null;
            $phone = isset($colMap['phone']) ? ($row[$colMap['phone']] ?? null) : null;

            // Validations
            $rowErrors = [];
            if (empty($empIndex)) {
                $rowErrors[] = 'Index / NIK Karyawan kosong';
            } elseif (isset($seenIndices[$empIndex])) {
                $rowErrors[] = "Index '{$empIndex}' duplikat di dalam file (baris {$seenIndices[$empIndex]})";
            } else {
                $seenIndices[$empIndex] = $rowNumber;
            }

            if (empty($fullName)) {
                $rowErrors[] = 'Nama Lengkap kosong';
            }

            if (! empty($email) && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $rowErrors[] = "Format email '{$email}' tidak valid";
            }

            if (! empty($rowErrors)) {
                $errors[] = [
                    'row' => $rowNumber,
                    'index' => $empIndex ?: '-',
                    'name' => $fullName ?: '-',
                    'errors' => $rowErrors,
                ];
            } else {
                $isUpdate = isset($existingIndices[$empIndex]);
                $validRows[] = [
                    'employee_index' => $empIndex,
                    'full_name' => $fullName,
                    'employee_level' => $level,
                    'position' => $position,
                    'unit' => $unit,
                    'division' => $division,
                    'email' => $email ?: null,
                    'phone' => $phone ?: null,
                    'is_update' => $isUpdate,
                ];
            }
        }

        $importToken = Str::uuid()->toString();
        Cache::put('import_'.$importToken, $validRows, now()->addMinutes(60));

        return [
            'success' => true,
            'token' => $importToken,
            'total_rows' => count($validRows) + count($errors),
            'valid_count' => count($validRows),
            'error_count' => count($errors),
            'preview_rows' => array_slice($validRows, 0, 10),
            'errors' => $errors,
        ];
    }

    /**
     * Commit valid preview data to database.
     */
    public function commit(string $token): array
    {
        $validRows = Cache::get('import_'.$token);

        if (! $validRows) {
            return [
                'success' => false,
                'message' => 'Sesi import telah kedaluwarsa atau tidak ditemukan. Silakan upload ulang file Anda.',
            ];
        }

        $participantRole = Role::where('code', Role::PARTICIPANT)->first();
        $importedCount = 0;
        $updatedCount = 0;

        DB::transaction(function () use ($validRows, $participantRole, &$importedCount, &$updatedCount) {
            $defaultPassword = Hash::make('password123');

            foreach ($validRows as $row) {
                $employee = Employee::updateOrCreate(
                    ['employee_index' => $row['employee_index']],
                    [
                        'full_name' => $row['full_name'],
                        'employee_level' => $row['employee_level'],
                        'position' => $row['position'],
                        'unit' => $row['unit'],
                        'division' => $row['division'],
                        'email' => $row['email'],
                        'phone' => $row['phone'],
                        'is_active' => true,
                    ]
                );

                if ($row['is_update']) {
                    $updatedCount++;
                } else {
                    $importedCount++;
                }

                // Ensure user account exists
                $user = User::firstOrCreate(
                    ['employee_id' => $employee->id],
                    [
                        'password' => $defaultPassword,
                        'must_change_password' => true,
                    ]
                );

                // Assign default participant role if no role
                if ($user->roles()->count() === 0 && $participantRole) {
                    $user->roles()->attach($participantRole->id);
                }
            }

            AuditLog::log(
                action: 'IMPORT_EMPLOYEES',
                entityType: 'Employee',
                reason: "Import karyawan berhasil: {$importedCount} data baru, {$updatedCount} diperbarui."
            );
        });

        Cache::forget('import_'.$token);

        return [
            'success' => true,
            'imported_count' => $importedCount,
            'updated_count' => $updatedCount,
            'total' => $importedCount + $updatedCount,
        ];
    }

    /**
     * Map fuzzy header names to standard keys.
     */
    protected function mapHeaders(array $headers): array
    {
        $map = [];
        foreach ($headers as $idx => $header) {
            $h = strtolower(trim($header));
            $h = str_replace([' ', '_', '-'], '', $h);

            if (in_array($h, ['employeeindex', 'index', 'nik', 'idkaryawan', 'noindex'])) {
                $map['employee_index'] = $idx;
            } elseif (in_array($h, ['fullname', 'nama', 'namalengkap', 'name'])) {
                $map['full_name'] = $idx;
            } elseif (in_array($h, ['employeelevel', 'level', 'tingkat', 'golongan'])) {
                $map['employee_level'] = $idx;
            } elseif (in_array($h, ['position', 'jabatan', 'role'])) {
                $map['position'] = $idx;
            } elseif (in_array($h, ['unit', 'estate', 'pabrik', 'lokasi'])) {
                $map['unit'] = $idx;
            } elseif (in_array($h, ['division', 'divisi', 'departemen'])) {
                $map['division'] = $idx;
            } elseif (in_array($h, ['email', 'surel'])) {
                $map['email'] = $idx;
            } elseif (in_array($h, ['phone', 'nohp', 'telepon', 'hp', 'wa'])) {
                $map['phone'] = $idx;
            }
        }

        return $map;
    }

    /**
     * Download template file import master data karyawan (XLSX / CSV).
     */
    public function downloadTemplate(string $format = 'xlsx'): mixed
    {
        $headers = [
            'employee_index',
            'full_name',
            'employee_level',
            'position',
            'unit',
            'division',
            'email',
            'phone',
        ];

        $sampleRows = [
            ['EMP1001', 'Budi Santoso', 'Officer', 'Continuous Improvement Specialist', 'GGF HO', 'Operational Excellence', 'budi.s@ggf.co.id', '081234567890'],
            ['EMP1002', 'Siti Rahmawati', 'Section Head', 'Agronomy Specialist', 'PG1', 'Plantation PG1', 'siti.r@ggf.co.id', '081234567891'],
            ['EMP1003', 'Ahmad Hidayat', 'Department Head', 'Factory Quality Specialist', 'MFG', 'Quality Assurance', 'ahmad.h@ggf.co.id', '081234567892'],
            ['EMP1004', 'Nanang Kosim', 'Operator', 'Electrical Maintenance', 'MFG', 'Engineering Factory', '', '081234567893'],
        ];

        if (strtolower($format) === 'csv') {
            $filename = 'template_import_karyawan.csv';
            $responseHeaders = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            return response()->stream(function () use ($headers, $sampleRows) {
                $handle = fopen('php://output', 'w');
                // Write UTF-8 BOM for Microsoft Excel compatibility
                fwrite($handle, "\xEF\xBB\xBF");

                fputcsv($handle, $headers);
                foreach ($sampleRows as $row) {
                    fputcsv($handle, $row);
                }
                fclose($handle);
            }, 200, $responseHeaders);
        }

        // Default: Excel (.xlsx) using OpenSpout
        $tempPath = tempnam(sys_get_temp_dir(), 'tpl_emp_').'.xlsx';
        $writer = new Writer;
        $writer->openToFile($tempPath);

        $headerStyle = (new Style)
            ->withFontBold(true);

        $writer->addRow(Row::fromValuesWithStyle($headers, $headerStyle));

        foreach ($sampleRows as $rowValues) {
            $writer->addRow(Row::fromValues($rowValues));
        }

        $writer->close();

        return response()->download($tempPath, 'template_import_karyawan.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
