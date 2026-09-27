import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    MessageSquare,
    CheckCircle2,
    CornerDownRight,
    Send,
    CheckCheck,
    Clock,
    User,
    RotateCcw,
    Trash2
} from 'lucide-react';

export default function FeedbackThread({ feedbacks = [], isParticipant = true, projectId, onDelete }) {
    const [replyingToId, setReplyingToId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const handleSendReply = (feedbackId) => {
        if (!replyText.trim()) return;

        setIsSubmittingReply(true);

        const url = isParticipant
            ? `/participant/feedback/${feedbackId}/reply`
            : `/verifier/projects/${projectId}/feedback`;

        const payload = isParticipant
            ? { body: replyText }
            : { body: replyText, status: 'sent', parent_id: feedbackId };

        router.post(url, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setReplyText('');
                setReplyingToId(null);
            },
            onFinish: () => setIsSubmittingReply(false),
        });
    };

    const handleToggleResolve = (feedbackId) => {
        if (!isParticipant) return;
        router.post(`/participant/feedback/${feedbackId}/resolve`, {}, {
            preserveScroll: true,
        });
    };

    const handleMarkRead = (feedbackId) => {
        router.post(`/participant/feedback/${feedbackId}/read`, {}, {
            preserveScroll: true,
        });
    };

    if (feedbacks.length === 0) {
        return (
            <div className="py-12 text-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Belum Ada Catatan Feedback</p>
                <p className="mt-1">
                    Catatan atau klarifikasi dari tim verifikator lapangan akan ditampilkan di sini.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {feedbacks.map((fb) => (
                <div
                    key={fb.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        fb.is_resolved
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : !fb.read_at && isParticipant
                            ? 'border-rose-300 bg-rose-50/20 shadow-xs'
                            : 'border-slate-200 bg-white shadow-xs'
                    }`}
                >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {fb.author?.employee?.full_name || fb.author?.name || 'Verifikator'}
                            </span>

                            {fb.charter_section && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    Bagian: {fb.charter_section}
                                </span>
                            )}

                            {fb.is_resolved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Sudah Ditindaklanjuti
                                </span>
                            ) : (
                                !fb.read_at && isParticipant && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                        Baru / Belum Dibaca
                                    </span>
                                )
                            )}
                            {fb.status === 'draft' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    Draf (Belum Terkirim)
                                </span>
                            )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(fb.created_at).toLocaleString('id-ID')}
                        </span>
                    </div>

                    {/* Feedback Body */}
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-2.5">
                        {fb.body}
                    </p>

                    {/* Action Bar (Resolve / Reply buttons) */}
                    <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 mt-3">
                        <div className="flex items-center gap-2">
                            {isParticipant && (
                                <button
                                    type="button"
                                    onClick={() => handleToggleResolve(fb.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                                        fb.is_resolved
                                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{fb.is_resolved ? 'Batal Selesai' : 'Tandai Sudah Ditindaklanjuti'}</span>
                                </button>
                            )}

                            {!fb.read_at && isParticipant && (
                                <button
                                    type="button"
                                    onClick={() => handleMarkRead(fb.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                                >
                                    <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Tandai Dibaca</span>
                                </button>
                            )}

                            {!isParticipant && onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(fb.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                                    title="Hapus catatan ini"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Hapus</span>
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setReplyingToId(replyingToId === fb.id ? null : fb.id);
                                setReplyText('');
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{replyingToId === fb.id ? 'Tutup Balasan' : 'Balas Catatan'}</span>
                        </button>
                    </div>

                    {/* Thread Replies List */}
                    {fb.replies && fb.replies.length > 0 && (
                        <div className="mt-3.5 pl-4 border-l-2 border-purple-200 space-y-2.5">
                            {fb.replies.map(reply => (
                                <div key={reply.id} className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-800 flex items-center gap-1">
                                            <CornerDownRight className="w-3 h-3 text-purple-500" />
                                            {reply.author?.employee?.full_name || reply.author?.name || 'Anggota Tim'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            {new Date(reply.created_at).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <p className="text-slate-700 whitespace-pre-line pl-4">
                                        {reply.body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Inline Reply Form */}
                    {replyingToId === fb.id && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2">
                            <textarea
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Tuliskan respon atau klarifikasi tindak lanjut..."
                                className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                            <button
                                type="button"
                                onClick={() => handleSendReply(fb.id)}
                                disabled={isSubmittingReply || !replyText.trim()}
                                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5 self-end"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>{isSubmittingReply ? '...' : 'Kirim'}</span>
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
