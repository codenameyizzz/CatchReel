export type ReelTopic =
  | 'Pengembangan Diri'
  | 'Bahasa & Komunikasi'
  | 'Kreatif & Desain'
  | 'Teknologi'
  | 'Bisnis & Finansial'
  | 'Karir & Edukasi'
  | 'Hiburan & Lainnya';

export type ReelStatus = 'Belum Ditinjau' | 'Sedang Dipelajari' | 'Selesai';

export interface ReelItem {
  id: string;
  url: string;
  creator: string; // e.g., @creativename
  title: string;
  topic: ReelTopic;
  dateSaved: string; // YYYY-MM-DD or formatted
  keyPoints: string[]; // 3-5 main points
  summary: string; // Full summary
  actionableTip?: string; // Practical tip
  tags: string[];
  status: ReelStatus;
  isFavorite: boolean;
  notes?: string;
}

export interface AnalyzeReelRequest {
  url: string;
  manualCaption?: string;
  manualCreator?: string;
}

export interface AnalyzeReelResponse {
  success: boolean;
  data?: {
    creator: string;
    title: string;
    topic: ReelTopic;
    keyPoints: string[];
    summary: string;
    actionableTip: string;
    tags: string[];
  };
  error?: string;
}

export interface SheetsSyncResponse {
  success: boolean;
  connected: boolean;
  items?: ReelItem[];
  error?: string;
  sheetTitle?: string;
}
