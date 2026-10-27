import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  BookOpen,
  CheckSquare,
  Square,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { SchoolLogo } from '../common/SchoolLogo';
import { Student, Exam, Question, ExamAttempt, OptionKey } from '../../types/cbt';
import { StorageService } from '../../services/storageService';

interface ExamTakingViewProps {
  student: Student;
  exam: Exam;
  questions: Question[];
  initialAttempt: ExamAttempt;
  onFinishExam: (attempt: ExamAttempt) => void;
  onBackToHome: () => void;
}

export const ExamTakingView: React.FC<ExamTakingViewProps> = ({
  student,
  exam,
  questions,
  initialAttempt,
  onFinishExam,
}) => {
  // Current active question index (0-indexed)
  const [currentIndex, setCurrentIndex] = useState(0);

  // User answers map: question_id -> OptionKey
  const [answers, setAnswers] = useState<Record<string, OptionKey | ''>>(
    initialAttempt.jawaban || {}
  );

  // User flagged map: question_id -> boolean
  const [raguRagu, setRaguRagu] = useState<Record<string, boolean>>(
    initialAttempt.ragu_ragu || {}
  );

  // Autosave status indicator
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Confirmation finish modal
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Server countdown timer in seconds
  const calculateRemainingSeconds = useCallback(() => {
    const end = new Date(initialAttempt.batas_waktu_at).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((end - now) / 1000));
    return diff;
  }, [initialAttempt.batas_waktu_at]);

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemainingSeconds);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setRemainingSeconds(remaining);

      // Time's up -> auto submit!
      if (remaining <= 0) {
        clearInterval(timer);
        handleAutoSubmitOnTimeOut();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateRemainingSeconds]);

  const handleAutoSubmitOnTimeOut = () => {
    const finalAttempt = StorageService.submitExam(initialAttempt.attempt_id);
    onFinishExam(finalAttempt);
  };

  // Format time as HH : MM : SS
  const formattedTime = useMemo(() => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
  }, [remainingSeconds]);

  const currentQuestion = questions[currentIndex] || questions[0];

  // Save answer handler
  const handleSelectOption = (optionKey: OptionKey) => {
    if (!currentQuestion) return;
    setSaveStatus('saving');

    const updatedAnswers = {
      ...answers,
      [currentQuestion.question_id]: optionKey,
    };
    setAnswers(updatedAnswers);

    StorageService.saveAnswer(
      initialAttempt.attempt_id,
      currentQuestion.question_id,
      optionKey,
      Boolean(raguRagu[currentQuestion.question_id])
    );

    setTimeout(() => {
      setSaveStatus('saved');
    }, 250);
  };

  // Toggle Ragu-ragu (flag for review)
  const handleToggleRagu = () => {
    if (!currentQuestion) return;
    setSaveStatus('saving');

    const currentFlag = Boolean(raguRagu[currentQuestion.question_id]);
    const updatedFlags = {
      ...raguRagu,
      [currentQuestion.question_id]: !currentFlag,
    };
    setRaguRagu(updatedFlags);

    StorageService.saveAnswer(
      initialAttempt.attempt_id,
      currentQuestion.question_id,
      answers[currentQuestion.question_id] || '',
      !currentFlag
    );

    setTimeout(() => {
      setSaveStatus('saved');
    }, 250);
  };

  // Navigation handlers
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Final submit handler
  const handleFinalSubmit = () => {
    const finalAttempt = StorageService.submitExam(initialAttempt.attempt_id);
    setShowFinishModal(false);
    onFinishExam(finalAttempt);
  };

  // Answer stats for summary modal & badges
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter((a) => a !== '').length;
  const flaggedCount = Object.values(raguRagu).filter(Boolean).length;
  const unansweredCount = totalQuestions - answeredCount;

  const currentAnswer = currentQuestion ? answers[currentQuestion.question_id] : '';
  const isCurrentRagu = currentQuestion ? Boolean(raguRagu[currentQuestion.question_id]) : false;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER (Exact match to Mockup Header)             */}
      {/* ======================================================== */}
      <header className="bg-sky-800 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          
          {/* Left: School Crest + School Name */}
          <div className="flex items-center gap-3">
            <SchoolLogo size={38} showText={false} />
            <div>
              <div className="font-bold text-sm sm:text-base leading-tight text-white tracking-tight">
                SMP Negeri 2 Pulung
              </div>
              <div className="text-[11px] sm:text-xs text-sky-200">
                CBT TKA - Kelas IX
              </div>
            </div>
          </div>

          {/* Center: Sisa Waktu (Countdown Clock) */}
          <div className="flex items-center gap-2 bg-sky-900/80 border border-sky-600/40 px-3.5 py-1.5 rounded-xl shadow-inner">
            <Clock className={`w-4 h-4 ${remainingSeconds < 300 ? 'text-amber-300 animate-pulse' : 'text-sky-300'}`} />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold text-sky-200 tracking-wider">
                Sisa Waktu
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-white tabular-nums tracking-wider">
                {formattedTime}
              </span>
            </div>
          </div>

          {/* Right: Student Profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sky-600 border border-sky-400/40 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-white leading-tight">
                {student.nama}
              </div>
              <div className="text-[10px] text-sky-200 font-mono">
                NIS {student.nis}
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN 3-COLUMN WORKSPACE                                */}
      {/* ======================================================== */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* ====================================================== */}
        {/* LEFT COLUMN: DAFTAR SOAL (40-button Grid)               */}
        {/* ====================================================== */}
        <aside className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h2 className="font-bold text-slate-900 text-sm">Daftar Soal</h2>
            <span className="text-[11px] font-semibold text-slate-500 font-mono">
              {answeredCount} / {totalQuestions}
            </span>
          </div>

          {/* 5-Column Grid of Number Buttons (1 to 40) */}
          <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const num = idx + 1;
              const isCurrent = idx === currentIndex;
              const hasAnswer = Boolean(answers[q.question_id]);
              const isRagu = Boolean(raguRagu[q.question_id]);

              // Determine color class based on exact CBT hierarchy:
              // 1. Current question -> Blue
              // 2. Ragu-ragu -> Orange/Red
              // 3. Answered -> Green
              // 4. Default -> Gray/White
              let btnStyle = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';

              if (isCurrent) {
                btnStyle = 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm ring-2 ring-sky-300';
              } else if (isRagu) {
                btnStyle = 'bg-orange-600 text-white font-bold border-orange-600 shadow-xs';
              } else if (hasAnswer) {
                btnStyle = 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs';
              }

              return (
                <button
                  key={q.question_id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                  title={`Nomor ${num}: ${
                    isRagu ? 'Ragu-ragu' : hasAnswer ? 'Sudah dijawab' : 'Belum dijawab'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Bottom Legend (Matching Mockup exactly) */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-sky-600 shrink-0" />
              <span className="text-slate-600 text-[11px]">Saat ini</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-emerald-600 shrink-0" />
              <span className="text-slate-600 text-[11px]">Sudah dijawab</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-slate-100 border border-slate-300 shrink-0" />
              <span className="text-slate-600 text-[11px]">Belum dijawab</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-orange-600 shrink-0" />
              <span className="text-slate-600 text-[11px]">Ragu-ragu</span>
            </div>
          </div>
        </aside>

        {/* ====================================================== */}
        {/* CENTER COLUMN: MAIN QUESTION & MULTIPLE CHOICE OPTIONS  */}
        {/* ====================================================== */}
        <main className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200 flex flex-col justify-between min-h-[540px]">
          <div>
            
            {/* Top Bar: Subject Badge & Question Counter */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
                  {currentQuestion.mapel}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentQuestion.topik}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-600 font-mono">
                No. {currentIndex + 1} dari {totalQuestions}
              </span>
            </div>

            {/* Question Text */}
            <div className="prose prose-slate max-w-none mb-6">
              <p className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                {currentQuestion.teks_soal}
              </p>

              {/* Optional Question Image if present */}
              {currentQuestion.gambar_url && (
                <div className="my-4 max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={currentQuestion.gambar_url}
                    alt={`Ilustrasi Soal Nomor ${currentIndex + 1}`}
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}
            </div>

            {/* Options List A, B, C, D (Matching Mockup with radio circle) */}
            <div className="space-y-3">
              {[
                { key: 'A' as OptionKey, text: currentQuestion.opsi_a },
                { key: 'B' as OptionKey, text: currentQuestion.opsi_b },
                { key: 'C' as OptionKey, text: currentQuestion.opsi_c },
                { key: 'D' as OptionKey, text: currentQuestion.opsi_d },
              ].map(({ key, text }) => {
                const isSelected = currentAnswer === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectOption(key)}
                    className={`w-full p-3.5 sm:p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 shadow-xs ring-1 ring-sky-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Radio Button Circle */}
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-sky-600 bg-sky-600'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    {/* Option Label & Text */}
                    <div className="flex items-baseline gap-2 text-xs sm:text-sm text-slate-800">
                      <span className="font-bold text-slate-900">{key}.</span>
                      <span className="leading-snug">{text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Autosave feedback badge */}
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
              {saveStatus === 'saving' ? (
                <>
                  <div className="w-3 h-3 rounded-full border border-sky-400 border-t-transparent animate-spin" />
                  <span className="text-sky-600">Menyimpan jawaban ke server...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Tersimpan otomatis di server</span>
                </>
              )}
            </div>

          </div>

          {/* Bottom Action Bar: Prev, Ragu-ragu, Next */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {/* Ragu-ragu Checkbox Toggle */}
            <button
              type="button"
              onClick={handleToggleRagu}
              className={`py-2 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                isCurrentRagu
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {isCurrentRagu ? (
                <CheckSquare className="w-4 h-4 text-orange-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Ragu-ragu</span>
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
            >
              <span>Berikutnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>
        </main>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: INFORMASI UJIAN & FINISH BUTTON          */}
        {/* ====================================================== */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100 mb-4">
              Informasi Ujian
            </h2>

            <div className="space-y-4 text-xs">
              
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Mata Pelajaran</div>
                  <div className="font-bold text-slate-900">{exam.mapel}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Jumlah Soal</div>
                  <div className="font-bold text-slate-900">{exam.jumlah_soal} Butir</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Jenis Soal</div>
                  <div className="font-bold text-slate-900">Pilihan Ganda (A-D)</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Tahun Pelajaran</div>
                  <div className="font-bold text-slate-900">{exam.tahun_pelajaran}</div>
                </div>
              </div>

            </div>

            {/* Selesai Ujian Big Button */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowFinishModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Selesai Ujian</span>
              </button>
            </div>
          </div>
        </aside>

      </div>

      {/* ======================================================== */}
      {/* 3. CONFIRMATION SUBMIT MODAL                             */}
      {/* ======================================================== */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center">
              Konfirmasi Pengumpulan Ujian
            </h3>
            <p className="text-xs text-slate-600 text-center mt-1">
              Apakah Anda yakin ingin mengakhiri dan mengumpulkan jawaban ujian ini?
            </p>

            {/* Summary Tallies */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="block text-emerald-800 font-bold text-base">{answeredCount}</span>
                <span className="text-emerald-700 text-[10px]">Terjawab</span>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                <span className="block text-orange-800 font-bold text-base">{flaggedCount}</span>
                <span className="text-orange-700 text-[10px]">Ragu-ragu</span>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                <span className="block text-slate-800 font-bold text-base">{unansweredCount}</span>
                <span className="text-slate-600 text-[10px]">Belum Jawab</span>
              </div>
            </div>

            {/* Warning if incomplete */}
            {(unansweredCount > 0 || flaggedCount > 0) && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Masih terdapat <strong>{unansweredCount} soal belum dijawab</strong> dan{' '}
                  <strong>{flaggedCount} soal bertanda ragu-ragu</strong>. Anda disarankan untuk memeriksa kembali.
                </span>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Kembali Periksa
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/25 transition-colors cursor-pointer"
              >
                Kumpulkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
