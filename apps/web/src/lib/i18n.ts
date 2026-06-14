import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  id: {
    translation: {
      dashboard: 'Dashboard',
      groupGeneral: 'Utama',
      groupAcademic: 'Akademik',
      groupCbt: 'Manajemen CBT',
      groupSystem: 'Pengaturan Sistem',
      subjects: 'Mata Pelajaran',
      majors: 'Konsentrasi Keahlian',
      questionBanks: 'Bank Soal',
      exams: 'Ujian',
      monitoring: 'Live Monitoring',
      users: 'Pengguna',
      roles: 'Manajemen Akses',
      settings: 'Pengaturan',
      logout: 'Keluar',
      
      // Subjects
      subjectsTitle: 'Mata Pelajaran',
      subjectsDesc: 'Kelola data mata pelajaran dan kode akademik sekolah.',
      addSubject: 'Tambah Mata Pelajaran',
      searchSubjects: 'Cari mata pelajaran...',
      colCode: 'Kode',
      colName: 'Nama',
      colDesc: 'Deskripsi',
      colActions: 'Aksi',
      addSubjectModal: 'Tambah Mata Pelajaran Baru',
      editSubjectModal: 'Ubah Mata Pelajaran',
      subjectCodeLabel: 'Kode Mata Pelajaran',
      subjectNameLabel: 'Nama Mata Pelajaran',
      noSubjects: 'Tidak ada mata pelajaran yang ditemukan.',
      confirmDeleteSubject: 'Apakah Anda yakin ingin menghapus mata pelajaran ini?',

      // Users
      usersTitle: 'Manajemen Pengguna',
      usersDesc: 'Kelola data akun siswa dan guru.',
      addUser: 'Tambah Pengguna',
      addStudent: 'Tambah Siswa',
      addTeacher: 'Tambah Guru',
      exportCsv: 'Ekspor CSV',
      importCsv: 'Impor CSV',
      studentsTab: 'Siswa',
      teachersTab: 'Guru',
      fullNameLabel: 'Nama Lengkap',
      usernameLabel: 'Username',
      nisnLabel: 'NISN',
      nipLabel: 'NIP',
      actionsLabel: 'Aksi',
      noUsersFound: 'Tidak ada pengguna ditemukan.',
      confirmDeleteUser: 'Apakah Anda yakin ingin menghapus pengguna ini?',
      
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
      groupGeneral: 'General',
      groupAcademic: 'Academic',
      groupCbt: 'CBT Management',
      groupSystem: 'System Settings',
      subjects: 'Subjects',
      majors: 'Expertise Concentration',
      questionBanks: 'Question Banks',
      exams: 'Exams',
      monitoring: 'Live Monitoring',
      users: 'Users',
      roles: 'Access Control',
      settings: 'Settings',
      logout: 'Sign Out',
      
      // Subjects
      subjectsTitle: 'Subjects',
      subjectsDesc: 'Manage school subjects and codes.',
      addSubject: 'Add Subject',
      searchSubjects: 'Search subjects...',
      colCode: 'Code',
      colName: 'Name',
      colDesc: 'Description',
      colActions: 'Actions',
      addSubjectModal: 'Add New Subject',
      editSubjectModal: 'Edit Subject',
      subjectCodeLabel: 'Subject Code',
      subjectNameLabel: 'Subject Name',
      noSubjects: 'No subjects found.',
      confirmDeleteSubject: 'Are you sure you want to delete this subject?',

      // Users
      usersTitle: 'User Management',
      usersDesc: 'Manage student and teacher accounts.',
      addUser: 'Add User',
      addStudent: 'Add Student',
      addTeacher: 'Add Teacher',
      exportCsv: 'Export CSV',
      importCsv: 'Import CSV',
      studentsTab: 'Students',
      teachersTab: 'Teachers',
      fullNameLabel: 'Full Name',
      usernameLabel: 'Username',
      nisnLabel: 'NISN',
      nipLabel: 'NIP',
      actionsLabel: 'Actions',
      noUsersFound: 'No users found.',
      confirmDeleteUser: 'Are you sure you want to delete this user?',
      
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
