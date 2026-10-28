import React, { useState, useMemo } from 'react';
import { Download, Search, FileText, CheckCircle2, XCircle, X, Printer, Filter, AlertOctagon } from 'lucide-react';
import { ExamReport, ExamAttempt } from '../../types/cbt';
import { StorageService } from '../../services/storageService';

export const AdminRekapNilai: React.FC = () => {
  const [reports, setReports] = useState<ExamReport[]>(() => StorageService.getReports());
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterKeterangan, setFilterKeterangan] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected student for detail answer modal
  const [selectedStudentReport, setSelectedStudentReport] = useState<ExamReport | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);

  // PDF Print Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfClassFilter, setPdfClassFilter] = useState<string>('all');
  const [showEditSignatures, setShowEditSignatures] = useState(false);

  // App settings for Kop Surat and Signatures
  const [settings, setSettings] = useState(() => StorageService.getSettings());

  // Inline signature edit state
  const [customKepala, setCustomKepala] = useState(settings.namaKepalaSekolah || 'Drs. SUPRIYANTO, M.Pd.');
  const [customNipKepala, setCustomNipKepala] = useState(settings.nipKepalaSekolah || '19680512 199412 1 002');
  const [customProktor, setCustomProktor] = useState(settings.namaProktor || 'BUDI SANTOSO, S.Pd.');
  const [customNipProktor, setCustomNipProktor] = useState(settings.nipProktor || '19850101 201001 1 005');
  const [customJabatanProktor, setCustomJabatanProktor] = useState(settings.jabatanProktor || 'Guru Pengampu / Proktor CBT');
  const [customTempat, setCustomTempat] = useState(settings.tempatCetak || 'Pulung, Ponorogo');
  const [customAlamat, setCustomAlamat] = useState(settings.alamatSekolah || 'Jl. Raya Pulung, Desa Kesugihan, Kec. Pulung, Kabupaten Ponorogo, Jawa Timur 63492');

  const handleSaveSignatures = () => {
    const updated = {
      ...settings,
      namaKepalaSekolah: customKepala.trim(),
      nipKepalaSekolah: customNipKepala.trim(),
      namaProktor: customProktor.trim(),
      nipProktor: customNipProktor.trim(),
      jabatanProktor: customJabatanProktor.trim(),
      tempatCetak: customTempat.trim(),
      alamatSekolah: customAlamat.trim(),
    };
    StorageService.saveSettings(updated);
    setSettings(updated);
    setShowEditSignatures(false);
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchKelas = filterKelas === 'all' || r.kelas === filterKelas;
      const matchKet = filterKeterangan === 'all' || r.keterangan === filterKeterangan;
      const matchSearch =
        searchQuery === '' ||
        r.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nis.includes(searchQuery);

      return matchKelas && matchKet && matchSearch;
    });
  }, [reports, filterKelas, filterKeterangan, searchQuery]);

  // Data for PDF printing (either all or specific class: 9A, 9B, 9C, 9D, 9E)
  const pdfReports = useMemo(() => {
    if (pdfClassFilter === 'all') {
      return reports;
    }
    return reports.filter((r) => r.kelas === pdfClassFilter);
  }, [reports, pdfClassFilter]);

  // PDF statistics calculation
  const pdfStats = useMemo(() => {
    const list = pdfReports;
    const total = list.length;
    if (total === 0) {
      return { total: 0, highest: 0, lowest: 0, average: '0', tuntas: 0, belumTuntas: 0, pctTuntas: '0%' };
    }

    const averages = list.map((r) => r.rata_rata).filter((n) => n > 0);
    const highest = averages.length > 0 ? Math.max(...averages) : 0;
    const lowest = averages.length > 0 ? Math.min(...averages) : 0;
    const sum = averages.reduce((acc, curr) => acc + curr, 0);
    const avg = averages.length > 0 ? (sum / averages.length).toFixed(2).replace('.', ',') : '0';
    const tuntas = list.filter((r) => r.keterangan === 'Tuntas').length;
    const belumTuntas = total - tuntas;
    const pct = Math.round((tuntas / total) * 100);

    return {
      total,
      highest,
      lowest,
      average: avg,
      tuntas,
      belumTuntas,
      pctTuntas: `${pct}%`,
    };
  }, [pdfReports]);

  const handleExportCsv = () => {
    StorageService.exportResultsCsv();
  };

  const handleOpenDetail = (r: ExamReport) => {
    setSelectedStudentReport(r);
    const attempt = StorageService.getStudentAttempt(r.student_id, 'exam_01');
    setSelectedAttempt(attempt || null);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Rekap Nilai
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Hasil ujian TKA siswa Kelas IX SMP Negeri 2 Pulung (Kelas 9A, 9B, 9C, 9D, 9E).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Print PDF Button */}
          <button
            onClick={() => {
              setPdfClassFilter(filterKelas === 'all' ? '9A' : filterKelas);
              setIsPdfModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-600/25 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap PDF</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Quick Per-Class Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-sky-600" />
          <span>Pilih Kelas:</span>
        </span>
        {[
          { id: 'all', label: 'Semua Kelas' },
          { id: '9A', label: 'Kelas 9A' },
          { id: '9B', label: 'Kelas 9B' },
          { id: '9C', label: 'Kelas 9C' },
          { id: '9D', label: 'Kelas 9D' },
          { id: '9E', label: 'Kelas 9E' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterKelas(c.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              filterKelas === c.id
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Filter Row matching reference mockup */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        
        {/* Dropdown: Kelas */}
        <div className="sm:col-span-3">
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="all">Semua Kelas (9A - 9E)</option>
            <option value="9A">Kelas IX-A</option>
            <option value="9B">Kelas IX-B</option>
            <option value="9C">Kelas IX-C</option>
            <option value="9D">Kelas IX-D</option>
            <option value="9E">Kelas IX-E</option>
          </select>
        </div>

        {/* Dropdown: Keterangan Kelulusan */}
        <div className="sm:col-span-3">
          <select
            value={filterKeterangan}
            onChange={(e) => setFilterKeterangan(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="all">Semua Status Ketuntasan</option>
            <option value="Tuntas">Tuntas (≥ KKM 75)</option>
            <option value="Belum Tuntas">Belum Tuntas (&lt; KKM 75)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa atau NIS..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

      </div>

      {/* Table matching reference mockup */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/70 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-24">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4 w-20 text-center">Kelas</th>
                <th className="py-3 px-4 w-28 text-center">Matematika</th>
                <th className="py-3 px-4 w-32 text-center">Bahasa Indonesia</th>
                <th className="py-3 px-4 w-24 text-center">Rata-rata</th>
                <th className="py-3 px-4 w-28 text-center">Keterangan</th>
                <th className="py-3 px-4 w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReports.length > 0 ? (
                filteredReports.map((r, idx) => (
                  <tr key={r.student_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{r.nis}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{r.nama}</td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">{r.kelas}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {r.nilai_matematika !== undefined ? r.nilai_matematika : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {r.nilai_bahasa !== undefined ? r.nilai_bahasa : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-800">
                      {r.rata_rata ? r.rata_rata.toFixed(2).replace('.', ',') : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.keterangan === 'Tuntas' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Tuntas</span>
                        </span>
                      ) : r.keterangan === 'Belum Ujian' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <span>Belum Ujian</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-3 h-3" />
                          <span>Belum Tuntas</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenDetail(r)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                        title="Lihat Detail Lembar Jawaban Siswa"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data nilai siswa untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CETAK / EXPORT REKAP NILAI PDF PER KELAS          */}
      {/* ======================================================== */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 print:shadow-none print:border-none print:max-w-none print:max-h-none print:rounded-none">
            
            {/* Modal Header Controls (Hidden during physical printing) */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-3xl print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Cetak / Simpan PDF Rekap Nilai TKA
                  </h3>
                  <p className="text-xs text-slate-500">
                    Format resmi cetak lembar nilai per kelas (Kop Sekolah Resmi SMPN 2 Pulung)
                  </p>
                </div>
              </div>

              {/* Class Selector for PDF */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Pilih Kelas:</span>
                <select
                  value={pdfClassFilter}
                  onChange={(e) => setPdfClassFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-sky-800 focus:ring-2 focus:ring-sky-500 shadow-xs"
                >
                  <option value="all">Semua Kelas (9A - 9E)</option>
                  <option value="9A">Kelas IX-A</option>
                  <option value="9B">Kelas IX-B</option>
                  <option value="9C">Kelas IX-C</option>
                  <option value="9D">Kelas IX-D</option>
                  <option value="9E">Kelas IX-E</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowEditSignatures(!showEditSignatures)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Sesuaikan nama kepala sekolah, NIP, guru pengampu, kota, dan kop surat"
                >
                  <span>✏️ Ubah TTD & Kop</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-sky-600/30 transition-all cursor-pointer ml-1"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen (Ctrl+P)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Inline Signature & Kop Customizer (Accordion) */}
            {showEditSignatures && (
              <div className="p-4 sm:p-5 bg-sky-50/70 border-b border-sky-100 text-xs font-sans print:hidden animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sky-950 text-sm">
                    Sesuaikan Kolom Pengesahan Tanda Tangan & Kop Surat
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Perubahan akan langsung tampil pada lembar cetak di bawah dan tersimpan otomatis
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kepala Sekolah</label>
                    <input
                      type="text"
                      value={customKepala}
                      onChange={(e) => setCustomKepala(e.target.value)}
                      placeholder="Nama & Gelar Kepala Sekolah"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={customNipKepala}
                      onChange={(e) => setCustomNipKepala(e.target.value)}
                      placeholder="NIP Kepala Sekolah"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg mt-1 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Guru Pengampu / Proktor CBT</label>
                    <input
                      type="text"
                      value={customProktor}
                      onChange={(e) => setCustomProktor(e.target.value)}
                      placeholder="Nama Guru / Proktor"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={customNipProktor}
                      onChange={(e) => setCustomNipProktor(e.target.value)}
                      placeholder="NIP Guru / Proktor"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg mt-1 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tempat & Tanggal Pengesahan</label>
                    <input
                      type="text"
                      value={customTempat}
                      onChange={(e) => setCustomTempat(e.target.value)}
                      placeholder="Contoh: Pulung, Ponorogo"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleSaveSignatures}
                      className="w-full mt-1 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs transition-colors"
                    >
                      Terapkan Perubahan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Document Printable Sheet (Paper A4 Format) */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white font-serif text-slate-900 print:overflow-visible print:p-0">
              
              {/* KOP SURAT RESMI SMP NEGERI 2 PULUNG */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-black relative">
                {/* Official Logo on Left */}
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <img
                    src="/assets/logo_smpn2_pulung.png"
                    alt="Logo SMPN 2 Pulung"
                    className="w-full h-full object-contain filter drop-shadow-sm"
                  />
                </div>

                {/* Kop Text Center */}
                <div className="flex-1 text-center px-4">
                  <div className="text-xs uppercase font-semibold tracking-wider leading-tight text-slate-800">
                    {settings.kabupatenKota || 'Pemerintah Kabupaten Ponorogo'}
                  </div>
                  <div className="text-xs uppercase font-bold tracking-wider leading-tight text-slate-800">
                    Dinas Pendidikan
                  </div>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight leading-tight text-slate-900 mt-0.5">
                    {settings.namaSekolah || 'SMP Negeri 2 Pulung'}
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-sans text-slate-600 leading-tight mt-1">
                    {settings.alamatSekolah || 'Jl. Raya Pulung, Desa Kesugihan, Kec. Pulung, Kabupaten Ponorogo, Jawa Timur 63492'}
                  </p>
                  <p className="text-[10px] font-sans text-slate-500 leading-tight">
                    Website: {settings.namaSekolah.toLowerCase().replace(/\s+/g, '')}.sch.id · CBT TKA Kelas IX
                  </p>
                </div>

                {/* Empty right placeholder for perfect symmetrical centering */}
                <div className="w-20 shrink-0 hidden sm:block" />
              </div>

              {/* Decorative Double Header Line */}
              <div className="border-b-4 border-black mt-1 mb-5" />

              {/* Document Title */}
              <div className="text-center mb-6">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide underline underline-offset-4 text-slate-900">
                  DAFTAR REKAPITULASI NILAI TES KEMAMPUAN AKADEMIK (TKA) KELAS IX
                </h3>
                {settings.tahunPelajaran ? (
                  <div className="text-xs uppercase font-bold text-slate-700 mt-1">
                    TAHUN PELAJARAN {settings.tahunPelajaran}
                  </div>
                ) : null}
              </div>

              {/* Document Metadata Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans pb-3 mb-3 border-b border-slate-300">
                <div>
                  <span className="text-slate-600">Rombongan Belajar: </span>
                  <strong className="text-slate-900 uppercase">
                    {pdfClassFilter === 'all' ? 'Seluruh Kelas IX (9A - 9E)' : `Kelas IX-${pdfClassFilter.replace('9', '')}`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-600">Standar KKM: </span>
                  <strong className="text-slate-900">75 (Skala 0-100)</strong>
                </div>
                <div>
                  <span className="text-slate-600">Tanggal Cetak: </span>
                  <strong className="text-slate-900">{todayFormatted}</strong>
                </div>
              </div>

              {/* Printable Grade Table */}
              <table className="w-full text-xs font-sans border-collapse border border-black mb-6">
                <thead>
                  <tr className="bg-slate-100 text-black uppercase font-bold text-[11px]">
                    <th className="border border-black py-2 px-2.5 w-10 text-center">No</th>
                    <th className="border border-black py-2 px-3 w-24 text-center">NIS</th>
                    <th className="border border-black py-2 px-3 text-left">Nama Siswa</th>
                    <th className="border border-black py-2 px-2.5 w-16 text-center">Kelas</th>
                    <th className="border border-black py-2 px-3 w-28 text-center">Matematika</th>
                    <th className="border border-black py-2 px-3 w-32 text-center">Bahasa Indonesia</th>
                    <th className="border border-black py-2 px-3 w-24 text-center">Rata-rata</th>
                    <th className="border border-black py-2 px-3 w-28 text-center">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {pdfReports.map((r, idx) => (
                    <tr key={r.student_id} className="text-black">
                      <td className="border border-black py-1.5 px-2 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="border border-black py-1.5 px-3 text-center font-mono font-medium">
                        {r.nis}
                      </td>
                      <td className="border border-black py-1.5 px-3 font-medium">
                        {r.nama}
                      </td>
                      <td className="border border-black py-1.5 px-2.5 text-center font-semibold">
                        {r.kelas}
                      </td>
                      <td className="border border-black py-1.5 px-3 text-center font-mono font-semibold">
                        {r.nilai_matematika !== undefined ? r.nilai_matematika : '-'}
                      </td>
                      <td className="border border-black py-1.5 px-3 text-center font-mono font-semibold">
                        {r.nilai_bahasa !== undefined ? r.nilai_bahasa : '-'}
                      </td>
                      <td className="border border-black py-1.5 px-3 text-center font-mono font-bold">
                        {r.rata_rata ? r.rata_rata.toFixed(2).replace('.', ',') : '-'}
                      </td>
                      <td className="border border-black py-1.5 px-3 text-center font-semibold">
                        <span
                          className={
                            r.keterangan === 'Tuntas'
                              ? 'text-emerald-800 font-bold'
                              : r.keterangan === 'Belum Ujian'
                              ? 'text-slate-500'
                              : 'text-red-700 font-bold'
                          }
                        >
                          {r.keterangan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Class Statistics Summary Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-black p-3 rounded-lg text-xs font-sans mb-8 bg-slate-50 print:bg-transparent">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Jumlah Peserta</span>
                  <strong className="text-sm font-bold text-black">{pdfStats.total} Siswa</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Rata-rata Kelas</span>
                  <strong className="text-sm font-bold text-black">{pdfStats.average}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Nilai Tertinggi / Terendah</span>
                  <strong className="text-sm font-bold text-black">{pdfStats.highest} / {pdfStats.lowest}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Ketuntasan (≥ 75)</span>
                  <strong className="text-sm font-bold text-emerald-800">
                    {pdfStats.tuntas} ({pdfStats.pctTuntas})
                  </strong>
                </div>
              </div>

              {/* Official Signatures (Tanda Tangan Pengesahan) */}
              <div className="grid grid-cols-2 gap-8 text-xs font-sans pt-4 print:pt-6">
                <div className="text-center">
                  <p className="text-slate-700">Mengetahui,</p>
                  <p className="font-bold text-slate-900 mt-0.5">Kepala {settings.namaSekolah}</p>
                  <div className="h-20" />
                  <p className="font-bold text-slate-900 underline uppercase">{settings.namaKepalaSekolah || 'Drs. SUPRIYANTO, M.Pd.'}</p>
                  <p className="text-slate-600 font-mono text-[11px]">NIP. {settings.nipKepalaSekolah || '19680512 199412 1 002'}</p>
                </div>

                <div className="text-center">
                  <p className="text-slate-700">{settings.tempatCetak || 'Pulung, Ponorogo'}, {todayFormatted}</p>
                  <p className="font-bold text-slate-900 mt-0.5">{settings.jabatanProktor || 'Guru Pengampu / Proktor CBT'}</p>
                  <div className="h-20" />
                  <p className="font-bold text-slate-900 underline uppercase">{settings.namaProktor || 'BUDI SANTOSO, S.Pd.'}</p>
                  <p className="text-slate-600 font-mono text-[11px]">NIP. {settings.nipProktor || '19850101 201001 1 005'}</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Modal: Lembar Jawaban Detail */}
      {selectedStudentReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Detail Rekap: {selectedStudentReport.nama}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  NIS: {selectedStudentReport.nis} · Kelas {selectedStudentReport.kelas}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[11px] text-blue-700 font-semibold block">TKA Matematika</span>
                  <div className="text-2xl font-black text-blue-950 mt-1">
                    {selectedStudentReport.nilai_matematika ?? '-'}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Status: {selectedStudentReport.status_matematika}</span>
                </div>

                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">TKA Bahasa Indonesia</span>
                  <div className="text-2xl font-black text-emerald-950 mt-1">
                    {selectedStudentReport.nilai_bahasa ?? '-'}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Status: {selectedStudentReport.status_bahasa}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Rata-rata Nilai TKA:</span>
                  <span className="text-[11px] text-slate-500">Standar Kriteria Ketuntasan Minimal (KKM): 75</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-sky-800">
                    {selectedStudentReport.rata_rata.toFixed(2).replace('.', ',')}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedStudentReport.keterangan === 'Tuntas'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedStudentReport.keterangan}
                  </span>
                </div>
              </div>

              {selectedAttempt && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                  <div className="font-semibold text-slate-800">Catatan Waktu Server:</div>
                  <div>Mulai: {new Date(selectedAttempt.mulai_at).toLocaleString('id-ID')}</div>
                  <div>
                    Selesai:{' '}
                    {selectedAttempt.selesai_at
                      ? new Date(selectedAttempt.selesai_at).toLocaleString('id-ID')
                      : '-'}
                  </div>
                  <div className="flex gap-4 pt-1 font-mono text-[11px]">
                    <span className="text-emerald-700">Benar: {selectedAttempt.benar ?? 0}</span>
                    <span className="text-red-600">Salah: {selectedAttempt.salah ?? 0}</span>
                    <span className="text-slate-500">Kosong: {selectedAttempt.kosong ?? 0}</span>
                  </div>

                  {/* Anti-cheat tab violations status */}
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    {selectedAttempt.pelanggaran_tab !== undefined && selectedAttempt.pelanggaran_tab > 0 ? (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-semibold flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Catatan Keamanan: Terdeteksi {selectedAttempt.pelanggaran_tab}x keluar/berpindah tab saat ujian.</span>
                      </div>
                    ) : (
                      <div className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Integritas: Disiplin (0 pelanggaran tab).</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
