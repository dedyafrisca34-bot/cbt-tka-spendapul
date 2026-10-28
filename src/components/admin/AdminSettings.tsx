import React, { useState } from 'react';
import { Save, RotateCcw, ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { StorageService, AppSettings } from '../../services/storageService';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleResetData = () => {
    if (
      confirm(
        'PERINGATAN: Apakah Anda yakin ingin mereset seluruh database aplikasi (Siswa, Bank Soal 80 nomor, Jadwal Ujian, dan Nilai) ke data standar awal?'
      )
    ) {
      StorageService.resetDefaults();
      setSettings(StorageService.getSettings());
      alert('Database aplikasi CBT berhasil dikembalikan ke data default.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Pengaturan Sistem CBT
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Konfigurasi identitas sekolah, kriteria kelulusan KKM, dan data master.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan berhasil disimpan ke sistem!</span>
        </div>
      )}

      {/* Logo Preview Block */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 p-2 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center shrink-0">
          <img
            src="/assets/logo_smpn2_pulung.png"
            alt="Logo Resmi SMP Negeri 2 Pulung"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Logo Resmi SMP Negeri 2 Pulung Terverifikasi</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            Lambang Resmi SMP Negeri 2 Pulung
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Menampilkan lencana teratai biru, bintang merah berpendar kuning, payung songsong pusaka khas Pulung, sepasang sayap emas, buku terbuka ilmu pengetahuan, dan busur teks resmi &ldquo;SMP NEGERI 2 PULUNG&rdquo;.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Resmi Sekolah
            </label>
            <input
              type="text"
              value={settings.namaSekolah}
              onChange={(e) => setSettings({ ...settings, namaSekolah: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Motto Sekolah
            </label>
            <input
              type="text"
              value={settings.motto}
              onChange={(e) => setSettings({ ...settings, motto: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kabupaten / Kota
              </label>
              <input
                type="text"
                value={settings.kabupatenKota || ''}
                onChange={(e) => setSettings({ ...settings, kabupatenKota: e.target.value })}
                placeholder="Contoh: Kabupaten Ponorogo"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tempat / Kota Penandatanganan Dokumen
              </label>
              <input
                type="text"
                value={settings.tempatCetak || ''}
                onChange={(e) => setSettings({ ...settings, tempatCetak: e.target.value })}
                placeholder="Contoh: Pulung, Ponorogo"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Lengkap Sekolah (Untuk Kop Surat Dokumen PDF)
            </label>
            <textarea
              rows={2}
              value={settings.alamatSekolah || ''}
              onChange={(e) => setSettings({ ...settings, alamatSekolah: e.target.value })}
              placeholder="Contoh: Jl. Raya Pulung, Desa Kesugihan, Kec. Pulung, Kabupaten Ponorogo, Jawa Timur 63492"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Section: Kolom Pengesahan Tanda Tangan Resmi */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              Kolom Pengesahan Tanda Tangan Resmi (Cetak Dokumen PDF):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kolom Kiri: Kepala Sekolah */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-sky-900 block text-xs">1. Pihak Mengetahui (Kepala Sekolah)</span>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nama Kepala Sekolah & Gelar</label>
                  <input
                    type="text"
                    value={settings.namaKepalaSekolah || ''}
                    onChange={(e) => setSettings({ ...settings, namaKepalaSekolah: e.target.value })}
                    placeholder="Contoh: Drs. SUPRIYANTO, M.Pd."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    value={settings.nipKepalaSekolah || ''}
                    onChange={(e) => setSettings({ ...settings, nipKepalaSekolah: e.target.value })}
                    placeholder="Contoh: 19680512 199412 1 002"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Kolom Kanan: Guru / Proktor */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-sky-900 block text-xs">2. Pihak Pembuat Rekap (Guru / Proktor CBT)</span>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nama Guru / Proktor & Gelar</label>
                  <input
                    type="text"
                    value={settings.namaProktor || ''}
                    onChange={(e) => setSettings({ ...settings, namaProktor: e.target.value })}
                    placeholder="Contoh: BUDI SANTOSO, S.Pd."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">NIP Guru / Proktor</label>
                  <input
                    type="text"
                    value={settings.nipProktor || ''}
                    onChange={(e) => setSettings({ ...settings, nipProktor: e.target.value })}
                    placeholder="Contoh: 19850101 201001 1 005"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jabatan Penandatangan</label>
                  <input
                    type="text"
                    value={settings.jabatanProktor || ''}
                    onChange={(e) => setSettings({ ...settings, jabatanProktor: e.target.value })}
                    placeholder="Contoh: Guru Pengampu / Proktor CBT"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tahun Pelajaran (Opsional)
              </label>
              <input
                type="text"
                value={settings.tahunPelajaran || ''}
                onChange={(e) => setSettings({ ...settings, tahunPelajaran: e.target.value })}
                placeholder="Kosongkan jika aplikasi digunakan fleksibel untuk semua tahun"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Biarkan kosong agar kartu & aplikasi bebas tahun ajaran.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Standar KKM (Kriteria Ketuntasan Minimal)
              </label>
              <input
                type="number"
                value={settings.kkm}
                onChange={(e) => setSettings({ ...settings, kkm: Number(e.target.value) })}
                min={50}
                max={95}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                required
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Siswa dengan nilai ≥ {settings.kkm} dinyatakan Tuntas.
              </span>
            </div>
          </div>

          {/* Anti-Cheat & Proctor Security Settings Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-sky-700" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Keamanan Ujian & Anti-Kecurangan (Anti-Cheat)
              </h3>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              
              {/* Toggle Anti-Cheat */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    Aktifkan Proteksi Anti-Curang & Deteksi Pindah Tab
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mendeteksi otomatis ketika siswa membuka tab baru, beralih tab browser, atau meminimalkan jendela ujian.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.antiCheatEnabled}
                  onChange={(e) => setSettings({ ...settings, antiCheatEnabled: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </div>

              {/* Max violations before auto submit */}
              {settings.antiCheatEnabled && (
                <div className="pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Batas Toleransi Keluar Tab / Buka Tab Baru
                    </label>
                    <select
                      value={settings.maxTabViolations}
                      onChange={(e) => setSettings({ ...settings, maxTabViolations: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value={1}>1 kali (Sangat Ketat - langsung submit)</option>
                      <option value={2}>2 kali (Ketat)</option>
                      <option value={3}>3 kali (Standar Rekomendasi CBT)</option>
                      <option value={5}>5 kali (Longgar)</option>
                      <option value={0}>Peringatan Saja (Tanpa Auto-Submit)</option>
                    </select>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Jika melanggar melebihi batas ini, ujian otomatis dikumpulkan secara paksa (*auto-submit*).
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kunci Mode Layar Penuh (Kiosk Mode Web)
                    </label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="autoFsToggle"
                        checked={settings.autoFullscreen}
                        onChange={(e) => setSettings({ ...settings, autoFullscreen: e.target.checked })}
                        className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                      />
                      <label htmlFor="autoFsToggle" className="text-xs text-slate-700 cursor-pointer">
                        Wajibkan layar penuh (sembunyikan tab bar & status bar browser)
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Block copy paste toggle */}
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    Blokir Klik Kanan & Salin Soal (Copy-Paste / Inspect)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mencegah siswa memblok teks soal, copy-paste ke Google/ChatGPT, serta memblok shortcut inspect F12 dan Ctrl+U.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.blockCopyPaste}
                  onChange={(e) => setSettings({ ...settings, blockCopyPaste: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </div>

            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm shadow-sky-600/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Database Maintenance Zone */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-amber-200 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Kosongkan Riwayat Pengerjaan & Nilai Siswa</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            Gunakan tombol ini sebelum hari H ujian pelaksanaan riil untuk menghapus seluruh rekaman jawaban uji coba, sehingga nilai seluruh siswa kembali bersih (0 riwayat pengerjaan) tanpa menghapus bank soal dan data siswa.
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA riwayat pengerjaan dan nilai siswa? Seluruh data nilai akan kembali kosong.')) {
                  StorageService.clearAllAttempts();
                  alert('Seluruh riwayat nilai dan sesi ujian telah berhasil dikosongkan.');
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Kosongkan Semua Nilai & Sesi Pengerjaan
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-red-600" />
            <span>Reset Database ke Data Standar</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            Gunakan tombol ini jika Anda ingin mengembalikan bank soal 80 butir, jadwal ujian Matematika & Bahasa Indonesia, dan pengaturan standar.
          </p>

          <div className="mt-3">
            <button
              type="button"
              onClick={handleResetData}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Reset Database ke Standar Awal
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
