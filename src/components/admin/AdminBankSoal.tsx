import React, { useState, useMemo } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, X, Check, BookOpen, AlertCircle } from 'lucide-react';
import { Question, Subject, CognitiveLevel, OptionKey } from '../../types/cbt';
import { StorageService } from '../../services/storageService';

export const AdminBankSoal: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>(() => StorageService.getQuestions());

  // Filters
  const [filterMapel, setFilterMapel] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Form State
  const [formMapel, setFormMapel] = useState<Subject>('Matematika');
  const [formTopik, setFormTopik] = useState('');
  const [formLevel, setFormLevel] = useState<CognitiveLevel>('C2');
  const [formTeks, setFormTeks] = useState('');
  const [formGambarUrl, setFormGambarUrl] = useState('');
  const [formOpsiA, setFormOpsiA] = useState('');
  const [formOpsiB, setFormOpsiB] = useState('');
  const [formOpsiC, setFormOpsiC] = useState('');
  const [formOpsiD, setFormOpsiD] = useState('');
  const [formKunci, setFormKunci] = useState<OptionKey>('A');
  const [formPembahasan, setFormPembahasan] = useState('');

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchMapel = filterMapel === 'all' || q.mapel === filterMapel;
      const matchLevel = filterLevel === 'all' || q.level === filterLevel;
      const matchSearch =
        searchQuery === '' ||
        q.teks_soal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topik.toLowerCase().includes(searchQuery.toLowerCase());

      return matchMapel && matchLevel && matchSearch;
    });
  }, [questions, filterMapel, filterLevel, searchQuery]);

  // Paginated Questions
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(start, start + itemsPerPage);
  }, [filteredQuestions, currentPage, itemsPerPage]);

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormMapel('Matematika');
    setFormTopik('');
    setFormLevel('C2');
    setFormTeks('');
    setFormGambarUrl('');
    setFormOpsiA('');
    setFormOpsiB('');
    setFormOpsiC('');
    setFormOpsiD('');
    setFormKunci('A');
    setFormPembahasan('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormMapel(q.mapel);
    setFormTopik(q.topik);
    setFormLevel(q.level);
    setFormTeks(q.teks_soal);
    setFormGambarUrl(q.gambar_url || '');
    setFormOpsiA(q.opsi_a);
    setFormOpsiB(q.opsi_b);
    setFormOpsiC(q.opsi_c);
    setFormOpsiD(q.opsi_d);
    setFormKunci(q.kunci);
    setFormPembahasan(q.pembahasan || '');
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus butir soal ini?')) {
      StorageService.deleteQuestion(id);
      setQuestions(StorageService.getQuestions());
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeks.trim() || !formOpsiA.trim() || !formOpsiB.trim()) {
      alert('Mohon lengkapi teks soal dan pilihan jawaban.');
      return;
    }

    const newQuestion: Question = {
      question_id: editingQuestion ? editingQuestion.question_id : `q_${Date.now()}`,
      mapel: formMapel,
      topik: formTopik.trim() || 'Umum',
      level: formLevel,
      teks_soal: formTeks.trim(),
      gambar_url: formGambarUrl.trim() || undefined,
      opsi_a: formOpsiA.trim(),
      opsi_b: formOpsiB.trim(),
      opsi_c: formOpsiC.trim(),
      opsi_d: formOpsiD.trim(),
      kunci: formKunci,
      pembahasan: formPembahasan.trim() || undefined,
      aktif: true,
    };

    StorageService.saveQuestion(newQuestion);
    setQuestions(StorageService.getQuestions());
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Bank Soal
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Kelola soal TKA untuk Matematika dan Bahasa Indonesia.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Soal</span>
        </button>
      </div>

      {/* Filter Bar matching mockup */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        
        {/* Dropdown 1: Mapel */}
        <div className="sm:col-span-4">
          <select
            value={filterMapel}
            onChange={(e) => {
              setFilterMapel(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="all">Semua Mata Pelajaran</option>
            <option value="Matematika">Matematika</option>
            <option value="Bahasa Indonesia">Bahasa Indonesia</option>
          </select>
        </div>

        {/* Dropdown 2: Level Kognitif */}
        <div className="sm:col-span-3">
          <select
            value={filterLevel}
            onChange={(e) => {
              setFilterLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="all">Semua Level Kognitif</option>
            <option value="C1">Level C1 (Pengetahuan/Ingatan)</option>
            <option value="C2">Level C2 (Aplikasi/Penerapan)</option>
            <option value="C3">Level C3 (Penalaran/Analisis)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="sm:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari soal..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

      </div>

      {/* Questions Table matching reference mockup */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/70 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Soal</th>
                <th className="py-3 px-4 w-36">Mata Pelajaran</th>
                <th className="py-3 px-4 w-24 text-center">Level</th>
                <th className="py-3 px-4 w-16 text-center">Kunci</th>
                <th className="py-3 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentItems.length > 0 ? (
                currentItems.map((q, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={q.question_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {globalIdx}
                      </td>
                      <td className="py-3 px-4">
                        <div className="line-clamp-2 font-medium text-slate-900 leading-snug">
                          {q.teks_soal}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Topik: {q.topik}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            q.mapel === 'Matematika'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          {q.mapel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-700 px-2 py-0.5 bg-slate-100 rounded">
                          {q.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-bold inline-flex items-center justify-center font-mono">
                          {q.kunci}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPreviewQuestion(q)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Lihat Pratinjau Soal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(q)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Edit Soal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(q.question_id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Soal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada butir soal yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredQuestions.length)} dari{' '}
            {filteredQuestions.length} butir soal
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === p
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 5 && <span className="px-1 text-slate-400">...</span>}
          </div>
        </div>
      </div>

      {/* Modal: Tambah / Edit Soal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingQuestion ? 'Edit Butir Soal' : 'Tambah Soal Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={formMapel}
                    onChange={(e) => setFormMapel(e.target.value as Subject)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Topik / Materi</label>
                  <input
                    type="text"
                    value={formTopik}
                    onChange={(e) => setFormTopik(e.target.value)}
                    placeholder="Contoh: Geometri Bangun Ruang"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Level Kognitif</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as CognitiveLevel)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  >
                    <option value="C1">C1 - Pengetahuan (Mengingat)</option>
                    <option value="C2">C2 - Penerapan (Aplikasi)</option>
                    <option value="C3">C3 - Penalaran (Analisis)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teks Soal</label>
                <textarea
                  value={formTeks}
                  onChange={(e) => setFormTeks(e.target.value)}
                  rows={4}
                  placeholder="Tuliskan butir soal di sini..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL Gambar (Opsional)</label>
                <input
                  type="text"
                  value={formGambarUrl}
                  onChange={(e) => setFormGambarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Options A - D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilihan A</label>
                  <input
                    type="text"
                    value={formOpsiA}
                    onChange={(e) => setFormOpsiA(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilihan B</label>
                  <input
                    type="text"
                    value={formOpsiB}
                    onChange={(e) => setFormOpsiB(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilihan C</label>
                  <input
                    type="text"
                    value={formOpsiC}
                    onChange={(e) => setFormOpsiC(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilihan D</label>
                  <input
                    type="text"
                    value={formOpsiD}
                    onChange={(e) => setFormOpsiD(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Kunci Jawaban */}
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sky-900 block">Kunci Jawaban yang Benar:</span>
                  <span className="text-[11px] text-sky-700">Digunakan untuk penilaian otomatis di server</span>
                </div>
                <div className="flex gap-2">
                  {(['A', 'B', 'C', 'D'] as OptionKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormKunci(key)}
                      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        formKunci === key
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pembahasan (Opsional)</label>
                <textarea
                  value={formPembahasan}
                  onChange={(e) => setFormPembahasan(e.target.value)}
                  rows={2}
                  placeholder="Tuliskan pembahasan atau rumus penyelesaian..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
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
                  Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview Soal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
                  {previewQuestion.mapel}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {previewQuestion.topik} · Level {previewQuestion.level}
                </span>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-medium text-slate-900 whitespace-pre-line mb-4">
              {previewQuestion.teks_soal}
            </p>

            {previewQuestion.gambar_url && (
              <div className="mb-4 rounded-xl overflow-hidden border border-slate-200">
                <img src={previewQuestion.gambar_url} alt="Gambar Soal" className="w-full h-auto" />
              </div>
            )}

            <div className="space-y-2 text-xs">
              {[
                { k: 'A', text: previewQuestion.opsi_a },
                { k: 'B', text: previewQuestion.opsi_b },
                { k: 'C', text: previewQuestion.opsi_c },
                { k: 'D', text: previewQuestion.opsi_d },
              ].map(({ k, text }) => {
                const isKey = previewQuestion.kunci === k;
                return (
                  <div
                    key={k}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isKey
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>
                      <strong>{k}.</strong> {text}
                    </span>
                    {isKey && (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Kunci Jawaban
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {previewQuestion.pembahasan && (
              <div className="mt-4 p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-900">
                <span className="font-bold block mb-1">Pembahasan:</span>
                <p className="leading-relaxed">{previewQuestion.pembahasan}</p>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
