import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileCheck,
  Award,
  Settings,
  LogOut,
  Database,
  Menu,
  X,
  ChevronDown,
  CreditCard,
} from 'lucide-react';
import { SchoolLogo } from '../common/SchoolLogo';
import { AdminUser } from '../../types/cbt';

export type AdminTab =
  | 'dashboard'
  | 'bank-soal'
  | 'data-siswa'
  | 'kartu-login'
  | 'ujian'
  | 'rekap-nilai'
  | 'spreadsheet'
  | 'pengaturan';

interface AdminLayoutProps {
  admin: AdminUser;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  admin,
  activeTab,
  onTabChange,
  onLogout,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'bank-soal', label: 'Bank Soal', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'data-siswa', label: 'Data Siswa', icon: <Users className="w-4 h-4" /> },
    { id: 'kartu-login', label: 'Cetak Kartu Login', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'ujian', label: 'Ujian', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'rekap-nilai', label: 'Rekap Nilai', icon: <Award className="w-4 h-4" /> },
    { id: 'spreadsheet', label: 'Google Apps Script', icon: <Database className="w-4 h-4" /> },
    { id: 'pengaturan', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Matching exact dark blue from reference mockup) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sky-950 text-white flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Sidebar Brand Header */}
          <div className="p-5 flex items-center justify-between border-b border-sky-900/60">
            <div className="flex items-center gap-3">
              <SchoolLogo size={36} showText={false} />
              <div>
                <div className="font-bold text-sm text-white tracking-tight leading-tight">
                  SMP Negeri 2 Pulung
                </div>
                <div className="text-[11px] text-sky-300">
                  CBT TKA · Admin Guru
                </div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-sky-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-sky-200 hover:bg-sky-900/70 hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-sky-300'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Logout */}
        <div className="p-4 border-t border-sky-900/60">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-200 hover:bg-sky-900/80 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-sky-300" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block text-xs text-slate-500 font-medium">
              SMP Negeri 2 Pulung · Panel Pengelolaan CBT TKA
            </div>
          </div>

          {/* User Profile Badge (Matching mockup top right: Budi Santoso Guru) */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
              BS
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">{admin.nama}</div>
              <div className="text-[10px] text-slate-500">{admin.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
};
