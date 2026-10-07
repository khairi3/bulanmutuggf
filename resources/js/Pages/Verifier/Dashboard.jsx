import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
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
    ClipboardCheck,
    CheckCircle2,
    LayoutGrid,
    List,
    Sparkles,
    ChevronRight,
    TrendingUp
} from 'lucide-react';

export default function VerifierDashboard({ stats = { total: 0, unverified: 0, verified: 0 }, projects, streams = [], filters = {} }) {
    const { auth } = usePage().props;
    const employee = auth?.user?.employee;

    const [search, setSearch] = useState(filters?.search || '');
    const [selectedStream, setSelectedStream] = useState(filters?.stream_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

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

    const completionRate = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

    const renderVerificationBadge = (p) => {
        if (p.my_score_status === 'submitted') {
            const scoreVal = parseFloat(p.my_score || 0);
            const isScale5 = scoreVal <= 5.0;
            const isPass = isScale5 ? scoreVal >= 4.0 : scoreVal >= 85;
            const isFollowUp = isScale5 ? (scoreVal >= 2.0 && scoreVal < 4.0) : (scoreVal >= 50 && scoreVal < 85);

            if (isPass) {
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Pass</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono pl-1">
                            Skor: {scoreVal.toFixed(2)} {isScale5 ? '/ 5.0' : ''}
                        </span>
                    </div>
                );
            } else if (isFollowUp) {
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 w-fit">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Need Follow Up</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono pl-1">
                            Skor: {scoreVal.toFixed(2)} {isScale5 ? '/ 5.0' : ''}
                        </span>
                    </div>
                );
            } else {
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 w-fit">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Not Pass</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono pl-1">
                            Skor: {scoreVal.toFixed(2)} {isScale5 ? '/ 5.0' : ''}
                        </span>
                    </div>
                );
            }
        } else if (p.my_score_status === 'draft') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>Draf Penilaian</span>
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    Belum Dinilai
                </span>
            );
        }
    };

    const heroContent = (
        <div className="space-y-6">
            {/* Header Identity Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold backdrop-blur-md mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Fase Verifikasi Lapangan & Validasi Berkas</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                        Halo, {employee?.full_name || 'Bapak/Ibu Verifikator'}!
                    </h1>
                    <p className="text-sm text-slate-200 mt-1 max-w-xl">
                        Verifikator: <span className="font-semibold text-emerald-300">{employee?.unit || 'Corporate'}</span> · {employee?.position || 'Expert Evaluator'}
                    </p>
                </div>

                {/* Completion Gauge Widget */}
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:min-w-[240px]">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-200 mb-1">
                        <span>Penyelesaian Verifikasi</span>
                        <span className="text-white font-black text-sm">{completionRate}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                    <div className="text-[11px] text-slate-300 mt-2 flex justify-between">
                        <span>{stats.verified} selesai</span>
                        <span>{stats.total} total penugasan</span>
                    </div>
                </div>
            </div>

            {/* 3 Frosted KPI Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Project Di-assign</p>
                        <p className="text-2xl font-black mt-1 text-white">{stats.total}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Sesuai penugasan stream</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Perlu Diverifikasi</p>
                        <p className="text-2xl font-black mt-1 text-amber-300">{stats.unverified}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Menunggu visit / review nilai</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-teal-200 uppercase tracking-wider">Sudah Terverifikasi</p>
                        <p className="text-2xl font-black mt-1 text-teal-300">{stats.verified}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Nilai disubmit final</p>
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
            <Head title="Dashboard Verifikator - Bulan Mutu GGF" />

            <div className="space-y-6">
                {/* Search, Filter & View Toggle Bar */}
                <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-lg">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari kode registrasi atau judul project..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 focus:bg-white transition"
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
                            className="text-xs rounded-xl border border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-700 font-medium"
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
                            className="text-xs rounded-xl border border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-700 font-medium"
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
                                className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2 py-1"
                            >
                                Reset Filter
                            </button>
                        )}

                        {/* View Switcher: Card vs Table */}
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                                title="Tampilan Kartu"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Kartu</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                    viewMode === 'table'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                                title="Tampilan Tabel"
                            >
                                <List className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Tabel</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content: Card Grid View or Table View */}
                {projects.data.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <FileCheck className="w-7 h-7" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-base">Tidak Ada Project yang Sesuai</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                            Belum ada project yang diajukan pada stream penugasan Anda atau kriteria filter saat ini tidak menghasilkan data.
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {projects.data.map((p) => (
                            <div
                                key={p.id}
                                className="bg-white rounded-3xl border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between group"
                            >
                                <div>
                                    {/* Top Row: Code, Stream & Project Status */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                                {p.registration_code}
                                            </span>
                                            <Badge status={p.status} />
                                        </div>
                                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80">
                                            {p.stream_name}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <Link
                                        href={`/verifier/projects/${p.id}`}
                                        className="font-black text-base sm:text-lg text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug"
                                    >
                                        {p.title}
                                    </Link>

                                    {/* Team & Unit Details */}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 mt-2.5">
                                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            {p.leader_name}
                                        </span>
                                        <span>·</span>
                                        <span className="flex items-center gap-1 text-slate-500">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                            {p.unit || 'Unit GGF'}
                                        </span>
                                    </div>

                                    {/* Categories Tags */}
                                    {p.categories?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {p.categories.map((c, i) => (
                                                <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer: Verification Score & Action CTA */}
                                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                        <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Hasil Verifikasi:</span>
                                        {renderVerificationBadge(p)}
                                    </div>

                                    <Link
                                        href={`/verifier/projects/${p.id}`}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-emerald-700 transition shadow-xs"
                                    >
                                        <span>{p.my_score_status === 'submitted' ? 'Review Penilaian' : 'Mulai Verifikasi'}</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
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
                                        <th className="py-3.5 px-4">Status Verifikasi</th>
                                        <th className="py-3.5 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {projects.data.map((p) => (
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
                                                {renderVerificationBadge(p)}
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {projects.links && projects.links.length > 3 && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
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
                                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
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
            </div>
        </AppLayout>
    );
}
