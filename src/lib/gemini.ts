import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReelTopic } from '@/types/reel';

export interface GeminiAnalysisResult {
  creator: string;
  title: string;
  topic: ReelTopic;
  keyPoints: string[];
  summary: string;
  actionableTip: string;
  tags: string[];
}

const VALID_TOPICS: ReelTopic[] = [
  'Pengembangan Diri',
  'Bahasa & Komunikasi',
  'Kreatif & Desain',
  'Teknologi',
  'Bisnis & Finansial',
  'Karir & Edukasi',
  'Hiburan & Lainnya',
];

export async function analyzeReelWithGemini(params: {
  url: string;
  caption?: string;
  extractedCreator?: string;
  apiKey?: string;
}): Promise<GeminiAnalysisResult> {
  const apiKey = params.apiKey || process.env.GEMINI_API_KEY;

  // Fallback if no API key is provided
  if (!apiKey) {
    return generateFallbackAnalysis(params);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model sequence: Primary (gemini-3.5-flash-lite) -> Fallback (gemini-3.8-live) -> Standard (gemini-1.5-flash)
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-live',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];

    let lastError: any = null;
    let text: string | null = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const prompt = `
Anda adalah analis dan kurator konten Instagram Reels edukatif & inspiratif.
Tugas Anda adalah membaca dan menganalisis caption/deskripsi reels di bawah ini, lalu merangkum penjelasan serta wawasannya menjadi catatan pembelajaran yang padat dan berbobot.

Informasi Reels:
- URL: ${params.url}
- Deteksi Creator Awal: ${params.extractedCreator || 'Belum diketahui'}
- Teks Caption & Konten Asli Reels:
"""
${params.caption || 'Tidak ada teks caption tambahan.'}
"""

Instruksi Analisis:
1. Nama Creator: Jika "Deteksi Creator Awal" sudah ada (misal @narado_n atau @elev8ted.path), gunakan itu. Jika belum, cari apakah ada mention @username di dalam teks. Jangan pernah menghasilkan "@unknown".
2. Poin-Poin Utama: Ekstrak secara spesifik konsep, formula, metode, nama framework, kosa kata, atau langkah nyata yang dibahas di dalam caption. Jangan gunakan kalimat klise generik (seperti "ide penting yang dibagikan"). Sebutkan hal-hal konkret yang diajarkan kreator.
3. Ringkasan: Rangkum inti penjelasan video dalam 2-3 kalimat yang berbobot dan informatif.
4. Tips Praktis: Tuliskan 1 langkah nyata yang bisa langsung dipraktekkan penonton dari konten ini.

Format JSON Output:
{
  "creator": "Username pembuat diawali @ (contoh: @elev8ted.path)",
  "title": "Judul materi yang representatif dan informatif (maksimal 7 kata)",
  "topic": "Pilih SALAH SATU secara persis dari: 'Pengembangan Diri' | 'Bahasa & Komunikasi' | 'Kreatif & Desain' | 'Teknologi' | 'Bisnis & Finansial' | 'Karir & Edukasi' | 'Hiburan & Lainnya'",
  "keyPoints": [
    "Poin konkret 1...",
    "Poin konkret 2...",
    "Poin konkret 3..."
  ],
  "summary": "Ringkasan penjelasan materi dari caption reels.",
  "actionableTip": "Tindakan praktis yang bisa langsung diterapkan penonton.",
  "tags": ["tag1", "tag2", "tag3"]
}

Gunakan Bahasa Indonesia yang baik, natural, tajam, dan mendidik.
`;

        const response = await model.generateContent(prompt);
        text = response.response.text();
        if (text) {
          console.log(`[Gemini] Analisis berhasil menggunakan model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`[Gemini] Model ${modelName} gagal atau tidak tersedia: ${err?.message || err}. Mencoba model berikutnya...`);
        lastError = err;
      }
    }

    if (!text) {
      console.warn('[Gemini] Semua kandidat model gagal, beralih ke heuristic fallback:', lastError);
      return generateFallbackAnalysis(params);
    }
    const parsed = JSON.parse(text) as GeminiAnalysisResult;

    // Validate and sanitize topic
    const topic = VALID_TOPICS.includes(parsed.topic) ? parsed.topic : 'Pengembangan Diri';

    return {
      creator: parsed.creator?.startsWith('@') ? parsed.creator : `@${parsed.creator || 'instagram_creator'}`,
      title: parsed.title || 'Inspirasi Instagram Reel',
      topic,
      keyPoints: Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0
        ? parsed.keyPoints.slice(0, 5)
        : ['Pelajari konsep utama dalam video reel ini.', 'Catat poin penting untuk diaplikasikan.'],
      summary: parsed.summary || 'Konten edukasi dan inspirasi dari Instagram Reels.',
      actionableTip: parsed.actionableTip || 'Simpan dan tinjau kembali poin di atas saat dibutuhkan.',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : ['reels', 'inspirasi'],
    };
  } catch (error) {
    console.warn('Gemini API call failed, using heuristic fallback:', error);
    return generateFallbackAnalysis(params);
  }
}

function generateFallbackAnalysis(params: {
  url: string;
  caption?: string;
  extractedCreator?: string;
}): GeminiAnalysisResult {
  const rawCaption = (params.caption || '').trim();
  const creator = params.extractedCreator || '@creator';

  // Basic topic heuristics based on keywords in caption
  const lower = rawCaption.toLowerCase();
  let topic: ReelTopic = 'Pengembangan Diri';

  if (lower.includes('english') || lower.includes('bahasa') || lower.includes('vocab') || lower.includes('speaking') || lower.includes('grammar')) {
    topic = 'Bahasa & Komunikasi';
  } else if (lower.includes('design') || lower.includes('canva') || lower.includes('figma') || lower.includes('video') || lower.includes('kreatif') || lower.includes('photo')) {
    topic = 'Kreatif & Desain';
  } else if (lower.includes('coding') || lower.includes('ai') || lower.includes('tech') || lower.includes('software') || lower.includes('chatgpt') || lower.includes('tools')) {
    topic = 'Teknologi';
  } else if (lower.includes('bisnis') || lower.includes('uang') || lower.includes('investasi') || lower.includes('saham') || lower.includes('omset') || lower.includes('finance')) {
    topic = 'Bisnis & Finansial';
  } else if (lower.includes('karir') || lower.includes('interview') || lower.includes('kerja') || lower.includes('kuliah') || lower.includes('skripsi')) {
    topic = 'Karir & Edukasi';
  } else if (lower.includes('lucu') || lower.includes('meme') || lower.includes('komedi') || lower.includes('hiburan')) {
    topic = 'Hiburan & Lainnya';
  }

  // Extract simple points from sentences
  const sentences = rawCaption.split(/[.\n!]/).map(s => s.trim()).filter(s => s.length > 15);
  const keyPoints = sentences.length >= 2
    ? sentences.slice(0, 3).map(s => s.replace(/^[-•*0-9.]+\s*/, ''))
    : [
        'Ide penting yang dibagikan oleh kreator dalam video.',
        'Wawasan menarik untuk diterapkan dalam kegiatan harian.',
        'Referensi pembelajaran yang layak ditinjau kembali.'
      ];

  const title = sentences[0]
    ? sentences[0].slice(0, 45) + (sentences[0].length > 45 ? '...' : '')
    : 'Catatan & Insight Reels';

  return {
    creator,
    title,
    topic,
    keyPoints,
    summary: rawCaption.length > 30 ? rawCaption.slice(0, 200) + '...' : 'Konten pembelajaran dan inspirasi dari reels Instagram.',
    actionableTip: 'Review dan pelajari kembali teknik atau referensi yang ada pada video ini.',
    tags: [topic.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-'), 'reels-saver'],
  };
}
