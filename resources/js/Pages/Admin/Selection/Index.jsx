import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Award,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Save,
    Send,
    ShieldAlert,
    RefreshCw,
    Users,
    ChevronRight,
    Search,
    SlidersHorizontal,
    FileCheck2
} from 'lucide-react';

export default function SelectionIndex({ streams = [], selectedStream, rankings = [], isPublished, publishedAt }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.roles?.some(r => r.name === 'admin' || r.code === 'admin');

    // Local state for draft decisions (checked = qualified)
    // Initialize from rankings data
    const initialQualifiedIds = [];
    const allProjectIds = [];
    rankings.forEach(group => {
        group.projects.forEach(p => {
            allProjectIds.push(p.id);
            if (p.decision === 'qualified') {
                initialQualifiedIds.push(p.id);
            }
        });
    });

    const [qualifiedIds, setQualifiedIds] = useState(initialQualifiedIds);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    // Override Modal State
    const [overrideModal, setOverrideModal] = useState({
        isOpen: false,
        project: null,
        decision: 'qualified',
        reason: '',
        isSubmitting: false,
        error: '',
    });

    // Publish Confirmation Modal State
    const [publishConfirmModal, setPublishConfirmModal] = useState(false);

    const handleStreamChange = (streamId) => {
        const url = isAdmin ? '/admin/selection' : '/verifier/selection';
        router.get(url, { stream_id: streamId }, { preserveState: false });
    };

    const toggleQualified = (projectId) => {
        if (isPublished) return;
        setQualifiedIds(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleAutoSelectTopQuota = (group) => {
        if (isPublished || !group.quota) return;
        const topProjects = group.projects.slice(0, group.quota);
        const topIds = topProjects.map(p => p.id);
        const otherGroupProjectIds = group.projects.map(p => p.id);

        setQualifiedIds(prev => {
            const filtered = prev.filter(id => !otherGroupProjectIds.includes(id));
            return [...filtered, ...topIds];
        });
    };

    const handleSaveDraft = () => {
        setIsSavingDraft(true);
        const url = isAdmin ? '/admin/selection/draft' : '/verifier/selection/draft';
        router.post(url, {
            stream_id: selectedStream.id,
            project_ids: allProjectIds,
            qualified_ids: qualifiedIds,
        }, {
            preserveScroll: true,
            onFinish: () => setIsSavingDraft(false),
        });
    };

    const handlePublish = () => {
        if (!isAdmin) return;
        setIsPublishing(true);
        router.post(`/admin/streams/${selectedStream.id}/selection/publish`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsPublishing(false);
                setPublishConfirmModal(false);
            },
        });
    };

    const handleOpenOverride = (project) => {
        setOverrideModal({
            isOpen: true,
            project,
            decision: project.decision === 'qualified' ? 'not_qualified' : 'qualified',
            reason: '',
            isSubmitting: false,
            error: '',
        });
    };

    const handleSubmitOverride = (e) => {
        e.preventDefault();
        if (!overrideModal.reason || overrideModal.reason.trim().length < 5) {
            setOverrideModal(prev => ({ ...prev, error: 'Alasan override wajib diisi minimal 5 karakter.' }));
            return;
        }

        setOverrideModal(prev => ({ ...prev, isSubmitting: true, error: '' }));

        router.post(`/admin/projects/${overrideModal.project.id}/selection/override`, {
            decision: overrideModal.decision,
            reason: overrideModal.reason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setOverrideModal({ isOpen: false, project: null, decision: 'qualified', reason: '', isSubmitting: false, error: '' });
            },
            onError: (err) => {
                setOverrideModal(prev => ({ ...prev, isSubmitting: false, error: err.reason || 'Terjadi kesalahan.' }));
            },
        });
    };

    // Calculate total summary stats
    const totalProjects = rankings.reduce((acc, g) => acc + g.projects.length, 0);
    const totalSelected = qualifiedIds.length;

    return (
        <AppLayout>
            <Head title="Seleksi Convention Day" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Award className="w-7 h-7 text-amber-500" />
                                Seleksi Finalis Convention Day
                            </h1>
                            {isPublished ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Hasil Resmi Dipublikasikan ({publishedAt})
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                                    Tahap Review & Draf Seleksi
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                            Urutan project dihitung secara transparan dari rata-rata nilai verifikasi tim juri/verifikator lapangan.
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        {!isPublished && (
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={isSavingDraft}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-sm transition disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 text-slate-500" />
                                {isSavingDraft ? 'Menyimpan...' : 'Simpan Draf'}
                            </button>
                        )}

                        {isAdmin && !isPublished && (
                            <button
                                type="button"
                                onClick={() => setPublishConfirmModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition"
                            >
                                <Send className="w-4 h-4" />
                                Publikasikan Seleksi
                            </button>
                        )}
                    </div>
                </div>

                {/* Published Notice Banner */}
                {isPublished && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-emerald-900">
                            <span className="font-bold">Status Resmi Terkunci:</span> Hasil seleksi stream{' '}
                            <span className="font-semibold underline">{selectedStream?.name}</span> telah dipublikasikan.
                            Tim yang lolos telah menerima notifikasi resmi dan dapat melakukan finalisasi materi presentasi.
                            {isAdmin && ' Anda dapat menggunakan tombol Override jika terdapat perubahan penetapan khusus.'}
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
                                            ? 'border-emerald-600 text-emerald-700'
                                            : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Stream: {st.name}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Top Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Project Terverifikasi</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{totalProjects}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <FileCheck2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lolos Convention Day</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1">{totalSelected}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <Award className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tidak Lolos</p>
                            <p className="text-2xl font-black text-rose-500 mt-1">{Math.max(0, totalProjects - totalSelected)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                            <XCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                            type="text"
                            placeholder="Cari kode atau judul project..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        />
                    </div>
                    <div className="text-xs text-slate-500 italic">
                        Tip: Gunakan tombol "Pilih Otomatis Kuota Teratas" untuk menandai tim berdasarkan kuota resmi masing-masing kategori.
                    </div>
                </div>

                {/* Categories Ranking Groups */}
                {rankings.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-700 text-base">Belum Ada Project yang Selesai Diverifikasi</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                            Project harus berstatus Terverifikasi dengan minimal 1 nilai verifikator yang telah disubmit sebelum masuk ke tahapan seleksi ini.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {rankings.map((group, groupIndex) => {
                            const optionName = group.option ? `${group.option.name} (${group.option.abbreviation})` : 'Umum / Tanpa Kategori';
                            const quota = group.quota;
                            const groupProjects = group.projects.filter(p =>
                                !searchTerm ||
                                p.registration_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (p.leader?.full_name && p.leader.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                            );

                            const selectedInGroupCount = group.projects.filter(p => qualifiedIds.includes(p.id)).length;
                            const isOverQuota = quota && selectedInGroupCount > quota;

                            return (
                                <div key={groupIndex} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Category Header */}
                                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                                                {group.option?.abbreviation || 'BMG'}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                                                    {optionName}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                    <span>Kuota Terpilih: <strong className={isOverQuota ? 'text-rose-600' : 'text-slate-800'}>{selectedInGroupCount}</strong> {quota ? `/ ${quota}` : ''}</span>
                                                    {isOverQuota && (
                                                        <span className="text-rose-600 font-bold flex items-center gap-1">
                                                            <AlertTriangle className="w-3.5 h-3.5" /> (Melebihi kuota {quota})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {!isPublished && quota && (
                                            <button
                                                type="button"
                                                onClick={() => handleAutoSelectTopQuota(group)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition self-start sm:self-auto"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Pilih Otomatis Top {quota} Kuota
                                            </button>
                                        )}
                                    </div>

                                    {/* Ranking Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                                <tr>
                                                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                                                    <th className="py-3 px-4 w-14 text-center">Pilih</th>
                                                    <th className="py-3 px-4">Project & Tim</th>
                                                    <th className="py-3 px-4">Plant / Unit</th>
                                                    <th className="py-3 px-4 text-center">Nilai Verifikasi</th>
                                                    <th className="py-3 px-4 text-center">Status Keputusan</th>
                                                    {isPublished && isAdmin && (
                                                        <th className="py-3 px-4 text-center">Aksi Override</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {groupProjects.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="py-6 text-center text-slate-400 text-sm">
                                                            Tidak ada project yang sesuai dengan filter pencarian.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    groupProjects.map((project, rankIdx) => {
                                                        const isQualified = qualifiedIds.includes(project.id);
                                                        const rank = rankIdx + 1;
                                                        const withinQuota = quota ? rank <= quota : true;

                                                        return (
                                                            <tr
                                                                key={project.id}
                                                                className={`hover:bg-slate-50/70 transition ${
                                                                    isQualified ? 'bg-emerald-50/20' : ''
                                                                }`}
                                                            >
                                                                {/* Rank badge */}
                                                                <td className="py-3.5 px-4 text-center">
                                                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                                                                        rank === 1
                                                                            ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                                                                            : rank === 2
                                                                            ? 'bg-slate-200 text-slate-700'
                                                                            : rank === 3
                                                                            ? 'bg-amber-50 text-amber-700'
                                                                            : 'text-slate-500'
                                                                    }`}>
                                                                        #{rank}
                                                                    </span>
                                                                </td>

                                                                {/* Checkbox selector */}
                                                                <td className="py-3.5 px-4 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isQualified}
                                                                        disabled={isPublished}
                                                                        onChange={() => toggleQualified(project.id)}
                                                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                                                                    />
                                                                </td>

                                                                {/* Project info */}
                                                                <td className="py-3.5 px-4 max-w-md">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                                                            {project.registration_code}
                                                                        </span>
                                                                        {withinQuota && quota && (
                                                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                                                Top Quota
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="font-bold text-slate-900 mt-1 leading-snug">
                                                                        {project.title}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                                                        <span>{project.leader?.full_name || 'Ketua Tim'}</span>
                                                                    </div>
                                                                </td>

                                                                {/* Plant / Unit */}
                                                                <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                                                                    {project.leader?.unit || '-'}
                                                                </td>

                                                                {/* Verification Score */}
                                                                <td className="py-3.5 px-4 text-center">
                                                                    <div className="inline-flex flex-col items-center">
                                                                        <span className="font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                                                            {project.verification_score !== null ? Number(project.verification_score).toFixed(2) : '-'}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                                                            {project.verifier_count} verifikator
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                {/* Status Keputusan */}
                                                                <td className="py-3.5 px-4 text-center">
                                                                    {isQualified ? (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                            Lolos Convention
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                                                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                                                            Tidak Lolos
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* Override Action (Admin Only after publish) */}
                                                                {isPublished && isAdmin && (
                                                                    <td className="py-3.5 px-4 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenOverride(project)}
                                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition shadow-sm"
                                                                        >
                                                                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                                                                            Override
                                                                        </button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* CONFIRM PUBLISH MODAL */}
            {publishConfirmModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <Send className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-black text-slate-900">Publikasikan Hasil Seleksi Resmi?</h3>
                            <p className="text-sm text-slate-600 mt-2">
                                Setelah dipublikasikan:
                            </p>
                            <ul className="text-left text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mt-3 space-y-1.5 border border-slate-200">
                                <li className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span>Status project lolos ({totalSelected} tim) berubah menjadi <strong>Qualified</strong>.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span>Notifikasi resmi otomatis dikirimkan ke email/dashboard peserta (NOT-05).</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span>Keputusan terkunci. Perubahan selanjutnya wajib lewat <strong>Admin Override</strong>.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setPublishConfirmModal(false)}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition disabled:opacity-50"
                            >
                                {isPublishing ? 'Mempublikasikan...' : 'Ya, Publikasikan Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADMIN OVERRIDE MODAL */}
            {overrideModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleSubmitOverride} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">Admin Override Keputusan Seleksi</h3>
                                <p className="text-xs text-slate-500">Project: {overrideModal.project?.registration_code}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                            <p className="font-bold text-slate-800">{overrideModal.project?.title}</p>
                            <p className="text-slate-500">Ketua: {overrideModal.project?.leader?.full_name} ({overrideModal.project?.leader?.unit})</p>
                        </div>

                        {overrideModal.error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
                                {overrideModal.error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Keputusan Baru
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setOverrideModal(prev => ({ ...prev, decision: 'qualified' }))}
                                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                            overrideModal.decision === 'qualified'
                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                                                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                        }`}
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        Lolos Convention
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOverrideModal(prev => ({ ...prev, decision: 'not_qualified' }))}
                                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                            overrideModal.decision === 'not_qualified'
                                                ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                                                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                        }`}
                                    >
                                        <XCircle className="w-4 h-4 text-rose-600" />
                                        Tidak Lolos
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Alasan Override (Wajib Masuk Audit Log) <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={overrideModal.reason}
                                    onChange={(e) => setOverrideModal(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Contoh: Diskualifikasi berkas atau penyesuaian kuota divisi berdasarkan keputusan komite..."
                                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setOverrideModal({ isOpen: false, project: null, decision: 'qualified', reason: '', isSubmitting: false, error: '' })}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={overrideModal.isSubmitting}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                            >
                                {overrideModal.isSubmitting ? 'Menyimpan...' : 'Simpan Override'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AppLayout>
    );
}
