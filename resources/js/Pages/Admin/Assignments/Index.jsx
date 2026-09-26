import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Button from '@/Components/Button';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import {
    UserCheck,
    Plus,
    Trash2,
    Shield,
    CheckCircle,
    Building2,
    AlertCircle,
    Award,
    CheckSquare,
} from 'lucide-react';

export default function AssignmentsIndex({ users, streams, roles, activeEvent }) {
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const assignForm = useForm({
        user_id: '',
        stream_id: streams?.[0]?.id || '',
        stage: 'verification',
        category_option_id: '',
    });

    const selectedStream = streams?.find((s) => s.id === parseInt(assignForm.data.stream_id)) || streams?.[0];

    const handleCreateAssignment = (e) => {
        e.preventDefault();
        assignForm.post('/admin/assignments', {
            onSuccess: () => {
                setIsAssignModalOpen(false);
                assignForm.reset();
            },
        });
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
                            Manajemen Evaluator & Assignment (ADM-01)
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Tugaskan verifikator lapangan dan juri convention ke stream serta kategori terkait
                        </p>
                    </div>

                    <Button variant="primary" onClick={() => setIsAssignModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        <span>Tambah Penugasan Evaluator</span>
                    </Button>
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

            {/* MODAL TAMBAH PENUGASAN (ADM-01) */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title="Penugasan Evaluator (ADM-01)"
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
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Pilih Pengguna / Evaluator <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={assignForm.data.user_id}
                            onChange={(e) => assignForm.setData('user_id', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                            required
                        >
                            <option value="">-- Pilih Pengguna --</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.employee?.full_name} ({u.employee?.employee_index} · {u.employee?.unit})
                                </option>
                            ))}
                        </select>
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
        </AppLayout>
    );
}
