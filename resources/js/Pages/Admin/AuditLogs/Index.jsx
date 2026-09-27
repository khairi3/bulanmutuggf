import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Shield,
    Search,
    Filter,
    User,
    Clock,
    FileText,
    ChevronDown,
    ChevronUp,
    Code,
    RefreshCw
} from 'lucide-react';

export default function AuditLogsIndex({ logs, actionTypes = [], filters = {} }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedAction, setSelectedAction] = useState(filters.action || '');
    const [expandedLogId, setExpandedLogId] = useState(null);

    const handleFilter = (e) => {
        e?.preventDefault();
        router.get('/admin/audit-logs', {
            search: searchTerm,
            action: selectedAction,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedAction('');
        router.get('/admin/audit-logs');
    };

    const toggleExpand = (id) => {
        setExpandedLogId(prev => prev === id ? null : id);
    };

    return (
        <AppLayout>
            <Head title="Audit Log Aktivitas Sistem" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Shield className="w-7 h-7 text-emerald-600" />
                            Audit Trail & Log Aktivitas (ADM-07)
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Pencatatan transparan seluruh mutasi krusial: buka kunci project, override seleksi, finalisasi, dan publikasi pemenang.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-xs self-start sm:self-auto"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reset Filter
                    </button>
                </div>

                {/* Filter Form */}
                <form onSubmit={handleFilter} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                            type="text"
                            placeholder="Cari aksi, jenis entitas, atau alasan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        />
                    </div>

                    <div className="w-full sm:w-64">
                        <select
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value)}
                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        >
                            <option value="">Semua Jenis Aksi</option>
                            {actionTypes.map(act => (
                                <option key={act} value={act}>{act}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition"
                    >
                        Filter
                    </button>
                </form>

                {/* Audit Logs Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4 w-44">Waktu</th>
                                    <th className="py-3.5 px-4">Pengguna (Actor)</th>
                                    <th className="py-3.5 px-4">Aksi Sistem</th>
                                    <th className="py-3.5 px-4">Entitas Target</th>
                                    <th className="py-3.5 px-4">Alasan (Justifikasi)</th>
                                    <th className="py-3.5 px-4 text-center w-20">Perubahan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                                            Tidak ada riwayat aktivitas yang sesuai dengan filter pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map(log => {
                                        const isExpanded = expandedLogId === log.id;
                                        const hasPayload = log.before || log.after;

                                        return (
                                            <React.Fragment key={log.id}>
                                                <tr className={`hover:bg-slate-50/70 transition ${isExpanded ? 'bg-slate-50/90' : ''}`}>
                                                    {/* Timestamp */}
                                                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{new Date(log.created_at).toLocaleString('id-ID')}</span>
                                                        </div>
                                                    </td>

                                                    {/* Actor User */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                                                                {log.user?.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-xs text-slate-900 leading-tight">
                                                                    {log.user?.employee?.full_name || log.user?.name || 'Sistem'}
                                                                </p>
                                                                <p className="text-[11px] text-slate-400">
                                                                    {log.user?.employee?.employee_index || log.user?.email || '-'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Action Badge */}
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-mono text-[11px] font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                                                            {log.action}
                                                        </span>
                                                    </td>

                                                    {/* Target Entity */}
                                                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                                                        <span className="font-bold text-slate-800">{log.entity_type}</span>
                                                        {log.entity_id && (
                                                            <span className="text-slate-400 font-mono ml-1">#{log.entity_id}</span>
                                                        )}
                                                    </td>

                                                    {/* Reason */}
                                                    <td className="py-3.5 px-4 text-xs text-slate-700 max-w-xs truncate" title={log.reason}>
                                                        {log.reason || '-'}
                                                    </td>

                                                    {/* JSON Diff toggle */}
                                                    <td className="py-3.5 px-4 text-center">
                                                        {hasPayload ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpand(log.id)}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
                                                                title="Lihat Detail Nilai Sebelum / Sesudah"
                                                            >
                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {/* Expandable JSON Diff Row */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/90 border-b border-slate-200">
                                                        <td colSpan={6} className="p-4">
                                                            <div className="bg-slate-900 rounded-2xl p-4 text-white text-xs font-mono overflow-x-auto space-y-3">
                                                                <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-2">
                                                                    <Code className="w-4 h-4 text-emerald-400" />
                                                                    <span>Detail Payload Mutasi Data (Audit Log #{log.id})</span>
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                                                    <div>
                                                                        <span className="text-rose-400 font-bold block mb-1">Before:</span>
                                                                        <pre className="text-slate-300 text-[11px] bg-slate-950/60 p-2.5 rounded-xl overflow-x-auto">
                                                                            {log.before ? JSON.stringify(log.before, null, 2) : 'null'}
                                                                        </pre>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-emerald-400 font-bold block mb-1">After:</span>
                                                                        <pre className="text-slate-300 text-[11px] bg-slate-950/60 p-2.5 rounded-xl overflow-x-auto">
                                                                            {log.after ? JSON.stringify(log.after, null, 2) : 'null'}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {logs.links && logs.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Menampilkan {logs.from || 0} - {logs.to || 0} dari {logs.total} log aktivitas
                            </span>

                            <div className="flex items-center gap-1">
                                {logs.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                            link.active
                                                ? 'bg-emerald-600 text-white'
                                                : link.url
                                                ? 'text-slate-600 hover:bg-slate-100'
                                                : 'text-slate-300 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
