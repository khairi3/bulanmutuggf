import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Button from '@/Components/Button';
import Input from '@/Components/Input';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
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
    X,
    KeyRound,
    Copy,
    Check,
    Eye,
    EyeOff,
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

    // Reset Password Modal States
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [selectedEmployeeForReset, setSelectedEmployeeForReset] = useState(null);
    const [resetPasswordValue, setResetPasswordValue] = useState('password123');
    const [showPassword, setShowPassword] = useState(false);
    const [mustChangePassword, setMustChangePassword] = useState(true);
    const [resetReason, setResetReason] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [resetSuccessData, setResetSuccessData] = useState(null);

    const handleOpenResetModal = (employee) => {
        setSelectedEmployeeForReset(employee);
        setResetPasswordValue('password123');
        setShowPassword(false);
        setMustChangePassword(true);
        setResetReason('');
        setResetSuccessData(null);
        setCopySuccess(false);
        setIsResetModalOpen(true);
    };

    const handleConfirmResetPassword = (e) => {
        e.preventDefault();
        if (!selectedEmployeeForReset) return;

        setResetLoading(true);
        router.post(
            `/admin/employees/${selectedEmployeeForReset.id}/reset-password`,
            {
                password: resetPasswordValue,
                must_change_password: mustChangePassword,
                reason: resetReason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setResetLoading(false);
                    setResetSuccessData({
                        employee_index: selectedEmployeeForReset.employee_index,
                        full_name: selectedEmployeeForReset.full_name,
                        password: resetPasswordValue,
                        must_change: mustChangePassword,
                    });
                },
                onError: () => {
                    setResetLoading(false);
                },
            }
        );
    };

    const handleCopyCredentials = () => {
        if (!resetSuccessData) return;
        const text = `Halo ${resetSuccessData.full_name},\nBerikut adalah informasi akun login Portal Bulan Mutu GGF:\n- NIK / ID: ${resetSuccessData.employee_index}\n- Password: ${resetSuccessData.password}\n\nSilakan login di sistem. ${resetSuccessData.must_change ? 'Anda akan diminta mengganti password saat login pertama kali.' : ''}`;
        navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
    };

    // Live Search Autocomplete States
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchContainerRef = useRef(null);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Live search query effect
    useEffect(() => {
        if (!search || search.trim().length < 3) {
            setSearchSuggestions([]);
            setIsSearchOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`/api/employees/search?q=${encodeURIComponent(search.trim())}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchSuggestions(data);
                    setIsSearchOpen(true);
                }
            } catch (err) {
                console.error('Error fetching employee suggestions:', err);
            } finally {
                setSearchLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [search]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setIsSearchOpen(false);
        router.get('/admin/employees', { search, unit: selectedUnit }, { preserveState: true });
    };

    const handleSelectSuggestion = (emp) => {
        setSearch(emp.full_name);
        setIsSearchOpen(false);
        router.get('/admin/employees', { search: emp.full_name, unit: selectedUnit }, { preserveState: true });
    };

    const handleUnitFilter = (unit) => {
        setSelectedUnit(unit);
        setIsSearchOpen(false);
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
                <div className="flex flex-col gap-1">
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
                            type="button"
                            onClick={() => handleToggleActive(row)}
                            title={row.is_active ? 'Nonaktifkan Karyawan' : 'Aktifkan Karyawan'}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                        >
                            {row.is_active ? (
                                <ToggleRight className="w-5 h-5 text-emerald-600" />
                            ) : (
                                <ToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                        </button>
                    </div>
                    <div>
                        {row.user ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Akun Terdaftar
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                Belum Aktivasi
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: 'Aksi',
            accessor: 'actions',
            render: (row) => (
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => handleOpenResetModal(row)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-xs ${
                            row.user
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300/90'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300/90'
                        }`}
                        title={row.user ? 'Reset Password Akun' : 'Buat Akun & Set Password'}
                    >
                        <KeyRound className={`w-3.5 h-3.5 ${row.user ? 'text-amber-600' : 'text-emerald-600'} shrink-0`} />
                        <span>{row.user ? 'Reset Password' : 'Set Password'}</span>
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
                            Kelola data master karyawan, status keaktifan, dan impor database HR.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href="/admin/employees/template?format=xlsx"
                            className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
                            title="Unduh Template Excel (.xlsx) untuk Import Data Karyawan"
                        >
                            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
                            <span>Download Template</span>
                        </a>
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
                {/* Filter & Search Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Kolom Pencarian yang Diperlebar dengan Saran Otomatis (Autocomplete) */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
                        <div ref={searchContainerRef} className="relative w-full">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                {searchLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Cari NIK, Nama Karyawan, Jabatan, atau Unit..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onFocus={() => {
                                    if (searchSuggestions.length > 0) setIsSearchOpen(true);
                                }}
                                className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-xs"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setSearchSuggestions([]);
                                        setIsSearchOpen(false);
                                        router.get('/admin/employees', { search: '', unit: selectedUnit }, { preserveState: true });
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded"
                                    title="Hapus kata kunci pencarian"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}

                            {/* Dropdown Hasil Pencarian Langsung */}
                            {isSearchOpen && (
                                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-80 overflow-y-auto">
                                    {searchSuggestions.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-500">
                                            Tidak ada karyawan aktif yang cocok dengan "<strong>{search}</strong>".
                                            <p className="mt-1 text-[11px] text-slate-400">Tekan Enter atau klik Cari untuk mencari di database.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                                <span>Pilih nama karyawan untuk melihat data:</span>
                                                <span className="text-emerald-700 font-bold">{searchSuggestions.length} ditemukan</span>
                                            </div>
                                            <div className="divide-y divide-slate-100">
                                                {searchSuggestions.map((emp) => (
                                                    <button
                                                        key={emp.id}
                                                        type="button"
                                                        onClick={() => handleSelectSuggestion(emp)}
                                                        className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/80 transition-colors flex items-center justify-between group"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 uppercase group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                                {emp.full_name?.charAt(0) || 'K'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                                                                    {emp.full_name}
                                                                </p>
                                                                <p className="text-xs text-slate-500 font-mono truncate">
                                                                    {emp.employee_index} · {emp.position || '-'} · <span className="font-sans text-slate-600 font-medium">{emp.unit || '-'}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-700 shrink-0 ml-2">
                                                            Pilih →
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <Button type="submit" variant="secondary" size="md" className="px-5 font-semibold shrink-0">
                            Cari
                        </Button>
                    </form>

                    {/* Filter Unit Dropdown */}
                    <div className="relative sm:w-64 shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Filter className="w-4 h-4" />
                        </div>
                        <select
                            value={selectedUnit}
                            onChange={(e) => handleUnitFilter(e.target.value)}
                            className={`w-full pl-10 pr-8 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs font-medium cursor-pointer transition-colors ${
                                selectedUnit
                                    ? 'border-emerald-400 bg-emerald-50/60 text-emerald-900 font-semibold'
                                    : 'border-slate-300 bg-white text-slate-700'
                            }`}
                        >
                            <option value="">Semua Unit Kerja ({units?.length || 0} Unit)</option>
                            {units?.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>
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
                        {/* Download Template Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                            <div className="flex items-center gap-2 text-emerald-900 font-medium">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Belum punya template format karyawan?</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href="/admin/employees/template?format=xlsx"
                                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 transition shadow-xs text-xs"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Excel (.xlsx)</span>
                                </a>
                                <a
                                    href="/admin/employees/template?format=csv"
                                    className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-800 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs text-xs"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>CSV (.csv)</span>
                                </a>
                            </div>
                        </div>

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

            {/* Modal Reset / Set Password Karyawan */}
            <Modal
                isOpen={isResetModalOpen}
                onClose={() => {
                    setIsResetModalOpen(false);
                    setSelectedEmployeeForReset(null);
                    setResetSuccessData(null);
                }}
                title={
                    selectedEmployeeForReset?.user
                        ? 'Reset Password Akun Karyawan / Peserta'
                        : 'Buat & Set Password Akun Karyawan'
                }
                description="Admin dapat mengatur password baru bagi peserta yang lupa password atau belum melakukan aktivasi akun."
                maxWidth="md"
            >
                {selectedEmployeeForReset && (
                    <div className="space-y-4 pt-1">
                        {/* Info Karyawan */}
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0 uppercase">
                                {selectedEmployeeForReset.full_name?.charAt(0) || 'K'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                                        {selectedEmployeeForReset.employee_index}
                                    </span>
                                    <span className="font-bold text-sm text-slate-900 truncate">
                                        {selectedEmployeeForReset.full_name}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {selectedEmployeeForReset.position || '-'} · {selectedEmployeeForReset.unit || '-'}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    {selectedEmployeeForReset.user ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Akun sudah terdaftar
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Belum ada akun (akan otomatis dibuatkan)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* State Sukses Setelah Reset */}
                        {resetSuccessData ? (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <span>Password Berhasil Diperbarui!</span>
                                    </div>
                                    <p className="text-xs text-emerald-900">
                                        Silakan salin informasi akun berikut untuk diteruskan ke peserta:
                                    </p>
                                    <div className="p-3 rounded-lg bg-white border border-emerald-200 font-mono text-xs text-slate-800 space-y-1">
                                        <div><strong>NIK / ID:</strong> {resetSuccessData.employee_index}</div>
                                        <div><strong>Nama:</strong> {resetSuccessData.full_name}</div>
                                        <div><strong>Password:</strong> <span className="text-emerald-700 font-bold">{resetSuccessData.password}</span></div>
                                        <div className="text-[11px] text-slate-500 mt-1 italic">
                                            {resetSuccessData.must_change ? '*Peserta wajib membuat password baru saat login pertama kali.' : ''}
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleCopyCredentials}
                                        className="w-full flex items-center justify-center gap-2 font-semibold"
                                    >
                                        {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                        <span>{copySuccess ? 'Kredensial Tersalin ke Clipboard!' : 'Salin Info Akun (untuk WhatsApp / Pesan)'}</span>
                                    </Button>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => {
                                            setIsResetModalOpen(false);
                                            setSelectedEmployeeForReset(null);
                                            setResetSuccessData(null);
                                        }}
                                    >
                                        Selesai
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* Form Reset Password */
                            <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Password Baru / Sementara <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={resetPasswordValue}
                                            onChange={(e) => setResetPasswordValue(e.target.value)}
                                            placeholder="Minimal 6 karakter..."
                                            className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Default: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">password123</code> (dapat Anda ganti jika diinginkan).
                                    </p>
                                </div>

                                <div>
                                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/60 transition">
                                        <input
                                            type="checkbox"
                                            checked={mustChangePassword}
                                            onChange={(e) => setMustChangePassword(e.target.checked)}
                                            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-800 block">
                                                Wajibkan ganti password saat login pertama kali
                                            </span>
                                            <span className="text-[11px] text-slate-500 block mt-0.5">
                                                Peserta akan otomatis diminta membuat password pribadi baru saat pertama kali login menggunakan password sementara ini.
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Catatan / Alasan Reset <span className="text-slate-400 font-normal">(Opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={resetReason}
                                        onChange={(e) => setResetReason(e.target.value)}
                                        placeholder="Contoh: Peserta lupa password dan meminta reset via PIC Unit"
                                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Catatan ini akan tersimpan di Audit Log sebagai rekam jejak keamanan sistem.
                                    </p>
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setIsResetModalOpen(false);
                                            setSelectedEmployeeForReset(null);
                                        }}
                                        disabled={resetLoading}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={resetLoading}
                                        className="font-semibold"
                                    >
                                        <KeyRound className="w-4 h-4 mr-1.5" />
                                        <span>Konfirmasi Reset Password</span>
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}
