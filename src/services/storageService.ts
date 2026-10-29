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

    // Auto-sync to Google Spreadsheet in background
    this.syncSingleQuestion(question).catch(() => {});
  },

  deleteQuestion(questionId: string) {
    const list = this.getQuestions().filter((q) => q.question_id !== questionId);
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(list));

    // Auto-delete from Google Spreadsheet in background
    this.deleteRemoteQuestion(questionId).catch(() => {});
  },

  // Pull remote questions from Google Spreadsheet (so student phones update automatically)
  async fetchRemoteQuestions(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const settings = this.getSettings();
      const endpoint = settings.gasApiUrl || OFFICIAL_GAS_API_URL;
      if (!endpoint) return { success: false, count: 0, error: 'Endpoint belum disetel.' };

      const resp = await fetch(`${endpoint}?action=getQuestions`);
      if (!resp.ok) return { success: false, count: 0, error: `HTTP ${resp.status}` };
      const data = await resp.json();
      if (data && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(data.questions));
        return { success: true, count: data.questions.length };
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
      const list = questionsToUpload || this.getQuestions();
      if (!endpoint) return { success: false, message: 'Endpoint belum disetel.' };

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
  async deleteRemoteQuestion(questionId: string): Promise<void> {
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
          const mapel = remote.mapel || (remote.judul?.toLowerCase().includes('matematika') ? 'Matematika' : 'Bahasa Indonesia');
          if (seenMapel.has(mapel)) continue;
          seenMapel.add(mapel);

          const localMatch = localExams.find((l) => l.mapel === mapel || l.exam_id === remote.exam_id);
          const qIds = allQuestions.filter((q) => q.mapel === mapel && q.aktif).map((q) => q.question_id);

          finalExams.push({
            exam_id: remote.exam_id || localMatch?.exam_id || (mapel === 'Matematika' ? 'exam_01' : 'exam_02'),
            judul: remote.judul || localMatch?.judul || `TKA ${mapel} Kelas IX`,
            mapel: mapel,
            durasi_menit: Number(remote.durasi_menit || localMatch?.durasi_menit || 90),
            mulai_at: remote.mulai_at || localMatch?.mulai_at || '08:00',
            selesai_at: remote.selesai_at || localMatch?.selesai_at || '10:00',
            jumlah_soal: Number(remote.jumlah_soal || localMatch?.jumlah_soal || 40),
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
    // Limit to exam.jumlah_soal if specified
    if (exam.jumlah_soal && examQuestions.length > exam.jumlah_soal) {
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
