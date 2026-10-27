import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Database, Code, BookOpen, Send, ShieldAlert } from 'lucide-react';
import { GAS_SCRIPT_CODE, SPREADSHEET_SCHEMA_GUIDE } from '../../services/gasCodeTemplate';
import { StorageService, OFFICIAL_GAS_API_URL } from '../../services/storageService';

export const AdminSpreadsheetGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'schema' | 'deploy' | 'test'>('test');

  const settings = StorageService.getSettings();
  const [gasUrl, setGasUrl] = useState(settings.gasApiUrl || OFFICIAL_GAS_API_URL);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    status: 'success',
    message: 'URL Web App Resmi SMP Negeri 2 Pulung telah aktif dan tertanam di aplikasi.',
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveGasUrl = () => {
    const updated = { ...settings, gasApiUrl: gasUrl.trim() };
    StorageService.saveSettings(updated);
    alert('URL Google Apps Script berhasil disimpan!');
  };

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      setTestResult({
        status: 'error',
        message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setTestResult({ status: 'loading', message: 'Menghubungkan ke Google Apps Script API...' });

    try {
      const response = await fetch(`${gasUrl.trim()}?action=ping`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const data = await response.json();

      if (data.success) {
        setTestResult({
          status: 'success',
          message: `Berhasil terhubung! Pesan server: "${data.message}" (${data.timestamp})`,
        });
      } else {
        setTestResult({
          status: 'error',
          message: data.message || 'Server merespons tetapi mengembalikan error.',
        });
      }
    } catch (err: unknown) {
      setTestResult({
        status: 'error',
        message:
          'Gagal menghubungi endpoint. Pastikan deployment Web App diset ke "Execute as: Me" dan "Who has access: Anyone".',
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700 mb-1">
            <Database className="w-4 h-4" />
            <span>Integrasi Database Sekolah</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Google Apps Script & Spreadsheet
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Panduan lengkap struktur Google Sheets, kode backend Apps Script (Code.gs), dan uji koneksi API.
          </p>
        </div>

        <button
          onClick={handleCopyCode}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-600/25 transition-all cursor-pointer shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Kode Disalin!' : 'Salin Seluruh Code.gs'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'code' ? 'bg-sky-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Kode Google Apps Script (Code.gs)</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'schema' ? 'bg-sky-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Struktur 7 Sheet Google Spreadsheet</span>
        </button>

        <button
          onClick={() => setActiveTab('deploy')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'deploy' ? 'bg-sky-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Langkah Deployment & Keamanan</span>
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'test' ? 'bg-sky-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Uji Koneksi API</span>
        </button>
      </div>

      {/* TAB 1: CODE.GS */}
      {activeTab === 'code' && (
        <div className="bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-800 text-slate-200 font-mono text-xs overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Google Apps Script / Code.gs (Siap Deploy)</span>
            </span>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
            </button>
          </div>

          <pre className="overflow-x-auto max-h-[500px] leading-relaxed p-2 text-[11px]">
            {GAS_SCRIPT_CODE}
          </pre>
        </div>
      )}

      {/* TAB 2: SPREADSHEET SCHEMA */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-xs text-sky-900 flex items-start gap-3">
            <Database className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">1 Buku Kerja Google Spreadsheet dengan 7 Sheet:</span>
              <p className="mt-0.5 text-slate-600">
                Buat sebuah Google Spreadsheet baru, lalu buat 7 tab sheet di bawah ini dengan penamaan kolom baris pertama (header) persis sesuai spesifikasi berikut:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SPREADSHEET_SCHEMA_GUIDE.map((sheet) => (
              <div
                key={sheet.sheetName}
                className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-sm text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                      Sheet: {sheet.sheetName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {sheet.columns.length} Kolom
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{sheet.description}</p>

                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-100">
                        <tr>
                          <th className="py-2 px-3">Kolom (Header)</th>
                          <th className="py-2 px-3">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {sheet.columns.map((col) => (
                          <tr key={col.name}>
                            <td className="py-2 px-3 font-bold text-slate-800 bg-slate-50/40">
                              {col.name}
                            </td>
                            <td className="py-2 px-3 font-sans text-slate-600 text-[11px]">
                              {col.desc}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DEPLOYMENT GUIDE */}
      {activeTab === 'deploy' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Card Cara Otomatis */}
          <div className="p-5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-emerald-950 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider">
                Sangat Direkomendasikan
              </span>
              <h3 className="text-sm font-bold text-emerald-950">
                Cara Otomatis: Drive & Spreadsheet Dibuat Seketika oleh GAS
              </h3>
            </div>
            <p className="text-emerald-900 text-xs">
              Anda <strong>tidak perlu membuat spreadsheet atau mengetik nama kolom satu per satu</strong>! Cukup salin kode script, tempel di Google Apps Script, lalu klik Jalankan fungsi <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">setupOtomatisDatabase</code>.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-xs text-emerald-900 pl-1">
              <li>
                Buka <a href="https://script.google.com/home/start" target="_blank" rel="noreferrer" className="underline font-bold hover:text-emerald-700">script.google.com</a> lalu klik <strong>Project Baru</strong>.
              </li>
              <li>
                Hapus semua tulisan bawaan, lalu tempelkan <strong>Seluruh Code.gs</strong> (gunakan tombol Salin di pojok kanan atas).
              </li>
              <li>
                Di toolbar atas sebelah tombol "Jalankan", ubah nama fungsi dari <code>myFunction</code> menjadi <strong>setupOtomatisDatabase</strong>.
              </li>
              <li>
                Klik tombol <strong>Jalankan</strong> (Run).
              </li>
              <li>
                Google akan meminta izin akses (klik <em>Tinjau Izin &gt; Pilih Akun &gt; Lanjutan &gt; Buka Project (tidak aman) &gt; Izinkan</em>).
              </li>
              <li>
                <strong>Selesai!</strong> Buka Google Drive Anda: Folder <strong>"CBT SMPN 2 PULUNG"</strong> dan Spreadsheet <strong>"DATABASE_CBT_SMPN2_PULUNG"</strong> beserta 7 lembar sheet berheader warna biru rapi sudah otomatis terbuat!
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Langkah Terakhir: Deployment sebagai Web App (API):
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 pl-1">
              <li>
                Di halaman Google Apps Script yang sama, klik tombol biru <strong>Deploy (Terapkan) &gt; New deployment (Deployment baru)</strong> di pojok kanan atas.
              </li>
              <li>
                Klik ikon roda gigi kecil di samping kiri, pilih jenis <strong>Web app (Aplikasi Web)</strong>.
              </li>
              <li>
                Isi form pengaturan deployment:
                <ul className="list-disc list-inside pl-5 mt-1 space-y-1 text-slate-600">
                  <li>Deskripsi: <code>CBT SMPN 2 Pulung API v1</code></li>
                  <li>Execute as (Jalankan sebagai): <strong>Me (email Anda)</strong></li>
                  <li>Who has access (Siapa yang memiliki akses): <strong>Anyone (Siapa saja)</strong></li>
                </ul>
              </li>
              <li>
                Klik <strong>Deploy</strong>, lalu salin <strong>Web App URL</strong> yang berakhiran <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">/exec</code>.
              </li>
              <li>
                Buka tab <strong>Uji Koneksi API</strong> di aplikasi ini, tempelkan URL tersebut, lalu klik <strong>Simpan &amp; Tes Ping</strong>.
              </li>
            </ol>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Standar Keamanan Sesuai Kerangka Spesifikasi:</span>
            </div>
            <p>
              1. Kunci jawaban tidak pernah dikirimkan ke frontend siswa oleh Google Apps Script.
              <br />
              2. Google Apps Script menggunakan <code className="font-mono font-bold">LockService.getScriptLock()</code> untuk mencegah benturan saat ratusan siswa serentak menyimpan jawaban.
              <br />
              3. Sesi pengerjaan dan batas waktu dihitung berdasarkan waktu server Google, bukan jam di perangkat siswa.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: API TESTER */}
      {activeTab === 'test' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-5 text-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Konfigurasi Endpoint Google Apps Script
            </h3>
            <p className="text-slate-500">
              Hubungkan frontend CBT dengan Web App URL Google Apps Script yang sudah Anda deploy.
            </p>
          </div>

          <div className="space-y-3 max-w-xl">
            <div className="flex flex-col gap-2 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-bold text-emerald-950">
                  URL Google Apps Script Resmi SMP Negeri 2 Pulung (Tertanam Permanen)
                </span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                URL Web App Google Apps Script Anda telah dimasukkan secara permanen ke dalam kode aplikasi. Semua fitur (Tarik Data Siswa, Kirim Data Siswa, Penyimpanan Jawaban Otomatis, dan Uji Ping) otomatis mengarah ke endpoint ini tanpa perlu konfigurasi ulang.
              </p>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/80 font-mono text-[11px] text-emerald-950 break-all select-all">
                {OFFICIAL_GAS_API_URL}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Web App URL Aktif:
              </label>
              <input
                type="text"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSaveGasUrl}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Simpan URL
              </button>
              <button
                onClick={handleTestConnection}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Tes Ping Endpoint</span>
              </button>
              {gasUrl !== OFFICIAL_GAS_API_URL && (
                <button
                  onClick={() => {
                    setGasUrl(OFFICIAL_GAS_API_URL);
                    StorageService.saveSettings({ ...settings, gasApiUrl: OFFICIAL_GAS_API_URL });
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Kembalikan ke URL Resmi
                </button>
              )}
            </div>
          </div>

          {testResult.status !== 'idle' && (
            <div
              className={`p-4 rounded-xl border max-w-xl ${
                testResult.status === 'loading'
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : testResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="font-bold mb-1">
                {testResult.status === 'loading' && 'Sedang Menguji...'}
                {testResult.status === 'success' && '✓ Koneksi Berhasil!'}
                {testResult.status === 'error' && '✕ Koneksi Gagal'}
              </div>
              <p className="leading-relaxed">{testResult.message}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 text-slate-500">
            <strong>Catatan Operasional:</strong> Aplikasi CBT ini berjalan dengan dual-engine (Local Persistence State + GAS API sync adapter), sehingga guru dan siswa dapat menjalankan simulasi ujian dengan lancar secara langsung tanpa harus menunggu setup akun Google terlebih dahulu!
          </div>
        </div>
      )}

    </div>
  );
};
