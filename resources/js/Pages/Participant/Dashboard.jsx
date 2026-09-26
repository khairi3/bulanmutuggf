import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Badge from '@/Components/Badge';
import Stepper from '@/Components/Stepper';
import Button from '@/Components/Button';
import { FolderPlus, FileText, Clock, HelpCircle, Sparkles } from 'lucide-react';

export default function ParticipantDashboard({ projects = [] }) {
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
                    <Button variant="primary" disabled title="Akan aktif di Phase 3">
                        <FolderPlus className="w-4 h-4 mr-2" />
                        <span>Daftarkan Tim Baru (Phase 3)</span>
                    </Button>
                </div>
            }
        >
            <Head title="Dashboard Peserta - Bulan Mutu GGF" />

            <div className="space-y-6">
                {/* Welcome Card & Phase Information */}
                <div className="bg-gradient-to-r from-emerald-800 to-green-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs mb-3">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Bulan Mutu GGF 2026 · Persiapan Pembukaan</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black">
                            Portal Inovasi GGF Siap Menyambut Karya Terbaik Anda
                        </h2>
                        <p className="mt-2 text-emerald-100 text-sm leading-relaxed">
                            Modul autentikasi dan hak akses (Phase 1) telah aktif. Anda terdaftar sebagai Peserta. Jika Anda juga ditugaskan sebagai Verifikator Lapangan, gunakan fitur <strong>Ganti Peran</strong> di pojok kanan atas untuk beralih mode.
                        </p>
                    </div>
                </div>

                {/* Progress Stepper Demonstration */}
                <Card
                    title="Alur Tahapan Lomba BMG (10 Tahapan State Machine)"
                    subtitle="Setiap project yang Anda daftarkan akan bergerak melalui siklus status berikut"
                >
                    <Stepper steps={sampleSteps} currentStep={1} />
                </Card>

                {/* Empty State Project Saya */}
                <Card
                    title="Project Saya"
                    subtitle="Daftar tim dan project yang Anda daftarkan atau ikuti"
                >
                    <div className="py-12 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-bold text-slate-800">Belum Ada Project Terdaftar</h4>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                            Fitur pendaftaran tim, pengisian project charter, dan autosave draft akan dibuka pada <strong>Phase 3 (Module Peserta)</strong>.
                        </p>
                        <Button variant="secondary" disabled>
                            Registrasi Dibuka Segera
                        </Button>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
