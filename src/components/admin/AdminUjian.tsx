import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, CheckCircle2, Clock, Calendar, CheckSquare, Play, Square, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import { Exam, Subject } from '../../types/cbt';
import { StorageService } from '../../services/storageService';

export const AdminUjian: React.FC = () => {
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

  useEffect(() => {
    handleRefresh();
  }, []);

  // Guarantee strictly 2 official subjects without duplicate rows
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
          mapel: canonicalKey as Subject,
        });
      }
    }
    return Array.from(map.values());
  }, [exams]);

  // Quick toggle status without opening form
  const handleQuickStatus = (exam: Exam, newStatus: 'Belum Dimulai' | 'Sedang Berlangsung' | 'Selesai') => {
    const updated: Exam = { ...exam, status: newStatus };
    StorageService.saveExam(updated);
    setExams(StorageService.getExams());
  };

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Form Fields
  const [formJudul, setFormJudul] = useState('');
  const [formMapel, setFormMapel] = useState<Subject>('Matematika');
  const [formDurasi, setFormDurasi] = useState<number>(90);
  const [formTanggal, setFormTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [formJamMulai, setFormJamMulai] = useState('08:00');
  const [formJamSelesai, setFormJamSelesai] = useState('10:00');
  const [formJumlahSoal, setFormJumlahSoal] = useState<number>(40);
  const [formAcakSoal, setFormAcakSoal] = useState(false);
  const [formTampilkanNilai, setFormTampilkanNilai] = useState(true);
  const [formStatus, setFormStatus] = useState<'Belum Dimulai' | 'Sedang Berlangsung' | 'Selesai'>('Sedang Berlangsung');

  const handleOpenCreate = () => {
    setEditingExam(null);
    setFormJudul('TKA Matematika Kelas IX');
    setFormMapel('Matematika');
    setFormDurasi(90);
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormJamMulai('08:00');
    setFormJamSelesai('10:00');
    setFormJumlahSoal(40);
    setFormAcakSoal(false);
    setFormTampilkanNilai(true);
    setFormStatus('Sedang Berlangsung');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormJudul(exam.judul);
    setFormMapel(exam.mapel);
    setFormDurasi(exam.durasi_menit);
    setFormTanggal(exam.mulai_at.slice(0, 10));
    setFormJamMulai(exam.mulai_at.slice(11, 16));
    setFormJamSelesai(exam.selesai_at.slice(11, 16));
    setFormJumlahSoal(exam.jumlah_soal);
    setFormAcakSoal(exam.acak_soal);
    setFormTampilkanNilai(exam.tampilkan_nilai);
    setFormStatus(exam.status);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus jadwal ujian ini?')) {
      StorageService.deleteExam(id);
      setExams(StorageService.getExams());
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim()) {
      alert('Judul ujian tidak boleh kosong.');
      return;
    }

    const allQuestions = StorageService.getQuestions();
    const mapelQuestions = allQuestions.filter((q) => q.mapel === formMapel && q.aktif);

    const newExam: Exam = {
      exam_id: editingExam ? editingExam.exam_id : `exam_${Date.now()}`,
      judul: formJudul.trim(),
      mapel: formMapel,
      durasi_menit: formDurasi,
      mulai_at: `${formTanggal} ${formJamMulai}`,
      selesai_at: `${formTanggal} ${formJamSelesai}`,
      jumlah_soal: formJumlahSoal,
      acak_soal: formAcakSoal,
      acak_opsi: false,
      tampilkan_nilai: formTampilkanNilai,
      status: formStatus,
      tahun_pelajaran: '',
      question_ids: mapelQuestions.slice(0, formJumlahSoal).map((q) => q.question_id),
    };

    StorageService.saveExam(newExam);
    setExams(StorageService.getExams());
    setIsFormOpen(false);
    alert(`Pengaturan ujian ${newExam.mapel} (${newExam.jumlah_soal} butir soal) berhasil disimpan dan disinkronkan ke Spreadsheet & HP siswa!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Ujian
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Kelola jadwal dan pengaturan ujian TKA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
            title="Tarik data jadwal dan status terbaru dari Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkron Spreadsheet'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Ujian</span>
          </button>
        </div>
      </div>

      {/* Table matching reference mockup */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/70 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-5 w-12 text-center">No</th>
                <th className="py-3 px-5">Nama Ujian</th>
                <th className="py-3 px-5">Mata Pelajaran</th>
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-5">Waktu</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedExams.map((exam, idx) => (
                <tr key={exam.exam_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3.5 px-5 font-bold text-slate-900">{exam.judul}</td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                        exam.mapel === 'Matematika'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {exam.mapel}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600">{exam.mulai_at.slice(0, 10)}</td>
                  <td className="py-3.5 px-5 font-mono text-slate-600">
                    {exam.mulai_at.slice(11)} - {exam.selesai_at.slice(11)}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex flex-col gap-1.5 items-start">
                      {exam.status === 'Sedang Berlangsung' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Sedang Berlangsung</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(exam, 'Selesai')}
                            className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Tutup ujian agar siswa tidak dapat mengerjakan lagi"
                          >
                            <Square className="w-2.5 h-2.5 fill-rose-600" />
                            <span>Tutup Ujian</span>
                          </button>
                        </div>
                      ) : exam.status === 'Belum Dimulai' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Belum Dimulai</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(exam, 'Sedang Berlangsung')}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            title="Buka ujian sekarang agar siswa dapat mulai mengerjakan"
                          >
                            <Play className="w-2.5 h-2.5 fill-white" />
                            <span>Buka Ujian</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <AlertCircle className="w-3 h-3 text-slate-500" />
                            <span>Selesai</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(exam, 'Sedang Berlangsung')}
                            className="px-2 py-0.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Buka kembali sesi ujian"
                          >
                            <RefreshCw className="w-2.5 h-2.5 text-sky-600" />
                            <span>Buka Lagi</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(exam)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                        title="Edit Ujian"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(exam.exam_id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus Ujian"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create/Edit Exam */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingExam ? 'Edit Pengaturan Ujian' : 'Buat Ujian Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama / Judul Ujian</label>
                <input
                  type="text"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: TKA Matematika Kelas IX"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={formMapel}
                    onChange={(e) => setFormMapel(e.target.value as Subject)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Durasi Pengerjaan</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formDurasi}
                      onChange={(e) => setFormDurasi(Number(e.target.value))}
                      min={10}
                      max={180}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400">Menit</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={formJamMulai}
                    onChange={(e) => setFormJamMulai(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={formJamSelesai}
                    onChange={(e) => setFormJamSelesai(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Butir Soal</label>
                  <input
                    type="number"
                    value={formJumlahSoal}
                    onChange={(e) => setFormJumlahSoal(Number(e.target.value))}
                    min={5}
                    max={100}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Ujian</label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as 'Belum Dimulai' | 'Sedang Berlangsung' | 'Selesai')
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Sedang Berlangsung">Sedang Berlangsung</option>
                    <option value="Belum Dimulai">Belum Dimulai</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 space-y-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tampilkanNilaiCheck"
                    checked={formTampilkanNilai}
                    onChange={(e) => setFormTampilkanNilai(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="tampilkanNilaiCheck" className="text-slate-700 font-medium">
                    Izinkan siswa melihat nilai langsung setelah pengumpulan
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="acakSoalCheck"
                    checked={formAcakSoal}
                    onChange={(e) => setFormAcakSoal(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="acakSoalCheck" className="text-slate-700 font-medium">
                    Acak urutan nomor butir soal per siswa
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm"
                >
                  Simpan Ujian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
