import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Button from '@/Components/Button';
import Input from '@/Components/Input';
import Stepper from '@/Components/Stepper';
import EmployeeAutocomplete from '@/Components/EmployeeAutocomplete';
import {
    Layers,
    Users,
    Tag,
    FileText,
    UploadCloud,
    CheckSquare,
    ArrowRight,
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    CheckCircle2,
    AlertCircle,
    Clock,
    Sparkles,
    Paperclip,
    FileSpreadsheet,
    Film,
} from 'lucide-react';

export default function RegisterWizard({ activeEvent, streams, currentEmployee }) {
    const [step, setStep] = useState(0); // 0 to 5 (6 steps)
    const [projectId, setProjectId] = useState(null);
    const [autosaveStatus, setAutosaveStatus] = useState('Draft belum disimpan');
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    // Wizard Form Data
    const [selectedStreamId, setSelectedStreamId] = useState(streams?.[0]?.id || null);
    const [teamMembers, setTeamMembers] = useState([]); // array of employee objects
    const [categoryOptions, setCategoryOptions] = useState({}); // { [dimensionId]: optionId }
    const [charter, setCharter] = useState({
        title: '',
        executive_summary: '',
        problem_statement: '',
        goal_statement: '',
        milestones: [
            { milestone: 'Identifikasi Masalah & Pengumpulan Data Awal', target_date: '', pic: currentEmployee?.full_name || '', status: 'Done' },
            { milestone: 'Analisis Akar Masalah (Root Cause Analysis)', target_date: '', pic: currentEmployee?.full_name || '', status: 'In Progress' },
        ],
        initiatives: [
            { initiative: 'Inisiatif Utama Perbaikan', description: 'Deskripsi inisiatif implementasi di lapangan' },
        ],
        results: [
            { metric_name: 'Efisiensi Operasional', unit: '%', baseline: '100', target: '120', actual: '118', narrative: 'Peningkatan efisiensi' },
        ],
    });
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [externalVideoUrl, setExternalVideoUrl] = useState('');
    const [agreeOriginality, setAgreeOriginality] = useState(false);
    const [submitErrors, setSubmitErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState(null);

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['ppt', 'pptx'].includes(ext)) return <FileText className="w-5 h-5 text-orange-600 shrink-0" />;
        if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />;
        if (['mp4', 'mov', 'avi'].includes(ext)) return <Film className="w-5 h-5 text-purple-600 shrink-0" />;
        return <FileText className="w-5 h-5 text-blue-600 shrink-0" />;
    };

    const addValidFiles = (files) => {
        setFileError(null);
        const maxSizeBytes = 20 * 1024 * 1024; // 20 MB per file
        const allowedExtensions = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'mp4'];

        const valid = [];
        for (const f of files) {
            const ext = f.name.split('.').pop()?.toLowerCase();
            if (!allowedExtensions.includes(ext)) {
                setFileError(`Format file "${f.name}" tidak didukung. Harap unggah PPT, PDF, XLS, JPG, PNG, atau MP4.`);
                continue;
            }
            if (f.size > maxSizeBytes) {
                setFileError(`Ukuran file "${f.name}" (${formatBytes(f.size)}) melebihi batas maksimal 20 MB.`);
                continue;
            }
            valid.push(f);
        }

        if (valid.length > 0) {
            setUploadedFiles((prev) => [...prev, ...valid]);
        }
    };

    const handleFilesAdded = (e) => {
        const files = Array.from(e.target.files || []);
        addValidFiles(files);
        if (e.target) e.target.value = '';
    };

    const handleRemoveFile = (indexToRemove) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    };

    const currentStream = streams.find((s) => s.id === parseInt(selectedStreamId)) || streams[0];

    const wizardSteps = [
        { label: 'Pilih Stream' },
        { label: 'Susunan Tim' },
        { label: 'Kategori' },
        { label: 'Project Charter' },
        { label: 'Unggah Berkas' },
        { label: 'Review & Submit' },
    ];

    // Pre-select options for stream when stream changes
    useEffect(() => {
        if (currentStream) {
            const defaults = {};
            currentStream.category_dimensions?.forEach((dim) => {
                if (dim.options?.length > 0) {
                    defaults[dim.id] = dim.options[0].id;
                }
            });
            setCategoryOptions(defaults);
        }
    }, [selectedStreamId]);

    // Live prefix code preview (Bagian 3.3)
    const computePrefixPreview = () => {
        if (!currentStream) return '???-001';
        if (currentStream.code === 'K3') return 'SIGAP-001';
        if (currentStream.code === 'ENERGY') return 'ENRG-001';

        // Order by dimension code_order
        const selectedOptionIds = Object.values(categoryOptions);
        const selectedOpts = currentStream.category_dimensions
            ?.flatMap((d) => d.options)
            .filter((opt) => selectedOptionIds.includes(opt.id));

        const abbrs = selectedOpts?.map((o) => o.abbreviation).join('');
        return abbrs ? `${abbrs}-001` : `${currentStream.code}-001`;
    };

    // Autosave Draft Function (PAR-02)
    const performAutosave = async () => {
        if (!currentStream) return;
        setIsSavingDraft(true);

        const payload = {
            project_id: projectId,
            stream_id: currentStream.id,
            title: charter.title || 'Draft Project ' + currentStream.name,
            executive_summary: charter.executive_summary,
            problem_statement: charter.problem_statement,
            goal_statement: charter.goal_statement,
            milestones: charter.milestones,
            initiatives: charter.initiatives,
            results: charter.results,
            category_option_ids: Object.values(categoryOptions),
            member_employee_ids: teamMembers.map((m) => m.id),
        };

        try {
            const res = await fetch('/participant/projects/draft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                if (!projectId) setProjectId(data.project_id);
                setAutosaveStatus(`Draft otomatis tersimpan pukul ${data.saved_at}`);
            }
        } catch (err) {
            console.error('Autosave error:', err);
        } finally {
            setIsSavingDraft(false);
        }
    };

    // Periodic Autosave every 30 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            performAutosave();
        }, 30000);
        return () => clearInterval(timer);
    }, [projectId, selectedStreamId, charter, teamMembers, categoryOptions]);

    const handleNextStep = () => {
        performAutosave();
        setStep((prev) => Math.min(prev + 1, 5));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrevStep = () => {
        setStep((prev) => Math.max(prev - 1, 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Milestone Dynamic Table
    const addMilestone = () => {
        setCharter({
            ...charter,
            milestones: [
                ...charter.milestones,
                { milestone: '', target_date: '', pic: '', status: 'Plan' },
            ],
        });
    };

    const removeMilestone = (idx) => {
        setCharter({
            ...charter,
            milestones: charter.milestones.filter((_, i) => i !== idx),
        });
    };

    // Initiatives Dynamic List
    const addInitiative = () => {
        setCharter({
            ...charter,
            initiatives: [
                ...charter.initiatives,
                { initiative: '', description: '' },
            ],
        });
    };

    const removeInitiative = (idx) => {
        setCharter({
            ...charter,
            initiatives: charter.initiatives.filter((_, i) => i !== idx),
        });
    };

    // Final Submit Handler
    const handleSubmit = () => {
        setIsSubmitting(true);
        setSubmitErrors({});

        const payload = {
            project_id: projectId,
            stream_id: currentStream.id,
            title: charter.title,
            executive_summary: charter.executive_summary,
            problem_statement: charter.problem_statement,
            goal_statement: charter.goal_statement,
            milestones: charter.milestones,
            initiatives: charter.initiatives,
            results: charter.results,
            category_option_ids: Object.values(categoryOptions),
            member_employee_ids: teamMembers.map((m) => m.id),
            external_url: externalVideoUrl,
            files: uploadedFiles,
            agree_originality: agreeOriginality,
        };

        router.post('/participant/projects/submit', payload, {
            forceFormData: true,
            onError: (errs) => {
                setSubmitErrors(errs);
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AppLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Registrasi Tim & Project Charter
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Bulan Mutu GGF 2026 · Wizard Pendaftaran 6 Langkah
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{autosaveStatus}</span>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            loading={isSavingDraft}
                            onClick={performAutosave}
                        >
                            <Save className="w-3.5 h-3.5 mr-1" />
                            <span>Simpan Draft</span>
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Registrasi Tim & Charter - Bulan Mutu GGF" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* 1. Progress Stepper */}
                <Card className="py-2 px-4">
                    <Stepper steps={wizardSteps} currentStep={step} />
                </Card>

                {/* Validation Error Banner */}
                {Object.keys(submitErrors).length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800">
                            <AlertCircle className="w-4 h-4" />
                            <span>Terdapat field yang belum lengkap:</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-0.5">
                            {Object.values(submitErrors).map((msg, i) => (
                                <li key={i}>{msg}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* STEP 0: PILIH STREAM */}
                {step === 0 && (
                    <Card
                        title="Langkah 1: Pilih Stream Lomba"
                        subtitle="Pilih kategori stream kompetisi Bulan Mutu GGF 2026 yang akan Anda ikuti"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {streams.map((s) => {
                                const isSelected = selectedStreamId === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => setSelectedStreamId(s.id)}
                                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-4 ring-emerald-500/10'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                                                {s.code}
                                            </span>
                                            {isSelected && (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                            )}
                                        </div>
                                        <h4 className="font-bold text-base text-slate-900 mb-1">{s.name}</h4>
                                        <p className="text-xs text-slate-500 mb-3">
                                            Tim: {s.team_min} - {s.team_max} orang · Maks: {s.max_projects_per_employee} project/karyawan
                                        </p>
                                        <span className="text-[11px] font-bold text-emerald-700">
                                            Format: {s.code_pattern}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* STEP 1: SUSUNAN DATA TIM */}
                {step === 1 && (
                    <Card
                        title="Langkah 2: Data & Anggota Tim"
                        subtitle={`Stream ${currentStream.name}: Jumlah tim minimal ${currentStream.team_min} dan maksimal ${currentStream.team_max} orang (termasuk Ketua).`}
                    >
                        <div className="space-y-6">
                            {/* Ketua Tim (Read-only) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Ketua Tim (Otomatis dari Akun Login)
                                </label>
                                <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/60 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                                            {currentEmployee?.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-slate-900">
                                                {currentEmployee?.full_name} (Ketua Tim)
                                            </span>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                {currentEmployee?.employee_index} · {currentEmployee?.unit} · {currentEmployee?.employee_level}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                                        Ketua
                                    </span>
                                </div>
                            </div>

                            {/* Tambah Anggota via Autocomplete */}
                            <div>
                                <EmployeeAutocomplete
                                    label="Tambah Anggota Tim (EMP-03 Autocomplete)"
                                    placeholder="Ketik NIK atau Nama karyawan untuk menambah anggota..."
                                    onSelect={(emp) => {
                                        if (emp.id === currentEmployee?.id) {
                                            alert('Ketua tim sudah terdaftar otomatis.');
                                            return;
                                        }
                                        if (teamMembers.some((m) => m.id === emp.id)) {
                                            alert('Karyawan sudah ditambahkan ke tim.');
                                            return;
                                        }
                                        if (teamMembers.length + 1 >= currentStream.team_max) {
                                            alert(`Batas maksimal anggota tim stream ini adalah ${currentStream.team_max} orang.`);
                                            return;
                                        }
                                        setTeamMembers([...teamMembers, emp]);
                                    }}
                                />
                            </div>

                            {/* Daftar Anggota Terpilih */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Daftar Anggota Tambahan ({teamMembers.length} orang)
                                    </span>
                                    <span className="text-xs font-bold text-slate-600">
                                        Total Tim: {teamMembers.length + 1} / {currentStream.team_max} orang
                                    </span>
                                </div>

                                {teamMembers.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-2">
                                        Belum ada anggota tambahan yang dipilih. Gunakan pencarian di atas untuk menambahkan.
                                    </p>
                                ) : (
                                    teamMembers.map((m, idx) => (
                                        <div
                                            key={m.id}
                                            className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                                                    {m.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm text-slate-900">{m.full_name}</span>
                                                    <p className="text-xs text-slate-500 font-mono">
                                                        {m.employee_index} · {m.unit} · {m.employee_level || 'Staff'}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
                                                className="text-slate-400 hover:text-rose-600 p-1"
                                                title="Hapus Anggota"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* STEP 2: PILIH KATEGORI STREAM & LIVE CODE PREVIEW */}
                {step === 2 && (
                    <Card
                        title="Langkah 3: Kategori Lomba & Format Kode"
                        subtitle="Pilih dimensi perbaikan. Sistem otomatis menampilkan format kode registrasi Anda."
                    >
                        <div className="space-y-6">
                            {/* Live Prefix Banner */}
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between shadow-md">
                                <div>
                                    <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                                        Pratinjau Kode Registrasi Unik
                                    </p>
                                    <h3 className="text-2xl font-black font-mono tracking-wider mt-1">
                                        {computePrefixPreview()}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Nomor urut (001, dst) diterbitkan dengan aman saat Anda klik Submit.
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
                                    #
                                </div>
                            </div>

                            {/* Dimensions Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentStream.category_dimensions?.map((dim) => (
                                    <div key={dim.id} className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-800">
                                            {dim.name} {dim.is_required && <span className="text-rose-500">*</span>}
                                        </label>
                                        <select
                                            value={categoryOptions[dim.id] || ''}
                                            onChange={(e) =>
                                                setCategoryOptions({
                                                    ...categoryOptions,
                                                    [dim.id]: parseInt(e.target.value),
                                                })
                                            }
                                            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                                        >
                                            {dim.options?.map((opt) => (
                                                <option key={opt.id} value={opt.id}>
                                                    {opt.name} ({opt.abbreviation})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* STEP 3: PROJECT CHARTER (Task 3.3) */}
                {step === 3 && (
                    <Card
                        title="Langkah 4: Pengisian Project Charter"
                        subtitle="Lengkapi deskripsi ringkas, latar belakang, tujuan, tahapan milestone, dan inisiatif perbaikan."
                    >
                        <div className="space-y-5">
                            {/* Judul Project */}
                            <div>
                                <Input
                                    id="title"
                                    label="Judul Project Perbaikan"
                                    maxLength={150}
                                    placeholder="Contoh: Otomasi Sortir Buah Nanas dengan AI Vision di Packing House PG1"
                                    value={charter.title}
                                    onChange={(e) => setCharter({ ...charter, title: e.target.value })}
                                    helperText={`${charter.title.length}/150 karakter`}
                                    required
                                />
                            </div>

                            {/* Executive Summary */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1">
                                    Executive Summary <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    maxLength={1500}
                                    placeholder="Ringkasan eksekutif latar belakang, solusi terobosan, dan dampak utama perbaikan..."
                                    value={charter.executive_summary}
                                    onChange={(e) => setCharter({ ...charter, executive_summary: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                                    required
                                />
                                <span className="text-[11px] text-slate-400 block text-right">
                                    {charter.executive_summary.length}/1500 karakter
                                </span>
                            </div>

                            {/* Problem Statement */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1">
                                    Problem Statement (Rumusan Masalah) <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    maxLength={1500}
                                    placeholder="Jelaskan secara spesifik masalah di lapangan, data kerugian/biaya/waktu yang terjadi..."
                                    value={charter.problem_statement}
                                    onChange={(e) => setCharter({ ...charter, problem_statement: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                                    required
                                />
                                <span className="text-[11px] text-slate-400 block text-right">
                                    {charter.problem_statement.length}/1500 karakter
                                </span>
                            </div>

                            {/* Goal Statement */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1">
                                    Goal Statement / Objective (Target yang Ingin Dicapai) <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={2}
                                    maxLength={1000}
                                    placeholder="Target spesifik yang terukur (misal: Menurunkan reject buah dari 12% menjadi 3% dalam 3 bulan)..."
                                    value={charter.goal_statement}
                                    onChange={(e) => setCharter({ ...charter, goal_statement: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                                    required
                                />
                                <span className="text-[11px] text-slate-400 block text-right">
                                    {charter.goal_statement.length}/1000 karakter
                                </span>
                            </div>

                            {/* Key Milestones Dynamic Table */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-800">
                                        Key Milestones (Jadwal Tahapan Penting) <span className="text-rose-500">*</span>
                                    </label>
                                    <Button variant="outline" size="sm" onClick={addMilestone}>
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        <span>Tambah Baris</span>
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {charter.milestones.map((m, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nama Milestone..."
                                                value={m.milestone}
                                                onChange={(e) => {
                                                    const updated = [...charter.milestones];
                                                    updated[i].milestone = e.target.value;
                                                    setCharter({ ...charter, milestones: updated });
                                                }}
                                                className="flex-2 p-2 rounded-lg border border-slate-300 text-xs"
                                                required
                                            />
                                            <input
                                                type="date"
                                                value={m.target_date}
                                                onChange={(e) => {
                                                    const updated = [...charter.milestones];
                                                    updated[i].target_date = e.target.value;
                                                    setCharter({ ...charter, milestones: updated });
                                                }}
                                                className="p-2 rounded-lg border border-slate-300 text-xs w-36"
                                            />
                                            <input
                                                type="text"
                                                placeholder="PIC"
                                                value={m.pic}
                                                onChange={(e) => {
                                                    const updated = [...charter.milestones];
                                                    updated[i].pic = e.target.value;
                                                    setCharter({ ...charter, milestones: updated });
                                                }}
                                                className="p-2 rounded-lg border border-slate-300 text-xs w-28"
                                            />
                                            <button
                                                type="button"
                                                disabled={charter.milestones.length <= 1}
                                                onClick={() => removeMilestone(i)}
                                                className="text-slate-400 hover:text-rose-600 p-1.5 disabled:opacity-30"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Initiatives Dynamic List */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-800">
                                        Inisiatif Tindakan Perbaikan <span className="text-rose-500">*</span>
                                    </label>
                                    <Button variant="outline" size="sm" onClick={addInitiative}>
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        <span>Tambah Inisiatif</span>
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {charter.initiatives.map((init, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nama Inisiatif..."
                                                value={init.initiative}
                                                onChange={(e) => {
                                                    const updated = [...charter.initiatives];
                                                    updated[i].initiative = e.target.value;
                                                    setCharter({ ...charter, initiatives: updated });
                                                }}
                                                className="flex-1 p-2 rounded-lg border border-slate-300 text-xs"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Deskripsi singkat..."
                                                value={init.description}
                                                onChange={(e) => {
                                                    const updated = [...charter.initiatives];
                                                    updated[i].description = e.target.value;
                                                    setCharter({ ...charter, initiatives: updated });
                                                }}
                                                className="flex-1 p-2 rounded-lg border border-slate-300 text-xs"
                                            />
                                            <button
                                                type="button"
                                                disabled={charter.initiatives.length <= 1}
                                                onClick={() => removeInitiative(i)}
                                                className="text-slate-400 hover:text-rose-600 p-1.5 disabled:opacity-30"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* STEP 4: UPLOAD BERKAS & VIDEO (Task 3.6) */}
                {step === 4 && (
                    <Card
                        title="Langkah 5: Berkas Pendukung & Tautan Video"
                        subtitle="Unggah dokumen pendukung (PPT/PDF/XLS/JPG) atau tautan video implementasi."
                    >
                        <div className="space-y-6">
                            {/* File Upload Dropzone */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer?.files) {
                                        addValidFiles(Array.from(e.dataTransfer.files));
                                    }
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer select-none ${
                                    isDragging
                                        ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                                        : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".pdf,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4"
                                    className="hidden"
                                    onChange={handleFilesAdded}
                                />
                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                                    <UploadCloud className="w-7 h-7" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 mb-1">
                                    Unggah Berkas Presentasi / Data Lampiran
                                </h4>
                                <p className="text-xs text-slate-500 mb-3 max-w-md mx-auto">
                                    Mendukung PPT, PPTX, PDF, XLS, XLSX, JPG, PNG, MP4. Maksimal 20 MB per file.
                                </p>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm pointer-events-none"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <span>Pilih Berkas Dari Komputer</span>
                                </button>
                                <div className="mt-3">
                                    <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                                        Berkas dapat dilengkapi saat ini atau menyusul setelah submit
                                    </span>
                                </div>
                            </div>

                            {/* Error Alert */}
                            {fileError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{fileError}</span>
                                </div>
                            )}

                            {/* Uploaded Files List */}
                            {uploadedFiles.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                                        <span>Daftar Berkas Terpilih ({uploadedFiles.length})</span>
                                        <button
                                            type="button"
                                            onClick={() => setUploadedFiles([])}
                                            className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold"
                                        >
                                            Hapus Semua
                                        </button>
                                    </div>
                                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                                        {uploadedFiles.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {getFileIcon(file.name)}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 truncate">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400">
                                                            {formatBytes(file.size)} • Siap dilampirkan
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveFile(idx);
                                                    }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                    title="Hapus berkas ini"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Video Besar External URL (PAR-05) */}
                            <div>
                                <Input
                                    id="external_url"
                                    label="Tautan Video Besar (Google Drive / OneDrive / YouTube unlisted)"
                                    placeholder="https://drive.google.com/... atau https://youtu.be/..."
                                    value={externalVideoUrl}
                                    onChange={(e) => setExternalVideoUrl(e.target.value)}
                                    helperText="Sesuai PRD PAR-05: Jika video berukuran besar, Anda dapat menempelkan link Google Drive atau YouTube."
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {/* STEP 5: REVIEW RINGKASAN & SUBMIT */}
                {step === 5 && (
                    <Card
                        title="Langkah 6: Tinjau Ringkasan & Konfirmasi Pengajuan"
                        subtitle="Periksa kembali ringkasan project sebelum mengirimkan registrasi resmi ke panitia."
                    >
                        <div className="space-y-5">
                            {/* Summary Box */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                                <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="font-bold text-slate-500">Stream Lomba:</span>
                                    <span className="font-bold text-slate-900">{currentStream.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="font-bold text-slate-500">Format Kode Registrasi:</span>
                                    <span className="font-mono font-bold text-emerald-800">{computePrefixPreview()}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="font-bold text-slate-500">Judul Project:</span>
                                    <span className="font-bold text-slate-900 text-right max-w-sm">{charter.title || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="font-bold text-slate-500">Ketua Tim:</span>
                                    <span className="font-semibold text-slate-800">{currentEmployee?.full_name} ({currentEmployee?.unit})</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="font-bold text-slate-500">Jumlah Anggota Tim:</span>
                                    <span className="font-bold text-slate-900">{teamMembers.length + 1} Orang</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="font-bold text-slate-500">Berkas Lampiran:</span>
                                    <span className="font-semibold text-slate-900">
                                        {uploadedFiles.length > 0 ? `${uploadedFiles.length} berkas dilampirkan` : 'Belum ada (opsional)'}
                                    </span>
                                </div>
                                {externalVideoUrl && (
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-bold text-slate-500">Tautan Video:</span>
                                        <span className="font-mono text-emerald-700 truncate max-w-xs">{externalVideoUrl}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-500">Key Milestones:</span>
                                    <span className="font-bold text-slate-900">{charter.milestones.length} Tahapan</span>
                                </div>
                            </div>

                            {/* Originality Checkbox */}
                            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-300">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreeOriginality}
                                        onChange={(e) => setAgreeOriginality(e.target.checked)}
                                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                    />
                                    <span className="text-xs font-semibold text-slate-800 leading-relaxed">
                                        Saya menyatakan dengan sesungguhnya bahwa karya perbaikan inovasi ini adalah karya asli tim kami dan belum pernah diajukan pada kompetisi serupa sebelumnya. Seluruh data yang dilampirkan adalah benar dan dapat dipertanggungjawabkan pada saat verifikasi lapangan.
                                    </span>
                                </label>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4">
                    {step > 0 ? (
                        <Button variant="secondary" onClick={handlePrevStep}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            <span>Kembali</span>
                        </Button>
                    ) : (
                        <Link href="/participant/dashboard">
                            <Button variant="ghost">Batal</Button>
                        </Link>
                    )}

                    {step < 5 ? (
                        <Button variant="primary" onClick={handleNextStep}>
                            <span>Lanjutkan</span>
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            loading={isSubmitting}
                            disabled={!agreeOriginality}
                            onClick={handleSubmit}
                        >
                            <CheckSquare className="w-4 h-4 mr-2" />
                            <span>Kirim & Terbitkan Kode Registrasi</span>
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
