import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Database,
  Github,
  Server,
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Header } from '../components/Header.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

export const Settings = () => {
  const { user } = useAuth();
  const { setMobileOpen } = useOutletContext();
  const { addToast } = useNotification();

  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState('');

  const fetchConfig = async () => {
    try {
      const res = await api.get('/server/status');
      if (res.data.success) {
        setDbStatus(res.data.database);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Copied to clipboard!', 'info', 2000);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <>
      <Header
        title="Settings & Integrations"
        description="Inspect cloud integrations, database connections, and environment parameters"
        breadcrumbs={['DevOpsHub', 'Settings']}
        onRefresh={fetchConfig}
        setMobileOpen={setMobileOpen}
      />

      <div className="page-container">
        {/* User Account Info */}
        <div className="hub-card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>
            Current Authenticated Profile
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NAME</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>
                {user?.name || 'DevOps Engineer'}
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EMAIL</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>
                {user?.email || 'user@devopshub.io'}
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RBAC ROLE</div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginTop: '2px',
                  color: 'var(--accent-violet)',
                }}
              >
                {user?.role || 'devops_engineer'}
              </div>
            </div>
          </div>
        </div>

        {/* MongoDB Atlas Configuration Card */}
        <div className="hub-card" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                MongoDB Atlas Integration
              </h3>
            </div>
            <span
              className={`badge ${
                dbStatus?.isConnected ? 'badge-success' : 'badge-queued'
              }`}
            >
              {dbStatus?.isConnected ? 'Connected' : 'Action Required'}
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            DevOpsHub requires MongoDB Atlas to persist user accounts, deployment history, build logs, and time-series telemetry.
          </p>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connection State:</span>
              <strong style={{ color: dbStatus?.isConnected ? 'var(--success)' : 'var(--warning)' }}>
                {dbStatus?.readyStateText || 'Disconnected'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cluster Host:</span>
              <span className="font-mono">{dbStatus?.host || 'Not configured'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Name:</span>
              <span className="font-mono">{dbStatus?.databaseName || 'devopshub'}</span>
            </div>
          </div>

          {/* Setup Instructions */}
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              How to configure your existing MongoDB Atlas connection:
            </h4>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.7' }}>
              <li>
                Open <strong>MongoDB Atlas &rarr; Security &rarr; Network Access</strong>. Add your EC2 public IP or current machine IP.
              </li>
              <li>
                Open <strong>Database Access</strong> and ensure your database user has <code className="font-mono">readWrite</code> access to the <code className="font-mono">devopshub</code> database.
              </li>
              <li>
                In your root or backend <code className="font-mono">.env</code> file, set:
                <div
                  style={{
                    backgroundColor: '#050507',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <code className="font-mono" style={{ color: 'var(--accent-violet)' }}>
                    MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@&lt;cluster&gt;.mongodb.net/devopshub?retryWrites=true&amp;w=majority
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/devopshub?retryWrites=true&w=majority',
                        'mongo'
                      )
                    }
                    className="btn-icon"
                    title="Copy placeholder"
                  >
                    {copiedKey === 'mongo' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* GitHub Actions CI/CD Secrets Checklist */}
        <div className="hub-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Github size={20} style={{ color: 'var(--text-primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              GitHub Actions & EC2 Deployment Secrets Checklist
            </h3>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            To deploy automated releases to your existing AWS EC2 instance through GitHub Actions, add these repository secrets under <strong>Settings &rarr; Secrets and variables &rarr; Actions</strong>:
          </p>

          <div className="hub-table-wrapper">
            <table className="hub-table">
              <thead>
                <tr>
                  <th className="hub-th">Secret Name</th>
                  <th className="hub-th">Description</th>
                  <th className="hub-th">Example / Source</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hub-tr">
                  <td className="hub-td font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    EC2_HOST
                  </td>
                  <td className="hub-td">Public IPv4 address or DNS name of your EC2 instance</td>
                  <td className="hub-td font-mono" style={{ color: 'var(--text-muted)' }}>
                    e.g. 54.210.xx.xx
                  </td>
                </tr>
                <tr className="hub-tr">
                  <td className="hub-td font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    EC2_USER
                  </td>
                  <td className="hub-td">SSH username for your EC2 distribution</td>
                  <td className="hub-td font-mono" style={{ color: 'var(--text-muted)' }}>
                    ubuntu (or ec2-user)
                  </td>
                </tr>
                <tr className="hub-tr">
                  <td className="hub-td font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    EC2_SSH_KEY
                  </td>
                  <td className="hub-td">Private SSH Key (.pem) used to connect securely</td>
                  <td className="hub-td font-mono" style={{ color: 'var(--text-muted)' }}>
                    -----BEGIN RSA PRIVATE KEY-----
                  </td>
                </tr>
                <tr className="hub-tr">
                  <td className="hub-td font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    MONGODB_URI
                  </td>
                  <td className="hub-td">Your existing MongoDB Atlas connection URI</td>
                  <td className="hub-td font-mono" style={{ color: 'var(--text-muted)' }}>
                    mongodb+srv://...
                  </td>
                </tr>
                <tr className="hub-tr">
                  <td className="hub-td font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    JWT_SECRET
                  </td>
                  <td className="hub-td">Cryptographic signing secret for user session tokens</td>
                  <td className="hub-td font-mono" style={{ color: 'var(--text-muted)' }}>
                    min 32 random characters
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
