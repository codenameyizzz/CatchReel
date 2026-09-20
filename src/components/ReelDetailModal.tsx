'use client';

import React, { useState } from 'react';
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
  Edit3
} from 'lucide-react';
import { ReelItem, ReelStatus, ReelTopic } from '@/types/reel';

interface ReelDetailModalProps {
  item: ReelItem;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ReelStatus) => Promise<void>;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onDelete?: (id: string) => void;
}

export const ReelDetailModal: React.FC<ReelDetailModalProps> = ({
  item,
  onClose,
  onUpdateStatus,
  onToggleFavorite,
  onDelete,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span>Detail Materi Reel</span>
            <button
              type="button"
              className={`favorite-btn ${item.isFavorite ? 'active' : ''}`}
              onClick={() => onToggleFavorite(item.id, !item.isFavorite)}
              style={{ marginLeft: '6px' }}
            >
              <Star size={18} fill={item.isFavorite ? '#FBBF24' : 'none'} />
            </button>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Top Meta Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-topic-self" style={{ fontSize: '0.82rem' }}>
                {item.topic}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} />
                <span>{item.dateSaved}</span>
              </div>
            </div>

            {/* Status Selector */}
            <select
              value={item.status}
              onChange={(e) => onUpdateStatus(item.id, e.target.value as ReelStatus)}
              style={{
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
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

          {/* Title & Creator */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>
              <User size={15} />
              <span>{item.creator}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {item.title}
            </h2>
          </div>

          {/* Full Summary */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Ringkasan Konten
            </h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {item.summary}
            </p>
          </div>

          {/* Key Points */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Poin-Poin Utama Pembelajaran
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {item.keyPoints.map((point, idx) => (
                <div key={idx} className="keypoint-item" style={{ background: 'var(--bg-app)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span className="keypoint-bullet">{idx + 1}</span>
                  <span style={{ fontSize: '0.88rem' }}>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Tip */}
          {item.actionableTip && (
            <div className="preview-tip" style={{ marginBottom: 0 }}>
              <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Tips / Tindakan Nyata: </strong>
                {item.actionableTip}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Tag size={14} style={{ color: 'var(--text-muted)' }} />
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.74rem',
                    background: 'var(--bg-app)',
                    color: 'var(--text-secondary)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {onDelete && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onDelete(item.id)}
              style={{ color: '#FB7185', marginRight: 'auto' }}
              title="Hapus dari daftar"
            >
              <Trash2 size={15} />
              Hapus
            </button>
          )}

          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Tutup
          </button>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <ExternalLink size={15} />
            Buka Video di Instagram
          </a>
        </div>
      </div>
    </div>
  );
};
