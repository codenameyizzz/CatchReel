'use client';

import React, { useState } from 'react';
import {
  Link as LinkIcon,
  Sparkles,
  Clipboard,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Tag,
  Loader2,
  X
} from 'lucide-react';
import { ReelItem, ReelTopic } from '@/types/reel';

interface SaveReelCardProps {
  onSave: (item: ReelItem) => Promise<void>;
}

const TOPICS: ReelTopic[] = [
  'Pengembangan Diri',
  'Bahasa & Komunikasi',
  'Kreatif & Desain',
  'Teknologi',
  'Bisnis & Finansial',
  'Karir & Edukasi',
  'Hiburan & Lainnya',
];

export const SaveReelCard: React.FC<SaveReelCardProps> = ({ onSave }) => {
  const [url, setUrl] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualCreator, setManualCreator] = useState('');
  const [manualCaption, setManualCaption] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Analysis result for live preview before committing to Sheets
  const [previewData, setPreviewData] = useState<{
    creator: string;
    title: string;
    originalCaption?: string;
    thumbnail?: string;
    topic: ReelTopic;
    keyPoints: string[];
    summary: string;
    actionableTip: string;
    tags: string[];
  } | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setErrorMsg(null);
      }
    } catch {
      // Clipboard access denied, user can paste manually
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setErrorMsg('Silakan tempel atau masukkan URL Instagram Reel terlebih dahulu.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/analyze-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          manualCaption: manualCaption.trim() || undefined,
          manualCreator: manualCreator.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menganalisis reels.');
      }

      setPreviewData(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses reels.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommitSave = async () => {
    if (!previewData) return;

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const newItem: ReelItem = {
        id: `reel_${Date.now()}`,
        url: url.trim(),
        creator: previewData.creator || '@creator',
        title: previewData.title || 'Inspirasi Reel',
        originalCaption: previewData.originalCaption || previewData.summary,
        thumbnail: previewData.thumbnail,
        topic: previewData.topic,
        dateSaved: today,
        keyPoints: previewData.keyPoints,
        summary: previewData.summary,
        actionableTip: previewData.actionableTip,
        tags: previewData.tags,
        status: 'Belum Ditinjau',
        isFavorite: false,
      };

      await onSave(newItem);

      // Reset form
      setUrl('');
      setManualCreator('');
      setManualCaption('');
      setPreviewData(null);
      setShowManual(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan ke spreadsheet.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="capture-card">
      <div className="capture-header">
        <div>
          <h2 className="capture-title">
            <Sparkles size={18} style={{ color: 'var(--color-notion-blue)' }} />
            Simpan & Analisis Konten Baru
          </h2>
          <p className="capture-desc">
            Tempel tautan Instagram Reels maupun Postingan biasa (Feed / Carousel / Video) untuk ekstraksi poin utama otomatis dengan Gemini AI
          </p>
        </div>
      </div>

      <div className="input-row">
        <div className="input-wrapper">
          <LinkIcon size={17} className="input-icon" />
          <input
            type="text"
            className="main-input"
            placeholder="Tempel tautan Instagram: https://www.instagram.com/reel/... atau /p/..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAnalyze();
            }}
          />
          {url ? (
            <button
              type="button"
              className="input-inline-btn"
              onClick={() => setUrl('')}
              title="Bersihkan"
            >
              <X size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="input-inline-btn"
              onClick={handlePaste}
              title="Tempel dari Clipboard"
            >
              <Clipboard size={15} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !url.trim()}
          className="btn btn-primary"
          style={{ minWidth: '160px' }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              Menganalisis...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Analisis Konten
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FB7185', fontSize: '0.85rem', marginTop: '10px' }}>
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Manual Input Toggle */}
      <div>
        <button
          type="button"
          className="manual-toggle-btn"
          onClick={() => setShowManual(!showManual)}
        >
          {showManual ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{showManual ? 'Sembunyikan opsi manual' : 'Instagram dibatasi / ingin isi caption manual? Klik di sini'}</span>
        </button>

        {showManual && (
          <div className="manual-fields">
            <div className="field-group">
              <label>Nama Akun / Creator (Opsional)</label>
              <input
                type="text"
                className="field-input"
                placeholder="contoh: @mindset.idn"
                value={manualCreator}
                onChange={(e) => setManualCreator(e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Caption / Teks Materi Reels (Opsional)</label>
              <textarea
                className="field-textarea"
                placeholder="Salin teks deskripsi atau caption reels di sini agar Gemini AI menganalisis secara lebih lengkap..."
                value={manualCaption}
                onChange={(e) => setManualCaption(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Analysis Preview Card */}
      {previewData && (
        <div className="preview-box">
          <div className="preview-header">
            <div className="preview-tag">
              <Sparkles size={14} />
              Hasil Ekstraksi Gemini AI
            </div>
            <select
              value={previewData.topic}
              onChange={(e) => setPreviewData({ ...previewData, topic: e.target.value as ReelTopic })}
              style={{
                background: 'var(--color-paper-warmth)',
                color: 'var(--color-charcoal)',
                border: 'var(--border-hairline)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {previewData.thumbnail && (
            <div className="modal-thumbnail-container" style={{ marginBottom: '12px', maxHeight: '180px' }}>
              <img src={previewData.thumbnail} alt={previewData.title} className="modal-thumbnail-img" />
            </div>
          )}

          <div className="preview-grid">
            <div>
              <h3 className="preview-title">{previewData.title}</h3>
              <div className="preview-creator">{previewData.creator}</div>
            </div>
          </div>

          {previewData.originalCaption && (
            <div className="modal-original-caption-box" style={{ marginBottom: '12px' }}>
              <div className="modal-section-label">Deskripsi Asli Postingan:</div>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-charcoal)', lineHeight: 1.5, maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {previewData.originalCaption}
              </p>
            </div>
          )}

          <div className="preview-keypoints">
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
              Poin-Poin Utama Pembelajaran:
            </div>
            {previewData.keyPoints.map((point, idx) => (
              <div key={idx} className="keypoint-item">
                <span className="keypoint-bullet">{idx + 1}</span>
                <span>{point}</span>
              </div>
            ))}
          </div>

          {previewData.actionableTip && (
            <div className="preview-tip">
              <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Tips Praktis: </strong>
                {previewData.actionableTip}
              </div>
            </div>
          )}

          <div className="preview-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPreviewData(null)}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCommitSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Simpan ke Google Sheets
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
