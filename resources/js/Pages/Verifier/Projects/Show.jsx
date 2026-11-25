import React, { useState, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Card from '@/Components/Card';
import Badge from '@/Components/Badge';
import Button from '@/Components/Button';
import Input from '@/Components/Input';
import Modal from '@/Components/Modal';
import FeedbackThread from '@/Components/FeedbackThread';
import DeleteProjectModal from '@/Components/DeleteProjectModal';
import { 
    ArrowLeft, 
    FileText, 
    Award, 
    MessageSquare, 
    MapPin, 
    History, 
    Paperclip, 
    Users, 
    Calendar, 
    Building2, 
    CheckCircle2, 
    AlertCircle, 
    Camera, 
    Send, 
    Save, 
    Lock, 
    Trash2, 
    ExternalLink,
    Clock,
    Plus,
    Eye,
} from 'lucide-react';

const parseRubricDetails = (rubric) => {
    if (!rubric) return null;

    let evidence = null;
    let pass = null;
    let followUp = null;
    let notPass = null;

    // Extract Bukti di Lapangan
    const evidenceMatch = rubric.match(/(?:\[Bukti di Lapangan\]|Bukti di Lapangan):\s*([^•\n]+)/i);
    if (evidenceMatch) {
        evidence = evidenceMatch[1].trim();
    }

    // Extract Pass
    const passMatch = rubric.match(/(?:•\s*PASS|•\s*Pass|\bPASS|\bPass)\s*(?:\([^)]*\))?:\s*([^•\n]+)/i);
    if (passMatch) {
        pass = passMatch[1].trim();
    }

    // Extract Need Follow Up
    const followUpMatch = rubric.match(/(?:•\s*Need Follow Up|\bNeed Follow Up)\s*(?:\([^)]*\))?:\s*([^•\n]+)/i);
    if (followUpMatch) {
        followUp = followUpMatch[1].trim();
    }

    // Extract Not Pass or No Pass
    const notPassMatch = rubric.match(/(?:•\s*Not Pass|•\s*No Pass|\bNot Pass|\bNo Pass)\s*(?:\([^)]*\))?:\s*([^•\n]+)/i);
    if (notPassMatch) {
        notPass = notPassMatch[1].trim();
    }

    return {
        evidence,
        pass,
        followUp,
        notPass,
        noPass: notPass,
        isStandard: !!(pass || followUp || notPass || evidence),
    };
};

export default function VerifierProjectShow({
    project,
    scoringParameters,
    myScoreSheet,
    feedbacks,
    visits,
    feedbackSections,
}) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [activeTab, setActiveTab] = useState('scoring'); // Default to scoring for verifiers
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [selectedVersion, setSelectedVersion] = useState(null);

    const isScoreLocked = myScoreSheet?.status === 'submitted';
    const isDirectScoreStream = project?.stream?.code === 'ENERGY';

    // 1. Scoring Form State (Quantification: Pass = 5, Need Follow Up = 3, Not Pass = 1)
    const initialScores = useMemo(() => {
        const map = {};
        scoringParameters.forEach((param) => {
            const existingItem = myScoreSheet?.items?.find((item) => item.parameter_id === param.id);
            map[param.id] = {
                score: existingItem?.score !== null && existingItem?.score !== undefined ? existingItem.score : null,
                note: existingItem?.note || '',
            };
        });
        return map;
    }, [scoringParameters, myScoreSheet]);

    const [scores, setScores] = useState(initialScores);
    const [hoveredScore, setHoveredScore] = useState({});

    const getParamRanges = (param) => {
        const isEnergy = project?.stream?.code === 'ENERGY';
        const minScore = param?.min_score !== null && param?.min_score !== undefined ? parseFloat(param.min_score) : 1;
        const maxScore = param?.max_score !== null && param?.max_score !== undefined ? parseFloat(param.max_score) : (isEnergy ? 15 : 5);
        const notPassMin = param?.not_pass_min !== null && param?.not_pass_min !== undefined ? parseFloat(param.not_pass_min) : 1;
        const notPassMax = param?.not_pass_max !== null && param?.not_pass_max !== undefined ? parseFloat(param.not_pass_max) : (isEnergy ? 5 : 1);
        const followUpMin = param?.follow_up_min !== null && param?.follow_up_min !== undefined ? parseFloat(param.follow_up_min) : (isEnergy ? 6 : 2);
        const followUpMax = param?.follow_up_max !== null && param?.follow_up_max !== undefined ? parseFloat(param.follow_up_max) : (isEnergy ? 10 : 3);
        const passMin = param?.pass_min !== null && param?.pass_min !== undefined ? parseFloat(param.pass_min) : (isEnergy ? 11 : 4);
        const passMax = param?.pass_max !== null && param?.pass_max !== undefined ? parseFloat(param.pass_max) : (isEnergy ? 15 : 5);

        return {
            minScore,
            maxScore,
            notPassMin,
            notPassMax,
            followUpMin,
            followUpMax,
            passMin,
            passMax,
            notPassLabel: param?.not_pass_label || 'Not Pass',
            followUpLabel: param?.follow_up_label || 'Need Follow Up',
            passLabel: param?.pass_label || 'Pass',
            isScale15: maxScore > 5,
        };
    };

    // Helper to evaluate quantitative status (Pass, Need Follow Up, Not Pass) with dynamic ranges
    const getEvaluationStatus = (rawScore, param) => {
        if (rawScore === null || rawScore === undefined || rawScore === '' || isNaN(parseFloat(rawScore))) {
            return null;
        }
        const val = parseFloat(rawScore);
        const ranges = getParamRanges(param);

        // Compatibility for legacy 0-100 scale (if val exceeds parameter's maxScore and > 15)
        if (val > ranges.maxScore && val > 15) {
            if (val >= 85) return { key: 'pass', label: ranges.passLabel, score: ranges.passMax, color: 'emerald' };
            if (val >= 50) return { key: 'followUp', label: ranges.followUpLabel, score: ranges.followUpMax, color: 'amber' };
            return { key: 'notPass', label: ranges.notPassLabel, score: ranges.notPassMax, color: 'rose' };
        }

        if (val >= ranges.passMin) {
            return { key: 'pass', label: ranges.passLabel, score: val, color: 'emerald' };
        }
        if (val >= ranges.followUpMin) {
            return { key: 'followUp', label: ranges.followUpLabel, score: val, color: 'amber' };
        }
        return { key: 'notPass', label: ranges.notPassLabel, score: val, color: 'rose' };
    };

    // Qualitative status counts & quantitative score metrics
    const { statusSummary, scoreMetrics } = useMemo(() => {
        let pass = 0;
        let followUp = 0;
        let notPass = 0;
        let unrated = 0;
        let totalScore = 0;
        let totalWeighted = 0;
        let maxTotalScore = 0;

        scoringParameters.forEach((param) => {
            const raw = scores[param.id]?.score;
            const ranges = getParamRanges(param);
            maxTotalScore += ranges.maxScore;

            const evalResult = getEvaluationStatus(raw, param);
            if (!evalResult) {
                unrated++;
            } else {
                if (evalResult.key === 'pass') pass++;
                else if (evalResult.key === 'followUp') followUp++;
                else notPass++;

                totalScore += evalResult.score;
                const weight = param.weight !== undefined && param.weight !== null ? parseFloat(param.weight) : (100 / (scoringParameters.length || 1));
                totalWeighted += evalResult.score * (weight / 100);
            }
        });

        const ratedCount = pass + followUp + notPass;
        const avgScore = ratedCount > 0 ? totalScore / ratedCount : 0;
        const maxScale = scoringParameters.length > 0
            ? Math.max(...scoringParameters.map(p => getParamRanges(p).maxScore))
            : (project?.stream?.code === 'ENERGY' ? 15 : 5);
        const isScale15 = maxScale > 5;

        return {
            statusSummary: { pass, followUp, notPass, unrated },
            scoreMetrics: {
                totalScore: Math.round(totalScore * 100) / 100,
                maxTotalScore,
                maxScale,
                isScale15,
                avgScore: Math.round(avgScore * 100) / 100,
                totalWeighted: Math.round(totalWeighted * 100) / 100,
                ratedCount,
            }
        };
    }, [scoringParameters, scores, project?.stream?.code]);

    const handleScoreChange = (paramId, value) => {
        if (isScoreLocked) return;
        setScores((prev) => ({
            ...prev,
            [paramId]: {
                ...prev[paramId],
                score: value,
            },
        }));
    };

    const handleNoteChange = (paramId, noteText) => {
        if (isScoreLocked) return;
        setScores((prev) => ({
            ...prev,
            [paramId]: {
                ...prev[paramId],
                note: noteText,
            },
        }));
    };

    const [isSubmittingScore, setIsSubmittingScore] = useState(false);
    const [scoreErrors, setScoreErrors] = useState({});

    // Parameter completion validation
    const missingParams = useMemo(() => {
        return scoringParameters.filter((param) => {
            const raw = scores[param.id]?.score;
            return raw === null || raw === undefined || raw === '' || isNaN(parseFloat(raw));
        });
    }, [scoringParameters, scores]);

    const isAllParametersScored = missingParams.length === 0;

    const handleSaveScores = (isSubmitFinal = false) => {
        setIsSubmittingScore(true);
        setScoreErrors({});

        router.post(`/verifier/projects/${project.id}/score`, {
            scores: scores,
            submit: isSubmitFinal,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (isSubmitFinal) {
                    setIsSubmitModalOpen(false);
                }
            },
            onError: (errors) => {
                setScoreErrors(errors);
            },
            onFinish: () => {
                setIsSubmittingScore(false);
            },
        });
    };

    // 2. Feedback Form State (VER-05)
    const feedbackForm = useForm({
        charter_section: '',
        body: '',
        status: 'sent',
    });

    const handleSendFeedback = (statusType) => {
        feedbackForm.transform((data) => ({
            ...data,
            charter_section: data.charter_section || null,
            status: statusType,
        }));
        feedbackForm.post(`/verifier/projects/${project.id}/feedback`, {
            preserveScroll: true,
            onSuccess: () => {
                feedbackForm.reset('body', 'charter_section');
            },
        });
    };

    const handleDeleteFeedback = (feedbackId) => {
        if (confirm('Yakin ingin menghapus catatan feedback ini?')) {
            router.delete(`/verifier/projects/${project.id}/feedback/${feedbackId}`, {
                preserveScroll: true,
            });
        }
    };

    // 3. Visit Log Form State (VER-04)
    const visitForm = useForm({
        visit_date: new Date().toISOString().split('T')[0],
        location: '',
        notes: '',
        photos: [],
    });

    const handleVisitSubmit = (e) => {
        e.preventDefault();
        visitForm.post(`/verifier/projects/${project.id}/visits`, {
            preserveScroll: true,
            onSuccess: () => {
                visitForm.reset({
                    visit_date: new Date().toISOString().split('T')[0],
                    location: '',
                    notes: '',
                    photos: [],
                });
            },
        });
    };

    const currentVersion = project.current_version;

    return (
        <AppLayout
            header={
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Link
                            href="/verifier/dashboard"
                            className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali ke Dashboard Verifikator</span>
                        </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <Badge status={project.status} />
                                {project.registration_code && (
                                    <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-md shadow-xs tracking-wider">
                                        {project.registration_code}
                                    </span>
                                )}
                                <span className="text-xs font-semibold text-slate-500">
                                    {project.stream?.name}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
                                {project.title}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs"
                                title="Hapus Project & Berikan Alasan"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Hapus Project</span>
                            </button>

                            {isScoreLocked ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Verifikasi Terkunci</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Draf Verifikasi ({scoringParameters.length - missingParams.length}/{scoringParameters.length} Kriteria)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Verifikasi: ${project.registration_code || project.title}`} />

            <div className="space-y-6">
                {/* 1. Tab Navigation */}
                <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('scoring')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'scoring'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Award className="w-4 h-4" />
                        <span>Form Penilaian</span>
                        {isScoreLocked && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20">Terkunci</span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('charter')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'charter'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        <span>Charter & Berkas</span>
                        {currentVersion && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700">
                                v{currentVersion.version_no}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('feedback')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'feedback'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Catatan & Feedback</span>
                        {feedbacks?.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700">
                                {feedbacks.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('visit')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'visit'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <MapPin className="w-4 h-4" />
                        <span>Log Visit Lapangan</span>
                        {visits?.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700">
                                {visits.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'history'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        <span>Riwayat Versi</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700">
                            {project.charter_versions?.length || 1}
                        </span>
                    </button>
                </div>

                {/* 2. TAB CONTENT: SCORING (VER-06, VER-07, VER-08) */}
                {activeTab === 'scoring' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Parameter list (2 cols) */}
                        <div className="lg:col-span-2 space-y-4">
                            {isScoreLocked && (
                                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-emerald-900">Penilaian Telah Disubmit Final & Dikunci</h4>
                                        <p className="text-xs text-emerald-700 mt-0.5">
                                            Nilai telah tersimpan pada {myScoreSheet?.submitted_at}. Jika perlu koreksi, hubungi Administrator untuk membuka kunci nilai.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {scoringParameters.length > 0 ? (
                                scoringParameters.map((param, index) => {
                                    const rawScore = scores[param.id]?.score;
                                    const currentNote = scores[param.id]?.note ?? '';
                                    const rubricData = parseRubricDetails(param.rubric);
                                    const ranges = getParamRanges(param);
                                    const evalResult = getEvaluationStatus(rawScore, param);

                                    // Determine qualitative status & quantification
                                    const isPass = evalResult?.key === 'pass';
                                    const isFollowUp = evalResult?.key === 'followUp';
                                    const isNotPass = evalResult?.key === 'notPass';

                                    return (
                                        <Card key={param.id} className="relative overflow-hidden">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="grow">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center shrink-0">
                                                            {index + 1}
                                                        </span>
                                                        <h3 className="text-sm font-bold text-slate-900">{param.name}</h3>
                                                    </div>

                                                    {/* Bukti yang Harus Dilihat di Lapangan */}
                                                    {rubricData?.evidence && (
                                                        <div className="mt-2.5 ml-8 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-start gap-2">
                                                            <Eye className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                <span className="font-bold text-slate-700">Bukti yang Harus Dilihat:</span>{' '}
                                                                <span className="text-slate-600">{rubricData.evidence}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Fallback plain rubric if not standard format */}
                                                    {param.rubric && !rubricData?.isStandard && (
                                                        <p className="text-xs text-slate-500 mt-1 pl-8 whitespace-pre-line">
                                                            {param.rubric}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="text-right shrink-0">
                                                    {isDirectScoreStream ? (
                                                        rawScore !== null && rawScore !== undefined && rawScore !== '' ? (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl bg-slate-900 text-white shadow-xs">
                                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Skor</span>
                                                                <span className="text-sm font-black font-mono text-emerald-400">{rawScore}</span>
                                                                <span className="text-[10px] text-slate-500 font-mono">/ {ranges.maxScore}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400">
                                                                Belum Dinilai
                                                            </span>
                                                        )
                                                    ) : isPass ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>{ranges.passLabel} (Skor: {rawScore})</span>
                                                        </span>
                                                    ) : isFollowUp ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>{ranges.followUpLabel} (Skor: {rawScore})</span>
                                                        </span>
                                                    ) : isNotPass ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                                            <span>{ranges.notPassLabel} (Skor: {rawScore})</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                            Belum Ditentukan
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Scoring Input Area: Direct 1-15 for EMI vs 3 Categories for other streams */}
                                            <div className="mt-4 pt-3.5 border-t border-slate-100 pl-8">
                                                {isDirectScoreStream ? (
                                                    (() => {
                                                        const totalSteps = Math.max(1, Math.round(ranges.maxScore - ranges.minScore + 1));
                                                        const numbers = Array.from({ length: totalSteps }, (_, i) => Math.round(ranges.minScore) + i);
                                                        const currentHover = hoveredScore[param.id] ?? null;
                                                        const numericSelected =
                                                            rawScore !== null && rawScore !== undefined && rawScore !== '' && !isNaN(Number(rawScore))
                                                                ? Number(rawScore)
                                                                : null;
                                                        const activeValue = currentHover !== null ? currentHover : numericSelected;
                                                        const weightedVal =
                                                            activeValue !== null
                                                                ? ((activeValue * parseFloat(param.weight || 0)) / 100).toFixed(2)
                                                                : '0.00';

                                                        const getSegmentStyle = (num) => {
                                                            const isExact = numericSelected === num;
                                                            const isFilled = activeValue !== null && num <= activeValue;
                                                            const ratio = (num - ranges.minScore) / Math.max(1, ranges.maxScore - ranges.minScore);

                                                            if (isExact) {
                                                                if (ratio < 0.34) {
                                                                    return 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-110 z-10 ring-2 ring-white font-black';
                                                                }
                                                                if (ratio < 0.67) {
                                                                    return 'bg-teal-600 text-white shadow-md shadow-teal-600/25 scale-110 z-10 ring-2 ring-white font-black';
                                                                }
                                                                return 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-110 z-10 ring-2 ring-white font-black';
                                                            }

                                                            if (isFilled) {
                                                                if (ratio < 0.34) {
                                                                    return 'bg-amber-100/90 text-amber-900 font-bold';
                                                                }
                                                                if (ratio < 0.67) {
                                                                    return 'bg-teal-100/90 text-teal-900 font-bold';
                                                                }
                                                                return 'bg-emerald-100/90 text-emerald-950 font-bold';
                                                            }

                                                            return 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-white/70 font-semibold';
                                                        };

                                                        return (
                                                            <div className="space-y-2.5">
                                                                {/* Minimalist Header Info */}
                                                                <div className="flex items-center justify-between text-[11px]">
                                                                    <div className="flex items-center gap-2 text-slate-500">
                                                                        <span className="font-semibold text-slate-700">Skala Skor</span>
                                                                        <span className="text-slate-300">•</span>
                                                                        <span>Bobot {param.weight}%</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-slate-400">
                                                                            Kontribusi:{' '}
                                                                            <strong className="text-slate-800 font-mono">+{weightedVal}</strong>
                                                                        </span>
                                                                        {numericSelected !== null && !isScoreLocked && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleScoreChange(param.id, null)}
                                                                                className="text-[10px] text-slate-400 hover:text-rose-600 underline ml-1 cursor-pointer"
                                                                            >
                                                                                Reset
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Interactive Minimalist Segmented Track (1 - 15) */}
                                                                <div
                                                                    className="p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 flex items-center gap-1 select-none"
                                                                    onMouseLeave={() =>
                                                                        setHoveredScore((prev) => ({ ...prev, [param.id]: null }))
                                                                    }
                                                                >
                                                                    {/* Decrement Stepper */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            isScoreLocked ||
                                                                            (numericSelected !== null && numericSelected <= ranges.minScore)
                                                                        }
                                                                        onClick={() => {
                                                                            const next =
                                                                                numericSelected === null
                                                                                    ? ranges.minScore
                                                                                    : Math.max(ranges.minScore, numericSelected - 1);
                                                                            handleScoreChange(param.id, next);
                                                                        }}
                                                                        className="w-7 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 flex items-center justify-center text-xs font-bold transition disabled:opacity-35 cursor-pointer shrink-0 shadow-2xs"
                                                                        title="Kurangi 1 poin"
                                                                    >
                                                                        −
                                                                    </button>

                                                                    {/* 1..15 Pill Segments */}
                                                                    <div
                                                                        className="flex-1 grid gap-1"
                                                                        style={{
                                                                            gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))`,
                                                                        }}
                                                                    >
                                                                        {numbers.map((num) => (
                                                                            <button
                                                                                key={num}
                                                                                type="button"
                                                                                disabled={isScoreLocked}
                                                                                onMouseEnter={() =>
                                                                                    !isScoreLocked &&
                                                                                    setHoveredScore((prev) => ({
                                                                                        ...prev,
                                                                                        [param.id]: num,
                                                                                    }))
                                                                                }
                                                                                onClick={() => handleScoreChange(param.id, num)}
                                                                                className={`h-8 rounded-xl font-mono text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${getSegmentStyle(
                                                                                    num
                                                                                )} ${isScoreLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                                                                            >
                                                                                {num}
                                                                            </button>
                                                                        ))}
                                                                    </div>

                                                                    {/* Increment Stepper */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            isScoreLocked ||
                                                                            (numericSelected !== null && numericSelected >= ranges.maxScore)
                                                                        }
                                                                        onClick={() => {
                                                                            const next =
                                                                                numericSelected === null
                                                                                    ? ranges.minScore
                                                                                    : Math.min(ranges.maxScore, numericSelected + 1);
                                                                            handleScoreChange(param.id, next);
                                                                        }}
                                                                        className="w-7 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 flex items-center justify-center text-xs font-bold transition disabled:opacity-35 cursor-pointer shrink-0 shadow-2xs"
                                                                        title="Tambah 1 poin"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <>
                                                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                            Pilih Kategori Status Lapangan & Skor Kuantifikasi:
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                            {/* PASS */}
                                                            <button
                                                                type="button"
                                                                disabled={isScoreLocked}
                                                                onClick={() => handleScoreChange(param.id, ranges.passMax)}
                                                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                                    isPass
                                                                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                                                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80'
                                                                } ${isScoreLocked ? 'cursor-not-allowed opacity-75' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                                                                        <span className={`w-2.5 h-2.5 rounded-full ${isPass ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-slate-300'}`} />
                                                                        {ranges.passLabel}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                                                                            {ranges.passMin === ranges.passMax ? `Skor: ${ranges.passMax}` : `Range: ${ranges.passMin}-${ranges.passMax}`}
                                                                        </span>
                                                                        {isPass && (
                                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                                                                                Terpilih
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {rubricData?.pass ? (
                                                                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                                                                        {rubricData.pass}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[11px] text-slate-400 mt-1 italic">
                                                                        Memenuhi kriteria verifikasi lapangan dengan baik.
                                                                    </p>
                                                                )}
                                                            </button>

                                                            {/* Need Follow Up */}
                                                            <button
                                                                type="button"
                                                                disabled={isScoreLocked}
                                                                onClick={() => handleScoreChange(param.id, ranges.followUpMax)}
                                                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                                    isFollowUp
                                                                        ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                                                                        : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50/80'
                                                                } ${isScoreLocked ? 'cursor-not-allowed opacity-75' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                                                                        <span className={`w-2.5 h-2.5 rounded-full ${isFollowUp ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-slate-300'}`} />
                                                                        {ranges.followUpLabel}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                                                                            {ranges.followUpMin === ranges.followUpMax ? `Skor: ${ranges.followUpMax}` : `Range: ${ranges.followUpMin}-${ranges.followUpMax}`}
                                                                        </span>
                                                                        {isFollowUp && (
                                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-600 text-white">
                                                                                Terpilih
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {rubricData?.followUp ? (
                                                                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                                                                        {rubricData.followUp}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[11px] text-slate-400 mt-1 italic">
                                                                        Terdapat catatan perbaikan atau verifikasi lanjutan.
                                                                    </p>
                                                                )}
                                                            </button>

                                                            {/* Not Pass */}
                                                            <button
                                                                type="button"
                                                                disabled={isScoreLocked}
                                                                onClick={() => handleScoreChange(param.id, ranges.notPassMax)}
                                                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                                    isNotPass
                                                                        ? 'bg-rose-50/90 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                                                                        : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/80'
                                                                } ${isScoreLocked ? 'cursor-not-allowed opacity-75' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-black text-rose-800 flex items-center gap-1.5">
                                                                        <span className={`w-2.5 h-2.5 rounded-full ${isNotPass ? 'bg-rose-500 ring-2 ring-rose-300' : 'bg-slate-300'}`} />
                                                                        {ranges.notPassLabel}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300 font-mono">
                                                                            {ranges.notPassMin === ranges.notPassMax ? `Skor: ${ranges.notPassMax}` : `Range: ${ranges.notPassMin}-${ranges.notPassMax}`}
                                                                        </span>
                                                                        {isNotPass && (
                                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-600 text-white">
                                                                                Terpilih
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {(rubricData?.notPass || rubricData?.noPass) ? (
                                                                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                                                                        {rubricData.notPass || rubricData.noPass}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[11px] text-slate-400 mt-1 italic">
                                                                        Tidak memenuhi kriteria yang diverifikasi di lapangan.
                                                                    </p>
                                                                )}
                                                            </button>
                                                        </div>

                                                        {/* Direct Numeric Score Input */}
                                                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                            <div className="text-xs">
                                                                <span className="font-bold text-slate-800 block">Input Angka Nilai Langsung:</span>
                                                                <span className="text-[11px] text-slate-500">
                                                                    Isi skor spesifik dalam range <strong className="font-mono text-slate-700">{ranges.minScore} - {ranges.maxScore}</strong> ({ranges.notPassLabel}: {ranges.notPassMin}-{ranges.notPassMax}, {ranges.followUpLabel}: {ranges.followUpMin}-{ranges.followUpMax}, {ranges.passLabel}: {ranges.passMin}-{ranges.passMax})
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <label className="text-xs font-semibold text-slate-600">Nilai Parameter:</label>
                                                                <input
                                                                    type="number"
                                                                    min={ranges.minScore}
                                                                    max={ranges.maxScore}
                                                                    step="any"
                                                                    disabled={isScoreLocked}
                                                                    value={rawScore ?? ''}
                                                                    onChange={(e) => handleScoreChange(param.id, e.target.value)}
                                                                    className="w-24 text-center font-mono font-bold text-sm rounded-lg border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                                                                    placeholder={`${ranges.minScore}-${ranges.maxScore}`}
                                                                />
                                                                <span className="text-xs font-semibold text-slate-500">pts</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Optional Note */}
                                            <div className="mt-3 pl-8">
                                                <input
                                                    type="text"
                                                    disabled={isScoreLocked}
                                                    placeholder="Catatan / observasi lapangan untuk kriteria ini (opsional)..."
                                                    value={currentNote}
                                                    onChange={(e) => handleNoteChange(param.id, e.target.value)}
                                                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 focus:bg-white disabled:bg-slate-100"
                                                />
                                            </div>
                                        </Card>
                                    );
                                })
                            ) : (
                                <Card>
                                    <div className="py-8 text-center text-slate-500">
                                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                        <p className="text-xs font-bold">Parameter Penilaian Belum Dikonfigurasi</p>
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Admin belum mengatur parameter penilaian untuk tahap verifikasi di stream ini.
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Live Summary Sticky Card (1 col) */}
                        <div className="space-y-4 lg:sticky lg:top-6">
                            <Card className="border-t-4 border-t-emerald-600 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Rekap Hasil Verifikasi
                                </h3>

                                {/* Qualitative / Direct Score Summary Box */}
                                <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white">
                                    {isDirectScoreStream ? (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                                                    Nilai Tertimbang EMI
                                                </span>
                                                <span className="text-[11px] font-bold text-blue-400 font-mono">
                                                    Skala 1 - {scoreMetrics.maxScale}
                                                </span>
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-500/30 text-center">
                                                <span className="text-3xl font-black text-blue-400 font-mono block">
                                                    {scoreMetrics.totalWeighted.toFixed(2)}
                                                    <span className="text-sm text-blue-300/80 font-semibold">
                                                        {' '}/ {scoreMetrics.maxScale.toFixed(2)}
                                                    </span>
                                                </span>
                                                <span className="text-[11px] text-blue-200 font-medium mt-1 block">
                                                    Total Poin: {scoreMetrics.totalScore} / {scoreMetrics.maxTotalScore} pts
                                                </span>
                                            </div>
                                            <div className="mt-3.5 pt-3 border-t border-slate-800 text-center">
                                                {statusSummary.unrated > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{statusSummary.unrated} Parameter Belum Dinilai</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Seluruh Parameter Selesai Dinilai</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                                                    Distribusi & Skor
                                                </span>
                                                <span className="text-[11px] font-bold text-emerald-400 font-mono">
                                                    Total: {scoreMetrics.totalScore}/{scoreMetrics.maxTotalScore} pts
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                                                    <span className="text-2xl font-black text-emerald-400 font-mono block">
                                                        {statusSummary.pass}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">
                                                        Pass
                                                    </span>
                                                    <span className="text-[9px] text-emerald-400/90 font-mono font-bold mt-0.5 block">
                                                        {scoreMetrics.isScale15 ? '11 - 15 Poin' : '5 Poin'}
                                                    </span>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/30">
                                                    <span className="text-2xl font-black text-amber-400 font-mono block">
                                                        {statusSummary.followUp}
                                                    </span>
                                                    <span className="text-[10px] text-amber-200 font-bold uppercase tracking-wider block">
                                                        Follow Up
                                                    </span>
                                                    <span className="text-[9px] text-amber-400/90 font-mono font-bold mt-0.5 block">
                                                        {scoreMetrics.isScale15 ? '6 - 10 Poin' : '3 Poin'}
                                                    </span>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/30">
                                                    <span className="text-2xl font-black text-rose-400 font-mono block">
                                                        {statusSummary.notPass}
                                                    </span>
                                                    <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider block">
                                                        Not Pass
                                                    </span>
                                                    <span className="text-[9px] text-rose-400/90 font-mono font-bold mt-0.5 block">
                                                        {scoreMetrics.isScale15 ? '1 - 5 Poin' : '1 Poin'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Overall Conclusion Badge */}
                                            <div className="mt-3.5 pt-3 border-t border-slate-800 text-center">
                                                {statusSummary.unrated > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{statusSummary.unrated} Kriteria Belum Dinilai</span>
                                                    </span>
                                                ) : statusSummary.notPass > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                                        <span>Rekomendasi: Not Pass</span>
                                                    </span>
                                                ) : statusSummary.followUp > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                                        <span>Rekomendasi: Need Follow Up</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Rekomendasi: Lulus Verifikasi</span>
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mt-4 space-y-2 text-xs">
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Jumlah Kriteria:</span>
                                        <span className="font-bold text-slate-800">{scoringParameters.length} Item</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Kriteria Terisi:</span>
                                        <span className="font-bold text-slate-800">
                                            {scoringParameters.length - missingParams.length} dari {scoringParameters.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Kuantifikasi Skor:</span>
                                        <span className="font-bold text-slate-800 font-mono">
                                            {scoreMetrics.totalScore} / {scoreMetrics.maxTotalScore} pts (Rata-rata: {scoreMetrics.avgScore.toFixed(2)})
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Nilai Tertimbang:</span>
                                        <span className="font-black text-emerald-700 font-mono">
                                            {scoreMetrics.totalWeighted.toFixed(2)} / {scoreMetrics.maxScale.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Status Form:</span>
                                        <span className="font-bold">
                                            {isScoreLocked ? (
                                                <span className="text-emerald-600">Submitted & Locked</span>
                                            ) : (
                                                <span className="text-amber-600">Draf (Belum Disubmit)</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {!isScoreLocked && (
                                    <div className="mt-6 space-y-2">
                                        {!isAllParametersScored && (
                                            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-bold">Penilaian Belum Lengkap ({scoringParameters.length - missingParams.length}/{scoringParameters.length})</p>
                                                    <p className="text-[10px] text-amber-700 mt-0.5">
                                                        Tentukan status seluruh kriteria sebelum melakukan Submit Final.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={isSubmittingScore}
                                            onClick={() => handleSaveScores(false)}
                                            className="w-full justify-center"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            <span>Simpan Draf Penilaian</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="primary"
                                            disabled={isSubmittingScore}
                                            onClick={() => {
                                                setScoreErrors({});
                                                setIsSubmitModalOpen(true);
                                            }}
                                            className="w-full justify-center"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            <span>Submit Final Verifikasi</span>
                                        </Button>
                                    </div>
                                )}
                            </Card>

                            <Card className="bg-slate-50 border-dashed">
                                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4 text-emerald-600" />
                                    <span>Panduan Penilaian Verifikator</span>
                                </h4>
                                <ul className="text-[11px] text-slate-500 space-y-1.5 mt-2 list-disc list-inside">
                                    <li>Verifikasi lapangan mencakup validasi data, observasi proses, dan wawancara tim.</li>
                                    {isDirectScoreStream ? (
                                        <li>Berikan skor langsung antara <b>1 sampai 15</b> untuk setiap parameter penilaian EMI.</li>
                                    ) : (
                                        <li>Tentukan status & skor kuantifikasi: <b>Pass (5)</b>, <b>Need Follow Up (3)</b>, atau <b>Not Pass (1)</b> untuk setiap kriteria.</li>
                                    )}
                                    <li>Catatan dapat ditambahkan untuk setiap kriteria jika diperlukan follow-up.</li>
                                    <li>Saat tombol <b>Submit Final</b> ditekan, form terkunci dan status project berpindah menjadi <b>Terverifikasi</b>.</li>
                                </ul>
                            </Card>
                        </div>
                    </div>
                )}

                {/* 3. TAB CONTENT: CHARTER & BERKAS (VER-03) */}
                {activeTab === 'charter' && (
                    <div className="space-y-6">
                        {/* Section A: Info Tim & Kategori */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="md:col-span-2" title="Informasi Project & Tim">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <span className="text-slate-400 block font-semibold">Stream:</span>
                                        <span className="text-slate-900 font-bold">{project.stream?.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-semibold">Ketua Tim:</span>
                                        <span className="text-slate-900 font-bold">{project.leader?.full_name} ({project.leader?.employee_index})</span>
                                        <span className="text-slate-500 block text-[11px]">{project.leader?.unit} · {project.leader?.position}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-slate-400 block font-semibold">Kategori Terpilih:</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {project.categories?.map((cat) => (
                                                <span key={cat.id} className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                    {cat.dimension?.name}: {cat.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-slate-400 block font-semibold">Daftar Anggota Tim ({project.team_members?.length || 0}):</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                                            {project.team_members?.map((tm) => (
                                                <div key={tm.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                                    <div>
                                                        <span className="font-bold text-slate-800">{tm.employee?.full_name}</span>
                                                        <span className="text-slate-400 block text-[10px]">{tm.employee?.employee_index} · {tm.employee?.unit}</span>
                                                    </div>
                                                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                                        {tm.member_role}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Lampiran & Berkas">
                                {project.files?.length > 0 ? (
                                    <div className="space-y-2">
                                        {project.files.map((file) => (
                                            <div key={file.id} className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <div className="truncate">
                                                        <p className="font-semibold text-slate-800 truncate" title={file.original_name}>
                                                            {file.original_name}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 block">
                                                            {(file.size_bytes / (1024 * 1024)).toFixed(2)} MB · {file.file_category}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <a
                                                        href={`/verifier/projects/${project.id}/files/${file.id}/preview`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 font-bold text-[11px] transition-colors"
                                                        title="Pratinjau langsung di peramban"
                                                    >
                                                        Pratinjau
                                                    </a>
                                                    <a
                                                        href={`/verifier/projects/${project.id}/files/${file.id}/download`}
                                                        className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-[11px] transition-colors"
                                                    >
                                                        Unduh
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-slate-400 text-xs">
                                        Tidak ada berkas yang diunggah.
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Section B: Isi Dokumen Charter */}
                        {currentVersion ? (
                            <div className="space-y-4">
                                <Card title="Executive Summary">
                                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        {currentVersion.executive_summary}
                                    </div>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card title="Problem Statement">
                                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            {currentVersion.problem_statement}
                                        </div>
                                    </Card>

                                    <Card title="Goal Statement / Target">
                                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            {currentVersion.goal_statement}
                                        </div>
                                    </Card>
                                </div>

                                <Card title="Key Milestones">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                                                <tr>
                                                    <th className="p-2.5">Milestone</th>
                                                    <th className="p-2.5">Target Tanggal</th>
                                                    <th className="p-2.5">PIC</th>
                                                    <th className="p-2.5">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {currentVersion.milestones?.map((m, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-2.5 font-semibold text-slate-800">{m.milestone}</td>
                                                        <td className="p-2.5 text-slate-600 font-mono">{m.target_date}</td>
                                                        <td className="p-2.5 text-slate-600">{m.pic}</td>
                                                        <td className="p-2.5">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                                                {m.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                <Card title="Proposed Initiatives">
                                    <div className="space-y-2">
                                        {currentVersion.initiatives?.map((item, idx) => (
                                            <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                                                <span className="font-bold text-slate-900 block">{item.initiative}</span>
                                                <p className="text-slate-600 mt-1">{item.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <Card>
                                <div className="py-8 text-center text-slate-400 text-xs">
                                    Data charter tidak ditemukan.
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* 4. TAB CONTENT: CATATAN & FEEDBACK (VER-05, NOT-02) */}
                {activeTab === 'feedback' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Feedbacks timeline (2 cols) */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card title="Daftar Catatan Verifikator & Feedback Diskusi">
                                <FeedbackThread
                                    feedbacks={feedbacks}
                                    isParticipant={false}
                                    projectId={project.id}
                                    onDelete={handleDeleteFeedback}
                                />
                            </Card>
                        </div>

                        {/* Form Tulis Feedback Baru (1 col) */}
                        <div className="space-y-4">
                            <Card title="Tulis Catatan / Feedback Baru">
                                <form className="space-y-4 text-xs">
                                    <div>
                                        <label className="font-semibold text-slate-700 block mb-1">
                                            Kaitkan dengan Bagian Charter (Opsional)
                                        </label>
                                        <select
                                            value={feedbackForm.data.charter_section}
                                            onChange={(e) => feedbackForm.setData('charter_section', e.target.value)}
                                            className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                        >
                                            <option value="">-- Umum / Keseluruhan Dokumen --</option>
                                            {Object.entries(feedbackSections).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="font-semibold text-slate-700 block mb-1">
                                            Isi Catatan Masukan / Pertanyaan <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            rows="5"
                                            value={feedbackForm.data.body}
                                            onChange={(e) => feedbackForm.setData('body', e.target.value)}
                                            placeholder="Tuliskan catatan perbaikan atau hal-hal yang perlu diklarifikasi oleh tim peserta..."
                                            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-emerald-500 focus:border-emerald-500"
                                        ></textarea>
                                        {feedbackForm.errors.body && (
                                            <p className="text-[11px] text-rose-600 mt-1">{feedbackForm.errors.body}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            disabled={feedbackForm.processing || !feedbackForm.data.body.trim()}
                                            onClick={() => handleSendFeedback('sent')}
                                            className="w-full justify-center"
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            <span>Kirim ke Tim Peserta</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={feedbackForm.processing || !feedbackForm.data.body.trim()}
                                            onClick={() => handleSendFeedback('draft')}
                                            className="w-full justify-center"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            <span>Simpan Sebagai Draf</span>
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </div>
                    </div>
                )}

                {/* 5. TAB CONTENT: LOG VISIT LAPANGAN (VER-04) */}
                {activeTab === 'visit' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Visits list (2 cols) */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card title="Riwayat Kunjungan Fisik / Lapangan">
                                {visits.length > 0 ? (
                                    <div className="space-y-4">
                                        {visits.map((v) => (
                                            <div key={v.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-2.5">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>{v.location}</span>
                                                        </h4>
                                                        <span className="text-[11px] text-slate-500">
                                                            Oleh: {v.verifier?.employee?.full_name}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                                        Tanggal: {v.visit_date}
                                                    </span>
                                                </div>

                                                {v.notes && (
                                                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                                                        {v.notes}
                                                    </p>
                                                )}

                                                {/* Photos Gallery */}
                                                {v.photos?.length > 0 && (
                                                    <div>
                                                        <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                                                            Foto Bukti Kunjungan ({v.photos.length}):
                                                        </span>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                            {v.photos.map((photo) => (
                                                                <button
                                                                    key={photo.id}
                                                                    type="button"
                                                                    onClick={() => setSelectedPhoto(photo)}
                                                                    className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video hover:opacity-90 transition-opacity"
                                                                >
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                        <Camera className="w-6 h-6" />
                                                                    </div>
                                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                                                                        Lihat Foto
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-slate-400 text-xs">
                                        Belum ada log kunjungan lapangan yang dicatat.
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Form Catat Visit Baru (1 col) */}
                        <div className="space-y-4">
                            <Card title="Catat Kunjungan Lapangan Baru">
                                <form onSubmit={handleVisitSubmit} className="space-y-4 text-xs">
                                    <div>
                                        <label className="font-semibold text-slate-700 block mb-1">
                                            Tanggal Kunjungan <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            type="date"
                                            value={visitForm.data.visit_date}
                                            onChange={(e) => visitForm.setData('visit_date', e.target.value)}
                                            error={visitForm.errors.visit_date}
                                        />
                                    </div>

                                    <div>
                                        <label className="font-semibold text-slate-700 block mb-1">
                                            Lokasi Pelaksanaan / Pabrik / Estate <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Contoh: Estate PG1 Block 12 / Pabrik Nanas"
                                            value={visitForm.data.location}
                                            onChange={(e) => visitForm.setData('location', e.target.value)}
                                            error={visitForm.errors.location}
                                        />
                                    </div>

                                    <div>
                                        <label className="font-semibold text-slate-700 block mb-1">
                                            Catatan Hasil Observasi Lapangan
                                        </label>
                                        <textarea
                                            rows="4"
                                            placeholder="Catatan kondisi mesin, kepatuhan tim, progres aktual..."
                                            value={visitForm.data.notes}
                                            onChange={(e) => visitForm.setData('notes', e.target.value)}
                                            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-emerald-500 focus:border-emerald-500"
                                        ></textarea>
                                        {visitForm.errors.notes && (
                                            <p className="text-[11px] text-rose-600 mt-1">{visitForm.errors.notes}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="font-semibold text-slate-700 block mb-1">
                                            Unggah Foto Bukti (Maks 5 Foto, Maks 10MB/Foto)
                                        </label>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/png,image/jpeg,image/jpg"
                                            onChange={(e) => visitForm.setData('photos', Array.from(e.target.files))}
                                            className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                        />
                                        {visitForm.errors.photos && (
                                            <p className="text-[11px] text-rose-600 mt-1">{visitForm.errors.photos}</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={visitForm.processing}
                                        className="w-full justify-center"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        <span>Simpan Log Kunjungan</span>
                                    </Button>
                                </form>
                            </Card>
                        </div>
                    </div>
                )}

                {/* 6. TAB CONTENT: RIWAYAT VERSI (PAR-06, VER-03) */}
                {activeTab === 'history' && (
                    <Card title="Riwayat Snapshot Versi Charter">
                        <div className="space-y-3">
                            {project.charter_versions?.map((ver) => (
                                <div key={ver.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center font-mono">
                                            v{ver.version_no}
                                        </span>
                                        <div>
                                            <span className="font-bold text-slate-900 block">{ver.title}</span>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                Catatan: <span className="italic">{ver.change_note || 'Tidak ada catatan'}</span>
                                            </p>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">
                                                Oleh: {ver.creator?.employee?.full_name || 'Peserta'} · {new Date(ver.created_at).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedVersion(ver)}
                                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Lihat Snapshot</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* Modal Konfirmasi Submit Final Nilai (VER-07) */}
            <Modal
                isOpen={isSubmitModalOpen}
                show={isSubmitModalOpen}
                onClose={() => !isSubmittingScore && setIsSubmitModalOpen(false)}
                title="Konfirmasi Submit Final Penilaian"
                maxWidth="lg"
            >
                <div className="space-y-4 text-xs text-slate-600">
                    {/* Error Alerts if any */}
                    {Object.keys(scoreErrors).length > 0 && (
                        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                <span>Gagal Menyimpan Penilaian:</span>
                            </p>
                            <ul className="list-disc list-inside text-[11px] text-rose-700">
                                {Object.values(scoreErrors).map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!isAllParametersScored ? (
                        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                <span>Penilaian Belum Lengkap ({missingParams.length} parameter belum dinilai)</span>
                            </p>
                            <p className="text-[11px]">
                                Anda wajib memberikan skor pada seluruh parameter sebelum mengunci penilaian final:
                            </p>
                            <ul className="list-disc list-inside text-[11px] text-rose-700 font-semibold">
                                {missingParams.map((p) => (
                                    <li key={p.id}>{p.name}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <span>Peringatan: Tindakan ini mengunci nilai secara permanen!</span>
                            </p>
                            <p className="text-[11px]">
                                Setelah disubmit, seluruh nilai parameter akan dikunci dan status project akan berubah menjadi <b>Terverifikasi</b>.
                            </p>
                        </div>
                    )}

                    {/* Qualitative status & score summary */}
                    <div className="p-4 rounded-xl bg-slate-900 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                                Ringkasan Hasil Evaluasi Verifikasi
                            </span>
                            <span className="text-[11px] font-bold text-emerald-400 font-mono">
                                Skor: {scoreMetrics.totalScore}/{scoreMetrics.maxTotalScore} pts (Tertimbang: {scoreMetrics.totalWeighted.toFixed(2)}/{scoreMetrics.maxScale.toFixed(2)})
                            </span>
                        </div>
                        {isDirectScoreStream ? (
                            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/30 text-center">
                                <span className="text-2xl font-black text-blue-400 font-mono block">
                                    {scoreMetrics.totalWeighted.toFixed(2)} / {scoreMetrics.maxScale.toFixed(2)}
                                </span>
                                <span className="text-[11px] text-blue-200 mt-0.5 block">
                                    Rata-rata Skor Parameter: {scoreMetrics.avgScore.toFixed(2)} / {scoreMetrics.maxScale}
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                                        <span className="text-2xl font-black text-emerald-400 font-mono block">
                                            {statusSummary.pass}
                                        </span>
                                        <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">
                                            Pass
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/30">
                                        <span className="text-2xl font-black text-amber-400 font-mono block">
                                            {statusSummary.followUp}
                                        </span>
                                        <span className="text-[10px] text-amber-200 font-bold uppercase tracking-wider block">
                                            Follow Up
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/30">
                                        <span className="text-2xl font-black text-rose-400 font-mono block">
                                            {statusSummary.notPass}
                                        </span>
                                        <span className="text-[10px] text-rose-200 font-bold uppercase tracking-wider block">
                                            Not Pass
                                        </span>
                                    </div>
                                </div>

                                {/* Overall Recommendation */}
                                <div className="mt-3 pt-2.5 border-t border-slate-800 text-center">
                                    {statusSummary.notPass > 0 ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                            <span>Rekomendasi Akhir: Not Pass</span>
                                        </span>
                                    ) : statusSummary.followUp > 0 ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Rekomendasi Akhir: Need Follow Up</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Rekomendasi Akhir: Lolos Verifikasi</span>
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Breakdown table */}
                    <div>
                        <span className="font-bold text-slate-700 block mb-1.5">Rincian Nilai per Kriteria:</span>
                        <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                            {scoringParameters.map((param, idx) => {
                                const scoreVal = scores[param.id]?.score;
                                const evalResult = getEvaluationStatus(scoreVal, param);
                                const ranges = getParamRanges(param);
                                const note = scores[param.id]?.note;

                                return (
                                    <div key={param.id} className="p-2.5 flex items-center justify-between text-xs bg-slate-50/50">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="font-semibold text-slate-800">{param.name}</p>
                                                {note && (
                                                    <p className="text-[10px] text-slate-500 italic truncate max-w-xs">"{note}"</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isDirectScoreStream ? (
                                                scoreVal !== null && scoreVal !== undefined && scoreVal !== '' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                                        Skor: {scoreVal} / {ranges.maxScore}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-rose-600">Belum Dinilai</span>
                                                )
                                            ) : evalResult?.key === 'pass' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                    {ranges.passLabel} (Skor: {scoreVal})
                                                </span>
                                            ) : evalResult?.key === 'followUp' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                                    {ranges.followUpLabel} (Skor: {scoreVal})
                                                </span>
                                            ) : evalResult?.key === 'notPass' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                                    {ranges.notPassLabel} (Skor: {scoreVal})
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-rose-600">Belum Ditentukan</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between ${
                        visits.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                        <span>Log Kunjungan Fisik / Lapangan:</span>
                        <span className="font-bold">
                            {visits.length > 0 ? `✓ Tercatat (${visits.length} visit)` : 'Belum Ada (Opsional)'}
                        </span>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button
                            variant="secondary"
                            disabled={isSubmittingScore}
                            onClick={() => setIsSubmitModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            loading={isSubmittingScore}
                            disabled={!isAllParametersScored || isSubmittingScore}
                            onClick={() => handleSaveScores(true)}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            <span>Ya, Submit Final & Kunci Verifikasi</span>
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Snapshot Versi Charter */}
            {selectedVersion && (
                <Modal
                    show={!!selectedVersion}
                    onClose={() => setSelectedVersion(null)}
                    title={`Snapshot Charter v${selectedVersion.version_no}`}
                    maxWidth="2xl"
                >
                    <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
                        <div>
                            <span className="font-bold text-slate-800 block mb-1">Executive Summary:</span>
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 whitespace-pre-line text-slate-700 leading-relaxed">
                                {selectedVersion.executive_summary}
                            </div>
                        </div>

                        <div>
                            <span className="font-bold text-slate-800 block mb-1">Problem Statement:</span>
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 whitespace-pre-line text-slate-700 leading-relaxed">
                                {selectedVersion.problem_statement}
                            </div>
                        </div>

                        <div>
                            <span className="font-bold text-slate-800 block mb-1">Goal Statement:</span>
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 whitespace-pre-line text-slate-700 leading-relaxed">
                                {selectedVersion.goal_statement}
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button variant="secondary" onClick={() => setSelectedVersion(null)}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal Preview Foto Bukti Visit */}
            {selectedPhoto && (
                <Modal
                    show={!!selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                    title={selectedPhoto.original_name}
                >
                    <div className="space-y-3 text-center">
                        <div className="bg-slate-100 rounded-lg p-8 flex items-center justify-center">
                            <Camera className="w-16 h-16 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-500">
                            Foto bukti tersimpan di storage server: {selectedPhoto.storage_path}
                        </p>
                        <div className="flex justify-center gap-2 pt-2">
                            <a
                                href={`/verifier/projects/${project.id}/files/${selectedPhoto.id}/download`}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                            >
                                Unduh File Asli
                            </a>
                            <Button variant="secondary" onClick={() => setSelectedPhoto(null)}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Project Modal */}
            <DeleteProjectModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                project={{
                    ...project,
                    leader_name: project.leader?.full_name,
                    stream_name: project.stream?.name,
                    unit: project.leader?.unit,
                }}
            />
        </AppLayout>
    );
}
