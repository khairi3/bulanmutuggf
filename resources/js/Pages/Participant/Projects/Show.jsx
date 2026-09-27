import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Button from '@/Components/Button';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';
import Input from '@/Components/Input';
import Stepper from '@/Components/Stepper';
import FeedbackThread from '@/Components/FeedbackThread';
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
    MessageSquare,
    CheckCheck,
    Award,
    Sparkles,
    AlertTriangle,
    Send,
    Video,
} from 'lucide-react';

export default function ProjectShow({ project }) {
    const [activeTab, setActiveTab] = useState('charter'); // 'charter', 'team', 'files', 'versions', 'feedback', 'convention'
    const [isEditCharterModalOpen, setIsEditCharterModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Finalise Project State (PAR-11)
    const [isFinaliseModalOpen, setIsFinaliseModalOpen] = useState(false);
    const [finaliseCodeInput, setFinaliseCodeInput] = useState('');
    const [finaliseError, setFinaliseError] = useState('');
    const [isFinalising, setIsFinalising] = useState(false);

    const currentVersion = project.current_version || project.versions?.[0];
    const presentationFile = project.files?.find(f => f.file_category === 'final_presentation');
    const videoFile = project.files?.find(f => f.file_category === 'final_video');

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

    const openUploadModal = (category = 'supporting') => {
        uploadForm.setData('file_category', category);
        setIsUploadModalOpen(true);
    };

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

    const handleFinalise = (e) => {
        e.preventDefault();
        if (finaliseCodeInput.trim() !== project.registration_code.trim()) {
            setFinaliseError(`Kode konfirmasi salah. Harap ketik persis sama: ${project.registration_code}`);
            return;
        }
        if (!presentationFile) {
            setFinaliseError('Wajib mengunggah Presentasi Final (PDF) sebelum Finalise.');
            return;
        }
        setIsFinalising(true);
        setFinaliseError('');
        router.post(`/participant/projects/${project.id}/finalise`, {
            confirmation_code: finaliseCodeInput,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsFinaliseModalOpen(false);
                setFinaliseCodeInput('');
            },
            onError: (errors) => {
                setFinaliseError(errors.status || errors.confirmation_code || errors.files || 'Gagal melakukan finalise.');
            },
            onFinish: () => setIsFinalising(false),
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
                    <button
                        type="button"
                        onClick={() => setActiveTab('feedback')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'feedback'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Catatan Verifikator ({project.feedbacks?.length || 0})</span>
                        {project.feedbacks?.some(f => !f.read_at) && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        )}
                    </button>

                    {/* CONVENTION DAY TAB (PAR-11) */}
                    {(['qualified', 'finalised', 'judging', 'announced'].includes(project.status)) && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('convention')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'convention'
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                            }`}
                        >
                            <Award className="w-4 h-4" />
                            <span>Convention Day & Finalisasi</span>
                            {project.status === 'qualified' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            )}
                        </button>
                    )}
                </div>

                {/* QUALIFIED NOTIFICATION BANNER */}
                {project.status === 'qualified' && (
                    <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-base">Selamat! Project Anda Lolos ke Convention Day!</h3>
                                <p className="text-xs text-emerald-100 mt-0.5">
                                    Segera lengkapi materi Presentasi Final (PDF) dan Video Inovasi, lalu lakukan Finalise Project sebelum batas waktu.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveTab('convention')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-md hover:bg-emerald-50 transition self-start sm:self-auto"
                        >
                            Materi Convention & Finalisasi →
                        </button>
                    </div>
                )}

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

                {/* TAB 5: CATATAN VERIFIKATOR (PAR-08, VER-05) */}
                {/* TAB 5: CATATAN VERIFIKATOR (PAR-08 & PAR-09) */}
                {activeTab === 'feedback' && (
                    <Card
                        title="Catatan & Diskusi Verifikator Lapangan (PAR-09)"
                        subtitle="Tinjau catatan perbaikan, balas diskusi klarifikasi, dan tandai catatan yang sudah ditindaklanjuti."
                    >
                        <FeedbackThread
                            feedbacks={project.feedbacks || []}
                            isParticipant={true}
                            projectId={project.id}
                        />
                    </Card>
                )}

                {/* TAB 6: CONVENTION DAY & FINALISATION (PAR-11) */}
                {activeTab === 'convention' && (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className={`p-6 rounded-3xl border shadow-sm ${
                            project.status === 'finalised' || project.is_locked
                                ? 'bg-purple-50/70 border-purple-200'
                                : 'bg-emerald-50/70 border-emerald-200'
                        }`}>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                        project.status === 'finalised' || project.is_locked
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-emerald-600 text-white'
                                    }`}>
                                        {project.status === 'finalised' || project.is_locked ? (
                                            <Lock className="w-6 h-6" />
                                        ) : (
                                            <Award className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">
                                            {project.status === 'finalised' || project.is_locked
                                                ? 'Project Telah Difinalisasi & Terkunci'
                                                : 'Persiapan Materi Convention Day'}
                                        </h3>
                                        <p className="text-xs text-slate-600 mt-1 max-w-xl">
                                            {project.status === 'finalised' || project.is_locked
                                                ? `Project ini telah dikunci pada ${project.finalised_at ? new Date(project.finalised_at).toLocaleString('id-ID') : 'sebelumnya'}. Materi siap dinilai oleh Dewan Juri Convention Day.`
                                                : 'Unggah file Presentasi Final (PDF) dan tautan Video Inovasi Anda. Setelah materi lengkap, kunci project Anda melalui tombol Finalise Project di bawah.'}
                                        </p>
                                    </div>
                                </div>

                                {project.status === 'qualified' && !project.is_locked && (
                                    <button
                                        type="button"
                                        onClick={() => setIsFinaliseModalOpen(true)}
                                        disabled={!presentationFile}
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-lg shadow-purple-600/30 transition disabled:opacity-50 flex-shrink-0"
                                    >
                                        <Lock className="w-4 h-4" />
                                        Finalise Project (Kunci)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Checklist & Upload Materials Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 1. Presentasi Final (PDF) */}
                            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 text-sm">Presentasi Final (PDF)</h4>
                                            <p className="text-[11px] text-slate-400">Wajib untuk Convention Day</p>
                                        </div>
                                    </div>
                                    {presentationFile ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Siap
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Wajib
                                        </span>
                                    )}
                                </div>

                                {presentationFile ? (
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                                        <p className="font-bold text-xs text-slate-800 truncate">{presentationFile.original_name}</p>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                                            <span>{(presentationFile.size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                                            <a
                                                href={`/participant/projects/${project.id}/files/${presentationFile.id}/download`}
                                                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Download className="w-3 h-3" /> Unduh
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        Belum ada dokumen presentasi PDF yang diunggah.
                                    </p>
                                )}

                                {!project.is_locked && (
                                    <button
                                        type="button"
                                        onClick={() => openUploadModal('final_presentation')}
                                        className="w-full py-2.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs transition flex items-center justify-center gap-2"
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        {presentationFile ? 'Ganti File Presentasi' : 'Unggah File Presentasi (PDF)'}
                                    </button>
                                )}
                            </div>

                            {/* 2. Video Inovasi */}
                            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 text-sm">Video Inovasi</h4>
                                            <p className="text-[11px] text-slate-400">Berkas MP4 atau Tautan YouTube/Drive</p>
                                        </div>
                                    </div>
                                    {videoFile || project.video_url ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tersedia
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                            Opsional
                                        </span>
                                    )}
                                </div>

                                {videoFile ? (
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                                        <p className="font-bold text-xs text-slate-800 truncate">{videoFile.original_name}</p>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                                            <span>{(videoFile.size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                                            <a
                                                href={`/participant/projects/${project.id}/files/${videoFile.id}/download`}
                                                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Download className="w-3 h-3" /> Unduh
                                            </a>
                                        </div>
                                    </div>
                                ) : project.video_url ? (
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                                        <span className="text-slate-400 text-[10px] uppercase font-bold">Tautan Eksternal</span>
                                        <p className="font-bold text-purple-700 truncate mt-0.5">{project.video_url}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        Belum ada video inovasi yang dilampirkan.
                                    </p>
                                )}

                                {!project.is_locked && (
                                    <button
                                        type="button"
                                        onClick={() => openUploadModal('final_video')}
                                        className="w-full py-2.5 rounded-xl border border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 text-purple-700 font-bold text-xs transition flex items-center justify-center gap-2"
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        {videoFile ? 'Ganti Video' : 'Unggah Video / Tautan'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
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
                title="Unggah Berkas / Materi Project (PAR-04 & PAR-11)"
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
                        <label className="block text-sm font-semibold text-slate-800 mb-1">
                            Kategori Berkas
                        </label>
                        <select
                            value={uploadForm.data.file_category}
                            onChange={(e) => uploadForm.setData('file_category', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                        >
                            <option value="supporting">Dokumen Pendukung Umum</option>
                            <option value="final_presentation">Materi Presentasi Final Convention (PDF)</option>
                            <option value="final_video">Video Inovasi Final (MP4)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                            Pilih Berkas Komputer/HP (Maks. 100 MB)
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

            {/* MODAL FINALISE PROJECT (PAR-11) */}
            <Modal
                isOpen={isFinaliseModalOpen}
                onClose={() => setIsFinaliseModalOpen(false)}
                title="Konfirmasi Finalise Project (PAR-11)"
                description="Tindakan ini akan mengunci seluruh data dan berkas project secara permanen untuk penilaian Convention Day."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsFinaliseModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            loading={isFinalising}
                            disabled={finaliseCodeInput.trim() !== project.registration_code.trim()}
                            onClick={handleFinalise}
                        >
                            Konfirmasi & Kunci Permanen
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleFinalise} className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-amber-800">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>Perhatian Sebelum Mengunci:</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Pastikan berkas presentasi PDF final sudah lengkap dan benar.</li>
                            <li>Setelah difinalisasi, Anda <strong>tidak dapat lagi mengubah isi charter atau mengunggah revisi berkas</strong>.</li>
                            <li>Project akan langsung masuk antrean penilaian Dewan Juri.</li>
                        </ul>
                    </div>

                    {finaliseError && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                            {finaliseError}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Ketikkan persis kode registrasi berikut untuk konfirmasi:
                        </label>
                        <div className="font-mono text-sm font-black bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-slate-800 text-center select-all">
                            {project.registration_code}
                        </div>
                        <input
                            type="text"
                            placeholder={`Ketik: ${project.registration_code}`}
                            value={finaliseCodeInput}
                            onChange={(e) => {
                                setFinaliseCodeInput(e.target.value);
                                setFinaliseError('');
                            }}
                            className="mt-2 w-full p-2.5 rounded-xl border border-slate-300 text-center font-mono text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
