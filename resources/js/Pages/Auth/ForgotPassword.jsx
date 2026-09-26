import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { User, ArrowLeft, Send, HelpCircle, MailQuestion } from 'lucide-react';
import Input from '@/Components/Input';
import Button from '@/Components/Button';
import Toast from '@/Components/Toast';

export default function ForgotPassword({ flash }) {
    const { data, setData, post, processing, errors } = useForm({
        employee_index: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
            <Head title="Lupa Password - Bulan Mutu GGF" />
            <Toast flash={flash} />

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4">
                    <MailQuestion className="w-6 h-6" />
                </div>
                <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
                    Bantuan Lupa Password
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 max-w-sm mx-auto">
                    Masukkan Index Karyawan Anda untuk menerima panduan reset password atau petunjuk verifikasi.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-slate-200">
                    <form className="space-y-4" onSubmit={submit}>
                        <div>
                            <Input
                                id="employee_index"
                                label="Index Karyawan (NIK / ID)"
                                type="text"
                                icon={User}
                                placeholder="Contoh: EMP1001 atau EMP1015"
                                value={data.employee_index}
                                error={errors.employee_index}
                                onChange={(e) => setData('employee_index', e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={processing}
                                className="w-full py-3 font-semibold"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                <span>Kirim Permintaan Reset</span>
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                        <div className="rounded-lg bg-blue-50 border border-blue-200/60 p-3.5 text-xs text-blue-900 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-blue-800">
                                <HelpCircle className="w-4 h-4 shrink-0" />
                                <span>Bagi Karyawan Tanpa Email (AUTH-03)</span>
                            </div>
                            <p className="text-blue-800/90 leading-relaxed">
                                Karyawan di perkebunan/pabrik tanpa email resmi dapat meminta reset password langsung ke Panitia/Admin L&D via PIC Unit masing-masing.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            <span>Kembali ke Halaman Login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
