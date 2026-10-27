import React, { useState, useEffect } from 'react';
import { Student, AdminUser, Exam, ExamAttempt } from './types/cbt';
import { StorageService } from './services/storageService';
import { LoginView } from './components/auth/LoginView';
import { StudentHome } from './components/student/StudentHome';
import { ExamTakingView } from './components/student/ExamTakingView';
import { ExamResultView } from './components/student/ExamResultView';
import { AdminLayout, AdminTab } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminBankSoal } from './components/admin/AdminBankSoal';
import { AdminDataSiswa } from './components/admin/AdminDataSiswa';
import { AdminUjian } from './components/admin/AdminUjian';
import { AdminRekapNilai } from './components/admin/AdminRekapNilai';
import { AdminSpreadsheetGuide } from './components/admin/AdminSpreadsheetGuide';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminCetakKartu } from './components/admin/AdminCetakKartu';

type AuthState =
  | { type: 'unauthenticated' }
  | { type: 'student'; student: Student }
  | { type: 'admin'; admin: AdminUser };

type StudentScreen =
  | { screen: 'home' }
  | { screen: 'taking'; exam: Exam; attempt: ExamAttempt }
  | { screen: 'result'; exam: Exam; attempt: ExamAttempt };

export default function App() {
  // Initialize local persistent storage
  useEffect(() => {
    StorageService.init();
  }, []);

  // Authentication State
  const [auth, setAuth] = useState<AuthState>({ type: 'unauthenticated' });

  // Student Navigation State
  const [studentScreen, setStudentScreen] = useState<StudentScreen>({ screen: 'home' });

  // Admin Navigation State
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // Handle Student Login
  const handleStudentLogin = (student: Student) => {
    setAuth({ type: 'student', student });
    setStudentScreen({ screen: 'home' });
  };

  // Handle Admin Login
  const handleAdminLogin = (admin: AdminUser) => {
    setAuth({ type: 'admin', admin });
    setAdminTab('dashboard');
  };

  // Handle Logout
  const handleLogout = () => {
    setAuth({ type: 'unauthenticated' });
    setStudentScreen({ screen: 'home' });
  };

  // Student: Start or resume exam
  const handleStartExam = (examId: string) => {
    if (auth.type !== 'student') return;
    const { attempt, exam } = StorageService.startOrResumeExam(auth.student.student_id, examId);
    setStudentScreen({ screen: 'taking', exam, attempt });
  };

  // Student: Finished exam
  const handleFinishExam = (submittedAttempt: ExamAttempt) => {
    if (studentScreen.screen === 'taking') {
      setStudentScreen({
        screen: 'result',
        exam: studentScreen.exam,
        attempt: submittedAttempt,
      });
    }
  };

  // Student: View result from lobby
  const handleViewResult = (attempt: ExamAttempt, exam: Exam) => {
    setStudentScreen({ screen: 'result', exam, attempt });
  };

  // ==========================================
  // 1. Unauthenticated -> Show Login View
  // ==========================================
  if (auth.type === 'unauthenticated') {
    return (
      <LoginView
        onStudentLogin={handleStudentLogin}
        onAdminLogin={handleAdminLogin}
      />
    );
  }

  // ==========================================
  // 2. Student Mode
  // ==========================================
  if (auth.type === 'student') {
    if (studentScreen.screen === 'taking') {
      const allQuestions = StorageService.getQuestions();
      const examQuestions = allQuestions.filter((q) =>
        studentScreen.exam.question_ids.includes(q.question_id) && q.aktif
      );

      return (
        <ExamTakingView
          student={auth.student}
          exam={studentScreen.exam}
          questions={examQuestions.length > 0 ? examQuestions : allQuestions.filter(q => q.mapel === studentScreen.exam.mapel)}
          initialAttempt={studentScreen.attempt}
          onFinishExam={handleFinishExam}
          onBackToHome={() => setStudentScreen({ screen: 'home' })}
        />
      );
    }

    if (studentScreen.screen === 'result') {
      return (
        <ExamResultView
          student={auth.student}
          exam={studentScreen.exam}
          attempt={studentScreen.attempt}
          onBackToHome={() => setStudentScreen({ screen: 'home' })}
        />
      );
    }

    return (
      <StudentHome
        student={auth.student}
        onLogout={handleLogout}
        onStartExam={handleStartExam}
        onViewResult={handleViewResult}
      />
    );
  }

  // ==========================================
  // 3. Admin / Teacher Mode
  // ==========================================
  return (
    <AdminLayout
      admin={auth.admin}
      activeTab={adminTab}
      onTabChange={setAdminTab}
      onLogout={handleLogout}
    >
      {adminTab === 'dashboard' && (
        <AdminDashboard admin={auth.admin} onNavigate={setAdminTab} />
      )}
      {adminTab === 'bank-soal' && <AdminBankSoal />}
      {adminTab === 'data-siswa' && (
        <AdminDataSiswa onOpenCetakKartu={() => setAdminTab('kartu-login')} />
      )}
      {adminTab === 'kartu-login' && (
        <AdminCetakKartu onBackToDataSiswa={() => setAdminTab('data-siswa')} />
      )}
      {adminTab === 'ujian' && <AdminUjian />}
      {adminTab === 'rekap-nilai' && <AdminRekapNilai />}
      {adminTab === 'spreadsheet' && <AdminSpreadsheetGuide />}
      {adminTab === 'pengaturan' && <AdminSettings />}
    </AdminLayout>
  );
}
