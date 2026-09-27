import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    BarChart3,
    TrendingUp,
    Users,
    FileText,
    Award,
    CheckCircle2,
    Building2,
    Sparkles,
    ArrowUpRight,
    ChevronRight,
    Trophy,
    SlidersHorizontal
} from 'lucide-react';

export default function ViewerDashboard({
    stats = {
        total_projects: 0,
        total_participants: 0,
        submitted: 0,
        verified: 0,
        qualified: 0,
        finalised: 0,
        winners: 0,
    },
    funnel = [],
    streams = [],
    unitDistribution = [],
    winners = []
}) {
    const { auth } = usePage().props;
    const employee = auth?.user?.employee;

    // Calculate max unit project count for relative percentage bars
    const maxUnitCount = unitDistribution.length > 0
        ? Math.max(...unitDistribution.map(u => u.total_projects))
        : 1;

    return (
        <AppLayout>
            <Head title="Executive Management Dashboard - Bulan Mutu GGF" />

            <div className="space-y-6">
                {/* Executive Cockpit Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold mb-3">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                                Executive Management Intelligence (REP-02)
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                Dashboard Eksekutif Bulan Mutu GGF 2026
                            </h1>
                            <p className="text-sm text-emerald-200/80 mt-1 max-w-xl">
                                Monitoring holistik inovasi, laju konversi tahapan, dan distribusi partisipasi di seluruh plant & unit bisnis Great Giant Foods.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/viewer/recap"
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition self-start md:self-auto"
                            >
                                <Award className="w-4 h-4" />
                                <span>Lihat Rekap & Leaderboard</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 5 KPI Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inovasi</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-slate-900 mt-2">{stats.total_projects}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Project terdaftar</p>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Partisipan</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-purple-700 mt-2">{stats.total_participants}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Karyawan aktif terlibat</p>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Terverifikasi</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-600 mt-2">{stats.verified}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tuntas verifikasi lapangan</p>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Finalis</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Award className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-amber-600 mt-2">{stats.qualified}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Lolos Convention Day</p>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pemenang</span>
                            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Trophy className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-rose-600 mt-2">{stats.winners}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Juara resmi BMG</p>
                    </div>
                </div>

                {/* Stage Conversion Funnel (REP-02) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                Funnel Konversi Tahapan Kompetisi
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Progres alur dari pendaftaran draft hingga penetapan pemenang
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                        {funnel.map((step, idx) => {
                            const percent = stats.total_projects > 0 ? Math.round((step.count / stats.total_projects) * 100) : 0;
                            return (
                                <div key={idx} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                        <span>Tahap {idx + 1}</span>
                                        <span className="text-emerald-700">{percent}%</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-800 truncate" title={step.stage}>{step.stage}</p>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <p className="text-lg font-black text-slate-900">{step.count}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2-Column: Stream Progress & Unit Participation */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Streams Distribution (col 6) */}
                    <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                                    <SlidersHorizontal className="w-5 h-5 text-purple-600" />
                                    Kinerja per Stream Lomba
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Status verifikasi dan finalis per stream</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-1">
                            {streams.map(st => (
                                <div key={st.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-black">
                                                {st.code}
                                            </span>
                                            <span className="font-black text-sm text-slate-900">{st.name}</span>
                                        </div>
                                        {st.results_published ? (
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                Pemenang Selesai
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                Sedang Berjalan
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center pt-1 text-xs">
                                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                                            <span className="text-[10px] text-slate-400 block">Total</span>
                                            <span className="font-black text-slate-800 text-sm">{st.total_projects}</span>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                                            <span className="text-[10px] text-emerald-600 block">Terverifikasi</span>
                                            <span className="font-black text-emerald-700 text-sm">{st.verified_projects}</span>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                                            <span className="text-[10px] text-purple-600 block">Finalis</span>
                                            <span className="font-black text-purple-700 text-sm">{st.qualified_projects}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Unit / Plant Participation (col 6) */}
                    <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Partisipasi Top 10 Unit / Plant
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Distribusi keikutsertaan per unit bisnis</p>
                            </div>
                        </div>

                        <div className="space-y-2.5 pt-1">
                            {unitDistribution.length === 0 ? (
                                <p className="text-xs text-slate-400 py-8 text-center">Belum ada data partisipasi unit.</p>
                            ) : (
                                unitDistribution.map((unit, idx) => {
                                    const percent = Math.round((unit.total_projects / maxUnitCount) * 100);
                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                                <span className="truncate max-w-[240px]">{unit.unit}</span>
                                                <span className="text-slate-900 font-black">{unit.total_projects} project</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Hall of Fame / Juara Resmi (jika ada pemenang yang dipublish) */}
                {winners.length > 0 && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-500" />
                                    Daftar Pemenang Resmi Bulan Mutu GGF 2026
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Para peraih gelar juara dari seluruh kategori lomba</p>
                            </div>

                            <Link
                                href="/viewer/recap"
                                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                                Lihat Semua Detail Leaderboard <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            {winners.slice(0, 6).map((w, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-200/80 text-amber-900 border border-amber-300">
                                            <Trophy className="w-3.5 h-3.5 text-amber-700" />
                                            {w.award_title}
                                        </span>
                                        <span className="text-xs font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                                            Skor: {Number(w.final_score).toFixed(2)}
                                        </span>
                                    </div>
                                    <h4 className="font-black text-sm text-slate-900 leading-snug">{w.project_title}</h4>
                                    <div className="text-xs text-slate-500 space-y-0.5">
                                        <p className="font-mono text-[11px] text-slate-400">{w.registration_code} • {w.stream_name}</p>
                                        <p>Ketua: <strong>{w.leader_name}</strong> ({w.unit})</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
