import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    User,
    Lock,
    ArrowRight,
    HelpCircle,
    UserPlus,
    Phone,
    Mail,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    Building2,
    Briefcase,
} from 'lucide-react';
import Input from '@/Components/Input';
import Button from '@/Components/Button';
import Modal from '@/Components/Modal';
import EmployeeAutocomplete from '@/Components/EmployeeAutocomplete';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        employee_index: '',
        password: '',
        remember: false,
    });

    // Check if ?register=1 is in URL
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('register') === '1') {
            setIsRegisterModalOpen(true);
        }
    }, []);

    // Registration Form State
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [checkLoading, setCheckLoading] = useState(false);
    const [activationStatus, setActivationStatus] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const registerForm = useForm({
        employee_index: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    const handleSelectEmployee = async (emp) => {
        setSelectedEmployee(emp);
        setCheckLoading(true);
        setActivationStatus(null);
        registerForm.setData({
            employee_index: emp.employee_index,
            email: emp.email || '',
            phone: emp.phone || '',
            password: '',
            password_confirmation: '',
        });

        try {
            const res = await fetch('/register-account/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ employee_index: emp.employee_index }),
            });
            const resData = await res.json();
            setActivationStatus(resData);
            if (resData.can_activate && resData.employee) {
                registerForm.setData((prev) => ({
                    ...prev,
                    employee_index: resData.employee.employee_index,
                    email: resData.employee.email || prev.email || '',
                    phone: resData.employee.phone || prev.phone || '',
                }));
            }
        } catch (err) {
            setActivationStatus({
                can_activate: false,
                message: 'Gagal memeriksa status karyawan. Silakan periksa koneksi Anda.',
            });
        } finally {
            setCheckLoading(false);
        }
    };

    const handleClearSelected = () => {
        setSelectedEmployee(null);
        setActivationStatus(null);
        registerForm.reset();
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        registerForm.post('/register-account', {
            onSuccess: () => {
                setIsRegisterModalOpen(false);
                handleClearSelected();
            },
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

                        {/* Separator */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-slate-400 font-semibold">atau</span>
                            </div>
                        </div>

                        {/* Buat / Aktivasi Akun Button */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setIsRegisterModalOpen(true)}
                                className="w-full py-2.5 px-4 rounded-xl border-2 border-emerald-600/30 hover:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 group"
                            >
                                <UserPlus className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                                <span>Karyawan Baru? Buat / Aktivasi Akun</span>
                            </button>
                        </div>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    &copy; 2026 Great Giant Foods Learning Center. Seluruh hak cipta dilindungi.
                </p>
            </div>

            {/* MODAL BUAT / AKTIVASI AKUN KARYAWAN */}
            <Modal
                isOpen={isRegisterModalOpen}
                onClose={() => {
                    setIsRegisterModalOpen(false);
                    handleClearSelected();
                }}
                title="Buat & Aktivasi Akun Karyawan"
                description="Khusus karyawan terdaftar di Master Data GGF yang baru pertama kali membuat password akun."
                maxWidth="lg"
            >
                <div className="space-y-4 pt-1">
                    {/* Step 1: Cari & Pilih NIK Karyawan */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Cari Index / NIK Karyawan Anda <span className="text-rose-500">*</span>
                        </label>
                        {!selectedEmployee ? (
                            <EmployeeAutocomplete
                                selectedEmployee={null}
                                onSelect={handleSelectEmployee}
                                placeholder="Ketik NIK (misal: EMP1018) atau nama Anda..."
                                label=""
                            />
                        ) : (
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                                            {selectedEmployee.employee_index}
                                        </span>
                                        <span className="font-bold text-sm text-slate-900">
                                            {selectedEmployee.full_name}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                            {selectedEmployee.position || '-'} ({selectedEmployee.employee_level || 'Staff'})
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                            {selectedEmployee.unit || '-'} - {selectedEmployee.division || '-'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearSelected}
                                    className="text-xs text-slate-500 hover:text-rose-600 font-semibold underline shrink-0"
                                >
                                    Ganti NIK
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Loading State */}
                    {checkLoading && (
                        <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            <span>Memeriksa status akun karyawan...</span>
                        </div>
                    )}

                    {/* Jika Akun Sudah Aktif */}
                    {!checkLoading && activationStatus && !activationStatus.can_activate && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-3">
                            <div className="flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-amber-950 mb-0.5">Akun Sudah Aktif</p>
                                    <p className="text-amber-800 leading-relaxed">{activationStatus.message}</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1 border-t border-amber-200/60">
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        setData('employee_index', selectedEmployee.employee_index);
                                        setIsRegisterModalOpen(false);
                                        handleClearSelected();
                                    }}
                                >
                                    Masuk ke Halaman Login
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Jika Akun BISA Diaktifkan / Dibuat */}
                    {!checkLoading && activationStatus && activationStatus.can_activate && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-2 border-t border-slate-200/80">
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Data NIK valid. Lengkapi kontak dan buat password baru Anda di bawah ini:</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Email Karyawan (Opsional / Resmi)
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email"
                                            value={registerForm.data.email}
                                            onChange={(e) => registerForm.setData('email', e.target.value)}
                                            placeholder="nama@ggf.co.id"
                                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                        />
                                    </div>
                                    {registerForm.errors.email && (
                                        <p className="text-[11px] text-rose-600 mt-1">{registerForm.errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        No. WhatsApp / HP Aktif
                                    </label>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="tel"
                                            value={registerForm.data.phone}
                                            onChange={(e) => registerForm.setData('phone', e.target.value)}
                                            placeholder="081234567890"
                                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                        />
                                    </div>
                                    {registerForm.errors.phone && (
                                        <p className="text-[11px] text-rose-600 mt-1">{registerForm.errors.phone}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Password Baru <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={registerForm.data.password}
                                            onChange={(e) => registerForm.setData('password', e.target.value)}
                                            placeholder="Min. 8 karakter"
                                            required
                                            className="w-full pl-9 pr-9 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {registerForm.errors.password && (
                                        <p className="text-[11px] text-rose-600 mt-1">{registerForm.errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Konfirmasi Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={registerForm.data.password_confirmation}
                                            onChange={(e) => registerForm.setData('password_confirmation', e.target.value)}
                                            placeholder="Ulangi password baru"
                                            required
                                            className="w-full pl-9 pr-9 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {registerForm.errors.password_confirmation && (
                                        <p className="text-[11px] text-rose-600 mt-1">{registerForm.errors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>

                            {/* Password match indicator */}
                            {registerForm.data.password && registerForm.data.password_confirmation && (
                                <p className={`text-[11px] font-medium ${
                                    registerForm.data.password === registerForm.data.password_confirmation
                                        ? 'text-emerald-600'
                                        : 'text-rose-600'
                                }`}>
                                    {registerForm.data.password === registerForm.data.password_confirmation
                                        ? '✓ Password dan konfirmasi cocok.'
                                        : '✕ Konfirmasi password belum cocok.'}
                                </p>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setIsRegisterModalOpen(false);
                                        handleClearSelected();
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    loading={registerForm.processing}
                                    disabled={
                                        registerForm.processing ||
                                        !registerForm.data.password ||
                                        registerForm.data.password.length < 8 ||
                                        registerForm.data.password !== registerForm.data.password_confirmation
                                    }
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    <span>Simpan & Aktifkan Akun</span>
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </Modal>
        </div>
    );
}

