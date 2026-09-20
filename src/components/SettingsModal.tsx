'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  RefreshCw,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { ReelItem } from '@/types/reel';

const USER_WEBHOOK_KEY = 'catchreel_user_webhook_v1';

const APPS_SCRIPT_TEMPLATE = `function setupHeaders(sheet) {
  var headers = ['ID', 'Tanggal Simpan', 'Akun / Channel', 'Kategori / Tema', 'Judul', 'Poin-Poin Utama', 'Ringkasan', 'Tips Praktis', 'Link Instagram', 'Status', 'Favorit', 'Tags'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1A2338').setFontColor('#FFFFFF');
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  setupHeaders(sheet);
  var rows = sheet.getDataRange().getValues();
  var items = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row[0]) {
      items.push({
        id: String(row[0]),
        dateSaved: String(row[1]),
        creator: String(row[2]),
        topic: String(row[3]),
        title: String(row[4]),
        keyPoints: String(row[5]).split('\\n').map(function(p) { return p.replace(/^[-•*]\\s*/, '').trim(); }).filter(Boolean),
        summary: String(row[6]),
        actionableTip: String(row[7]),
        url: String(row[8]),
        status: String(row[9]),
        isFavorite: String(row[10]).toLowerCase() === 'true',
        tags: String(row[11]).split(',').map(function(t) { return t.trim(); }).filter(Boolean)
      });
    }
  }
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    title: ss.getName(),
    items: items.reverse()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    setupHeaders(sheet);
    if (data.action === 'append' && data.item) {
      var it = data.item;
      var points = (it.keyPoints || []).map(function(p) { return '• ' + p; }).join('\\n');
      var tags = (it.tags || []).join(', ');
      sheet.appendRow([it.id, it.dateSaved, it.creator, it.topic, it.title, points, it.summary, it.actionableTip || '', it.url, it.status, it.isFavorite ? 'TRUE' : 'FALSE', tags]);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === 'update' && data.id) {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(data.id)) {
          var rowNum = i + 1;
          if (data.updates.status !== undefined) sheet.getRange(rowNum, 10).setValue(data.updates.status);
          if (data.updates.isFavorite !== undefined) sheet.getRange(rowNum, 11).setValue(data.updates.isFavorite ? 'TRUE' : 'FALSE');
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

interface SettingsModalProps {
  onClose: () => void;
  isSheetsConnected: boolean;
  items: ReelItem[];
  onRefreshSheets: () => Promise<void>;
  onDisconnectSheets: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  isSheetsConnected,
  items,
  onRefreshSheets,
  onDisconnectSheets,
}) => {
  const [webhookInput, setWebhookInput] = useState('');
  const [currentWebhook, setCurrentWebhook] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    spreadsheetTitle?: string;
    error?: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(USER_WEBHOOK_KEY);
    if (saved) {
      setCurrentWebhook(saved);
      setWebhookInput(saved);
    }
  }, []);

  const handleSaveAndConnect = async (urlToTest?: string) => {
    const targetUrl = (urlToTest || webhookInput).trim();
    if (!targetUrl) {
      setTestResult({
        connected: false,
        error: 'Silakan masukkan URL Webhook Google Apps Script Anda.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/sheets/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: targetUrl }),
      });
      const data = await res.json();
      setTestResult(data);

      if (data.connected) {
        localStorage.setItem(USER_WEBHOOK_KEY, targetUrl);
        setCurrentWebhook(targetUrl);
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

  const handleDisconnect = () => {
    localStorage.removeItem(USER_WEBHOOK_KEY);
    setCurrentWebhook(null);
    setWebhookInput('');
    setTestResult(null);
    onDisconnectSheets();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
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

  const maskWebhook = (url: string) => {
    if (url.length <= 35) return url;
    return url.slice(0, 32) + '••••••••' + url.slice(-8);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Database size={18} style={{ color: 'var(--color-notion-blue)' }} />
            <span>Penyimpanan & Spreadsheet Pribadi</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Box */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-buttons)',
              background: isSheetsConnected ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${isSheetsConnected ? '#bbf7d0' : '#fef3c7'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {isSheetsConnected ? (
                  <CheckCircle2 size={20} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={20} style={{ color: '#b45309', marginTop: '2px', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-ink-black)' }}>
                    {isSheetsConnected
                      ? 'Google Spreadsheet Pribadi Terhubung'
                      : 'Mode Penyimpanan Lokal (Perangkat Ini)'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-graphite)', marginTop: '2px', lineHeight: 1.5 }}>
                    {isSheetsConnected
                      ? `Reels tersimpan langsung ke Google Spreadsheet milik Anda (${maskWebhook(currentWebhook || '')}).`
                      : 'Koleksi reels Anda saat ini hanya tersimpan di peramban ini. Hubungkan Google Spreadsheet pribadi Anda agar tersimpan permanen di cloud.'}
                  </div>
                </div>
              </div>

              {isSheetsConnected && (
                <button
                  type="button"
                  onClick={() => handleSaveAndConnect()}
                  className="btn btn-outline btn-sm"
                  disabled={testing}
                  title="Segarkan Sinkronisasi"
                >
                  {testing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  <span>Uji</span>
                </button>
              )}
            </div>

            {isSheetsConnected && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--color-coral)', fontSize: '0.8rem' }}
                >
                  <Trash2 size={13} />
                  <span>Putuskan Koneksi Spreadsheet</span>
                </button>
              </div>
            )}
          </div>

          {/* Test Connection Alert */}
          {testResult && (
            <div
              style={{
                fontSize: '0.84rem',
                padding: '10px 14px',
                borderRadius: '6px',
                background: testResult.connected ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${testResult.connected ? '#bbf7d0' : '#fecaca'}`,
                color: testResult.connected ? '#15803d' : '#991b1b',
              }}
            >
              {testResult.connected ? (
                <>✓ Berhasil terhubung ke: <strong>{testResult.spreadsheetTitle}</strong></>
              ) : (
                <>✕ Gagal: {testResult.error}</>
              )}
            </div>
          )}

          {/* Connect / Change Webhook Section */}
          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-ink-black)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--color-notion-blue)' }} />
              {isSheetsConnected ? 'Ganti Spreadsheet Anda' : 'Hubungkan Spreadsheet Anda'}
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-graphite)', marginBottom: '12px' }}>
              Setiap pengguna memiliki Google Spreadsheet masing-masing. Masukkan URL Webhook Google Apps Script dari spreadsheet Anda.
            </p>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className="notion-input"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={() => handleSaveAndConnect()}
                disabled={testing || !webhookInput.trim()}
                className="btn-notion-primary"
                style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
              >
                {testing ? <Loader2 size={15} className="animate-spin" /> : <span>Hubungkan</span>}
              </button>
            </div>

            {/* Accordion Guide: How to create own sheet */}
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="btn-notion-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.83rem' }}
              >
                <ChevronRight
                  size={14}
                  style={{
                    transform: showSetupGuide ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                />
                <span>Belum punya spreadsheet? Klik panduan 1 menit di sini</span>
              </button>

              {showSetupGuide && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'var(--color-paper-warmth)',
                    border: 'var(--border-hairline)',
                    fontSize: '0.83rem',
                    color: 'var(--color-charcoal)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div>
                    <strong>Langkah 1:</strong> Buat salinan template Google Sheet CatchReel ke Google Drive Anda:
                    <div style={{ marginTop: '6px' }}>
                      <a
                        href="https://docs.google.com/spreadsheets/d/1428TU9rqcKAcAaro5vkOfz7WNFaQKSf7eCIV3faCq1w/copy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <ExternalLink size={13} />
                        Buat Salinan Spreadsheet (1-Klik)
                      </a>
                    </div>
                  </div>

                  <div>
                    <strong>Langkah 2:</strong> Salin kode Google Apps Script di bawah ini:
                    <div style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        {copiedCode ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                        <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Kode Webhook Apps Script'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <strong>Langkah 3:</strong> Di spreadsheet Anda, buka menu <strong>Ekstensi &gt; Apps Script</strong>.
                    Tempel kode tersebut, klik <strong>Deploy &gt; New deployment &gt; Web app</strong>.
                    Setel <em>Who has access: Anyone</em>, lalu salin URL Web app tersebut dan tempel ke kolom input di atas.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Android Share Guide */}
          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-ink-black)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={16} style={{ color: 'var(--color-notion-blue)' }} />
              Simpan 1-Tap dari Instagram (Android)
            </h4>
            <div style={{ fontSize: '0.83rem', color: 'var(--color-graphite)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p>
                Anda tidak perlu copy-paste link manual dari Instagram:
              </p>
              <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <li>Buka web ini di <strong>Google Chrome</strong> HP Android Anda.</li>
                <li>Ketuk menu titik tiga (⋮) di Chrome &gt; pilih <strong>&quot;Instal Aplikasi&quot;</strong>.</li>
                <li>Di Instagram, ketuk <strong>Share (Pesawat Kertas) &gt; Bagikan ke... &gt; CatchReel</strong>. Data otomatis masuk ke spreadsheet yang Anda hubungkan!</li>
              </ol>
            </div>
          </div>

          {/* Backup & Export */}
          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink-black)' }}>
                  Cadangan Data Lokal (Backup)
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-graphite)' }}>
                  Unduh koleksi ({items.length} item) sebagai file JSON.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportJSON}
                disabled={items.length === 0}
              >
                <Download size={13} />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
