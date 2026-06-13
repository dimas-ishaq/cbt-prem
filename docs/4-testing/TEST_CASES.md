# Test Cases

Dokumen ini memuat skenario uji coba (Test Cases) utama untuk memastikan fungsionalitas aplikasi CBT berjalan baik.

## TC-01: Autentikasi Login
*   **Aksi:** Masukkan username dan password valid (Role: Siswa).
*   **Ekspektasi:** Sistem mengarahkan ke `/dashboard` (Siswa). Token JWT tersimpan aman.
*   **Status:** [PASS/FAIL]

## TC-02: Import Soal via Word (.docx)
*   **Aksi:** Guru membuat Bank Soal, klik "Import Word", dan mengunggah file docx dengan format `SQ` dan `EQ`.
*   **Ekspektasi:** File berhasil diproses, soal-soal dan opsi pilihan ganda/essay berhasil diekstrak dan masuk ke database, UI me-refresh daftar soal.
*   **Status:** [PASS/FAIL]

## TC-03: Deteksi Kecurangan (Proctoring)
*   **Kondisi Awal:** Siswa sedang mengerjakan ujian. Guru membuka halaman "Live Monitoring".
*   **Aksi:** Siswa membuka tab browser baru, lalu kembali ke tab ujian.
*   **Ekspektasi:** 
    *   Layar siswa mungkin memunculkan peringatan (opsional).
    *   Dashboard guru secara *realtime* menambah badge "Alert" merah pada kartu siswa tersebut, log kecurangan (TAB_SWITCH) muncul di sebelah kanan.
*   **Status:** [PASS/FAIL]

## TC-04: Auto-Grading (Penilaian Otomatis)
*   **Aksi:** Siswa menjawab campuran soal Pilihan Ganda (Benar & Salah) lalu klik "Selesai Ujian".
*   **Ekspektasi:** Skor total siswa langsung terkalkulasi untuk soal Pilihan Ganda dan tampil di halaman `Exam Results` Admin.
*   **Status:** [PASS/FAIL]

## TC-05: Penilaian Essay Manual & Recalculation
*   **Aksi:** Guru masuk ke `Exam Results`, pilih sesi siswa, dan memasukkan angka pada input box `Points` di soal tipe Essay. Klik Save.
*   **Ekspektasi:** Nilai tersimpan, dan label "Total Score" siswa di atas layar langsung ter-update mengakumulasi nilai baru.
*   **Status:** [PASS/FAIL]

## TC-06: Export Hasil ke Excel
*   **Aksi:** Guru klik "Export Excel" pada halaman Hasil Ujian.
*   **Ekspektasi:** Browser mengunduh file `.xlsx`. Saat dibuka, file berisi tabel dengan header tebal mencakup No, Nama, Username, NISN, Status, Nilai Akhir, dan Waktu Pengerjaan.
*   **Status:** [PASS/FAIL]
