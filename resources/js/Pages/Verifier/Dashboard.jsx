import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import Input from '@/Components/Input';
import { 
    CheckSquare, 
    AlertCircle, 
    FileCheck, 
    MapPin, 
    Search, 
    Filter, 
    ArrowUpDown, 
    ExternalLink, 
    Clock, 
    Award,
    Building2,
    Users,
    ClipboardCheck
} from 'lucide-react';

export default function VerifierDashboard({ stats, projects, streams, filters }) {
    const { auth } = usePage().props;
    const employee = auth?.user?.employee;

    const [search, setSearch] = useState(filters?.search || '');
    const [selectedStream, setSelectedStream] = useState(filters?.stream_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');

    const handleFilterChange = (key, value) => {
        const query = {
            ...filters,
            [key]: value || undefined,
            page: 1, // reset page
        };
        router.get('/verifier/dashboard', query, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilterChange('search', search);
    };

    const handleSort = (field) => {
        const isCurrent = filters?.sort === field;
        const newDirection = isCurrent && filters?.direction === 'asc' ? 'desc' : 'asc';
        router.get('/verifier/dashboard', {
            ...filters,
            sort: field,
            direction: newDirection,
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                            <ClipboardCheck className="w-7 h-7 text-emerald-600" />
                            <span>Dashboard Verifikator Lapangan</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Verifikator: <span className="font-semibold text-slate-700">{employee?.full_name}</span> · {employee?.position || 'Expert'} ({employee?.unit || 'Unit Korporat'})
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Fase Verifikasi Aktif
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard Verifikator - Bulan Mutu GGF" />

            <div className="space-y-6">
                {/* 1. Summary Cards (VER-01) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-slate-900 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Di-assign</p>
                                <p className="text-3xl font-black text-slate-900 mt-1.5">{stats.total}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Sesuai penugasan stream & kategori</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                <CheckSquare className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Belum Dinilai</p>
                                <p className="text-3xl font-black text-amber-600 mt-1.5">{stats.unverified}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Menunggu visit & review penilaian</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-600 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Sudah Terverifikasi</p>
                                <p className="text-3xl font-black text-emerald-600 mt-1.5">{stats.verified}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Nilai verifikasi telah disubmit final</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Award className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 2. Interactive Filter & Search Bar (VER-02) */}
                <Card>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari kode registrasi atau judul..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 focus:bg-white"
                                />
                            </div>
                            <Button type="submit" variant="secondary" size="sm">
                                Cari
                            </Button>
                        </form>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Stream Filter */}
                            <select
                                value={selectedStream}
                                onChange={(e) => {
                                    setSelectedStream(e.target.value);
                                    handleFilterChange('stream_id', e.target.value);
                                }}
                                className="text-xs rounded-lg border border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-700"
                            >
                                <option value="">Semua Stream Penugasan</option>
                                {streams.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.code})
                                    </option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    handleFilterChange('status', e.target.value);
                                }}
                                className="text-xs rounded-lg border border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-700"
                            >
                                <option value="">Semua Status</option>
                                <option value="submitted">Submitted (Baru)</option>
                                <option value="in_verification">Dalam Verifikasi</option>
                                <option value="verified">Terverifikasi</option>
                                <option value="qualified">Lolos Convention</option>
                                <option value="not_qualified">Tidak Lolos</option>
                            </select>

                            {(filters?.search || filters?.stream_id || filters?.status) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setSelectedStream('');
                                        setSelectedStatus('');
                                        router.get('/verifier/dashboard');
                                    }}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1"
                                >
                                    Reset Filter
                                </button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* 3. Project Table (VER-01, VER-02) */}
                <Card className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                                    <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('registration_code')}>
                                        <div className="flex items-center gap-1.5">
                                            <span>Kode Registrasi</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('title')}>
                                        <div className="flex items-center gap-1.5">
                                            <span>Judul Project</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4">Stream & Kategori</th>
                                    <th className="py-3.5 px-4">Ketua & Unit</th>
                                    <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                                        <div className="flex items-center gap-1.5">
                                            <span>Status Project</span>
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4">Nilai Saya</th>
                                    <th className="py-3.5 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {projects.data.length > 0 ? (
                                    projects.data.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                                    {p.registration_code}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs truncate" title={p.title}>
                                                <Link 
                                                    href={`/verifier/projects/${p.id}`}
                                                    className="hover:text-emerald-700 hover:underline"
                                                >
                                                    {p.title}
                                                </Link>
                                                <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                                                    Diajukan: {p.submitted_at || '-'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-semibold text-slate-700">{p.stream_name}</span>
                                                {p.categories?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {p.categories.map((c, i) => (
                                                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                                                {c}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-slate-900">{p.leader_name}</div>
                                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Building2 className="w-3 h-3" />
                                                    <span>{p.unit || 'Unit GGF'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge status={p.status} />
                                            </td>
                                            <td className="py-3 px-4">
                                                {p.my_score_status === 'submitted' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                        <CheckSquare className="w-3 h-3" />
                                                        <span>{p.my_score}</span>
                                                    </span>
                                                ) : p.my_score_status === 'draft' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
                                                        <span>Draf: {p.my_score || '0'}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-mono text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Link
                                                    href={`/verifier/projects/${p.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                                                >
                                                    <span>{p.my_score_status === 'submitted' ? 'Review' : 'Verifikasi'}</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-500">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                                <FileCheck className="w-6 h-6" />
                                            </div>
                                            <p className="font-bold text-slate-700 text-sm">Tidak Ada Project yang Sesuai</p>
                                            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                                                Belum ada project yang diajukan pada stream penugasan Anda atau filter saat ini tidak menghasilkan data.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {projects.links && projects.links.length > 3 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                Menampilkan {projects.from || 0} - {projects.to || 0} dari {projects.total} project
                            </div>
                            <div className="flex items-center gap-1">
                                {projects.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveScroll
                                        preserveState
                                        className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : link.url
                                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                : 'text-slate-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
