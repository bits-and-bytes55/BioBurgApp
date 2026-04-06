import { useState, useEffect, useCallback } from "react";
import axios from "axios";
const BASE_API = import.meta.env.VITE_API_BASE_URL;


const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,600;0,700;1,300&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --ink: #0c1a2e; --ink2: #1e3553; --side-bg: #0c1a2e; --side-accent: #16a085;
  --teal: #0d9488; --teal-lt: #ccfbf1; --amber: #f59e0b; --amber-lt: #fef3c7;
  --rose: #e11d48; --rose-lt: #ffe4e6; --sky: #0284c7; --sky-lt: #e0f2fe;
  --muted: #64748b; --border: #e2e8f0; --bg: #f8fafc; --card: #ffffff;
  --radius: 12px; --shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06);
  --shadow-lg: 0 8px 32px rgba(0,0,0,.12);
}

.pd-app { display: flex; min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--ink); }

.pd-sidebar { width: 240px; min-height: 100vh; background: var(--side-bg); display: flex; flex-direction: column; flex-shrink: 0; position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; transition: transform .3s ease; }
.pd-sidebar-logo { padding: 28px 24px 20px; border-bottom: 1px solid rgba(255,255,255,.08); }
.pd-sidebar-logo-mark { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -.3px; }
.pd-sidebar-logo-sub { font-size: 10px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--side-accent); margin-top: 2px; }
.pd-nav { padding: 16px 12px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
.pd-nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; color: rgba(255,255,255,.55); transition: all .18s ease; border: none; background: none; width: 100%; text-align: left; }
.pd-nav-item:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.9); }
.pd-nav-item.active { background: var(--teal); color: #fff; }
.pd-nav-item svg { width: 18px; height: 18px; flex-shrink: 0; opacity: .8; }
.pd-nav-item.active svg { opacity: 1; }
.pd-nav-divider { height: 1px; background: rgba(255,255,255,.08); margin: 8px 0; }
.pd-sidebar-footer { padding: 16px 24px; border-top: 1px solid rgba(255,255,255,.08); font-size: 12px; color: rgba(255,255,255,.3); }

.pd-main { margin-left: 240px; flex: 1; min-height: 100vh; display: flex; flex-direction: column; }

.pd-topbar { background: var(--card); border-bottom: 1px solid var(--border); padding: 0 28px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
.pd-topbar-title { font-family: 'Fraunces', serif; font-size: 21px; font-weight: 600; color: var(--ink); }
.pd-topbar-right { display: flex; align-items: center; gap: 12px; }
.pd-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--teal); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; flex-shrink: 0; }
.pd-partner-name { font-size: 13px; font-weight: 500; color: var(--ink2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }

.pd-content { padding: 28px; flex: 1; }

.pd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.pd-stat-card { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; border: 1px solid var(--border); position: relative; overflow: hidden; transition: transform .2s, box-shadow .2s; }
.pd-stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.pd-stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
.pd-stat-card.c-teal::before { background: var(--teal); }
.pd-stat-card.c-amber::before { background: var(--amber); }
.pd-stat-card.c-sky::before { background: var(--sky); }
.pd-stat-card.c-rose::before { background: var(--rose); }
.pd-stat-label { font-size: 11px; font-weight: 600; letter-spacing: .8px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
.pd-stat-val { font-family: 'Fraunces', serif; font-size: 36px; font-weight: 700; line-height: 1; color: var(--ink); }
.pd-stat-icon { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; opacity: .1; }
.pd-stat-icon svg { width: 20px; height: 20px; }
.pd-stat-card.c-teal .pd-stat-icon { background: var(--teal); }
.pd-stat-card.c-amber .pd-stat-icon { background: var(--amber); }
.pd-stat-card.c-sky .pd-stat-icon { background: var(--sky); }
.pd-stat-card.c-rose .pd-stat-icon { background: var(--rose); }

.pd-section-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
.pd-section-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; color: var(--ink); }
.pd-section-sub { font-size: 13px; color: var(--muted); margin-top: 2px; }

.pd-table-card { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid var(--border); overflow: hidden; }
.pd-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.pd-table { width: 100%; border-collapse: collapse; min-width: 540px; }
.pd-table thead { background: #f8fafc; }
.pd-table th { padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--border); white-space: nowrap; }
.pd-table td { padding: 13px 15px; font-size: 13px; color: var(--ink2); border-bottom: 1px solid #f1f5f9; }
.pd-table tr:last-child td { border-bottom: none; }
.pd-table tbody tr { transition: background .15s; cursor: pointer; }
.pd-table tbody tr:hover { background: #f8fafc; }

.pd-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: .3px; white-space: nowrap; }
.pd-chip.pending  { background: var(--amber-lt); color: #92400e; }
.pd-chip.completed, .pd-chip.approved { background: var(--teal-lt); color: #065f46; }
.pd-chip.cancelled { background: var(--rose-lt); color: #9f1239; }
.pd-chip.confirmed { background: var(--sky-lt); color: #0c4a6e; }
.pd-chip::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

.pd-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .18s; border: none; white-space: nowrap; }
.pd-btn-primary { background: var(--teal); color: #fff; }
.pd-btn-primary:hover { background: #0f766e; }
.pd-btn-primary:disabled { background: var(--muted); cursor: not-allowed; opacity: .7; }
.pd-btn-ghost { background: transparent; color: var(--teal); border: 1.5px solid var(--teal); }
.pd-btn-ghost:hover { background: var(--teal-lt); }
.pd-btn-sm { padding: 5px 11px; font-size: 12px; }

.pd-search-wrap { position: relative; }
.pd-search-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--muted); pointer-events: none; }
.pd-search { padding: 8px 12px 8px 32px; border: 1.5px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; background: var(--bg); outline: none; transition: all .2s; width: 220px; }
.pd-search:focus { border-color: var(--teal); background: #fff; box-shadow: 0 0 0 3px rgba(13,148,136,.1); }

.pd-drawer-overlay { position: fixed; inset: 0; background: rgba(12,26,46,.5); backdrop-filter: blur(4px); z-index: 200; opacity: 0; transition: opacity .25s; pointer-events: none; }
.pd-drawer-overlay.open { opacity: 1; pointer-events: all; }
.pd-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 600px; background: var(--card); z-index: 201; overflow-y: auto; transform: translateX(100%); transition: transform .3s cubic-bezier(.4,0,.2,1); box-shadow: -8px 0 40px rgba(0,0,0,.18); }
.pd-drawer.open { transform: translateX(0); }
.pd-drawer-header { padding: 18px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; position: sticky; top: 0; background: var(--card); z-index: 10; gap: 12px; }
.pd-drawer-close { width: 30px; height: 30px; border-radius: 8px; border: 1.5px solid var(--border); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--muted); transition: all .18s; flex-shrink: 0; }
.pd-drawer-close:hover { background: var(--rose-lt); border-color: var(--rose); color: var(--rose); }
.pd-drawer-body { padding: 18px 22px; }

.pd-detail-section { margin-bottom: 22px; }
.pd-detail-section-title { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; padding-bottom: 7px; border-bottom: 1px solid var(--border); }
.pd-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
.pd-detail-key { font-size: 11px; font-weight: 600; color: var(--muted); margin-bottom: 2px; }
.pd-detail-val { font-size: 13px; color: var(--ink2); font-weight: 500; }
.pd-detail-val.mono { font-family: 'DM Mono', monospace; font-size: 12px; }
.pd-tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
.pd-tag { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 3px 9px; font-size: 12px; font-weight: 500; color: var(--ink2); }
.pd-tag.highlight { background: var(--teal-lt); border-color: #99f6e4; color: #065f46; }
.pd-safety-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.pd-safety-item { padding: 9px 11px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); }
.pd-safety-item.warn { background: var(--amber-lt); border-color: #fde68a; }
.pd-safety-item.ok { background: var(--teal-lt); border-color: #99f6e4; }
.pd-safety-key { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--muted); margin-bottom: 3px; }
.pd-safety-val { font-size: 12px; font-weight: 600; color: var(--ink2); }
.pd-safety-item.warn .pd-safety-val { color: #92400e; }
.pd-safety-item.ok .pd-safety-val { color: #065f46; }

.pd-profile-card { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid var(--border); overflow: hidden; margin-bottom: 20px; }
.pd-profile-hero { background: linear-gradient(135deg, var(--ink) 0%, var(--ink2) 100%); padding: 28px 24px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.pd-profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--teal); display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: #fff; flex-shrink: 0; }
.pd-profile-name { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; color: #fff; }
.pd-profile-type { font-size: 13px; color: rgba(255,255,255,.55); margin-top: 3px; }
.pd-profile-body { padding: 22px 24px; }
.pd-profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.pd-profile-label { font-size: 11px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
.pd-profile-value { font-size: 14px; color: var(--ink2); font-weight: 500; }

/* COMPACT UPLOAD ZONE */
.pd-upload-zone { border: 2px dashed var(--border); border-radius: 10px; padding: 14px 18px; background: var(--bg); transition: all .2s; cursor: pointer; display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
.pd-upload-zone:hover { border-color: var(--teal); background: var(--teal-lt); }
.pd-upload-zone-icon { width: 32px; height: 32px; flex-shrink: 0; color: var(--teal); }
.pd-upload-zone-text { flex: 1; min-width: 0; }
.pd-upload-zone-title { font-size: 13px; font-weight: 600; color: var(--ink2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pd-upload-zone-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
.pd-upload-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.pd-input { padding: 9px 13px; border: 1.5px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; background: var(--bg); transition: all .2s; }
.pd-input:focus { border-color: var(--teal); background: #fff; box-shadow: 0 0 0 3px rgba(13,148,136,.1); }

.pd-empty { text-align: center; padding: 48px 24px; color: var(--muted); }
.pd-empty-icon { width: 40px; height: 40px; opacity: .25; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; }
.pd-empty-icon svg { width: 40px; height: 40px; }
.pd-empty-title { font-size: 15px; font-weight: 600; color: var(--ink2); margin-bottom: 5px; }
.pd-empty-sub { font-size: 13px; }
.pd-loading { display: flex; align-items: center; justify-content: center; padding: 48px; gap: 10px; color: var(--muted); font-size: 14px; }
.pd-spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--teal); border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

.pd-menu-toggle { display: none; position: fixed; top: 14px; left: 14px; z-index: 300; width: 38px; height: 38px; border-radius: 9px; background: var(--ink); border: none; cursor: pointer; align-items: center; justify-content: center; }
.pd-menu-toggle svg { width: 18px; height: 18px; color: #fff; }

.pd-report-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.pd-dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.edit-toggle-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .18s; border: 1.5px solid var(--teal); color: var(--teal); background: transparent; }
.edit-toggle-btn:hover { background: var(--teal-lt); }
.edit-toggle-btn.save { background: var(--teal); color: #fff; border-color: var(--teal); }
.edit-toggle-btn.save:disabled { background: var(--muted); border-color: var(--muted); cursor: not-allowed; }
.services-editor { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; padding: 16px; }
.services-editor-title { font-size: 11px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
.service-toggle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; }
.service-toggle-item { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 8px; border: 1.5px solid var(--border); cursor: pointer; font-size: 13px; font-weight: 500; transition: all .15s; background: var(--card); }
.service-toggle-item:hover { border-color: var(--teal); }
.service-toggle-item.on { border-color: var(--teal); background: var(--teal-lt); color: #065f46; }
.service-toggle-item input { accent-color: var(--teal); width: 14px; height: 14px; }
.success-toast { position: fixed; bottom: 24px; right: 24px; background: #065f46; color: #fff; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; z-index: 9999; box-shadow: var(--shadow-lg); animation: slideIn .3s ease; }
@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.pd-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.pd-field-group { margin-bottom: 14px; }
.pd-field-label { font-size: 11px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; display: block; }
.pd-select { padding: 9px 13px; border: 1.5px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; background: var(--bg); transition: all .2s; width: 100%; cursor: pointer; }
.pd-select:focus { border-color: var(--teal); background: #fff; box-shadow: 0 0 0 3px rgba(13,148,136,.1); }
.pd-textarea { padding: 9px 13px; border: 1.5px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; background: var(--bg); transition: all .2s; width: 100%; resize: vertical; min-height: 80px; }
.pd-textarea:focus { border-color: var(--teal); background: #fff; box-shadow: 0 0 0 3px rgba(13,148,136,.1); }

@media (max-width: 1280px) { .pd-stats { grid-template-columns: repeat(2, 1fr); } .pd-content { padding: 22px; } }
@media (max-width: 1024px) { .pd-dash-grid { grid-template-columns: 1fr; } }
@media (max-width: 900px) {
  .pd-sidebar { transform: translateX(-100%); }
  .pd-sidebar.open { transform: translateX(0); }
  .pd-main { margin-left: 0; }
  .pd-menu-toggle { display: flex; }
  .pd-topbar { padding: 0 16px 0 58px; }
  .pd-content { padding: 16px; }
  .pd-drawer { width: min(100vw, 520px); }
  .pd-search { width: 180px; }
}
@media (max-width: 640px) {
  .pd-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
  .pd-stat-val { font-size: 28px; }
  .pd-stat-label { font-size: 10px; }
  .pd-section-head { flex-direction: column; align-items: flex-start; }
  .pd-search { width: 100%; }
  .pd-detail-grid, .pd-profile-grid { grid-template-columns: 1fr; }
  .pd-safety-grid { grid-template-columns: 1fr 1fr; }
  .pd-topbar-title { font-size: 18px; }
  .pd-partner-name { display: none; }
}
@media (max-width: 400px) { .pd-stats { grid-template-columns: 1fr; } }

@media print {
  body * {
    visibility: hidden;
  }

  .print-section, .print-section * {
    visibility: visible;
  }

  .print-section {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 20px;
    background: white;
  }

  .pd-drawer-close,
  .pd-btn {
    display: none !important;
  }
}
`;

const Icon = {
  dashboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  bookings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  reports: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  profile: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  upload: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  menu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,  eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  save: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  doc: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

const StatusChip = ({ status }) => {
  const map = { PENDING: "pending", COMPLETED: "completed", CANCELLED: "cancelled", CONFIRMED: "confirmed", APPROVED: "approved" };
  const cls = map[status?.toUpperCase()] || "pending";
  return <span className={`pd-chip ${cls}`}>{status || "Pending"}</span>;
};

/* ─── DASHBOARD HOME ────────────────────────────────────────────────────── */
function DashboardHome({ stats, loading }) {
  const cards = [
    { label: "Total Bookings",   value: stats?.totalBookings   ?? 0, color: "c-teal",  icon: <Icon.bookings /> },
    { label: "Today's Bookings", value: stats?.todaysBookings  ?? 0, color: "c-amber", icon: <Icon.calendar /> },
    { label: "Completed",        value: stats?.totalReports    ?? 0, color: "c-sky",   icon: <Icon.reports /> },
    { label: "Pending",          value: stats?.pendingReports  ?? 0, color: "c-rose",  icon: <Icon.doc /> },
  ];
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: "var(--ink)" }}>Dashboard Overview</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>Welcome back — here's what's happening at your centre today.</p>
      </div>
      {loading ? <div className="pd-loading"><div className="pd-spinner" /><span>Loading stats…</span></div> : (
        <div className="pd-stats">
          {cards.map(c => (
            <div key={c.label} className={`pd-stat-card ${c.color}`}>
              <div className="pd-stat-label">{c.label}</div>
              <div className="pd-stat-val">{c.value}</div>
              <div className="pd-stat-icon">{c.icon}</div>
            </div>
          ))}
        </div>
      )}
      <div className="pd-dash-grid">
        <div className="pd-table-card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600 }}>Quick Actions</div>
          <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 7 }}>
            {["View today's appointments", "Upload pending reports", "Check patient consultations", "Review safety screenings"].map(a => (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "var(--bg)", fontSize: 13, color: "var(--ink2)", cursor: "pointer", transition: "background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--teal-lt)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--bg)"}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)", flexShrink: 0 }} />{a}
              </div>
            ))}
          </div>
        </div>
        <div className="pd-table-card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600 }}>Centre Status</div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {[{ label: "Approval Status", val: "APPROVED" }, { label: "Available Today", val: "CONFIRMED" }, { label: "Reporting TAT", val: "6–24 hrs", raw: true }].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{r.label}</span>
                {r.raw ? <span className="pd-chip completed">{r.val}</span> : <StatusChip status={r.val} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CONSULTATION DRAWER ───────────────────────────────────────────────── */
function ConsultationDrawer({ booking: b, onClose }) {
  if (!b) return null;
  const field = (label, value) => (
    <div><div className="pd-detail-key">{label}</div><div className="pd-detail-val">{value || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>—</span>}</div></div>
  );
  const safeClass = v => v === "Yes" ? "warn" : (v === "No" || v === "Not Applicable") ? "ok" : "";
  const scanTypes = Array.isArray(b.scanTypes) ? b.scanTypes : (b.scanTypes ? [b.scanTypes] : []);
  const allergies = Array.isArray(b.allergies) ? b.allergies : (b.allergies ? [b.allergies] : []);

  return (
    <div className="pd-drawer open">
      <div className="pd-drawer-header">
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600 }}>Consultation Details</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{b.fullName || b.patientName || "Patient"} · {b.apptDate ? new Date(b.apptDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</div>
        </div>
        <button className="pd-drawer-close" onClick={onClose}><Icon.close /></button>
      </div>
      <div className="pd-drawer-body print-section">
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
          <StatusChip status={b.status || "PENDING"} />
          {b._id && <span className="pd-detail-val mono" style={{ background: "var(--bg)", padding: "3px 8px", borderRadius: 5, border: "1px solid var(--border)" }}>ID: {b._id}</span>}
        </div>

        <div className="pd-detail-section">
          <div className="pd-detail-section-title">Patient Information</div>
          <div className="pd-detail-grid">
            {field("Full Name", b.fullName || b.patientName)}{field("Date of Birth", b.dob ? new Date(b.dob).toLocaleDateString("en-IN") : b.dob)}
            {field("Gender", b.gender)}{field("Blood Group", b.bloodGroup)}
            {field("Height", b.height ? `${b.height} cm` : null)}{field("Weight", b.weight ? `${b.weight} kg` : null)}
            {field("Mobile", b.mobile)}{field("Email", b.email)}
          </div>
          <div style={{ marginTop: 12 }}><div className="pd-detail-key">Address</div><div className="pd-detail-val">{[b.address, b.city, b.state, b.pin].filter(Boolean).join(", ") || "—"}</div></div>
        </div>

        <div className="pd-detail-section">
          <div className="pd-detail-section-title">Imaging & Scan Details</div>
          {scanTypes.length > 0 && <div style={{ marginBottom: 12 }}><div className="pd-detail-key" style={{ marginBottom: 6 }}>Scan Types</div><div className="pd-tag-row">{scanTypes.map(t => <span key={t} className="pd-tag highlight">{t}</span>)}</div></div>}
          <div className="pd-detail-grid">
            {field("Body Part", b.bodyPart)}{field("Contrast", b.contrast)}
            {field("Fasting", b.fastingHours)}{b.otherBodyPart && field("Other Area", b.otherBodyPart)}
          </div>
          {b.clinicalIndication && <div style={{ marginTop: 12 }}><div className="pd-detail-key">Clinical Indication</div><div style={{ fontSize: 13, lineHeight: 1.6, background: "var(--bg)", padding: "10px 12px", borderRadius: 7, marginTop: 4, border: "1px solid var(--border)" }}>{b.clinicalIndication}</div></div>}
        </div>

        <div className="pd-detail-section">
          <div className="pd-detail-section-title">Safety Screening</div>
          <div className="pd-safety-grid">
            {[["Claustrophobia", b.claustrophobia], ["Pregnancy", b.pregnant], ["Pacemaker", b.pacemaker], ["Metal Implants", b.metalImplants], ["Kidney Disease", b.kidneyDisease]].map(([lbl, val]) => (
              <div key={lbl} className={`pd-safety-item ${safeClass(val)}`}><div className="pd-safety-key">{lbl}</div><div className="pd-safety-val">{val || "—"}</div></div>
            ))}
          </div>
          {allergies.length > 0 && <div style={{ marginTop: 12 }}><div className="pd-detail-key" style={{ marginBottom: 6 }}>Allergies</div><div className="pd-tag-row">{allergies.map(a => <span key={a} className={`pd-tag ${a !== "None Known" ? "highlight" : ""}`}>{a}</span>)}</div></div>}
          {b.medHistory && <div style={{ marginTop: 12 }}><div className="pd-detail-key">Medical History</div><div style={{ fontSize: 13, lineHeight: 1.6, background: "var(--amber-lt)", padding: "10px 12px", borderRadius: 7, marginTop: 4, border: "1px solid #fde68a" }}>{b.medHistory}</div></div>}
        </div>

        <div className="pd-detail-section">
          <div className="pd-detail-section-title">Referring Doctor</div>
          <div className="pd-detail-grid">
            {field("Name", b.refDocName)}{field("Specialisation", b.refDocSpec)}
            {field("Hospital / Clinic", b.refClinic)}{field("Contact", b.refDocContact)}
          </div>
        </div>

        <div className="pd-detail-section">
          <div className="pd-detail-section-title">Appointment & Payment</div>
          <div className="pd-detail-grid">
            {field("Date", b.apptDate ? new Date(b.apptDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null)}
            {field("Time Slot", b.apptSlot)}{field("Report Delivery", b.reportDelivery)}{field("Payment Mode", b.paymentMode)}
            {b.insurerName && field("Insurer", b.insurerName)}{b.policyNo && field("Policy No.", b.policyNo)}
          </div>
          {b.finalNotes && <div style={{ marginTop: 12 }}><div className="pd-detail-key">Special Notes</div><div style={{ fontSize: 13, lineHeight: 1.6, background: "var(--sky-lt)", padding: "10px 12px", borderRadius: 7, marginTop: 4, border: "1px solid #bae6fd" }}>{b.finalNotes}</div></div>}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
          <button
  className="pd-btn pd-btn-primary"
  onClick={() => {
  window.location.href = "/partner/dashboard?tab=reports";
}}
>
  <Icon.doc />Upload Report
</button>
          <button
  className="pd-btn pd-btn-ghost"
  onClick={async () => {
    try {
      await axios.put(
        `${BASE_API}/api/partner/bookings/${b._id}/status`,
        { status: "COMPLETED" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("partnerToken")}`,
          },
        }
      );

      alert("Marked as completed");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  }}
>
  Mark Completed
</button>
         <button
  className="pd-btn"
  style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--ink2)" }}
  onClick={() => printConsultation(b)}
>
  Print Summary
</button>
        </div>
      </div>
    </div>
  );
}

/* ─── PRINT HELPER ─────────────────────────────────────────────────────── */
function printConsultation(b) {
  const fmt = (v) => v || "—";
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const scanTypes = Array.isArray(b.scanTypes) ? b.scanTypes : (b.scanTypes ? [b.scanTypes] : []);
  const allergies = Array.isArray(b.allergies) ? b.allergies : (b.allergies ? [b.allergies] : []);
  const safetyItems = [
    ["Claustrophobia", b.claustrophobia],
    ["Pregnancy", b.pregnant],
    ["Pacemaker", b.pacemaker],
    ["Metal Implants", b.metalImplants],
    ["Kidney Disease", b.kidneyDisease],
  ];
  const safetyClass = (v) => v === "Yes" ? "warn" : (v === "No" || v === "Not Applicable") ? "ok" : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Consultation Summary — ${fmt(b.fullName || b.patientName)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', Arial, sans-serif; color: #1e3553; background: #fff; font-size: 11px; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; display: flex; flex-direction: column; }

  .header { background: #0c1a2e; padding: 14px 28px; display: flex; align-items: center; justify-content: space-between; }
  .lab-name { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: #fff; }
  .lab-type { font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #0d9488; margin-top: 2px; }
  .bioburg-name { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: #fff; text-align: right; }
  .bioburg-sub { font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #0d9488; text-align: right; margin-top: 2px; }
  .accent-bar { height: 3px; background: linear-gradient(90deg, #0d9488 0%, #0284c7 50%, #0d9488 100%); }

  .patient-strip { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 28px; display: flex; align-items: center; gap: 14px; }
  .patient-avatar { width: 42px; height: 42px; border-radius: 50%; background: #0d9488; display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: #fff; flex-shrink: 0; }
  .patient-name { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; color: #0c1a2e; }
  .patient-meta { font-size: 10px; color: #64748b; margin-top: 2px; }
  .patient-right { text-align: right; margin-left: auto; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-completed { background: #ccfbf1; color: #065f46; }
  .status-confirmed { background: #e0f2fe; color: #0c4a6e; }
  .status-cancelled { background: #ffe4e6; color: #9f1239; }
  .appt-info { font-size: 10px; color: #64748b; margin-top: 4px; }

  .body { padding: 14px 28px; flex: 1; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 10px; }
  .section { margin-bottom: 0; }
  .section-title { font-size: 8px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #0d9488; padding-bottom: 4px; border-bottom: 1.5px solid #0d9488; margin-bottom: 8px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 16px; }
  .field-label { font-size: 8px; font-weight: 700; letter-spacing: 0.7px; text-transform: uppercase; color: #94a3b8; margin-bottom: 1px; }
  .field-value { font-size: 11px; font-weight: 500; color: #1e3553; }
  .tag-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
  .tag { display: inline-block; background: #ccfbf1; color: #065f46; border: 1px solid #99f6e4; border-radius: 3px; padding: 2px 7px; font-size: 10px; font-weight: 600; }
  .info-box { padding: 6px 10px; border-radius: 4px; font-size: 10px; line-height: 1.5; margin-top: 3px; }
  .info-box.clinical { background: #f8fafc; border-left: 2px solid #0d9488; }
  .info-box.history  { background: #fef3c7; border-left: 2px solid #f59e0b; }
  .info-box.notes    { background: #e0f2fe; border-left: 2px solid #0284c7; }
  .safety-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .safety-item { padding: 6px 8px; border-radius: 4px; border: 1px solid #e2e8f0; text-align: center; }
  .safety-item.ok   { background: #ccfbf1; border-color: #99f6e4; }
  .safety-item.warn { background: #fef3c7; border-color: #fde68a; }
  .safety-label { font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #94a3b8; margin-bottom: 2px; }
  .safety-val { font-size: 10px; font-weight: 700; color: #1e3553; }
  .safety-item.ok .safety-val   { color: #065f46; }
  .safety-item.warn .safety-val { color: #92400e; }
  .divider { height: 1px; background: #e2e8f0; margin: 8px 0; }
  .sig-block { display: flex; justify-content: space-between; margin-top: 18px; }
  .sig-line { text-align: center; }
  .sig-underline { width: 130px; border-top: 1px solid #94a3b8; margin: 0 auto 4px; padding-top: 5px; }
  .sig-caption { font-size: 9px; color: #94a3b8; font-weight: 600; letter-spacing: 0.4px; }

  .footer { border-top: 1px solid #e2e8f0; padding: 9px 28px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
  .footer-brand { font-family: 'Fraunces', serif; font-size: 11px; font-weight: 700; color: #0c1a2e; }
  .footer-note { font-size: 9px; color: #94a3b8; text-align: center; }
  .footer-id { font-size: 9px; color: #94a3b8; text-align: right; font-family: 'DM Mono', monospace; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 0; size: A4; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="lab-name">${fmt(b.partnerBusinessName || "Centre Name")}</div>
      <div class="lab-type">${fmt(b.partnerBusinessType || "Diagnostic Centre")}</div>
    </div>
    <div>
      <div class="bioburg-name">BIOBURG</div>
      <div class="bioburg-sub">Life Sciences · Partner Portal</div>
    </div>
  </div>
  <div class="accent-bar"></div>

  <div class="patient-strip">
    <div class="patient-avatar">${(b.fullName || b.patientName || "P")[0].toUpperCase()}</div>
    <div>
      <div class="patient-name">${fmt(b.fullName || b.patientName)}</div>
      <div class="patient-meta">${[b.gender, b.dob ? "DOB: " + fmtDate(b.dob) : null, b.bloodGroup ? "Blood: " + b.bloodGroup : null].filter(Boolean).join("  ·  ")}</div>
    </div>
    <div class="patient-right">
      <div class="status-badge status-${(b.status || "pending").toLowerCase()}">${fmt(b.status || "PENDING")}</div>
      <div class="appt-info">Appointment: <strong>${fmtDate(b.apptDate)}</strong>${b.apptSlot ? " · " + b.apptSlot : ""}</div>
    </div>
  </div>

  <div class="body">

    <div class="two-col">
      <div class="section">
        <div class="section-title">1. Patient Information</div>
        <div class="grid-2">
          <div><div class="field-label">Full Name</div><div class="field-value">${fmt(b.fullName || b.patientName)}</div></div>
          <div><div class="field-label">Date of Birth</div><div class="field-value">${fmtDate(b.dob)}</div></div>
          <div><div class="field-label">Gender</div><div class="field-value">${fmt(b.gender)}</div></div>
          <div><div class="field-label">Blood Group</div><div class="field-value">${fmt(b.bloodGroup)}</div></div>
          <div><div class="field-label">Height</div><div class="field-value">${b.height ? b.height + " cm" : "—"}</div></div>
          <div><div class="field-label">Weight</div><div class="field-value">${b.weight ? b.weight + " kg" : "—"}</div></div>
          <div><div class="field-label">Mobile</div><div class="field-value">${fmt(b.mobile)}</div></div>
          <div><div class="field-label">Email</div><div class="field-value" style="font-size:9.5px;">${fmt(b.email)}</div></div>
        </div>
        <div style="margin-top:5px;"><div class="field-label">Address</div><div class="field-value">${[b.address, b.city, b.state, b.pin].filter(Boolean).join(", ") || "—"}</div></div>
      </div>

      <div class="section">
        <div class="section-title">2. Imaging &amp; Scan Details</div>
        ${scanTypes.length > 0 ? `<div style="margin-bottom:6px;"><div class="field-label" style="margin-bottom:3px;">Scan Types</div><div class="tag-row">${scanTypes.map(t => `<span class="tag">${t}</span>`).join("")}</div></div>` : ""}
        <div class="grid-2">
          <div><div class="field-label">Body Part</div><div class="field-value">${fmt(b.bodyPart)}</div></div>
          <div><div class="field-label">Contrast</div><div class="field-value">${fmt(b.contrast)}</div></div>
          <div><div class="field-label">Fasting</div><div class="field-value">${fmt(b.fastingHours)}</div></div>
          ${b.otherBodyPart ? `<div><div class="field-label">Other Area</div><div class="field-value">${b.otherBodyPart}</div></div>` : ""}
        </div>
        ${b.clinicalIndication ? `<div style="margin-top:5px;"><div class="field-label">Clinical Indication</div><div class="info-box clinical">${b.clinicalIndication}</div></div>` : ""}
      </div>
    </div>

    <div class="divider"></div>

    <div class="section" style="margin-bottom:8px;">
      <div class="section-title">3. Safety Screening</div>
      <div class="safety-grid">
        ${safetyItems.map(([lbl, val]) => `<div class="safety-item ${safetyClass(val)}"><div class="safety-label">${lbl}</div><div class="safety-val">${fmt(val)}</div></div>`).join("")}
      </div>
      ${allergies.length > 0 ? `<div style="margin-top:6px;"><div class="field-label" style="margin-bottom:3px;">Allergies</div><div class="tag-row">${allergies.map(a => `<span class="tag" style="${a !== "None Known" ? "" : "background:#f8fafc;color:#64748b;border-color:#e2e8f0;"}">${a}</span>`).join("")}</div></div>` : ""}
      ${b.medHistory ? `<div style="margin-top:5px;"><div class="field-label">Medical History</div><div class="info-box history">${b.medHistory}</div></div>` : ""}
    </div>

    <div class="divider"></div>

    <div class="two-col">
      <div class="section">
        <div class="section-title">4. Referring Doctor</div>
        <div class="grid-2">
          <div><div class="field-label">Doctor Name</div><div class="field-value">${fmt(b.refDocName)}</div></div>
          <div><div class="field-label">Specialisation</div><div class="field-value">${fmt(b.refDocSpec)}</div></div>
          <div><div class="field-label">Hospital / Clinic</div><div class="field-value">${fmt(b.refClinic)}</div></div>
          <div><div class="field-label">Contact</div><div class="field-value">${fmt(b.refDocContact)}</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">5. Appointment &amp; Payment</div>
        <div class="grid-2">
          <div><div class="field-label">Date</div><div class="field-value">${fmtDate(b.apptDate)}</div></div>
          <div><div class="field-label">Time Slot</div><div class="field-value">${fmt(b.apptSlot)}</div></div>
          <div><div class="field-label">Report Delivery</div><div class="field-value">${fmt(b.reportDelivery)}</div></div>
          <div><div class="field-label">Payment Mode</div><div class="field-value">${fmt(b.paymentMode)}</div></div>
          ${b.insurerName ? `<div><div class="field-label">Insurer</div><div class="field-value">${b.insurerName}</div></div>` : ""}
          ${b.policyNo ? `<div><div class="field-label">Policy No.</div><div class="field-value">${b.policyNo}</div></div>` : ""}
        </div>
        ${b.finalNotes ? `<div style="margin-top:5px;"><div class="field-label">Special Notes</div><div class="info-box notes">${b.finalNotes}</div></div>` : ""}
      </div>
    </div>

    <div class="sig-block">
      <div class="sig-line"><div class="sig-underline"></div><div class="sig-caption">Radiologist / Technician</div></div>
      <div class="sig-line"><div class="sig-underline"></div><div class="sig-caption">Centre In-Charge</div></div>
      <div class="sig-line"><div class="sig-underline"></div><div class="sig-caption">Date &amp; Stamp</div></div>
    </div>

  </div>

  <div class="footer">
    <div><div class="footer-brand">BIOBURG Life Sciences</div><div style="font-size:9px;color:#94a3b8;">bioburglifesciences.com</div></div>
    <div class="footer-note">This document is confidential and intended solely for the named patient and treating clinician.</div>
    <div class="footer-id"><div>Booking ID</div><div>${fmt(b._id)}</div></div>
  </div>

</div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=1100");
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 800);
}
/* ─── MY BOOKINGS ───────────────────────────────────────────────────────── */
function MyBookings({ token }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_API}/api/partner/bookings`, { headers: { Authorization: `Bearer ${token}` } });
        setBookings(res.data.data || []);
      } catch { setBookings([]); } finally { setLoading(false); }
    })();
  }, [token]);

  const filtered = bookings.filter(b => {
    const q = query.toLowerCase();
    return (b.fullName || b.patientName || "").toLowerCase().includes(q) ||
      (Array.isArray(b.scanTypes) ? b.scanTypes.join(" ") : b.scanTypes || b.testName || "").toLowerCase().includes(q) ||
      (b.mobile || "").includes(q);
  });

  const openDrawer = b => { setSelected(b); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setTimeout(() => setSelected(null), 300); };

  return (
    <div>
      <div className="pd-section-head">
        <div><div className="pd-section-title">Patient Bookings</div><div className="pd-section-sub">Click any row to view full consultation details.</div></div>
        <div className="pd-search-wrap"><Icon.search /><input className="pd-search" placeholder="Search patient, scan…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      </div>
      <div className="pd-table-card">
        {loading ? <div className="pd-loading"><div className="pd-spinner" /><span>Loading bookings…</span></div>
          : filtered.length === 0 ? (
            <div className="pd-empty"><div className="pd-empty-icon"><Icon.bookings /></div><div className="pd-empty-title">{bookings.length === 0 ? "No bookings yet" : "No results"}</div><div className="pd-empty-sub">{bookings.length === 0 ? "Patient bookings will appear here." : "Try a different search."}</div></div>
          ) : (
            <div className="pd-table-wrap">
              <table className="pd-table">
                <thead><tr><th>Patient</th><th>Scan Type</th><th>Body Part</th><th>Date</th><th>Slot</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b._id} onClick={() => openDrawer(b)}>
                      <td><div style={{ fontWeight: 600, color: "var(--ink)" }}>{b.fullName || b.patientName || "—"}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>{b.mobile || b.email || ""}</div></td>
                      <td style={{ maxWidth: 150 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{Array.isArray(b.scanTypes) ? b.scanTypes[0] : (b.scanTypes || b.testName || "—")}{Array.isArray(b.scanTypes) && b.scanTypes.length > 1 && <span style={{ fontSize: 11, color: "var(--teal)", marginLeft: 4 }}>+{b.scanTypes.length - 1}</span>}</div></td>
                      <td>{b.bodyPart || "—"}</td>
                      <td>{b.apptDate ? new Date(b.apptDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : (b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—")}</td>
                      <td style={{ fontSize: 12 }}>{b.apptSlot || "—"}</td>
                      <td><StatusChip status={b.status} /></td>
                      <td onClick={e => { e.stopPropagation(); openDrawer(b); }}><button className="pd-btn pd-btn-ghost pd-btn-sm"><Icon.eye />View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      <div className={`pd-drawer-overlay${drawerOpen ? " open" : ""}`} onClick={closeDrawer} />
      <div className={`pd-drawer${drawerOpen ? " open" : ""}`}>{selected && <ConsultationDrawer booking={selected} onClose={closeDrawer} />}</div>
    </div>
  );
}

/*  MY REPORTS  */
function MyReports({ token }) {
  const [reports, setReports] = useState([]);
  const [bookings, setBookings] = useState([]);   
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [bookingId, setBookingId] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const [rRes, bRes] = await Promise.allSettled([
        axios.get(`${BASE_API}/api/partner/reports`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_API}/api/partner/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (rRes.status === "fulfilled") setReports(rRes.value.data.data || []);
      if (bRes.status === "fulfilled") setBookings(bRes.value.data.data || []);
    } catch { } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  const handleUpload = async () => {
    if (!file || !bookingId) { alert("Please enter a Booking ID and select a file."); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try { await axios.post(`${BASE_API}/api/partner/upload`, { bookingId, fileBase64: reader.result }, { headers: { Authorization: `Bearer ${token}` } }); alert("Uploaded!"); setFile(null); setBookingId(""); fetchReports(); }
      catch { alert("Upload failed."); } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="pd-section-head"><div><div className="pd-section-title">Manage Reports</div><div className="pd-section-sub">Upload and manage diagnostic reports for patients.</div></div></div>
      <div className="pd-table-card" style={{ marginBottom: 18, padding: "18px 20px" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Upload New Report</div>
        <label className="pd-upload-zone" htmlFor="rpt-file">
          <input id="rpt-file" type="file" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.dcm" />
          <div className="pd-upload-zone-icon"><Icon.upload /></div>
          <div className="pd-upload-zone-text">
            <div className="pd-upload-zone-title">{file ? file.name : "Click to select report file"}</div>
            <div className="pd-upload-zone-sub">PDF, JPG, PNG or DICOM · Max 20 MB</div>
          </div>
          {file && <button type="button" className="pd-btn pd-btn-sm" style={{ background: "var(--rose-lt)", color: "var(--rose)", border: "none", flexShrink: 0 }} onClick={e => { e.preventDefault(); setFile(null); }}>✕ Remove</button>}
        </label>
        <div className="pd-upload-row">
            <select
            className="pd-select"
            style={{ flex: 1 }}
            value={bookingId}
            onChange={e => setBookingId(e.target.value)}
          >
            <option value="">— Select Patient Booking —</option>
            {bookings.map(b => (
              <option key={b._id} value={b._id}>
                {b.fullName || b.patientName || "Unknown"} · {b.apptDate ? new Date(b.apptDate).toLocaleDateString("en-IN") : "No date"} · {Array.isArray(b.scanTypes) ? b.scanTypes[0] : b.scanTypes || b.testName || ""}
              </option>
            ))}
          </select>
          <button className="pd-btn pd-btn-primary" onClick={handleUpload} disabled={uploading || !bookingId || !file}>
            {uploading ? <><div className="pd-spinner" style={{ width: 14, height: 14 }} />Uploading…</> : <><Icon.upload />Upload</>}
          </button>
        </div>
      </div>
          
      <div className="pd-table-card">
        {loading ? <div className="pd-loading"><div className="pd-spinner" /><span>Loading reports…</span></div>
          : reports.length === 0 ? <div className="pd-empty"><div className="pd-empty-icon"><Icon.doc /></div><div className="pd-empty-title">No reports yet</div><div className="pd-empty-sub">Uploaded reports will appear here.</div></div>
          : (
            <div className="pd-table-wrap">
              <table className="pd-table">
                <thead><tr><th>Booking ID</th><th>Patient</th><th>Uploaded On</th><th>Actions</th></tr></thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r._id}>
                      <td className="pd-detail-val mono" style={{ fontSize: 12 }}>{r.bookingId?._id || "—"}</td>
                      <td>{r.bookingId?.fullName || r.bookingId?.patientName || "—"}</td>
                      <td style={{ fontSize: 12 }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                      <td><div className="pd-report-actions">{r.reportFile?.url && (<><button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={() => window.open(r.reportFile.url, "_blank")}><Icon.eye />View</button><button className="pd-btn pd-btn-sm" style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--ink2)" }} onClick={() => { const a = document.createElement("a"); a.href = r.reportFile.url; a.download = "report.pdf"; a.click(); }}>Download</button></>)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

/* ─── MY PROFILE — FIXED: only fetches /api/partner/me ─────────────────── */
function MyProfile({ token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [toast, setToast] = useState("");

  const ALL_SERVICES = [
    "Blood Tests", "Biochemistry", "Hematology", "Microbiology",
    "X-Ray", "Ultrasound", "CT Scan", "MRI", "PET-CT Scan",
    "Mammography", "Echocardiogram", "DEXA Scan", "Colour Doppler",
    "Pathology", "Home Collection"
  ];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_API}/api/partner/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data.data || res.data;
        setProfile(data);
        setEditData({
          mobile: data.mobile || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          servicesOffered: data.servicesOffered || [],
          homeCollection: data.homeCollection || "",
          notes: data.notes || "",
        });
      } catch { setProfile(null); } finally { setLoading(false); }
    })();
  }, [token]);

  const toggleService = (svc) => {
    setEditData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(svc)
        ? prev.servicesOffered.filter(s => s !== svc)
        : [...prev.servicesOffered, svc]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put(`${BASE_API}/api/partner/update-profile`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(prev => ({ ...prev, ...editData }));
      setEditing(false);
      setToast("Profile updated successfully!");
      setTimeout(() => setToast(""), 3000);
    } catch {
      alert("Failed to save. Please try again.");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="pd-loading"><div className="pd-spinner" /><span>Loading profile…</span></div>;
  if (!profile) return <div className="pd-empty"><div className="pd-empty-title">Could not load profile</div></div>;

  const docs = [
    { label: "Registration Certificate", file: profile.regCertificate },
    { label: "GST Certificate", file: profile.gstCertificate },
    { label: "Owner ID Proof", file: profile.ownerID },
    { label: "Lab Photos", file: profile.labPhotos }
  ].filter(d => d.file);

  return (
    <div>
      {toast && <div className="success-toast">{toast}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div className="pd-section-title">My Profile</div>
        {!editing ? (
          <button className="edit-toggle-btn" onClick={() => setEditing(true)}>
            <Icon.edit /> Edit Profile
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="edit-toggle-btn" onClick={() => setEditing(false)}>Cancel</button>
            <button className="edit-toggle-btn save" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : <><Icon.save /> Save Changes</>}
            </button>
          </div>
        )}
      </div>

      <div className="pd-profile-card">
        <div className="pd-profile-hero">
          <div className="pd-profile-avatar">{(profile.businessName || "B")[0].toUpperCase()}</div>
          <div>
            <div className="pd-profile-name">{profile.businessName}</div>
            <div className="pd-profile-type">
              {profile.businessType}{profile.yearEst ? ` · Est. ${profile.yearEst}` : ""}
            </div>
            <div style={{ marginTop: 8 }}><StatusChip status="APPROVED" /></div>
          </div>
        </div>

        <div className="pd-profile-body">
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
            Business Information
          </div>

          {!editing ? (
            // VIEW MODE
            <div className="pd-profile-grid" style={{ marginBottom: 20 }}>
              {[
                ["Owner Name", profile.ownerName],
                ["Email", profile.email],
                ["Mobile", profile.mobile],
                ["Business Type", profile.businessType],
                ["Year Established", profile.yearEst],
                ["Address", [profile.address, profile.city, profile.state, profile.pincode].filter(Boolean).join(", ")],
                ["Home Collection", profile.homeCollection],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="pd-profile-label">{k}</div>
                  <div className="pd-profile-value">{v || "—"}</div>
                </div>
              ))}
            </div>
          ) : (
            // EDIT MODE
            <div style={{ marginBottom: 20 }}>
              <div className="pd-form-grid" style={{ marginBottom: 14 }}>
                {[
                  ["Mobile", "mobile", "tel"],
                  ["City", "city", "text"],
                  ["State", "state", "text"],
                ].map(([label, key, type]) => (
                  <div key={key} className="pd-field-group">
                    <label className="pd-field-label">{label}</label>
                    <input
                      className="pd-input"
                      style={{ width: "100%" }}
                      type={type}
                      value={editData[key] || ""}
                      onChange={e => setEditData(p => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="pd-field-group">
                  <label className="pd-field-label">Home Collection</label>
                  <select
                    className="pd-select"
                    value={editData.homeCollection || ""}
                    onChange={e => setEditData(p => ({ ...p, homeCollection: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div className="pd-field-group" style={{ marginBottom: 14 }}>
                <label className="pd-field-label">Full Address</label>
                <input
                  className="pd-input"
                  style={{ width: "100%" }}
                  value={editData.address || ""}
                  onChange={e => setEditData(p => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="pd-field-group">
                <label className="pd-field-label">Additional Notes</label>
                <textarea
                  className="pd-textarea"
                  style={{ width: "100%" }}
                  value={editData.notes || ""}
                  onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* SERVICES — always show, editable when editing */}
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, marginBottom: 12, marginTop: 4 }}>
            Services Offered
          </div>

          {!editing ? (
            <div className="pd-tag-row" style={{ marginBottom: 20 }}>
              {(profile.servicesOffered || []).length > 0
                ? profile.servicesOffered.map(s => <span key={s} className="pd-tag highlight">{s}</span>)
                : <span style={{ color: "var(--muted)", fontSize: 13 }}>No services listed yet</span>
              }
            </div>
          ) : (
            <div className="services-editor" style={{ marginBottom: 20 }}>
              <div className="services-editor-title">Toggle services you offer</div>
              <div className="service-toggle-grid">
                {ALL_SERVICES.map(svc => (
                  <label
                    key={svc}
                    className={`service-toggle-item${editData.servicesOffered?.includes(svc) ? " on" : ""}`}
                    onClick={() => toggleService(svc)}
                  >
                    <input
                      type="checkbox"
                      checked={editData.servicesOffered?.includes(svc) || false}
                      onChange={() => {}}
                    />
                    {svc}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* DOCUMENTS */}
{docs.length > 0 && (
  <>
    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
      Uploaded Documents
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {docs.map(d => (
        <button
          key={d.label}
          className="pd-btn pd-btn-ghost pd-btn-sm"   
          onClick={() => window.open(d.file.url, "_blank")}
        >
          <Icon.doc />{d.label}
        </button>
      ))}
    </div>
  </>
)}
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT — FIXED: stats derived from bookings, profile from /api/partner/me */
export default function PartnerDashboard() {
  const token = localStorage.getItem("partnerToken");
  const getInitialPage = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("tab") || "dashboard";
};
const [page, setPage] = useState(getInitialPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [partnerName, setPartnerName] = useState("");

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [bRes, pRes] = await Promise.allSettled([
          axios.get(`${BASE_API}/api/partner/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_API}/api/partner/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (bRes.status === "fulfilled") {
          const bookings = bRes.value.data.data || [];
          const today = new Date().toDateString();
          setStats({
            totalBookings:  bookings.length,
            todaysBookings: bookings.filter(b => new Date(b.apptDate || b.bookingDate || b.createdAt).toDateString() === today).length,
            totalReports:   bookings.filter(b => (b.status || "").toUpperCase() === "COMPLETED").length,
            pendingReports: bookings.filter(b => (b.status || "").toUpperCase() === "PENDING").length,
          });
        }
        if (pRes.status === "fulfilled") {
          const p = pRes.value.data.data || pRes.value.data;
          setPartnerName(p?.businessName || "");
        }
      } catch (err) { console.error(err); } finally { setStatsLoading(false); }
    })();
  }, [token]);

  const navItems = [
    { key: "dashboard", label: "Dashboard",   icon: <Icon.dashboard /> },
    { key: "bookings",  label: "My Bookings", icon: <Icon.bookings /> },
    { key: "reports",   label: "My Reports",  icon: <Icon.reports /> },
    { key: "profile",   label: "My Profile",  icon: <Icon.profile /> },
  ];

  return (
    <div className="pd-app">
      <button className="pd-menu-toggle" onClick={() => setSidebarOpen(s => !s)}><Icon.menu /></button>
      <aside className={`pd-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="pd-sidebar-logo"><div className="pd-sidebar-logo-mark">BIOBURG</div><div className="pd-sidebar-logo-sub">Partner Portal</div></div>
        <nav className="pd-nav">
          {navItems.map(n => <button key={n.key} className={`pd-nav-item${page === n.key ? " active" : ""}`} onClick={() => { setPage(n.key); setSidebarOpen(false); }}>{n.icon}{n.label}</button>)}
          <div className="pd-nav-divider" />
          <button className="pd-nav-item" onClick={() => { localStorage.removeItem("partnerToken"); window.location.href = "/partner/login"; }}><Icon.logout />Logout</button>
        </nav>
        <div className="pd-sidebar-footer">Bioburg Life Sciences © 2025</div>
      </aside>
      <main className="pd-main">
        <header className="pd-topbar">
          <div className="pd-topbar-title">{{ dashboard: "Dashboard", bookings: "Bookings", reports: "Reports", profile: "Profile" }[page]}</div>
          <div className="pd-topbar-right">{partnerName && <span className="pd-partner-name">{partnerName}</span>}<div className="pd-avatar">{(partnerName || "P")[0].toUpperCase()}</div></div>
        </header>
        <div className="pd-content">
          {page === "dashboard" && <DashboardHome stats={stats} loading={statsLoading} />}
          {page === "bookings"  && <MyBookings token={token} />}
          {page === "reports"   && <MyReports token={token} />}
          {page === "profile"   && <MyProfile token={token} />}
        </div>
      </main>
      {sidebarOpen && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 99 }} onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}