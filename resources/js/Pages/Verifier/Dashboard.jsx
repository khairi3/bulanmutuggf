import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Badge from '@/Components/Badge';
import { CheckSquare, AlertCircle, FileCheck, MapPin } from 'lucide-react';

export default function VerifierDashboard() {
    const { auth } = usePage().props;
    const employee = auth?.user?.employee;

    return (
        <AppLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Verifikator Lapangan</h1>
                    <p className="text-sm text-slate-500 mt-1">Verifikator: {employee?.full_name} · Unit {employee?.unit}</p>
                </div>
            }
        >
            <Head title="Dashboard Verifikator - Bulan Mutu GGF" />

            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Di-assign</p>
                        <p className="text-2xl font-extrabold text-slate-900 mt-1">0</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Dinilai</p>
                        <p className="text-2xl font-extrabold text-amber-600 mt-1">0</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sudah Diverifikasi</p>
                        <p className="text-2xl font-extrabold text-emerald-600 mt-1">0</p>
                    </Card>
                </div>

                <Card
                    title="Daftar Project Verifikasi Lapangan"
                    subtitle="Assignment stream dan kategori akan aktif pada Phase 4 (Module Verifikator)"
                >
                    <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <FileCheck className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">Belum Ada Project yang Ditugaskan</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                            Ketika fase verifikasi dibuka oleh Admin, project yang sesuai stream penugasan Anda akan muncul di tabel ini.
                        </p>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
