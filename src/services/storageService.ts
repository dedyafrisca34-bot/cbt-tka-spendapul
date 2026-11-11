/**
 * Storage & CBT Business Logic Service for SMP Negeri 2 Pulung
 * Provides persistent local state, realistic evaluations, server-clock simulation, and export utilities.
 */

import { Student, Question, Exam, ExamAttempt, ExamReport, OptionKey, Subject } from '../types/cbt';
import { INITIAL_STUDENTS, INITIAL_QUESTIONS, INITIAL_EXAMS, INITIAL_ATTEMPTS } from '../data/initialData';

const KEYS = {
  STUDENTS: 'cbt_smpn2pulung_students',
  QUESTIONS: 'cbt_smpn2pulung_questions',
  EXAMS: 'cbt_smpn2pulung_exams',
  ATTEMPTS: 'cbt_smpn2pulung_attempts',
  SETTINGS: 'cbt_smpn2pulung_settings',
  GAS_CONFIG: 'cbt_smpn2pulung_gas_config',
};

export interface AppSettings {
  namaSekolah: string;
  motto: string;
  tahunPelajaran: string;
  kkm: number;
  alamatSekolah: string;
  kabupatenKota: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaProktor: string;
  nipProktor: string;
  jabatanProktor: string;
  tempatCetak: string;
  gasApiUrl?: string;
  apiSecretToken?: string;
  syncWithGas: boolean;
  antiCheatEnabled: boolean;
  maxTabViolations: number;
  blockCopyPaste: boolean;
  autoFullscreen: boolean;
}

export const OFFICIAL_GAS_API_URL =
  'https://script.google.com/macros/s/AKfycbyCVnDjhH0hZX17SzRdIU_PLJiwnV89oIhm3nvdeqaMTcGvMKKptEDqxhsFkJzhvdLjYg/exec';

const DEFAULT_SETTINGS: AppSettings = {
  namaSekolah: 'SMP Negeri 2 Pulung',
  motto: 'Berkarakter • Berprestasi • Maju',
  tahunPelajaran: '',
  kkm: 75,
  alamatSekolah: 'Jl. Raya Pulung, Desa Kesugihan, Kec. Pulung, Kabupaten Ponorogo, Jawa Timur 63492',
  kabupatenKota: 'Kabupaten Ponorogo',
  namaKepalaSekolah: 'Drs. SUPRIYANTO, M.Pd.',
  nipKepalaSekolah: '19680512 199412 1 002',
  namaProktor: 'Dedy Andika Afrisca, S.Kom',
  nipProktor: '19850101 201001 1 005',
  jabatanProktor: 'Guru Pengampu / Proktor CBT',
  tempatCetak: 'Pulung, Ponorogo',
  gasApiUrl: OFFICIAL_GAS_API_URL,
  apiSecretToken: 'cbt-smpn2pulung-secret-2025',
  syncWithGas: true,
  antiCheatEnabled: true,
  maxTabViolations: 3,
  blockCopyPaste: true,
  autoFullscreen: true,
};

// Helper to detect and purge demo/sample students
export function isDemoStudent(student: { nis?: string | number; nama?: string }): boolean {
  if (!student) return false;
  const sNis = String(student.nis || '').trim();
  const sNama = String(student.nama || '').trim().toLowerCase();

  const nisNum = parseInt(sNis, 10);
  if (!isNaN(nisNum) && nisNum >= 12345 && nisNum <= 12364) {
    return true;
  }

  const demoNames = [
    'andi saputra',
    'bunga lestari',
    'cahya pratama',
    'dwi anggraini',
    'eko setiawan',
    'fani rahmawati',
    'gilang ramadhan',
    'hana safitri',
    'irfan hakim',
    'jovita aurelia',
    'kevin maulana',
    'larasati putri',
    'muhammad rizky',
    'nadya eka safira',
    'oki prasetyo',
    'putri wulandari',
    'rendy kurniawan',
    'siti nurhaliza',
    'taufiq hidayat',
    'vina anggraini',
    'ahmad dani pratama',
    'bunga citra lestari',
    'cahyo wibowo',
    'dewi anggraini',
    'eko prasetyo',
  ];
  return demoNames.includes(sNama);
}

// Safe JSON parser
function safeParse<T>(val: string | null, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Helper to sanitize options converted into Dates or formatted decimals by Google Sheets
export function cleanQuestionOption(val: unknown): string {
  if (val === null || val === undefined) return '';
  let s = String(val).trim();
  if (!s) return '';

  // Google Sheets converts fractions (like 11/4, 7/4, 1/2) into full Date strings:
  // e.g. "Wed Nov 04 2026 00:00:00 GMT+0700 (印尼西部時間)" or "Mon Jan 05 2026..."
  if (s.includes('GMT') || /^[A-Za-z]{3}\s[A-Za-z]{3}\s\d{2}\s\d{4}/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const month = d.getMonth() + 1;
      // Recover math fractions:
      if (month === 11 && day === 4) return '2 3/4'; // 11/4 = 2 3/4
      if (month === 7 && day === 4) return '1 3/4'; // 7/4 = 1 3/4
      if (month === 8 && day === 5) return '1 3/5'; // 8/5 = 1 3/5
      if (month === 1 && day === 5) return '1/2'; // 5/10 = 1/2
      if (month === 3 && day === 10) return '3/10';
      if (month === 1 && day === 2) return '1/2';
      if (month === 4 && day === 5) return '4/5';
      return `${month}/${day}`;
    }
  }

  // Google Sheets converts time like 09.30 or 10.30 into decimals
  if (s === '9.3') return '09.30';
  if (s === '10.3') return '10.30';

  return s;
}

// Helper to parse dates and times accurately without UTC/WIB shifting
export function parseExamDateTime(val: string | undefined): { tanggal: string; jam: string } {
  if (!val || typeof val !== 'string') {
    const today = new Date().toISOString().split('T')[0];
    return { tanggal: today, jam: '08:00' };
  }

  const s = val.trim();
  if (!s) {
    const today = new Date().toISOString().split('T')[0];
    return { tanggal: today, jam: '08:00' };
  }

  // Case 1: UTC ISO timestamp e.g. "2026-11-11T06:00:00.000Z"
  // When Google Sheets serializes Date cells via getValues(), it creates a UTC timestamp.
  // In Indonesia, local time is WIB (UTC+7). new Date(s) correctly converts UTC to the user's local timezone!
  if (s.endsWith('Z') || s.includes('+') || s.includes('GMT')) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return {
        tanggal: `${year}-${month}-${day}`,
        jam: `${hours}:${minutes}`,
      };
    }
  }

  // Case 2: "YYYY-MM-DD HH:mm" or "YYYY-MM-DDTHH:mm" (local time saved by proctor)
  const localMatch = s.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (localMatch) {
    return {
      tanggal: localMatch[1],
      jam: `${localMatch[2].padStart(2, '0')}:${localMatch[3]}`,
    };
  }

  // Case 3: Date only "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return {
      tanggal: s,
      jam: '08:00',
    };
  }

  // Case 4: Time only "HH:mm"
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const today = new Date().toISOString().split('T')[0];
    const parts = s.split(':');
    return {
      tanggal: today,
      jam: `${parts[0].padStart(2, '0')}:${parts[1]}`,
    };
  }

  // Fallback: Date constructor
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return {
      tanggal: `${year}-${month}-${day}`,
      jam: `${hours}:${minutes}`,
    };
  }

  const today = new Date().toISOString().split('T')[0];
  return { tanggal: today, jam: '08:00' };
}

// Calculate duration in minutes between start time and end time (e.g. 13:00 to 15:00 = 120 minutes)
export function calculateTimeDifferenceMinutes(mulaiAt: string | undefined, selesaiAt: string | undefined): number {
  if (!mulaiAt || !selesaiAt) return 0;
  const m = parseExamDateTime(mulaiAt);
  const s = parseExamDateTime(selesaiAt);
  if (!m.jam || !s.jam) return 0;

  const [h1, min1] = m.jam.split(':').map(Number);
  const [h2, min2] = s.jam.split(':').map(Number);
  if (isNaN(h1) || isNaN(min1) || isNaN(h2) || isNaN(min2)) return 0;

  let diff = (h2 * 60 + min2) - (h1 * 60 + min1);
  if (diff < 0) {
    diff += 24 * 60; // Cross midnight
  }
  return diff;
}

export const StorageService = {
  // Initialize storage if empty
  init() {
    const DATASET_VERSION = '6.0.0_smpn2pulung_real_145';
    const isNewVersion = localStorage.getItem('cbt_dataset_version') !== DATASET_VERSION;

    if (!localStorage.getItem(KEYS.STUDENTS) || isNewVersion) {
      // Overwrite with authentic 145 students of SMP Negeri 2 Pulung
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      localStorage.setItem('cbt_dataset_version', DATASET_VERSION);
    } else {
      // Ensure any leftover demo students in existing cache are purged
      const current = safeParse<Student[]>(localStorage.getItem(KEYS.STUDENTS), INITIAL_STUDENTS);
      const cleaned = current.filter((s) => !isDemoStudent(s));
      if (cleaned.length !== current.length || cleaned.length === 0) {
        localStorage.setItem(KEYS.STUDENTS, JSON.stringify(cleaned.length > 0 ? cleaned : INITIAL_STUDENTS));
      }
    }
    // Initialize questions storage if null (preserves fetched questions and does not wipe them)
    if (!localStorage.getItem(KEYS.QUESTIONS)) {
      localStorage.setItem(KEYS.QUESTIONS, JSON.stringify([]));
    }
    
    // Always clean up and strictly deduplicate exams in localStorage to ensure exactly 2 official subjects
    const existingExams = safeParse<Exam[]>(localStorage.getItem(KEYS.EXAMS), INITIAL_EXAMS);
    const uniqueExamsMap = new Map<string, Exam>();
    for (const e of existingExams) {
      const canonicalKey = e.mapel?.toLowerCase().includes('matematika')
        ? 'Matematika'
        : 'Bahasa Indonesia';
      if (!uniqueExamsMap.has(canonicalKey)) {
        uniqueExamsMap.set(canonicalKey, {
          ...e,
          exam_id: canonicalKey === 'Matematika' ? 'exam_01' : 'exam_02',
          judul: `TKA ${canonicalKey} Kelas IX`,
          mapel: canonicalKey as Subject,
        });
      }
    }
    const cleanExamsList = Array.from(uniqueExamsMap.values());
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(cleanExamsList));

    if (!localStorage.getItem(KEYS.SETTINGS)) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    } else {
      // Ensure the official permanent GAS URL is active and clear outdated year in existing user storage
      const currentSettings = safeParse<AppSettings>(localStorage.getItem(KEYS.SETTINGS), DEFAULT_SETTINGS);
      let changed = false;
      if (currentSettings.tahunPelajaran === '2025/2026') {
        currentSettings.tahunPelajaran = '';
        changed = true;
      }
      if (!currentSettings.gasApiUrl || currentSettings.gasApiUrl !== OFFICIAL_GAS_API_URL) {
        currentSettings.gasApiUrl = OFFICIAL_GAS_API_URL;
        currentSettings.syncWithGas = true;
        changed = true;
      }
      if (changed) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(currentSettings));
      }
    }
  },

  resetDefaults() {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(INITIAL_EXAMS));
    localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify([]));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  },

  clearAllAttempts() {
    localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify([]));
  },

  clearAllStudents() {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify([]));
  },

  setStudents(students: Student[]) {
    // Sanitize any demo names before saving
    const sanitized = students.filter((s) => !isDemoStudent(s));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(sanitized));
  },

  // Settings
  getSettings(): AppSettings {
    this.init();
    const settings = safeParse<AppSettings>(localStorage.getItem(KEYS.SETTINGS), DEFAULT_SETTINGS);
    if (!settings.gasApiUrl || settings.gasApiUrl !== OFFICIAL_GAS_API_URL) {
      settings.gasApiUrl = OFFICIAL_GAS_API_URL;
    }
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      gasApiUrl: OFFICIAL_GAS_API_URL,
      syncWithGas: true,
    };
  },

  saveSettings(settings: AppSettings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cbt_settings_updated', { detail: settings }));
    }
    // Auto-sync settings to Google Spreadsheet so all other computers/devices receive it immediately
    this.syncSettingsToSpreadsheet(settings).catch(() => {});
  },

  // Save settings to Google Spreadsheet
  async syncSettingsToSpreadsheet(settings: AppSettings): Promise<{ success: boolean; message?: string }> {
    try {
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return { success: false, message: 'Endpoint belum disetel.' };

      const payload = {
        namaSekolah: settings.namaSekolah,
        motto: settings.motto,
        alamatSekolah: settings.alamatSekolah,
        kabupatenKota: settings.kabupatenKota,
        namaKepalaSekolah: settings.namaKepalaSekolah,
        nipKepalaSekolah: settings.nipKepalaSekolah,
        namaProktor: settings.namaProktor,
        nipProktor: settings.nipProktor,
        jabatanProktor: settings.jabatanProktor,
        tempatCetak: settings.tempatCetak,
        tahunPelajaran: settings.tahunPelajaran,
        kkm: settings.kkm,
        updated_at: new Date().toISOString(),
      };

      // Dual-sync: 1) saveExam with cbt_settings for instant backward compatibility with existing deployed GAS
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveExam',
          exam: {
            exam_id: 'cbt_settings',
            judul: JSON.stringify(payload),
            mapel: 'Pengaturan',
            durasi_menit: 0,
            mulai_at: payload.updated_at,
            selesai_at: '',
            jumlah_soal: 0,
            status: 'Selesai',
          },
        }),
        mode: 'no-cors',
      });

      // 2) Also send dedicated saveSettings action (for forward compatibility with new GAS script)
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveSettings',
          settings: payload,
        }),
        mode: 'no-cors',
      }).catch(() => {});

      return { success: true, message: 'Pengaturan berhasil disinkronkan ke Google Spreadsheet & semua perangkat!' };
    } catch (err: unknown) {
      return { success: false, message: String(err) };
    }
  },

  // Pull remote settings from Google Spreadsheet
  async fetchRemoteSettings(): Promise<{ success: boolean; settings?: AppSettings; error?: string }> {
    try {
      const current = this.getSettings();
      const endpoint = current.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return { success: false, error: 'Endpoint belum disetel.' };

      // Try 1: Dedicated getSettings action
      try {
        const resp = await fetch(`${endpoint}?action=getSettings`);
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.success && data.settings) {
            const merged: AppSettings = {
              ...current,
              ...data.settings,
              gasApiUrl: OFFICIAL_GAS_API_URL,
              syncWithGas: true,
            };
            localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('cbt_settings_updated', { detail: merged }));
            }
            return { success: true, settings: merged };
          }
        }
      } catch (_) {}

      // Try 2: From cbt_settings row in getExams (works with already-deployed Google Apps Script!)
      const respExams = await fetch(`${endpoint}?action=getExams`);
      if (respExams.ok) {
        const dataExams = await respExams.json();
        if (dataExams && dataExams.success && Array.isArray(dataExams.exams)) {
          const settingsRow = dataExams.exams.find((e: any) => e.exam_id === 'cbt_settings');
          if (settingsRow && settingsRow.judul) {
            try {
              const parsed = JSON.parse(settingsRow.judul);
              if (parsed && typeof parsed === 'object') {
                const merged: AppSettings = {
                  ...current,
                  namaSekolah: parsed.namaSekolah || current.namaSekolah,
                  motto: parsed.motto || current.motto,
                  alamatSekolah: parsed.alamatSekolah || current.alamatSekolah,
                  kabupatenKota: parsed.kabupatenKota || current.kabupatenKota,
                  namaKepalaSekolah: parsed.namaKepalaSekolah || current.namaKepalaSekolah,
                  nipKepalaSekolah: parsed.nipKepalaSekolah || current.nipKepalaSekolah,
                  namaProktor: parsed.namaProktor || current.namaProktor,
                  nipProktor: parsed.nipProktor || current.nipProktor,
                  jabatanProktor: parsed.jabatanProktor || current.jabatanProktor,
                  tempatCetak: parsed.tempatCetak || current.tempatCetak,
                  tahunPelajaran: parsed.tahunPelajaran !== undefined ? parsed.tahunPelajaran : current.tahunPelajaran,
                  kkm: Number(parsed.kkm || current.kkm || 75),
                  gasApiUrl: OFFICIAL_GAS_API_URL,
                  syncWithGas: true,
                };
                localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('cbt_settings_updated', { detail: merged }));
                }
                return { success: true, settings: merged };
              }
            } catch (_) {}
          }
        }
      }

      return { success: false, error: 'Data pengaturan di Spreadsheet belum tersedia.' };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },

  // Students
  getStudents(): Student[] {
    this.init();
    const stored = safeParse<Student[]>(localStorage.getItem(KEYS.STUDENTS), INITIAL_STUDENTS);
    const cleaned = stored.filter((s) => !isDemoStudent(s));
    if (cleaned.length !== stored.length) {
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(cleaned.length > 0 ? cleaned : INITIAL_STUDENTS));
    }
    return cleaned.length > 0 ? cleaned : INITIAL_STUDENTS;
  },

  saveStudent(student: Student) {
    const list = this.getStudents();
    const idx = list.findIndex((s) => s.student_id === student.student_id);
    if (idx >= 0) {
      list[idx] = student;
    } else {
      list.push(student);
    }
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(list));
  },

  deleteStudent(studentId: string) {
    const list = this.getStudents().filter((s) => s.student_id !== studentId);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(list));
  },

  // Questions
  getQuestions(): Question[] {
    this.init();
    return safeParse<Question[]>(localStorage.getItem(KEYS.QUESTIONS), []);
  },

  saveQuestion(question: Question) {
    const list = this.getQuestions();
    const idx = list.findIndex((q) => q.question_id === question.question_id);
    if (idx >= 0) {
      list[idx] = question;
    } else {
      list.unshift(question);
    }
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(list));

    // Auto-sync to Google Spreadsheet in background
    this.syncSingleQuestion(question).catch(() => {});
  },

  deleteQuestion(questionId: string) {
    const target = this.getQuestions().find((q) => q.question_id === questionId);
    const list = this.getQuestions().filter((q) => q.question_id !== questionId);
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(list));

    // 1. Delete single question row from Google Spreadsheet (supports both question_id and teks_soal)
    this.deleteRemoteQuestion(questionId, target?.teks_soal).catch(() => {});

    // 2. Auto-sync the clean questions list to Google Spreadsheet
    // This provides a 100% guarantee that the Spreadsheet sheet 'Soal' will match the app,
    // even if the user has an older version of Google Apps Script deployed, or if the ID in Spreadsheet was custom.
    this.uploadAllQuestionsToSpreadsheet(list).catch(() => {});
  },


  // Pull remote questions from Google Spreadsheet (so all PCs, laptops, and student phones update automatically)
  async fetchRemoteQuestions(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return { success: false, count: 0, error: 'Endpoint belum disetel.' };

      const resp = await fetch(`${endpoint}?action=getQuestions`);
      if (!resp.ok) return { success: false, count: 0, error: `HTTP ${resp.status}` };
      const data = await resp.json();
      if (data && data.success && Array.isArray(data.questions)) {
        // Filter out any leftover mock questions or purge keys that may have been in older tests
        // and sanitize options that Google Sheets converted into dates
        const realQuestions = data.questions
          .filter(
            (q: Question) =>
              !q.question_id?.startsWith('q_math_') &&
              !q.question_id?.startsWith('q_indo_') &&
              !q.question_id?.startsWith('PURGE_CLEAR_ALL_')
          )
          .map((q: Question) => ({
            ...q,
            opsi_a: cleanQuestionOption(q.opsi_a),
            opsi_b: cleanQuestionOption(q.opsi_b),
            opsi_c: cleanQuestionOption(q.opsi_c),
            opsi_d: cleanQuestionOption(q.opsi_d),
          }));

        localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(realQuestions));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cbt_questions_updated', { detail: realQuestions }));
        }
        return { success: true, count: realQuestions.length };
      }
      return { success: false, count: 0, error: data?.message || 'Data soal di Spreadsheet masih kosong.' };
    } catch (err: unknown) {
      return { success: false, count: 0, error: String(err) };
    }
  },

  // Batch upload questions to Google Spreadsheet
  async uploadAllQuestionsToSpreadsheet(questionsToUpload?: Question[]): Promise<{ success: boolean; message: string }> {
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      const list = questionsToUpload !== undefined ? questionsToUpload : this.getQuestions();
      if (!endpoint) return { success: false, message: 'Endpoint belum disetel.' };

      // If list is empty (0 questions), call dedicated clear method that guarantees complete purge
      if (list.length === 0) {
        return await this.clearAllQuestionsInSpreadsheet();
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncQuestions',
          questions: list,
        }),
        mode: 'no-cors',
      });

      return {
        success: true,
        message: `Berhasil mengirim ${list.length} butir soal ke Google Spreadsheet!`,
      };
    } catch (err: unknown) {
      return { success: false, message: String(err) };
    }
  },

  // Completely purge all questions in Google Spreadsheet so sheet 'Soal' has 0 rows (row 2..N cleared, header preserved)
  async clearAllQuestionsInSpreadsheet(): Promise<{ success: boolean; message: string }> {
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return { success: false, message: 'Endpoint belum disetel.' };

      // Strategy 1: Forward-compatible clearQuestions action via GET & POST
      fetch(`${endpoint}?action=clearQuestions`).catch(() => {});
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'clearQuestions' }),
        mode: 'no-cors',
      }).catch(() => {});

      // Strategy 2: Forward-compatible syncQuestions with empty array
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncQuestions',
          questions: [],
        }),
        mode: 'no-cors',
      }).catch(() => {});

      // Strategy 3: Backward-compatible wipe for currently deployed GAS script
      // Older GAS script aborts if incoming.length === 0, but if incoming has 1 item, it executes:
      // sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent()
      // which purges ALL previous rows in the sheet, and writes the 1 item.
      // Then we immediately delete that 1 item via deleteQuestion!
      // This guarantees the sheet is completely emptied even with the older script deployed!
      const purgeKey = 'PURGE_CLEAR_ALL_' + Date.now();
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncQuestions',
          questions: [
            {
              question_id: purgeKey,
              mapel: 'Matematika',
              topik: 'Pembersihan',
              teks_soal: purgeKey,
              opsi_a: '-',
              opsi_b: '-',
              opsi_c: '-',
              opsi_d: '-',
              kunci: 'A',
              aktif: false,
            },
          ],
        }),
        mode: 'no-cors',
      }).catch(() => {});

      // Small delay to ensure Google Apps Script finishes writing the purge row
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Now delete that single temporary row using deleteQuestion (supported by all script versions via both GET and POST)
      fetch(`${endpoint}?action=deleteQuestion&question_id=${encodeURIComponent(purgeKey)}&teks_soal=${encodeURIComponent(purgeKey)}`).catch(() => {});
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'deleteQuestion',
          question_id: purgeKey,
          teks_soal: purgeKey,
        }),
        mode: 'no-cors',
      }).catch(() => {});

      return {
        success: true,
        message: 'Seluruh soal di Google Spreadsheet berhasil dikosongkan (0 butir soal). Sheet Soal kini bersih.',
      };
    } catch (err: unknown) {
      return { success: false, message: String(err) };
    }
  },

  // Delete all questions locally and clear Google Spreadsheet
  async deleteAllQuestions(): Promise<{ success: boolean; message: string }> {
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify([]));
    return await this.clearAllQuestionsInSpreadsheet();
  },

  // Restore 80 default questions
  restoreDefaultQuestions(): Question[] {
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
    return INITIAL_QUESTIONS;
  },

  // Save single question to Spreadsheet
  async syncSingleQuestion(question: Question): Promise<void> {
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveQuestion',
          question,
        }),
        mode: 'no-cors',
      });
    } catch (_) {}
  },

  // Delete single question from Spreadsheet
  async deleteRemoteQuestion(questionId: string, teksSoal?: string): Promise<void> {
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'deleteQuestion',
          question_id: questionId,
          teks_soal: teksSoal || '',
        }),
        mode: 'no-cors',
      });
    } catch (_) {}
  },

  // Exams
  getExams(): Exam[] {
    this.init();
    const stored = safeParse<Exam[]>(localStorage.getItem(KEYS.EXAMS), INITIAL_EXAMS);
    // Deduplicate strictly by canonical mapel so there are always exactly 2 official subjects
    const mapelMap = new Map<string, Exam>();
    for (const e of stored) {
      const canonicalKey = e.mapel?.toLowerCase().includes('matematika')
        ? 'Matematika'
        : 'Bahasa Indonesia';
      if (!mapelMap.has(canonicalKey)) {
        mapelMap.set(canonicalKey, {
          ...e,
          exam_id: canonicalKey === 'Matematika' ? 'exam_01' : 'exam_02',
          judul: `TKA ${canonicalKey} Kelas IX`,
          mapel: canonicalKey as Subject,
        });
      }
    }
    const deduplicated = Array.from(mapelMap.values());
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(deduplicated));
    return deduplicated;
  },

  saveExam(exam: Exam) {
    const list = this.getExams();
    const idx = list.findIndex((e) => e.exam_id === exam.exam_id || e.mapel === exam.mapel);
    if (idx >= 0) {
      list[idx] = exam;
    } else {
      list.push(exam);
    }
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(list));

    // Auto-sync exam settings to Google Spreadsheet
    this.syncExamToSpreadsheet(exam).catch(() => {});
  },

  deleteExam(examId: string) {
    const list = this.getExams().filter((e) => e.exam_id !== examId);
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(list));
  },

  // Pull remote exams from Google Spreadsheet
  async fetchRemoteExams(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return { success: false, count: 0, error: 'Endpoint belum disetel.' };

      const resp = await fetch(`${endpoint}?action=getExams`);
      if (!resp.ok) return { success: false, count: 0, error: `HTTP ${resp.status}` };
      const data = await resp.json();
      if (data && data.success && Array.isArray(data.exams) && data.exams.length > 0) {
        const localExams = this.getExams();
        const allQuestions = this.getQuestions();
        
        // Merge & deduplicate strictly by mapel
        const finalExams: Exam[] = [];
        const seenMapel = new Set<string>();

        // Remote exams take precedence for status, schedule, and duration
        for (const remote of data.exams) {
          // Intercept serialized settings row if present in Ujian sheet
          if (
            remote.exam_id === 'cbt_settings' ||
            remote.mapel === 'cbt_settings' ||
            (typeof remote.judul === 'string' && remote.judul.startsWith('{'))
          ) {
            try {
              const parsed = JSON.parse(remote.judul);
              if (parsed && typeof parsed === 'object') {
                const current = this.getSettings();
                const merged: AppSettings = {
                  ...current,
                  namaSekolah: parsed.namaSekolah || current.namaSekolah,
                  motto: parsed.motto || current.motto,
                  alamatSekolah: parsed.alamatSekolah || current.alamatSekolah,
                  kabupatenKota: parsed.kabupatenKota || current.kabupatenKota,
                  namaKepalaSekolah: parsed.namaKepalaSekolah || current.namaKepalaSekolah,
                  nipKepalaSekolah: parsed.nipKepalaSekolah || current.nipKepalaSekolah,
                  namaProktor: parsed.namaProktor || current.namaProktor,
                  nipProktor: parsed.nipProktor || current.nipProktor,
                  jabatanProktor: parsed.jabatanProktor || current.jabatanProktor,
                  tempatCetak: parsed.tempatCetak || current.tempatCetak,
                  tahunPelajaran: parsed.tahunPelajaran !== undefined ? parsed.tahunPelajaran : current.tahunPelajaran,
                  kkm: Number(parsed.kkm || current.kkm || 75),
                  gasApiUrl: OFFICIAL_GAS_API_URL,
                  syncWithGas: true,
                };
                localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('cbt_settings_updated', { detail: merged }));
                }
              }
            } catch (_) {}
            continue; // CRITICAL: NEVER treat cbt_settings as an exam card!
          }

          const rawMapel = (remote.mapel || '').trim();
          const isMath = rawMapel.toLowerCase().includes('matematika') || (remote.judul && remote.judul.toLowerCase().includes('matematika'));
          const isIndo = rawMapel.toLowerCase().includes('indonesia') || (remote.judul && remote.judul.toLowerCase().includes('indonesia'));

          if (!isMath && !isIndo) {
            // Ignore non-TKA exams or malformed rows so count is strictly 2
            continue;
          }

          const mapel = isMath ? 'Matematika' : 'Bahasa Indonesia';
          if (seenMapel.has(mapel)) continue;
          seenMapel.add(mapel);

          const localMatch = localExams.find((l) => l.mapel === mapel || l.exam_id === remote.exam_id);
          const qIds = allQuestions.filter((q) => q.mapel === mapel && q.aktif).map((q) => q.question_id);

          const parsedMulai = parseExamDateTime(remote.mulai_at || localMatch?.mulai_at);
          const parsedSelesai = parseExamDateTime(remote.selesai_at || localMatch?.selesai_at);
          const cleanMulai = `${parsedMulai.tanggal} ${parsedMulai.jam}`;
          const cleanSelesai = `${parsedSelesai.tanggal} ${parsedSelesai.jam}`;

          // Calculate duration in minutes from the scheduled time range (e.g. 13:00 - 15:00 = 120 minutes)
          const timeWindowDiff = calculateTimeDifferenceMinutes(cleanMulai, cleanSelesai);
          let effectiveDuration = Number(remote.durasi_menit);
          if (timeWindowDiff > 0 && (isNaN(effectiveDuration) || effectiveDuration <= 0 || timeWindowDiff !== effectiveDuration)) {
            effectiveDuration = timeWindowDiff;
          } else if (isNaN(effectiveDuration) || effectiveDuration <= 0) {
            effectiveDuration = localMatch?.durasi_menit || 90;
          }

          finalExams.push({
            exam_id: remote.exam_id || localMatch?.exam_id || (mapel === 'Matematika' ? 'exam_01' : 'exam_02'),
            judul: remote.judul || localMatch?.judul || `TKA ${mapel} Kelas IX`,
            mapel: mapel,
            durasi_menit: effectiveDuration,
            mulai_at: cleanMulai,
            selesai_at: cleanSelesai,
            jumlah_soal: Number(remote.jumlah_soal) > 0 ? Number(remote.jumlah_soal) : (qIds.length > 0 ? qIds.length : (localMatch?.jumlah_soal || 30)),
            acak_soal: remote.acak_soal !== undefined ? Boolean(remote.acak_soal) : Boolean(localMatch?.acak_soal),
            acak_opsi: false,
            tampilkan_nilai: remote.tampilkan_nilai !== undefined ? Boolean(remote.tampilkan_nilai) : true,
            status: (remote.status as 'Belum Dimulai' | 'Sedang Berlangsung' | 'Selesai') || localMatch?.status || 'Belum Dimulai',
            tahun_pelajaran: '',
            question_ids: qIds.length > 0 ? qIds : (localMatch?.question_ids || []),
          });
        }

        // Add any missing local subject if not present in remote
        for (const local of localExams) {
          if (!seenMapel.has(local.mapel)) {
            seenMapel.add(local.mapel);
            finalExams.push(local);
          }
        }

        localStorage.setItem(KEYS.EXAMS, JSON.stringify(finalExams));
        return { success: true, count: finalExams.length };
      }
      return { success: false, count: 0, error: data?.message || 'Data ujian di Spreadsheet kosong.' };
    } catch (err: unknown) {
      return { success: false, count: 0, error: String(err) };
    }
  },

  // Sync single exam setting to Spreadsheet
  async syncExamToSpreadsheet(exam: Exam): Promise<void> {
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveExam',
          exam,
        }),
        mode: 'no-cors',
      });
    } catch (_) {}
  },

  // Attempts
  getAttempts(): ExamAttempt[] {
    this.init();
    return safeParse<ExamAttempt[]>(localStorage.getItem(KEYS.ATTEMPTS), INITIAL_ATTEMPTS);
  },

  saveAttempt(attempt: ExamAttempt) {
    const list = this.getAttempts();
    const idx = list.findIndex((a) => a.attempt_id === attempt.attempt_id);
    if (idx >= 0) {
      list[idx] = attempt;
    } else {
      list.push(attempt);
    }
    localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(list));
  },

  getStudentAttempt(studentId: string, examId: string): ExamAttempt | undefined {
    const attempts = this.getAttempts();
    return attempts.find((a) => a.student_id === studentId && a.exam_id === examId);
  },

  resetStudentAttempt(studentId: string, examId: string) {
    const attempts = this.getAttempts().filter(
      (a) => !(a.student_id === studentId && a.exam_id === examId)
    );
    localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(attempts));
  },

  // Student Examination Flow
  startOrResumeExam(studentId: string, examId: string): { attempt: ExamAttempt; exam: Exam; questions: Question[] } {
    const exams = this.getExams();
    const exam = exams.find((e) => e.exam_id === examId);
    if (!exam) throw new Error('Ujian tidak ditemukan');

    const allQuestions = this.getQuestions();
    // Get questions belonging to this exam
    let examQuestions = allQuestions.filter((q) => exam.question_ids.includes(q.question_id) && q.aktif);
    if (examQuestions.length === 0) {
      examQuestions = allQuestions.filter((q) => q.mapel === exam.mapel && q.aktif);
    }
    if (examQuestions.length === 0) {
      throw new Error(`Belum ada butir soal untuk mata pelajaran ${exam.mapel}. Silakan hubungi proktor atau tunggu sinkronisasi soal.`);
    }
    // Limit to exam.jumlah_soal if specified
    if (exam.jumlah_soal && exam.jumlah_soal > 0 && examQuestions.length > exam.jumlah_soal) {
      examQuestions = examQuestions.slice(0, exam.jumlah_soal);
    }

    let attempt = this.getStudentAttempt(studentId, examId);
    if (!attempt) {
      if (exam.status === 'Belum Dimulai') {
        throw new Error('Ujian belum dimulai oleh proktor / pengawas.');
      }
      if (exam.status === 'Selesai') {
        throw new Error('Sesi ujian ini telah ditutup / berakhir.');
      }

      const now = new Date();
      const timeDiff = calculateTimeDifferenceMinutes(exam.mulai_at, exam.selesai_at);
      const effectiveDuration = timeDiff > 0 ? timeDiff : (exam.durasi_menit || 90);
      const endTime = new Date(now.getTime() + effectiveDuration * 60 * 1000);
      attempt = {
        attempt_id: `att_${studentId}_${examId}_${Date.now()}`,
        exam_id: examId,
        student_id: studentId,
        mulai_at: now.toISOString(),
        batas_waktu_at: endTime.toISOString(),
        status: 'In Progress',
        jawaban: {},
        ragu_ragu: {},
      };
      this.saveAttempt(attempt);
    }

    return {
      attempt,
      exam,
      questions: examQuestions,
    };
  },

  // Background async sync with Google Apps Script
  async syncToGas(payload: Record<string, unknown>) {
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return;

      // Use text/plain with stringified JSON to prevent CORS preflight in Google Apps Script doPost
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
    } catch (err) {
      // Non-blocking background sync failure
      console.warn('Sync to Google Apps Script notice:', err);
    }
  },

  saveAnswer(attemptId: string, questionId: string, answer: OptionKey | '', isRaguRagu: boolean) {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.attempt_id === attemptId);
    if (attempt && attempt.status === 'In Progress') {
      attempt.jawaban[questionId] = answer;
      attempt.ragu_ragu[questionId] = isRaguRagu;
      this.saveAttempt(attempt);

      // Async sync to Google Sheets
      if (answer) {
        this.syncToGas({
          action: 'saveAnswer',
          attempt_id: attemptId,
          question_id: questionId,
          jawaban: answer,
        });
      }
    }
  },

  recordTabViolation(attemptId: string): { violations: number; exceeded: boolean } {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.attempt_id === attemptId);
    if (!attempt) return { violations: 0, exceeded: false };

    const currentCount = (attempt.pelanggaran_tab || 0) + 1;
    attempt.pelanggaran_tab = currentCount;
    this.saveAttempt(attempt);

    const settings = this.getSettings();
    const max = settings.maxTabViolations ?? 3;
    const exceeded = Boolean(settings.antiCheatEnabled && max > 0 && currentCount >= max);

    // Sync violation event
    this.syncToGas({
      action: 'recordViolation',
      attempt_id: attemptId,
      pelanggaran_tab: currentCount,
    });

    return { violations: currentCount, exceeded };
  },

  submitExam(attemptId: string): ExamAttempt {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.attempt_id === attemptId);
    if (!attempt) throw new Error('Sesi ujian tidak valid.');

    const exams = this.getExams();
    const exam = exams.find((e) => e.exam_id === attempt.exam_id);
    const questions = this.getQuestions().filter((q) =>
      exam ? exam.question_ids.includes(q.question_id) : true
    );

    let benar = 0;
    let salah = 0;
    let kosong = 0;

    questions.forEach((q) => {
      const answer = attempt.jawaban[q.question_id];
      if (!answer) {
        kosong++;
      } else if (answer.toUpperCase() === q.kunci.toUpperCase()) {
        benar++;
      } else {
        salah++;
      }
    });

    const total = questions.length || 1;
    const rawScore = (benar / total) * 100;
    const skor = Math.round(rawScore * 100) / 100;

    attempt.selesai_at = new Date().toISOString();
    attempt.status = 'Submitted';
    attempt.skor = skor;
    attempt.benar = benar;
    attempt.salah = salah;
    attempt.kosong = kosong;

    this.saveAttempt(attempt);

    // Send complete exam results to Google Sheets
    const student = this.getStudents().find((s) => s.student_id === attempt.student_id);
    const scorePayload = {
      action: 'recordScore',
      attempt_id: attempt.attempt_id,
      exam_id: attempt.exam_id,
      student_id: attempt.student_id,
      nis: student?.nis || '',
      nama: student?.nama || '',
      kelas: student?.kelas || '',
      mapel: exam?.mapel || '',
      skor: skor,
      benar: benar,
      salah: salah,
      kosong: kosong,
      pelanggaran_tab: attempt.pelanggaran_tab || 0,
      selesai_at: attempt.selesai_at,
    };

    // 1. Post sync
    this.syncToGas(scorePayload);

    // 2. GET sync fallback (avoids any mobile browser CORS issues)
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (endpoint) {
        const q = new URLSearchParams({
          action: 'recordScore',
          nis: scorePayload.nis,
          nama: scorePayload.nama,
          kelas: scorePayload.kelas,
          mapel: scorePayload.mapel,
          skor: String(scorePayload.skor),
          benar: String(scorePayload.benar),
          salah: String(scorePayload.salah),
          kosong: String(scorePayload.kosong),
          pelanggaran_tab: String(scorePayload.pelanggaran_tab),
          attempt_id: scorePayload.attempt_id,
          exam_id: scorePayload.exam_id,
          selesai_at: scorePayload.selesai_at,
        });
        fetch(`${endpoint}?${q.toString()}`, { mode: 'no-cors' }).catch(() => {});
      }
    } catch (_) {}

    return attempt;
  },

  // Pull remote student attempts and scores from Google Spreadsheet
  async fetchRemoteReports(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return { success: false, count: 0, error: 'Endpoint Google Apps Script belum disetel.' };

      const resp = await fetch(`${endpoint}?action=getResults`, {
        method: 'GET',
      });
      if (!resp.ok) {
        return { success: false, count: 0, error: `Server merespons HTTP ${resp.status}` };
      }
      const data = await resp.json();
      if (!data || !Array.isArray(data.results)) {
        return { success: false, count: 0, error: data?.error || 'Format data nilai tidak valid' };
      }

      const existingAttempts = this.getAttempts();
      const students = this.getStudents();
      let importedCount = 0;

      interface RemoteScoreItem {
        nis?: string | number;
        mapel?: string;
        skor?: number | string;
        benar?: number | string;
        salah?: number | string;
        kosong?: number | string;
        pelanggaran_tab?: number | string;
        timestamp?: string;
        attempt_id?: string;
        exam_id?: string;
      }

      data.results.forEach((item: RemoteScoreItem) => {
        const sNis = String(item.nis || '').trim();
        if (!sNis) return;

        const matchedStudent = students.find((s) => s.nis === sNis);
        if (!matchedStudent || isDemoStudent({ nis: sNis })) return;
        const studentId = matchedStudent.student_id;
        const isMath = String(item.mapel || '').toLowerCase().includes('matematika');
        const examId = item.exam_id || (isMath ? 'exam_01' : 'exam_02');
        const attemptId = item.attempt_id || `att_remote_${sNis}_${examId}`;

        const existingIdx = existingAttempts.findIndex(
          (a) => a.student_id === studentId && a.exam_id === examId
        );

        const attemptObj: ExamAttempt = {
          attempt_id: attemptId,
          exam_id: examId,
          student_id: studentId,
          mulai_at: item.timestamp || new Date().toISOString(),
          batas_waktu_at: item.timestamp || new Date().toISOString(),
          selesai_at: item.timestamp || new Date().toISOString(),
          status: 'Submitted',
          skor: Number(item.skor || 0),
          benar: Number(item.benar || 0),
          salah: Number(item.salah || 0),
          kosong: Number(item.kosong || 0),
          pelanggaran_tab: Number(item.pelanggaran_tab || 0),
          jawaban: {},
          ragu_ragu: {},
        };

        if (existingIdx >= 0) {
          existingAttempts[existingIdx] = attemptObj;
        } else {
          existingAttempts.push(attemptObj);
        }
        importedCount++;
      });

      localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(existingAttempts));
      return { success: true, count: importedCount };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, count: 0, error: msg };
    }
  },

  // Reports compilation
  getReports(): ExamReport[] {
    const students = this.getStudents();
    const attempts = this.getAttempts();
    const settings = this.getSettings();

    return students.map((std) => {
      const mathAttempt = attempts.find(
        (a) => a.student_id === std.student_id && a.exam_id === 'exam_01' && a.status === 'Submitted'
      );
      const indoAttempt = attempts.find(
        (a) => a.student_id === std.student_id && a.exam_id === 'exam_02' && a.status === 'Submitted'
      );

      const mathScore = mathAttempt ? mathAttempt.skor : undefined;
      const indoScore = indoAttempt ? indoAttempt.skor : undefined;

      let sum = 0;
      let count = 0;
      if (mathScore !== undefined) {
        sum += mathScore;
        count++;
      }
      if (indoScore !== undefined) {
        sum += indoScore;
        count++;
      }
      const rataRata = count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
      const keterangan: 'Tuntas' | 'Belum Tuntas' | 'Belum Ujian' =
        count === 0 ? 'Belum Ujian' : rataRata >= settings.kkm ? 'Tuntas' : 'Belum Tuntas';

      return {
        student_id: std.student_id,
        nis: std.nis,
        nama: std.nama,
        kelas: std.kelas,
        nilai_matematika: mathScore,
        nilai_bahasa: indoScore,
        rata_rata: rataRata,
        keterangan,
        status_matematika: mathAttempt ? 'Selesai' : 'Belum Selesai',
        status_bahasa: indoAttempt ? 'Selesai' : 'Belum Selesai',
      };
    });
  },

  // CSV Exporter
  exportResultsCsv() {
    const reports = this.getReports();
    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Matematika',
      'Bahasa Indonesia',
      'Rata-rata',
      'Keterangan',
    ];

    const rows = reports.map((r, i) => [
      i + 1,
      r.nis,
      `"${r.nama.replace(/"/g, '""')}"`,
      r.kelas,
      r.nilai_matematika !== undefined ? r.nilai_matematika : '-',
      r.nilai_bahasa !== undefined ? r.nilai_bahasa : '-',
      r.rata_rata,
      r.keterangan,
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Nilai_CBT_TKA_SMPN2_Pulung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
