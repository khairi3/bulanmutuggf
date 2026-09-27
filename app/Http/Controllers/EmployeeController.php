<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Services\EmployeeImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function __construct(
        protected EmployeeImportService $importService
    ) {}

    /**
     * Display employees list and import interface.
     */
    public function index(Request $request): Response
    {
        $query = Employee::with('user.roles');

        if ($request->has('search') && $request->input('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('employee_index', 'like', "%{$search}%")
                    ->orWhere('full_name', 'like', "%{$search}%")
                    ->orWhere('unit', 'like', "%{$search}%");
            });
        }

        if ($request->has('unit') && $request->input('unit')) {
            $query->where('unit', $request->input('unit'));
        }

        $employees = $query->latest()->paginate(15)->withQueryString();
        $units = Employee::whereNotNull('unit')->distinct()->pluck('unit');

        return Inertia::render('Admin/Employees/Index', [
            'employees' => $employees,
            'units' => $units,
            'filters' => $request->only(['search', 'unit']),
        ]);
    }

    /**
     * Download template import master data karyawan (XLSX / CSV).
     */
    public function downloadTemplate(Request $request): mixed
    {
        $format = $request->input('format', 'xlsx');

        return $this->importService->downloadTemplate($format);
    }

    /**
     * Preview uploaded CSV / Excel file before committing (EMP-02).
     */
    public function previewImport(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:10240'], // 10MB max
        ], [
            'file.required' => 'Silakan pilih file untuk diunggah.',
            'file.mimes' => 'Format file harus berupa CSV (.csv) atau Excel (.xlsx, .xls).',
            'file.max' => 'Ukuran file maksimal adalah 10 MB.',
        ]);

        $result = $this->importService->preview($request->file('file'));

        if (! $result['success']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    /**
     * Commit validated import data to database.
     */
    public function commitImport(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
        ]);

        $result = $this->importService->commit($request->input('token'));

        if (! $result['success']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    /**
     * API for Employee Autocomplete (EMP-03, EMP-04).
     * Requirement: >= 3 chars, active employees only.
     */
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));

        if (mb_strlen($query) < 3) {
            return response()->json([]);
        }

        $employees = Employee::where('is_active', true) // EMP-04: only active
            ->where(function ($q) use ($query) {
                $q->where('employee_index', 'like', "{$query}%")
                    ->orWhere('full_name', 'like', "%{$query}%");
            })
            ->select(['id', 'employee_index', 'full_name', 'employee_level', 'position', 'unit', 'division', 'email', 'phone'])
            ->limit(15)
            ->get();

        return response()->json($employees);
    }

    /**
     * Toggle employee active status.
     */
    public function toggleActive(Employee $employee): RedirectResponse
    {
        $newState = ! $employee->is_active;
        $employee->update(['is_active' => $newState]);

        AuditLog::log(
            action: 'TOGGLE_EMPLOYEE_ACTIVE',
            entityType: 'Employee',
            entityId: $employee->id,
            after: ['is_active' => $newState],
            reason: $newState ? "Mengaktifkan kembali karyawan {$employee->full_name}" : "Menonaktifkan karyawan {$employee->full_name}"
        );

        return back()->with('success', "Status karyawan {$employee->full_name} berhasil diubah.");
    }
}
