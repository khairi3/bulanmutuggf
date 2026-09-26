import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Button from '@/Components/Button';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';
import Input from '@/Components/Input';
import Stepper from '@/Components/Stepper';
import {
    FileText,
    Users,
    Paperclip,
    History,
    Download,
    UploadCloud,
    Edit3,
    Plus,
    Trash2,
    CheckCircle2,
    Calendar,
    ArrowLeft,
    Lock,
    ExternalLink,
} from 'lucide-react';

export default function ProjectShow({ project }) {
    const [activeTab, setActiveTab] = useState('charter'); // 'charter', 'team', 'files', 'versions'
    const [isEditCharterModalOpen, setIsEditCharterModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const currentVersion = project.current_version || project.versions?.[0];

    // Form Update Charter (v1 -> v2 versioning PAR-06)
    const updateForm = useForm({
        title: currentVersion?.title || project.title,
        executive_summary: currentVersion?.executive_summary || '',
        problem_statement: currentVersion?.problem_statement || '',
        goal_statement: currentVersion?.goal_statement || '',
        change_note: '',
        milestones: currentVersion?.milestones || [
            { milestone: 'Milestone 1', target_date: '', pic: '', status: 'Done' },
        ],
        initiatives: currentVersion?.initiatives || [
            { initiative: 'Inisiatif 1', description: '' },
        ],
        results: currentVersion?.results || [],
    });

    // Form Upload File
    const uploadForm = useForm({
        file: null,
        external_url: '',
        original_name: '',
        file_category: 'supporting',
    });

    const handleUpdateCharter = (e) => {
        e.preventDefault();
        updateForm.post(`/participant/projects/${project.id}/charter`, {
            onSuccess: () => {
                setIsEditCharterModalOpen(false);
                updateForm.reset('change_note');
            },
        });
    };

    const handleUploadFile = (e) => {
        e.preventDefault();
        uploadForm.post(`/participant/projects/${project.id}/files`, {
            onSuccess: () => {
                setIsUploadModalOpen(false);
                uploadForm.reset();
            },
        });
    };

    const stateSteps = [
        { label: 'Draft' },
        { label: 'Submitted' },
        { label: 'Dalam Verifikasi' },
        { label: 'Terverifikasi' },
        { label: 'Lolos Seleksi' },
        { label: 'Finalised' },
        { label: 'Dinilai Juri' },
        { label: 'Hasil' },
    ];

    const getStatusIndex = (status) => {
        switch (status) {
            case 'draft': return 0;
            case 'submitted': return 1;
            case 'in_verification': return 2;
            case 'verified': return 3;
            case 'qualified': return 4;
            case 'finalised': return 5;
            case 'judging': return 6;
            case 'announced': return 7;
            default: return 1;
        }
    };

    return (
        <AppLayout
            header={
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Link
                            href="/participant/dashboard"
                            className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali ke Dashboard</span>
                        </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <Badge status={project.status} />
                                {project.registration_code && (
                                    <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-md shadow-xs tracking-wider">
                                        {project.registration_code}
                                    </span>
                                )}
                                <span className="text-xs font-semibold text-slate-500">
                                    {project.stream?.name}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
                                {project.title}
                            </h1>
                        </div>

                        {!project.is_locked && project.status !== 'finalised' && (
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" onClick={() => setIsUploadModalOpen(true)}>
                                    <UploadCloud className="w-4 h-4 mr-2" />
                                    <span>Unggah Berkas</span>
                                </Button>
                                <Button variant="primary" onClick={() => setIsEditCharterModalOpen(true)}>
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    <span>Update Charter (Versi Baru)</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${project.registration_code || 'Project'} - ${project.title}`} />

            <div className="space-y-6">
                {/* 1. Status Stepper */}
                <Card className="py-2 px-4">
                    <Stepper steps={stateSteps} currentStep={getStatusIndex(project.status)} />
                </Card>

                {/* 2. Sub-tab Navigation */}
                <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('charter')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'charter'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        <span>Project Charter</span>
                        {currentVersion && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20">
                                v{currentVersion.version_no}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('team')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'team'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Anggota Tim ({project.team_members?.length || 0})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('files')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'files'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Paperclip className="w-4 h-4" />
                        <span>Lampiran & Berkas ({project.files?.length || 0})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('versions')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'versions'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        <span>Riwayat Versi ({project.versions?.length || 0})</span>
                    </button>
                </div>

                {/* TAB 1: CHARTER DETAIL */}
                {activeTab === 'charter' && (
                    <div className="space-y-6">
                        <Card
                            title="Ringkasan Eksekutif (Executive Summary)"
                            subtitle={`Versi ${currentVersion?.version_no} · Diperbarui pada ${new Date(currentVersion?.created_at).toLocaleDateString('id-ID')}`}
                        >
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                {currentVersion?.executive_summary || 'Belum diisi.'}
                            </p>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card title="Problem Statement (Akar Masalah)">
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                    {currentVersion?.problem_statement || 'Belum diisi.'}
                                </p>
                            </Card>

                            <Card title="Goal Statement (Sasaran Target)">
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                    {currentVersion?.goal_statement || 'Belum diisi.'}
                                </p>
                            </Card>
                        </div>

                        {/* Milestones */}
                        <Card title="Key Milestones & Rencana Implementasi">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-700">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                        <tr>
                                            <th className="p-3">Tahapan Milestone</th>
                                            <th className="p-3">Target Tanggal</th>
                                            <th className="p-3">PIC</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {currentVersion?.milestones?.map((m, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3 font-semibold text-slate-800">{m.milestone}</td>
                                                <td className="p-3 font-mono">{m.target_date || '-'}</td>
                                                <td className="p-3">{m.pic || '-'}</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                                                        {m.status || 'Plan'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Initiatives */}
                        <Card title="Inisiatif Tindakan Perbaikan">
                            <div className="space-y-3">
                                {currentVersion?.initiatives?.map((init, idx) => (
                                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                                        <h5 className="font-bold text-sm text-slate-800">{init.initiative}</h5>
                                        <p className="text-xs text-slate-600 mt-1">{init.description || '-'}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* TAB 2: TIM PROJECT */}
                {activeTab === 'team' && (
                    <Card title="Susunan Tim Perbaikan">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {project.team_members?.map((tm) => {
                                const isLeader = tm.member_role === 'leader';
                                return (
                                    <div
                                        key={tm.id}
                                        className={`p-4 rounded-xl border ${
                                            isLeader
                                                ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                                                : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    isLeader ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {isLeader ? 'Ketua Tim' : 'Anggota'}
                                            </span>
                                            <span className="font-mono text-xs text-slate-400 font-bold">
                                                {tm.employee?.employee_index}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm text-slate-900">{tm.employee?.full_name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{tm.employee?.position || '-'}</p>
                                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                            <span>Unit: {tm.employee?.unit || 'GGF'}</span>
                                            <span className="font-semibold text-emerald-700">{tm.employee?.employee_level}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* TAB 3: LAMPIRAN & BERKAS (PAR-04, PAR-05, 3.7) */}
                {activeTab === 'files' && (
                    <Card
                        title="Daftar Berkas & Lampiran Pendukung"
                        subtitle="Berkas disimpan secara privat dan hanya dapat diunduh oleh anggota tim, evaluator, atau admin."
                        action={
                            <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                <span>Tambah Berkas</span>
                            </Button>
                        }
                    >
                        {project.files?.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                Belum ada berkas yang diunggah. Klik tombol "Tambah Berkas" untuk mengunggah materi presentasi atau video.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {project.files.map((file) => (
                                    <div key={file.id} className="py-3.5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs uppercase">
                                                {file.original_name.split('.').pop() || 'FILE'}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-sm text-slate-900">{file.original_name}</h5>
                                                <p className="text-xs text-slate-400">
                                                    Kategori: <strong className="text-slate-600">{file.file_category}</strong> · Ukuran: {file.formatted_size || '-'} · Diunggah oleh {file.uploader?.employee?.full_name || 'User'}
                                                </p>
                                            </div>
                                        </div>

                                        <a
                                            href={`/participant/projects/${project.id}/files/${file.id}/download`}
                                            target={file.external_url ? '_blank' : '_self'}
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            {file.external_url ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                                            <span>{file.external_url ? 'Buka Tautan' : 'Unduh'}</span>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {/* TAB 4: RIWAYAT VERSI (PAR-06 SNAPSHOTS) */}
                {activeTab === 'versions' && (
                    <Card
                        title="Riwayat Versi Project Charter (Immutable Snapshots)"
                        subtitle="Setiap pembaruan charter tersimpan sebagai versi baru lengkap dengan catatan perubahannya"
                    >
                        <div className="space-y-4">
                            {project.versions?.map((ver) => (
                                <div
                                    key={ver.id}
                                    className={`p-4 rounded-xl border ${
                                        ver.id === project.current_version_id
                                            ? 'border-emerald-300 bg-emerald-50/30'
                                            : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-sm text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                                                Versi {ver.version_no}
                                            </span>
                                            {ver.id === project.current_version_id && (
                                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                    Versi Aktif
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">
                                            {new Date(ver.created_at).toLocaleString('id-ID')}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-sm text-slate-900">{ver.title}</h4>
                                    <p className="text-xs text-slate-600 mt-1 italic">
                                        "{ver.change_note || 'Tidak ada catatan perubahan.'}"
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-2">
                                        Disimpan oleh: {ver.creator?.employee?.full_name || 'Anggota Tim'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* MODAL UPDATE CHARTER (PAR-06) */}
            <Modal
                isOpen={isEditCharterModalOpen}
                onClose={() => setIsEditCharterModalOpen(false)}
                title="Pembaruan Project Charter (Snapshot Versi Baru)"
                description="Perubahan akan disimpan sebagai versi baru tanpa menghapus riwayat versi sebelumnya."
                maxWidth="xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditCharterModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            loading={updateForm.processing}
                            onClick={handleUpdateCharter}
                        >
                            Simpan Versi Baru
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        id="title_edit"
                        label="Judul Project"
                        value={updateForm.data.title}
                        onChange={(e) => updateForm.setData('title', e.target.value)}
                        error={updateForm.errors.title}
                        required
                    />

                    <div>
                        <Input
                            id="change_note"
                            label="Catatan Perubahan (Wajib diisi)"
                            placeholder="Contoh: Menambahkan data metrik baseline dan revisi milestone fase 2"
                            value={updateForm.data.change_note}
                            onChange={(e) => updateForm.setData('change_note', e.target.value)}
                            error={updateForm.errors.change_note}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1">
                            Executive Summary
                        </label>
                        <textarea
                            rows={3}
                            value={updateForm.data.executive_summary}
                            onChange={(e) => updateForm.setData('executive_summary', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1">
                            Problem Statement
                        </label>
                        <textarea
                            rows={3}
                            value={updateForm.data.problem_statement}
                            onChange={(e) => updateForm.setData('problem_statement', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1">
                            Goal Statement
                        </label>
                        <textarea
                            rows={2}
                            value={updateForm.data.goal_statement}
                            onChange={(e) => updateForm.setData('goal_statement', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                        />
                    </div>
                </form>
            </Modal>

            {/* MODAL UPLOAD FILE */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Unggah Berkas / Tautan Video (PAR-04 & PAR-05)"
                description="Lampirkan dokumen pendukung PPT, PDF, XLS, JPG atau masukkan link Google Drive / YouTube."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            loading={uploadForm.processing}
                            onClick={handleUploadFile}
                        >
                            Unggah
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                            Pilih Berkas Komputer/HP (Maks. 20 MB)
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4"
                            onChange={(e) => uploadForm.setData('file', e.target.files[0])}
                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <Input
                            id="external_url_upload"
                            label="Atau Tautan Video Eksternal (Google Drive / YouTube)"
                            placeholder="https://drive.google.com/... atau https://youtu.be/..."
                            value={uploadForm.data.external_url}
                            onChange={(e) => uploadForm.setData('external_url', e.target.value)}
                        />
                        {uploadForm.data.external_url && (
                            <div className="mt-2">
                                <Input
                                    id="video_title"
                                    label="Judul Video Eksternal"
                                    placeholder="Contoh: Video Dokumentasi Lapangan Mesin Sortir"
                                    value={uploadForm.data.original_name}
                                    onChange={(e) => uploadForm.setData('original_name', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
