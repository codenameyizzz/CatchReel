'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SaveReelCard } from '@/components/SaveReelCard';
import { RevisitWidget } from '@/components/RevisitWidget';
import { FilterBar } from '@/components/FilterBar';
import { ReelCard } from '@/components/ReelCard';
import { ReelDetailModal } from '@/components/ReelDetailModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ReelItem, ReelStatus } from '@/types/reel';
import { CheckCircle2, AlertCircle, Inbox, Database } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'reels_hub_items_v1';
const USER_WEBHOOK_KEY = 'catchreel_user_webhook_v1';

function getUserWebhook(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_WEBHOOK_KEY);
}

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

  // Save to local storage whenever items change
  const persistItems = (newItems: ReelItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    } catch {
      // ignore
    }
  };

  // Load items on mount or when webhook changes
  const fetchReels = async () => {
    setIsLoading(true);
    try {
      const userWebhook = getUserWebhook();
      if (userWebhook) {
        const res = await fetch('/api/sheets', {
          headers: { 'x-sheets-webhook': userWebhook },
        });
        const data = await res.json();

        if (data.connected && Array.isArray(data.items)) {
          setItems(data.items);
          setIsSheetsConnected(true);
          persistItems(data.items);
          return;
        }
      }

      // If no webhook configured on this browser, run in Local-First isolation mode
      setIsSheetsConnected(false);
      const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed)) {
            setItems(parsed);
            return;
          }
        } catch {
          // ignore
        }
      }
      setItems([]);
    } catch {
      // Offline fallback to local storage
      const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLocal) {
        try {
          setItems(JSON.parse(savedLocal));
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  // Add new Reel
  const handleSaveNewReel = async (item: ReelItem) => {
    const userWebhook = getUserWebhook();
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userWebhook ? { 'x-sheets-webhook': userWebhook } : {}),
        },
        body: JSON.stringify({ item, webhookUrl: userWebhook }),
      });

      const data = await res.json();
      const updated = [item, ...items];
      persistItems(updated);

      if (data.connected) {
        setIsSheetsConnected(true);
        showToast('✓ Berhasil dianalisis dan tersimpan ke Google Sheets Anda!');
      } else {
        showToast('✓ Berhasil disimpan di browser. Hubungkan Google Sheets di Pengaturan untuk sinkronisasi cloud.', 'success');
      }
    } catch {
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
      const userWebhook = getUserWebhook();
      await fetch('/api/sheets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(userWebhook ? { 'x-sheets-webhook': userWebhook } : {}),
        },
        body: JSON.stringify({ id, status: newStatus, webhookUrl: userWebhook }),
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
      const userWebhook = getUserWebhook();
      await fetch('/api/sheets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(userWebhook ? { 'x-sheets-webhook': userWebhook } : {}),
        },
        body: JSON.stringify({ id, isFavorite, webhookUrl: userWebhook }),
      });
      showToast(isFavorite ? 'Ditambahkan ke Favorit ⭐' : 'Dihapus dari Favorit');
    } catch {
      // locally updated
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    persistItems(updated);
    if (activeDetailItem?.id === id) {
      setActiveDetailItem(null);
    }
    showToast('Reel dihapus dari daftar lokal.');
  };

  // Filter and Search Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTopic = selectedTopic === 'all' || item.topic === selectedTopic;

      let matchStatus = true;
      if (selectedStatus === 'favorite') {
        matchStatus = item.isFavorite;
      } else if (selectedStatus !== 'all') {
        matchStatus = item.status === selectedStatus;
      }

      return matchSearch && matchTopic && matchStatus;
    });
  }, [items, searchQuery, selectedTopic, selectedStatus]);

  const unreviewedItems = useMemo(() => {
    return items.filter((it) => it.status === 'Belum Ditinjau');
  }, [items]);

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        totalCount={items.length}
        unreviewedCount={unreviewedItems.length}
        isSheetsConnected={isSheetsConnected}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Spaced Review Widget */}
      <RevisitWidget
        items={items}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Quick Capture Input Card */}
      <SaveReelCard onSave={handleSaveNewReel} />

      {/* Local Mode Notice Banner */}
      {!isSheetsConnected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: 'var(--radius-buttons)',
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            marginBottom: '20px',
            fontSize: '0.84rem',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e' }}>
            <Database size={15} style={{ flexShrink: 0 }} />
            <span>
              <strong>Ruang Kerja Pribadi (Mode Lokal):</strong> Koleksi tersimpan di browser ini. Hubungkan Google Spreadsheet pribadi Anda untuk sinkronisasi cloud otomatis.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowSettings(true)}
            style={{ fontSize: '0.8rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
          >
            Hubungkan Spreadsheet
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTopic={selectedTopic}
        onSelectTopic={setSelectedTopic}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
      />

      {/* Main Grid View */}
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
          <h3 className="empty-title">
            {items.length === 0 ? 'Belum Ada Koleksi Reels' : 'Tidak ada reels yang sesuai filter'}
          </h3>
          <p className="empty-desc">
            {items.length === 0
              ? 'Mulai simpan dan rangkum reels atau postingan Instagram edukatif pertama Anda menggunakan formulir di atas.'
              : 'Coba ganti kata kunci pencarian atau bersihkan filter yang aktif.'}
          </p>
          {items.length > 0 && (searchQuery || selectedTopic !== 'all' || selectedStatus !== 'all') && (
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
          onDisconnectSheets={() => {
            setIsSheetsConnected(false);
            showToast('Koneksi Google Spreadsheet diputuskan. Sekarang menggunakan penyimpanan lokal.');
          }}
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
