import React, { useState, useMemo } from 'react';
import {
  Printer,
  Search,
  Users,
  CreditCard,
  SlidersHorizontal,
  X,
  RotateCcw,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Student } from '../../types/cbt';
import { StorageService, AppSettings } from '../../services/storageService';
import { SchoolLogo } from '../common/SchoolLogo';

interface AdminCetakKartuProps {
  onBackToDataSiswa?: () => void;
}

export const AdminCetakKartu: React.FC<AdminCetakKartuProps> = ({ onBackToDataSiswa }) => {
  const [students] = useState<Student[]>(() => StorageService.getStudents());
  const [settings] = useState<AppSettings>(() => StorageService.getSettings());

  // Filter States
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Customization Options for the printed cards
  const [judulUjian, setJudulUjian] = useState('TES KEMAMPUAN AKADEMIK (TKA) KELAS IX');
  const [tahunPelajaran, setTahunPelajaran] = useState(settings.tahunPelajaran || '2025/2026');
  const [ruangUjian, setRuangUjian] = useState('Lab Komputer CBT');
  const [sesiUjian, setSesiUjian] = useState('Sesi Terjadwal');
  const [penandatangan, setPenandatangan] = useState<'kepala' | 'proktor' | 'keduanya'>('kepala');
  const [tempatTanggal, setTempatTanggal] = useState(`${settings.tempatCetak || 'Pulung, Ponorogo'}, 2025`);
  const [tampilkanFotoBox, setTampilkanFotoBox] = useState(true);
  const [tampilkanPetunjuk, setTampilkanPetunjuk] = useState(true);
  const [cardDensity, setCardDensity] = useState<'standard' | 'compact'>('standard');

  // Single card print modal / target
  const [singleStudent, setSingleStudent] = useState<Student | null>(null);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    let list = students;
    if (singleStudent) {
      return [singleStudent];
    }
    return list.filter((s) => {
      const matchKelas = filterKelas === 'all' || s.kelas === filterKelas;
      const matchSearch =
        searchQuery === '' ||
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery);
      return matchKelas && matchSearch;
    });
  }, [students, filterKelas, searchQuery, singleStudent]);

  // Count by classes
  const countsByClass = useMemo(() => {
    const counts: Record<string, number> = { '9A': 0, '9B': 0, '9C': 0, '9D': 0, '9E': 0 };
    students.forEach((s) => {
      if (counts[s.kelas] !== undefined) {
        counts[s.kelas]++;
      }
    });
    return counts;
  }, [students]);

  const handlePrint = () => {
    window.print();
  };

  const handlePrintSingle = (student: Student) => {
    setSingleStudent(student);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Print CSS Specific Injection */}
      <style>{`
        @media print {
          /* Hide all non-printable elements */
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          aside, header, nav, .no-print, .no-print * {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .printable-card-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6mm !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .student-card-box {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 1.5px solid #1e293b !important;
            box-shadow: none !important;
            background: white !important;
            margin-bottom: 4mm !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
        }
      `}</style>

      {/* Control / Toolbar Section (Hidden during print) */}
      <div className="no-print space-y-4">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 mb-1">
              <CreditCard className="w-4 h-4" />
              <span>CBT SMP Negeri 2 Pulung · Administrasi Peserta</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Cetak Kartu Login Siswa
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Cetak kartu peserta login ujian lengkap dengan NIS, PIN login, kop sekolah resmi, dan kolom pengesahan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {singleStudent && (
              <button
                onClick={() => setSingleStudent(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Kembali ke Semua Kartu</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              disabled={filteredStudents.length === 0}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-sky-600/25 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                Cetak {singleStudent ? '1 Kartu' : `${filteredStudents.length} Kartu`} (Print / PDF)
              </span>
            </button>
          </div>
        </div>

        {/* Filter and Class Tabs */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          {/* Class Quick Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Filter Kelas:
            </span>
            <button
              onClick={() => {
                setFilterKelas('all');
                setSingleStudent(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterKelas === 'all' && !singleStudent
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Semua Kelas ({students.length})
            </button>
            {(['9A', '9B', '9C', '9D', '9E'] as const).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setFilterKelas(k);
                  setSingleStudent(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterKelas === k && !singleStudent
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Kelas {k} ({countsByClass[k] || 0})
              </button>
            ))}
          </div>

          {/* Search & Customization Toggle Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSingleStudent(null);
                }}
                placeholder="Cari NIS atau Nama Siswa..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            {/* Ruang & Sesi Customizer */}
            <div className="md:col-span-3">
              <input
                type="text"
                value={ruangUjian}
                onChange={(e) => setRuangUjian(e.target.value)}
                placeholder="Ruang: Lab Komputer"
                title="Teks Ruang Ujian pada Kartu"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <input
                type="text"
                value={sesiUjian}
                onChange={(e) => setSesiUjian(e.target.value)}
                placeholder="Sesi Ujian"
                title="Teks Sesi Ujian pada Kartu"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Penandatangan Option */}
            <div className="md:col-span-3">
              <select
                value={penandatangan}
                onChange={(e) => setPenandatangan(e.target.value as 'kepala' | 'proktor' | 'keduanya')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="kepala">Tanda Tangan: Kepala Sekolah</option>
                <option value="proktor">Tanda Tangan: Guru / Proktor CBT</option>
                <option value="keduanya">Tanda Tangan: Keduanya</option>
              </select>
            </div>
          </div>

          {/* Additional Print Settings */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tampilkanFotoBox}
                  onChange={(e) => setTampilkanFotoBox(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Tampilkan Kotak Pas Foto / Barcode</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tampilkanPetunjuk}
                  onChange={(e) => setTampilkanPetunjuk(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Tampilkan Petunjuk Login Siswa</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Ukuran Kartu:</span>
                <button
                  type="button"
                  onClick={() => setCardDensity('standard')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    cardDensity === 'standard' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'text-slate-500'
                  }`}
                >
                  Standar (6/hal)
                </button>
                <button
                  type="button"
                  onClick={() => setCardDensity('compact')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    cardDensity === 'compact' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'text-slate-500'
                  }`}
                >
                  Rapat (8/hal)
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              Menampilkan <span className="font-bold text-slate-900">{filteredStudents.length}</span> kartu siap cetak
            </div>
          </div>
        </div>

        {/* Print Instruction Alert */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-sky-900">
          <Printer className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Tips Mencetak:</span> Gunakan browser print (<kbd className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[10px]">Ctrl + P</kbd> / Tombol <strong>Cetak Kartu</strong>). Pilih ukuran kertas <strong>A4</strong> atau <strong>F4/Legal</strong>, orientasi <strong>Portrait</strong>, margin <strong>Default</strong> atau <strong>Minimum</strong>, dan aktifkan centang <strong>Background graphics</strong> agar garis dan logo tercetak tajam.
          </div>
        </div>
      </div>

      {/* Main Printable Cards Section */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="font-bold text-slate-700 text-base">Tidak ada siswa yang ditemukan</div>
          <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Pastikan filter kelas atau kata kunci pencarian sesuai, atau masukkan data siswa terlebih dahulu di menu Data Siswa.
          </div>
        </div>
      ) : (
        <div className="printable-cards-area">
          {/* Responsive Grid on Screen, 2 columns on Paper */}
          <div className="printable-card-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((student, idx) => (
              <div
                key={student.student_id || student.nis}
                className={`student-card-box bg-white rounded-xl border border-slate-300 shadow-xs relative flex flex-col justify-between overflow-hidden transition-all ${
                  cardDensity === 'compact' ? 'p-3' : 'p-4'
                }`}
              >
                {/* Single print button overlay (Hidden during print) */}
                <div className="no-print absolute top-2 right-2 flex items-center gap-1 z-10">
                  <button
                    onClick={() => handlePrintSingle(student)}
                    title="Cetak kartu siswa ini saja"
                    className="p-1.5 bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-600 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Cetak Satuan</span>
                  </button>
                </div>

                <div>
                  {/* KOP KARTU RESMI SMP NEGERI 2 PULUNG */}
                  <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-900">
                    <div className="shrink-0 flex items-center justify-center">
                      <SchoolLogo size={cardDensity === 'compact' ? 36 : 42} showText={false} />
                    </div>
                    <div className="flex-1 text-center pr-2">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-700 leading-tight">
                        PEMERINTAH KABUPATEN PONOROGO · DINAS PENDIDIKAN
                      </div>
                      <div className="text-[12px] font-black uppercase tracking-tight text-slate-950 leading-tight">
                        SMP NEGERI 2 PULUNG
                      </div>
                      <div className="text-[10px] font-bold text-sky-900 leading-tight mt-0.5">
                        KARTU PESERTA {judulUjian}
                      </div>
                      <div className="text-[9px] font-medium text-slate-600 leading-none">
                        TAHUN PELAJARAN {tahunPelajaran}
                      </div>
                    </div>
                  </div>

                  {/* IDENTITAS SISWA & LOGIN CREDENTIALS */}
                  <div className="py-2.5 flex items-start justify-between gap-3">
                    <table className="flex-1 text-left border-collapse text-[11px] leading-snug">
                      <tbody>
                        <tr>
                          <td className="py-0.5 pr-2 font-medium text-slate-600 w-24">Nomor Peserta / NIS</td>
                          <td className="py-0.5 px-1 font-bold text-slate-700">:</td>
                          <td className="py-0.5 pl-1 font-mono font-bold text-slate-950 text-xs">
                            {student.nis}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2 font-medium text-slate-600">Nama Siswa</td>
                          <td className="py-0.5 px-1 font-bold text-slate-700">:</td>
                          <td className="py-0.5 pl-1 font-bold text-slate-950 uppercase">
                            {student.nama}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2 font-medium text-slate-600">Rombel / Kelas</td>
                          <td className="py-0.5 px-1 font-bold text-slate-700">:</td>
                          <td className="py-0.5 pl-1 font-bold text-sky-900">
                            Kelas IX-{student.kelas.replace(/^9/, '')} ({student.kelas})
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2 font-medium text-slate-600">Ruang & Sesi</td>
                          <td className="py-0.5 px-1 font-bold text-slate-700">:</td>
                          <td className="py-0.5 pl-1 font-medium text-slate-800">
                            {student.ruang || ruangUjian} · {student.sesi || sesiUjian}
                          </td>
                        </tr>
                        <tr className="border-t border-dashed border-slate-200">
                          <td className="pt-1.5 pb-0.5 pr-2 font-bold text-sky-900">Username Login</td>
                          <td className="pt-1.5 pb-0.5 px-1 font-bold text-sky-900">:</td>
                          <td className="pt-1.5 pb-0.5 pl-1 font-mono font-black text-slate-950 text-xs tracking-wider">
                            {student.nis}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-0.5 pr-2 font-bold text-sky-900">Password / PIN</td>
                          <td className="py-0.5 px-1 font-bold text-sky-900">:</td>
                          <td className="py-0.5 pl-1">
                            <span className="font-mono font-black text-xs px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-950 tracking-widest inline-block">
                              {student.pin || student.nis}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Photo / QR Box Placeholder */}
                    {tampilkanFotoBox && (
                      <div className="shrink-0 flex flex-col items-center justify-center">
                        <div className="w-16 h-20 border border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center p-1 rounded">
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                            Pas Foto
                          </div>
                          <div className="text-[7px] text-slate-400">
                            2 x 3 cm
                          </div>
                          <div className="mt-1 pt-1 border-t border-slate-200 w-full flex items-center justify-center text-slate-400">
                            <QrCode className="w-3.5 h-3.5 opacity-60" />
                          </div>
                        </div>
                        <div className="text-[8px] font-mono font-bold text-slate-500 mt-0.5">
                          {student.nis}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* INSTRUCTIONS */}
                  {tampilkanPetunjuk && (
                    <div className="bg-slate-50 border border-slate-200 rounded p-1.5 my-1 text-[9px] text-slate-700 leading-tight">
                      <div className="font-bold text-slate-900 flex items-center gap-1 mb-0.5">
                        <ShieldCheck className="w-2.5 h-2.5 text-sky-700" />
                        <span>Petunjuk Peserta:</span>
                      </div>
                      <ol className="list-decimal pl-3 space-y-0.5">
                        <li>Buka peramban (browser) dan akses portal CBT TKA SMPN 2 Pulung.</li>
                        <li>Masukkan <strong>NIS</strong> pada Username dan <strong>PIN</strong> pada Password.</li>
                        <li>Jaga kerahasiaan PIN dan bawa kartu ini pada setiap sesi ujian.</li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* SIGNATURE SECTION / PENGESAHAN */}
                <div className="pt-2 border-t border-slate-200 mt-1 flex items-end justify-between text-[9px] text-slate-800">
                  <div className="text-[8px] text-slate-500 italic">
                    Dicetak resmi melalui Sistem CBT SMPN 2 Pulung
                  </div>

                  <div className="text-right">
                    <div className="font-medium text-slate-700">
                      {tempatTanggal}
                    </div>
                    
                    {penandatangan === 'kepala' && (
                      <div>
                        <div className="text-[9px] text-slate-600">Mengetahui, Kepala Sekolah</div>
                        <div className="h-9 flex items-center justify-end pr-4 text-slate-300 text-[8px] italic select-none">
                          ( Tanda Tangan & Stempel )
                        </div>
                        <div className="font-bold underline text-slate-950 text-[10px]">
                          {settings.namaKepalaSekolah || 'Drs. SUPRIYANTO, M.Pd.'}
                        </div>
                        <div className="font-mono text-[8px] text-slate-600">
                          NIP. {settings.nipKepalaSekolah || '19680512 199412 1 002'}
                        </div>
                      </div>
                    )}

                    {penandatangan === 'proktor' && (
                      <div>
                        <div className="text-[9px] text-slate-600">
                          {settings.jabatanProktor || 'Guru Pengampu / Proktor CBT'}
                        </div>
                        <div className="h-9 flex items-center justify-end pr-4 text-slate-300 text-[8px] italic select-none">
                          ( Tanda Tangan )
                        </div>
                        <div className="font-bold underline text-slate-950 text-[10px]">
                          {settings.namaProktor || 'BUDI SANTOSO, S.Pd.'}
                        </div>
                        <div className="font-mono text-[8px] text-slate-600">
                          NIP. {settings.nipProktor || '19850101 201001 1 005'}
                        </div>
                      </div>
                    )}

                    {penandatangan === 'keduanya' && (
                      <div className="flex items-end gap-6 text-center">
                        <div>
                          <div className="text-[8px] text-slate-600">Proktor CBT</div>
                          <div className="h-7" />
                          <div className="font-bold underline text-slate-950 text-[9px]">
                            {settings.namaProktor || 'BUDI SANTOSO, S.Pd.'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-600">Kepala Sekolah</div>
                          <div className="h-7" />
                          <div className="font-bold underline text-slate-950 text-[9px]">
                            {settings.namaKepalaSekolah || 'Drs. SUPRIYANTO, M.Pd.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scissor / Cut mark indication */}
                <div className="no-print pt-2 mt-2 border-t border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 gap-1 select-none">
                  <span>✂</span>
                  <span>Garis batas potong kartu</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
