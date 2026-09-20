# CatchReel

CatchReel adalah aplikasi web untuk mengarsipkan, menganalisis, dan melacak konten edukatif dari Instagram Reels ke Google Sheets menggunakan bantuan model Google Gemini AI. Aplikasi ini dirancang untuk mengatasi masalah konten inspirasi atau pembelajaran yang sering disimpan di media sosial namun tidak pernah dibuka atau ditinjau kembali.

---

## Fitur Utama

- Ekstraksi Otomatis: Mengambil nama akun kreator, judul konten, dan teks deskripsi asli dari tautan Instagram Reels.
- Analisis AI Terstruktur: Google Gemini AI membedah konten menjadi kategori topik, 3 hingga 5 poin utama pembelajaran, ringkasan kontekstual, dan saran tindakan praktis.
- Sinkronisasi Google Sheets: Data tersimpan langsung ke Google Spreadsheet pengguna secara real-time melalui Google Apps Script Webhook atau Google Sheets API v4.
- Sesi Tinjau Berkala: Fitur pengacak materi yang belum dipelajari untuk mendorong pembelajaran berulang secara konsisten.
- Manajemen Konten: Pencarian kata kunci, penyaringan berdasarkan topik, status peninjauan, penanda favorit, dan fitur salin ringkasan.

---

## Tech Stack

- Framework: Next.js 16 (App Router)
- Bahasa: TypeScript
- Library UI: React 19
- Styling: Vanilla CSS (Custom Design System, Responsive Dark Mode)
- Icon Pack: Lucide React
- AI Model: Google Gemini API (gemini-3.5-flash-lite sebagai model utama, gemini-3.8-live sebagai model cadangan)
- Database: Google Sheets API v4 dan Google Apps Script Webhook
- Deployment: Vercel

---

## Alur Kerja Sistem (System Workflow)

1. Input Tautan: Pengguna memasukkan atau menempelkan tautan Instagram Reels pada antarmuka web.
2. Pengambilan Metadata: Sistem melakukan inspeksi metadata halaman publik Reels untuk mengambil username kreator dan teks deskripsi konten.
3. Pemrosesan Bahasa AI: Teks deskripsi diteruskan ke Google Gemini API dengan instruksi terstruktur untuk mengekstrak kategori, ringkasan substantif, poin-poin konkret, dan tips praktis dalam format JSON.
4. Penyimpanan Data: Data hasil ekstraksi dikirimkan ke Google Spreadsheet milik pengguna sebagai baris data baru.
5. Visualisasi dan Peninjauan: Konten ditampilkan pada dashboard interaktif dan masuk ke dalam daftar antrean tinjau berkala pengguna.

---

## Panduan Instalasi Lokal

### Prasyarat
- Node.js versi 18 ke atas
- npm atau package manager sejenis

### Langkah Menjalankan

1. Clone repositori ini:
   git clone <URL_REPOSITORY_ANDA>
   cd listed-content

2. Instal dependensi:
   npm install

3. Konfigurasi Environment Variables:
   Salin file .env.example menjadi .env.local:
   cp .env.example .env.local

   Isi variabel yang diperlukan:
   - GEMINI_API_KEY: Kunci API dari Google AI Studio.
   - GOOGLE_SHEETS_WEBHOOK_URL: URL penerapan web app Google Apps Script dari spreadsheet Anda.
   - GOOGLE_SHEET_ID: ID spreadsheet dari URL dokumen Google Sheets Anda.

4. Jalankan server pengembangan:
   npm run dev

5. Buka peramban pada alamat:
   http://localhost:3000

---

## Panduan Deployment ke Vercel

1. Unggah proyek ke repositori GitHub.
2. Masuk ke dashboard Vercel dan buat project baru dari repositori tersebut.
3. Tambahkan environment variables pada pengaturan project di Vercel:
   - GEMINI_API_KEY
   - GOOGLE_SHEETS_WEBHOOK_URL
   - GOOGLE_SHEET_ID
4. Lakukan deployment. Aplikasi siap digunakan secara daring.
