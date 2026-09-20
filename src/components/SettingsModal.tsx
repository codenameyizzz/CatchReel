'use client';

import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  RefreshCw,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { ReelItem } from '@/types/reel';

interface SettingsModalProps {
  onClose: () => void;
  isSheetsConnected: boolean;
  items: ReelItem[];
  onRefreshSheets: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  isSheetsConnected,
  items,
  onRefreshSheets,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    spreadsheetTitle?: string;
    error?: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/sheets/test');
      const data = await res.json();
      setTestResult(data);
      if (data.connected) {
        await onRefreshSheets();
      }
    } catch (err: any) {
      setTestResult({
        connected: false,
        error: err.message || 'Gagal menghubungi server.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `catchreel-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Database size={18} style={{ color: 'var(--color-notion-blue)' }} />
            <span>Pengaturan & Integrasi Cloud</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Connection Status Card */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-buttons)',
              background: isSheetsConnected ? '#f0fdf4' : '#fff8eb',
              border: `1px solid ${isSheetsConnected ? 'rgba(22, 163, 74, 0.2)' : 'rgba(232, 157, 1, 0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isSheetsConnected ? (
                <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
              ) : (
                <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-ink-black)' }}>
                  {isSheetsConnected ? 'Google Sheets Terhubung Aktif' : 'Mode Demo / Local Storage Aktif'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-graphite)' }}>
                  {isSheetsConnected
                    ? 'Data reels Anda tersinkronisasi otomatis ke Google Spreadsheet.'
                    : 'Data saat ini tersimpan di browser Anda. Hubungkan spreadsheet agar tersimpan permanen di cloud.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleTestConnection}
              disabled={testing}
              style={{ whiteSpace: 'nowrap' }}
            >
              {testing ? (
                <Loader2 size={13} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <RefreshCw size={13} />
              )}
              Tes Koneksi
            </button>
          </div>

          {testResult && (
            <div
              style={{
                fontSize: '0.84rem',
                padding: '10px 12px',
                borderRadius: '6px',
                background: testResult.connected ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${testResult.connected ? 'rgba(22, 163, 74, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                color: testResult.connected ? '#166534' : '#991b1b',
              }}
            >
              {testResult.connected ? (
                <>✓ Terhubung ke Spreadsheet: <strong>{testResult.spreadsheetTitle}</strong></>
              ) : (
                <>✕ Gagal: {testResult.error}</>
              )}
            </div>
          )}

          {/* Guide Section */}
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-ink-black)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={15} style={{ color: 'var(--color-notion-blue)' }} />
              Variabel Environment di Vercel:
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p>
                Pastikan dua variabel berikut sudah terdaftar di <strong>Settings &gt; Environment Variables</strong> pada Vercel project Anda:
              </p>
              <div style={{ background: 'var(--color-paper-warmth)', padding: '10px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-charcoal)', border: 'var(--border-hairline)' }}>
                GEMINI_API_KEY=AQ.Ab8RN6L...<br />
                GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
              </div>
            </div>
          </div>

          {/* Android 1-Tap Share Guide */}
          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '14px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-ink-black)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={16} style={{ color: 'var(--color-notion-blue)' }} />
              Simpan 1-Tap dari Instagram (Android)
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p>
                Anda tidak perlu lagi copy-paste link manual! Cukup pasang CatchReel sebagai aplikasi di HP Android Anda:
              </p>
              <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Buka web ini di <strong>Google Chrome</strong> pada HP Android Anda.</li>
                <li>Ketuk menu titik tiga (⋮) di pojok kanan atas Chrome &gt; pilih <strong>&quot;Instal Aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.</li>
                <li>Buka Instagram, saat melihat Reel menarik: ketuk <strong>Share (Pesawat Kertas) &gt; Bagikan ke... &gt; Pilih CatchReel</strong>.</li>
              </ol>
              <div style={{ marginTop: '4px' }}>
                <a
                  href="/share-target"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={13} />
                  Uji Coba Halaman Share Target
                </a>
              </div>
            </div>
          </div>

          {/* Backup & Export */}
          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '14px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink-black)', marginBottom: '6px' }}>
              Cadangan Data (Backup)
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-graphite)' }}>
                Unduh seluruh riwayat reels ({items.length} item) sebagai file JSON.
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportJSON}
                disabled={items.length === 0}
              >
                <Download size={13} />
                Export JSON
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
