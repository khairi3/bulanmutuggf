import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

export default function ViewerDashboard() {
    const { auth } = usePage().props;
    const employee = auth?.user?.employee;

    return (
        <AppLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard Bulan Mutu GGF</h1>
                    <p className="text-sm text-slate-500 mt-1">Akses Manajemen: {employee?.full_name} ({employee?.position})</p>
                </div>
            }
        >
            <Head title="Executive Dashboard - Bulan Mutu GGF" />

            <div className="space-y-6">
                <Card
                    title="Statistik Partisipasi & Ringkasan Lomba"
                    subtitle="Visualisasi grafik, partisipasi per unit estate/pabrik, dan funnel seleksi (Phase 6)"
                >
                    <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">Ringkasan Eksekutif Sedang Disiapkan</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                            Data agregasi statistik lintas unit PG1–PG4, FFP, PPP, FSTL, MFG, dan UMM akan tersedia seiring berjalannya lomba.
                        </p>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
