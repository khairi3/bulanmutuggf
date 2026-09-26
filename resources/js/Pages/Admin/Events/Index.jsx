import React, { useState } from 'react';
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
} from 'lucide-react';

export default function EventsIndex({ events, selectedEvent }) {
    const [activeStreamId, setActiveStreamId] = useState(
        selectedEvent?.streams?.[0]?.id || null
    );
    const [subTab, setSubTab] = useState('rules'); // 'rules', 'phases', 'categories', 'parameters'
    const [scoringStage, setScoringStage] = useState('verification'); // 'verification' | 'judging'

    // Modal States
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
    const [selectedDimension, setSelectedDimension] = useState(null);

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

                    <div className="flex items-center gap-2">
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
                {/* 1. Stream Selection Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
                    {selectedEvent?.streams?.map((stream) => (
                        <div key={stream.id} className="flex items-center">
                            <button
                                type="button"
                                onClick={() => setActiveStreamId(stream.id)}
                                className={`flex items-center gap-2.5 px-4 py-3 text-sm font-bold border-b-2 transition-all shrink-0 ${
                                    activeStreamId === stream.id
                                        ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                            >
                                <span>{stream.name}</span>
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        stream.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Stream Sub-navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setSubTab('rules')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                subTab === 'phases'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Jadwal 6 Fase (CFG-03)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubTab('categories')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                subTab === 'categories'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Kategori & Singkatan (CFG-04)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSubTab('parameters')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                subTab === 'parameters'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Parameter Penilaian (CFG-05)
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-semibold">Status Stream:</span>
                        <button
                            type="button"
                            onClick={() => handleToggleStream(currentStream.id)}
                            className="flex items-center gap-1 font-bold text-slate-700 hover:text-emerald-700"
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
                title="Pengaturan Event BMG (CFG-01)"
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
        </AppLayout>
    );
}
