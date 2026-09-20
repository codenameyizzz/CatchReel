'use client';

import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Download,
  Loader2,
  RefreshCw
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
    downloadAnchor.setAttribute('download', `reels-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Database size={20} style={{ color: '#6366F1' }} />
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
              borderRadius: 'var(--radius-md)',
              background: isSheetsConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isSheetsConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isSheetsConnected ? (
                <CheckCircle2 size={20} style={{ color: '#34D399', flexShrink: 0 }} />
              ) : (
                <AlertCircle size={20} style={{ color: '#FBBF24', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {isSheetsConnected ? 'Google Sheets Terhubung Aktif' : 'Mode Demo / Local Storage Aktif'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {isSheetsConnected
                    ? 'Data reels Anda tersinkronisasi otomatis ke Google Spreadsheet Anda.'
                    : 'Data saat ini tersimpan di browser Anda. Hubungkan spreadsheet agar tersimpan permanen di cloud.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleTestConnection}
              disabled={testing}
              style={{ whiteSpace: 'nowrap' }}
            >
              {testing ? (
                <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <RefreshCw size={14} />
              )}
              Tes Koneksi
            </button>
          </div>

          {testResult && (
            <div
              style={{
                fontSize: '0.84rem',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: testResult.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: `1px solid ${testResult.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                color: testResult.connected ? '#34D399' : '#FB7185',
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
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={16} style={{ color: '#6366F1' }} />
              Cara Menghubungkan Google Sheets & Gemini AI di Vercel:
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p>
                <strong>1. Google Gemini API Key (Gratis):</strong>
                <br />
                Dapatkan API key dari <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#818CF8', textDecoration: 'underline' }}>Google AI Studio</a>. Masukkan ke variabel <code>GEMINI_API_KEY</code>.
              </p>
              <p>
                <strong>2. Google Sheets Service Account:</strong>
                <br />
                Buat spreadsheet baru di Google Drive Anda. Di Google Cloud Console, buat Service Account, lalu bagikan (*share*) spreadsheet tersebut ke email service account Anda sebagai <strong>Editor</strong>.
              </p>
              <p>
                <strong>3. Masukkan Environment Variables di Vercel:</strong>
              </p>
              <div style={{ background: 'var(--bg-app)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.78rem', color: '#CBD5E1', border: '1px solid var(--border-subtle)' }}>
                GEMINI_API_KEY=AIzaSy...<br />
                GOOGLE_SHEET_ID=1A2B3C...<br />
                GOOGLE_SERVICE_ACCOUNT_EMAIL=...iam.gserviceaccount.com<br />
                GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
              </div>
            </div>
          </div>

          {/* Backup & Export */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Backup Data
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Unduh seluruh data reels ({items.length} item) sebagai file JSON.
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportJSON}
                disabled={items.length === 0}
              >
                <Download size={14} />
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
