import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Button from '@/Components/Button';
import Input from '@/Components/Input';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import EmployeeAutocomplete from '@/Components/EmployeeAutocomplete';
import {
    Users,
    UploadCloud,
    Search,
    CheckCircle2,
    AlertCircle,
    FileSpreadsheet,
    Loader2,
    Filter,
    Shield,
    ToggleLeft,
    ToggleRight,
    Download,
} from 'lucide-react';

export default function EmployeesIndex({ employees, units, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedUnit, setSelectedUnit] = useState(filters?.unit || '');

    // Import Modal States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [commitLoading, setCommitLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [importError, setImportError] = useState(null);

    // Autocomplete Demo State
    const [demoEmployee, setDemoEmployee] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/employees', { search, unit: selectedUnit }, { preserveState: true });
    };

    const handleUnitFilter = (unit) => {
        setSelectedUnit(unit);
        router.get('/admin/employees', { search, unit }, { preserveState: true });
    };

    const handleToggleActive = (emp) => {
        router.post(`/admin/employees/${emp.id}/toggle-active`, {}, { preserveScroll: true });
    };

    // Upload & Preview Handler (EMP-02 Step 1)
    const handlePreviewFile = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        setImportLoading(true);
        setImportError(null);

        const formData = new FormData();
        formData.append('file', uploadFile);

        try {
            const res = await fetch('/admin/employees/preview-import', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: formData,
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setPreviewData(data);
            } else {
                setImportError(data.message || 'Gagal memproses file.');
            }
        } catch (err) {
            setImportError('Terjadi kesalahan jaringan saat memproses file.');
        } finally {
            setImportLoading(false);
        }
    };

    // Commit Import Handler (EMP-02 Step 2)
    const handleCommitImport = async () => {
        if (!previewData?.token) return;

        setCommitLoading(true);
        try {
            const res = await fetch('/admin/employees/commit-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ token: previewData.token }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setIsImportModalOpen(false);
                setPreviewData(null);
                setUploadFile(null);
                router.reload();
            } else {
                setImportError(data.message || 'Gagal menyimpan data import.');
            }
        } catch (err) {
            setImportError('Terjadi kesalahan saat menyimpan data import.');
        } finally {
            setCommitLoading(false);
        }
    };

    const columns = [
        {
            header: 'Index / NIK',
            accessor: 'employee_index',
            render: (row) => (
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                    {row.employee_index}
                </span>
            ),
        },
        {
            header: 'Nama Lengkap',
            accessor: 'full_name',
            render: (row) => (
                <div>
                    <span className="font-bold text-slate-900 text-sm block">{row.full_name}</span>
                    <span className="text-xs text-slate-400">{row.email || 'Tanpa email resmi'}</span>
                </div>
            ),
        },
        {
            header: 'Jabatan & Level',
            accessor: 'position',
            render: (row) => (
                <div>
                    <span className="text-xs text-slate-700 font-medium block">{row.position || '-'}</span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200 inline-block mt-0.5">
                        {row.employee_level || '-'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Unit & Divisi',
            accessor: 'unit',
            render: (row) => (
                <div className="text-xs">
                    <span className="font-semibold text-slate-800">{row.unit || '-'}</span>
                    <p className="text-slate-400 text-[11px]">{row.division || '-'}</p>
                </div>
            ),
        },
        {
            header: 'Status & Akun',
            accessor: 'is_active',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            row.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                    >
                        {row.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button
                        onClick={() => handleToggleActive(row)}
                        title={row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        className="text-slate-400 hover:text-slate-700 p-1"
                    >
                        {row.is_active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Data Karyawan</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Kelola data peserta, impor database HR, dan verifikasi komponen autocomplete (EMP-01 s/d EMP-04)
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="primary" onClick={() => setIsImportModalOpen(true)}>
                            <UploadCloud className="w-4 h-4 mr-2" />
                            <span>Import Excel/CSV</span>
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Master Karyawan - Bulan Mutu GGF" />

            <div className="space-y-6">
                {/* 1. Interactive Demo of Autocomplete EMP-03 */}
                <Card
                    title="Live Test: Komponen Autocomplete Karyawan (EMP-03 & EMP-04)"
                    subtitle="Ketik minimal 3 karakter untuk mencari NIK/Nama. Data terkunci otomatis saat dipilih."
                    className="border-emerald-200 bg-emerald-50/20"
                >
                    <div className="max-w-xl">
                        <EmployeeAutocomplete
                            selectedEmployee={demoEmployee}
                            onSelect={(emp) => setDemoEmployee(emp)}
                            onClear={() => setDemoEmployee(null)}
                            placeholder="Coba ketik 'Budi' atau 'PG1' atau 'EMP100'..."
                        />
                    </div>
                </Card>

                {/* 2. Filter & Search Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari NIK, Nama, atau Unit..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm">
                            Cari
                        </Button>
                    </form>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-xs text-slate-400 font-semibold shrink-0">Filter Unit:</span>
                        <button
                            type="button"
                            onClick={() => handleUnitFilter('')}
                            className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                                !selectedUnit ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'
                            }`}
                        >
                            Semua
                        </button>
                        {units?.map((u) => (
                            <button
                                key={u}
                                type="button"
                                onClick={() => handleUnitFilter(u)}
                                className={`text-xs px-2.5 py-1 rounded-md font-medium border shrink-0 ${
                                    selectedUnit === u
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {u}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Employees Table */}
                <Card>
                    <Table
                        columns={columns}
                        data={employees?.data || []}
                        emptyMessage="Tidak ada data karyawan yang cocok."
                    />

                    {/* Pagination */}
                    {employees?.links?.length > 3 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Menampilkan {employees.from || 0} - {employees.to || 0} dari {employees.total} karyawan</span>
                            <div className="flex gap-1">
                                {employees.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`px-3 py-1.5 rounded border text-xs font-semibold ${
                                            link.active
                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                : !link.url
                                                ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                                                : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* MODAL IMPORT KARYAWAN (EMP-01 & EMP-02) */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => {
                    setIsImportModalOpen(false);
                    setPreviewData(null);
                    setUploadFile(null);
                    setImportError(null);
                }}
                title="Import Master Data Karyawan (EMP-01 & EMP-02)"
                description="Unggah file CSV atau Excel untuk menambahkan/memperbarui data peserta secara massal."
                maxWidth="2xl"
                footer={
                    previewData ? (
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setPreviewData(null);
                                    setUploadFile(null);
                                }}
                            >
                                Upload Ulang File
                            </Button>
                            <Button
                                variant="primary"
                                loading={commitLoading}
                                onClick={handleCommitImport}
                                disabled={previewData.valid_count === 0}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                <span>Konfirmasi & Simpan ({previewData.valid_count} Baris)</span>
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="secondary"
                            onClick={() => setIsImportModalOpen(false)}
                        >
                            Tutup
                        </Button>
                    )
                }
            >
                {!previewData ? (
                    // Step 1: Upload Form
                    <form onSubmit={handlePreviewFile} className="space-y-4">
                        <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-50">
                            <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                            <h4 className="text-sm font-bold text-slate-800 mb-1">
                                {uploadFile ? uploadFile.name : 'Pilih file CSV atau Excel (.xlsx)'}
                            </h4>
                            <p className="text-xs text-slate-500 mb-4">
                                Format kolom wajib: <code>employee_index</code>, <code>full_name</code>, <code>employee_level</code>, <code>position</code>, <code>unit</code>, <code>division</code>, <code>email</code>.
                            </p>
                            <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs">
                                <span>Pilih Berkas</span>
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls,text/csv"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {importError && (
                            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{importError}</span>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={!uploadFile}
                                loading={importLoading}
                            >
                                Validasi & Pratinjau (Preview)
                            </Button>
                        </div>
                    </form>
                ) : (
                    // Step 2: Preview & Validation Report (EMP-02)
                    <div className="space-y-4">
                        {/* Summary Badges */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                <p className="text-xs text-slate-500 font-semibold">Total Baris</p>
                                <p className="text-lg font-bold text-slate-800 mt-0.5">{previewData.total_rows}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                                <p className="text-xs text-emerald-700 font-semibold">Baris Valid</p>
                                <p className="text-lg font-bold text-emerald-800 mt-0.5">{previewData.valid_count}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                                <p className="text-xs text-rose-700 font-semibold">Baris Error</p>
                                <p className="text-lg font-bold text-rose-800 mt-0.5">{previewData.error_count}</p>
                            </div>
                        </div>

                        {/* Error List if any */}
                        {previewData.error_count > 0 && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3 max-h-40 overflow-y-auto">
                                <h5 className="text-xs font-bold text-rose-800 mb-1.5 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>Laporan Baris Gagal Validasi ({previewData.error_count}):</span>
                                </h5>
                                <ul className="space-y-1 text-[11px] text-rose-700">
                                    {previewData.errors.map((err, i) => (
                                        <li key={i} className="flex items-start gap-1">
                                            <strong>Baris {err.row} ({err.index}):</strong>
                                            <span>{err.errors.join(', ')}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Valid Preview Table */}
                        {previewData.valid_count > 0 && (
                            <div>
                                <h5 className="text-xs font-bold text-slate-700 mb-1.5">
                                    Pratinjau Data Valid (Maks. 10 baris pertama):
                                </h5>
                                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-44 text-[11px]">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                                            <tr>
                                                <th className="p-2">Index</th>
                                                <th className="p-2">Nama</th>
                                                <th className="p-2">Unit</th>
                                                <th className="p-2">Jabatan</th>
                                                <th className="p-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {previewData.preview_rows.map((r, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-2 font-mono font-bold text-slate-800">{r.employee_index}</td>
                                                    <td className="p-2 font-semibold text-slate-900">{r.full_name}</td>
                                                    <td className="p-2 text-slate-600">{r.unit || '-'}</td>
                                                    <td className="p-2 text-slate-600">{r.position || '-'}</td>
                                                    <td className="p-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.is_update ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                            {r.is_update ? 'Update' : 'Baru'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}
