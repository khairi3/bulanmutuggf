import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Award,
    CheckCircle2,
    Save,
    Send,
    ChevronLeft,
    ChevronRight,
    FileText,
    Video,
    ExternalLink,
    Play,
    Pause,
    RotateCcw,
    Clock,
    AlertTriangle,
    Info,
    HelpCircle,
    Users,
    Maximize2,
    Sparkles,
    Lock
} from 'lucide-react';

export default function JudgeProjectShow({
    project,
    presentationFile,
    videoFile,
    scoringParameters = [],
    myScoreSheet,
    prevProjectId,
    nextProjectId
}) {
    const { flash } = usePage().props;

    // Tabs for Left Panel
    const [activeLeftTab, setActiveLeftTab] = useState('presentation'); // 'presentation', 'video', 'charter'

    // Timer State (15 minutes default for Convention presentation & Q&A)
    const [timerSeconds, setTimerSeconds] = useState(15 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isTimerRunning && timerSeconds > 0) {
            interval = setInterval(() => {
                setTimerSeconds(sec => sec - 1);
            }, 1000);
        } else if (timerSeconds === 0) {
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timerSeconds]);

    const formatTimer = (totalSec) => {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const resetTimer = (mins = 15) => {
        setIsTimerRunning(false);
        setTimerSeconds(mins * 60);
    };

    // Initialize Scores State
    const existingScoresMap = {};
    if (myScoreSheet?.items) {
        myScoreSheet.items.forEach(item => {
            existingScoresMap[item.scoring_parameter_id] = {
                score: item.score ?? '',
                notes: item.notes ?? '',
            };
        });
    }

    const [scores, setScores] = useState(() => {
        const init = {};
        scoringParameters.forEach(param => {
            init[param.id] = {
                score: existingScoresMap[param.id]?.score ?? '',
                notes: existingScoresMap[param.id]?.notes ?? '',
            };
        });
        return init;
    });

    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitConfirmModal, setSubmitConfirmModal] = useState(false);
    const [validationError, setValidationError] = useState('');

    const isLocked = myScoreSheet?.status === 'submitted';

    // Calculate Live Weighted Total
    const calculateTotalWeighted = () => {
        let total = 0;
        scoringParameters.forEach(p => {
            const raw = parseFloat(scores[p.id]?.score);
            if (!isNaN(raw)) {
                total += (raw * p.weight) / 100;
            }
        });
        return Math.round(total * 100) / 100;
    };

    const currentTotalWeighted = calculateTotalWeighted();

    // Check if all parameters are filled (required for submit)
    const isAllParametersFilled = scoringParameters.length > 0 && scoringParameters.every(p => {
        const val = parseFloat(scores[p.id]?.score);
        return !isNaN(val) && val >= 0 && val <= 100;
    });

    const handleScoreChange = (paramId, value) => {
        if (isLocked) return;
        setValidationError('');
        let numVal = value === '' ? '' : Math.max(0, Math.min(100, Number(value)));
        setScores(prev => ({
            ...prev,
            [paramId]: {
                ...prev[paramId],
                score: numVal,
            }
        }));
    };

    const handleNotesChange = (paramId, value) => {
        if (isLocked) return;
        setScores(prev => ({
            ...prev,
            [paramId]: {
                ...prev[paramId],
                notes: value,
            }
        }));
    };

    const handleSave = (submit = false) => {
        if (submit && !isAllParametersFilled) {
            setValidationError('Seluruh parameter penilaian wajib diisi dengan nilai antara 0 - 100 sebelum melakukan submit final.');
            return;
        }

        const payload = Object.entries(scores).map(([paramId, data]) => ({
            scoring_parameter_id: parseInt(paramId, 10),
            score: data.score === '' ? 0 : parseFloat(data.score),
            notes: data.notes || '',
        }));

        if (submit) {
            setIsSubmitting(true);
        } else {
            setIsSavingDraft(true);
        }

        router.post(`/judge/projects/${project.id}/score`, {
            scores: payload,
            submit: submit,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsSavingDraft(false);
                setIsSubmitting(false);
                setSubmitConfirmModal(false);
            },
        });
    };

    // Charter version details
    const charterData = project.current_version?.charter_data || {};
    const teamMembers = project.team_members || [];

    return (
        <AppLayout>
            <Head title={`Penjurian - ${project.registration_code}`} />

            <div className="space-y-4">
                {/* Top Cockpit Header Bar */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/judge/dashboard"
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                            title="Kembali ke Dashboard"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 border border-purple-200">
                                    {project.registration_code}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                    Stream: {project.stream?.name}
                                </span>
                                {isLocked ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        <Lock className="w-3 h-3 text-emerald-600" /> Nilai Disubmit
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                        <Clock className="w-3 h-3 text-amber-600" /> Mode Penilaian Aktif
                                    </span>
                                )}
                            </div>
                            <h2 className="text-lg font-black text-slate-900 mt-1 leading-snug">
                                {project.title}
                            </h2>
                            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>Ketua: <strong>{project.leader?.full_name}</strong></span>
                                <span>•</span>
                                <span>Unit: {project.leader?.unit}</span>
                            </p>
                        </div>
                    </div>

                    {/* Right top widgets: Convention Timer & Navigation */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Presentation Timer Widget */}
                        <div className="bg-slate-900 text-white px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-inner">
                            <Clock className={`w-4 h-4 ${isTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                            <span className="font-mono text-base font-black tracking-wider text-emerald-400">
                                {formatTimer(timerSeconds)}
                            </span>
                            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
                                <button
                                    type="button"
                                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
                                    title={isTimerRunning ? 'Pause' : 'Start'}
                                >
                                    {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => resetTimer(15)}
                                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
                                    title="Reset ke 15 Menit"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Prev / Next Project Navigation (JUR-06) */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            {prevProjectId ? (
                                <Link
                                    href={`/judge/projects/${prevProjectId}`}
                                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white transition"
                                    title="Project Sebelumnya"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Link>
                            ) : (
                                <span className="p-1.5 text-slate-300 cursor-not-allowed">
                                    <ChevronLeft className="w-4 h-4" />
                                </span>
                            )}

                            <span className="text-xs font-bold text-slate-500 px-1">Navigasi</span>

                            {nextProjectId ? (
                                <Link
                                    href={`/judge/projects/${nextProjectId}`}
                                    className="p-1.5 rounded-lg text-slate-700 hover:bg-white transition"
                                    title="Project Berikutnya"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <span className="p-1.5 text-slate-300 cursor-not-allowed">
                                    <ChevronRight className="w-4 h-4" />
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* SPLIT SCREEN COCKPIT (Left: Materials, Right: Rubric Scoring) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT PANEL: Materials & Charter (col 7) */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[680px]">
                        {/* Tabs Bar */}
                        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveLeftTab('presentation')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs border-b-2 transition ${
                                    activeLeftTab === 'presentation'
                                        ? 'bg-white border-purple-600 text-purple-700 shadow-sm'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                Presentasi Final (PDF)
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveLeftTab('video')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs border-b-2 transition ${
                                    activeLeftTab === 'video'
                                        ? 'bg-white border-purple-600 text-purple-700 shadow-sm'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Video className="w-4 h-4" />
                                Video Inovasi
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveLeftTab('charter')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs border-b-2 transition ${
                                    activeLeftTab === 'charter'
                                        ? 'bg-white border-purple-600 text-purple-700 shadow-sm'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                Charter & Data Dampak
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-4 sm:p-6 flex-1 flex flex-col">
                            {/* TAB 1: PRESENTATION VIEWER */}
                            {activeLeftTab === 'presentation' && (
                                <div className="flex-1 flex flex-col">
                                    {presentationFile ? (
                                        <div className="flex-1 flex flex-col space-y-3">
                                            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                                <span className="font-semibold text-slate-700 truncate max-w-sm">
                                                    {presentationFile.original_name}
                                                </span>
                                                <a
                                                    href={`/judge/projects/${project.id}/files/${presentationFile.id}/download`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-purple-700 font-bold hover:underline"
                                                >
                                                    <Maximize2 className="w-3.5 h-3.5" /> Buka Layar Penuh
                                                </a>
                                            </div>
                                            <div className="flex-1 min-h-[560px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative">
                                                <iframe
                                                    src={`/judge/projects/${project.id}/files/${presentationFile.id}/download`}
                                                    className="w-full h-full min-h-[560px]"
                                                    title="Materi Presentasi Final"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <FileText className="w-12 h-12 text-slate-300 mb-2" />
                                            <p className="font-bold text-slate-700">File Presentasi Belum Diunggah</p>
                                            <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                                Peserta belum melampirkan berkas presentasi PDF pada tahapan convention ini.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: VIDEO VIEWER */}
                            {activeLeftTab === 'video' && (
                                <div className="flex-1 flex flex-col">
                                    {videoFile ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                                <span className="font-semibold text-slate-700">{videoFile.original_name}</span>
                                            </div>
                                            <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                                                <video
                                                    controls
                                                    src={`/judge/projects/${project.id}/files/${videoFile.id}/download`}
                                                    className="w-full h-full max-h-[500px]"
                                                >
                                                    Browser Anda tidak mendukung tag video.
                                                </video>
                                            </div>
                                        </div>
                                    ) : project.video_url ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                                <span className="font-semibold text-slate-700">Tautan Video Eksternal:</span>
                                                <a
                                                    href={project.video_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline"
                                                >
                                                    Buka di Tab Baru <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                            <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                                                <iframe
                                                    src={project.video_url.replace('watch?v=', 'embed/')}
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                    title="Video Inovasi Peserta"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <Video className="w-12 h-12 text-slate-300 mb-2" />
                                            <p className="font-bold text-slate-700">Tidak Ada Video Inovasi</p>
                                            <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                                Peserta tidak melampirkan berkas video atau tautan video eksternal.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: CHARTER & DATA DAMPAK */}
                            {activeLeftTab === 'charter' && (
                                <div className="space-y-5 text-sm text-slate-700 overflow-y-auto max-h-[600px] pr-2">
                                    {/* Problem & Goal */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                            <h4 className="font-black text-xs text-slate-500 uppercase tracking-wider mb-1">
                                                Latar Belakang & Masalah
                                            </h4>
                                            <p className="text-xs text-slate-700 whitespace-pre-line">
                                                {charterData.background || charterData.problem_statement || project.current_version?.problem_statement || '-'}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                            <h4 className="font-black text-xs text-slate-500 uppercase tracking-wider mb-1">
                                                Sasaran & Metodologi
                                            </h4>
                                            <p className="text-xs text-slate-700 whitespace-pre-line">
                                                {charterData.goal || charterData.methodology || project.current_version?.methodology || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metrics / Dampak Sebelum & Sesudah */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <h4 className="font-black text-xs text-slate-500 uppercase tracking-wider mb-2">
                                            Ringkasan Dampak / Hasil Inovasi
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase">Kondisi Sebelum</span>
                                                <p className="text-xs text-slate-700 mt-1">
                                                    {charterData.baseline_condition || charterData.before || 'Data baseline awal...'}
                                                </p>
                                            </div>
                                            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-200">
                                                <span className="text-[11px] font-bold text-emerald-700 uppercase">Kondisi Sesudah</span>
                                                <p className="text-xs text-slate-700 mt-1">
                                                    {charterData.after_condition || charterData.after || 'Data pencapaian hasil inovasi...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team Members List */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <h4 className="font-black text-xs text-slate-500 uppercase tracking-wider mb-2">
                                            Susunan Anggota Tim
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                                                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">Ketua Tim</span>
                                                <p className="font-bold text-slate-800 mt-1">{project.leader?.full_name}</p>
                                                <p className="text-[11px] text-slate-400">{project.leader?.unit}</p>
                                            </div>
                                            {teamMembers.map((tm, idx) => (
                                                <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Anggota</span>
                                                    <p className="font-bold text-slate-800 mt-1">{tm.employee?.full_name || tm.name}</p>
                                                    <p className="text-[11px] text-slate-400">{tm.employee?.unit || tm.unit || '-'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Rubric Scoring Cockpit (col 5) */}
                    <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6 sticky top-20">
                        {/* Cockpit Header with Live Weighted Score */}
                        <div className="bg-gradient-to-tr from-purple-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                                        Total Nilai Juri (Tertimbang)
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-4xl font-black text-white">
                                            {currentTotalWeighted.toFixed(2)}
                                        </span>
                                        <span className="text-xs text-purple-300 font-medium">/ 100</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 text-white backdrop-blur-md">
                                        <Award className="w-3.5 h-3.5 text-amber-300" />
                                        Blind Scoring
                                    </div>
                                    <p className="text-[11px] text-purple-200 mt-1">
                                        Independen & Rahasia
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Validation Error Alert */}
                        {validationError && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                <span>{validationError}</span>
                            </div>
                        )}

                        {/* Parameter Scoring Form */}
                        <div className="space-y-5 max-h-[460px] overflow-y-auto pr-1">
                            {scoringParameters.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    Belum ada parameter penilaian tahap Convention Day yang dikonfigurasi untuk stream ini.
                                </div>
                            ) : (
                                scoringParameters.map((param, index) => {
                                    const paramScore = scores[param.id]?.score ?? '';
                                    const paramNotes = scores[param.id]?.notes ?? '';
                                    const weightedContribution = paramScore !== ''
                                        ? ((parseFloat(paramScore) * param.weight) / 100).toFixed(2)
                                        : '0.00';

                                    return (
                                        <div
                                            key={param.id}
                                            className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3 transition hover:border-purple-300 hover:bg-slate-50"
                                        >
                                            {/* Header Parameter */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[11px] font-black">
                                                            {index + 1}
                                                        </span>
                                                        <h4 className="font-bold text-xs text-slate-900 leading-tight">
                                                            {param.name}
                                                        </h4>
                                                    </div>
                                                    {param.description && (
                                                        <p className="text-[11px] text-slate-500 mt-1 ml-7">
                                                            {param.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <span className="font-bold text-xs bg-purple-50 text-purple-800 px-2 py-0.5 rounded-lg border border-purple-200 whitespace-nowrap flex-shrink-0">
                                                    Bobot {param.weight}%
                                                </span>
                                            </div>

                                            {/* Slider & Numeric Input */}
                                            <div className="space-y-2 pt-1">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        value={paramScore === '' ? 0 : paramScore}
                                                        disabled={isLocked}
                                                        onChange={(e) => handleScoreChange(param.id, e.target.value)}
                                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
                                                    />
                                                    <div className="w-20 flex-shrink-0 relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            placeholder="0-100"
                                                            value={paramScore}
                                                            disabled={isLocked}
                                                            onChange={(e) => handleScoreChange(param.id, e.target.value)}
                                                            className="w-full text-center text-sm font-black py-1.5 px-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                                    <span>Skala: 0 - 100</span>
                                                    <span>Kontribusi Nilai: <strong className="text-purple-700">+{weightedContribution}</strong></span>
                                                </div>
                                            </div>

                                            {/* Rubric hints (if provided in parameter) */}
                                            {param.rubric && Array.isArray(param.rubric) && param.rubric.length > 0 && (
                                                <div className="text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-200 space-y-1">
                                                    <span className="font-bold text-slate-700 block text-[10px] uppercase">Panduan Rubrik:</span>
                                                    {param.rubric.map((r, rIdx) => (
                                                        <div key={rIdx} className="flex justify-between">
                                                            <span>{r.label || r.level}:</span>
                                                            <span className="font-medium text-slate-700">{r.description || r.score_range}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Catatan / Justifikasi Nilai */}
                                            <div>
                                                <textarea
                                                    rows={1}
                                                    placeholder="Catatan / justifikasi penilaian juri (opsional)..."
                                                    value={paramNotes}
                                                    disabled={isLocked}
                                                    onChange={(e) => handleNotesChange(param.id, e.target.value)}
                                                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100"
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            {!isLocked ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleSave(false)}
                                        disabled={isSavingDraft}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-sm disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4 text-slate-500" />
                                        {isSavingDraft ? 'Menyimpan...' : 'Simpan Draf'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSubmitConfirmModal(true)}
                                        disabled={isSubmitting || !isAllParametersFilled}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition disabled:opacity-40"
                                    >
                                        <Send className="w-4 h-4" />
                                        Submit Nilai Final Juri
                                    </button>
                                </>
                            ) : (
                                <div className="w-full flex items-center justify-between bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span className="font-bold">Nilai Anda telah disubmit dan terkunci.</span>
                                    </div>
                                    {nextProjectId && (
                                        <Link
                                            href={`/judge/projects/${nextProjectId}`}
                                            className="inline-flex items-center gap-1 font-bold text-emerald-800 underline hover:text-emerald-950"
                                        >
                                            Project Berikutnya <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CONFIRM FINAL SUBMIT MODAL */}
            {submitConfirmModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                            <Send className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-black text-slate-900">Submit Nilai Final Juri?</h3>
                            <p className="text-xs text-slate-600 mt-2">
                                Anda akan mengunci nilai untuk project <strong>{project.registration_code}</strong> dengan total nilai tertimbang:
                            </p>
                            <div className="my-4 p-3 bg-purple-50 rounded-2xl border border-purple-200 text-purple-900">
                                <span className="text-3xl font-black">{currentTotalWeighted.toFixed(2)}</span>
                                <span className="text-xs font-bold ml-1">/ 100</span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Setelah disubmit, nilai Anda akan resmi masuk dalam perhitungan akhir komite BMG dan terkunci secara independen.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setSubmitConfirmModal(false)}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                            >
                                Kembali Periksa
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSave(true)}
                                disabled={isSubmitting}
                                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                            >
                                {isSubmitting ? 'Mengunci Nilai...' : 'Ya, Submit Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
