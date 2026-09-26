import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Badge from '@/Components/Badge';
import Table from '@/Components/Table';
import Button from '@/Components/Button';
import Modal from '@/Components/Modal';
import Input from '@/Components/Input';
import { Users, Shield, Activity, Key, CheckCircle, Clock } from 'lucide-react';

export default function AdminDashboard({ stats }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        reason: '',
    });

    const openResetModal = (user) => {
        setSelectedUser(user);
        setIsResetModalOpen(true);
    };

    const handleAdminReset = (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        post(`/admin/users/${selectedUser.id}/reset-password`, {
            onSuccess: () => {
                setIsResetModalOpen(false);
                reset();
            },
        });
    };

    const auditColumns = [
        {
            header: 'Waktu',
            accessor: 'created_at',
            render: (row) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
            ),
        },
        {
            header: 'Pengguna',
            accessor: 'user',
            render: (row) => (
                <span className="font-semibold text-slate-800 text-xs">
                    {row.user?.employee?.full_name || 'System / Guest'}
                </span>
            ),
        },
        {
            header: 'Aksi',
            accessor: 'action',
            render: (row) => (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    {row.action}
                </span>
            ),
        },
        {
            header: 'Keterangan',
            accessor: 'reason',
            render: (row) => (
                <span className="text-xs text-slate-600 truncate max-w-xs block">
                    {row.reason || '-'}
                </span>
            ),
        },
        {
            header: 'IP / Entitas',
            accessor: 'entity_type',
            render: (row) => (
                <span className="text-xs text-slate-400 font-mono">
                    {row.entity_type} {row.entity_id ? `#${row.entity_id}` : ''}
                </span>
            ),
        },
    ];

    return (
        <AppLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel Administrasi & Panitia L&D</h1>
                        <p className="text-sm text-slate-500 mt-1">Sistem Pengelolaan Bulan Mutu GGF 2026 · Phase 1</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Phase 1 Setup Active</span>
                    </span>
                </div>
            }
        >
            <Head title="Admin Dashboard - Bulan Mutu GGF" />

            <div className="space-y-6">
                {/* 1. Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-emerald-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Karyawan</p>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_employees || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-blue-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User Akun Terdaftar</p>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_users || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Key className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-amber-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Karyawan Aktif</p>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.active_employees || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-purple-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Log Audit Tercatat</p>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.recent_audits?.length || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Shield className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 2. PRD Design Tokens Verification: Status Badges Showcase */}
                <Card
                    title="Design Tokens: Palet Status Project (PRD Bagian 5.5)"
                    subtitle="Standar warna dan visual badge status untuk seluruh 10 tahapan project BMG"
                >
                    <div className="flex flex-wrap gap-2.5 pt-1">
                        <Badge status="Draft" />
                        <Badge status="Submitted" />
                        <Badge status="Dalam Verifikasi" />
                        <Badge status="Terverifikasi" />
                        <Badge status="Lolos Convention" />
                        <Badge status="Tidak Lolos" />
                        <Badge status="Finalised" />
                        <Badge status="Dinilai Juri" />
                        <Badge status="Hasil Diumumkan" />
                    </div>
                </Card>

                {/* 3. Audit Log Table */}
                <Card
                    title="Audit Log Terkini (Append-Only PRD 6.2)"
                    subtitle="Setiap tindakan autentikasi, perubahan peran, dan aksi admin tersimpan dengan identitas pengubah"
                >
                    <Table
                        columns={auditColumns}
                        data={stats?.recent_audits || []}
                        emptyMessage="Belum ada aktivitas audit log yang tercatat."
                    />
                </Card>
            </div>

            {/* Modal Admin Reset Password */}
            <Modal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                title="Reset Password Karyawan (AUTH-03)"
                description={`Reset password sementara untuk karyawan ${selectedUser?.employee?.full_name}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsResetModalOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="primary" loading={processing} onClick={handleAdminReset}>
                            Konfirmasi Reset
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Password akan diatur ke default <code>password123</code> dan karyawan akan diwajibkan mengganti password pada saat login berikutnya.
                    </p>
                    <Input
                        id="reason"
                        label="Alasan Reset Password (Wajib Audit Log)"
                        placeholder="Contoh: Permintaan karyawan tanpa email via PIC Estate PG1"
                        value={data.reason}
                        error={errors.reason}
                        onChange={(e) => setData('reason', e.target.value)}
                        required
                    />
                </div>
            </Modal>
        </AppLayout>
    );
}
