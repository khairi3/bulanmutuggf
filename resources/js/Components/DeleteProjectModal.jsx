import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Button from '@/Components/Button';
import { AlertTriangle, Trash2, Building2, Users, Sparkles } from 'lucide-react';

export default function DeleteProjectModal({
    isOpen,
    onClose,
    project,
    deleteUrl,
    title = 'Konfirmasi Hapus Project',
    description = 'Project yang sudah disubmit ini akan dihapus dari antrean verifikasi.',
    noticeText,
    presets = [],
    requiredReason = true,
    defaultReason = '',
    confirmButtonText = 'Hapus Project',
    onDeleted,
}) {
    const [reason, setReason] = useState(defaultReason);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setReason(defaultReason || '');
            setError('');
            setIsSubmitting(false);
        }
    }, [isOpen, defaultReason]);

    if (!project) return null;

    const targetUrl = deleteUrl || `/verifier/projects/${project.id}`;

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = reason.trim();

        if (requiredReason) {
            if (!trimmed) {
                setError('Alasan penghapusan project wajib diisi.');
                return;
            }

            if (trimmed.length < 5) {
                setError('Alasan penghapusan minimal 5 karakter.');
                return;
            }
        }

        if (trimmed.length > 1000) {
            setError('Alasan penghapusan maksimal 1.000 karakter.');
            return;
        }

        setError('');
        setIsSubmitting(true);

        router.delete(targetUrl, {
            data: { reason: trimmed },
            preserveScroll: true,
            onFinish: () => {
                setIsSubmitting(false);
            },
            onSuccess: () => {
                if (onClose) onClose();
                if (onDeleted) onDeleted();
            },
            onError: (errs) => {
                setError(errs.reason || 'Gagal menghapus project. Silakan periksa kembali.');
            },
        });
    };

    const isButtonDisabled = isSubmitting || (requiredReason && reason.trim().length < 5);

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (!isSubmitting) onClose();
            }}
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header Icon + Title */}
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            {title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Project Brief Info Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                            {project.registration_code || `#${project.id}`}
                        </span>
                        {project.stream_name && (
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                {project.stream_name}
                            </span>
                        )}
                    </div>
                    <div className="font-bold text-slate-800 text-sm line-clamp-2">
                        {project.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-slate-500 text-[11px] pt-0.5">
                        {project.leader_name && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                {project.leader_name}
                            </span>
                        )}
                        {project.unit && (
                            <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {project.unit}
                            </span>
                        )}
                    </div>
                </div>

                {/* Notice Alert */}
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <p className="font-semibold">Perhatian:</p>
                    <p className="mt-0.5 text-amber-700">
                        {noticeText || 'Penghapusan ini akan dicatat di log audit sistem dan notifikasi beserta alasan akan otomatis dikirimkan kepada tim peserta.'}
                    </p>
                </div>

                {/* Reason Textarea */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                            Alasan Penghapusan {requiredReason ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(opsional)</span>}
                        </label>
                        {presets.length > 0 && (
                            <span className="text-[10px] text-slate-400">Pilih opsi cepat di bawah atau tulis manual</span>
                        )}
                    </div>

                    {/* Quick Presets */}
                    {presets.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {presets.map((preset, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setReason(preset);
                                        if (error) setError('');
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                                        reason === preset
                                            ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    )}

                    <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError('');
                        }}
                        disabled={isSubmitting}
                        placeholder="Contoh: Terjadi double submit / duplikasi pendaftaran project, pendaftaran dibatalkan..."
                        className={`w-full text-xs rounded-xl border p-3 focus:outline-none transition-colors ${
                            error
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                                : 'border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        }`}
                    />
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="text-rose-500 font-medium">
                            {error || (requiredReason && reason.trim().length > 0 && reason.trim().length < 5 ? 'Minimal 5 karakter' : '')}
                        </span>
                        <span className={`font-mono ${reason.length > 1000 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                            {reason.length}/1000
                        </span>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={onClose}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        variant="danger"
                        size="sm"
                        loading={isSubmitting}
                        disabled={isButtonDisabled}
                        className="gap-1.5"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{confirmButtonText}</span>
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
