/**
 * Storage & CBT Business Logic Service for SMP Negeri 2 Pulung
 * Provides persistent local state, realistic evaluations, server-clock simulation, and export utilities.
 */

import { Student, Question, Exam, ExamAttempt, ExamReport, OptionKey } from '../types/cbt';
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
  namaProktor: 'BUDI SANTOSO, S.Pd.',
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
    if (!localStorage.getItem(KEYS.QUESTIONS)) {
      localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
    }
    if (!localStorage.getItem(KEYS.EXAMS)) {
      localStorage.setItem(KEYS.EXAMS, JSON.stringify(INITIAL_EXAMS));
    }
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
    };
  },

  saveSettings(settings: AppSettings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
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
    return safeParse<Question[]>(localStorage.getItem(KEYS.QUESTIONS), INITIAL_QUESTIONS);
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
  },

  deleteQuestion(questionId: string) {
    const list = this.getQuestions().filter((q) => q.question_id !== questionId);
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(list));
  },

  // Exams
  getExams(): Exam[] {
    this.init();
    return safeParse<Exam[]>(localStorage.getItem(KEYS.EXAMS), INITIAL_EXAMS);
  },

  saveExam(exam: Exam) {
    const list = this.getExams();
    const idx = list.findIndex((e) => e.exam_id === exam.exam_id);
    if (idx >= 0) {
      list[idx] = exam;
    } else {
      list.push(exam);
    }
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(list));
  },

  deleteExam(examId: string) {
    const list = this.getExams().filter((e) => e.exam_id !== examId);
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(list));
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

    let attempt = this.getStudentAttempt(studentId, examId);
    if (!attempt) {
      const now = new Date();
      const endTime = new Date(now.getTime() + exam.durasi_menit * 60 * 1000);
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

    // Async submit to Google Sheets
    this.syncToGas({
      action: 'submitExam',
      attempt_id: attempt.attempt_id,
      exam_id: attempt.exam_id,
      student_id: attempt.student_id,
    });

    return attempt;
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
