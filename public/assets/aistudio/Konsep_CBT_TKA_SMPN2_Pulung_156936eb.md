# Konsep Aplikasi CBT TKA Kelas IX --- SMP Negeri 2 Pulung

## 1. Gambaran Umum

**Nama aplikasi:** CBT TKA SMP Negeri 2 Pulung\
**Pengguna:** Siswa kelas IX dan guru/admin\
**Mata pelajaran tahap awal:** Matematika dan Bahasa Indonesia\
**Tujuan:** Menyelenggarakan latihan atau ujian TKA berbasis komputer,
mengelola bank soal, menyimpan jawaban, menghitung nilai otomatis, dan
merekap hasil siswa.

Aplikasi dibuat sederhana, ringan, responsif untuk laptop/komputer dan
ponsel, serta mudah dikelola oleh guru tanpa harus mengedit kode setiap
kali menambah soal.

## 2. Teknologi yang Digunakan

-   **Frontend:** HTML, CSS, JavaScript (atau React/Vite) yang di-deploy
    ke Vercel.
-   **Backend:** Google Apps Script (GAS) sebagai layanan API.
-   **Database:** Google Spreadsheet.
-   **Integrasi yang disarankan:** Frontend Vercel memanggil endpoint
    API pada Vercel Serverless Functions; fungsi tersebut meneruskan
    permintaan ke GAS dengan token rahasia. Ini membantu mengelola
    konfigurasi dan mengurangi masalah lintas-origin/CORS.
-   **Penyimpanan aset:** Gambar soal dapat memakai URL gambar publik
    yang stabil, misalnya dari Google Drive yang aksesnya diatur dengan
    benar.

> Catatan teknis: jangan menaruh token rahasia atau kunci admin di
> JavaScript frontend. Simpan konfigurasi rahasia di Vercel Environment
> Variables. Terapkan validasi dan otorisasi juga di backend, bukan
> hanya menyembunyikan tombol di frontend.

## 3. Jenis Pengguna

### A. Siswa

Siswa dapat: 1. Login menggunakan NIS/NISN atau ID siswa dan kode
akses/PIN yang ditentukan sekolah. 2. Melihat ujian yang tersedia. 3.
Memilih ujian Matematika atau Bahasa Indonesia. 4. Membaca petunjuk,
durasi, jumlah soal, dan aturan ujian. 5. Menjawab soal pilihan ganda.
6. Berpindah ke soal sebelumnya atau berikutnya. 7. Melihat panel nomor
soal dengan status: - Belum dijawab - Sudah dijawab - Nomor soal aktif
8. Menandai soal untuk ditinjau kembali (opsional). 9. Melihat sisa
waktu. 10. Mengakhiri dan mengirim ujian setelah konfirmasi. 11. Melihat
status ujian atau nilai jika guru mengizinkannya.

### B. Admin/Guru

Admin dapat: 1. Login dengan akun admin. 2. Melihat dashboard ringkas.
3. Menambah, mengubah, menghapus, mengaktifkan, atau menonaktifkan soal.
4. Memilih mata pelajaran dan topik soal. 5. Mengisi teks soal, pilihan
A--D, kunci jawaban, pembahasan (opsional), dan URL gambar (opsional).
6. Mengimpor data siswa dari Spreadsheet. 7. Membuat ujian dengan judul,
mata pelajaran, durasi, tanggal/jam mulai dan selesai, jumlah soal,
serta status aktif. 8. Mengatur apakah nilai boleh dilihat siswa. 9.
Melihat jawaban per siswa dan rekap nilai. 10. Memfilter hasil
berdasarkan ujian, kelas, mata pelajaran, atau siswa. 11. Mengunduh
hasil dalam CSV atau mengekspor melalui Google Spreadsheet. 12. Melihat
status pengerjaan: belum mulai, sedang mengerjakan, atau selesai.

## 4. Desain Halaman

### 4.1 Halaman Login Siswa

-   Logo/nama sekolah: **SMP Negeri 2 Pulung**
-   Judul: **CBT TKA Kelas IX**
-   Kolom ID siswa (NIS/NISN atau ID yang ditetapkan sekolah)
-   Kolom PIN/kode akses
-   Tombol **Masuk**
-   Pesan kesalahan yang jelas jika data tidak valid
-   Desain bersih, sederhana, dan ramah siswa

### 4.2 Beranda Siswa

-   Nama siswa dan kelas
-   Daftar ujian yang tersedia
-   Mata pelajaran, durasi, jumlah soal, jadwal, dan status ujian
-   Tombol **Mulai Ujian**
-   Konfirmasi sebelum ujian dimulai
-   Ujian yang sudah selesai tidak dapat dimulai kembali kecuali admin
    mengizinkan

### 4.3 Halaman Ujian

Mengikuti inspirasi tata letak dari gambar referensi: - Header: nama
sekolah, mata pelajaran, nama ujian, dan sisa waktu - Panel nomor soal
di sisi kiri untuk layar besar; dapat menjadi panel yang bisa
dibuka/tutup di layar kecil - Area utama berisi nomor dan teks soal -
Pilihan jawaban pilihan ganda A, B, C, D - Tombol **Sebelumnya** dan
**Berikutnya** - Tombol **Tandai untuk Ditinjau** (opsional) - Indikator
jumlah soal yang sudah dijawab - Tombol **Selesai dan Kirim** - Dialog
konfirmasi sebelum pengumpulan jawaban - Jawaban tersimpan otomatis
setelah dipilih; tampilkan indikator "Tersimpan" atau "Menyimpan..."

**Perilaku penting:** - Jawaban tetap tersimpan saat siswa berpindah
soal. - Jika koneksi terputus, aplikasi menampilkan peringatan dan
mencoba mengirim ulang jawaban saat koneksi pulih. - Timer mengikuti
waktu mulai dan batas waktu yang disimpan di server, bukan hanya jam di
browser. - Setelah waktu habis, backend menutup ujian dan menilai
jawaban yang sudah tersimpan. - Jangan menampilkan kunci jawaban atau
pembahasan sebelum ujian ditutup dan kebijakan hasil mengizinkannya.

### 4.4 Dashboard Admin

Menu sederhana: - **Dashboard** - **Data Siswa** - **Bank Soal** -
**Ujian** - **Hasil dan Rekap** - **Pengaturan**

Ringkasan dashboard: - Jumlah siswa - Jumlah soal aktif per mata
pelajaran - Jumlah ujian - Jumlah siswa yang sudah menyelesaikan ujian

### 4.5 Halaman Bank Soal

Form soal: - Mata pelajaran: Matematika / Bahasa Indonesia -
Topik/materi - Teks soal - URL gambar soal (opsional) - Pilihan A, B, C,
D - Kunci jawaban - Pembahasan (opsional) - Status aktif/nonaktif -
Tombol Simpan dan Batal

Sediakan tabel daftar soal dengan pencarian dan filter mata
pelajaran/topik. Untuk versi pertama, input manual sudah cukup; impor
soal dari CSV dapat ditambahkan kemudian.

### 4.6 Halaman Hasil Ujian

Tampilkan: - Nama dan ID siswa - Kelas - Nama ujian dan mata pelajaran -
Jumlah benar, salah, dan kosong - Nilai - Waktu mulai, waktu selesai,
dan status

Tambahkan filter kelas/ujian dan tombol **Ekspor CSV**. Pastikan nilai
yang ditampilkan merupakan hasil perhitungan backend.

## 5. Struktur Google Spreadsheet

Buat satu Google Spreadsheet dengan lembar berikut.

### Sheet `Siswa`

  Kolom        Keterangan
  ------------ --------------------------------------
  student_id   ID unik siswa
  nis          NIS/NISN atau ID sekolah
  nama         Nama siswa
  kelas        Contoh: IX-A
  pin_hash     Hash PIN, bukan PIN dalam teks biasa
  aktif        TRUE/FALSE

### Sheet `Soal`

  Kolom         Keterangan
  ------------- ------------------------------------
  question_id   ID unik soal
  mapel         Matematika / Bahasa Indonesia
  topik         Topik/materi
  teks_soal     Isi soal
  gambar_url    URL gambar, boleh kosong
  opsi_a        Pilihan A
  opsi_b        Pilihan B
  opsi_c        Pilihan C
  opsi_d        Pilihan D
  kunci         A/B/C/D; hanya untuk backend/admin
  pembahasan    Opsional
  aktif         TRUE/FALSE

### Sheet `Ujian`

  Kolom             Keterangan
  ----------------- -------------------------------
  exam_id           ID unik ujian
  judul             Nama ujian
  mapel             Matematika / Bahasa Indonesia
  durasi_menit      Durasi ujian
  mulai_at          Waktu mulai
  selesai_at        Batas waktu
  jumlah_soal       Jumlah soal
  acak_soal         TRUE/FALSE
  acak_opsi         TRUE/FALSE
  tampilkan_nilai   TRUE/FALSE
  status            Draft / Aktif / Selesai

### Sheet `PaketSoal`

Digunakan untuk menentukan soal yang masuk ke setiap ujian. \| Kolom \|
Keterangan \| \|---\|---\| \| exam_id \| ID ujian \| \| question_id \|
ID soal \| \| urutan \| Urutan soal \|

### Sheet `SesiUjian`

  Kolom            Keterangan
  ---------------- -----------------------------------
  attempt_id       ID pengerjaan unik
  exam_id          ID ujian
  student_id       ID siswa
  mulai_at         Waktu mulai dari server
  batas_waktu_at   Waktu akhir pengerjaan
  selesai_at       Waktu pengumpulan
  status           In Progress / Submitted / Expired
  skor             Nilai akhir

Buat aturan unik agar satu siswa hanya mempunyai satu sesi untuk satu
ujian, kecuali admin secara eksplisit mengizinkan percobaan ulang.

### Sheet `Jawaban`

  Kolom         Keterangan
  ------------- ---------------------------------
  attempt_id    ID sesi ujian
  question_id   ID soal
  jawaban       A/B/C/D atau kosong
  updated_at    Waktu jawaban terakhir disimpan

### Sheet `Rekap`

Dapat diisi oleh backend setelah ujian selesai atau dibentuk sebagai
laporan dari data sesi dan jawaban. Kolom yang disarankan: ID ujian, ID
siswa, nama, kelas, mapel, benar, salah, kosong, skor, waktu mulai,
waktu selesai, status.

## 6. Aturan Penilaian

Untuk versi awal: - Setiap jawaban benar bernilai sama. - Jawaban salah
atau kosong bernilai 0. - Nilai skala 0--100 dihitung dengan rumus:

`Nilai = (Jumlah jawaban benar / Jumlah soal yang dinilai) × 100`

-   Pembulatan nilai ditetapkan konsisten, misalnya dua angka desimal.
-   Kunci jawaban hanya boleh dibaca backend dan admin berwenang.
-   Siswa tidak boleh mengubah skor atau status ujian melalui browser.
-   Jika sekolah memakai bobot atau aturan penilaian khusus, aturan itu
    perlu disepakati sebelum implementasi.

## 7. Alur Aplikasi

### Alur siswa

1.  Siswa membuka URL CBT.
2.  Login dengan ID dan PIN.
3.  Backend memverifikasi identitas serta status siswa.
4.  Siswa memilih ujian yang tersedia.
5.  Backend membuat atau melanjutkan sesi yang sah.
6.  Soal dikirim tanpa kunci jawaban.
7.  Siswa memilih jawaban; aplikasi menyimpan jawaban ke backend.
8.  Siswa mengirim ujian atau waktu habis.
9.  Backend mengunci sesi, menghitung skor, dan menyimpan hasil.
10. Siswa melihat status atau nilai sesuai pengaturan admin.

### Alur guru/admin

1.  Admin login.
2.  Mengelola data siswa.
3.  Membuat bank soal untuk Matematika dan Bahasa Indonesia.
4.  Menyusun ujian dan memilih soal.
5.  Mengaktifkan ujian.
6.  Memantau status pengerjaan.
7.  Melihat rekap dan mengekspor hasil.

## 8. Rancangan Endpoint API

Frontend tidak boleh mengakses spreadsheet secara langsung. Semua
operasi harus melalui backend.

Contoh endpoint pada Vercel: - `POST /api/auth/student-login` -
`POST /api/auth/admin-login` - `GET /api/student/exams` -
`POST /api/exam/start` - `GET /api/exam/questions` -
`POST /api/exam/save-answer` - `POST /api/exam/submit` -
`GET /api/admin/dashboard` - `GET /api/admin/students` -
`POST /api/admin/students` - `GET /api/admin/questions` -
`POST /api/admin/questions` - `PUT /api/admin/questions/:id` -
`DELETE /api/admin/questions/:id` - `POST /api/admin/exams` -
`GET /api/admin/results` - `GET /api/admin/results/export`

Daftar tersebut merupakan rancangan, bukan endpoint yang sudah aktif.
Semua endpoint admin wajib memeriksa sesi/otorisasi admin. Endpoint
siswa wajib memeriksa kepemilikan sesi ujian.

## 9. Keamanan dan Keandalan

1.  Jangan pernah mengirim kunci jawaban ke browser siswa.
2.  Jangan menyimpan password atau PIN dalam teks biasa; gunakan hash
    dan mekanisme verifikasi yang sesuai.
3.  Simpan rahasia integrasi di Vercel Environment Variables.
4.  Validasi input di backend dan batasi akses berdasarkan peran.
5.  Gunakan token sesi yang aman, kedaluwarsa, dan tidak mudah ditebak.
6.  Batasi percobaan login dan validasi akses untuk mencegah
    penyalahgunaan.
7.  Gunakan `LockService` di GAS untuk operasi tulis penting agar
    benturan penulisan berkurang.
8.  Simpan waktu mulai dan batas waktu ujian di server.
9.  Siapkan cadangan Spreadsheet secara berkala.
10. Uji aplikasi dengan beberapa akun siswa secara bersamaan sebelum
    dipakai untuk ujian resmi.
11. Google Apps Script dan Google Sheets memiliki batas kuota dan
    performa. Untuk ujian serentak berskala besar, lakukan uji beban
    terlebih dahulu; pertimbangkan database khusus jika kapasitasnya
    tidak mencukupi.
12. Terapkan kebijakan privasi data siswa dan batasi akses rekap hanya
    untuk petugas yang berwenang.

## 10. Tahapan Pembuatan

### Tahap 1 --- MVP

-   Login siswa dan admin
-   Data siswa
-   Bank soal pilihan ganda
-   Ujian Matematika dan Bahasa Indonesia
-   Timer dan navigasi nomor soal
-   Simpan jawaban otomatis
-   Pengumpulan dan penilaian otomatis
-   Rekap hasil sederhana

### Tahap 2 --- Penyempurnaan

-   Impor siswa dari CSV
-   Impor bank soal dari CSV
-   Acak urutan soal dan opsi
-   Tandai soal untuk ditinjau
-   Ekspor rekap ke CSV
-   Riwayat pengerjaan dan pembukaan ulang oleh admin

### Tahap 3 --- Setelah uji coba

-   Analisis hasil per topik
-   Grafik rekap kelas
-   Pengaturan beberapa sesi ujian
-   Peningkatan kapasitas sesuai hasil pengujian

## 11. Kriteria Selesai

Aplikasi MVP dianggap siap untuk uji coba jika: - Siswa hanya dapat
membuka ujian yang diizinkan. - Admin dapat membuat dan mengedit soal
Matematika serta Bahasa Indonesia. - Soal tampil dalam format pilihan
ganda yang jelas. - Jawaban tersimpan dan tetap ada ketika siswa
berpindah soal. - Timer dan batas waktu diperiksa di server. - Ujian
dapat dikirim dan nilai dihitung otomatis. - Rekap dapat difilter dan
diekspor. - Kunci jawaban tidak bocor ke halaman siswa. - Aplikasi telah
diuji pada komputer, ponsel, dan koneksi yang tidak stabil.

------------------------------------------------------------------------

# Prompt Siap Pakai untuk AI Coding

Salin prompt berikut ke AI coding yang Anda gunakan. Lampirkan juga
gambar referensi tampilan TKA.

> Buat aplikasi web **CBT TKA Kelas IX SMP Negeri 2 Pulung** dengan
> tampilan sederhana, modern, responsif, dan mudah digunakan. Referensi
> halaman ujian adalah gambar yang saya lampirkan: area soal di
> tengah/kanan, navigasi nomor soal di sisi kiri, pilihan ganda
> berbentuk opsi yang dapat dipilih, timer, serta tombol sebelumnya,
> berikutnya, dan selesai.
>
> **Teknologi wajib:** - Frontend: React + Vite (atau struktur frontend
> yang kompatibel dengan Vercel). - Hosting frontend: Vercel. - Backend
> utama: Google Apps Script sebagai API. - Database: Google
> Spreadsheet. - Gunakan Vercel Serverless Functions sebagai proxy/API
> layer untuk meneruskan permintaan ke GAS jika diperlukan; URL GAS dan
> token rahasia disimpan dalam environment variables, tidak ditulis di
> kode frontend.
>
> **Buat dua area utama:**
>
> **1. Area siswa** - Login menggunakan ID siswa dan PIN. - Beranda
> menampilkan nama siswa, kelas, dan ujian yang tersedia. - Mata
> pelajaran: Matematika dan Bahasa Indonesia. - Sebelum mulai, tampilkan
> petunjuk, durasi, jumlah soal, dan konfirmasi mulai. - Halaman ujian
> memiliki timer, nomor soal, panel navigasi soal, teks soal, pilihan
> A/B/C/D, tombol sebelumnya/berikutnya, indikator soal terjawab, dan
> tombol selesai. - Dukung teks dan gambar pada soal. - Simpan jawaban
> ke backend setiap kali siswa menjawab, dengan indikator status
> penyimpanan. - Setelah selesai, tampilkan konfirmasi pengumpulan. -
> Siswa tidak boleh menerima kunci jawaban dari API. - Nilai hanya
> ditampilkan jika admin mengaktifkan pengaturan tersebut.
>
> **2. Area admin/guru** - Login admin yang aman. - Dashboard berisi
> ringkasan jumlah siswa, soal, ujian, dan pengerjaan. - CRUD data
> siswa. - CRUD bank soal: mapel, topik, teks soal, URL gambar opsional,
> opsi A-D, kunci jawaban, pembahasan opsional, dan status aktif. - CRUD
> ujian: judul, mata pelajaran, durasi, jadwal, jumlah soal, pemilihan
> soal, pengacakan, dan izin menampilkan nilai. - Halaman hasil yang
> menampilkan nama, kelas, jumlah benar/salah/kosong, nilai, waktu
> mulai/selesai, dan status. - Filter berdasarkan kelas, ujian, mapel,
> dan siswa. - Ekspor hasil ke CSV.
>
> **Google Spreadsheet:** Buat panduan setup satu Spreadsheet dengan
> sheet `Siswa`, `Soal`, `Ujian`, `PaketSoal`, `SesiUjian`, `Jawaban`,
> dan `Rekap`. Sediakan kode Google Apps Script untuk membaca dan
> menulis data pada sheet tersebut.
>
> **Keamanan dan logika:** - Validasi identitas dan peran di backend. -
> Jangan menyimpan PIN/password dalam teks biasa. - Jangan pernah
> mengirim kunci jawaban ke frontend siswa. - Timer dihitung dari waktu
> server dan batas waktu tersimpan di backend. - Satu siswa hanya boleh
> mempunyai satu sesi aktif untuk satu ujian kecuali admin mengizinkan
> percobaan ulang. - Jawaban yang sudah tersimpan tidak hilang saat
> berpindah nomor atau memuat ulang halaman. - Ketika ujian dikirim atau
> waktu habis, backend mengunci sesi dan menghitung nilai otomatis. -
> Gunakan penanganan error, validasi input, dan `LockService` untuk
> operasi tulis penting di GAS.
>
> **Desain:** - Gunakan Bahasa Indonesia untuk seluruh antarmuka. -
> Warna dominan biru dan putih, tipografi mudah dibaca, tombol jelas,
> dan jarak antarelemen nyaman. - Tampilan ujian harus fokus pada soal,
> tidak ramai, serta menyesuaikan ukuran layar. - Berikan indikator soal
> aktif, terjawab, dan belum dijawab. - Jangan membuat tombol dekoratif
> yang tidak berfungsi.
>
> **Cara memberikan hasil:** 1. Tampilkan struktur folder proyek. 2.
> Buat kode lengkap frontend. 3. Buat kode Google Apps Script lengkap.
> 4. Buat kode Vercel API/proxy beserta contoh konfigurasi environment
> variables. 5. Buat template struktur Google Spreadsheet dan petunjuk
> pengisian awal. 6. Buat `.env.example` tanpa rahasia sungguhan. 7.
> Berikan panduan deployment langkah demi langkah ke Google Apps Script
> dan Vercel. 8. Sertakan data contoh untuk menguji soal Matematika dan
> Bahasa Indonesia. 9. Jangan mengklaim aplikasi sudah terhubung atau
> siap produksi sebelum pengujian dilakukan. 10. Bangun MVP yang
> benar-benar berfungsi terlebih dahulu, lalu jelaskan fitur lanjutan
> secara terpisah.

## 12. Saran Implementasi

Mulailah dari MVP dengan satu ujian percobaan dan beberapa akun siswa.
Uji alur login, penyimpanan jawaban, batas waktu, penilaian, serta rekap
sebelum digunakan oleh seluruh siswa kelas IX. Pastikan juga jumlah
peserta serentak sesuai dengan kemampuan kuota GAS dan Spreadsheet.
