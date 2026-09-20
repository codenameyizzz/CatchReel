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
  Sparkles
} from 'lucide-react';
import { ReelItem, ReelStatus } from '@/types/reel';

interface RevisitWidgetProps {
  items: ReelItem[];
  onUpdateStatus: (id: string, status: ReelStatus) => Promise<void>;
}

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
            <Compass size={24} />
          </div>
          <div>
            <h3 className="revisit-title">
              Sesi Tinjau Materi Reels
              {unreviewedItems.length > 0 && (
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '0.74rem',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#FBBF24',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 600,
                  }}
                >
                  {unreviewedItems.length} Menunggu Ditinjau
                </span>
              )}
            </h3>
            <p className="revisit-text">
              Jangan biarkan ilmu dan inspirasi yang Anda simpan menumpuk. Tinjau 1 reels secara berkala setiap hari!
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePickRandom}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Shuffle size={16} />
          Tinjau 1 Reel Acak
        </button>
      </div>

      {/* Review Modal */}
      {activeReviewItem && (
        <div className="modal-overlay" onClick={() => setActiveReviewItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <BookOpen size={20} style={{ color: '#6366F1' }} />
                <span>Materi Reels yang Sedang Ditinjau</span>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span className="badge badge-topic-self" style={{ fontSize: '0.8rem' }}>
                  {activeReviewItem.topic}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Disimpan pada: {activeReviewItem.dateSaved}
                </span>
              </div>

              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {activeReviewItem.title}
                </h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Kreator: <strong>{activeReviewItem.creator}</strong>
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '8px' }}>
                  Poin-Poin Utama untuk Diingat:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeReviewItem.keyPoints.map((point, idx) => (
                    <div key={idx} className="keypoint-item">
                      <span className="keypoint-bullet">{idx + 1}</span>
                      <span style={{ fontSize: '0.9rem' }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {activeReviewItem.actionableTip && (
                <div className="preview-tip" style={{ marginBottom: 0 }}>
                  <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Tindakan yang Disarankan: </strong>
                    {activeReviewItem.actionableTip}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <a
                href={activeReviewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={15} />
                Buka Video di Instagram
              </a>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleMarkAsDone(activeReviewItem)}
              >
                <CheckCircle size={15} />
                Tandai Sudah Selesai Dipelajari
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
