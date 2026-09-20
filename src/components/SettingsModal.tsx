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
  Link as LinkIcon,
  Code2,
} from 'lucide-react';
import { ReelItem } from '@/types/reel';

const USER_TARGET_KEY = 'catchreel_user_webhook_v1';

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
  const [activeTab, setActiveTab] = useState<'link' | 'webhook'>('link');

  // Link mode inputs
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  // Webhook mode inputs
  const [webhookInput, setWebhookInput] = useState('');

  const [currentTarget, setCurrentTarget] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'link' | 'webhook' | null>(null);

  const [botEmail, setBotEmail] = useState<string | null>(null);
  const [copiedBotEmail, setCopiedBotEmail] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    spreadsheetTitle?: string;
    error?: string;
    type?: 'webhook' | 'service_account';
  } | null>(null);

  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    // 1. Load active target from localStorage
    const saved = localStorage.getItem(USER_TARGET_KEY);
    if (saved) {
      setCurrentTarget(saved);
      if (saved.startsWith('https://script.google.com/')) {
        setTargetType('webhook');
        setWebhookInput(saved);
        setActiveTab('webhook');
      } else {
        setTargetType('link');
        setSheetUrlInput(saved);
        setActiveTab('link');
      }
    }

    // 2. Fetch server bot info
    fetch('/api/sheets/bot-info')
      .then((r) => r.json())
      .then((data) => {
        if (data.botEmail) {
          setBotEmail(data.botEmail);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveAndConnect = async (customInput?: string) => {
    const raw = customInput || (activeTab === 'link' ? sheetUrlInput : webhookInput);
    const target = raw.trim();

    if (!target) {
      setTestResult({
        connected: false,
        error: activeTab === 'link'
          ? 'Silakan masukkan tautan Google Sheets Anda.'
          : 'Silakan masukkan URL Webhook Google Apps Script Anda.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/sheets/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      setTestResult(data);

      if (data.connected) {
        localStorage.setItem(USER_TARGET_KEY, target);
        setCurrentTarget(target);
        setTargetType(data.type === 'webhook' ? 'webhook' : 'link');
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
    localStorage.removeItem(USER_TARGET_KEY);
    setCurrentTarget(null);
    setTargetType(null);
    setSheetUrlInput('');
    setWebhookInput('');
    setTestResult(null);
    onDisconnectSheets();
  };

  const handleCopyBotEmail = () => {
    if (!botEmail) return;
    navigator.clipboard.writeText(botEmail);
    setCopiedBotEmail(true);
    setTimeout(() => setCopiedBotEmail(false), 2500);
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

  const maskTarget = (target: string) => {
    if (target.length <= 32) return target;
    return target.slice(0, 24) + '••••••••' + target.slice(-8);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '660px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Database size={18} style={{ color: 'var(--color-notion-blue)' }} />
            <span>Penyimpanan & Spreadsheet Pribadi</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                      ? targetType === 'link'
                        ? 'Google Spreadsheet Terhubung (Mode Link Langsung)'
                        : 'Google Spreadsheet Terhubung (Mode Webhook Apps Script)'
                      : 'Mode Penyimpanan Lokal (Perangkat Ini)'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-graphite)', marginTop: '2px', lineHeight: 1.5 }}>
                    {isSheetsConnected
                      ? `Reels tersimpan langsung ke Google Spreadsheet milik Anda (${maskTarget(currentTarget || '')}).`
                      : 'Koleksi reels Anda saat ini hanya tersimpan di peramban ini. Hubungkan Google Spreadsheet Anda agar tersimpan permanen di cloud.'}
                  </div>
                </div>
              </div>

              {isSheetsConnected && (
                <button
                  type="button"
                  onClick={() => handleSaveAndConnect(currentTarget || '')}
                  className="btn btn-outline btn-sm"
                  disabled={testing}
                  title="Segarkan Koneksi"
                >
                  {testing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  <span>Uji</span>
                </button>
              )}
            </div>

            {isSheetsConnected && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '4px' }}>
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

          {/* Connection Method Tabs */}
          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-ink-black)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--color-notion-blue)' }} />
                Pilih Metode Penghubung Spreadsheet:
              </h4>
            </div>

            {/* Tab Selector Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'var(--color-paper-warmth)',
                padding: '4px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'link' ? 'var(--color-pure-white)' : 'transparent',
                  color: activeTab === 'link' ? 'var(--color-notion-blue)' : 'var(--color-stone)',
                  fontWeight: activeTab === 'link' ? 600 : 500,
                  fontSize: '0.84rem',
                  boxShadow: activeTab === 'link' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <LinkIcon size={14} />
                <span>Tempel Link (Paling Mudah)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('webhook')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'webhook' ? 'var(--color-pure-white)' : 'transparent',
                  color: activeTab === 'webhook' ? 'var(--color-notion-blue)' : 'var(--color-stone)',
                  fontWeight: activeTab === 'webhook' ? 600 : 500,
                  fontSize: '0.84rem',
                  boxShadow: activeTab === 'webhook' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Code2 size={14} />
                <span>Webhook Apps Script</span>
              </button>
            </div>

            {/* TAB 1: DIRECT LINK VIA SERVICE ACCOUNT */}
            {activeTab === 'link' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.82rem',
                    color: 'var(--color-charcoal)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--color-ink-black)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Langkah 1: Bagikan Spreadsheet Anda ke Bot CatchReel</span>
                  </div>
                  <p style={{ color: 'var(--color-graphite)', lineHeight: 1.45 }}>
                    Buka Google Sheet Anda &gt; Klik tombol <strong>Bagikan (Share)</strong> &gt; Masukkan email bot di bawah ini sebagai <strong>Editor</strong>:
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--color-pure-white)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'var(--border-hairline)',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-ink-black)', wordBreak: 'break-all' }}>
                      {botEmail || 'Kredensial Service Account belum disetel di Vercel'}
                    </span>
                    {botEmail && (
                      <button
                        type="button"
                        onClick={handleCopyBotEmail}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.76rem', flexShrink: 0 }}
                      >
                        {copiedBotEmail ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                        <span>{copiedBotEmail ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-ink-black)', marginBottom: '6px' }}>
                    Langkah 2: Tempel Link Google Sheets Anda
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="notion-input"
                      placeholder="https://docs.google.com/spreadsheets/d/1abc.../edit"
                      value={sheetUrlInput}
                      onChange={(e) => setSheetUrlInput(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveAndConnect()}
                      disabled={testing || !sheetUrlInput.trim()}
                      className="btn-notion-primary"
                      style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                    >
                      {testing ? <Loader2 size={15} className="animate-spin" /> : <span>Hubungkan</span>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: APPS SCRIPT WEBHOOK */}
            {activeTab === 'webhook' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-graphite)', lineHeight: 1.5 }}>
                  Metode ini menggunakan Google Apps Script Webhook. Cocok jika Anda ingin mengelola logika spreadsheet sendiri secara independen.
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

                {/* Accordion Guide: How to create own sheet webhook */}
                <div>
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
                    <span>Petunjuk cara membuat Webhook Google Apps Script</span>
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
                        <strong>1. Salin Template Spreadsheet:</strong>
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
                        <strong>2. Salin Kode Google Apps Script:</strong>
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
                        <strong>3. Deploy Web App:</strong> Buka <strong>Ekstensi &gt; Apps Script</strong> pada spreadsheet Anda, tempel kode tersebut, lalu klik <strong>Deploy &gt; New deployment &gt; Web app</strong> (pilih <em>Who has access: Anyone</em>). Salin Web app URL dan tempelkan pada kolom di atas.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Android Share Guide */}
          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-ink-black)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={16} style={{ color: 'var(--color-notion-blue)' }} />
              Simpan 1-Tap dari Instagram (Android)
            </h4>
            <div style={{ fontSize: '0.83rem', color: 'var(--color-graphite)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p>
                Anda tidak perlu copy-paste link manual dari Instagram:
              </p>
              <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <li>Buka web ini di <strong>Google Chrome</strong> HP Android Anda &gt; Titik tiga (⋮) &gt; <strong>&quot;Instal Aplikasi&quot;</strong>.</li>
                <li>Di Instagram, ketuk <strong>Share (Pesawat Kertas) &gt; Bagikan ke... &gt; CatchReel</strong>. Data otomatis tersimpan ke spreadsheet Anda!</li>
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
