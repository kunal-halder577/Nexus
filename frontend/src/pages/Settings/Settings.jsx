import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '@/features/auth/api/authApi.js';
import { logout as clientLogout } from '@/features/auth/authAction.js';
import { useUiStore } from '@/stores/ui.store.js';
import { Sun, Moon, Monitor, LogOut, ArrowLeft, Settings as SettingsIcon, Bell, Shield, Globe, ChevronRight, User, Palette, Smartphone, Check, Lock, Key, Eye, EyeOff, Mail, CreditCard, Trash2, AlertTriangle, Fingerprint } from 'lucide-react';
import { baseApi } from '@/lib/api/baseApi';

// --- Minimal cn helper (no external dep needed) ---
const cn = (...args) => args.filter(Boolean).join(' ');

// ─── Inline styles / keyframes injected once ───────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 var(--indigo-glow); }
      70%  { box-shadow: 0 0 0 8px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }

    .settings-root {
      --bg:           transparent;
      --bg-elevated:  hsl(var(--background));
      --bg-card:      hsl(var(--card));
      --bg-card-2:    hsl(var(--muted));
      --border:       hsl(var(--border));
      --border-hover: hsl(var(--primary) / 0.5);
      --text:         hsl(var(--foreground));
      --text-2:       hsl(var(--muted-foreground));
      --text-3:       hsl(var(--muted-foreground));
      --indigo:       #6366f1;
      --indigo-light: #818cf8;
      --indigo-dim:   rgba(99,102,241,0.12);
      --indigo-glow:  rgba(99,102,241,0.20);
      --red:          hsl(var(--destructive));
      --red-dim:      hsl(var(--destructive) / 0.10);
      --radius:       var(--radius, 16px);
      --radius-sm:    calc(var(--radius, 16px) - 2px);
      --font:         'DM Sans', sans-serif;
      --mono:         'DM Mono', monospace;
      --transition:   200ms cubic-bezier(0.4, 0, 0.2, 1);

      min-height: 100%;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      font-family: var(--font);
      color: var(--text);
    }

    /* ── Header ── */
    .s-header {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      gap: 12px;
      height: 60px;
      padding: 0 20px;
      background: hsl(var(--background) / 0.75);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid var(--border);
    }
    .s-header-title {
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.3px;
      color: var(--text);
    }
    .s-header-badge {
      margin-left: auto;
      font-family: var(--mono);
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.05em;
      color: var(--indigo-light);
      background: var(--indigo-dim);
      border: 1px solid rgba(99,102,241,0.25);
      padding: 3px 8px;
      border-radius: 99px;
    }

    /* ── Icon button ── */
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-2);
      cursor: pointer;
      transition: var(--transition);
      transition-property: background, border-color, color, transform;
      flex-shrink: 0;
    }
    .icon-btn:hover {
      background: var(--bg-card-2);
      border-color: var(--border-hover);
      color: var(--text);
      transform: translateX(-1px);
    }
    .icon-btn:active { transform: scale(0.93); }

    /* ── Body ── */
    .s-body {
      flex: 1;
      overflow-y: auto;
      padding: 28px 20px 80px;
      max-width: 560px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* ── Danger zone ── */
    .danger-zone {
      border: 1px solid rgba(248,113,113,0.18);
      border-radius: var(--radius);
      overflow: hidden;
      background: rgba(248,113,113,0.04);
    }
    .danger-zone > * + * { border-top: 1px solid rgba(248,113,113,0.12); }

    /* ── Badge pill ── */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 10.5px;
      font-weight: 600;
      font-family: var(--mono);
      letter-spacing: 0.02em;
    }
    .badge--green  { background: rgba(52,211,153,0.12); color: #34d399; }
    .badge--red    { background: rgba(248,113,113,0.12); color: var(--red); }
    .badge--indigo { background: var(--indigo-dim); color: var(--indigo-light); }

    /* ── Section ── */
    .section { display: flex; flex-direction: column; gap: 10px; }
    .section-label {
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-3);
      padding: 0 4px;
    }

    /* ── Card group ── */
    .card-group {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .card-group > * + * {
      border-top: 1px solid var(--border);
    }

    /* ── Row ── */
    .row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      cursor: pointer;
      transition: background var(--transition);
      position: relative;
      width: 100%;
      text-align: left;
      border: none;
      background: transparent;
      color: var(--text);
      font-family: var(--font);
    }
    .row:hover { background: hsl(var(--accent) / 0.5); }
    .row:active { background: hsl(var(--accent)); }
    .row.row--danger { color: var(--red); }
    .row.row--danger:hover { background: var(--red-dim); }

    /* active row highlight bar */
    .row.row--active::before {
      content: '';
      position: absolute;
      left: 0; top: 50%; transform: translateY(-50%);
      width: 3px; height: 60%; border-radius: 0 3px 3px 0;
      background: var(--indigo);
    }

    .row-icon {
      width: 34px; height: 34px;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      font-size: 15px;
    }
    .row-icon--indigo  { background: var(--indigo-dim); color: var(--indigo-light); }
    .row-icon--slate   { background: rgba(148,163,184,0.10); color: #94a3b8; }
    .row-icon--amber   { background: rgba(251,191,36,0.10);  color: #fbbf24; }
    .row-icon--emerald { background: rgba(52,211,153,0.10);  color: #34d399; }
    .row-icon--red     { background: var(--red-dim);         color: var(--red); }

    .row-content { flex: 1; min-width: 0; }
    .row-label { font-size: 14.5px; font-weight: 500; letter-spacing: -0.1px; }
    .row-sub { font-size: 12px; color: var(--text-2); margin-top: 1px; }

    .row-end { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .row-chevron { color: var(--text-3); }
    .row-value { font-size: 13px; color: var(--text-2); font-family: var(--mono); }

    /* ── Theme selector ── */
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      padding: 16px;
    }
    .theme-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 16px 10px;
      border-radius: var(--radius-sm);
      border: 1.5px solid var(--border);
      background: var(--bg-elevated);
      cursor: pointer;
      transition: var(--transition);
      transition-property: border-color, background, transform;
      font-family: var(--font);
      color: var(--text-2);
      font-size: 12px;
      font-weight: 500;
    }
    .theme-btn:hover { border-color: rgba(99,102,241,0.3); background: var(--bg-card-2); transform: translateY(-1px); }
    .theme-btn.active {
      border-color: var(--indigo);
      background: var(--indigo-dim);
      color: var(--indigo-light);
    }
    .theme-btn.active .theme-icon-wrap { background: var(--indigo); color: #fff; }
    .theme-icon-wrap {
      width: 38px; height: 38px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: hsl(var(--muted));
      transition: background var(--transition), color var(--transition);
    }
    .theme-check {
      width: 16px; height: 16px;
      border-radius: 50%;
      border: 1.5px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      transition: var(--transition);
    }
    .theme-btn.active .theme-check {
      background: var(--indigo);
      border-color: var(--indigo);
      color: #fff;
    }

    /* ── Toggle ── */
    .toggle-track {
      width: 42px; height: 24px;
      border-radius: 99px;
      background: hsl(var(--muted-foreground) / 0.3);
      border: 1px solid var(--border);
      position: relative;
      cursor: pointer;
      flex-shrink: 0;
      transition: background var(--transition), border-color var(--transition);
    }
    .toggle-track.on { background: var(--indigo); border-color: var(--indigo); }
    .toggle-thumb {
      position: absolute;
      top: 2px; left: 2px;
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .toggle-track.on .toggle-thumb { transform: translateX(18px); }

    /* ── Spinner ── */
    .spinner {
      width: 16px; height: 16px;
      border-radius: 50%;
      border: 2px solid currentColor;
      border-top-color: transparent;
      animation: spin 0.7s linear infinite;
    }

    /* ── Divider ── */
    .divider-label {
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-3);
      padding: 8px 18px 4px;
    }

    /* ── Footer ── */
    .s-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px 0 4px;
    }
    .s-footer-heart {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      animation: heartbeat 1.8s ease-in-out infinite;
      filter: drop-shadow(0 0 6px rgba(248, 113, 113, 0.7));
    }
    .s-footer-text {
      font-size: 13px;
      font-weight: 500;
      letter-spacing: -0.1px;
      color: var(--text-2);
    }
    .s-footer-name {
      background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 700;
    }
    .s-footer-version {
      font-family: var(--mono);
      font-size: 10px;
      color: var(--text-3);
      letter-spacing: 0.05em;
    }
    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      14%       { transform: scale(1.25); }
      28%       { transform: scale(1); }
      42%       { transform: scale(1.15); }
      56%       { transform: scale(1); }
    }

    /* ── Staggered animation ── */
    .section:nth-child(1) { animation: fadeUp 0.35s ease 0.05s both; }
    .section:nth-child(2) { animation: fadeUp 0.35s ease 0.12s both; }
    .section:nth-child(3) { animation: fadeUp 0.35s ease 0.19s both; }
    .section:nth-child(4) { animation: fadeUp 0.35s ease 0.26s both; }
    .section:nth-child(5) { animation: fadeUp 0.35s ease 0.33s both; }
  `}</style>
);

// ─── Toggle component ────────────────────────────────────────────────────────
function Toggle({ on, onToggle }) {
  return (
    <div className={cn('toggle-track', on && 'on')} onClick={onToggle} role="switch" aria-checked={on}>
      <div className="toggle-thumb" />
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, setTheme } = useUiStore();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const [activityAlerts, setActivityAlerts] = useState(true);

  const handleLogout = async () => {
      try {
        await logout().unwrap();
      } catch (error) {
        console.warn("Logout failed", error);
      } finally {
        dispatch(clientLogout());
        dispatch(baseApi.util.resetApiState());
        navigate('/login');
      }
    };

  const themes = [
    { id: 'light',  label: 'Light',  Icon: Sun },
    { id: 'dark',   label: 'Dark',   Icon: Moon },
    { id: 'system', label: 'System', Icon: Monitor },
  ];

  return (
    <>
      <GlobalStyles />
      <div className="settings-root">

        {/* ── Header ── */}
        <header className="s-header">
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <span className="s-header-title">Settings</span>
          <span className="s-header-badge">v2.4.1</span>
        </header>

        {/* ── Body ── */}
        <main className="s-body">

          {/* ── Appearance ── */}
          <section className="section">
            <div className="section-label">Appearance</div>
            <div className="card-group" style={{ borderRadius: 'var(--radius)' }}>
              <div className="divider-label">Theme</div>
              <div className="theme-grid">
                {themes.map(({ id, label, Icon }) => {
                  const active = theme === id;
                  return (
                    <button key={id} className={cn('theme-btn', active && 'active')} onClick={() => setTheme(id)}>
                      <div className="theme-icon-wrap"><Icon size={17} /></div>
                      <span>{label}</span>
                      <div className="theme-check">
                        {active && <Check size={9} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Accounts ── */}
          <section className="section">
            <div className="section-label">Accounts</div>
            <div className="card-group">
              <button className="row">
                <div className="row-icon row-icon--indigo"><User size={15} /></div>
                <div className="row-content">
                  <div className="row-label">Accounts</div>
                  <div className="row-sub">All account related settings</div>
                </div>
                <div className="row-end">
                  <ChevronRight size={14} className="row-chevron" />
                </div>
              </button>
            </div>
          </section>

          {/* ── Security ── */}
          <section className="section">
            <div className="section-label">Security</div>
            <div className="card-group">
              <button className="row">
                <div className="row-icon row-icon--emerald"><Key size={15} /></div>
                <div className="row-content">
                  <div className="row-label">Change Password</div>
                  <div className="row-sub">Last changed 3 months ago</div>
                </div>
                <div className="row-end">
                  <ChevronRight size={14} className="row-chevron" />
                </div>
              </button>
              <div className="row" style={{ cursor: 'default' }}>
                <div className="row-icon row-icon--amber"><Bell size={15} /></div>
                <div className="row-content">
                  <div className="row-label">Login Activity Alerts</div>
                  <div className="row-sub">Email on new sign-ins</div>
                </div>
                <div className="row-end">
                  <Toggle on={activityAlerts} onToggle={() => setActivityAlerts(a => !a)} />
                </div>
              </div>
              <button className="row">
                <div className="row-icon row-icon--slate"><Eye size={15} /></div>
                <div className="row-content">
                  <div className="row-label">Active Sessions</div>
                  <div className="row-sub">3 devices currently signed in</div>
                </div>
                <div className="row-end">
                  <span className="badge badge--indigo">3</span>
                  <ChevronRight size={14} className="row-chevron" />
                </div>
              </button>
              <button className="row">
                <div className="row-icon row-icon--slate"><Palette size={15} /></div>
                <div className="row-content">
                  <div className="row-label">Data & Privacy</div>
                  <div className="row-sub">Download or delete your data</div>
                </div>
                <div className="row-end">
                  <ChevronRight size={14} className="row-chevron" />
                </div>
              </button>
            </div>
          </section>

          {/* ── Danger Zone ── */}
          <section className="section">
            <div className="section-label">Danger Zone</div>
            <div className="danger-zone">
              <button
                className="row row--danger"
                onClick={handleLogout}
                disabled={isLoggingOut}
                style={{ opacity: isLoggingOut ? 0.6 : 1, pointerEvents: isLoggingOut ? 'none' : 'auto' }}
              >
                <div className="row-icon row-icon--red">
                  {isLoggingOut ? <span className="spinner" /> : <LogOut size={15} />}
                </div>
                <div className="row-content">
                  <div className="row-label">{isLoggingOut ? 'Signing out…' : 'Sign Out'}</div>
                  <div className="row-sub" style={{ color: 'rgba(248,113,113,0.45)' }}>End all active sessions</div>
                </div>
              </button>
              <button className="row row--danger">
                <div className="row-icon row-icon--red"><Trash2 size={15} /></div>
                <div className="row-content">
                  <div className="row-label">Delete Account</div>
                  <div className="row-sub" style={{ color: 'rgba(248,113,113,0.45)' }}>Permanently remove all data</div>
                </div>
                <div className="row-end">
                  <AlertTriangle size={13} style={{ color: 'rgba(248,113,113,0.5)' }} />
                </div>
              </button>
            </div>
          </section>

          {/* Footer */}
          <div className="s-footer">
            <span className="s-footer-heart">❤️</span>
            <p className="s-footer-text">
              Made with love by{' '}
              <span className="s-footer-name">Kunal Halder</span>
            </p>
            <span className="s-footer-version">Nexus · v2.4.1</span>
          </div>

        </main>
      </div>
    </>
  );
}