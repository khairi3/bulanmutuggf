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
    CheckCircle,
} from 'lucide-react';

export default function ParticipantDashboard({ projects = [], activeEvent }) {
    const { auth } = usePage().props;
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

    return (
        <AppLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Halo, {employee?.full_name}! 👋
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Unit: <span className="font-semibold text-slate-700">{employee?.unit || 'GGF'}</span> · {employee?.position}
                        </p>
                    </div>

                    <Link href="/participant/projects/create">
                        <Button variant="primary">
                            <FolderPlus className="w-4 h-4 mr-2" />
                            <span>Daftarkan Tim Baru (Phase 3)</span>
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Dashboard Peserta - Bulan Mutu GGF" />

            <div className="space-y-6">
                {/* 1. Welcome Card & Active Event Banner */}
                <div className="bg-gradient-to-r from-emerald-800 to-green-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs mb-3">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{activeEvent?.name || 'Bulan Mutu GGF 2026'} · Pendaftaran Dibuka</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black">
                            Daftarkan Inovasi Terbaik Tim Anda Sekarang!
                        </h2>
                        <p className="mt-2 text-emerald-100 text-sm leading-relaxed">
                            Modul Pendaftaran Peserta (Phase 3) telah aktif. Anda dapat mendaftarkan tim perbaikan, mengisi lembar charter, menyusun inisiatif, dan melampirkan berkas presentasi.
                        </p>
                    </div>
                </div>

                {/* 2. Daftar Project Saya (PAR-07) */}
                <Card
                    title="Project Saya (PAR-07)"
                    subtitle="Daftar tim dan project inovasi yang Anda daftarkan atau ikuti"
                    action={
                        <Link href="/participant/projects/create">
                            <Button size="sm" variant="outline">
                                <FolderPlus className="w-3.5 h-3.5 mr-1" />
                                <span>Tambah Project</span>
                            </Button>
                        </Link>
                    }
                >
                    {projects.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                                <FileText className="w-7 h-7" />
                            </div>
                            <h4 className="text-base font-bold text-slate-800">Belum Ada Project Terdaftar</h4>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                                Anda belum memiliki project. Klik tombol di bawah untuk memulai pendaftaran tim melalui wizard 6 langkah.
                            </p>
                            <Link href="/participant/projects/create">
                                <Button variant="primary">
                                    <FolderPlus className="w-4 h-4 mr-2" />
                                    <span>Mulai Pendaftaran Tim</span>
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projects.map((proj) => {
                                const isLeader = proj.leader_employee_id === employee?.id;
                                return (
                                    <div
                                        key={proj.id}
                                        className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge status={proj.status} />
                                                    {proj.registration_code && (
                                                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                            {proj.registration_code}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    {proj.stream?.name}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-base text-slate-900 line-clamp-2 mt-1">
                                                {proj.title}
                                            </h3>

                                            <p className="text-xs text-slate-500 mt-1">
                                                Peran Anda: <strong className="text-slate-700">{isLeader ? 'Ketua Tim' : 'Anggota Tim'}</strong> · Anggota: {proj.team_members?.length || 1} orang
                                            </p>

                                            {/* Stepper Status Visual */}
                                            <div className="mt-4 pt-3 border-t border-slate-100">
                                                <Stepper steps={sampleSteps} currentStep={getStatusIndex(proj.status)} />
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs text-slate-400">
                                                Versi Charter: <strong className="text-slate-600">v{proj.current_version?.version_no || 1}</strong>
                                            </span>
                                            {proj.status === 'draft' ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Link href={`/participant/projects/${proj.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            <span>Detail</span>
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/participant/projects/create?draft_id=${proj.id}`}>
                                                        <Button size="sm" variant="primary">
                                                            <span>Lanjutkan Draft</span>
                                                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            ) : (
                                                <Link href={`/participant/projects/${proj.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        <span>Buka Project</span>
                                                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
