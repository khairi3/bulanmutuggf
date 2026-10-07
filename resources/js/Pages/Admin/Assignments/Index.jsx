import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Button from '@/Components/Button';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import EmployeeAutocomplete from '@/Components/EmployeeAutocomplete';
import {
    UserCheck,
    UserPlus,
    Plus,
    Trash2,
    Shield,
    CheckCircle,
    Building2,
    AlertCircle,
    Award,
    CheckSquare,
    Search,
    Users,
} from 'lucide-react';

export default function AssignmentsIndex({ users, streams, roles, activeEvent }) {
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isAddEvaluatorModalOpen, setIsAddEvaluatorModalOpen] = useState(false);
    const [assignMode, setAssignMode] = useState('existing'); // 'existing' or 'search'
    const [selectedEmployeeForAssign, setSelectedEmployeeForAssign] = useState(null);
    const [selectedEmployeeForAdd, setSelectedEmployeeForAdd] = useState(null);

    // Form 1: Assign to stream
    const assignForm = useForm({
        user_id: '',
        employee_id: '',
        stream_id: streams?.[0]?.id || '',
        stage: 'verification',
        category_option_id: '',
    });

    // Form 2: Promote employee to evaluator
    const evaluatorForm = useForm({
        employee_id: '',
        roles: ['verifier'],
        assign_stream: false,
        stream_id: streams?.[0]?.id || '',
        stage: 'verification',
        category_option_id: '',
    });

    const selectedStream = streams?.find((s) => s.id === parseInt(assignForm.data.stream_id)) || streams?.[0];
    const selectedEvaluatorStream = streams?.find((s) => s.id === parseInt(evaluatorForm.data.stream_id)) || streams?.[0];

    const handleCreateAssignment = (e) => {
        e.preventDefault();
        assignForm.post('/admin/assignments', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAssignModalOpen(false);
                assignForm.reset();
                setSelectedEmployeeForAssign(null);
            },
        });
    };

    const handleCreateEvaluator = (e) => {
        e.preventDefault();
        evaluatorForm.post('/admin/assignments/evaluators', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddEvaluatorModalOpen(false);
                evaluatorForm.reset();
                setSelectedEmployeeForAdd(null);
            },
        });
    };

    const toggleEvaluatorRole = (roleCode) => {
        const current = evaluatorForm.data.roles;
        if (current.includes(roleCode)) {
            if (current.length > 1) {
                evaluatorForm.setData('roles', current.filter((r) => r !== roleCode));
            }
        } else {
            evaluatorForm.setData('roles', [...current, roleCode]);
        }
    };

    const handleDeleteAssignment = (assignmentId) => {
        if (confirm('Hapus penugasan evaluator ini?')) {
            router.delete(`/admin/assignments/${assignmentId}`, { preserveScroll: true });
        }
    };

    const handleToggleRole = (userId, roleCode) => {
        router.post(`/admin/users/${userId}/toggle-role`, { role_code: roleCode }, { preserveScroll: true });
    };

    return (
        <AppLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Manajemen Evaluator & Penugasan
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Tugaskan verifikator lapangan dan juri convention ke stream serta kategori terkait
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setSelectedEmployeeForAdd(null);
                                evaluatorForm.reset();
                                setIsAddEvaluatorModalOpen(true);
                            }}
                            className="border-emerald-600 text-emerald-800 hover:bg-emerald-50 font-bold"
                        >
                            <UserPlus className="w-4 h-4 mr-2 text-emerald-700" />
                            <span>+ Tambah Evaluator Baru</span>
                        </Button>

                        <Button variant="primary" onClick={() => setIsAssignModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            <span>Tugaskan ke Stream</span>
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Manajemen Assignment - Bulan Mutu GGF" />

            <div className="space-y-6">
                {/* 1. Evaluator Matrix */}
                <Card
                    title="Daftar Evaluator & Penugasan Stream Terdaftar"
                    subtitle="Evaluator hanya dapat melihat dan menilai project yang sesuai dengan stream penugasannya"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Nama Evaluator</th>
                                    <th className="px-4 py-3">Peran Akun</th>
                                    <th className="px-4 py-3">Penugasan Stream & Kategori</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400">
                                            Belum ada pengguna dengan peran Verifikator atau Juri.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/80">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                        {u.employee?.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 block">
                                                            {u.employee?.full_name}
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            {u.employee?.employee_index} · {u.employee?.unit || 'GGF'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-wrap gap-1">
                                                    {u.roles?.map((r) => (
                                                        <span
                                                            key={r.code}
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                                r.code === 'verifier'
                                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                                    : r.code === 'judge'
                                                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                                            }`}
                                                        >
                                                            {r.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="space-y-1.5">
                                                    {u.assignments?.length === 0 ? (
                                                        <span className="text-xs text-slate-400 italic">
                                                            Belum ada penugasan stream
                                                        </span>
                                                    ) : (
                                                        u.assignments.map((asg) => (
                                                            <div
                                                                key={asg.id}
                                                                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs mr-2 mb-1"
                                                            >
                                                                <span className="font-bold text-emerald-900">
                                                                    {asg.stream?.name || 'Stream'}
                                                                </span>
                                                                <span className="px-1.5 py-0.2 rounded bg-white font-semibold text-emerald-700 text-[10px] border border-emerald-200 uppercase">
                                                                    {asg.stage}
                                                                </span>
                                                                {asg.category_option && (
                                                                    <span className="font-mono text-[11px] text-slate-600">
                                                                        ({asg.category_option.name})
                                                                    </span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteAssignment(asg.id)}
                                                                    className="text-slate-400 hover:text-rose-600 ml-1"
                                                                    title="Hapus Penugasan"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleRole(u.id, 'verifier')}
                                                        className={`text-xs px-2 py-1 rounded font-semibold border ${
                                                            u.roles?.some((r) => r.code === 'verifier')
                                                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                        title="Toggle Peran Verifikator"
                                                    >
                                                        Verifikator
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleRole(u.id, 'judge')}
                                                        className={`text-xs px-2 py-1 rounded font-semibold border ${
                                                            u.roles?.some((r) => r.code === 'judge')
                                                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                        title="Toggle Peran Juri"
                                                    >
                                                        Juri
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* MODAL 1: PENUGASAN EVALUATOR KE STREAM */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title="Penugasan Evaluator"
                description="Tetapkan verifikator atau juri ke stream tertentu untuk penilaian lapangan maupun convention."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            loading={assignForm.processing}
                            onClick={handleCreateAssignment}
                        >
                            Simpan Penugasan
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    {/* Selector Mode Tabs */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Pilih Pengguna / Evaluator <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 mb-3 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => {
                                    setAssignMode('existing');
                                    assignForm.setData('employee_id', '');
                                }}
                                className={`flex-1 py-1.5 px-3 rounded-md transition ${
                                    assignMode === 'existing'
                                        ? 'bg-white text-emerald-800 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Evaluator Terdaftar ({users.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAssignMode('search');
                                    assignForm.setData('user_id', '');
                                }}
                                className={`flex-1 py-1.5 px-3 rounded-md transition ${
                                    assignMode === 'search'
                                        ? 'bg-white text-emerald-800 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Cari Karyawan Baru
                            </button>
                        </div>

                        {assignMode === 'existing' ? (
                            <select
                                value={assignForm.data.user_id}
                                onChange={(e) => assignForm.setData('user_id', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                                required
                            >
                                <option value="">-- Pilih Pengguna Terdaftar --</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.employee?.full_name} ({u.employee?.employee_index} · {u.employee?.unit})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="space-y-2">
                                <EmployeeAutocomplete
                                    selectedEmployee={selectedEmployeeForAssign}
                                    onSelect={(emp) => {
                                        setSelectedEmployeeForAssign(emp);
                                        assignForm.setData('employee_id', emp.id);
                                    }}
                                    onClear={() => {
                                        setSelectedEmployeeForAssign(null);
                                        assignForm.setData('employee_id', '');
                                    }}
                                    placeholder="Cari nama atau NIK karyawan..."
                                    label=""
                                />
                                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                                    💡 Karyawan yang dipilih akan otomatis didaftarkan akunnya dan diberikan peran sesuai tahap evaluasi yang dipilih di bawah.
                                </p>
                            </div>
                        )}
                        {assignForm.errors.user_id && (
                            <p className="text-xs text-rose-600 mt-1">{assignForm.errors.user_id}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Pilih Stream Lomba <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={assignForm.data.stream_id}
                            onChange={(e) => assignForm.setData('stream_id', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                            required
                        >
                            {streams.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Tahap Evaluasi <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={assignForm.data.stage}
                            onChange={(e) => assignForm.setData('stage', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                            required
                        >
                            <option value="verification">Tahap Verifikasi Lapangan (Verifikator)</option>
                            <option value="judging">Tahap Convention Day (Juri)</option>
                        </select>
                    </div>

                    {/* Optional Category Option */}
                    {selectedStream?.category_dimensions?.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Kategori Spesifik (Opsional)
                            </label>
                            <select
                                value={assignForm.data.category_option_id}
                                onChange={(e) => assignForm.setData('category_option_id', e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                            >
                                <option value="">Semua Kategori di Stream Ini</option>
                                {selectedStream.category_dimensions.flatMap((dim) =>
                                    dim.options.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {dim.name}: {opt.name} ({opt.abbreviation})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    )}
                </form>
            </Modal>

            {/* MODAL 2: TAMBAH EVALUATOR BARU DARI MASTER DATA KARYAWAN */}
            <Modal
                isOpen={isAddEvaluatorModalOpen}
                onClose={() => setIsAddEvaluatorModalOpen(false)}
                title="Tambah Evaluator Baru dari Karyawan"
                description="Pilih karyawan dari master data untuk diberikan peran sebagai Verifikator lapangan dan/atau Juri convention."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAddEvaluatorModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            loading={evaluatorForm.processing}
                            onClick={handleCreateEvaluator}
                            disabled={!evaluatorForm.data.employee_id || evaluatorForm.data.roles.length === 0}
                        >
                            Simpan & Jadikan Evaluator
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Cari Karyawan <span className="text-rose-500">*</span>
                        </label>
                        <EmployeeAutocomplete
                            selectedEmployee={selectedEmployeeForAdd}
                            onSelect={(emp) => {
                                setSelectedEmployeeForAdd(emp);
                                evaluatorForm.setData('employee_id', emp.id);
                            }}
                            onClear={() => {
                                setSelectedEmployeeForAdd(null);
                                evaluatorForm.setData('employee_id', '');
                            }}
                            placeholder="Ketik NIK atau Nama Karyawan..."
                            label=""
                        />
                        {evaluatorForm.errors.employee_id && (
                            <p className="text-xs text-rose-600 mt-1">{evaluatorForm.errors.employee_id}</p>
                        )}
                    </div>

                    {/* Roles Checkboxes */}
                    <div className="pt-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Peran Evaluator yang Diberikan <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label
                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                    evaluatorForm.data.roles.includes('verifier')
                                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={evaluatorForm.data.roles.includes('verifier')}
                                    onChange={() => toggleEvaluatorRole('verifier')}
                                    className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                                />
                                <div>
                                    <span className="text-xs font-bold text-slate-900 block">Verifikator</span>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Melakukan verifikasi lapangan, kunjungan fisik, feedback, dan seleksi kelayakan.
                                    </p>
                                </div>
                            </label>

                            <label
                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                    evaluatorForm.data.roles.includes('judge')
                                        ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-300'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={evaluatorForm.data.roles.includes('judge')}
                                    onChange={() => toggleEvaluatorRole('judge')}
                                    className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                                />
                                <div>
                                    <span className="text-xs font-bold text-slate-900 block">Juri Convention</span>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Menilai presentasi finalis dan video saat Convention Day.
                                    </p>
                                </div>
                            </label>
                        </div>
                        {evaluatorForm.errors.roles && (
                            <p className="text-xs text-rose-600 mt-1">{evaluatorForm.errors.roles}</p>
                        )}
                    </div>

                    {/* Optional Stream Assignment */}
                    <div className="pt-2 border-t border-slate-100">
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input
                                type="checkbox"
                                checked={evaluatorForm.data.assign_stream}
                                onChange={(e) => evaluatorForm.setData('assign_stream', e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-slate-700">
                                Sekaligus tugaskan ke stream perlombaan sekarang
                            </span>
                        </label>

                        {evaluatorForm.data.assign_stream && (
                            <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Stream Lomba
                                    </label>
                                    <select
                                        value={evaluatorForm.data.stream_id}
                                        onChange={(e) => evaluatorForm.setData('stream_id', e.target.value)}
                                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                                    >
                                        {streams.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Tahap Evaluasi
                                    </label>
                                    <select
                                        value={evaluatorForm.data.stage}
                                        onChange={(e) => evaluatorForm.setData('stage', e.target.value)}
                                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                                    >
                                        <option value="verification">Tahap Verifikasi Lapangan</option>
                                        <option value="judging">Tahap Convention Day (Juri)</option>
                                    </select>
                                </div>

                                {selectedEvaluatorStream?.category_dimensions?.length > 0 && (
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">
                                            Kategori Spesifik (Opsional)
                                        </label>
                                        <select
                                            value={evaluatorForm.data.category_option_id}
                                            onChange={(e) => evaluatorForm.setData('category_option_id', e.target.value)}
                                            className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                                        >
                                            <option value="">Semua Kategori di Stream Ini</option>
                                            {selectedEvaluatorStream.category_dimensions.flatMap((dim) =>
                                                dim.options.map((opt) => (
                                                    <option key={opt.id} value={opt.id}>
                                                        {dim.name}: {opt.name} ({opt.abbreviation})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
