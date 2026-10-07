import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, XCircle, ShieldCheck, Award, ArrowLeft, Building2, Calendar, FileText } from 'lucide-react';

export default function VerifyCertificate({ isValid, certificate }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 antialiased">
            <Head title="Verifikasi E-Sertifikat - Bulan Mutu GGF" />

            {/* Header */}
            <div className="max-w-xl mx-auto w-full pt-6 sm:pt-10 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 text-white group">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-white shadow-md shadow-emerald-500/30">
                        B
                    </div>
                    <div>
                        <div className="font-extrabold text-sm tracking-tight">Bulan Mutu GGF</div>
                        <p className="text-[10px] text-emerald-300 -mt-0.5">Great Giant Foods</p>
                    </div>
                </Link>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-emerald-300 backdrop-blur-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sistem Validasi Resmi</span>
                </div>
            </div>

            {/* Main Verification Card */}
            <div className="max-w-xl mx-auto w-full my-auto py-8">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                    {isValid && certificate ? (
                        <div className="space-y-6 relative z-10">
                            {/* Success Badge */}
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle2 className="w-9 h-9" />
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                    Sertifikat Resmi Terverifikasi
                                </h1>
                                <p className="text-xs text-emerald-200">
                                    E-Sertifikat ini sah dan tercatat pada pangkalan data Bulan Mutu Great Giant Foods.
                                </p>
                            </div>

                            {/* Certificate Details Sheet */}
                            <div className="bg-slate-950/60 rounded-2xl border border-white/10 p-5 space-y-4 text-xs">
                                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                    <span className="text-slate-400">Nomor Sertifikat</span>
                                    <span className="font-mono font-bold text-emerald-300 text-sm">{certificate.certificate_number}</span>
                                </div>

                                {/* Category Badge */}
                                {certificate.category && (
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Kategori Sertifikat</span>
                                            <div className="text-sm font-extrabold text-white mt-0.5 flex items-center gap-1.5">
                                                <span>{certificate.category.label}</span>
                                                {certificate.award_title && (
                                                    <span className="text-amber-300 font-black">· {certificate.award_title}</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{certificate.category.description}</p>
                                        </div>
                                        <div className="shrink-0">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${
                                                certificate.category.code === 'winner'
                                                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                                                    : certificate.category.code === 'finalist'
                                                    ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                                                    : 'bg-slate-400/20 text-slate-300 border-slate-400/40'
                                            }`}>
                                                {certificate.category.name}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <span className="text-slate-400 block mb-1">Penerima Sertifikat</span>
                                    <div className="font-extrabold text-base text-white">{certificate.recipient_name}</div>
                                    <div className="text-emerald-400 mt-0.5">
                                        NIK: {certificate.employee_index} · {certificate.unit} · Peran: <span className="font-semibold text-white">{certificate.role_in_team}</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-white/10">
                                    <span className="text-slate-400 block mb-1">Inisiatif Project Inovasi</span>
                                    <div className="font-bold text-white text-sm italic leading-snug">
                                        "{certificate.project_title}"
                                    </div>
                                    <div className="text-slate-300 mt-1 flex flex-wrap gap-2">
                                        <span>Kode: <strong className="font-mono text-emerald-300">{certificate.registration_code}</strong></span>
                                        <span>·</span>
                                        <span>Stream: <strong className="text-emerald-300">{certificate.stream_name}</strong></span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                                    <span>Event: {certificate.event_name}</span>
                                    <span>Tanggal: {certificate.issued_at}</span>
                                </div>
                            </div>

                            {/* Footer Note */}
                            <div className="text-center pt-2">
                                <p className="text-[11px] text-slate-400">
                                    Diterbitkan secara elektronik oleh Komite Mutu & Continuous Improvement Great Giant Foods.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 relative z-10 py-6">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                                <XCircle className="w-9 h-9" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                Sertifikat Tidak Valid / Tidak Ditemukan
                            </h1>
                            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                                Kode verifikasi sertifikat yang Anda masukkan tidak cocok atau tidak terdaftar pada pangkalan data resmi Bulan Mutu GGF.
                            </p>
                        </div>
                    )}
                </div>

                <div className="text-center mt-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Halaman Utama BMG</span>
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center pb-4 text-xs text-slate-500">
                &copy; {new Date().getFullYear()} Bulan Mutu Great Giant Foods. All rights reserved.
            </div>
        </div>
    );
}
