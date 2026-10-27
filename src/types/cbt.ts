/**
 * Types definition for CBT TKA SMP Negeri 2 Pulung
 */

export type Role = 'student' | 'admin';

export type CognitiveLevel = 'C1' | 'C2' | 'C3';

export type Subject = 'Matematika' | 'Bahasa Indonesia';

export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface Student {
  student_id: string;
  nis: string;
  nama: string;
  kelas: string; // e.g. '9A', '9B', '9C', '9D', '9E'
  pin: string;
  aktif: boolean;
  ruang?: string;
  sesi?: string;
}

export interface Question {
  question_id: string;
  mapel: Subject;
  topik: string;
  level: CognitiveLevel; // C1 (Mengingat/Memahami), C2 (Menerapkan), C3 (Menganalisis/Penalaran)
  teks_soal: string;
  gambar_url?: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  kunci: OptionKey; // Only exposed to admin/grading engine
  pembahasan?: string;
  aktif: boolean;
}

export interface Exam {
  exam_id: string;
  judul: string;
  mapel: Subject;
  durasi_menit: number;
  mulai_at: string; // '2025-06-20 08:00'
  selesai_at: string; // '2025-06-20 10:00'
  jumlah_soal: number;
  acak_soal: boolean;
  acak_opsi: boolean;
  tampilkan_nilai: boolean;
  status: 'Belum Dimulai' | 'Sedang Berlangsung' | 'Selesai';
  tahun_pelajaran: string; // '2025/2026'
  question_ids: string[];
}

export interface ExamAttempt {
  attempt_id: string;
  exam_id: string;
  student_id: string;
  mulai_at: string; // ISO string
  batas_waktu_at: string; // ISO string
  selesai_at?: string; // ISO string
  status: 'In Progress' | 'Submitted' | 'Expired';
  skor?: number; // 0 - 100
  benar?: number;
  salah?: number;
  kosong?: number;
  // Map question_id -> chosen option
  jawaban: Record<string, OptionKey | ''>;
  // Map question_id -> is flagged/ragu-ragu
  ragu_ragu: Record<string, boolean>;
}

export interface ExamReport {
  student_id: string;
  nis: string;
  nama: string;
  kelas: string;
  nilai_matematika?: number;
  nilai_bahasa?: number;
  rata_rata: number;
  keterangan: 'Tuntas' | 'Belum Tuntas' | 'Belum Ujian';
  status_matematika: 'Belum Selesai' | 'Selesai';
  status_bahasa: 'Belum Selesai' | 'Selesai';
}

export interface AdminUser {
  admin_id: string;
  username: string;
  nama: string;
  role: 'Guru' | 'Proktor' | 'Admin';
}
