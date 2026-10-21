import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="hub-card"
        style={{
          maxWidth: '440px',
          textAlign: 'center',
          padding: '48px 32px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-violet)',
            margin: '0 auto 18px',
          }}
        >
          <Compass size={24} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
          404 — Page Not Found
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          The dashboard endpoint or route you are looking for does not exist.
        </p>

        <Link to="/" className="btn btn-primary" style={{ padding: '10px 18px' }}>
          <ArrowLeft size={16} />
          <span>Back to Overview</span>
        </Link>
      </div>
    </div>
  );
};
