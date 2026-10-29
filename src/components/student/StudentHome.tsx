import React, { useState, useEffect } from 'react';
import { LogOut, Clock, FileText, CheckCircle2, AlertTriangle, ArrowRight, Play, Eye, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import { SchoolLogo } from '../common/SchoolLogo';
import { Student, Exam, ExamAttempt } from '../../types/cbt';
import { StorageService } from '../../services/storageService';

interface StudentHomeProps {
  student: Student;
  onLogout: () => void;
  onStartExam: (examId: string) => void;
  onViewResult: (attempt: ExamAttempt, exam: Exam) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  student,
  onLogout,
  onStartExam,
  onViewResult,
}) => {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [exams, setExams] = useState<Exam[]>(() => StorageService.getExams());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await StorageService.fetchRemoteExams();
    } catch (_) {}
    setExams(StorageService.getExams());
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Automatically fetch latest questions and exams from Google Spreadsheet
  // Uses staggered interval (10-15s) with per-device jitter to prevent network spikes when 140+ students are online
  useEffect(() => {
    handleRefresh();
    StorageService.fetchRemoteQuestions().catch(() => {});

    const jitter = Math.floor(Math.random() * 5000); // 0 - 5s jitter per device
    const timer = setInterval(() => {
      StorageService.fetchRemoteExams().then(() => {
        setExams(StorageService.getExams());
      }).catch(() => {
        setExams(StorageService.getExams());
      });
    }, 10000 + jitter);

    return () => clearInterval(timer);
  }, []);

  const attempts = StorageService.getAttempts();

  // Strictly deduplicate exams so only 1 Matematika and 1 Bahasa Indonesia appear
  const displayedExams = React.useMemo(() => {
    const map = new Map<string, Exam>();
    for (const e of exams) {
      const canonicalKey = e.mapel?.toLowerCase().includes('matematika')
        ? 'Matematika'
        : 'Bahasa Indonesia';
      if (!map.has(canonicalKey)) {
        map.set(canonicalKey, {
          ...e,
          exam_id: canonicalKey === 'Matematika' ? 'exam_01' : 'exam_02',
          judul: `TKA ${canonicalKey} Kelas IX`,
          mapel: canonicalKey as any,
        });
      }
    }
    return Array.from(map.values());
  }, [exams]);

  const getAttemptForExam = (examId: string) => {
    return attempts.find((a) => a.student_id === student.student_id && a.exam_id === examId);
  };

  const handleOpenConfirm = (exam: Exam) => {
    setSelectedExam(exam);
    setConfirmModalOpen(true);
  };

  const handleConfirmStart = () => {
    if (selectedExam) {
      setConfirmModalOpen(false);
      onStartExam(selectedExam.exam_id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-sky-800 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <SchoolLogo size={34} showText={true} lightText={true} subtext="CBT TKA · Kelas IX" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white leading-tight">{student.nama}</div>
              <div className="text-xs text-sky-200">NIS: {student.nis} · Kelas {student.kelas}</div>
            </div>

            <button
              onClick={onLogout}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1 w-full space-y-4 sm:space-y-6">
        
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">
              Portal Siswa Kelas IX
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">
              Selamat Datang, {student.nama}!
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
              Silakan pilih mata pelajaran ujian yang dijadwalkan hari ini. Pastikan koneksi internet stabil sebelum memulai.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-sky-50 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-sky-100 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
              {student.kelas}
            </div>
            <div className="text-xs">
              <span className="text-slate-500 block text-[10px] sm:text-xs">Identitas Siswa</span>
              <span className="font-bold text-slate-900 block truncate max-w-[180px] sm:max-w-none">{student.nama}</span>
              <span className="text-sky-700 font-mono text-[11px]">NIS: {student.nis}</span>
            </div>
          </div>
        </div>

        {/* Exams Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-700" />
                <span>Daftar Ujian Tersedia</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">TKA Kelas IX (Sembilan) · SMPN 2 Pulung</span>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memeriksa...' : 'Periksa Status Ujian'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedExams.map((exam) => {
              const attempt = getAttemptForExam(exam.exam_id);
              const isSubmitted = attempt?.status === 'Submitted';
              const isInProgress = attempt?.status === 'In Progress';
              const isNotStarted = exam.status === 'Belum Dimulai';
              const isFinished = exam.status === 'Selesai';
              const isOngoing = exam.status === 'Sedang Berlangsung';

              return (
                <div
                  key={exam.exam_id}
                  className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Top indicator bar */}
                  <div
                    className={`h-1.5 w-full absolute top-0 left-0 ${
                      isSubmitted
                        ? 'bg-emerald-500'
                        : isInProgress
                        ? 'bg-amber-500'
                        : isOngoing
                        ? 'bg-sky-600'
                        : isFinished
                        ? 'bg-slate-400'
                        : 'bg-amber-400'
                    }`}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100 shrink-0">
                        {exam.mapel}
                      </span>

                      {/* Status Badges */}
                      {isSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ujian Selesai</span>
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 shrink-0">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>Sedang Dikerjakan</span>
                        </span>
                      ) : isNotStarted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 shrink-0">
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Belum Dimulai</span>
                        </span>
                      ) : isFinished ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 shrink-0">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>Selesai / Ditutup</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Sedang Berlangsung</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{exam.judul}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Tes Kemampuan Akademik (TKA) Standar Kelulusan SMPN 2 Pulung
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 sm:mt-5 py-3 border-y border-slate-100 text-[11px] sm:text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>Durasi: <strong>{exam.durasi_menit}m</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>Jumlah: <strong>{exam.jumlah_soal} Soal</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-sky-600 shrink-0">📅</span>
                        <span>Jadwal: <strong>{exam.mulai_at.slice(0, 10)}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-sky-600 shrink-0">🕒</span>
                        <span>Waktu: <strong>{exam.mulai_at.slice(11)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 sm:mt-6 pt-2">
                    {isSubmitted ? (
                      <div className="space-y-2">
                        {exam.tampilkan_nilai && attempt?.skor !== undefined && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">Nilai Akhir:</span>
                            <span className="text-lg font-black text-sky-800">
                              {attempt.skor} <span className="text-xs font-normal text-slate-500">/ 100</span>
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => onViewResult(attempt!, exam)}
                          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                          <span>Lihat Bukti Pengumpulan</span>
                        </button>
                      </div>
                    ) : isInProgress ? (
                      <button
                        onClick={() => onStartExam(exam.exam_id)}
                        className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Lanjutkan Pengerjaan Ujian</span>
                      </button>
                    ) : isNotStarted ? (
                      /* Belum Dimulai: Terkunci, siswa tidak bisa mengerjakan */
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled
                          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-not-allowed select-none"
                        >
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span>Ujian Belum Dibuka (Terkunci)</span>
                        </button>
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5 leading-snug">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            Ujian belum dimulai oleh proktor. Tombol akan aktif otomatis saat status ujian diaktifkan menjadi <strong>Sedang Berlangsung</strong>.
                          </span>
                        </div>
                      </div>
                    ) : isFinished ? (
                      /* Selesai: Ditutup */
                      <button
                        type="button"
                        disabled
                        className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-not-allowed select-none"
                      >
                        <AlertCircle className="w-4 h-4 text-slate-400" />
                        <span>Ujian Telah Ditutup / Berakhir</span>
                      </button>
                    ) : (
                      /* Sedang Berlangsung: Siswa dapat mulai mengerjakan */
                      <button
                        onClick={() => handleOpenConfirm(exam)}
                        className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                      >
                        <span>Mulai Kerjakan Ujian</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exam Rules & Advice */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 text-xs text-sky-900 space-y-2">
          <h4 className="font-bold text-sm text-sky-950 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-sky-700" />
            <span>Petunjuk Penting Pelaksanaan CBT TKA:</span>
          </h4>
          <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed pl-1">
            <li>Siswa hanya diperkenankan menggunakan 1 perangkat selama ujian berlangsung.</li>
            <li>Setiap jawaban yang Anda pilih akan <strong>tersimpan otomatis</strong> ke server secara realtime.</li>
            <li>Waktu ujian akan terus berjalan di latar belakang sesuai durasi resmi.</li>
            <li><strong>Proteksi Keamanan:</strong> Dilarang membuka tab baru, berpindah aplikasi, atau meminimalkan browser. Sistem akan mendeteksi dan memberi peringatan pelanggaran.</li>
            <li>Anda dapat menandai nomor soal sebagai <strong>Ragu-ragu</strong> untuk diperiksa kembali sebelum pengumpulan.</li>
            <li>Jangan mengklik tombol "Selesai Ujian" sebelum Anda yakin semua jawaban telah lengkap dan ditinjau.</li>
          </ul>
        </div>
      </main>

      {/* Confirmation Modal Before Starting */}
      {confirmModalOpen && selectedExam && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center">
              Konfirmasi Mulai Ujian
            </h3>
            <p className="text-xs text-slate-600 text-center mt-1">
              Apakah Anda siap untuk memulai pengerjaan ujian berikut?
            </p>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Mata Pelajaran:</span>
                <span className="font-bold text-slate-900">{selectedExam.mapel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Judul Ujian:</span>
                <span className="font-bold text-slate-900">{selectedExam.judul}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi:</span>
                <span className="font-bold text-sky-700">{selectedExam.durasi_menit} Menit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Soal:</span>
                <span className="font-bold text-slate-900">{selectedExam.jumlah_soal} Soal</span>
              </div>
            </div>

            <div className="mt-4 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
              <div>⚠️ <strong>Perhatian:</strong> Timer akan langsung berjalan saat Anda menekan tombol di bawah.</div>
              <div className="text-red-700 font-medium">🛡️ Sistem Anti-Curang aktif: dilarang membuka tab baru atau berpindah aplikasi selama ujian.</div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmStart}
                className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/25 transition-colors cursor-pointer"
              >
                Mulai Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        SMP Negeri 2 Pulung · CBT Tes Kemampuan Akademik (TKA) Kelas IX
      </footer>
    </div>
  );
};
