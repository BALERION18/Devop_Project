import React from 'react';
import { Menu, Activity, RefreshCw } from 'lucide-react';

export const Header = ({ title, description, breadcrumbs = [], onRefresh, isRefreshing, setMobileOpen }) => {
  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-main)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={() => setMobileOpen(true)}
          className="btn-icon"
          style={{ display: 'none', cursor: 'pointer' }}
          id="mobile-menu-toggle"
          aria-label="Open navigation drawer"
        >
          <Menu size={20} />
        </button>

        <style>{`
          @media (max-width: 768px) {
            #mobile-menu-toggle { display: flex !important; }
            header { padding: 0 16px !important; }
          }
        `}</style>

        {/* Title & Context */}
        <div>
          {breadcrumbs.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '2px',
              }}
            >
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb}>
                  <span>{crumb}</span>
                  {idx < breadcrumbs.length - 1 && <span>/</span>}
                </React.Fragment>
              ))}
            </div>
          )}
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{title}</h1>
        </div>
      </div>

      {/* Right controls: Refresh & System Pulse */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
            disabled={isRefreshing}
            title="Refresh live data"
            id="header-refresh-btn"
          >
            <RefreshCw
              size={14}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span className="hidden-sm">Refresh</span>
          </button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
          }}
        >
          <span className="status-dot active"></span>
          <span style={{ color: 'var(--text-secondary)' }}>System Active</span>
        </div>
      </div>
    </header>
  );
};
