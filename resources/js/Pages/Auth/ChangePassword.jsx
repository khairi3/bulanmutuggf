import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { ShieldAlert, Lock, CheckCircle, LogOut } from 'lucide-react';
import Input from '@/Components/Input';
import Button from '@/Components/Button';

export default function ChangePassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/change-password', {
            onSuccess: () => reset(),
        });
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
            <Head title="Wajib Ganti Password - Bulan Mutu GGF" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mb-4">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
                    Ganti Password Wajib
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 max-w-sm mx-auto">
                    Demi keamanan akun dan data lomba Bulan Mutu GGF, Anda wajib mengganti password awal sebelum melanjutkan.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-slate-200">
                    <form className="space-y-4" onSubmit={submit}>
                        <div>
                            <Input
                                id="current_password"
                                label="Password Saat Ini"
                                type="password"
                                icon={Lock}
                                placeholder="Masukkan password default Anda"
                                value={data.current_password}
                                error={errors.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <Input
                                id="password"
                                label="Password Baru"
                                type="password"
                                icon={Lock}
                                placeholder="Minimal 8 karakter"
                                value={data.password}
                                error={errors.password}
                                onChange={(e) => setData('password', e.target.value)}
                                helperText="Gunakan kombinasi huruf, angka, atau simbol"
                                required
                            />
                        </div>

                        <div>
                            <Input
                                id="password_confirmation"
                                label="Konfirmasi Password Baru"
                                type="password"
                                icon={CheckCircle}
                                placeholder="Ulangi password baru Anda"
                                value={data.password_confirmation}
                                error={errors.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                loading={processing}
                                className="w-full py-3 font-semibold"
                            >
                                Simpan Password Baru & Lanjutkan
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-rose-600"
                        >
                            <LogOut className="w-3.5 h-3.5 mr-1" />
                            <span>Batal dan Keluar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
