'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SaveReelCard } from '@/components/SaveReelCard';
import { RevisitWidget } from '@/components/RevisitWidget';
import { FilterBar } from '@/components/FilterBar';
import { ReelCard } from '@/components/ReelCard';
import { ReelDetailModal } from '@/components/ReelDetailModal';
import { SettingsModal } from '@/components/SettingsModal';
import { INITIAL_MOCK_REELS } from '@/data/mockReels';
import { ReelItem, ReelStatus } from '@/types/reel';
import { CheckCircle2, AlertCircle, Inbox } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'reels_hub_items_v1';

export default function Home() {
  const [items, setItems] = useState<ReelItem[]>([]);
  const [isSheetsConnected, setIsSheetsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [activeDetailItem, setActiveDetailItem] = useState<ReelItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Load items on mount
  const fetchReels = async () => {
    try {
      const res = await fetch('/api/sheets');
      const data = await res.json();

      if (data.connected && Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items);
        setIsSheetsConnected(true);
      } else {
        setIsSheetsConnected(Boolean(data.connected));
        // Check local storage
        const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedLocal) {
          try {
            const parsed = JSON.parse(savedLocal);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setItems(parsed);
              return;
            }
          } catch {
            // ignore
          }
        }
        // Fallback to initial mock reels
        setItems(INITIAL_MOCK_REELS);
      }
    } catch {
      // Offline / fallback to local storage or mock
      const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLocal) {
        try {
          setItems(JSON.parse(savedLocal));
        } catch {
          setItems(INITIAL_MOCK_REELS);
        }
      } else {
        setItems(INITIAL_MOCK_REELS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  // Save to local storage whenever items change
  const persistItems = (newItems: ReelItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    } catch {
      // ignore
    }
  };

  // Add new Reel
  const handleSaveNewReel = async (item: ReelItem) => {
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      const data = await res.json();
      const updated = [item, ...items];
      persistItems(updated);

      if (data.connected) {
        setIsSheetsConnected(true);
        showToast('✓ Berhasil dianalisis dan tersimpan ke Google Sheets!');
      } else {
        showToast('✓ Berhasil disimpan di browser. Hubungkan Google Sheets di Settings untuk sinkronisasi cloud.', 'success');
      }
    } catch (error: any) {
      // Save locally anyway
      const updated = [item, ...items];
      persistItems(updated);
      showToast('Tersimpan di browser lokal.', 'success');
    }
  };

  // Update Status
  const handleUpdateStatus = async (id: string, newStatus: ReelStatus) => {
    const updated = items.map((it) => (it.id === id ? { ...it, status: newStatus } : it));
    persistItems(updated);

    if (activeDetailItem && activeDetailItem.id === id) {
      setActiveDetailItem({ ...activeDetailItem, status: newStatus });
    }

    try {
      await fetch('/api/sheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      showToast(`Status diubah menjadi: ${newStatus}`);
    } catch {
      // locally updated
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    const updated = items.map((it) => (it.id === id ? { ...it, isFavorite } : it));
    persistItems(updated);

    if (activeDetailItem && activeDetailItem.id === id) {
      setActiveDetailItem({ ...activeDetailItem, isFavorite });
    }

    try {
      await fetch('/api/sheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isFavorite }),
      });
      showToast(isFavorite ? 'Ditambahkan ke Favorit ⭐' : 'Dihapus dari Favorit');
    } catch {
      // locally updated
    }
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    persistItems(updated);
    setActiveDetailItem(null);
    showToast('Reel dihapus dari daftar.');
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchCreator = item.creator.toLowerCase().includes(query);
        const matchSummary = item.summary.toLowerCase().includes(query);
        const matchKeyPoints = item.keyPoints.some((kp) => kp.toLowerCase().includes(query));
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(query));

        if (!matchTitle && !matchCreator && !matchSummary && !matchKeyPoints && !matchTags) {
          return false;
        }
      }

      // Topic filter
      if (selectedTopic !== 'all' && item.topic !== selectedTopic) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'favorite') {
        if (!item.isFavorite) return false;
      } else if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedTopic, selectedStatus]);

  const unreviewedCount = useMemo(() => {
    return items.filter((i) => i.status === 'Belum Ditinjau').length;
  }, [items]);

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        totalCount={items.length}
        unreviewedCount={unreviewedCount}
        isSheetsConnected={isSheetsConnected}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Save & AI Extractor Form */}
      <SaveReelCard onSave={handleSaveNewReel} />

      {/* Spaced Revisit Feature (Solves the "Never opened again" issue) */}
      <RevisitWidget items={items} onUpdateStatus={handleUpdateStatus} />

      {/* Filter & Search Toolbar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTopic={selectedTopic}
        onSelectTopic={setSelectedTopic}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
      />

      {/* Grid of Reel Cards */}
      {filteredItems.length > 0 ? (
        <div className="reels-grid">
          {filteredItems.map((item) => (
            <ReelCard
              key={item.id}
              item={item}
              onUpdateStatus={handleUpdateStatus}
              onToggleFavorite={handleToggleFavorite}
              onSelectDetail={(selected) => setActiveDetailItem(selected)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon-box">
            <Inbox size={26} />
          </div>
          <h3 className="empty-title">Tidak ada reels yang sesuai</h3>
          <p className="empty-desc">
            {searchQuery || selectedTopic !== 'all' || selectedStatus !== 'all'
              ? 'Coba ganti kata kunci pencarian atau bersihkan filter yang aktif.'
              : 'Mulai simpan reels inspirasi pertama Anda menggunakan form di atas.'}
          </p>
          {(searchQuery || selectedTopic !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedTopic('all');
                setSelectedStatus('all');
              }}
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {activeDetailItem && (
        <ReelDetailModal
          item={activeDetailItem}
          onClose={() => setActiveDetailItem(null)}
          onUpdateStatus={handleUpdateStatus}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDeleteItem}
        />
      )}

      {/* Settings / Google Sheets Setup Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          isSheetsConnected={isSheetsConnected}
          items={items}
          onRefreshSheets={fetchReels}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            {toast.type === 'error' ? (
              <AlertCircle size={16} style={{ color: '#FB7185' }} />
            ) : (
              <CheckCircle2 size={16} style={{ color: '#34D399' }} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
