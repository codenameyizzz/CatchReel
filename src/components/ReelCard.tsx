'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Star,
  CheckCircle2,
  Copy,
  Check,
  MoreHorizontal,
  Clock,
  BookOpen
} from 'lucide-react';
import { ReelItem, ReelStatus, ReelTopic } from '@/types/reel';

interface ReelCardProps {
  item: ReelItem;
  onUpdateStatus: (id: string, status: ReelStatus) => Promise<void>;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onSelectDetail: (item: ReelItem) => void;
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

export const ReelCard: React.FC<ReelCardProps> = ({
  item,
  onUpdateStatus,
  onToggleFavorite,
  onSelectDetail,
}) => {
  const [copied, setCopied] = useState(false);

  const topicClass = TOPIC_BADGE_MAP[item.topic] || 'badge-topic-other';

  const handleCopySummary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `📌 ${item.title}\nKreator: ${item.creator}\nTopik: ${item.topic}\n\nPoin Utama:\n${item.keyPoints.map((p) => `• ${p}`).join('\n')}\n\nLink: ${item.url}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const cycleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: ReelStatus = 'Belum Ditinjau';
    if (item.status === 'Belum Ditinjau') nextStatus = 'Sedang Dipelajari';
    else if (item.status === 'Sedang Dipelajari') nextStatus = 'Selesai';
    else if (item.status === 'Selesai') nextStatus = 'Belum Ditinjau';

    await onUpdateStatus(item.id, nextStatus);
  };

  return (
    <div className="reel-card" onClick={() => onSelectDetail(item)} style={{ cursor: 'pointer' }}>
      <div>
        {/* Top Meta */}
        <div className="card-top">
          <div className="card-meta-row">
            <span className={`badge ${topicClass}`}>{item.topic}</span>
            <span className="card-date">{item.dateSaved}</span>
          </div>

          <button
            type="button"
            className={`favorite-btn ${item.isFavorite ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id, !item.isFavorite);
            }}
            title={item.isFavorite ? 'Hapus dari Favorit' : 'Tandai Favorit'}
          >
            <Star size={16} fill={item.isFavorite ? '#FBBF24' : 'none'} />
          </button>
        </div>

        {/* Creator & Title */}
        <div style={{ marginBottom: '6px' }}>
          <span className="card-creator">{item.creator}</span>
        </div>
        <h3 className="card-title">{item.title}</h3>

        {/* Summary */}
        <p className="card-summary">{item.summary}</p>

        {/* Key Points Takeaway */}
        <div className="card-points-list">
          {item.keyPoints.slice(0, 3).map((point, idx) => (
            <div key={idx} className="card-point-item">
              <CheckCircle2 size={14} />
              <span>{point}</span>
            </div>
          ))}
          {item.keyPoints.length > 3 && (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              +{item.keyPoints.length - 3} poin lainnya...
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="card-footer">
        {/* Status Toggle Button */}
        <button
          type="button"
          onClick={cycleStatus}
          className={`badge ${
            item.status === 'Selesai'
              ? 'badge-status-done'
              : item.status === 'Sedang Dipelajari'
              ? 'badge-status-learning'
              : 'badge-status-pending'
          }`}
          title="Klik untuk mengubah status tinjau"
          style={{ cursor: 'pointer', border: 'none' }}
        >
          {item.status === 'Selesai' ? (
            <>
              <CheckCircle2 size={13} /> Selesai
            </>
          ) : item.status === 'Sedang Dipelajari' ? (
            <>
              <BookOpen size={13} /> Dipelajari
            </>
          ) : (
            <>
              <Clock size={13} /> Belum Ditinjau
            </>
          )}
        </button>

        <div className="card-actions-group">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleCopySummary}
            title="Salin Poin & Ringkasan"
          >
            {copied ? <Check size={14} style={{ color: '#34D399' }} /> : <Copy size={14} />}
          </button>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            onClick={(e) => e.stopPropagation()}
            title="Buka di Instagram"
          >
            <ExternalLink size={14} />
            Buka Reel
          </a>
        </div>
      </div>
    </div>
  );
};
