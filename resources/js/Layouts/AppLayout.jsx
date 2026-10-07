import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    Award,
    CheckSquare,
    Shield,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Building2,
    Compass,
    MessageSquare,
    UserCheck,
    BarChart3,
    Clock,
    FileCheck,
} from 'lucide-react';
import clsx from 'clsx';
import Toast from '../Components/Toast';

export default function AppLayout({ title, header, hero, children }) {
    const { auth, flash, appName, branding } = usePage().props;
    const user = auth?.user;
    const employee = user?.employee;
    const activeRole = user?.active_role || 'participant';
    const roles = user?.roles || [];
    const headerBg = branding?.appHeaderBackgroundImage || '/images/login-bg-plantation.jpg';

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

    // Role display mappings
    const roleLabels = {
        admin: 'Admin / Panitia L&D',
        participant: 'Peserta Lomba',
        verifier: 'Verifikator Lapangan',
        judge: 'Juri Convention',
        viewer: 'Viewer Manajemen',
    };

    // Role switcher handler (AUTH-04)
    const handleSwitchRole = (newRole) => {
        setIsRoleMenuOpen(false);
        if (newRole !== activeRole) {
            router.post('/switch-role', { role: newRole }, {
                preserveScroll: true,
            });
        }
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    // Dynamic menu items based on role
    const getNavItems = () => {
        switch (activeRole) {
            case 'admin':
                return [
                    { name: 'Dashboard Admin', href: '/admin/dashboard', icon: LayoutDashboard },
                    { name: 'Master Karyawan', href: '/admin/employees', icon: Users },
                    { name: 'Konfigurasi Event', href: '/admin/events', icon: Settings },
                    { name: 'Evaluator & Penugasan', href: '/admin/assignments', icon: UserCheck },
                    { name: 'Seleksi Convention', href: '/admin/selection', icon: Award },
                    { name: 'Rekap & Pemenang', href: '/admin/recap', icon: Award },
                    { name: 'Monitoring Project', href: '/admin/dashboard', icon: FileText },
                    { name: 'Audit Log', href: '/admin/audit-logs', icon: Shield },
                ];
            case 'verifier':
                return [
                    { name: 'Dashboard Verifikasi', href: '/verifier/dashboard', icon: LayoutDashboard },
                    { name: 'Semua Project Di-assign', href: '/verifier/dashboard', icon: CheckSquare },
                    { name: 'Perlu Verifikasi (Baru)', href: '/verifier/dashboard?status=submitted', icon: Clock },
                    { name: 'Sedang Diverifikasi', href: '/verifier/dashboard?status=in_verification', icon: FileCheck },
                    { name: 'Sudah Terverifikasi', href: '/verifier/dashboard?status=verified', icon: Award },
                    { name: 'Seleksi Convention', href: '/verifier/selection', icon: Award },
                    { name: 'Rekap & Pemenang', href: '/verifier/recap', icon: BarChart3 },
                ];
            case 'judge':
                return [
                    { name: 'Dashboard Juri', href: '/judge/dashboard', icon: LayoutDashboard },
                    { name: 'Penilaian Convention', href: '/judge/dashboard', icon: Award },
                ];
            case 'viewer':
                return [
                    { name: 'Executive Dashboard', href: '/viewer/dashboard', icon: BarChart3 },
                    { name: 'Rekap & Leaderboard', href: '/viewer/recap', icon: Award },
                ];
            default: // participant
                return [
                    { name: 'Beranda Saya', href: '/participant/dashboard', icon: LayoutDashboard },
                    { name: 'Registrasi Project Baru', href: '/participant/projects/create', icon: FileText },
                ];
        }
    };

    const navItems = getNavItems();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
            <Toast flash={flash} />

            {/* TOP HEADER */}
            <header className={clsx(
                'sticky top-0 z-40 transition-colors duration-200',
                hero
                    ? 'bg-slate-950/80 backdrop-blur-md border-b border-white/10 text-white shadow-sm'
                    : 'bg-white/95 backdrop-blur-md border-b border-slate-200/80'
            )}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Brand */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className={clsx(
                                    'lg:hidden p-2 rounded-lg touch-target transition-colors',
                                    hero ? 'text-white/80 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
                                )}
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                            <Link href="/" className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-emerald-500/30">
                                    B
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={clsx(
                                            'font-extrabold text-base tracking-tight',
                                            hero ? 'text-white' : 'text-slate-900'
                                        )}>
                                            {appName}
                                        </span>
                                        <span className={clsx(
                                            'text-[10px] font-bold px-1.5 py-0.5 rounded',
                                            hero ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800'
                                        )}>
                                            2027
                                        </span>
                                    </div>
                                    <p className={clsx(
                                        'text-[11px] font-medium -mt-0.5',
                                        hero ? 'text-slate-300' : 'text-slate-400'
                                    )}>Great Giant Foods</p>
                                </div>
                            </Link>
                        </div>

                        {/* Top Actions: Role Switcher & User Profile */}
                        <div className="flex items-center gap-3">
                            {/* Role Switcher (AUTH-04) */}
                            {roles.length > 1 ? (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                                        className={clsx(
                                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-target',
                                            hero
                                                ? 'bg-white/10 hover:bg-white/15 border border-white/20 text-white'
                                                : 'border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900'
                                        )}
                                        aria-label="Pilih Peran"
                                    >
                                        <Shield className={clsx('w-3.5 h-3.5 shrink-0', hero ? 'text-emerald-400' : 'text-emerald-700')} />
                                        <span className="hidden sm:inline">Peran:</span>
                                        <span className="max-w-[120px] truncate">{roleLabels[activeRole] || activeRole}</span>
                                        <ChevronDown className={clsx('w-3.5 h-3.5', hero ? 'text-emerald-400' : 'text-emerald-700')} />
                                    </button>

                                    {isRoleMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                                            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                Ganti Peran Aktif
                                            </div>
                                            {roles.map((r) => (
                                                <button
                                                    key={r.code}
                                                    type="button"
                                                    onClick={() => handleSwitchRole(r.code)}
                                                    className={clsx(
                                                        'w-full text-left px-3.5 py-2.5 text-xs font-medium flex items-center justify-between transition-colors',
                                                        r.code === activeRole
                                                            ? 'bg-emerald-50 text-emerald-800 font-semibold'
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                    )}
                                                >
                                                    <span>{roleLabels[r.code] || r.name}</span>
                                                    {r.code === activeRole && (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={clsx(
                                    'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
                                    hero ? 'bg-white/10 border border-white/20 text-white' : 'bg-slate-100 border border-slate-200 text-slate-700'
                                )}>
                                    <Shield className={clsx('w-3.5 h-3.5', hero ? 'text-emerald-400' : 'text-slate-500')} />
                                    <span>{roleLabels[activeRole] || activeRole}</span>
                                </div>
                            )}

                            {/* User Profile Pill */}
                            <div className={clsx(
                                'flex items-center gap-2.5 pl-2 border-l',
                                hero ? 'border-white/20' : 'border-slate-200'
                            )}>
                                <div className={clsx(
                                    'w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 uppercase',
                                    hero ? 'bg-emerald-600/60 border border-emerald-400/40 text-white' : 'bg-slate-200 border border-slate-300 text-slate-700'
                                )}>
                                    {employee?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className={clsx(
                                        'text-xs font-bold truncate max-w-[150px]',
                                        hero ? 'text-white' : 'text-slate-800'
                                    )}>
                                        {employee?.full_name || 'Pengguna'}
                                    </p>
                                    <p className={clsx(
                                        'text-[11px] font-mono',
                                        hero ? 'text-emerald-300/80' : 'text-slate-400'
                                    )}>
                                        {employee?.employee_index} · {employee?.unit || 'GGF'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    title="Keluar"
                                    className={clsx(
                                        'p-2 rounded-lg transition-colors touch-target',
                                        hero ? 'text-slate-300 hover:text-rose-400 hover:bg-white/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                    )}
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* HERO BANNER SECTION (ORGANIC ECO-GLASSMORPHISM) */}
            {hero && (
                <div className="relative overflow-hidden bg-slate-950 text-white">
                    {/* Background scenic photo with subtle zoom */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                        style={{ backgroundImage: `url("${headerBg}")` }}
                    />
                    {/* Dual Vignette & Ambient Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950/85 backdrop-blur-[0.5px]" />
                    <div className="absolute inset-0 bg-radial-gradient from-emerald-500/15 via-transparent to-transparent pointer-events-none" />

                    {/* Hero Content */}
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
                        {hero}
                    </div>
                </div>
            )}

            {/* MAIN APP CONTAINER */}
            <div className={clsx(
                'flex-1 flex flex-col',
                hero ? '-mt-6 rounded-t-[28px] sm:rounded-t-[36px] bg-slate-50 pt-6 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] relative z-20' : ''
            )}>
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 flex gap-8">
                    {/* DESKTOP SIDEBAR */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24 space-y-6">
                            {/* Unit info card */}
                            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xs">
                                <div className="flex items-center gap-2 text-xs text-slate-300 mb-2 font-medium">
                                    <Building2 className="w-4 h-4 text-emerald-400" />
                                    <span>Unit: {employee?.unit || 'GGF HO'}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white truncate">{employee?.position || 'Karyawan'}</h4>
                                <p className="text-xs text-slate-400 truncate">{employee?.division || 'Divisi Operational'}</p>
                            </div>

                            {/* Navigation Links */}
                            <nav className="space-y-1">
                                <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Navigasi {roleLabels[activeRole]}
                                </div>
                                {navItems.map((item, idx) => {
                                    const Icon = item.icon;
                                    const isActive = window.location.pathname === item.href;
                                    return (
                                        <Link
                                            key={idx}
                                            href={item.href}
                                            className={clsx(
                                                'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                                                isActive
                                                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={clsx('w-4 h-4', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
                                                <span>{item.name}</span>
                                            </div>
                                            {item.badge && (
                                                <span
                                                    className={clsx(
                                                        'text-[10px] px-1.5 py-0.5 rounded font-bold',
                                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                                    )}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* MAIN CONTENT AREA */}
                    <main className="flex-1 min-w-0 pb-20 lg:pb-8">
                        {header && (
                            <div className="mb-6">
                                {typeof header === 'string' ? (
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{header}</h1>
                                ) : (
                                    header
                                )}
                            </div>
                        )}
                        {children}
                    </main>
                </div>
            </div>

            {/* MOBILE BOTTOM NAVIGATION (PRD 5.6) */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 py-1.5 px-3">
                <div className="flex items-center justify-around">
                    {activeRole === 'verifier' && (
                        <>
                            <Link
                                href="/verifier/dashboard"
                                className="flex flex-col items-center py-1 px-3 text-slate-600 hover:text-emerald-600 active:text-emerald-700"
                            >
                                <LayoutDashboard className="w-5 h-5 mb-0.5" />
                                <span className="text-[11px] font-medium">Dashboard</span>
                            </Link>
                            <Link
                                href="/verifier/dashboard?status=submitted"
                                className="flex flex-col items-center py-1 px-3 text-slate-600 hover:text-emerald-600 active:text-emerald-700"
                            >
                                <Clock className="w-5 h-5 mb-0.5" />
                                <span className="text-[11px] font-medium">Perlu Cek</span>
                            </Link>
                            <Link
                                href="/verifier/dashboard?status=verified"
                                className="flex flex-col items-center py-1 px-3 text-slate-600 hover:text-emerald-600 active:text-emerald-700"
                            >
                                <Award className="w-5 h-5 mb-0.5" />
                                <span className="text-[11px] font-medium">Selesai</span>
                            </Link>
                        </>
                    )}
                    {activeRole === 'admin' && (
                        <>
                            <Link
                                href="/admin/dashboard"
                                className="flex flex-col items-center py-1 px-3 text-slate-600 hover:text-emerald-600 active:text-emerald-700"
                            >
                                <LayoutDashboard className="w-5 h-5 mb-0.5" />
                                <span className="text-[11px] font-medium">Dashboard</span>
                            </Link>
                            <Link
                                href="/admin/employees"
                                className="flex flex-col items-center py-1 px-3 text-slate-600 hover:text-emerald-600 active:text-emerald-700"
                            >
                                <Users className="w-5 h-5 mb-0.5" />
                                <span className="text-[11px] font-medium">Karyawan</span>
                            </Link>
                            <Link
                                href="/admin/assignments"
                                className="flex flex-col items-center py-1 px-3 text-slate-600 hover:text-emerald-600 active:text-emerald-700"
                            >
                                <UserCheck className="w-5 h-5 mb-0.5" />
                                <span className="text-[11px] font-medium">Penugasan</span>
                            </Link>
                        </>
                    )}
                    {activeRole !== 'verifier' && activeRole !== 'admin' && (
                        <>
                            <Link
                                href="/participant/dashboard"
                                className="flex flex-col items-center py-1 px-3 text-slate-600 hover:text-emerald-600 active:text-emerald-700"
                            >
                                <LayoutDashboard className="w-5 h-5 mb-0.5" />
                                <span className="text-[11px] font-medium">Beranda</span>
                            </Link>
                            <Link
                                href="/participant/projects/create"
                                className="flex flex-col items-center py-1 px-3 text-slate-600 hover:text-emerald-600 active:text-emerald-700"
                            >
                                <FileText className="w-5 h-5 mb-0.5" />
                                <span className="text-[11px] font-medium">Daftar</span>
                            </Link>
                        </>
                    )}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="flex flex-col items-center py-1 px-3 text-slate-600 hover:text-emerald-600 active:text-emerald-700"
                    >
                        <Menu className="w-5 h-5 mb-0.5" />
                        <span className="text-[11px] font-medium">Menu</span>
                    </button>
                </div>
            </div>

            {/* MOBILE MENU DRAWER */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center">
                                        B
                                    </div>
                                    <span className="font-bold text-slate-800">Menu Navigasi</span>
                                </div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="py-4 border-b border-slate-100">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                                    Peran Aktif
                                </p>
                                <div className="space-y-1">
                                    {roles.map((r) => (
                                        <button
                                            key={r.code}
                                            onClick={() => {
                                                handleSwitchRole(r.code);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={clsx(
                                                'w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between',
                                                r.code === activeRole
                                                    ? 'bg-emerald-50 text-emerald-800'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                            )}
                                        >
                                            <span>{roleLabels[r.code] || r.name}</span>
                                            {r.code === activeRole && <span className="text-emerald-600">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <nav className="mt-4 space-y-1">
                                {navItems.map((item, idx) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={idx}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            <Icon className="w-4 h-4 text-slate-400" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-50 text-rose-700 font-semibold text-sm hover:bg-rose-100 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Keluar dari Akun</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
