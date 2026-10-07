import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Award,
    CheckCircle2,
    Clock,
    FileText,
    Video,
    ChevronRight,
    Users,
    Search,
    SplitSquareVertical,
    BarChart3,
    ArrowUpRight,
    Sparkles,
    ShieldCheck
} from 'lucide-react';

export default function JudgeDashboard({ stats = { total: 0, evaluated: 0, draft: 0, unrated: 0 }, categories = [] }) {
    const { auth } = usePage().props;
    const employee = auth?.user?.employee;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, unrated, draft, submitted

    const totalEvaluatedPercent = stats.total > 0 ? Math.round((stats.evaluated / stats.total) * 100) : 0;

    const heroContent = (
        <div className="space-y-6">
            {/* Header Cockpit Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold backdrop-blur-md mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Dewan Juri Convention Day · Blind Scoring Protocol</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Halo, {employee?.full_name || 'Bapak/Ibu Juri'}! 👋
                    </h1>
                    <p className="text-sm text-slate-200 mt-1 max-w-xl leading-relaxed">
                        Cockpit Penjurian Convention Day. Penilaian Anda sepenuhnya independen, transparan, dan langsung memengaruhi penganugerahan mutu GGF.
                    </p>
                </div>

                {/* Progress Gauge */}
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:min-w-[240px]">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-200 mb-1">
                        <span>Progres Penjurian</span>
                        <span className="text-white font-black text-sm">{totalEvaluatedPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${totalEvaluatedPercent}%` }}
                        />
                    </div>
                    <div className="text-[11px] text-slate-300 mt-2 flex justify-between">
                        <span>{stats.evaluated} selesai</span>
                        <span>{stats.total} total finalis</span>
                    </div>
                </div>
            </div>

            {/* 4 Frosted Summary Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Total Finalis</p>
                        <p className="text-2xl font-black mt-1 text-white">{stats.total}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Penugasan juri</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
                        <Award className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-teal-200 uppercase tracking-wider">Selesai Dinilai</p>
                        <p className="text-2xl font-black mt-1 text-teal-300">{stats.evaluated}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Terkunci & disubmit</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Draf Tersimpan</p>
                        <p className="text-2xl font-black mt-1 text-amber-300">{stats.draft}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Belum difinalisasi</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-rose-200 uppercase tracking-wider">Belum Dinilai</p>
                        <p className="text-2xl font-black mt-1 text-rose-300">{stats.unrated}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Menunggu penilaian</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                        <SplitSquareVertical className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout hero={heroContent}>
            <Head title="Dashboard Juri - Convention Day" />

            <div className="space-y-6">
                {/* Filter and Search Bar */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari kode, judul, atau ketua tim..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                statusFilter === 'all'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Semua ({stats.total})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('unrated')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                statusFilter === 'unrated'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Belum ({stats.unrated})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('draft')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                statusFilter === 'draft'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Draf ({stats.draft})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('submitted')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                statusFilter === 'submitted'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Selesai ({stats.evaluated})
                        </button>
                    </div>
                </div>

                {/* Categories & Projects Accordion/List */}
                {categories.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                            <Award className="w-7 h-7" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">Tidak Ada Project Finalis yang Ditugaskan</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                            Saat ini belum ada project finalis yang dipublikasikan oleh administrator pada stream penugasan Anda.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {categories.map((cat, catIdx) => {
                            const filteredProjects = cat.projects.filter(p => {
                                const matchSearch =
                                    !searchTerm ||
                                    p.registration_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (p.leader_name && p.leader_name.toLowerCase().includes(searchTerm.toLowerCase()));

                                if (!matchSearch) return false;

                                if (statusFilter === 'all') return true;
                                if (statusFilter === 'unrated') return p.my_score_status === 'none';
                                if (statusFilter === 'draft') return p.my_score_status === 'draft';
                                if (statusFilter === 'submitted') return p.my_score_status === 'submitted';
                                return true;
                            });

                            if (filteredProjects.length === 0 && (searchTerm || statusFilter !== 'all')) {
                                return null;
                            }

                            const catPercent = cat.total > 0 ? Math.round((cat.evaluated / cat.total) * 100) : 0;

                            return (
                                <div key={catIdx} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                                    {/* Category Card Header */}
                                    <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                                                {cat.category_name.slice(0, 3).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-base">{cat.category_name}</h3>
                                                <p className="text-xs text-slate-500">
                                                    {cat.evaluated} dari {cat.total} finalis selesai dinilai
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-28 sm:w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-600 rounded-full"
                                                    style={{ width: `${catPercent}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{catPercent}%</span>
                                        </div>
                                    </div>

                                    {/* Projects List */}
                                    <div className="divide-y divide-slate-100">
                                        {filteredProjects.length === 0 ? (
                                            <div className="p-6 text-center text-xs text-slate-400">
                                                Tidak ada finalis yang cocok dengan kriteria filter.
                                            </div>
                                        ) : (
                                            filteredProjects.map(project => {
                                                const isSubmitted = project.my_score_status === 'submitted';
                                                const isDraft = project.my_score_status === 'draft';

                                                return (
                                                    <div
                                                        key={project.id}
                                                        className="p-5 sm:p-6 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                                                    >
                                                        <div className="space-y-1.5 max-w-2xl">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                                                    {project.registration_code}
                                                                </span>

                                                                {/* Status Tag */}
                                                                {isSubmitted ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                        Sudah Dinilai ({project.my_score !== null ? Number(project.my_score).toFixed(1) : ''})
                                                                    </span>
                                                                ) : isDraft ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                                        Draf Nilai ({project.my_score !== null ? Number(project.my_score).toFixed(1) : ''})
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                                        Belum Dinilai
                                                                    </span>
                                                                )}

                                                                {/* Materials Tags */}
                                                                {project.has_presentation && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700">
                                                                        <FileText className="w-3 h-3 text-blue-500" /> PPT/PDF Ada
                                                                    </span>
                                                                )}
                                                                {project.has_video && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700">
                                                                        <Video className="w-3 h-3 text-purple-500" /> Video Ada
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <h4 className="font-extrabold text-base text-slate-900 leading-snug">
                                                                {project.title}
                                                            </h4>

                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                                <span className="flex items-center gap-1 font-medium">
                                                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                                                    {project.leader_name} ({project.unit || '-'})
                                                                </span>
                                                                <span>Stream: {project.stream_name}</span>
                                                                {project.finalised_at && (
                                                                    <span>Finalisasi: {project.finalised_at}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action CTA */}
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <Link
                                                                href={`/judge/projects/${project.id}`}
                                                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition ${
                                                                    isSubmitted
                                                                        ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                                                                        : isDraft
                                                                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                                                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                                                }`}
                                                            >
                                                                <SplitSquareVertical className="w-4 h-4" />
                                                                <span>
                                                                    {isSubmitted
                                                                        ? 'Lihat / Edit Nilai'
                                                                        : isDraft
                                                                        ? 'Lanjutkan Penilaian'
                                                                        : 'Mulai Menilai'}
                                                                </span>
                                                                <ChevronRight className="w-4 h-4" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
