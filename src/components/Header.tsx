'use client';

import React from 'react';
import { BookmarkCheck, Settings, Database, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  totalCount: number;
  unreviewedCount: number;
  isSheetsConnected: boolean;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  unreviewedCount,
  isSheetsConnected,
  onOpenSettings,
}) => {
  return (
    <header className="header">
      <div className="brand-section">
        <div className="brand-icon-box" style={{ overflow: 'hidden', padding: 0 }}>
          <img src="/icons/icon-192.png" alt="CatchReel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div className="brand-title">
            CatchReel
            <span className="brand-badge">Tracker & AI Hub</span>
          </div>
          <p className="brand-subtitle">
            Koleksi, rangkum, dan pelajari kembali reels edukasi Anda
          </p>
        </div>
      </div>

      <div className="header-actions">
        <div className="stats-summary">
          <div className="stat-item" title="Total reels tersimpan">
            <span>Tersimpan:</span>
            <span className="stat-val">{totalCount}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item" title="Reels yang belum ditinjau kembali">
            <span style={{ color: unreviewedCount > 0 ? '#FBBF24' : 'inherit' }}>
              Perlu Ditinjau:
            </span>
            <span className="stat-val" style={{ color: unreviewedCount > 0 ? '#FBBF24' : 'inherit' }}>
              {unreviewedCount}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="btn btn-secondary btn-sm"
          title="Pengaturan Google Sheets & Gemini AI"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {isSheetsConnected ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontWeight: 600 }}>
              <CheckCircle2 size={14} /> Sheets Terhubung
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#d97706', fontWeight: 600 }}>
              <AlertCircle size={14} /> Setup Sheets
            </span>
          )}
          <Settings size={14} style={{ marginLeft: '2px', color: 'var(--color-stone)' }} />
        </button>
      </div>
    </header>
  );
};
