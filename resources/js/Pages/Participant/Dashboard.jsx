import React from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Badge from '@/Components/Badge';
import Stepper from '@/Components/Stepper';
import Button from '@/Components/Button';
import {
    FolderPlus,
    FileText,
    Clock,
    Sparkles,
    ArrowRight,
    Users,
    CheckCircle2,
    Building2,
    Shield,
    Award,
    TrendingUp,
    Layers,
    ChevronRight
} from 'lucide-react';

export default function ParticipantDashboard({ projects = [], activeEvent }) {
    const { auth, certificates } = usePage().props;
    const employee = auth?.user?.employee;

    const sampleSteps = [
        { label: 'Draft' },
        { label: 'Submitted' },
        { label: 'Verifikasi' },
        { label: 'Seleksi' },
        { label: 'Finalised' },
        { label: 'Convention' },
    ];

    const getStatusIndex = (status) => {
        switch (status) {
            case 'draft': return 0;
            case 'submitted': return 1;
            case 'in_verification': return 2;
            case 'verified': return 3;
            case 'qualified': return 4;
            case 'finalised': return 5;
            default: return 1;
        }
    };

    // Quick stats
    const draftCount = projects.filter(p => p.status === 'draft').length;
    const submittedCount = projects.filter(p => p.status !== 'draft').length;

    const heroContent = (
        <div className="space-y-6">
            {/* Top row: Event pill & Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold backdrop-blur-md mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                        <span>{activeEvent?.name || 'Bulan Mutu GGF 2027'} · Ruang Inovasi Peserta</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Halo, {employee?.full_name || 'Inovator Tim'}! 👋
                    </h1>
                    <p className="text-sm text-slate-200 mt-1 max-w-xl">
                        Unit: <span className="font-semibold text-emerald-300">{employee?.unit || 'GGF Korporat'}</span> · {employee?.position || 'Innovator'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/participant/projects/create"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <FolderPlus className="w-4 h-4" />
                        <span>Daftarkan Tim Baru</span>
                    </Link>
                </div>
            </div>

            {/* Frosted Glass KPI Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Total Project Anda</p>
                        <p className="text-2xl font-black mt-1 text-white">{projects.length}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Sebagai ketua maupun anggota</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Draf Perlu Dilengkapi</p>
                        <p className="text-2xl font-black mt-1 text-amber-300">{draftCount}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Lanjutkan pendaftaran wizard</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-teal-200 uppercase tracking-wider">Sedang Berjalan</p>
                        <p className="text-2xl font-black mt-1 text-teal-300">{submittedCount}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Dalam tahap verifikasi & seleksi</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                        <Award className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout hero={heroContent}>
            <Head title="Dashboard Peserta - Bulan Mutu GGF" />

            <div className="space-y-6">
                {/* Certificate Published Announcement */}
                {certificates?.isPublished && (
                    <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 border border-amber-300 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                                <Award className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-1">
                                    E-Sertifikat Resmi Diterbitkan
                                </div>
                                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                                    E-Sertifikat Peserta Telah Tersedia!
                                </h3>
                                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                                    Selamat kepada Anda dan tim! Sertifikat resmi atas nama masing-masing anggota tim kini dapat langsung diunduh dalam format PDF resmi dengan nomor seri dan QR Code verifikasi.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            Project Inovasi Tim Saya
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Daftar inisiatif perbaikan berkesinambungan yang Anda pimpin atau ikuti
                        </p>
                    </div>

                    <Link
                        href="/participant/projects/create"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition"
                    >
                        <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tambah Project Baru</span>
                    </Link>
                </div>

                {/* Projects List or Empty State */}
                {projects.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">Belum Ada Project Terdaftar</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
                            Anda belum memiliki inisiatif inovasi yang terdaftar pada Bulan Mutu GGF tahun ini. Mulai dengan mendaftarkan tim Anda sekarang melalui formulir wizard 6 langkah.
                        </p>
                        <Link
                            href="/participant/projects/create"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <FolderPlus className="w-4 h-4" />
                            <span>Mulai Pendaftaran Tim</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {projects.map((proj) => {
                            const isLeader = proj.leader_employee_id === employee?.id;
                            const stepIdx = getStatusIndex(proj.status);

                            return (
                                <div
                                    key={proj.id}
                                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between group"
                                >
                                    <div>
                                        {/* Card Top Pill Row */}
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <Badge status={proj.status} />
                                                {proj.registration_code && (
                                                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                                        {proj.registration_code}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80">
                                                {proj.stream?.name || 'Inovasi Stream'}
                                            </span>
                                        </div>

                                        {/* Project Title */}
                                        <h3 className="font-black text-lg text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                                            {proj.title}
                                        </h3>

                                        {/* Role & Team Metadata */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-2.5">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                                <span>{isLeader ? 'Ketua Tim' : 'Anggota Tim'}</span>
                                            </span>
                                            <span>·</span>
                                            <span>{proj.team_members?.length || 1} Personel</span>
                                            <span>·</span>
                                            <span>Versi: <strong className="text-slate-700">v{proj.current_version?.version_no || 1}</strong></span>
                                        </div>

                                        {/* Milestone Progress Visual */}
                                        <div className="mt-5 pt-4 border-t border-slate-100">
                                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                                <span>Tahapan Progres</span>
                                                <span className="text-emerald-700 font-extrabold">
                                                    Tahap {stepIdx + 1} dari {sampleSteps.length} ({sampleSteps[stepIdx]?.label})
                                                </span>
                                            </div>
                                            <Stepper steps={sampleSteps} currentStep={stepIdx} />
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 font-medium">
                                                {proj.status === 'draft' ? 'Draft belum disubmit' : 'Terdaftar di event'}
                                            </span>

                                            {certificates?.isPublished && proj.status !== 'draft' && (
                                                <a
                                                    href={`/participant/projects/${proj.id}/certificate`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-2xs transition"
                                                >
                                                    <Award className="w-3.5 h-3.5 text-amber-600" />
                                                    <span>
                                                        {proj.final_result?.award_title
                                                            ? `Unduh Sertifikat Juara (${proj.final_result.award_title})`
                                                            : ['qualified', 'judging', 'finalised', 'announced'].includes(proj.status)
                                                            ? 'Unduh Sertifikat Finalis'
                                                            : 'Unduh Sertifikat Peserta'}
                                                    </span>
                                                </a>
                                            )}
                                        </div>

                                        {proj.status === 'draft' ? (
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/participant/projects/${proj.id}`}
                                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                                                >
                                                    Detail
                                                </Link>
                                                <Link
                                                    href={`/participant/projects/create?draft_id=${proj.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                                                >
                                                    <span>Lanjutkan Draft</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        ) : (
                                            <Link
                                                href={`/participant/projects/${proj.id}`}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                                            >
                                                <span>Buka Project</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
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
