/**
 * Full Google Apps Script (Code.gs) implementation and Google Sheets schema specification
 * for CBT TKA SMP Negeri 2 Pulung.
 */

export const GAS_SCRIPT_CODE = `/**
 * ============================================================
 * CBT TKA KELAS IX - SMP NEGERI 2 PULUNG
 * Google Apps Script Backend API & Automatic Database Setup
 * ============================================================
 * FITUR UTAMA:
 * 1. setupOtomatisDatabase() : Sekali klik untuk OTOMATIS membuat Folder di Google Drive,
 *    Google Spreadsheet, dan 7 Sheet lengkap dengan Header berwarna & rumus.
 * 2. doGet() & doPost()      : API Web App untuk sinkronisasi nilai dan pengerjaan CBT siswa.
 *
 * CARA MENGGUNAKAN:
 * 1. Buka browser: https://script.google.com/home/start
 * 2. Klik "Project Baru" (New project)
 * 3. Hapus semua kode bawaan, tempelkan SELURUH KODE di file ini.
 * 4. Pada pilihan fungsi di toolbar atas (sebelah tombol "Jalankan"), pilih:
 *    "setupOtomatisDatabase", lalu klik tombol "Jalankan" (Run).
 * 5. Berikan izin otorisasi akun Google Anda jika diminta (Pemberian Izin > Lanjutan > Buka... > Izinkan).
 * 6. Buka Google Drive Anda, folder "CBT SMPN 2 PULUNG" & Spreadsheet sudah otomatis terbuat!
 * 7. Terakhir, klik "Deploy" > "New deployment" > jenis "Web app"
 *    - Execute as: "Me" (email Anda)
 *    - Who has access: "Anyone" (Siapa saja)
 * 8. Salin URL Web App dan tempelkan di menu "Integrasi Spreadsheet" pada CBT ini!
 */

// Konfigurasi nama-nama sheet
const SHEETS = {
  SISWA: 'Siswa',
  SOAL: 'Soal',
  UJIAN: 'Ujian',
  PAKET: 'PaketSoal',
  SESI: 'SesiUjian',
  JAWABAN: 'Jawaban',
  REKAP: 'Rekap'
};

/**
 * ============================================================
 * FUNGSI 1: SETUP OTOMATIS GOOGLE DRIVE & SPREADSHEET
 * Jalankan fungsi ini SEKALI di editor Google Apps Script!
 * Guru/Proktor TIDAK PERLU membuat kolom manual satu per satu.
 * ============================================================
 */
function setupOtomatisDatabase() {
  Logger.log("=== MEMULAI SETUP OTOMATIS CBT SMPN 2 PULUNG ===");
  
  // 1. Buat / Dapatkan folder di Google Drive
  const folderName = "CBT SMPN 2 PULUNG";
  let targetFolder;
  const existingFolders = DriveApp.getFoldersByName(folderName);
  if (existingFolders.hasNext()) {
    targetFolder = existingFolders.next();
    Logger.log("Menggunakan folder yang sudah ada: " + targetFolder.getName());
  } else {
    targetFolder = DriveApp.createFolder(folderName);
    Logger.log("Folder baru berhasil dibuat di Google Drive: " + folderName);
  }

  // 2. Buat Google Spreadsheet baru
  const ssName = "DATABASE_CBT_SMPN2_PULUNG";
  const ss = SpreadsheetApp.create(ssName);
  const ssFile = DriveApp.getFileById(ss.getId());
  
  // Pindahkan spreadsheet ke dalam folder CBT
  targetFolder.addFile(ssFile);
  DriveApp.getRootFolder().removeFile(ssFile);
  Logger.log("Spreadsheet berhasil dibuat dan disimpan di folder: " + targetFolder.getName());

  // 3. Simpan SPREADSHEET_ID ke Script Properties agar Web App otomatis terhubung
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  PropertiesService.getScriptProperties().setProperty('API_SECRET_TOKEN', 'cbt-smpn2pulung-secret-2025');

  // 4. Struktur 7 Sheet lengkap dengan Header dan contoh data kelas 9A-9E
  const schema = [
    {
      name: SHEETS.SISWA,
      headers: ['student_id', 'nis', 'nama', 'kelas', 'pin_hash', 'aktif', 'ruang', 'sesi'],
      sample: []
    },
    {
      name: SHEETS.SOAL,
      headers: ['question_id', 'mapel', 'topik', 'teks_soal', 'gambar_url', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'kunci', 'pembahasan', 'aktif'],
      sample: [
        ['q_m_01', 'Matematika', 'Operasi Bilangan', 'Hasil dari (-12) x 5 + (-20) : 4 adalah...', '', '-65', '-55', '-45', '-35', 'A', '(-12)*5 = -60, (-20)/4 = -5. -60 + (-5) = -65', true],
        ['q_b_01', 'Bahasa Indonesia', 'Ide Pokok Paragraf', 'Gagasan utama yang mendasari suatu paragraf disebut...', '', 'Gagasan pendukung', 'Ide pokok', 'Kalimat penjelas', 'Kesimpulan', 'B', 'Ide pokok merupakan gagasan inti yang menjadi dasar pengembangan paragraf.', true]
      ]
    },
    {
      name: SHEETS.UJIAN,
      headers: ['exam_id', 'judul', 'mapel', 'durasi_menit', 'mulai_at', 'selesai_at', 'jumlah_soal', 'acak_soal', 'acak_opsi', 'tampilkan_nilai', 'status'],
      sample: [
        ['exam_math_01', 'TKA Matematika Kelas IX - SMPN 2 Pulung', 'Matematika', 90, '', '', 40, true, true, false, 'Sedang Berlangsung'],
        ['exam_indo_01', 'TKA Bahasa Indonesia Kelas IX - SMPN 2 Pulung', 'Bahasa Indonesia', 90, '', '', 40, true, true, false, 'Sedang Berlangsung']
      ]
    },
    {
      name: SHEETS.PAKET,
      headers: ['exam_id', 'question_id', 'urutan'],
      sample: [
        ['exam_math_01', 'q_m_01', 1],
        ['exam_indo_01', 'q_b_01', 1]
      ]
    },
    {
      name: SHEETS.SESI,
      headers: ['attempt_id', 'exam_id', 'student_id', 'mulai_at', 'batas_waktu_at', 'selesai_at', 'status', 'skor'],
      sample: []
    },
    {
      name: SHEETS.JAWABAN,
      headers: ['attempt_id', 'question_id', 'jawaban', 'updated_at'],
      sample: []
    },
    {
      name: SHEETS.REKAP,
      headers: ['student_id', 'nis', 'nama', 'kelas', 'skor_matematika', 'skor_bahasa', 'rata_rata', 'keterangan'],
      sample: []
    }
  ];

  // 5. Generate setiap sheet dengan header ber-styling biru profesional & auto freeze
  schema.forEach(function(item, index) {
    let sheet;
    if (index === 0) {
      sheet = ss.getActiveSheet();
      sheet.setName(item.name);
    } else {
      sheet = ss.insertSheet(item.name);
    }

    // Set Header Styling: Background Navy Blue (#0369a1), teks putih tebal
    const headerRange = sheet.getRange(1, 1, 1, item.headers.length);
    headerRange.setValues([item.headers]);
    headerRange.setBackground("#0369a1");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    // Masukkan data contoh awal jika ada
    if (item.sample && item.sample.length > 0) {
      sheet.getRange(2, 1, item.sample.length, item.sample[0].length).setValues(item.sample);
    }

    // Auto-fit kolom agar nyaman dibaca guru
    for (let c = 1; c <= item.headers.length; c++) {
      sheet.autoResizeColumn(c);
    }
  });

  Logger.log("=== SETUP SELESAI DENGAN SUKSES! ===");
  Logger.log("Folder Google Drive : " + targetFolder.getUrl());
  Logger.log("Google Spreadsheet  : " + ss.getUrl());
  Logger.log("Spreadsheet ID      : " + ss.getId());
  
  return {
    success: true,
    folderUrl: targetFolder.getUrl(),
    spreadsheetUrl: ss.getUrl(),
    spreadsheetId: ss.getId()
  };
}

/**
 * Helper untuk mendapatkan Spreadsheet (baik jika script berdiri sendiri maupun terikat)
 */
function getDbSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    // Berjalan sebagai Standalone Script
  }
  const ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (ssId) {
    return SpreadsheetApp.openById(ssId);
  }
  throw new Error("Spreadsheet belum dibuat. Silakan jalankan fungsi setupOtomatisDatabase() terlebih dahulu!");
}

function getSecretToken() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('API_SECRET_TOKEN') || 'cbt-smpn2pulung-secret-2025';
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'ping';
    const token = params.token || '';

    // Optional token validation for protected read routes
    if (action === 'getQuestionsAdmin' || action === 'getAdminDashboard') {
      if (token !== getSecretToken()) {
        return createJsonResponse({ success: false, message: 'Akses ditolak: Token tidak valid.' }, 403);
      }
    }

    if (action === 'ping') {
      return createJsonResponse({ success: true, message: 'CBT TKA SMPN 2 Pulung GAS API Aktif!', timestamp: new Date().toISOString() });
    }

    if (action === 'getExams') {
      return getExamsHandler();
    }

    if (action === 'getQuestions') {
      return getQuestionsHandler();
    }

    if (action === 'deleteQuestion') {
      return deleteQuestionHandler(params.question_id);
    }

    if (action === 'getExamQuestionsForStudent') {
      const examId = params.exam_id;
      return getExamQuestionsForStudentHandler(examId);
    }

    if (action === 'getStudents') {
      return getStudentsHandler();
    }

    if (action === 'recordScore') {
      return recordScoreHandler(params);
    }

    if (action === 'getResults') {
      return getResultsHandler();
    }

    return createJsonResponse({ success: false, message: 'Action GET tidak dikenali.' }, 400);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() }, 500);
  }
}

/**
 * Handle HTTP POST Requests with LockService concurrency control
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Acquire lock for up to 10 seconds to prevent concurrent write collisions in Google Sheets
    lock.waitLock(10000);

    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = {};
      }
    }
    const action = data.action || '';

    if (action === 'syncQuestions') {
      return syncQuestionsHandler(data);
    }

    if (action === 'saveQuestion') {
      return saveQuestionHandler(data.question);
    }

    if (action === 'deleteQuestion') {
      return deleteQuestionHandler(data.question_id);
    }

    if (action === 'syncExams') {
      return syncExamsHandler(data);
    }

    if (action === 'saveExam') {
      return saveExamHandler(data.exam);
    }

    if (action === 'studentLogin') {
      return studentLoginHandler(data);
    }

    if (action === 'recordScore') {
      return recordScoreHandler(data);
    }

    if (action === 'startExam') {
      return startExamHandler(data);
    }

    if (action === 'saveAnswer') {
      return saveAnswerHandler(data);
    }

    if (action === 'submitExam') {
      return submitExamHandler(data);
    }

    if (action === 'syncStudents') {
      return syncStudentsHandler(data);
    }

    if (action === 'adminLogin') {
      return adminLoginHandler(data);
    }

    return createJsonResponse({ success: false, message: 'Action POST tidak dikenali.' }, 400);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

// -------------------------------------------------------------
// HANDLERS
// -------------------------------------------------------------

function getStudentsHandler() {
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SISWA);
  if (!sheet) {
    return createJsonResponse({ success: false, message: 'Sheet Siswa tidak ditemukan.' });
  }

  const rows = sheet.getDataRange().getValues();
  const students = [];
  // Header baris 1: student_id | nis | nama | kelas | pin_hash | aktif | ruang | sesi
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sNis = String(row[1] || '').trim();
    if (!sNis) continue;

    students.push({
      student_id: String(row[0] || ('std_' + sNis)),
      nis: sNis,
      nama: String(row[2] || '').trim(),
      kelas: String(row[3] || '9A').trim(),
      pin: String(row[4] || '12345').trim(),
      aktif: row[5] !== false && String(row[5]).toUpperCase() !== 'FALSE',
      ruang: row[6] ? String(row[6]).trim() : '',
      sesi: row[7] ? String(row[7]).trim() : ''
    });
  }

  return createJsonResponse({
    success: true,
    total: students.length,
    students: students
  });
}

function syncStudentsHandler(data) {
  const incoming = data.students || [];
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return createJsonResponse({ success: false, message: 'Data siswa kosong atau tidak valid.' });
  }

  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SISWA);
  if (!sheet) {
    return createJsonResponse({ success: false, message: 'Sheet Siswa tidak ditemukan.' });
  }

  const existingRows = sheet.getDataRange().getValues();
  const nisRowMap = {};
  for (let i = 1; i < existingRows.length; i++) {
    nisRowMap[String(existingRows[i][1]).trim()] = i + 1; // 1-indexed row number
  }

  let updatedCount = 0;
  let addedCount = 0;

  incoming.forEach(function(s) {
    const sNis = String(s.nis || '').trim();
    if (!sNis) return;
    const rowData = [
      s.student_id || ('std_' + sNis),
      sNis,
      s.nama || '',
      s.kelas || '9A',
      s.pin || '12345',
      s.aktif !== false,
      s.ruang || '',
      s.sesi || ''
    ];

    if (nisRowMap[sNis]) {
      sheet.getRange(nisRowMap[sNis], 1, 1, rowData.length).setValues([rowData]);
      updatedCount++;
    } else {
      sheet.appendRow(rowData);
      addedCount++;
    }
  });

  return createJsonResponse({
    success: true,
    message: 'Sinkronisasi berhasil! ' + addedCount + ' siswa baru ditambahkan, ' + updatedCount + ' data siswa diperbarui.'
  });
}

function studentLoginHandler(data) {
  const nis = String(data.nis || '').trim();
  const pin = String(data.pin || '').trim();

  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SISWA);
  const rows = sheet.getDataRange().getValues();

  // Header baris 1: student_id | nis | nama | kelas | pin_hash | aktif | ruang | sesi
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNis = String(row[1]).trim();
    const rowPin = String(row[4]).trim();
    const aktif = Boolean(row[5]);

    if (rowNis === nis && rowPin === pin) {
      if (!aktif) {
        return createJsonResponse({ success: false, message: 'Akun siswa sedang dinonaktifkan oleh sekolah.' });
      }
      return createJsonResponse({
        success: true,
        student: {
          student_id: row[0],
          nis: row[1],
          nama: row[2],
          kelas: row[3],
          ruang: row[6] ? String(row[6]).trim() : undefined,
          sesi: row[7] ? String(row[7]).trim() : undefined
        }
      });
    }
  }

  return createJsonResponse({ success: false, message: 'NIS atau PIN yang Anda masukkan salah.' });
}

function getExamsHandler() {
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.UJIAN);
  const rows = sheet.getDataRange().getValues();

  const exams = [];
  // exam_id | judul | mapel | durasi_menit | mulai_at | selesai_at | jumlah_soal | acak_soal | acak_opsi | tampilkan_nilai | status
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    exams.push({
      exam_id: row[0],
      judul: row[1],
      mapel: row[2],
      durasi_menit: row[3],
      mulai_at: row[4],
      selesai_at: row[5],
      jumlah_soal: row[6],
      tampilkan_nilai: Boolean(row[9]),
      status: row[10]
    });
  }

  return createJsonResponse({ success: true, exams: exams });
}

function getExamQuestionsForStudentHandler(examId) {
  const ss = getDbSpreadsheet();
  const paketSheet = ss.getSheetByName(SHEETS.PAKET);
  const soalSheet = ss.getSheetByName(SHEETS.SOAL);

  const paketRows = paketSheet.getDataRange().getValues();
  const questionIds = [];
  for (let i = 1; i < paketRows.length; i++) {
    if (paketRows[i][0] === examId) {
      questionIds.push(paketRows[i][1]);
    }
  }

  const soalRows = soalSheet.getDataRange().getValues();
  const questions = [];
  // question_id | mapel | topik | teks_soal | gambar_url | opsi_a | opsi_b | opsi_c | opsi_d | kunci | pembahasan | aktif
  for (let i = 1; i < soalRows.length; i++) {
    const row = soalRows[i];
    if (questionIds.includes(row[0]) && row[11] === true) {
      // PENTING: Kunci jawaban TIDAK dikirimkan ke siswa!
      questions.push({
        question_id: row[0],
        mapel: row[1],
        topik: row[2],
        teks_soal: row[3],
        gambar_url: row[4] || '',
        opsi_a: row[5],
        opsi_b: row[6],
        opsi_c: row[7],
        opsi_d: row[8]
      });
    }
  }

  return createJsonResponse({ success: true, questions: questions });
}

function getQuestionsHandler() {
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SOAL);
  if (!sheet) {
    return createJsonResponse({ success: true, total: 0, questions: [] });
  }

  const rows = sheet.getDataRange().getValues();
  const questions = [];
  // Baris 1: question_id | mapel | topik | teks_soal | gambar_url | opsi_a | opsi_b | opsi_c | opsi_d | kunci | pembahasan | aktif
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const qId = String(row[0] || '').trim();
    if (!qId) continue;
    questions.push({
      question_id: qId,
      mapel: String(row[1] || 'Matematika').trim(),
      topik: String(row[2] || '').trim(),
      level: 'C2',
      teks_soal: String(row[3] || ''),
      gambar_url: String(row[4] || ''),
      opsi_a: String(row[5] || ''),
      opsi_b: String(row[6] || ''),
      opsi_c: String(row[7] || ''),
      opsi_d: String(row[8] || ''),
      kunci: String(row[9] || 'A').trim().toUpperCase(),
      pembahasan: String(row[10] || ''),
      aktif: row[11] !== false && String(row[11]).toUpperCase() !== 'FALSE'
    });
  }

  return createJsonResponse({ success: true, total: questions.length, questions: questions });
}

function syncQuestionsHandler(data) {
  const incoming = data.questions || [];
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return createJsonResponse({ success: false, message: 'Data soal kosong.' });
  }

  const ss = getDbSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.SOAL);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.SOAL);
  }

  // Bersihkan data lama kecuali header
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  const headers = ['question_id', 'mapel', 'topik', 'teks_soal', 'gambar_url', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'kunci', 'pembahasan', 'aktif'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground("#0369a1").setFontColor("#ffffff").setFontWeight("bold");

  const rowsToInsert = incoming.map(function(q) {
    return [
      q.question_id || ('q_' + Utilities.getUuid().slice(0, 8)),
      q.mapel || 'Matematika',
      q.topik || '',
      q.teks_soal || '',
      q.gambar_url || '',
      q.opsi_a || '',
      q.opsi_b || '',
      q.opsi_c || '',
      q.opsi_d || '',
      q.kunci || 'A',
      q.pembahasan || '',
      q.aktif !== false
    ];
  });

  if (rowsToInsert.length > 0) {
    sheet.getRange(2, 1, rowsToInsert.length, headers.length).setValues(rowsToInsert);
  }

  return createJsonResponse({
    success: true,
    message: 'Berhasil mengunggah ' + rowsToInsert.length + ' butir soal ke Spreadsheet!',
    total: rowsToInsert.length
  });
}

function saveQuestionHandler(q) {
  if (!q) return createJsonResponse({ success: false, message: 'Data soal tidak valid.' });
  const ss = getDbSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.SOAL);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.SOAL);
  }

  const qId = String(q.question_id || '').trim();
  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === qId) {
      foundRow = i + 1;
      break;
    }
  }

  const rowData = [
    qId || ('q_' + Utilities.getUuid().slice(0, 8)),
    q.mapel || 'Matematika',
    q.topik || '',
    q.teks_soal || '',
    q.gambar_url || '',
    q.opsi_a || '',
    q.opsi_b || '',
    q.opsi_c || '',
    q.opsi_d || '',
    q.kunci || 'A',
    q.pembahasan || '',
    q.aktif !== false
  ];

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: 'Soal berhasil disimpan ke Spreadsheet.' });
}

function deleteQuestionHandler(questionId) {
  if (!questionId) return createJsonResponse({ success: false, message: 'ID soal wajib diisi.' });
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SOAL);
  if (!sheet) return createJsonResponse({ success: false, message: 'Sheet Soal tidak ditemukan.' });

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(questionId).trim()) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true, message: 'Soal berhasil dihapus dari Spreadsheet.' });
    }
  }
  return createJsonResponse({ success: false, message: 'Soal tidak ditemukan di Spreadsheet.' });
}

function syncExamsHandler(data) {
  const incoming = data.exams || [];
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return createJsonResponse({ success: false, message: 'Data ujian kosong.' });
  }

  const ss = getDbSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.UJIAN);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.UJIAN);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  const headers = ['exam_id', 'judul', 'mapel', 'durasi_menit', 'mulai_at', 'selesai_at', 'jumlah_soal', 'acak_soal', 'acak_opsi', 'tampilkan_nilai', 'status'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground("#0369a1").setFontColor("#ffffff").setFontWeight("bold");

  const rowsToInsert = incoming.map(function(e) {
    return [
      e.exam_id,
      e.judul || '',
      e.mapel || '',
      e.durasi_menit || 90,
      e.mulai_at || '',
      e.selesai_at || '',
      e.jumlah_soal || 40,
      e.acak_soal !== false,
      e.acak_opsi !== false,
      e.tampilkan_nilai || false,
      e.status || 'Sedang Berlangsung'
    ];
  });

  if (rowsToInsert.length > 0) {
    sheet.getRange(2, 1, rowsToInsert.length, headers.length).setValues(rowsToInsert);
  }

  return createJsonResponse({ success: true, message: 'Pengaturan ujian berhasil disinkronkan ke Spreadsheet!' });
}

function saveExamHandler(exam) {
  if (!exam) return createJsonResponse({ success: false, message: 'Data ujian tidak valid.' });
  const ss = getDbSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.UJIAN);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.UJIAN);
  }

  const rows = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(exam.exam_id).trim()) {
      foundRow = i + 1;
      break;
    }
  }

  const rowData = [
    exam.exam_id,
    exam.judul || '',
    exam.mapel || '',
    exam.durasi_menit || 90,
    exam.mulai_at || '',
    exam.selesai_at || '',
    exam.jumlah_soal || 40,
    exam.acak_soal !== false,
    exam.acak_opsi !== false,
    exam.tampilkan_nilai || false,
    exam.status || 'Sedang Berlangsung'
  ];

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({ success: true, message: 'Ujian berhasil diperbarui di Spreadsheet.' });
}

function saveAnswerHandler(data) {
  const { attempt_id, question_id, jawaban } = data;
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.JAWABAN);
  const rows = sheet.getDataRange().getValues();

  // attempt_id | question_id | jawaban | updated_at
  let found = false;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === attempt_id && rows[i][1] === question_id) {
      sheet.getRange(i + 1, 3).setValue(jawaban);
      sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([attempt_id, question_id, jawaban, new Date().toISOString()]);
  }

  return createJsonResponse({ success: true, message: 'Jawaban berhasil disimpan' });
}

function submitExamHandler(data) {
  const { attempt_id, exam_id, student_id } = data;
  const ss = getDbSpreadsheet();

  // Hitung jawaban benar berdasarkan sheet Soal
  const soalSheet = ss.getSheetByName(SHEETS.SOAL);
  const soalRows = soalSheet.getDataRange().getValues();
  const kunciMap = {};
  for (let i = 1; i < soalRows.length; i++) {
    kunciMap[soalRows[i][0]] = String(soalRows[i][9]).trim().toUpperCase(); // Kolom kunci
  }

  const jawabanSheet = ss.getSheetByName(SHEETS.JAWABAN);
  const jawabanRows = jawabanSheet.getDataRange().getValues();
  let benar = 0;
  let salah = 0;
  let totalDinilai = 0;

  for (let i = 1; i < jawabanRows.length; i++) {
    if (jawabanRows[i][0] === attempt_id) {
      const qId = jawabanRows[i][1];
      const jwb = String(jawabanRows[i][2]).trim().toUpperCase();
      if (kunciMap[qId]) {
        totalDinilai++;
        if (jwb === kunciMap[qId]) {
          benar++;
        } else if (jwb !== '') {
          salah++;
        }
      }
    }
  }

  const skor = totalDinilai > 0 ? Math.round((benar / totalDinilai) * 100) : 0;

  // Update status sesi ujian
  const sesiSheet = ss.getSheetByName(SHEETS.SESI);
  const sesiRows = sesiSheet.getDataRange().getValues();
  for (let i = 1; i < sesiRows.length; i++) {
    if (sesiRows[i][0] === attempt_id) {
      sesiSheet.getRange(i + 1, 6).setValue(new Date().toISOString()); // selesai_at
      sesiSheet.getRange(i + 1, 7).setValue('Submitted'); // status
      sesiSheet.getRange(i + 1, 8).setValue(skor); // skor
      break;
    }
  }

  return createJsonResponse({
    success: true,
    message: 'Ujian berhasil dikirim!',
    result: { benar: benar, salah: salah, skor: skor }
  });
}

function recordScoreHandler(data) {
  const ss = getDbSpreadsheet();
  let sheet = ss.getSheetByName('Nilai');
  
  // Jika sheet Nilai belum ada di Spreadsheet, otomatis buat sheet baru ber-header biru
  if (!sheet) {
    sheet = ss.insertSheet('Nilai');
    const headers = ['timestamp', 'nis', 'nama', 'kelas', 'mapel', 'skor', 'benar', 'salah', 'kosong', 'pelanggaran_tab', 'attempt_id', 'exam_id'];
    const hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setValues([headers]);
    hRange.setBackground("#0369a1");
    hRange.setFontColor("#ffffff");
    hRange.setFontWeight("bold");
    hRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  const sNis = String(data.nis || '').trim();
  const sMapel = String(data.mapel || '').trim();
  const skor = Number(data.skor !== undefined ? data.skor : 0);
  const benar = Number(data.benar || 0);
  const salah = Number(data.salah || 0);
  const kosong = Number(data.kosong || 0);
  const pelanggaran = Number(data.pelanggaran_tab || 0);
  const timestamp = data.selesai_at || new Date().toISOString();

  // Cari apakah siswa sudah memiliki baris nilai untuk mapel ini (agar tidak duplikat)
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === sNis && String(rows[i][4]).trim().toLowerCase() === sMapel.toLowerCase()) {
      rowIndex = i + 1; // 1-indexed row number
      break;
    }
  }

  const rowData = [
    timestamp,
    sNis,
    data.nama || '',
    data.kelas || '',
    sMapel,
    skor,
    benar,
    salah,
    kosong,
    pelanggaran,
    data.attempt_id || '',
    data.exam_id || ''
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return createJsonResponse({
    success: true,
    message: 'Nilai berhasil disimpan di Spreadsheet!',
    data: { nis: sNis, mapel: sMapel, skor: skor }
  });
}

function getResultsHandler() {
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName('Nilai');
  if (!sheet) {
    return createJsonResponse({ success: true, total: 0, results: [] });
  }

  const rows = sheet.getDataRange().getValues();
  const results = [];
  // Baris 1 header: timestamp | nis | nama | kelas | mapel | skor | benar | salah | kosong | pelanggaran_tab | attempt_id | exam_id
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sNis = String(row[1] || '').trim();
    if (!sNis) continue;

    results.push({
      timestamp: row[0] ? String(row[0]) : '',
      nis: sNis,
      nama: String(row[2] || ''),
      kelas: String(row[3] || ''),
      mapel: String(row[4] || ''),
      skor: Number(row[5] || 0),
      benar: Number(row[6] || 0),
      salah: Number(row[7] || 0),
      kosong: Number(row[8] || 0),
      pelanggaran_tab: Number(row[9] || 0),
      attempt_id: String(row[10] || ''),
      exam_id: String(row[11] || '')
    });
  }

  return createJsonResponse({
    success: true,
    total: results.length,
    results: results
  });
}

function createJsonResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const SPREADSHEET_SCHEMA_GUIDE = [
  {
    sheetName: 'Siswa',
    description: 'Menyimpan kredensial dan identitas siswa kelas IX SMP Negeri 2 Pulung.',
    columns: [
      { name: 'student_id', desc: 'ID unik siswa (cth: std_01)' },
      { name: 'nis', desc: 'Nomor Induk Siswa (cth: 12345)' },
      { name: 'nama', desc: 'Nama lengkap siswa (cth: Andi Saputra)' },
      { name: 'kelas', desc: 'Rombongan belajar (cth: 9A, 9B, 9C, 9D, 9E)' },
      { name: 'pin_hash', desc: 'PIN / password login siswa (cth: 12345)' },
      { name: 'aktif', desc: 'Status akun siswa aktif: TRUE / FALSE' },
      { name: 'ruang', desc: '(Opsional) Ruang ujian untuk cetak kartu (cth: Ruang 01 / Lab CBT)' },
      { name: 'sesi', desc: '(Opsional) Sesi ujian untuk cetak kartu (cth: Sesi 1 / Sesi 2)' },
    ],
  },
  {
    sheetName: 'Soal',
    description: 'Bank soal pilihan ganda Matematika dan Bahasa Indonesia beserta kunci jawaban untuk penilaian server.',
    columns: [
      { name: 'question_id', desc: 'ID unik soal (cth: q_math_01)' },
      { name: 'mapel', desc: 'Matematika / Bahasa Indonesia' },
      { name: 'topik', desc: 'Topik/materi pokok (cth: Geometri & Bangun Datar)' },
      { name: 'teks_soal', desc: 'Isi teks soal lengkap' },
      { name: 'gambar_url', desc: 'URL gambar penjelas (opsional / boleh kosong)' },
      { name: 'opsi_a', desc: 'Pilihan jawaban A' },
      { name: 'opsi_b', desc: 'Pilihan jawaban B' },
      { name: 'opsi_c', desc: 'Pilihan jawaban C' },
      { name: 'opsi_d', desc: 'Pilihan jawaban D' },
      { name: 'kunci', desc: 'Kunci jawaban yang benar: A / B / C / D (hanya diakses backend)' },
      { name: 'pembahasan', desc: 'Pembahasan solusi soal (opsional)' },
      { name: 'aktif', desc: 'Status soal aktif: TRUE / FALSE' },
    ],
  },
  {
    sheetName: 'Ujian',
    description: 'Jadwal dan pengaturan teknis pelaksanaan ujian TKA.',
    columns: [
      { name: 'exam_id', desc: 'ID unik ujian (cth: exam_01)' },
      { name: 'judul', desc: 'Nama ujian (cth: TKA Matematika)' },
      { name: 'mapel', desc: 'Matematika / Bahasa Indonesia' },
      { name: 'durasi_menit', desc: 'Durasi pengerjaan dalam menit (cth: 90)' },
      { name: 'mulai_at', desc: 'Waktu mulai ujian (cth: 2025-06-20 08:00)' },
      { name: 'selesai_at', desc: 'Waktu batas pengerjaan (cth: 2025-06-20 10:00)' },
      { name: 'jumlah_soal', desc: 'Jumlah total butir soal (cth: 40)' },
      { name: 'acak_soal', desc: 'Acak urutan nomor soal: TRUE / FALSE' },
      { name: 'acak_opsi', desc: 'Acak pilihan A-D: TRUE / FALSE' },
      { name: 'tampilkan_nilai', desc: 'Izin siswa melihat nilai setelah ujian: TRUE / FALSE' },
      { name: 'status', desc: 'Belum Dimulai / Sedang Berlangsung / Selesai' },
    ],
  },
  {
    sheetName: 'PaketSoal',
    description: 'Daftar pemetaan soal yang dimasukkan ke dalam paket ujian.',
    columns: [
      { name: 'exam_id', desc: 'ID ujian' },
      { name: 'question_id', desc: 'ID butir soal' },
      { name: 'urutan', desc: 'Nomor urut soal di ujian' },
    ],
  },
  {
    sheetName: 'SesiUjian',
    description: 'Mencatat sesi pengerjaan siswa secara realtime dan batas waktu server.',
    columns: [
      { name: 'attempt_id', desc: 'ID unik sesi (cth: att_01_math)' },
      { name: 'exam_id', desc: 'ID ujian' },
      { name: 'student_id', desc: 'ID siswa yang mengerjakan' },
      { name: 'mulai_at', desc: 'Waktu mulai sesi dari server (ISO datetime)' },
      { name: 'batas_waktu_at', desc: 'Waktu deadline pengerjaan dari server' },
      { name: 'selesai_at', desc: 'Waktu pengumpulan jawaban' },
      { name: 'status', desc: 'In Progress / Submitted / Expired' },
      { name: 'skor', desc: 'Nilai akhir hasil perhitungan otomatis (0-100)' },
    ],
  },
  {
    sheetName: 'Jawaban',
    description: 'Penyimpanan autosave jawaban per butir soal per siswa.',
    columns: [
      { name: 'attempt_id', desc: 'ID sesi pengerjaan' },
      { name: 'question_id', desc: 'ID soal' },
      { name: 'jawaban', desc: 'Opsi yang dipilih siswa (A, B, C, D, atau kosong)' },
      { name: 'updated_at', desc: 'Waktu penyimpanan terakhir dari client' },
    ],
  },
  {
    sheetName: 'Rekap',
    description: 'Rekapitulasi nilai dan status kelulusan KKM per mata pelajaran.',
    columns: [
      { name: 'student_id', desc: 'ID siswa' },
      { name: 'nis', desc: 'NIS' },
      { name: 'nama', desc: 'Nama siswa' },
      { name: 'kelas', desc: 'Kelas (9A/9B/9C)' },
      { name: 'skor_matematika', desc: 'Nilai TKA Matematika' },
      { name: 'skor_bahasa', desc: 'Nilai TKA Bahasa Indonesia' },
      { name: 'rata_rata', desc: 'Nilai rata-rata kedua mapel' },
      { name: 'keterangan', desc: 'Tuntas / Belum Tuntas (KKM 75)' },
    ],
  },
];
