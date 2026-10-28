import React from 'react';
import { CheckCircle2, ArrowLeft, Trophy, Clock, FileCheck } from 'lucide-react';
import { SchoolLogo } from '../common/SchoolLogo';
import { Student, Exam, ExamAttempt } from '../../types/cbt';
import { StorageService } from '../../services/storageService';

interface ExamResultViewProps {
  student: Student;
  exam: Exam;
  attempt: ExamAttempt;
  onBackToHome: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  student,
  exam,
  attempt,
  onBackToHome,
}) => {
  const settings = StorageService.getSettings();
  const showScore = exam.tampilkan_nilai;
  const isPassed = (attempt.skor || 0) >= settings.kkm;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-sky-800 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <SchoolLogo size={32} showText={true} lightText={true} subtext="Hasil CBT" />
          <button
            onClick={onBackToHome}
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </button>
        </div>
      </header>

      {/* Main card */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-10 w-full flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-5 sm:p-10 shadow-lg border border-slate-200 text-center relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-3">
            Ujian Berhasil Dikumpulkan
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Terima Kasih, {student.nama}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
            Seluruh lembar jawaban Anda untuk <strong>{exam.judul}</strong> ({exam.mapel}) telah tercatat dan terkunci di server.
          </p>

          {/* Student metadata snippet */}
          <div className="mt-6 py-3 px-4 bg-slate-50 rounded-2xl border border-slate-200 inline-flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">NIS: </span>
              <strong className="text-slate-800">{student.nis}</strong>
            </div>
            <span className="text-slate-300">·</span>
            <div>
              <span className="text-slate-400">Kelas: </span>
              <strong className="text-slate-800">{student.kelas}</strong>
            </div>
            <span className="text-slate-300">·</span>
            <div>
              <span className="text-slate-400">Waktu Kirim: </span>
              <strong className="text-slate-800">
                {attempt.selesai_at ? new Date(attempt.selesai_at).toLocaleTimeString('id-ID') : '-'}
              </strong>
            </div>
          </div>

          {/* Score display (if enabled by admin) */}
          {showScore ? (
            <div className="mt-8 p-6 bg-gradient-to-b from-sky-50/70 to-slate-50 rounded-2xl border border-sky-100">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Nilai Akhir Ujian</span>
              </div>

              <div className="text-5xl font-black text-sky-900 tracking-tight my-2">
                {attempt.skor}
                <span className="text-lg font-normal text-slate-400 ml-1">/ 100</span>
              </div>

              <div className="inline-block mt-1">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isPassed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}
                >
                  {isPassed ? 'TUNTAS (Memenuhi KKM 75)' : 'BELUM TUNTAS (Di Bawah KKM 75)'}
                </span>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-200 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="block text-emerald-700 font-bold text-base">{attempt.benar ?? 0}</span>
                  <span className="text-slate-500 text-[11px]">Jawaban Benar</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="block text-red-600 font-bold text-base">{attempt.salah ?? 0}</span>
                  <span className="text-slate-500 text-[11px]">Jawaban Salah</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="block text-slate-600 font-bold text-base">{attempt.kosong ?? 0}</span>
                  <span className="text-slate-500 text-[11px]">Tidak Dijawab</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <FileCheck className="w-8 h-8 text-sky-700 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">Kebijakan Pengumuman Nilai:</p>
              <p className="mt-1">
                Sesuai kebijakan panitia ujian SMP Negeri 2 Pulung, nilai tidak ditampilkan langsung setelah selesai pengerjaan. Nilai resmi akan diumumkan serentak oleh dewan guru.
              </p>
            </div>
          )}

          {/* Action button */}
          <div className="mt-8">
            <button
              onClick={onBackToHome}
              className="w-full sm:w-auto px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda Ujian</span>
            </button>
          </div>

        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        SMP Negeri 2 Pulung · Berkarakter • Berprestasi • Maju
      </footer>
    </div>
  );
};
