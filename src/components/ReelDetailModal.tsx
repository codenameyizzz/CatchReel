'use client';

import React from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  Lightbulb,
  Calendar,
  User,
  Star,
  Tag,
  Trash2,
  Copy,
  Check,
  BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import { ReelItem, ReelStatus, ReelTopic } from '@/types/reel';

interface ReelDetailModalProps {
  item: ReelItem;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ReelStatus) => Promise<void>;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onDelete?: (id: string) => void;
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

export const ReelDetailModal: React.FC<ReelDetailModalProps> = ({
  item,
  onClose,
  onUpdateStatus,
  onToggleFavorite,
  onDelete,
}) => {
  const [copied, setCopied] = React.useState(false);

  const topicClass = TOPIC_BADGE_MAP[item.topic] || 'badge-topic-other';
  const originalText = item.originalCaption || item.title;

  const handleCopy = async () => {
    const textToCopy = `Kreator: ${item.creator}\nTopik: ${item.topic}\n\nPoin Utama:\n${item.keyPoints.map(p => `• ${p}`).join('\n')}\n\nLink: ${item.url}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span>Detail Materi Reel</span>
            <button
              type="button"
              className={`favorite-btn ${item.isFavorite ? 'active' : ''}`}
              onClick={() => onToggleFavorite(item.id, !item.isFavorite)}
              style={{ marginLeft: '4px' }}
              title={item.isFavorite ? 'Hapus dari Favorit' : 'Tandai Favorit'}
            >
              <Star size={18} fill={item.isFavorite ? '#ffb110' : 'none'} />
            </button>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Thumbnail Preview */}
          {item.thumbnail && (
            <div className="modal-thumbnail-container">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="modal-thumbnail-img"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Meta Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${topicClass}`} style={{ fontSize: '0.8rem' }}>
                {item.topic}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--color-stone)' }}>
                <Calendar size={13} />
                <span>{item.dateSaved}</span>
              </div>
            </div>

            {/* Status Selector */}
            <select
              value={item.status}
              onChange={(e) => onUpdateStatus(item.id, e.target.value as ReelStatus)}
              style={{
                background: 'var(--color-paper-warmth)',
                color: 'var(--color-charcoal)',
                border: 'var(--border-hairline)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <option value="Belum Ditinjau">Belum Ditinjau</option>
              <option value="Sedang Dipelajari">Sedang Dipelajari</option>
              <option value="Selesai">Selesai & Dipahami</option>
            </select>
          </div>

          {/* Creator & Title */}
          <div>
            <a
              href={item.url}
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
              title="Kunjungi akun kreator di Instagram"
            >
              <User size={15} />
              <span>{item.creator}</span>
              <ExternalLink size={12} />
            </a>
            <h2 style={{ fontSize: '1.22rem', fontWeight: 700, color: 'var(--color-ink-black)', letterSpacing: '-0.02em', lineHeight: 1.35 }}>
              {item.title}
            </h2>
          </div>

          {/* Original Caption Box */}
          <div className="modal-original-caption-box">
            <div className="modal-section-label">
              Deskripsi Asli Postingan (Instagram)
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-charcoal)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {originalText}
            </p>
          </div>

          {/* AI Insights Section */}
          <div className="modal-ai-section">
            <div className="modal-section-label" style={{ color: 'var(--color-notion-blue)' }}>
              Hasil Analisis & Rangkuman (Gemini AI)
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--color-graphite)', lineHeight: 1.55, marginBottom: '12px' }}>
              {item.summary}
            </p>

            {/* Key Points */}
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '8px' }}>
              Poin-Poin Utama Pembelajaran:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {item.keyPoints.map((point, idx) => (
                <div key={idx} className="keypoint-item">
                  <span className="keypoint-bullet">{idx + 1}</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-charcoal)' }}>{point}</span>
                </div>
              ))}
            </div>

            {/* Actionable Tip */}
            {item.actionableTip && (
              <div className="preview-tip" style={{ marginBottom: 0 }}>
                <Lightbulb size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Tips Praktis: </strong>
                  {item.actionableTip}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Tag size={13} style={{ color: 'var(--color-stone)' }} />
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.74rem',
                    background: 'var(--color-paper-warmth)',
                    color: 'var(--color-stone)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pills)',
                    border: 'var(--border-hairline)',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {onDelete && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onDelete(item.id)}
              style={{ color: 'var(--color-coral)', marginRight: 'auto' }}
              title="Hapus dari daftar"
            >
              <Trash2 size={15} />
              Hapus
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleCopy}
            title="Salin Poin Pembelajaran"
          >
            {copied ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
            {copied ? 'Tersalin' : 'Salin Poin'}
          </button>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <ExternalLink size={15} />
            Buka Postingan di Instagram
          </a>
        </div>
      </div>
    </div>
  );
};
