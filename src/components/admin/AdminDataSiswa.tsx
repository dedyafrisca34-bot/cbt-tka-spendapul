import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  UserCheck,
  KeyRound,
  Upload,
  Users,
  AlertCircle,
  CreditCard,
  Printer,
  CloudDownload,
  CloudUpload,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Student } from '../../types/cbt';
import { StorageService, OFFICIAL_GAS_API_URL } from '../../services/storageService';

interface AdminDataSiswaProps {
  onOpenCetakKartu?: () => void;
}

export const AdminDataSiswa: React.FC<AdminDataSiswaProps> = ({ onOpenCetakKartu }) => {
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [isSyncingGas, setIsSyncingGas] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [autoSyncNotice, setAutoSyncNotice] = useState<string | null>(null);

  // Form State
  const [formNis, setFormNis] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKelas, setFormKelas] = useState('9A');
  const [formPin, setFormPin] = useState('');
  const [formAktif, setFormAktif] = useState(true);
  const [formRuang, setFormRuang] = useState('');
  const [formSesi, setFormSesi] = useState('');

  // Auto-push helper that saves to Google Spreadsheet in the background
  const pushStudentsSilently = useCallback(async (studentsToPush: Student[], customUrl?: string) => {
    const settings = StorageService.getSettings();
    const targetUrl = customUrl || settings.gasApiUrl || OFFICIAL_GAS_API_URL;
    if (!targetUrl) return;

    setSyncStatus('syncing');
    try {
      const response = await fetch(targetUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncStudents',
          students: studentsToPush,
        }),
      });
      const data = await response.json();
      if (data && data.success) {
        setSyncStatus('synced');
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(timeStr);
        setAutoSyncNotice(`Tersimpan otomatis ke Spreadsheet (${timeStr})`);
        setTimeout(() => setAutoSyncNotice(null), 4000);
      } else {
        setSyncStatus('idle');
      }
    } catch (err) {
      console.warn('Auto-push notice:', err);
      setSyncStatus('idle');
    }
  }, []);

  // Auto-pull helper on component mount
  useEffect(() => {
    let isMounted = true;

    const autoPullFromSpreadsheet = async () => {
      const settings = StorageService.getSettings();
      const targetUrl = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!targetUrl) return;

      setIsSyncingGas(true);
      setSyncStatus('syncing');

      try {
        const response = await fetch(`${targetUrl.trim()}?action=getStudents`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        const data = await response.json();
        if (!isMounted) return;

        if (data && data.success && Array.isArray(data.students)) {
          if (data.students.length > 0) {
            // Spreadsheet has student data: automatically merge with local database
            const currentList = StorageService.getStudents();
            const nisMap = new Map(currentList.map((s) => [s.nis, s]));
            data.students.forEach((s: Student) => {
              nisMap.set(s.nis, {
                ...s,
                student_id: s.student_id || `std_${s.nis}`,
                pin: s.pin || '12345',
                aktif: s.aktif !== false,
              });
            });
            const merged = Array.from(nisMap.values());
            StorageService.setStudents(merged);
            setStudents(merged);
            const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLastSyncTime(timeStr);
            setSyncStatus('synced');
            setAutoSyncNotice(`Data siswa berhasil disinkronkan otomatis dari Spreadsheet (${timeStr})`);
            setTimeout(() => setAutoSyncNotice(null), 5000);
          } else {
            // Spreadsheet is still empty: auto-populate spreadsheet with current local dataset
            const currentList = StorageService.getStudents();
            if (currentList.length > 0) {
              await pushStudentsSilently(currentList, targetUrl);
            }
            const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLastSyncTime(timeStr);
            setSyncStatus('synced');
          }
        } else {
          setSyncStatus('idle');
        }
      } catch (err) {
        // Silent fallback to local storage
        if (isMounted) setSyncStatus('idle');
      } finally {
        if (isMounted) setIsSyncingGas(false);
      }
    };

    autoPullFromSpreadsheet();

    // Auto-pull whenever the teacher switches tabs back to CBT (e.g. after editing Google Sheets)
    const handleWindowFocus = () => {
      autoPullFromSpreadsheet();
    };

    window.addEventListener('focus', handleWindowFocus);
    const interval = setInterval(autoPullFromSpreadsheet, 25000); // 25-second periodic auto-sync

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(interval);
    };
  }, [pushStudentsSilently]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchKelas = filterKelas === 'all' || s.kelas === filterKelas;
      const matchSearch =
        searchQuery === '' ||
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery);

      return matchKelas && matchSearch;
    });
  }, [students, filterKelas, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setFormNis(`1235${students.length + 1}`);
    setFormNama('');
    setFormKelas('9A');
    setFormPin('12345');
    setFormAktif(true);
    setFormRuang('Ruang 01');
    setFormSesi('Sesi 1');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormNis(s.nis);
    setFormNama(s.nama);
    setFormKelas(s.kelas);
    setFormPin(s.pin);
    setFormAktif(s.aktif);
    setFormRuang(s.ruang || '');
    setFormSesi(s.sesi || '');
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus data siswa ini beserta riwayat pengerjaannya?')) {
      StorageService.deleteStudent(id);
      const updated = StorageService.getStudents();
      setStudents(updated);
      // Auto-push the updated list to Google Spreadsheet
      pushStudentsSilently(updated);
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        'PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA data siswa saat ini untuk memulai pendaftaran peserta riil sekolah?'
      )
    ) {
      StorageService.clearAllStudents();
      setStudents([]);
      alert('Semua data siswa berhasil dikosongkan.');
    }
  };

  const handleBatchImport = (e: React.FormEvent) => {
    e.preventDefault();
    setImportFeedback(null);

    const lines = importText.trim().split('\n');
    if (lines.length === 0 || !importText.trim()) {
      setImportFeedback('Harap masukkan baris data siswa.');
      return;
    }

    const imported: Student[] = [];
    const validClasses = ['9A', '9B', '9C', '9D', '9E'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Support comma, tab, or semicolon separation: NIS, NAMA, KELAS, PIN, RUANG, SESI
      const parts = line.split(/[,\t;]+/).map((p) => p.trim());
      if (parts.length >= 2) {
        const nis = parts[0];
        const nama = parts[1];
        let kelas = parts[2] ? parts[2].toUpperCase().replace(/\s+|-/g, '') : '9A';
        // Normalize class e.g. IXA -> 9A, 9A -> 9A
        if (kelas.startsWith('IX')) {
          kelas = '9' + kelas.replace('IX', '');
        }
        if (!validClasses.includes(kelas)) {
          kelas = '9A';
        }
        const pin = parts[3] ? parts[3] : nis; // Default PIN to NIS or 12345
        const ruang = parts[4] ? parts[4] : undefined;
        const sesi = parts[5] ? parts[5] : undefined;

        imported.push({
          student_id: `std_${nis}_${Date.now()}_${i}`,
          nis,
          nama,
          kelas,
          pin,
          aktif: true,
          ruang,
          sesi,
        });
      }
    }

    if (imported.length === 0) {
      setImportFeedback('Format data tidak terbaca. Pastikan format: NIS, Nama Siswa, Kelas, PIN, [Ruang], [Sesi]');
      return;
    }

    // Merge or replace
    const currentList = StorageService.getStudents();
    const existingNisMap = new Map(currentList.map((s) => [s.nis, s]));

    imported.forEach((newS) => {
      existingNisMap.set(newS.nis, newS);
    });

    const finalList = Array.from(existingNisMap.values());
    StorageService.setStudents(finalList);
    setStudents(finalList);
    setIsImportOpen(false);
    setImportText('');
    alert(`Berhasil mengimpor ${imported.length} data siswa ke database.`);
    // Automatically push imported list to Google Spreadsheet
    pushStudentsSilently(finalList);
  };

  const handleResetAttempts = (student: Student) => {
    if (
      confirm(
        `Reset sesi ujian untuk ${student.nama} (NIS: ${student.nis})? Siswa akan dapat mengerjakan ulang ujian jika sebelumnya terkendala kendala teknis.`
      )
    ) {
      StorageService.resetStudentAttempt(student.student_id, 'exam_01');
      StorageService.resetStudentAttempt(student.student_id, 'exam_02');
      alert(`Sesi ujian ${student.nama} berhasil direset.`);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNis.trim() || !formNama.trim()) {
      alert('Mohon lengkapi NIS dan Nama Siswa.');
      return;
    }

    const newStudent: Student = {
      student_id: editingStudent ? editingStudent.student_id : `std_${Date.now()}`,
      nis: formNis.trim(),
      nama: formNama.trim(),
      kelas: formKelas,
      pin: formPin.trim() || '12345',
      aktif: formAktif,
      ruang: formRuang.trim() || undefined,
      sesi: formSesi.trim() || undefined,
    };

    StorageService.saveStudent(newStudent);
    const updated = StorageService.getStudents();
    setStudents(updated);
    setIsFormOpen(false);

    // Auto-push the newly added or updated student to Google Spreadsheet
    pushStudentsSilently(updated);
  };

  const handleSyncFromSpreadsheet = async () => {
    const settings = StorageService.getSettings();
    const targetUrl = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
    if (!targetUrl) {
      alert('URL Google Apps Script belum dikonfigurasi. Silakan atur di menu Integrasi Spreadsheet.');
      return;
    }

    setIsSyncingGas(true);
    setSyncStatus('syncing');
    try {
      const response = await fetch(`${targetUrl.trim()}?action=getStudents`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.students)) {
        if (data.students.length === 0) {
          alert('Spreadsheet terhubung, tetapi Sheet "Siswa" belum memiliki data baris siswa.');
        } else {
          const currentList = StorageService.getStudents();
          const nisMap = new Map(currentList.map((s) => [s.nis, s]));
          data.students.forEach((s: Student) => {
            nisMap.set(s.nis, {
              ...s,
              student_id: s.student_id || `std_${s.nis}`,
              pin: s.pin || '12345',
              aktif: s.aktif !== false,
            });
          });
          const merged = Array.from(nisMap.values());
          StorageService.setStudents(merged);
          setStudents(merged);
          const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSyncTime(timeStr);
          setSyncStatus('synced');
          alert(`Sukses! Berhasil menarik dan memperbarui ${data.students.length} data siswa dari Google Spreadsheet.`);
        }
      } else {
        alert(data.message || 'Gagal mengambil data siswa dari Google Spreadsheet.');
      }
    } catch (err: unknown) {
      alert(
        'Koneksi ke endpoint Google Apps Script gagal atau dibatasi CORS. Pastikan Web App dideploy dengan hak akses "Anyone" (Siapa saja).'
      );
    } finally {
      setIsSyncingGas(false);
    }
  };

  const handlePushToSpreadsheet = async () => {
    const settings = StorageService.getSettings();
    const targetUrl = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
    if (!targetUrl) {
      alert('URL Google Apps Script belum dikonfigurasi. Silakan atur di menu Integrasi Spreadsheet.');
      return;
    }
    if (students.length === 0) {
      alert('Tidak ada data siswa untuk disinkronkan.');
      return;
    }

    setIsSyncingGas(true);
    setSyncStatus('syncing');
    try {
      const response = await fetch(targetUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncStudents',
          students: students,
        }),
      });
      const data = await response.json();
      if (data.success) {
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(timeStr);
        setSyncStatus('synced');
        alert(data.message || 'Data siswa berhasil disimpan ke Google Spreadsheet!');
      } else {
        alert(data.message || 'Gagal menyimpan data ke Google Spreadsheet.');
      }
    } catch (err: unknown) {
      alert('Gagal mengirim data ke Google Apps Script: ' + String(err));
    } finally {
      setIsSyncingGas(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Data Siswa
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Kelola data peserta ujian TKA Kelas IX SMP Negeri 2 Pulung (Kelas 9A, 9B, 9C, 9D, 9E).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenCetakKartu && (
            <button
              onClick={onOpenCetakKartu}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all cursor-pointer"
              title="Buka Halaman Cetak Kartu Login Siswa"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu Login</span>
            </button>
          )}

          {students.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Hapus seluruh data siswa saat ini untuk memulai dari awal"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          )}

          <button
            onClick={() => {
              setImportText('');
              setImportFeedback(null);
              setIsImportOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Format Teks</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Auto-Sync Live Status Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="relative flex h-3.5 w-3.5 mt-0.5 sm:mt-0 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${syncStatus === 'syncing' ? 'bg-sky-400' : 'bg-emerald-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${syncStatus === 'syncing' ? 'bg-sky-500' : 'bg-emerald-600'}`}></span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                Sinkronisasi Dua Arah Otomatis Aktif
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                Otomatis Tanpa Klik Manual
              </span>
            </div>
            <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
              <strong>Tarik Otomatis:</strong> Data siswa dari Google Spreadsheet langsung ditarik otomatis setiap kali halaman dibuka.
              <br className="hidden sm:inline" />
              <strong>Kirim Otomatis:</strong> Setiap Anda menambah, mengedit, menghapus, atau mengimpor siswa, perubahan langsung otomatis tersimpan ke Sheet &ldquo;Siswa&rdquo;.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-emerald-100 w-full md:w-auto justify-between md:justify-end">
          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Status Terakhir</span>
            <span className="font-mono text-emerald-700 font-bold text-[11px]">
              {syncStatus === 'syncing' ? 'Sedang Sinkronisasi...' : lastSyncTime ? `Tersinkron pukul ${lastSyncTime}` : 'Tersinkron Otomatis'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSyncFromSpreadsheet}
              disabled={isSyncingGas}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Tarik manual sekarang jika ingin memeriksa data baru dari Google Spreadsheet detik ini"
            >
              <CloudDownload className={`w-3.5 h-3.5 ${isSyncingGas ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">Tarik Manual</span>
            </button>
            <button
              onClick={handlePushToSpreadsheet}
              disabled={isSyncingGas || students.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Kirim manual seluruh data siswa saat ini ke Google Spreadsheet"
            >
              <CloudUpload className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Kirim Manual</span>
            </button>
          </div>
        </div>
      </div>

      {autoSyncNotice && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span className="font-medium">{autoSyncNotice}</span>
          </div>
          <button onClick={() => setAutoSyncNotice(null)} className="text-emerald-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        
        {/* Dropdown: Kelas */}
        <div className="sm:col-span-4">
          <select
            value={filterKelas}
            onChange={(e) => {
              setFilterKelas(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="all">Semua Rombel Kelas</option>
            <option value="9A">Kelas IX-A</option>
            <option value="9B">Kelas IX-B</option>
            <option value="9C">Kelas IX-C</option>
            <option value="9D">Kelas IX-D</option>
            <option value="9E">Kelas IX-E</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="sm:col-span-8 relative">
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
            placeholder="Cari nama siswa atau NIS..."
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
                <th className="py-3 px-5 w-12 text-center">No</th>
                <th className="py-3 px-5 w-28">NIS</th>
                <th className="py-3 px-5">Nama Siswa</th>
                <th className="py-3 px-5 w-24 text-center">Kelas</th>
                <th className="py-3 px-5 w-28 text-center">PIN Login</th>
                <th className="py-3 px-5 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentItems.length > 0 ? (
                currentItems.map((s, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 text-center font-mono text-slate-500">
                        {globalIdx}
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                        {s.nis}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        {s.nama}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2.5 py-0.5 rounded-md font-semibold text-[11px] bg-sky-50 text-sky-700 border border-sky-100">
                          {s.kelas}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-slate-500">
                        <span className="flex items-center justify-center gap-1">
                          <KeyRound className="w-3 h-3 text-slate-400" />
                          <span>{s.pin}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onOpenCetakKartu && (
                            <button
                              onClick={onOpenCetakKartu}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Cetak Kartu Login Siswa"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleResetAttempts(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Reset Sesi Pengerjaan Siswa"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Edit Data Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.student_id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Siswa"
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
                    Tidak ada data siswa yang cocok.
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
            {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari{' '}
            {filteredStudents.length} siswa
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => {
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
          </div>
        </div>
      </div>

      {/* Modal: Tambah / Edit Siswa */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
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
                <label className="block font-semibold text-slate-700 mb-1">
                  NIS / Nomor Induk Siswa
                </label>
                <input
                  type="text"
                  value={formNis}
                  onChange={(e) => setFormNis(e.target.value)}
                  placeholder="Contoh: 12345"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Andi Saputra"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="9A">9A</option>
                    <option value="9B">9B</option>
                    <option value="9C">9C</option>
                    <option value="9D">9D</option>
                    <option value="9E">9E</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Login</label>
                  <input
                    type="text"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    placeholder="Contoh: 12345"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ruang Ujian <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formRuang}
                    onChange={(e) => setFormRuang(e.target.value)}
                    placeholder="Contoh: Ruang 01 / Lab CBT"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sesi Ujian <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={formSesi}
                    onChange={(e) => setFormSesi(e.target.value)}
                    placeholder="Contoh: Sesi 1 / Sesi 2"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aktifCheckbox"
                  checked={formAktif}
                  onChange={(e) => setFormAktif(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="aktifCheckbox" className="font-medium text-slate-700">
                  Akun Siswa Aktif (Dapat Login & Mengikuti Ujian)
                </label>
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
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Impor Data Siswa (CSV / Excel) */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Impor / Tempel Data Siswa Sekaligus
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bisa disalin langsung dari Microsoft Excel atau Google Spreadsheet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importFeedback && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importFeedback}</span>
              </div>
            )}

            <form onSubmit={handleBatchImport} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Format per baris:
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-600">
                  NIS, Nama Siswa, Kelas, PIN, Ruang (opsional), Sesi (opsional)
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Contoh baris:<br />
                    9001, Ahmad Dani Pratama, 9A, 12345, Ruang 01, Sesi 1<br />
                    9002, Bunga Citra Lestari, 9B, 12345, Ruang 01, Sesi 1<br />
                    9003, Cahyo Wibowo, 9C, 12345, Ruang 02, Sesi 2
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tempel Baris Data Siswa di Sini:
                </label>
                <textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`12345, Ahmad Dahlan, 9A, 12345\n12346, Siti Fatimah, 9B, 12346`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Proses Impor Siswa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
