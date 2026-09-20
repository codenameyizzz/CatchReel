'use client';

import React from 'react';
import { Star, Clock, CheckCircle2, BookOpen, ExternalLink } from 'lucide-react';
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
  const topicClass = TOPIC_BADGE_MAP[item.topic] || 'badge-topic-other';

  // Display original untranslated caption or title
  const displayContent = item.originalCaption || item.title;

  const cycleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: ReelStatus = 'Belum Ditinjau';
    if (item.status === 'Belum Ditinjau') nextStatus = 'Sedang Dipelajari';
    else if (item.status === 'Sedang Dipelajari') nextStatus = 'Selesai';
    else if (item.status === 'Selesai') nextStatus = 'Belum Ditinjau';

    await onUpdateStatus(item.id, nextStatus);
  };

  return (
    <div className="reel-card" onClick={() => onSelectDetail(item)}>
      <div>
        {/* Top Meta: Category Badge & Favorite Button */}
        <div className="card-top">
          <div className="card-meta-row">
            <span className={`badge ${topicClass}`}>{item.topic}</span>
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
            <Star size={16} fill={item.isFavorite ? '#ffb110' : 'none'} />
          </button>
        </div>

        {/* Creator Handle */}
        <div className="card-creator">
          <span>{item.creator}</span>
        </div>

        {/* Original Untranslated Caption / Title */}
        <div className="card-original-title" title={displayContent}>
          {displayContent}
        </div>
      </div>

      {/* Footer: Date & Status Badge */}
      <div className="card-footer">
        <span className="card-date">{item.dateSaved}</span>

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
          style={{ cursor: 'pointer' }}
        >
          {item.status === 'Selesai' ? (
            <>
              <CheckCircle2 size={12} /> Selesai
            </>
          ) : item.status === 'Sedang Dipelajari' ? (
            <>
              <BookOpen size={12} /> Sedang Dipelajari
            </>
          ) : (
            <>
              <Clock size={12} /> Belum Ditinjau
            </>
          )}
        </button>
      </div>
    </div>
  );
};
