import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  Search,
  CreditCard,
  X,
  QrCode,
  Layers,
  Sparkles,
  Scissors,
  CheckCircle2,
  Download,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Student } from '../../types/cbt';
import { StorageService, AppSettings } from '../../services/storageService';
import { SchoolLogo } from '../common/SchoolLogo';
import { LOGO_SMPN2_BASE64 } from '../../data/logoBase64';

interface AdminCetakKartuProps {
  onBackToDataSiswa?: () => void;
}

export type CardLayoutType = '8' | '10' | '12' | '6';
export type TtdType = 'ringkas' | 'kepala' | 'proktor' | 'keduanya' | 'none';

export const AdminCetakKartu: React.FC<AdminCetakKartuProps> = ({ onBackToDataSiswa }) => {
  const [students] = useState<Student[]>(() => StorageService.getStudents());
  const [settings] = useState<AppSettings>(() => StorageService.getSettings());

  // Filter States: Default to Kelas 9A so it's not overwhelming 145 cards at once, but easy to switch
  const [filterKelas, setFilterKelas] = useState<string>('9A');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Layout & Density Preset (Default to 8 cards per page as requested)
  const [layoutMode, setLayoutMode] = useState<CardLayoutType>('8');

  // Customization Options for the printed cards
  const [judulUjian, setJudulUjian] = useState('TRYOUT TES KEMAMPUAN AKADEMIK (TKA) KELAS IX');
  const [tahunPelajaran, setTahunPelajaran] = useState(settings.tahunPelajaran || '2024/2025');
  const [ruangUjian, setRuangUjian] = useState('Lab CBT');
  const [sesiUjian, setSesiUjian] = useState('Sesi Terjadwal');
  const [penandatangan, setPenandatangan] = useState<TtdType>('ringkas');
  const [tempatTanggal, setTempatTanggal] = useState(`${settings.tempatCetak || 'Pulung, Ponorogo'}`);
  const [tampilkanFotoBox, setTampilkanFotoBox] = useState(true);
  const [tampilkanPetunjuk, setTampilkanPetunjuk] = useState(false);
  const [tampilkanGarisPotong, setTampilkanGarisPotong] = useState(true);

  // Single card print modal / target
  const [singleStudent, setSingleStudent] = useState<Student | null>(null);

  // Notice state for iframe print warning
  const [showIframeTip, setShowIframeTip] = useState(false);

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

  // Estimated sheets calculation
  const cardsPerPageCount = parseInt(layoutMode, 10);
  const estimatedSheets = Math.ceil(filteredStudents.length / cardsPerPageCount);

  // Target description label
  const getTargetLabel = () => {
    if (singleStudent) return `Siswa: ${singleStudent.nama} (1 Kartu)`;
    if (filterKelas === 'all') return `Semua Kelas IX (${filteredStudents.length} Siswa)`;
    return `Kelas ${filterKelas} (${filteredStudents.length} Siswa)`;
  };

  // Generate self-contained standalone HTML document for printing outside the iframe
  const generateStandaloneHtml = () => {
    const isDense = layoutMode === '8' || layoutMode === '10' || layoutMode === '12';
    const isSuperDense = layoutMode === '10' || layoutMode === '12';
    const cols = layoutMode === '12' ? 3 : 2;
    const cardMaxHeight =
      layoutMode === '8' ? '66mm' : layoutMode === '10' ? '53mm' : layoutMode === '12' ? '66mm' : '88mm';
    const margin = layoutMode === '6' ? '7mm 6mm' : layoutMode === '8' ? '5mm 5mm' : '4mm 4mm';
    const gap = layoutMode === '6' ? '4.5mm' : layoutMode === '8' ? '3mm' : '2mm';

    const cardsHtml = filteredStudents
      .map(
        (s) => `
      <div class="card">
        <!-- KOP KARTU -->
        <div class="kop">
          <div class="logo-box">
            <img src="${LOGO_SMPN2_BASE64}" alt="Logo SMP Negeri 2 Pulung" class="logo-img" />
          </div>
          <div class="kop-text">
            <div class="pemda">PEMKAB PONOROGO · DINAS PENDIDIKAN</div>
            <div class="sekolah">SMP NEGERI 2 PULUNG</div>
            <div class="judul">KARTU LOGIN ${judulUjian}</div>
            ${tahunPelajaran && !isSuperDense ? `<div class="tapel">TAPEL ${tahunPelajaran}</div>` : ''}
          </div>
        </div>

        <!-- IDENTITAS -->
        <div class="body">
          <table class="identitas-tbl">
            <tr>
              <td class="lbl">NIS Siswa</td>
              <td class="sep">:</td>
              <td class="val-mono"><strong>${s.nis}</strong></td>
            </tr>
            <tr>
              <td class="lbl">Nama Siswa</td>
              <td class="sep">:</td>
              <td class="val-nama"><strong>${s.nama.toUpperCase()}</strong></td>
            </tr>
            <tr>
              <td class="lbl">Kelas / Ruang</td>
              <td class="sep">:</td>
              <td class="val">Kelas ${s.kelas} · ${s.ruang || ruangUjian}</td>
            </tr>
            <tr class="row-login">
              <td class="lbl-login">Username</td>
              <td class="sep-login">:</td>
              <td class="val-mono"><strong>${s.nis}</strong></td>
            </tr>
            <tr>
              <td class="lbl-login">Password / PIN</td>
              <td class="sep-login">:</td>
              <td><span class="pin-badge">${s.pin || '12345'}</span></td>
            </tr>
          </table>

          ${
            tampilkanFotoBox
              ? `
          <div class="foto-box">
            <div class="qr-label">QR LOGIN</div>
            <div class="qr-sub">${s.nis}</div>
          </div>
          `
              : ''
          }
        </div>

        ${
          tampilkanPetunjuk
            ? `
        <div class="petunjuk">
          <strong>Petunjuk:</strong> Buka portal CBT, ketikkan <strong>Username (NIS)</strong> dan <strong>PIN</strong>. Bawa kartu pada setiap sesi.
        </div>
        `
            : ''
        }

        ${
          penandatangan !== 'none'
            ? `
        <div class="ttd-area">
          ${
            penandatangan === 'ringkas'
              ? `
            <div class="ttd-ringkas">
              <span><em>${tempatTanggal}</em></span>
              <span><strong>Proktor: ${settings.namaProktor || 'Pak Dedy Frisca'}</strong></span>
            </div>
            `
              : penandatangan === 'kepala'
              ? `
            <div class="ttd-formal">
              <div>${tempatTanggal}</div>
              <div>Kepala Sekolah,</div>
              <div class="ttd-space"></div>
              <div class="ttd-nama"><u>${settings.namaKepalaSekolah || 'Drs. SUPRIYANTO, M.Pd.'}</u></div>
            </div>
            `
              : `
            <div class="ttd-formal">
              <div>${tempatTanggal}</div>
              <div>Guru / Proktor CBT,</div>
              <div class="ttd-space"></div>
              <div class="ttd-nama"><u>${settings.namaProktor || 'Pak Dedy Frisca'}</u></div>
            </div>
            `
          }
        </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('\n');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>KARTU_LOGIN_SMPN2_PULUNG_${filterKelas.toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      padding: 10px;
    }
    @media print {
      body {
        background: white !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
    }
    @page {
      size: A4 portrait;
      margin: ${margin};
    }
    .print-banner {
      background: #0284c7;
      color: white;
      padding: 12px 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .print-banner-info {
      line-height: 1.4;
    }
    .print-title {
      font-size: 16px;
      font-weight: bold;
    }
    .print-sub {
      font-size: 13px;
      opacity: 0.9;
    }
    .btn-print-action {
      background: #f59e0b;
      color: #000;
      border: none;
      padding: 10px 22px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s;
    }
    .btn-print-action:hover {
      background: #d97706;
      color: white;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      gap: ${gap};
      width: 100%;
      background: white;
      padding: 5px;
    }
    .card {
      page-break-inside: avoid;
      break-inside: avoid;
      border: 1px ${tampilkanGarisPotong ? 'dashed #64748b' : 'solid #cbd5e1'};
      padding: ${isSuperDense ? '2.5mm' : isDense ? '3mm' : '4mm'};
      max-height: ${cardMaxHeight};
      height: ${cardMaxHeight};
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: white;
      box-sizing: border-box;
    }
    .kop {
      display: flex;
      align-items: center;
      gap: 2mm;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 1.5mm;
    }
    .logo-box {
      width: ${isSuperDense ? '10mm' : '12mm'};
      height: ${isSuperDense ? '10mm' : '12mm'};
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
    }
    .kop-text {
      flex: 1;
      text-align: center;
    }
    .pemda {
      font-size: ${isSuperDense ? '6.5pt' : '7pt'};
      font-weight: 600;
      color: #334155;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .sekolah {
      font-size: ${isSuperDense ? '8.5pt' : '9.5pt'};
      font-weight: 900;
      color: #020617;
      text-transform: uppercase;
      line-height: 1.15;
    }
    .judul {
      font-size: ${isSuperDense ? '7pt' : '7.5pt'};
      font-weight: bold;
      color: #0369a1;
      line-height: 1.1;
    }
    .tapel {
      font-size: 6pt;
      color: #64748b;
    }
    .body {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 2mm;
      padding-top: 1.5mm;
      flex: 1;
    }
    .identitas-tbl {
      flex: 1;
      border-collapse: collapse;
      font-size: ${isSuperDense ? '7.5pt' : isDense ? '8pt' : '9pt'};
      line-height: 1.2;
    }
    .identitas-tbl td { padding: 0.8px 0; }
    .lbl { width: 23mm; color: #475569; }
    .sep { width: 2mm; font-weight: bold; }
    .val-nama { color: #020617; font-size: ${isSuperDense ? '7.5pt' : '8pt'}; }
    .val-mono { font-family: monospace; font-size: ${isSuperDense ? '8pt' : '8.5pt'}; color: #020617; }
    .row-login { border-top: 1px solid #e2e8f0; }
    .lbl-login { color: #0369a1; font-weight: bold; }
    .sep-login { color: #0369a1; font-weight: bold; }
    .pin-badge {
      display: inline-block;
      font-family: monospace;
      font-weight: 900;
      font-size: ${isSuperDense ? '8pt' : '8.5pt'};
      padding: 0.5px 3.5mm;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 2px;
      letter-spacing: 1.5px;
      color: #78350f;
    }
    .foto-box {
      width: ${isSuperDense ? '11mm' : '13mm'};
      height: ${isSuperDense ? '14mm' : '17mm'};
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      flex-shrink: 0;
      border-radius: 2px;
    }
    .qr-label { font-size: 5.5pt; font-weight: bold; color: #64748b; }
    .qr-sub { font-size: 5.5pt; font-family: monospace; color: #475569; }
    .petunjuk {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 2px;
      padding: 1mm;
      font-size: 6pt;
      color: #334155;
      line-height: 1.15;
      margin-top: 1mm;
    }
    .ttd-area {
      border-top: 1px solid #e2e8f0;
      padding-top: 1mm;
      margin-top: 1mm;
    }
    .ttd-ringkas {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6pt;
      color: #475569;
    }
    .ttd-formal {
      text-align: right;
      font-size: 6.5pt;
      color: #334155;
    }
    .ttd-space { height: 5mm; }
    .ttd-nama { font-weight: bold; font-size: 7pt; color: #020617; }
  </style>
</head>
<body>
  <div class="no-print print-banner">
    <div class="print-banner-info">
      <div class="print-title">🖨️ KARTU LOGIN SMP NEGERI 2 PULUNG (${filterKelas.toUpperCase()})</div>
      <div class="print-sub">Total ${filteredStudents.length} siswa · Format ${layoutMode} kartu per lembar kertas A4</div>
    </div>
    <button type="button" onclick="window.print()" class="btn-print-action">
      🖨️ CETAK SEKARANG (Ctrl + P)
    </button>
  </div>

  <div class="grid">
    ${cardsHtml}
  </div>

  <script>
    // Otomatis buka dialog print saat halaman dimuat
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;
  };

  // Generate dynamic live Blob URL so native <a href={blobUrl}> works without iframe popup blocking!
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    if (filteredStudents.length === 0) return;
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [
    filteredStudents,
    layoutMode,
    filterKelas,
    judulUjian,
    tahunPelajaran,
    ruangUjian,
    sesiUjian,
    penandatangan,
    tempatTanggal,
    tampilkanFotoBox,
    tampilkanPetunjuk,
    tampilkanGarisPotong,
    settings,
  ]);

  // Direct print button click (tries window.print and shows guide if blocked by iframe sandbox)
  const handlePrintClick = () => {
    setShowIframeTip(true);
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.warn('Iframe blocked window.print():', e);
    }
  };

  const handlePrintSingle = (student: Student) => {
    setSingleStudent(student);
  };

  const getGridColsClass = () => {
    switch (layoutMode) {
      case '12':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case '10':
      case '8':
      case '6':
      default:
        return 'grid-cols-1 sm:grid-cols-2';
    }
  };

  return (
    <div className="space-y-5">
      {/* Dynamic Print CSS for in-app printing */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside, header, nav, .no-print, .no-print * {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: ${layoutMode === '6' ? '7mm 6mm' : layoutMode === '8' ? '5mm 5mm' : '4mm 4mm'};
          }
          .printable-card-grid {
            display: grid !important;
            grid-template-columns: repeat(${layoutMode === '12' ? '3' : '2'}, 1fr) !important;
            gap: ${layoutMode === '6' ? '4.5mm' : layoutMode === '8' ? '3mm' : '2mm'} !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .student-card-box {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 1px ${tampilkanGarisPotong ? 'dashed #475569' : 'solid #cbd5e1'} !important;
            box-shadow: none !important;
            background: white !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            ${
              layoutMode === '8'
                ? 'max-height: 66mm !important; height: 66mm !important; overflow: hidden !important;'
                : layoutMode === '10'
                ? 'max-height: 53mm !important; height: 53mm !important; overflow: hidden !important;'
                : layoutMode === '12'
                ? 'max-height: 66mm !important; height: 66mm !important; overflow: hidden !important;'
                : 'max-height: 88mm !important; height: 88mm !important;'
            }
          }
        }
      `}</style>

      {/* Control / Toolbar Section (Hidden during print) */}
      <div className="no-print space-y-4">
        {/* Top Header & Actions Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 mb-1">
              <CreditCard className="w-4 h-4" />
              <span>CBT SMP Negeri 2 Pulung · Administrasi Peserta</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Cetak Kartu Login Siswa
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Target saat ini:{' '}
              <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {getTargetLabel()}
              </span>{' '}
              · Format <strong className="text-slate-800">{layoutMode} kartu/lembar</strong> ({estimatedSheets} lembar A4)
            </p>
          </div>

          {/* Action Buttons: Multi-mode Print with Native Links */}
          <div className="flex flex-wrap items-center gap-2">
            {singleStudent && (
              <button
                onClick={() => setSingleStudent(null)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal Satuan</span>
              </button>
            )}

            {/* BUTTON 1: DIRECT PRINT ATTEMPT */}
            <button
              onClick={handlePrintClick}
              disabled={filteredStudents.length === 0}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              title="Cetak langsung menggunakan print browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>

            {/* BUTTON 2: OPEN IN NEW TAB (NATIVE LINK - CANNOT BE BLOCKED BY IFRAME) */}
            <a
              href={blobUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                filteredStudents.length === 0 ? 'pointer-events-none opacity-50' : ''
              }`}
              title="Buka halaman cetak di tab baru browser (bebas dari batasan iframe)"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka di Tab Baru (Cetak)</span>
            </a>

            {/* BUTTON 3: DOWNLOAD HTML (OFFLINE READY WITH EMBEDDED BASE64 LOGO) */}
            <a
              href={blobUrl || '#'}
              download={`KARTU_LOGIN_SMPN2_PULUNG_${filterKelas.toUpperCase()}_(${filteredStudents.length}_SISWA).html`}
              className={`px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                filteredStudents.length === 0 ? 'pointer-events-none opacity-50' : ''
              }`}
              title="Unduh file HTML mandiri lengkap dengan logo Base64 resmi untuk dibuka di Chrome / Edge"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Unduh File Cetak (HTML)</span>
            </a>
          </div>
        </div>

        {/* Info Box if user clicked "Cetak Sekarang" inside preview iframe */}
        {showIframeTip && (
          <div className="bg-sky-50 border border-sky-300 text-sky-950 rounded-xl p-3 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Catatan Browser:</strong> Karena aplikasi berjalan di dalam layar pratinjau (iframe), beberapa browser
                memblokir dialog cetak langsung dari dalam frame. 
                <br />
                Gunakan tombol ungu <strong>"Buka di Tab Baru (Cetak)"</strong> atau tombol hitam <strong>"Unduh File Cetak (HTML)"</strong> di atas agar langsung terbuka bersih dan siap cetak dengan logo lengkap!
              </div>
            </div>
            <button
              onClick={() => setShowIframeTip(false)}
              className="text-sky-700 hover:text-sky-900 text-xs font-bold shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter per Kelas & Kepadatan Kartu */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          {/* STEP 1: PILIH KELAS YANG INGIN DICETAK */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Langkah 1: Pilih Kelas yang Ingin Dicetak:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterKelas('all');
                  setSingleStudent(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterKelas === 'all' && !singleStudent
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Semua Kelas IX ({students.length} Siswa)
              </button>

              {(['9A', '9B', '9C', '9D', '9E'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setFilterKelas(k);
                    setSingleStudent(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterKelas === k && !singleStudent
                      ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>Kelas {k}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      filterKelas === k && !singleStudent ? 'bg-sky-800 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {countsByClass[k] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: PILIH JUMLAH KARTU PER LEMBAR A4 */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Langkah 2: Pilih Format Kepadatan Kartu (A4):</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLayoutMode('8');
                  setPenandatangan('ringkas');
                  setTampilkanPetunjuk(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === '8'
                    ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>⭐ 8 Kartu / Lembar (Rekomendasi)</span>
                <span className="text-[10px] opacity-75">(2×4 Baris)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLayoutMode('10');
                  setPenandatangan('none');
                  setTampilkanPetunjuk(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === '10'
                    ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>🔥 10 Kartu / Lembar (Super Hemat)</span>
                <span className="text-[10px] opacity-75">(2×5 Baris)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLayoutMode('12');
                  setPenandatangan('none');
                  setTampilkanPetunjuk(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === '12'
                    ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>🏷️ 12 Kartu / Lembar (Mini)</span>
                <span className="text-[10px] opacity-75">(3×4 Kolom)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLayoutMode('6');
                  setPenandatangan('kepala');
                  setTampilkanPetunjuk(true);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  layoutMode === '6'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>6 Kartu (Besar)</span>
              </button>
            </div>
          </div>

          {/* Search & Customization */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
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
                placeholder="Cari siswa berdasarkan Nama atau NIS..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            {/* Ruang & Sesi Customizer */}
            <div className="md:col-span-3">
              <input
                type="text"
                value={ruangUjian}
                onChange={(e) => setRuangUjian(e.target.value)}
                placeholder="Ruang: Lab CBT"
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
                onChange={(e) => setPenandatangan(e.target.value as TtdType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="ringkas">Tanda Tangan: Ringkas 1 Baris (Hemat)</option>
                <option value="none">Tanpa Tanda Tangan (Murni Kartu Login)</option>
                <option value="kepala">Tanda Tangan: Kepala Sekolah Lengkap</option>
                <option value="proktor">Tanda Tangan: Guru / Proktor Lengkap</option>
                <option value="keduanya">Tanda Tangan: Keduanya</option>
              </select>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tampilkanFotoBox}
                  onChange={(e) => setTampilkanFotoBox(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Kotak Pas Foto / QR</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tampilkanGarisPotong}
                  onChange={(e) => setTampilkanGarisPotong(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-slate-400" />
                  <span>Garis Putus-Putus Batas Potong</span>
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tampilkanPetunjuk}
                  onChange={(e) => setTampilkanPetunjuk(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Teks Petunjuk Login</span>
              </label>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>
                Total <strong className="text-slate-900">{filteredStudents.length}</strong> kartu
              </span>
              <span className="text-slate-300">|</span>
              <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-semibold border border-sky-200">
                A4 Portrait ({layoutMode} kartu/hal)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Printable Cards Section */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="font-bold text-slate-700 text-base">Tidak ada siswa yang ditemukan</div>
          <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Pastikan filter kelas atau kata kunci pencarian sesuai.
          </div>
        </div>
      ) : (
        <div className="printable-cards-area">
          <div className={`printable-card-grid grid ${getGridColsClass()} gap-3`}>
            {filteredStudents.map((student) => {
              const isDense = layoutMode === '8' || layoutMode === '10' || layoutMode === '12';
              const isSuperDense = layoutMode === '10' || layoutMode === '12';

              return (
                <div
                  key={student.student_id || student.nis}
                  className={`student-card-box bg-white rounded-lg border border-slate-300 shadow-xs relative flex flex-col justify-between overflow-hidden transition-all ${
                    isSuperDense ? 'p-2' : isDense ? 'p-2.5' : 'p-3.5'
                  }`}
                >
                  {/* Single print button overlay (Hidden during print) */}
                  <div className="no-print absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
                    <button
                      onClick={() => handlePrintSingle(student)}
                      title="Cetak kartu siswa ini saja"
                      className="px-2 py-1 bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-600 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                    >
                      <Printer className="w-2.5 h-2.5" />
                      <span>Cetak 1 Ini</span>
                    </button>
                  </div>

                  {/* CARD CONTENT */}
                  <div className="space-y-1.5">
                    {/* KOP RESMI SMP NEGERI 2 PULUNG */}
                    <div className="flex items-center gap-2 pb-1.5 border-b border-slate-900">
                      <div className="shrink-0 flex items-center justify-center">
                        <SchoolLogo
                          size={isSuperDense ? 26 : isDense ? 30 : 38}
                          showText={false}
                        />
                      </div>
                      <div className="flex-1 text-center pr-1">
                        <div
                          className={`font-semibold uppercase tracking-wider text-slate-700 leading-tight ${
                            isSuperDense ? 'text-[7.5px]' : isDense ? 'text-[8px]' : 'text-[9px]'
                          }`}
                        >
                          PEMKAB PONOROGO · DINAS PENDIDIKAN
                        </div>
                        <div
                          className={`font-black uppercase tracking-tight text-slate-950 leading-tight ${
                            isSuperDense ? 'text-[10px]' : isDense ? 'text-[11px]' : 'text-[12px]'
                          }`}
                        >
                          SMP NEGERI 2 PULUNG
                        </div>
                        <div
                          className={`font-bold text-sky-900 leading-tight ${
                            isSuperDense ? 'text-[8.5px]' : isDense ? 'text-[9px]' : 'text-[10px]'
                          }`}
                        >
                          KARTU LOGIN {judulUjian}
                        </div>
                        {tahunPelajaran && !isSuperDense ? (
                          <div className="text-[7.5px] font-medium text-slate-600 leading-none">
                            TAPEL {tahunPelajaran}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* IDENTITAS DAN KREDENSIAL LOGIN */}
                    <div className="flex items-start justify-between gap-2 pt-0.5">
                      <table className={`flex-1 text-left border-collapse ${isSuperDense ? 'text-[9.5px]' : 'text-[10.5px]'} leading-tight`}>
                        <tbody>
                          <tr>
                            <td className="py-0.5 pr-1 font-medium text-slate-600 w-20">NIS Siswa</td>
                            <td className="py-0.5 px-0.5 font-bold text-slate-700">:</td>
                            <td className="py-0.5 pl-1 font-mono font-bold text-slate-950">
                              {student.nis}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-0.5 pr-1 font-medium text-slate-600">Nama Lengkap</td>
                            <td className="py-0.5 px-0.5 font-bold text-slate-700">:</td>
                            <td className="py-0.5 pl-1 font-bold text-slate-950 uppercase truncate max-w-[150px]">
                              {student.nama}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-0.5 pr-1 font-medium text-slate-600">Kelas / Ruang</td>
                            <td className="py-0.5 px-0.5 font-bold text-slate-700">:</td>
                            <td className="py-0.5 pl-1 font-semibold text-sky-900">
                              Kelas {student.kelas} · {student.ruang || ruangUjian}
                            </td>
                          </tr>
                          <tr className="border-t border-slate-200">
                            <td className="pt-1 pb-0.5 pr-1 font-bold text-sky-950">Username</td>
                            <td className="pt-1 pb-0.5 px-0.5 font-bold text-sky-950">:</td>
                            <td className="pt-1 pb-0.5 pl-1 font-mono font-black text-slate-950 text-xs tracking-wider">
                              {student.nis}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-0.5 pr-1 font-bold text-sky-950">Password / PIN</td>
                            <td className="py-0.5 px-0.5 font-bold text-sky-950">:</td>
                            <td className="py-0.5 pl-1">
                              <span className="font-mono font-black text-[11px] px-1.5 py-0.2 bg-amber-100 border border-amber-300 rounded text-slate-950 tracking-widest inline-block">
                                {student.pin || '12345'}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Photo / QR Box Placeholder */}
                      {tampilkanFotoBox && (
                        <div className="shrink-0 flex flex-col items-center justify-center">
                          <div
                            className={`border border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center rounded ${
                              isSuperDense ? 'w-10 h-13 p-0.5' : isDense ? 'w-12 h-15 p-1' : 'w-14 h-18 p-1'
                            }`}
                          >
                            <QrCode className="w-4 h-4 text-slate-500 opacity-75" />
                            <div className="text-[6.5px] font-mono text-slate-500 mt-0.5">
                              {student.nis}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Optional Petunjuk Peserta */}
                    {tampilkanPetunjuk && (
                      <div className="bg-slate-50 border border-slate-200 rounded p-1 text-[8px] text-slate-700 leading-tight">
                        <strong>Petunjuk:</strong> Buka portal CBT, ketikkan <strong>Username (NIS)</strong> dan{' '}
                        <strong>PIN</strong> sesuai kartu. Jaga kerahasiaan PIN login ini.
                      </div>
                    )}
                  </div>

                  {/* SIGNATURE SECTION / PENGESAHAN */}
                  {penandatangan !== 'none' && (
                    <div className="pt-1 border-t border-slate-200 mt-1 text-slate-800">
                      {penandatangan === 'ringkas' ? (
                        <div className="flex items-center justify-between text-[7.5px] text-slate-600">
                          <span className="italic">{tempatTanggal}</span>
                          <span className="font-bold text-slate-900">
                            Proktor: {settings.namaProktor || 'Pak Dedy Frisca'}
                          </span>
                        </div>
                      ) : penandatangan === 'kepala' ? (
                        <div className="text-right text-[8px]">
                          <div className="text-slate-500 text-[7.5px]">{tempatTanggal}</div>
                          <div className="text-slate-600">Kepala Sekolah,</div>
                          <div className="h-6" />
                          <div className="font-bold underline text-slate-950 text-[8.5px]">
                            {settings.namaKepalaSekolah || 'Drs. SUPRIYANTO, M.Pd.'}
                          </div>
                        </div>
                      ) : penandatangan === 'proktor' ? (
                        <div className="text-right text-[8px]">
                          <div className="text-slate-500 text-[7.5px]">{tempatTanggal}</div>
                          <div className="text-slate-600">Proktor CBT,</div>
                          <div className="h-6" />
                          <div className="font-bold underline text-slate-950 text-[8.5px]">
                            {settings.namaProktor || 'Pak Dedy Frisca'}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-end justify-between text-[7.5px] pt-1">
                          <div className="text-center">
                            <div>Proktor CBT</div>
                            <div className="h-5" />
                            <div className="font-bold text-slate-900">{settings.namaProktor || 'Pak Dedy Frisca'}</div>
                          </div>
                          <div className="text-center">
                            <div>Kepala Sekolah</div>
                            <div className="h-5" />
                            <div className="font-bold text-slate-900">{settings.namaKepalaSekolah || 'Drs. SUPRIYANTO'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cut guidance line indicator */}
                  {tampilkanGarisPotong && (
                    <div className="no-print pt-1 border-t border-dashed border-slate-300 flex items-center justify-between text-[8px] text-slate-400 select-none">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-2.5 h-2.5" /> Garis Potong
                      </span>
                      <span>SMPN 2 Pulung</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
