import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { User, Lock, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import Input from '@/Components/Input';
import Button from '@/Components/Button';
import Toast from '@/Components/Toast';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        employee_index: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 relative overflow-hidden select-none">
            <Head title="Masuk Portal Bulan Mutu GGF" />

            {/* Ambient Background Glows */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 -right-4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-500/20">
                        B
                    </div>
                </div>
                <h2 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Bulan Mutu GGF 2026
                </h2>
                <p className="mt-2 text-center text-xs sm:text-sm text-emerald-300/80 font-medium">
                    Portal Inovasi, Continuous Improvement & Bulan K3
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-white/20">
                    <form className="space-y-5" onSubmit={submit}>
                        <div>
                            <Input
                                id="employee_index"
                                label="Index Karyawan (NIK / ID)"
                                type="text"
                                icon={User}
                                placeholder="Contoh: ADMIN001 atau EMP1001"
                                value={data.employee_index}
                                error={errors.employee_index}
                                onChange={(e) => setData('employee_index', e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                    Password <span className="text-rose-500">*</span>
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                >
                                    Lupa password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                icon={Lock}
                                placeholder="Masukkan password Anda"
                                value={data.password}
                                error={errors.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                />
                                <span className="text-xs font-medium text-slate-600">Ingat saya di perangkat ini</span>
                            </label>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={processing}
                                className="w-full text-base font-semibold py-3"
                            >
                                <span>Masuk ke Portal</span>
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </form>

                    {/* Quick Demo Info Box for Evaluation */}
                    <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-2">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Informasi Akun Demo (Seeder Phase 1):</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 font-mono text-[11px] space-y-1">
                            <div><strong className="text-slate-800">Admin:</strong> ADMIN001 / Admin123!</div>
                            <div><strong className="text-slate-800">Multi-Role (Peserta+Verifikator):</strong> EMP1001 / password123</div>
                            <div><strong className="text-slate-800">Peserta (Umum):</strong> EMP1007 / password123</div>
                            <div><strong className="text-slate-800">Tanpa Email (Test Reset):</strong> EMP1015 / password123</div>
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    &copy; 2026 Great Giant Foods Learning Center. Seluruh hak cipta dilindungi.
                </p>
            </div>
        </div>
    );
}
