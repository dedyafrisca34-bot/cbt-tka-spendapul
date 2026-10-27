import React from 'react';
import { Users, BookOpen, FileCheck, Trophy, Eye, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { AdminUser, Exam } from '../../types/cbt';
import { StorageService } from '../../services/storageService';
import { AdminTab } from './AdminLayout';

interface AdminDashboardProps {
  admin: AdminUser;
  onNavigate: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, onNavigate }) => {
  const students = StorageService.getStudents();
  const questions = StorageService.getQuestions();
  const exams = StorageService.getExams();
  const reports = StorageService.getReports();

  const totalSiswa = students.length;
  const totalSoal = questions.length;
  const totalUjian = exams.length;

  const validScores = reports
    .map((r) => r.rata_rata)
    .filter((s) => s > 0);
  const avgScore =
    validScores.length > 0
      ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2).replace('.', ',')
      : '-';

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Selamat Datang, {admin.nama}!
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Kelola ujian TKA dengan mudah dan efisien.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Siswa (Blue) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Siswa</div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {totalSiswa}
            </div>
            <div className="text-[11px] text-sky-600 font-semibold mt-0.5">Terdaftar Aktif</div>
          </div>
        </div>

        {/* 2. Total Soal (Green) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Soal</div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {totalSoal}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Matematika & Bahasa Indonesia
            </div>
          </div>
        </div>

        {/* 3. Jumlah Ujian (Orange) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Jumlah Ujian</div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {totalUjian}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">TKA Kelas IX</div>
          </div>
        </div>

        {/* 4. Rata-rata Nilai (Purple) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Rata-rata Nilai</div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {avgScore}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">
              {validScores.length > 0 ? `${validScores.length} Siswa Selesai` : 'Belum Ada Ujian Selesai'}
            </div>
          </div>
        </div>

      </div>

      {/* Jadwal Ujian Terbaru Table (Matching reference mockup table) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-sm">Jadwal Ujian Terbaru</h2>
          <button
            onClick={() => onNavigate('ujian')}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/70 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-5 w-12 text-center">No</th>
                <th className="py-3 px-5">Mata Pelajaran</th>
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-5">Waktu</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {exams.map((exam, idx) => (
                <tr key={exam.exam_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3.5 px-5 font-semibold text-slate-900">{exam.mapel}</td>
                  <td className="py-3.5 px-5 text-slate-600">{exam.mulai_at.slice(0, 10)}</td>
                  <td className="py-3.5 px-5 font-mono text-slate-600">
                    {exam.mulai_at.slice(11)} - {exam.selesai_at.slice(11)}
                  </td>
                  <td className="py-3.5 px-5">
                    {exam.status === 'Sedang Berlangsung' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Sedang Berlangsung</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                        <Clock className="w-3 h-3" />
                        <span>Belum Dimulai</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <button
                      onClick={() => onNavigate('ujian')}
                      className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Lihat</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Administration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div
          onClick={() => onNavigate('bank-soal')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
              Kelola Bank Soal
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tambah, edit, dan atur kunci jawaban serta tingkat kognitif C1-C3.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0 ml-2" />
        </div>

        <div
          onClick={() => onNavigate('data-siswa')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
              Daftar Siswa Kelas IX
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kelola NIS, rombel kelas, dan impor data peserta ujian.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0 ml-2" />
        </div>

        <div
          onClick={() => onNavigate('kartu-login')}
          className="bg-white p-5 rounded-2xl border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between group bg-gradient-to-br from-amber-50/40 to-white"
        >
          <div>
            <div className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 mb-1">
              Baru
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
              Cetak Kartu Login
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cetak kartu peserta per kelas (9A-9E) lengkap dengan kop, PIN, dan pengesahan.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-500 group-hover:text-amber-700 transition-colors shrink-0 ml-2" />
        </div>

        <div
          onClick={() => onNavigate('rekap-nilai')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
              Rekapitulasi Nilai & PDF
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pantau nilai per kelas, ekspor CSV, dan cetak PDF rekap resmi.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0 ml-2" />
        </div>

      </div>

    </div>
  );
};
