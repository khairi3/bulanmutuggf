import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Button from '@/Components/Button';
import Input from '@/Components/Input';
import Modal from '@/Components/Modal';
import Badge from '@/Components/Badge';
import {
    Calendar,
    Settings,
    Plus,
    Lock,
    Unlock,
    CheckCircle2,
    AlertTriangle,
    Sliders,
    Layers,
    Clock,
    Users,
    Trash2,
    Edit2,
    ToggleLeft,
    ToggleRight,
    Sparkles,
    ShieldCheck,
    Zap,
    Wrench,
    Award,
    FileImage,
    UploadCloud,
    RotateCcw,
    Eye,
} from 'lucide-react';

const getStreamVisuals = (code) => {
    switch (code) {
        case 'CIC':
            return {
                icon: Sparkles,
                badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                iconBg: 'bg-emerald-600 text-white shadow-xs',
                iconBgInactive: 'bg-emerald-100/80 text-emerald-700',
            };
        case 'K3':
            return {
                icon: ShieldCheck,
                badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
                iconBg: 'bg-amber-600 text-white shadow-xs',
                iconBgInactive: 'bg-amber-100/80 text-amber-700',
            };
        case 'ENERGY':
            return {
                icon: Zap,
                badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
                iconBg: 'bg-blue-600 text-white shadow-xs',
                iconBgInactive: 'bg-blue-100/80 text-blue-700',
            };
        case 'TPM':
            return {
                icon: Wrench,
                badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
                iconBg: 'bg-purple-600 text-white shadow-xs',
                iconBgInactive: 'bg-purple-100/80 text-purple-700',
            };
        default:
            return {
                icon: Layers,
                badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
                iconBg: 'bg-slate-800 text-white shadow-xs',
                iconBgInactive: 'bg-slate-100 text-slate-700',
            };
    }
};

export default function EventsIndex({ events, selectedEvent, loginBackgroundImage, appHeaderBackgroundImage, certificateSettings }) {
    const [activeStreamId, setActiveStreamId] = useState(
        selectedEvent?.streams?.[0]?.id || null
    );
    const [subTab, setSubTab] = useState('rules'); // 'rules', 'phases', 'categories', 'parameters'
    const [scoringStage, setScoringStage] = useState('verification'); // 'verification' | 'judging'

    // Modal States
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
    const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
    const [selectedDimension, setSelectedDimension] = useState(null);

    // E-Certificate Management State (REP-04)
    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
    const [certPublished, setCertPublished] = useState(certificateSettings?.isPublished ?? false);
    const [signatory1Name, setSignatory1Name] = useState(certificateSettings?.signatory1Name || 'Tommy Wattimena');
    const [signatory1Title, setSignatory1Title] = useState(certificateSettings?.signatory1Title || 'Managing Director Great Giant Foods');
    const [signatory2Name, setSignatory2Name] = useState(certificateSettings?.signatory2Name || 'Steering Committee Chairman');
    const [signatory2Title, setSignatory2Title] = useState(certificateSettings?.signatory2Title || 'Head of Corporate Quality & CI');
    const [isCertSaving, setIsCertSaving] = useState(false);
    const [currentTemplateImage, setCurrentTemplateImage] = useState(certificateSettings?.templateImage || null);
    const [uploadedTemplateFile, setUploadedTemplateFile] = useState(null);
    const [templatePreview, setTemplatePreview] = useState(null);
    const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
    const [showSystemTitle, setShowSystemTitle] = useState(certificateSettings?.showSystemTitle ?? false);
    const [recipientNameTop, setRecipientNameTop] = useState(certificateSettings?.recipientNameTop ?? 107);
    const [isSavingLayout, setIsSavingLayout] = useState(false);

    useEffect(() => {
        setCertPublished(certificateSettings?.isPublished ?? false);
        setSignatory1Name(certificateSettings?.signatory1Name || 'Tommy Wattimena');
        setSignatory1Title(certificateSettings?.signatory1Title || 'Managing Director Great Giant Foods');
        setSignatory2Name(certificateSettings?.signatory2Name || 'Steering Committee Chairman');
        setSignatory2Title(certificateSettings?.signatory2Title || 'Head of Corporate Quality & CI');
        setCurrentTemplateImage(certificateSettings?.templateImage || null);
        setShowSystemTitle(certificateSettings?.showSystemTitle ?? false);
        setRecipientNameTop(certificateSettings?.recipientNameTop ?? 107);
    }, [certificateSettings]);

    const handleSaveTemplateSettings = (e) => {
        e.preventDefault();
        setIsSavingLayout(true);
        router.post('/admin/certificates/template/settings', {
            show_system_title: showSystemTitle,
            recipient_name_top: parseInt(recipientNameTop, 10),
        }, {
            preserveScroll: true,
            onSuccess: () => setIsSavingLayout(false),
            onError: () => setIsSavingLayout(false),
        });
    };

    const handleToggleCertificatePublish = (publishValue) => {
        setIsCertSaving(true);
        router.post('/admin/certificates/toggle-publish', {
            published: publishValue,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCertPublished(publishValue);
                setIsCertSaving(false);
            },
            onError: () => setIsCertSaving(false),
        });
    };

    const handleSaveSignatory = (e) => {
        e.preventDefault();
        setIsCertSaving(true);
        router.post('/admin/certificates/signatory', {
            signatory1_name: signatory1Name,
            signatory1_title: signatory1Title,
            signatory2_name: signatory2Name,
            signatory2_title: signatory2Title,
        }, {
            preserveScroll: true,
            onSuccess: () => setIsCertSaving(false),
            onError: () => setIsCertSaving(false),
        });
    };

    const handleTemplateFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedTemplateFile(file);
            setTemplatePreview(URL.createObjectURL(file));
        }
    };

    const handleUploadTemplate = (e) => {
        e.preventDefault();
        if (!uploadedTemplateFile) return;

        setIsUploadingTemplate(true);
        const formData = new FormData();
        formData.append('template_image', uploadedTemplateFile);

        router.post('/admin/certificates/template', formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsUploadingTemplate(false);
                setUploadedTemplateFile(null);
                setTemplatePreview(null);
            },
            onError: () => setIsUploadingTemplate(false),
        });
    };

    const handleResetTemplate = () => {
        if (!confirm('Apakah Anda yakin ingin menghapus template kustom dan kembali ke desain sertifikat bawaan sistem?')) {
            return;
        }

        setIsUploadingTemplate(true);
        router.post('/admin/certificates/template/reset', {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsUploadingTemplate(false);
                setUploadedTemplateFile(null);
                setTemplatePreview(null);
                setCurrentTemplateImage(null);
            },
            onError: () => setIsUploadingTemplate(false),
        });
    };

    // Visual Branding Customization State (Login & Header Banner)
    const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
    const [bgTarget, setBgTarget] = useState('both'); // 'login' | 'header' | 'both'
    const [backgroundType, setBackgroundType] = useState('preset'); // 'preset' | 'upload'
    const [selectedPreset, setSelectedPreset] = useState(appHeaderBackgroundImage || '/images/login-bg-plantation.jpg');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadPreview, setUploadPreview] = useState(null);
    const [bgSaving, setBgSaving] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            setUploadPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveBackground = (e) => {
        e.preventDefault();
        setBgSaving(true);
        const formData = new FormData();
        formData.append('target', bgTarget);
        formData.append('background_type', backgroundType);
        if (backgroundType === 'preset') {
            formData.append('preset', selectedPreset);
        } else if (backgroundType === 'upload' && uploadedFile) {
            formData.append('image', uploadedFile);
        }

        router.post('/admin/settings/login-background', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setBgSaving(false);
                setIsBackgroundModalOpen(false);
            },
            onError: () => {
                setBgSaving(false);
            },
        });
    };

    // Form Add Stream (CFG-02)
    const newStreamForm = useForm({
        name: '',
        code: '',
        code_pattern: 'TPM-{NNN}',
        team_min: 2,
        team_max: 5,
        max_projects_per_employee: 1,
    });

    // Selected Stream
    const currentStream = selectedEvent?.streams?.find((s) => s.id === activeStreamId) || selectedEvent?.streams?.[0];

    // Form Event Create/Edit
    const eventForm = useForm({
        name: selectedEvent?.name || '',
        year: selectedEvent?.year || 2026,
        status: selectedEvent?.status || 'draft',
        final_weight_verification: selectedEvent?.final_weight_verification || 40,
        final_weight_judging: selectedEvent?.final_weight_judging || 60,
    });

    // Form Stream Rules (CFG-06)
    const streamRulesForm = useForm({
        team_min: currentStream?.team_min || 3,
        team_max: currentStream?.team_max || 7,
        max_projects_per_employee: currentStream?.max_projects_per_employee || 2,
        code_pattern: currentStream?.code_pattern || '{LEVEL}{IMPROVEMENT}{AREA}-{NNN}',
    });

    // Form Phases (CFG-03)
    const [phasesState, setPhasesState] = useState(
        currentStream?.phases?.map((p) => ({
            id: p.id,
            phase_type: p.phase_type,
            start_at: p.start_at ? p.start_at.substring(0, 16) : '',
            end_at: p.end_at ? p.end_at.substring(0, 16) : '',
            is_locked: p.is_locked,
        })) || []
    );

    // Form Scoring Parameters (CFG-05)
    const currentParams = currentStream?.scoring_parameters?.filter((p) => p.stage === scoringStage) || [];
    const [parametersState, setParametersState] = useState(
        currentParams.length > 0
            ? currentParams.map((p) => ({ name: p.name, rubric: p.rubric || '', weight: parseFloat(p.weight) }))
            : [
                  { name: 'Kualitas Analisis Masalah', rubric: 'Rubrik penilaian', weight: 50 },
                  { name: 'Efektivitas Solusi & Hasil', rubric: 'Rubrik penilaian', weight: 50 },
              ]
    );

    // Update parameters when stream or stage changes
    React.useEffect(() => {
        if (currentStream) {
            const stageParams = currentStream.scoring_parameters?.filter((p) => p.stage === scoringStage) || [];
            if (stageParams.length > 0) {
                setParametersState(
                    stageParams.map((p) => ({ name: p.name, rubric: p.rubric || '', weight: parseFloat(p.weight) }))
                );
            }
            if (currentStream.phases) {
                setPhasesState(
                    currentStream.phases.map((p) => ({
                        id: p.id,
                        phase_type: p.phase_type,
                        start_at: p.start_at ? p.start_at.substring(0, 16) : '',
                        end_at: p.end_at ? p.end_at.substring(0, 16) : '',
                        is_locked: p.is_locked,
                    }))
                );
            }
            streamRulesForm.setData({
                team_min: currentStream.team_min,
                team_max: currentStream.team_max,
                max_projects_per_employee: currentStream.max_projects_per_employee,
                code_pattern: currentStream.code_pattern,
            });
        }
    }, [activeStreamId, scoringStage]);

    // Form Option Create
    const optionForm = useForm({
        name: '',
        abbreviation: '',
        quota: '',
        sort_order: 1,
    });

    const handleSaveStreamRules = (e) => {
        e.preventDefault();
        streamRulesForm.post(`/admin/streams/${currentStream.id}/rules`, {
            preserveScroll: true,
        });
    };

    const handleSavePhases = () => {
        router.post(
            `/admin/streams/${currentStream.id}/phases`,
            { phases: phasesState },
            { preserveScroll: true }
        );
    };

    const handleSaveParameters = () => {
        router.post(
            `/admin/streams/${currentStream.id}/scoring-parameters`,
            { stage: scoringStage, parameters: parametersState },
            { preserveScroll: true }
        );
    };

    const handleCreateStream = (e) => {
        e.preventDefault();
        newStreamForm.post(`/admin/events/${selectedEvent.id}/streams`, {
            onSuccess: () => {
                setIsStreamModalOpen(false);
                newStreamForm.reset();
            },
        });
    };

    const handleToggleStream = (streamId) => {
        router.post(`/admin/streams/${streamId}/toggle`, {}, { preserveScroll: true });
    };

    const handleAddOption = (e) => {
        e.preventDefault();
        if (!selectedDimension) return;

        optionForm.post(`/admin/dimensions/${selectedDimension.id}/options`, {
            onSuccess: () => {
                setIsOptionModalOpen(false);
                optionForm.reset();
            },
        });
    };

    const handleDeleteOption = (optionId) => {
        if (confirm('Yakin ingin menghapus opsi kategori ini?')) {
            router.delete(`/admin/options/${optionId}`, { preserveScroll: true });
        }
    };

    // Calculate sum of weights for scoring parameters
    const totalParameterWeight = parametersState.reduce((acc, p) => acc + (parseFloat(p.weight) || 0), 0);
    const isWeightValid = Math.round(totalParameterWeight) === 100;

    return (
        <AppLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {selectedEvent?.name || 'Konfigurasi Event'}
                            </h1>
                            <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    selectedEvent?.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {selectedEvent?.status || 'Draft'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Tahun {selectedEvent?.year} · Bobot Akhir: Verifikasi {selectedEvent?.final_weight_verification}% / Juri {selectedEvent?.final_weight_judging}%
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" onClick={() => setIsCertificateModalOpen(true)}>
                            <Award className="w-4 h-4 mr-2 text-amber-600" />
                            <span>E-Sertifikat {certPublished && '• Aktif'}</span>
                        </Button>
                        <Button variant="secondary" onClick={() => setIsBackgroundModalOpen(true)}>
                            <Sparkles className="w-4 h-4 mr-2 text-emerald-600" />
                            <span>Wallpaper & Banner</span>
                        </Button>
                        <Button variant="secondary" onClick={() => setIsStreamModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            <span>Tambah Perlombaan</span>
                        </Button>
                        <Button variant="secondary" onClick={() => setIsEventModalOpen(true)}>
                            <Settings className="w-4 h-4 mr-2" />
                            <span>Pengaturan Event</span>
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Konfigurasi Event - Bulan Mutu GGF" />

            <div className="space-y-6">
                {/* 1. Stream Selection Cards (Box Grid with Icons) */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Pilih Kategori Perlombaan (Stream)
                        </h2>
                        <span className="text-xs text-slate-400">
                            Klik box untuk konfigurasi aturan, jadwal, kategori & rubrik
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {selectedEvent?.streams?.map((stream) => {
                            const isSelected = activeStreamId === stream.id;
                            const visual = getStreamVisuals(stream.code);
                            const IconComponent = visual.icon;

                            return (
                                <button
                                    key={stream.id}
                                    type="button"
                                    onClick={() => setActiveStreamId(stream.id)}
                                    className={`relative text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
                                        isSelected
                                            ? 'bg-white border-emerald-600 shadow-md ring-4 ring-emerald-500/10 scale-[1.01]'
                                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
                                    }`}
                                >
                                    {/* Top Row: Icon & Status */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div
                                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                                                isSelected
                                                    ? visual.iconBg
                                                    : visual.iconBgInactive + ' group-hover:scale-105'
                                            }`}
                                        >
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`text-2xs font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1 ${
                                                    stream.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        stream.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                                                    }`}
                                                />
                                                {stream.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle Row: Code & Stream Title */}
                                    <div className="grow">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="font-extrabold text-xs tracking-wider text-slate-400 uppercase">
                                                {stream.code}
                                            </span>
                                            {isSelected && (
                                                <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                    Dipilih
                                                </span>
                                            )}
                                        </div>
                                        <h3
                                            className={`text-sm font-bold leading-snug line-clamp-2 transition-colors ${
                                                isSelected ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                                            }`}
                                        >
                                            {stream.name}
                                        </h3>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Stream Sub-navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setSubTab('rules')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                subTab === 'rules'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Aturan Tim & Pola Kode
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubTab('phases')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                subTab === 'phases'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Jadwal Fase Event
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubTab('categories')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                subTab === 'categories'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Kategori & Singkatan
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubTab('parameters')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                subTab === 'parameters'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Parameter Penilaian
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-semibold">Status Stream:</span>
                        <button
                            type="button"
                            onClick={() => handleToggleStream(currentStream.id)}
                            className="flex items-center gap-1 font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
                        >
                            {currentStream?.is_active ? (
                                <>
                                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                                    <span className="text-emerald-700">Aktif</span>
                                </>
                            ) : (
                                <>
                                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-400">Nonaktif</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* SUBTAB 1: ATURAN TIM & POLA KODE (CFG-06) */}
                {subTab === 'rules' && (
                    <Card
                        title={`Aturan Tim: ${currentStream?.name}`}
                        subtitle="Batasan jumlah peserta tim dan format prefix kode registrasi otomatis"
                    >
                        <form onSubmit={handleSaveStreamRules} className="max-w-xl space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    id="team_min"
                                    label="Jumlah Anggota Minimal"
                                    type="number"
                                    value={streamRulesForm.data.team_min}
                                    onChange={(e) => streamRulesForm.setData('team_min', e.target.value)}
                                    error={streamRulesForm.errors.team_min}
                                    required
                                />
                                <Input
                                    id="team_max"
                                    label="Jumlah Anggota Maksimal"
                                    type="number"
                                    value={streamRulesForm.data.team_max}
                                    onChange={(e) => streamRulesForm.setData('team_max', e.target.value)}
                                    error={streamRulesForm.errors.team_max}
                                    required
                                />
                            </div>

                            <Input
                                id="max_projects_per_employee"
                                label="Maksimal Project per Karyawan di Stream Ini"
                                type="number"
                                value={streamRulesForm.data.max_projects_per_employee}
                                onChange={(e) => streamRulesForm.setData('max_projects_per_employee', e.target.value)}
                                error={streamRulesForm.errors.max_projects_per_employee}
                                required
                            />

                            <Input
                                id="code_pattern"
                                label="Pola Format Kode Registrasi (Bagian 3.3)"
                                type="text"
                                value={streamRulesForm.data.code_pattern}
                                onChange={(e) => streamRulesForm.setData('code_pattern', e.target.value)}
                                error={streamRulesForm.errors.code_pattern}
                                helperText="Contoh CIC: {LEVEL}{IMPROVEMENT}{AREA}-{NNN} | Contoh K3: SIGAP-{NNN}"
                                required
                            />

                            <div className="pt-2">
                                <Button type="submit" variant="primary" loading={streamRulesForm.processing}>
                                    Simpan Aturan Tim
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* SUBTAB 2: JADWAL 6 FASE (CFG-03) */}
                {subTab === 'phases' && (
                    <Card
                        title={`Jadwal 6 Fase: ${currentStream?.name}`}
                        subtitle="Tanggal buka/tutup tiap tahapan lomba. Di luar jadwal, sistem menolak aksi peserta secara otomatis."
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {phasesState.map((phase, idx) => (
                                    <div
                                        key={phase.id}
                                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-slate-800 capitalize">
                                                Fase {phase.phase_type}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...phasesState];
                                                    updated[idx].is_locked = !updated[idx].is_locked;
                                                    setPhasesState(updated);
                                                }}
                                                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold border ${
                                                    phase.is_locked
                                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}
                                            >
                                                {phase.is_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                                <span>{phase.is_locked ? 'Terkunci' : 'Terbuka'}</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Mulai:</label>
                                                <input
                                                    type="datetime-local"
                                                    value={phase.start_at}
                                                    onChange={(e) => {
                                                        const updated = [...phasesState];
                                                        updated[idx].start_at = e.target.value;
                                                        setPhasesState(updated);
                                                    }}
                                                    className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Selesai:</label>
                                                <input
                                                    type="datetime-local"
                                                    value={phase.end_at}
                                                    onChange={(e) => {
                                                        const updated = [...phasesState];
                                                        updated[idx].end_at = e.target.value;
                                                        setPhasesState(updated);
                                                    }}
                                                    className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-3">
                                <Button variant="primary" onClick={handleSavePhases}>
                                    Simpan Perubahan Jadwal Fase
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* SUBTAB 3: KATEGORI & DIMENSI (CFG-04, CFG-07) */}
                {subTab === 'categories' && (
                    <div className="space-y-6">
                        {currentStream?.category_dimensions?.map((dim) => (
                            <Card
                                key={dim.id}
                                title={`Dimensi ${dim.name} (${dim.code})`}
                                subtitle={`Urutan kode registrasi: Urutan ke-${dim.code_order}`}
                                action={
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedDimension(dim);
                                            setIsOptionModalOpen(true);
                                        }}
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        <span>Tambah Opsi</span>
                                    </Button>
                                }
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {dim.options?.map((opt) => (
                                        <div
                                            key={opt.id}
                                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-slate-800">{opt.name}</span>
                                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white text-emerald-800 font-bold border border-emerald-200">
                                                        {opt.abbreviation}
                                                    </span>
                                                </div>
                                                {opt.quota !== null && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Kuota Convention: <strong className="text-slate-700">{opt.quota} project</strong>
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteOption(opt.id)}
                                                className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                                title="Hapus Opsi"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* SUBTAB 4: PARAMETER PENILAIAN (CFG-05) */}
                {subTab === 'parameters' && (
                    <Card
                        title={`Parameter Penilaian: ${currentStream?.name}`}
                        subtitle="Form rubrik dan bobot nilai. Total bobot wajib tepat 100%."
                        action={
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setScoringStage('verification')}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                        scoringStage === 'verification'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    Tahap Verifikasi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScoringStage('judging')}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                        scoringStage === 'judging'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    Tahap Juri Convention
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            {/* Total Weight Counter */}
                            <div
                                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                                    isWeightValid
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                        : 'bg-rose-50 border-rose-300 text-rose-800'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {isWeightValid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                                    <span>
                                        {isWeightValid
                                            ? 'Total bobot parameter sudah pas 100% (Siap disimpan).'
                                            : `Total bobot saat ini ${totalParameterWeight}%. Wajib tepat 100% sebelum dapat disimpan.`}
                                    </span>
                                </div>
                                <span className="text-sm font-extrabold">{totalParameterWeight}% / 100%</span>
                            </div>

                            {/* Parameter Items */}
                            <div className="space-y-3">
                                {parametersState.map((param, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 relative"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                {idx + 1}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Nama Parameter Penilaian..."
                                                value={param.name}
                                                onChange={(e) => {
                                                    const updated = [...parametersState];
                                                    updated[idx].name = e.target.value;
                                                    setParametersState(updated);
                                                }}
                                                className="flex-1 text-sm font-semibold p-2 rounded-lg border border-slate-300 bg-white"
                                            />
                                            <div className="flex items-center gap-1.5 w-32 shrink-0">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={param.weight}
                                                    onChange={(e) => {
                                                        const updated = [...parametersState];
                                                        updated[idx].weight = parseFloat(e.target.value) || 0;
                                                        setParametersState(updated);
                                                    }}
                                                    className="w-full text-sm font-bold text-center p-2 rounded-lg border border-slate-300 bg-white"
                                                />
                                                <span className="text-xs font-bold text-slate-500">%</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = parametersState.filter((_, i) => i !== idx);
                                                    setParametersState(updated);
                                                }}
                                                className="text-slate-400 hover:text-rose-600 p-1.5"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <textarea
                                            placeholder="Deskripsi rubrik penilaian (panduan penilaian verifikator/juri)..."
                                            value={param.rubric}
                                            rows={2}
                                            onChange={(e) => {
                                                const updated = [...parametersState];
                                                updated[idx].rubric = e.target.value;
                                                setParametersState(updated);
                                            }}
                                            className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setParametersState([
                                            ...parametersState,
                                            { name: '', rubric: '', weight: 0 },
                                        ])
                                    }
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    <span>Tambah Parameter</span>
                                </Button>

                                <Button
                                    variant="primary"
                                    disabled={!isWeightValid}
                                    onClick={handleSaveParameters}
                                >
                                    Simpan Parameter ({scoringStage})
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* MODAL EDIT EVENT */}
            <Modal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                title="Pengaturan Event BMG"
                description="Hanya ada 1 event yang dapat aktif sekaligus. Jika diaktifkan, event lain otomatis ditutup."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEventModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            loading={eventForm.processing}
                            onClick={(e) => {
                                e.preventDefault();
                                eventForm.put(`/admin/events/${selectedEvent.id}`, {
                                    onSuccess: () => setIsEventModalOpen(false),
                                });
                            }}
                        >
                            Simpan Event
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        id="name"
                        label="Nama Event"
                        value={eventForm.data.name}
                        onChange={(e) => eventForm.setData('name', e.target.value)}
                        error={eventForm.errors.name}
                        required
                    />

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status Event</label>
                        <select
                            value={eventForm.data.status}
                            onChange={(e) => eventForm.setData('status', e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                        >
                            <option value="draft">Draft (Belum Aktif)</option>
                            <option value="active">Active (Sedang Berjalan)</option>
                            <option value="closed">Closed (Telah Selesai)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            id="final_weight_verification"
                            label="Bobot Nilai Verifikasi (%)"
                            type="number"
                            value={eventForm.data.final_weight_verification}
                            onChange={(e) => eventForm.setData('final_weight_verification', e.target.value)}
                            error={eventForm.errors.final_weight_verification}
                            required
                        />
                        <Input
                            id="final_weight_judging"
                            label="Bobot Nilai Juri (%)"
                            type="number"
                            value={eventForm.data.final_weight_judging}
                            onChange={(e) => eventForm.setData('final_weight_judging', e.target.value)}
                            error={eventForm.errors.final_weight_judging}
                            required
                        />
                    </div>
                </form>
            </Modal>

            {/* MODAL ADD OPTION (CFG-04) */}
            <Modal
                isOpen={isOptionModalOpen}
                onClose={() => setIsOptionModalOpen(false)}
                title={`Tambah Opsi: ${selectedDimension?.name}`}
                description="Menambah pilihan nilai untuk kategori ini beserta singkatan untuk kode registrasi."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsOptionModalOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="primary" loading={optionForm.processing} onClick={handleAddOption}>
                            Simpan Opsi
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        id="opt_name"
                        label="Nama Opsi"
                        placeholder="Contoh: Mechanization atau Beginner"
                        value={optionForm.data.name}
                        onChange={(e) => optionForm.setData('name', e.target.value)}
                        error={optionForm.errors.name}
                        required
                    />

                    <Input
                        id="opt_abbreviation"
                        label="Singkatan Kode (Digunakan dalam kode registrasi)"
                        placeholder="Contoh: MECH atau B"
                        value={optionForm.data.abbreviation}
                        onChange={(e) => optionForm.setData('abbreviation', e.target.value)}
                        error={optionForm.errors.abbreviation}
                        required
                    />

                    <Input
                        id="opt_quota"
                        label="Kuota Lolos Convention Day (Opsional)"
                        type="number"
                        placeholder="Kosongkan jika tidak ada batasan kuota"
                        value={optionForm.data.quota}
                        onChange={(e) => optionForm.setData('quota', e.target.value)}
                        error={optionForm.errors.quota}
                    />
                </form>
            </Modal>

            {/* MODAL ADD STREAM / PERLOMBAAN (CFG-02) */}
            <Modal
                isOpen={isStreamModalOpen}
                onClose={() => setIsStreamModalOpen(false)}
                title="Tambah Kategori Perlombaan (Stream)"
                description="Menambahkan kategori kompetisi baru ke event yang sedang aktif."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsStreamModalOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="primary" loading={newStreamForm.processing} onClick={handleCreateStream}>
                            Simpan Perlombaan
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        id="new_stream_name"
                        label="Nama Perlombaan / Stream"
                        placeholder="Contoh: Total Productive Maintenance (TPM)"
                        value={newStreamForm.data.name}
                        onChange={(e) => newStreamForm.setData('name', e.target.value)}
                        error={newStreamForm.errors.name}
                        required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            id="new_stream_code"
                            label="Kode Singkat (Huruf Kapital)"
                            placeholder="Contoh: TPM"
                            value={newStreamForm.data.code}
                            onChange={(e) => newStreamForm.setData('code', e.target.value.toUpperCase())}
                            error={newStreamForm.errors.code}
                            required
                        />

                        <Input
                            id="new_stream_pattern"
                            label="Pola Format Kode Registrasi"
                            placeholder="Contoh: TPM-{NNN}"
                            value={newStreamForm.data.code_pattern}
                            onChange={(e) => newStreamForm.setData('code_pattern', e.target.value)}
                            error={newStreamForm.errors.code_pattern}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            id="new_stream_team_min"
                            label="Minimal Anggota"
                            type="number"
                            min="1"
                            max="20"
                            value={newStreamForm.data.team_min}
                            onChange={(e) => newStreamForm.setData('team_min', parseInt(e.target.value) || 1)}
                            error={newStreamForm.errors.team_min}
                            required
                        />

                        <Input
                            id="new_stream_team_max"
                            label="Maksimal Anggota"
                            type="number"
                            min="1"
                            max="20"
                            value={newStreamForm.data.team_max}
                            onChange={(e) => newStreamForm.setData('team_max', parseInt(e.target.value) || 1)}
                            error={newStreamForm.errors.team_max}
                            required
                        />

                        <Input
                            id="new_stream_max_proj"
                            label="Maks Project / Orang"
                            type="number"
                            min="1"
                            max="10"
                            value={newStreamForm.data.max_projects_per_employee}
                            onChange={(e) => newStreamForm.setData('max_projects_per_employee', parseInt(e.target.value) || 1)}
                            error={newStreamForm.errors.max_projects_per_employee}
                            required
                        />
                    </div>
                </form>
            </Modal>

            {/* Modal Kustomisasi Visual Wallpaper & Banner */}
            <Modal
                isOpen={isBackgroundModalOpen}
                onClose={() => setIsBackgroundModalOpen(false)}
                title="Kustomisasi Visual Wallpaper & Banner"
                description="Pilih foto wallpaper untuk latar belakang halaman login dan banner header aplikasi."
                maxWidth="2xl"
            >
                <form onSubmit={handleSaveBackground} className="space-y-4 pt-1">
                    {/* Target Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Terapkan Foto Wallpaper Untuk:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setBgTarget('both')}
                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                                    bgTarget === 'both'
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                ✨ Keduanya (Seragam)
                            </button>
                            <button
                                type="button"
                                onClick={() => setBgTarget('header')}
                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                                    bgTarget === 'header'
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                🌿 Banner Header Saja
                            </button>
                            <button
                                type="button"
                                onClick={() => setBgTarget('login')}
                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                                    bgTarget === 'login'
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                🔒 Background Login Saja
                            </button>
                        </div>
                    </div>

                    {/* Mode Tabs: Preset vs Upload */}
                    <div className="flex border-b border-slate-200 pt-1">
                        <button
                            type="button"
                            onClick={() => setBackgroundType('preset')}
                            className={`pb-2.5 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                                backgroundType === 'preset'
                                    ? 'border-emerald-600 text-emerald-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Pilihan Wallpaper Preset
                        </button>
                        <button
                            type="button"
                            onClick={() => setBackgroundType('upload')}
                            className={`pb-2.5 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                                backgroundType === 'upload'
                                    ? 'border-emerald-600 text-emerald-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Unggah Foto Sendiri
                        </button>
                    </div>

                    {/* Tab 1: Presets */}
                    {backgroundType === 'preset' && (
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-700">
                                Pilih Tema Wallpaper Sinematik:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* Preset 1: Alpine Sunset & Lakeside Chalet */}
                                <div
                                    onClick={() => setSelectedPreset('/images/login-bg-default.jpg')}
                                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${
                                        selectedPreset === '/images/login-bg-default.jpg'
                                            ? 'border-emerald-600 ring-4 ring-emerald-500/20 shadow-md'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <img
                                        src="/images/login-bg-default.jpg"
                                        alt="Alpine Sunset & Lakeside Chalet"
                                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="p-2.5 bg-white flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">Alpine Sunset & Lake Chalet</p>
                                            <p className="text-[10px] text-slate-500">Pemandangan danau pegunungan senja</p>
                                        </div>
                                        {selectedPreset === '/images/login-bg-default.jpg' && (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        )}
                                    </div>
                                </div>

                                {/* Preset 2: GGF Plantation & Sunrise */}
                                <div
                                    onClick={() => setSelectedPreset('/images/login-bg-plantation.jpg')}
                                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${
                                        selectedPreset === '/images/login-bg-plantation.jpg'
                                            ? 'border-emerald-600 ring-4 ring-emerald-500/20 shadow-md'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <img
                                        src="/images/login-bg-plantation.jpg"
                                        alt="GGF Tropical Plantation & Mist"
                                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="p-2.5 bg-white flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">GGF Plantation & Mist</p>
                                            <p className="text-[10px] text-slate-500">Hamparan perkebunan hijau saat fajar</p>
                                        </div>
                                        {selectedPreset === '/images/login-bg-plantation.jpg' && (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Upload File */}
                    {backgroundType === 'upload' && (
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-700">
                                Pilih Berkas Gambar (Rekomendasi resolusi 1920x1080 atau 4K):
                            </label>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/jpg"
                                onChange={handleFileChange}
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                            />
                            {uploadPreview && (
                                <div className="mt-3">
                                    <p className="text-[11px] font-semibold text-slate-500 mb-1">Pratinjau Foto Terpilih:</p>
                                    <img
                                        src={uploadPreview}
                                        alt="Pratinjau Upload"
                                        className="w-full h-44 object-cover rounded-xl border border-slate-200 shadow-xs"
                                    />
                                </div>
                            )}
                            <p className="text-[11px] text-slate-400">
                                Format: JPG, PNG, WebP. Maksimal ukuran 5MB.
                            </p>
                        </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <a
                            href="/login"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                            Pratinjau Halaman Login ↗
                        </a>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsBackgroundModalOpen(false)}
                                disabled={bgSaving}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={bgSaving}
                                disabled={backgroundType === 'upload' && !uploadedFile}
                            >
                                Simpan Background
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL MANAJEMEN E-SERTIFIKAT (REP-04) */}
            <Modal
                isOpen={isCertificateModalOpen}
                onClose={() => setIsCertificateModalOpen(false)}
                title="Manajemen E-Sertifikat Peserta"
                maxWidth="2xl"
            >
                <div className="space-y-6">
                    {/* 1. Status Publikasi Banner & Action */}
                    <div className={`p-5 rounded-2xl border ${
                        certPublished 
                            ? 'bg-emerald-50 border-emerald-300' 
                            : 'bg-amber-50 border-amber-300'
                    }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    certPublished ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-sm text-slate-900">
                                            Status Publikasi Sertifikat
                                        </h4>
                                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                            certPublished 
                                                ? 'bg-emerald-200 text-emerald-900' 
                                                : 'bg-amber-200 text-amber-900'
                                        }`}>
                                            {certPublished ? 'Diterbitkan (Live)' : 'Belum Dibuka (Draft)'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                        {certPublished
                                            ? 'E-Sertifikat aktif dan dapat diunduh oleh setiap anggota tim peserta di dashboard masing-masing.'
                                            : 'Sertifikat masih terkunci. Peserta belum dapat mengunduh sertifikat hingga Anda membuka tombol publikasi di bawah.'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0 self-end sm:self-center">
                                {certPublished ? (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => handleToggleCertificatePublish(false)}
                                        loading={isCertSaving}
                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                    >
                                        Tarik / Tutup Publikasi
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => handleToggleCertificatePublish(true)}
                                        loading={isCertSaving}
                                    >
                                        <Award className="w-4 h-4 mr-2" />
                                        <span>Buka & Terbitkan Sertifikat</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Pengaturan 2 Penandatangan (Signatories Form) */}
                    <form onSubmit={handleSaveSignatory} className="space-y-4 pt-2 border-t border-slate-100">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                <span>Konfigurasi 2 Pejabat Penandatangan Sertifikat</span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Kedua nama dan jabatan pejabat ini akan dicetak berdampingan di bagian bawah lembar sertifikat PDF (kiri dan kanan).
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pejabat 1 (Kiri) */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-1 border-b border-slate-200">
                                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                                    <span>Pejabat 1 (Posisi Kiri)</span>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Nama Lengkap Pejabat:
                                    </label>
                                    <input
                                        type="text"
                                        value={signatory1Name}
                                        onChange={(e) => setSignatory1Name(e.target.value)}
                                        placeholder="Contoh: Tommy Wattimena"
                                        required
                                        className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Jabatan / Peran:
                                    </label>
                                    <input
                                        type="text"
                                        value={signatory1Title}
                                        onChange={(e) => setSignatory1Title(e.target.value)}
                                        placeholder="Contoh: Managing Director Great Giant Foods"
                                        required
                                        className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                    />
                                </div>
                            </div>

                            {/* Pejabat 2 (Kanan) */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-1 border-b border-slate-200">
                                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                                    <span>Pejabat 2 (Posisi Kanan)</span>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Nama Lengkap Pejabat:
                                    </label>
                                    <input
                                        type="text"
                                        value={signatory2Name}
                                        onChange={(e) => setSignatory2Name(e.target.value)}
                                        placeholder="Contoh: Steering Committee Chairman"
                                        required
                                        className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Jabatan / Peran:
                                    </label>
                                    <input
                                        type="text"
                                        value={signatory2Title}
                                        onChange={(e) => setSignatory2Title(e.target.value)}
                                        placeholder="Contoh: Head of Corporate Quality & CI"
                                        required
                                        className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                variant="secondary"
                                loading={isCertSaving}
                            >
                                Simpan Konfigurasi 2 Penandatangan
                            </Button>
                        </div>
                    </form>

                    {/* 3. Pengaturan Template Background Sertifikat (Cara 1) */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <FileImage className="w-4 h-4 text-emerald-600" />
                                    <span>Template Background Sertifikat (A4 Landscape)</span>
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Unggah desain background sertifikat (Canva/Photoshop). Teks peserta, judul karya, QR code, dan tanda tangan akan dicetak otomatis di atasnya.
                                </p>
                            </div>
                            <a
                                href="/admin/certificates/preview"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Pratinjau PDF Sample</span>
                            </a>
                        </div>

                        {/* Status Template Saat Ini */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-700">Status Desain:</span>
                                        {currentTemplateImage ? (
                                            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                Template Kustom Aktif
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                                Desain Bawaan Sistem (Gold & Emerald Border)
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {currentTemplateImage
                                            ? 'Sertifikat menggunakan background kustom yang telah diunggah.'
                                            : 'Sertifikat menggunakan layout default resmi GGF dengan border emas & ornamen sudut.'}
                                    </p>
                                </div>

                                {currentTemplateImage && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleResetTemplate}
                                        loading={isUploadingTemplate}
                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs shrink-0"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Reset ke Desain Bawaan</span>
                                    </Button>
                                )}
                            </div>

                            {/* Thumbnail Template Aktif */}
                            {currentTemplateImage && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <p className="text-[11px] font-bold text-slate-600 mb-2">Pratinjau Background Aktif:</p>
                                    <div className="w-full max-w-sm rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-slate-100">
                                        <img
                                            src={currentTemplateImage}
                                            alt="Current Certificate Template"
                                            className="w-full h-auto object-cover max-h-36"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Pengaturan Penyesuaian Tata Letak Teks */}
                            {currentTemplateImage && (
                                <form onSubmit={handleSaveTemplateSettings} className="mt-4 pt-4 border-t border-slate-200 space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Penyesuaian Tata Letak Teks Template Kustom</span>
                                        </h5>
                                        <Button
                                            type="submit"
                                            variant="secondary"
                                            loading={isSavingLayout}
                                            className="text-xs py-1 px-3"
                                        >
                                            Simpan Tata Letak
                                        </Button>
                                    </div>

                                    {/* Toggle Hide/Show System Title */}
                                    <div className="flex items-start gap-2.5 pt-1">
                                        <input
                                            type="checkbox"
                                            id="showSystemTitle"
                                            checked={!showSystemTitle}
                                            onChange={(e) => setShowSystemTitle(!e.target.checked)}
                                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                        />
                                        <label htmlFor="showSystemTitle" className="text-xs text-slate-700 cursor-pointer">
                                            <span className="font-bold">Mode Template Canva / Siap Pakai: Sembunyikan Judul & Kop Bawaan Sistem</span>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                (Direkomendasikan Aktif) Mencegah tulisan "Certificate / Sertifikat" bawaan sistem bertumpuk dengan judul yang sudah tercetak di template gambar.
                                            </p>
                                        </label>
                                    </div>

                                    {/* Vertical Position of Recipient Name */}
                                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <label htmlFor="recipientNameTop" className="block text-xs font-bold text-slate-700">
                                                Tinggi Posisi Vertikal Nama Peserta (mm):
                                            </label>
                                            <span className="text-[11px] text-slate-500">
                                                Rekomendasi: 107 mm (tepat di atas garis nama template). Rentang: 70 - 140 mm.
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <input
                                                type="number"
                                                id="recipientNameTop"
                                                min="70"
                                                max="140"
                                                value={recipientNameTop}
                                                onChange={(e) => setRecipientNameTop(e.target.value)}
                                                className="w-20 text-xs rounded-xl border border-slate-300 py-1.5 px-2.5 text-center focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                            />
                                            <span className="text-xs font-bold text-slate-500">mm</span>
                                            <button
                                                type="button"
                                                onClick={() => setRecipientNameTop(107)}
                                                className="text-[11px] text-emerald-600 hover:text-emerald-700 underline font-semibold ml-1"
                                            >
                                                Default
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Upload Form */}
                        <form onSubmit={handleUploadTemplate} className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                            <label className="block text-xs font-bold text-slate-800">
                                Unggah File Template Baru (A4 Landscape):
                            </label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleTemplateFileChange}
                                    className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 text-slate-600 cursor-pointer w-full sm:w-auto"
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={!uploadedTemplateFile}
                                    loading={isUploadingTemplate}
                                    className="text-xs shrink-0"
                                >
                                    <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                                    <span>Unggah & Terapkan Template</span>
                                </Button>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Format: PNG, JPG, JPEG, atau WEBP. Rekomendasi rasio 1.414 : 1 (A4 Landscape, min. 1920x1358 px atau 3508x2480 px). Maksimal 15 MB.
                            </p>

                            {/* Preview File Baru Sebelum Diunggah */}
                            {templatePreview && (
                                <div className="pt-2">
                                    <p className="text-[11px] font-bold text-emerald-700 mb-1">File Terpilih (Belum Disimpan):</p>
                                    <div className="w-full max-w-xs rounded-lg overflow-hidden border-2 border-emerald-500 shadow-sm">
                                        <img
                                            src={templatePreview}
                                            alt="Selected Template Preview"
                                            className="w-full h-auto object-cover max-h-32"
                                        />
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* 4. Info Fitur Keaslian */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Fitur Keamanan & Validasi Keaslian:</span>
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
                            <li>Format A4 Landscape beresolusi tinggi dengan ornamen dan border resmi GGF.</li>
                            <li>Personal per individu anggota tim (mencantumkan Nama, NIK, Unit, dan Peran di tim).</li>
                            <li>Nomor sertifikat berurutan unik: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px]">BMG/2027/CERT-PAR/00001</code></li>
                            <li>Dilengkapi QR Code validasi keaslian yang dapat diverifikasi secara publik via scan smartphone.</li>
                        </ul>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsCertificateModalOpen(false)}
                        >
                            Tutup
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
