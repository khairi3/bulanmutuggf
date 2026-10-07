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
    Sparkles,
} from 'lucide-react';
import Input from '@/Components/Input';
import Button from '@/Components/Button';
import Modal from '@/Components/Modal';
import EmployeeAutocomplete from '@/Components/EmployeeAutocomplete';

export default function Login({ status, backgroundImage }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        employee_index: '',
        password: '',
        remember: false,
    });

    const [showLoginPassword, setShowLoginPassword] = useState(false);

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
        <div
            className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-cover bg-center bg-no-repeat overflow-hidden select-none transition-all duration-700"
            style={{
                backgroundImage: `url(${backgroundImage || '/images/login-bg-default.jpg'})`,
            }}
        >
            <Head title="Masuk Portal Bulan Mutu GGF 2027" />

            {/* Dark & Cinematic Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/30 to-slate-950/70 backdrop-blur-[1px] pointer-events-none" />

            {/* Subtle Ambient Radial Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />

            {/* Main Glassmorphism Card */}
            <div className="w-full max-w-[430px] relative z-10">
                <div className="relative rounded-[28px] bg-slate-900/40 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6)] p-7 sm:p-9 text-white overflow-hidden">
                    {/* Top Specular Gradient Highlight Rim */}
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

                    {/* Logo & Brand Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/30 mb-3.5 ring-2 ring-white/30">
                            <div className="w-full h-full bg-slate-950/60 rounded-[14px] backdrop-blur-sm flex items-center justify-center text-emerald-300 font-black text-2xl tracking-wider">
                                B
                            </div>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
                            Bulan Mutu GGF 2027
                        </h1>
                        <p className="mt-1.5 text-xs text-emerald-200/80 font-medium tracking-wide">
                            Driving Excellence Through Innovation, Improvement & Automation
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={submit}>
                        {/* Status Flash Alert */}
                        {status && (
                            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold backdrop-blur-md">
                                {status}
                            </div>
                        )}

                        {/* Input NIK / Index */}
                        <div>
                            <label htmlFor="employee_index" className="block text-xs font-semibold text-slate-200 mb-1.5">
                                Index Karyawan
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-400 transition-colors">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    id="employee_index"
                                    type="text"
                                    placeholder="Contoh: 10026802"
                                    value={data.employee_index}
                                    onChange={(e) => setData('employee_index', e.target.value)}
                                    autoFocus
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-emerald-400/80 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 backdrop-blur-md transition-all font-mono"
                                />
                            </div>
                            {errors.employee_index && (
                                <p className="mt-1 text-xs text-rose-300 font-medium flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{errors.employee_index}</span>
                                </p>
                            )}
                        </div>

                        {/* Input Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-xs font-semibold text-slate-200">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-emerald-300 hover:text-emerald-200 hover:underline transition-colors"
                                >
                                    Lupa password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-400 transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    id="password"
                                    type={showLoginPassword ? 'text' : 'password'}
                                    placeholder="Masukkan password Anda"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-emerald-400/80 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 backdrop-blur-md transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors cursor-pointer"
                                    tabIndex={-1}
                                    title={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                                >
                                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-rose-300 font-medium flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{errors.password}</span>
                                </p>
                            )}
                        </div>

                        {/* Ingat Saya */}
                        <div className="flex items-center justify-between pt-0.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
                                />
                                <span className="text-xs text-slate-300">Ingat saya di perangkat ini</span>
                            </label>
                        </div>

                        {/* Submit Button Glowing Gradient */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Masuk ke Portal</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/15" />
                            </div>
                            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                                <span className="px-3 bg-transparent text-slate-300/80 font-bold backdrop-blur-xs">
                                    atau
                                </span>
                            </div>
                        </div>

                        {/* Buat / Aktivasi Akun Button */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setIsRegisterModalOpen(true)}
                                className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99] backdrop-blur-md cursor-pointer"
                            >
                                <UserPlus className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                                <span>Belum Punya Akun? Buat / Aktivasi Akun</span>
                            </button>
                        </div>
                    </form>

                    {/* Footer text inside card */}
                    <div className="mt-6 pt-4 border-t border-white/10 text-center space-y-1">
                        <p className="text-[11px] text-slate-300/70">
                            &copy; 2027 Great Giant Foods Learning Center.
                        </p>
                    </div>
                </div>
            </div>

            {/* MODAL BUAT / AKTIVASI AKUN KARYAWAN */}
            <Modal
                isOpen={isRegisterModalOpen}
                onClose={() => {
                    setIsRegisterModalOpen(false);
                    handleClearSelected();
                }}
                title="Buat & Aktivasi Akun Karyawan"
                description="Khusus karyawan aktif GGF yang baru pertama kali membuat password akun."
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
                                placeholder="Ketik NIK (misal: 10026802) atau nama Anda..."
                                label=""
                                showLevel={false}
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
                                            {selectedEmployee.position || '-'}
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
                                <p className={`text-[11px] font-medium ${registerForm.data.password === registerForm.data.password_confirmation
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

