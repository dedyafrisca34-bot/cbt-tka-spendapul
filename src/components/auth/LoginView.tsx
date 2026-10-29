import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, BookOpen, AlertCircle } from 'lucide-react';
import { SchoolLogo } from '../common/SchoolLogo';
import { Student, AdminUser } from '../../types/cbt';
import { StorageService, OFFICIAL_GAS_API_URL, isDemoStudent } from '../../services/storageService';
import { INITIAL_ADMIN } from '../../data/initialData';

interface LoginViewProps {
  onStudentLogin: (student: Student) => void;
  onAdminLogin: (admin: AdminUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onStudentLogin, onAdminLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fetch latest students from Google Spreadsheet on portal mount
  useEffect(() => {
    const prefetchStudents = async () => {
      try {
        const settings = StorageService.getSettings();
        const targetUrl = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
        if (!targetUrl) return;
        const resp = await fetch(`${targetUrl.trim()}?action=getStudents`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.students)) {
          const freshReal = (data.students as Student[])
            .filter((s) => !isDemoStudent(s))
            .map((s) => ({
              ...s,
              student_id: s.student_id || `std_${s.nis}`,
              pin: s.pin || '12345',
              aktif: s.aktif !== false,
            }));
          if (freshReal.length > 0) {
            StorageService.setStudents(freshReal);
          }
        }
      } catch {
        // Silent fallback
      }
    };
    prefetchStudents();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      setErrorMsg('Harap masukkan Username/NIS dan Password.');
      return;
    }

    setLoading(true);

    // 1. Check if Admin / Guru / Proktor login
    const settings = StorageService.getSettings();
    const isTeacherOrAdmin =
      u.toLowerCase() === 'admin' ||
      u.toLowerCase() === 'proktor' ||
      u === '198501012010011005' ||
      (settings.nipProktor && u.replace(/\s+/g, '') === settings.nipProktor.replace(/\s+/g, '')) ||
      u.toLowerCase() === 'dedyafrisca34@guru.smp.belajar.id';

    if (isTeacherOrAdmin && (p === 'admin' || p === 'admin123' || p === '12345' || p === 'smpn2pulung')) {
      setLoading(false);
      onAdminLogin({
        admin_id: 'adm_01',
        username: u,
        nama: settings.namaProktor || INITIAL_ADMIN.nama,
        role: 'Proktor',
      });
      return;
    }

    // 2. Check if Student login locally
    const students = StorageService.getStudents();
    let student = students.find((s) => s.nis === u && s.pin === p);

    if (student) {
      if (!student.aktif) {
        setErrorMsg('Akun siswa ini sedang dinonaktifkan oleh pihak sekolah.');
        setLoading(false);
        return;
      }
      setLoading(false);
      onStudentLogin(student);
      return;
    }

    // 3. Fallback: If not found locally, fetch live from Google Spreadsheet in real-time
    try {
      const targetUrl = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (targetUrl) {
        const resp = await fetch(`${targetUrl.trim()}?action=getStudents`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.students)) {
          const freshList = (data.students as Student[]).filter((s) => !isDemoStudent(s));
          if (freshList.length > 0) {
            StorageService.setStudents(freshList);
          }
          student = freshList.find((s) => s.nis === u && s.pin === p);
          if (student) {
            if (!student.aktif) {
              setErrorMsg('Akun siswa ini sedang dinonaktifkan oleh pihak sekolah.');
              setLoading(false);
              return;
            }
            setLoading(false);
            onStudentLogin(student);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Real-time login check notice:', err);
    }

    setLoading(false);
    setErrorMsg('NIS/NIP atau Password/PIN yang Anda masukkan tidak sesuai.');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 relative overflow-hidden font-sans">
      {/* Background Graphic & School Vibe */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-sky-950 opacity-95" />
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
      </div>

      {/* Main Login Split Box */}
      <div className="relative z-10 w-full max-w-5xl mx-3 sm:mx-4 my-3 sm:my-8 bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-auto lg:min-h-[580px] border border-slate-100">
        
        {/* Left Side: School Atmosphere Branding (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-900 p-8 sm:p-10 flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle light accents */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide mb-6">
              <ShieldCheck className="w-4 h-4 text-sky-300" />
              <span>Portal Resmi CBT Ujian Sekolah</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
              SMP Negeri 2 Pulung
            </h2>
            <p className="text-sky-200 text-sm mt-2 font-medium">
              Kabupaten Ponorogo · Jawa Timur
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <div className="p-2 bg-white/20 rounded-xl shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4 text-sky-200" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tes Kemampuan Akademik (TKA)</h4>
                  <p className="text-xs text-sky-100 mt-0.5 leading-relaxed">
                    Mata pelajaran Matematika & Bahasa Indonesia untuk persiapan kelulusan siswa Kelas IX.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-400/20 text-xs text-sky-200">
                <span className="font-semibold text-white">Prinsip Ujian: </span>
                Jujur, Mandiri, dan Bertanggung Jawab. Kerjakan dengan teliti dan perhatikan sisa waktu pengerjaan.
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/15 text-xs text-sky-200 flex items-center justify-between">
            <span>Portal CBT Resmi</span>
            <span className="font-semibold text-white">SMPN 2 Pulung</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            
            {/* Header Lockup */}
            <div className="text-center mb-7">
              <div className="flex justify-center mb-3">
                <SchoolLogo size={80} showText={false} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                SMP Negeri 2 Pulung
              </h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Berkarakter • Berprestasi • Maju
              </p>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                CBT Tryout TKA
              </h1>
              <p className="text-sm font-semibold text-sky-700">
                Tryout Tes Kemampuan Akademik Kelas IX
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Silakan login untuk melanjutkan ujian.
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username (NIS / NIP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan NIS siswa atau NIP guru"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password / PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan PIN ujian"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold rounded-xl text-sm shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Official School Portal Guide */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Petunjuk Masuk Portal:</span>
                </div>
                <p className="leading-relaxed">
                  • <strong>Peserta Didik:</strong> Masukkan NIS dan PIN ujian yang tercantum pada kartu peserta.
                </p>
                <p className="leading-relaxed">
                  • <strong>Proktor / Guru:</strong> Masukkan akun login proktor sekolah untuk membuka panel kendali ujian.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center text-[11px] text-slate-400 space-y-0.5">
              <div>SMP Negeri 2 Pulung · CBT Tryout Tes Kemampuan Akademik (TKA)</div>
              <div className="text-[10px] text-slate-400/80">Dedy Andika Afrisca, S.Kom</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
