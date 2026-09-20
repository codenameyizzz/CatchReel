'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { ReelItem } from '@/types/reel';

function ShareTargetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedItem, setSavedItem] = useState<ReelItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    const rawUrl = searchParams.get('url') || '';
    const rawText = searchParams.get('text') || '';
    const rawTitle = searchParams.get('title') || '';

    const combined = [rawUrl, rawText, rawTitle].filter(Boolean).join(' ');

    if (combined) {
      handleSave(combined);
    }
  }, [searchParams]);

  const handleSave = async (input: string) => {
    setStatus('processing');
    setErrorMessage('');

    try {
      const res = await fetch('/api/quick-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan dan merangkum konten Instagram.');
      }

      setSavedItem(data.item);
      setStatus('success');
    } catch (err: any) {
      console.error('Quick save error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat memproses tautan.');
      setStatus('error');
    }
  };

  const handleCopySummary = () => {
    if (!savedItem) return;
    const bullets = (savedItem.keyPoints || []).map((p) => `• ${p}`).join('\n');
    const textToCopy = `${savedItem.title}\nOleh: ${savedItem.creator}\n\nPoin Utama:\n${bullets}\n\nTips: ${savedItem.actionableTip || '-'}\nLink: ${savedItem.url}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackToInstagram = () => {
    // Attempt window.close or history.back for seamless return
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  };

  return (
    <div className="share-target-container">
      {/* Top Navigation */}
      <div className="share-target-header">
        <Link href="/" className="share-target-brand">
          <img src="/icons/icon-192.png" alt="CatchReel" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }} />
          <span>CatchReel</span>
        </Link>
        <button
          onClick={handleBackToInstagram}
          className="share-target-close-btn"
          title="Kembali ke Instagram"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>
      </div>

      <div className="share-target-card">
        {/* Processing State */}
        {status === 'processing' && (
          <div className="share-state-box">
            <div className="notion-spinner-ring"></div>
            <h2 className="share-state-title">Menganalisis Konten...</h2>
            <p className="share-state-desc">
              AI sedang membaca caption, merangkum poin-poin utama, dan menyimpan ke Google Sheets Anda.
            </p>
            <div className="share-pulse-bar">
              <div className="share-pulse-fill"></div>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && savedItem && (
          <div className="share-success-content">
            <div className="share-success-badge">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>Tersimpan di Google Sheets</span>
            </div>

            <div className="share-item-header">
              <div className="share-meta-row">
                <span className="creator-pill">{savedItem.creator}</span>
                <span className="topic-pill">{savedItem.topic}</span>
              </div>
              <h1 className="share-item-title">{savedItem.title}</h1>
            </div>

            {/* Thumbnail Preview if available */}
            {savedItem.thumbnail && (
              <div className="share-thumbnail-wrapper">
                <img
                  src={savedItem.thumbnail}
                  alt={savedItem.title}
                  className="share-thumbnail-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback if direct CDN token expired
                    const target = e.currentTarget;
                    if (savedItem.url) {
                      const match = savedItem.url.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
                      if (match && match[2] && !target.src.includes('/media/?size=l')) {
                        target.src = `https://www.instagram.com/p/${match[2]}/media/?size=l`;
                        return;
                      }
                    }
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Summary */}
            <div className="share-section">
              <h3 className="share-section-title">Ringkasan Materi</h3>
              <p className="share-summary-text">{savedItem.summary}</p>
            </div>

            {/* Key Takeaways */}
            {savedItem.keyPoints && savedItem.keyPoints.length > 0 && (
              <div className="share-section">
                <h3 className="share-section-title">Poin-Poin Utama</h3>
                <ul className="share-bullet-list">
                  {savedItem.keyPoints.map((point, idx) => (
                    <li key={idx} className="share-bullet-item">
                      <span className="bullet-num">{idx + 1}</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actionable Tip */}
            {savedItem.actionableTip && (
              <div className="share-tip-box">
                <div className="share-tip-label">
                  <Sparkles size={14} />
                  <span>Tips Praktis</span>
                </div>
                <p className="share-tip-text">{savedItem.actionableTip}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="share-actions-row">
              <button onClick={handleBackToInstagram} className="btn-notion-primary flex-1">
                Selesai (Kembali)
              </button>
              <button onClick={handleCopySummary} className="btn-notion-secondary" title="Salin Catatan">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
              <Link href="/" className="btn-notion-secondary">
                <Compass size={16} />
                <span>Buka CatchReel</span>
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="share-state-box">
            <div className="error-icon-wrapper">
              <AlertCircle size={32} className="text-coral" />
            </div>
            <h2 className="share-state-title">Gagal Memproses Konten</h2>
            <p className="share-state-desc">{errorMessage}</p>

            <div className="share-actions-row mt-4">
              <button
                onClick={() => {
                  const raw = searchParams.get('url') || searchParams.get('text') || manualUrl;
                  if (raw) handleSave(raw);
                }}
                className="btn-notion-primary"
              >
                <RotateCcw size={16} />
                <span>Coba Lagi</span>
              </button>
              <Link href="/" className="btn-notion-secondary">
                <span>Buka CatchReel</span>
              </Link>
            </div>
          </div>
        )}

        {/* Idle State (No params passed) */}
        {status === 'idle' && (
          <div className="share-state-box">
            <h2 className="share-state-title">Simpan Konten Instagram</h2>
            <p className="share-state-desc">
              Halaman ini otomatis menangkap konten saat Anda memilih &quot;Bagikan ke... &gt; CatchReel&quot; di Instagram.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualUrl.trim()) handleSave(manualUrl);
              }}
              className="share-manual-form"
            >
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="notion-input"
              />
              <button
                type="submit"
                disabled={!manualUrl.trim()}
                className="btn-notion-primary mt-3 w-full"
              >
                <span>Analisis & Simpan</span>
              </button>
            </form>

            <div className="mt-4">
              <Link href="/" className="btn-notion-link">
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShareTargetPage() {
  return (
    <Suspense
      fallback={
        <div className="share-target-container">
          <div className="share-target-card">
            <div className="share-state-box">
              <div className="notion-spinner-ring"></div>
              <p className="share-state-desc">Memuat CatchReel...</p>
            </div>
          </div>
        </div>
      }
    >
      <ShareTargetContent />
    </Suspense>
  );
}
