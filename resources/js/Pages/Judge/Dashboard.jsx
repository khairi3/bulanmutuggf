import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import { Award, SplitSquareVertical } from 'lucide-react';

export default function JudgeDashboard() {
    const { auth } = usePage().props;
    const employee = auth?.user?.employee;

    return (
        <AppLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Juri Convention Day</h1>
                    <p className="text-sm text-slate-500 mt-1">Juri Penilai: {employee?.full_name}</p>
                </div>
            }
        >
            <Head title="Dashboard Juri - Bulan Mutu GGF" />

            <div className="space-y-6">
                <Card
                    title="Ruang Penjurian Convention Day"
                    subtitle="Fitur penilaian split-screen, timer, dan rubrik akan aktif pada Phase 5 (Module Juri)"
                >
                    <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                            <Award className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">Tahap Penjurian Belum Dibuka</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                            Daftar finalis yang lolos seleksi akan ditampilkan di sini saat fase Convention Day tiba.
                        </p>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
