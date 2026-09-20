'use client';

import React, { useState } from 'react';
import {
  Compass,
  Shuffle,
  ExternalLink,
  CheckCircle,
  BookOpen,
  Lightbulb,
  X,
  User,
  Calendar
} from 'lucide-react';
import { ReelItem, ReelStatus, ReelTopic } from '@/types/reel';

interface RevisitWidgetProps {
  items: ReelItem[];
  onUpdateStatus: (id: string, status: ReelStatus) => Promise<void>;
}

const TOPIC_BADGE_MAP: Record<ReelTopic, string> = {
  'Pengembangan Diri': 'badge-topic-self',
  'Bahasa & Komunikasi': 'badge-topic-lang',
  'Kreatif & Desain': 'badge-topic-creative',
  'Teknologi': 'badge-topic-tech',
  'Bisnis & Finansial': 'badge-topic-biz',
  'Karir & Edukasi': 'badge-topic-career',
  'Hiburan & Lainnya': 'badge-topic-other',
};

export const RevisitWidget: React.FC<RevisitWidgetProps> = ({ items, onUpdateStatus }) => {
  const [activeReviewItem, setActiveReviewItem] = useState<ReelItem | null>(null);

  const unreviewedItems = items.filter((item) => item.status === 'Belum Ditinjau');

  const handlePickRandom = () => {
    if (items.length === 0) return;

    // Prefer unreviewed items, otherwise any item
    const candidates = unreviewedItems.length > 0 ? unreviewedItems : items;
    const randomIndex = Math.floor(Math.random() * candidates.length);
    setActiveReviewItem(candidates[randomIndex]);
  };

  const handleMarkAsDone = async (item: ReelItem) => {
    await onUpdateStatus(item.id, 'Selesai');
    setActiveReviewItem(null);
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className="revisit-banner">
        <div className="revisit-content">
          <div className="revisit-icon-box">
            <Compass size={22} />
          </div>
          <div>
            <h3 className="revisit-title">
              Sesi Tinjau Materi Reels
              {unreviewedItems.length > 0 && (
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '0.74rem',
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 600,
                  }}
                >
                  {unreviewedItems.length} Menunggu Ditinjau
                </span>
              )}
            </h3>
            <p className="revisit-text">
              Jangan biarkan inspirasi tersimpan menumpuk. Luangkan 1 menit untuk meninjau satu materi acak hari ini.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePickRandom}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Shuffle size={15} />
          Tinjau 1 Reel Acak
        </button>
      </div>

      {/* Review Modal */}
      {activeReviewItem && (
        <div className="modal-overlay" onClick={() => setActiveReviewItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <BookOpen size={18} style={{ color: 'var(--color-notion-blue)' }} />
                <span>Sesi Belajar & Tinjau Konten</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setActiveReviewItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Thumbnail if available */}
              {activeReviewItem.thumbnail && (
                <div className="modal-thumbnail-container">
                  <img
                    src={activeReviewItem.thumbnail}
                    alt={activeReviewItem.title}
                    className="modal-thumbnail-img"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span className={`badge ${TOPIC_BADGE_MAP[activeReviewItem.topic] || 'badge-topic-other'}`} style={{ fontSize: '0.8rem' }}>
                  {activeReviewItem.topic}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--color-stone)' }}>
                  <Calendar size={13} />
                  <span>{activeReviewItem.dateSaved}</span>
                </div>
              </div>

              <div>
                <a
                  href={activeReviewItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    color: 'var(--color-notion-blue)',
                    marginBottom: '4px',
                  }}
                >
                  <User size={15} />
                  <span>{activeReviewItem.creator}</span>
                  <ExternalLink size={12} />
                </a>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-ink-black)', letterSpacing: '-0.02em', lineHeight: 1.35 }}>
                  {activeReviewItem.title}
                </h2>
              </div>

              {/* Original caption box */}
              {activeReviewItem.originalCaption && (
                <div className="modal-original-caption-box">
                  <div className="modal-section-label">Deskripsi Asli Postingan</div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-charcoal)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {activeReviewItem.originalCaption}
                  </p>
                </div>
              )}

              {/* AI Key takeaways */}
              <div className="modal-ai-section">
                <div className="modal-section-label" style={{ color: 'var(--color-notion-blue)' }}>
                  Poin-Poin Utama Pembelajaran:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  {activeReviewItem.keyPoints.map((point, idx) => (
                    <div key={idx} className="keypoint-item">
                      <span className="keypoint-bullet">{idx + 1}</span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--color-charcoal)' }}>{point}</span>
                    </div>
                  ))}
                </div>

                {activeReviewItem.actionableTip && (
                  <div className="preview-tip" style={{ marginBottom: 0 }}>
                    <Lightbulb size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Tindakan yang Disarankan: </strong>
                      {activeReviewItem.actionableTip}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <a
                href={activeReviewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                <ExternalLink size={14} />
                Buka Postingan di Instagram
              </a>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleMarkAsDone(activeReviewItem)}
              >
                <CheckCircle size={14} />
                Tandai Sudah Selesai Dipelajari
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
