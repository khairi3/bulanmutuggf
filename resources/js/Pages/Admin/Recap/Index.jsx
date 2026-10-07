import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Award,
    CheckCircle2,
    Send,
    Download,
    Lock,
    Unlock,
    AlertTriangle,
    ShieldAlert,
    Users,
    ChevronDown,
    Save,
    Sparkles,
    FileSpreadsheet,
    HelpCircle
} from 'lucide-react';

export default function RecapIndex({ streams = [], selectedStream, rankings = [], isPublished, publishedAt }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.roles?.some(r => r.name === 'admin' || r.code === 'admin');

    // Local state for award titles editing
    const initialAwards = {};
    rankings.forEach(g => {
        g.projects.forEach(p => {
            initialAwards[p.project_id] = p.award_title || '';
        });
    });

    const [awards, setAwards] = useState(initialAwards);
    const [isSavingAwards, setIsSavingAwards] = useState(false);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

    // Unlock Project Modal State
    const [unlockModal, setUnlockModal] = useState({
        isOpen: false,
        project: null,
        reason: '',
        isSubmitting: false,
        error: '',
    });

    const handleStreamChange = (streamId) => {
        const url = isAdmin ? '/admin/recap' : '/verifier/recap';
        router.get(url, { stream_id: streamId }, { preserveState: false });
    };

    const handleAwardChange = (projectId, value) => {
        setAwards(prev => ({
            ...prev,
            [projectId]: value,
        }));
    };

    const handleSaveAwards = () => {
        setIsSavingAwards(true);
        router.post(`/admin/streams/${selectedStream.id}/recap/awards`, {
            awards: awards,
        }, {
            preserveScroll: true,
            onFinish: () => setIsSavingAwards(false),
        });
    };

    const handlePublishWinners = () => {
        setIsPublishing(true);
        router.post(`/admin/streams/${selectedStream.id}/recap/publish`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsPublishing(false);
                setPublishModalOpen(false);
            },
        });
    };

    const handleOpenUnlock = (project) => {
        setUnlockModal({
            isOpen: true,
            project,
            reason: '',
            isSubmitting: false,
            error: '',
        });
    };

    const handleSubmitUnlock = (e) => {
        e.preventDefault();
        if (!unlockModal.reason || unlockModal.reason.trim().length < 5) {
            setUnlockModal(prev => ({ ...prev, error: 'Alasan pembukaan kunci wajib diisi minimal 5 karakter.' }));
            return;
        }

        setUnlockModal(prev => ({ ...prev, isSubmitting: true, error: '' }));

        router.post(`/admin/projects/${unlockModal.project.id}/unlock`, {
            reason: unlockModal.reason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setUnlockModal({ isOpen: false, project: null, reason: '', isSubmitting: false, error: '' });
            },
            onError: (err) => {
                setUnlockModal(prev => ({ ...prev, isSubmitting: false, error: err.reason || 'Terjadi kesalahan.' }));
            },
        });
    };

    const handleExport = (type) => {
        setExportDropdownOpen(false);
        const exportUrl = isAdmin ? '/admin/export' : '/verifier/export';
        window.location.href = `${exportUrl}?type=${type}&stream_id=${selectedStream?.id || ''}`;
    };

    const vWeight = selectedStream?.verification_weight || 30;
    const jWeight = selectedStream?.judging_weight || 70;

    return (
        <AppLayout>
            <Head title="Rekap Nilai Akhir & Leaderboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Award className="w-7 h-7 text-amber-500" />
                                Rekap Nilai Akhir & Pengumuman Pemenang
                            </h1>
                            {isPublished ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Pemenang Resmi Diumumkan ({publishedAt})
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                    Tahap Rekapitulasi Akhir
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                            Perhitungan nilai akhir dan penentuan peringkat murni berdasarkan <strong className="text-slate-800">Penjurian Convention Day</strong> dengan verifikasi lapangan sebagai seleksi kelayakan dan aturan Tie-Breaker resmi.
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        {/* Export Dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-sm transition"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                Export Excel / CSV
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>

                            {exportDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                    <button
                                        type="button"
                                        onClick={() => handleExport('final_ranking')}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                                    >
                                        <span>Rekap Hasil Akhir & Juara</span>
                                        <Download className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleExport('judging')}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                                    >
                                        <span>Detail Nilai Juri per Parameter</span>
                                        <Download className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleExport('verification')}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                                    >
                                        <span>Detail Nilai Verifikasi</span>
                                        <Download className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleExport('registration')}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                                    >
                                        <span>Rekap Pendaftaran Project</span>
                                        <Download className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {isAdmin && !isPublished && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSaveAwards}
                                    disabled={isSavingAwards}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-sm transition disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 text-slate-500" />
                                    {isSavingAwards ? 'Menyimpan...' : 'Simpan Gelar Juara'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPublishModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition"
                                >
                                    <Send className="w-4 h-4" />
                                    Publikasikan Pemenang
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Published Notice Banner */}
                {isPublished && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-start gap-4">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-emerald-900 space-y-1">
                            <p className="font-black text-base">Pengumuman Pemenang Telah Resmi Dirilis</p>
                            <p className="text-xs text-emerald-800 leading-relaxed">
                                Seluruh gelar juara dan skor akhir untuk stream <span className="font-bold underline">{selectedStream?.name}</span> telah terkunci.
                                Notifikasi broadcast telah terkirim kepada seluruh peserta dan leaderboard publik dapat diakses melalui Executive Dashboard.
                            </p>
                        </div>
                    </div>
                )}

                {/* Stream Switcher Tabs */}
                {streams.length > 1 && (
                    <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
                        {streams.map(st => {
                            const isCurrent = st.id === selectedStream?.id;
                            return (
                                <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => handleStreamChange(st.id)}
                                    className={`px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                                        isCurrent
                                            ? 'border-purple-600 text-purple-700'
                                            : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Stream: {st.name}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Tie Breaker Rules Explainer Banner */}
                <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
                    <HelpCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="font-bold text-slate-800">Aturan Penentuan Peringkat & Tie-Breaker Resmi:</span>
                        <span className="ml-1">
                            Urutan peringkat dihitung berdasarkan Nilai Akhir (Penjurian Convention Day). Jika terdapat skor identik (seri), sistem secara otomatis menerapkan tie-breaker:
                            (1) Nilai Verifikasi Lapangan lebih tinggi → (2) Waktu Finalisasi materi lebih awal → (3) Waktu submit registrasi lebih awal.
                        </span>
                    </div>
                </div>

                {/* Categories Ranking Groups */}
                {rankings.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                        <Award className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-700 text-base">Belum Ada Finalis yang Selesai Dinilai</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                            Rekap nilai akhir akan muncul setelah para juri Convention Day menginput dan mensubmit lembar nilai finalis.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {rankings.map((group, groupIndex) => {
                            const optionName = group.option ? `${group.option.name} (${group.option.abbreviation})` : 'Umum / Tanpa Kategori';

                            return (
                                <div key={groupIndex} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Category Header */}
                                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-sm">
                                                {group.option?.abbreviation || 'BMG'}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-base">{optionName}</h3>
                                                <p className="text-xs text-slate-500">
                                                    {group.projects.length} finalis terdaftar dalam kategori ini
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                                <tr>
                                                    <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                                                    <th className="py-3.5 px-4">Gelar Pemenang</th>
                                                    <th className="py-3.5 px-4">Project & Tim</th>
                                                    <th className="py-3.5 px-4">Unit / Plant</th>
                                                    <th className="py-3.5 px-4 text-center">Verifikasi</th>
                                                    <th className="py-3.5 px-4 text-center">Juri</th>
                                                    <th className="py-3.5 px-4 text-center">Nilai Akhir</th>
                                                    {isAdmin && (
                                                        <th className="py-3.5 px-4 text-center">Aksi Buka Kunci</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {group.projects.map((project, rankIdx) => {
                                                    const rank = rankIdx + 1;
                                                    const isTop1 = rank === 1;
                                                    const isTop2 = rank === 2;
                                                    const isTop3 = rank === 3;

                                                    return (
                                                        <tr
                                                            key={project.project_id}
                                                            className={`hover:bg-slate-50/70 transition ${
                                                                isTop1 ? 'bg-amber-50/30' : isTop2 ? 'bg-slate-50/50' : isTop3 ? 'bg-amber-50/10' : ''
                                                            }`}
                                                        >
                                                            {/* Rank */}
                                                            <td className="py-3.5 px-4 text-center">
                                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${
                                                                    isTop1
                                                                        ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30 ring-2 ring-amber-300'
                                                                        : isTop2
                                                                        ? 'bg-slate-300 text-slate-900 ring-2 ring-slate-200'
                                                                        : isTop3
                                                                        ? 'bg-amber-200 text-amber-900 ring-2 ring-amber-100'
                                                                        : 'text-slate-500'
                                                                }`}>
                                                                    #{rank}
                                                                </span>
                                                            </td>

                                                            {/* Award Title */}
                                                            <td className="py-3.5 px-4">
                                                                {isAdmin && !isPublished ? (
                                                                    <input
                                                                        type="text"
                                                                        value={awards[project.project_id] ?? ''}
                                                                        placeholder="Contoh: Juara 1"
                                                                        onChange={(e) => handleAwardChange(project.project_id, e.target.value)}
                                                                        className="w-36 text-xs font-bold py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                                                                    />
                                                                ) : (
                                                                    project.award_title ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-200 shadow-sm">
                                                                            <Award className="w-3.5 h-3.5 text-amber-500" />
                                                                            {project.award_title}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400">-</span>
                                                                    )
                                                                )}
                                                            </td>

                                                            {/* Project Info */}
                                                            <td className="py-3.5 px-4 max-w-sm">
                                                                <div className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded inline-block">
                                                                    {project.registration_code}
                                                                </div>
                                                                <p className="font-bold text-slate-900 mt-1 leading-snug">
                                                                    {project.title}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                                                    <span>{project.leader?.full_name || 'Ketua'}</span>
                                                                </div>
                                                            </td>

                                                            {/* Unit */}
                                                            <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                                                                {project.leader?.unit || '-'}
                                                            </td>

                                                            {/* Verification Avg Score */}
                                                            <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                                                {project.verification_score !== null ? Number(project.verification_score).toFixed(2) : '-'}
                                                            </td>

                                                            {/* Judging Avg Score */}
                                                            <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                                                {project.judging_score !== null ? Number(project.judging_score).toFixed(2) : '-'}
                                                            </td>

                                                            {/* Final Combined Score */}
                                                            <td className="py-3.5 px-4 text-center">
                                                                <span className="inline-block px-3 py-1 rounded-xl text-sm font-black bg-purple-50 text-purple-900 border border-purple-200">
                                                                    {Number(project.final_score).toFixed(2)}
                                                                </span>
                                                            </td>

                                                            {/* Unlock Action (Admin Only) */}
                                                            {isAdmin && (
                                                                <td className="py-3.5 px-4 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenUnlock(project.project)}
                                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition shadow-xs"
                                                                        title="Buka kunci project agar peserta/juri dapat memperbaiki data"
                                                                    >
                                                                        <Unlock className="w-3.5 h-3.5 text-amber-600" />
                                                                        Unlock
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* CONFIRM PUBLISH WINNERS MODAL */}
            {publishModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                            <Award className="w-7 h-7" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-black text-slate-900">Publikasikan Pengumuman Pemenang?</h3>
                            <p className="text-xs text-slate-600 mt-2">
                                Tindakan ini bersifat resmi dan akan mengunci hasil kompetisi BMG untuk stream <strong>{selectedStream?.name}</strong>:
                            </p>
                            <ul className="text-left text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl mt-3 space-y-1.5 border border-slate-200">
                                <li className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span>Gelar pemenang dan ranking resmi terkunci permanen.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span>Status seluruh project finalis berubah menjadi <strong>Announced</strong>.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span>Broadcast notifikasi pemenang terkirim ke seluruh peserta via in-app & email.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setPublishModalOpen(false)}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handlePublishWinners}
                                disabled={isPublishing}
                                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/20 transition disabled:opacity-50"
                            >
                                {isPublishing ? 'Mempublikasikan...' : 'Ya, Umumkan Pemenang Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADMIN UNLOCK PROJECT MODAL (ADM-04) */}
            {unlockModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleSubmitUnlock} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                <Unlock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">Buka Kunci Project (Admin Override)</h3>
                                <p className="text-xs text-slate-500">Project: {unlockModal.project?.registration_code}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                            <p className="font-bold text-slate-800">{unlockModal.project?.title}</p>
                            <p className="text-slate-500">Status saat ini: {unlockModal.project?.status_label || unlockModal.project?.status}</p>
                        </div>

                        {unlockModal.error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
                                {unlockModal.error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Alasan Pembukaan Kunci (Wajib Masuk Audit Log ADM-04) <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={unlockModal.reason}
                                onChange={(e) => setUnlockModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Contoh: Permintaan revisi berkas presentasi PDF atas izin panitia BMG..."
                                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setUnlockModal({ isOpen: false, project: null, reason: '', isSubmitting: false, error: '' })}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={unlockModal.isSubmitting}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                            >
                                {unlockModal.isSubmitting ? 'Membuka Kunci...' : 'Buka Kunci Project'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AppLayout>
    );
}
