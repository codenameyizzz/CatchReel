'use client';

import React from 'react';
import {
  Search,
  Layers,
  Compass,
  Languages,
  Palette,
  Cpu,
  TrendingUp,
  GraduationCap,
  Smile,
  Star,
} from 'lucide-react';
import { ReelStatus, ReelTopic } from '@/types/reel';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

const TOPIC_OPTIONS: { label: string; value: string; icon: React.FC<{ size: number }> }[] = [
  { label: 'Semua Kategori', value: 'all', icon: Layers },
  { label: 'Pengembangan Diri', value: 'Pengembangan Diri', icon: Compass },
  { label: 'Bahasa & Komunikasi', value: 'Bahasa & Komunikasi', icon: Languages },
  { label: 'Kreatif & Desain', value: 'Kreatif & Desain', icon: Palette },
  { label: 'Teknologi', value: 'Teknologi', icon: Cpu },
  { label: 'Bisnis & Finansial', value: 'Bisnis & Finansial', icon: TrendingUp },
  { label: 'Karir & Edukasi', value: 'Karir & Edukasi', icon: GraduationCap },
  { label: 'Hiburan & Lainnya', value: 'Hiburan & Lainnya', icon: Smile },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedTopic,
  onSelectTopic,
  selectedStatus,
  onSelectStatus,
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        {/* Search Bar */}
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Cari berdasarkan creator, topik, atau kata kunci..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status Filters */}
        <div className="status-filter-group">
          <button
            type="button"
            className={`status-filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => onSelectStatus('all')}
          >
            Semua
          </button>
          <button
            type="button"
            className={`status-filter-btn ${selectedStatus === 'Belum Ditinjau' ? 'active' : ''}`}
            onClick={() => onSelectStatus('Belum Ditinjau')}
          >
            Belum Ditinjau
          </button>
          <button
            type="button"
            className={`status-filter-btn ${selectedStatus === 'Sedang Dipelajari' ? 'active' : ''}`}
            onClick={() => onSelectStatus('Sedang Dipelajari')}
          >
            Sedang Dipelajari
          </button>
          <button
            type="button"
            className={`status-filter-btn ${selectedStatus === 'Selesai' ? 'active' : ''}`}
            onClick={() => onSelectStatus('Selesai')}
          >
            Selesai
          </button>
          <button
            type="button"
            className={`status-filter-btn ${selectedStatus === 'favorite' ? 'active' : ''}`}
            onClick={() => onSelectStatus('favorite')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Star size={13} fill={selectedStatus === 'favorite' ? '#FBBF24' : 'none'} color="#FBBF24" />
            Favorit
          </button>
        </div>
      </div>

      {/* Topic Category Pills */}
      <div className="topic-pills">
        {TOPIC_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isActive = selectedTopic === item.value;
          return (
            <button
              key={item.value}
              type="button"
              className={`topic-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTopic(item.value)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
