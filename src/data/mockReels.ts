import { ReelItem } from '@/types/reel';

export const INITIAL_MOCK_REELS: ReelItem[] = [
  {
    id: 'reel_1',
    url: 'https://www.instagram.com/reel/C8abc12345/',
    creator: '@english.with.alex',
    title: '5 Alternatif Kata "Very" yang Bikin Bahasa Inggrismu Natural',
    topic: 'Bahasa & Komunikasi',
    dateSaved: '2026-09-18',
    keyPoints: [
      'Ganti "very tired" menjadi "exhausted" untuk ekspresi kelelahan yang lebih otentik.',
      'Gunakan "furious" daripada "very angry" saat mendeskripsikan kemarahan tingkat tinggi.',
      'Pakai kata "hilarious" sebagai pengganti "very funny" untuk situasi komedi.'
    ],
    summary: 'Video singkat yang membedah kosa kata bahasa Inggris sehari-hari agar terdengar lebih advanced dan seperti penutur asli tanpa mengulang-ulang kata "very".',
    actionableTip: 'Tulis kalimat contoh sendiri menggunakan kata "exhausted" dan "hilarious" hari ini.',
    tags: ['english', 'vocabulary', 'speaking'],
    status: 'Belum Ditinjau',
    isFavorite: true,
  },
  {
    id: 'reel_2',
    url: 'https://www.instagram.com/reel/C8def67890/',
    creator: '@mindset.juara',
    title: 'Teknik 2-Minute Rule untuk Mengatasi Prokrastinasi',
    topic: 'Pengembangan Diri',
    dateSaved: '2026-09-17',
    keyPoints: [
      'Jika sebuah tugas butuh waktu kurang dari 2 menit, kerjakan detik ini juga tanpa ditunda.',
      'Untuk tugas besar, ubah mindset: cukup mulai kerjakan 2 menit pertama saja (inisiasi momentum).',
      'Gesekan awal selalu paling berat, begitu otak mulai bergerak, fokus akan mengalir dengan sendirinya.'
    ],
    summary: 'Prinsip psikologi praktis dari buku Atomic Habits untuk mengelabui rasa malas dan memulai tindakan segera.',
    actionableTip: 'Pilih 1 hal kecil yang kamu tunda sejak kemarin dan bereskan dalam 2 menit.',
    tags: ['produktivitas', 'habits', 'fokus'],
    status: 'Belum Ditinjau',
    isFavorite: false,
  },
  {
    id: 'reel_3',
    url: 'https://www.instagram.com/reel/C8ghi11223/',
    creator: '@designwithdio',
    title: 'Aturan 60-30-10 dalam Memilih Warna UI Desain',
    topic: 'Kreatif & Desain',
    dateSaved: '2026-09-15',
    keyPoints: [
      '60% warna dominan (biasanya background netral, putih bersih atau dark obsidian).',
      '30% warna sekunder (cards, navigation bar, elevated surfaces).',
      '10% warna aksen tajam (CTA buttons, status badges, titik fokus interaksi).'
    ],
    summary: 'Panduan visual penting bagi desainer dan kreator konten agar komposisi warna aplikasi atau visual poster terlihat harmonis dan tidak melelahkan mata.',
    actionableTip: 'Cek desain interface atau slide presentasi terbarumu dan sesuaikan proporsi warnanya.',
    tags: ['ui-ux', 'desain', 'color-theory'],
    status: 'Selesai',
    isFavorite: true,
  },
  {
    id: 'reel_4',
    url: 'https://www.instagram.com/reel/C8jkl44556/',
    creator: '@tech_insights_id',
    title: 'Framework Prompting AI: Role, Task, Context, Constraint',
    topic: 'Teknologi',
    dateSaved: '2026-09-12',
    keyPoints: [
      'Role: Tentukan peran spesifik AI (misal: Konsultan Marketing Senior).',
      'Task: Jelaskan apa tujuan akhir yang ingin dihasilkan secara spesifik.',
      'Context: Berikan data latar belakang, target audiens, dan tone of voice.',
      'Constraint: Batasi hal yang tidak boleh dilakukan (misal: tanpa jargon, maks 3 paragraf).'
    ],
    summary: 'Formula sistematis untuk mendapatkan output berkualitas tinggi dari model AI seperti Google Gemini atau Claude tanpa jawaban halusinasi.',
    actionableTip: 'Simpan formula RTCC ini sebagai template catatan di handphone saat berinteraksi dengan AI.',
    tags: ['ai-tools', 'prompting', 'teknologi'],
    status: 'Sedang Dipelajari',
    isFavorite: false,
  }
];
