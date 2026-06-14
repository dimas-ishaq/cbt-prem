import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  id: {
    translation: {
      dashboard: 'Dashboard',
      subjects: 'Mata Pelajaran',
      questionBanks: 'Bank Soal',
      exams: 'Ujian',
      monitoring: 'Live Monitoring',
      users: 'Pengguna',
      roles: 'Manajemen Akses',
      settings: 'Pengaturan',
      logout: 'Keluar',
      
      // Settings Page
      settingsTitle: 'Pengaturan Sistem',
      settingsDesc: 'Kelola identitas visual aplikasi, logo, dan zona waktu sistem utama.',
      appNameLabel: 'Nama Aplikasi / Brand',
      logoLabel: 'Logo Aplikasi',
      timezoneLabel: 'Zona Waktu Utama',
      languageLabel: 'Bahasa Aplikasi',
      saveBtn: 'Simpan Perubahan',

      // Dashboard Overview Page
      dashboardOverview: 'Ringkasan Dasbor',
      welcomeCbt: 'Selamat datang kembali di panel manajemen CBT.',
      totalStudents: 'Total Siswa',
      activeExams: 'Ujian Aktif',
      subjectsLabel: 'Mata Pelajaran',
      avgScore: 'Rata-rata Nilai',
      recentExams: 'Ujian Terbaru',
      liveAlerts: 'Peringatan Live Monitoring',
      completedStatus: 'Selesai',
      violationDetected: 'Pelanggaran Terdeteksi',
      minutesAgo: 'menit yang lalu',
    }
  },
  en: {
    translation: {
      dashboard: 'Dashboard',
      subjects: 'Subjects',
      questionBanks: 'Question Banks',
      exams: 'Exams',
      monitoring: 'Live Monitoring',
      users: 'Users',
      roles: 'Access Control',
      settings: 'Settings',
      logout: 'Sign Out',
      
      // Settings Page
      settingsTitle: 'System Settings',
      settingsDesc: 'Manage visual identity, logo, and system timezone configurations.',
      appNameLabel: 'Application Name / Brand',
      logoLabel: 'Application Logo',
      timezoneLabel: 'System Timezone',
      languageLabel: 'System Language',
      saveBtn: 'Save Changes',

      // Dashboard Overview Page
      dashboardOverview: 'Dashboard Overview',
      welcomeCbt: 'Welcome back to the CBT management panel.',
      totalStudents: 'Total Students',
      activeExams: 'Active Exams',
      subjectsLabel: 'Subjects',
      avgScore: 'Average Score',
      recentExams: 'Recent Exams',
      liveAlerts: 'Live Monitoring Alerts',
      completedStatus: 'Completed',
      violationDetected: 'Violation Detected',
      minutesAgo: 'minutes ago',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'id',
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
