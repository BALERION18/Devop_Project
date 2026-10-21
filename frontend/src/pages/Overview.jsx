import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Rocket,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Database,
  ExternalLink,
  Cpu,
  HardDrive,
  GitBranch,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Header } from '../components/Header.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

export const Overview = () => {
  const { user } = useAuth();
  const { setMobileOpen } = useOutletContext();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await api.get('/dashboard/summary');
      if (res.data.success) {
        setSummary(res.data);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <>
      <Header
        title="Overview"
        description="Unified deployment metrics and AWS EC2 server telemetry"
        breadcrumbs={['DevOpsHub', 'Dashboard']}
        onRefresh={() => fetchSummary(true)}
        isRefreshing={refreshing}
        setMobileOpen={setMobileOpen}
      />

      <div className="page-container">
        {/* Welcome Header */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Welcome back, {user?.name || 'Engineer'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            System operational summary for your production environments and compute nodes.
          </p>
        </div>

        {/* Database Not Connected Alert Banner */}
        {summary?.integrations?.database?.status === 'disconnected' && (
          <div
            className="hub-card"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Database size={20} style={{ color: 'var(--warning)' }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--warning)', fontSize: '0.875rem' }}>
                  MongoDB Atlas Not Connected
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Set <code className="font-mono">MONGODB_URI</code> in your backend .env file to persist deployments and server metrics.
                </div>
              </div>
            </div>
            <Link to="/settings" className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
              Configure Atlas
            </Link>
          </div>
        )}

        {/* Top Metric Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <MetricCard
            title="Total Deployments"
            value={loading ? '...' : summary?.stats?.totalDeployments ?? 0}
            subtitle={
              summary?.stats?.totalDeployments === 0
                ? 'No deployments recorded yet'
                : `${summary?.stats?.successfulDeployments || 0} successful, ${summary?.stats?.failedDeployments || 0} failed`
            }
            icon={Rocket}
            accentColor="var(--accent-primary)"
          />

          <MetricCard
            title="Pipeline Success Rate"
            value={loading ? '...' : `${summary?.stats?.successRate ?? 0}%`}
            subtitle="Calculated over total builds"
            icon={Activity}
            percent={summary?.stats?.successRate || 0}
            accentColor="var(--success)"
          />

          <MetricCard
            title="EC2 CPU Utilization"
            value={loading ? '...' : `${summary?.serverHealth?.cpuUsagePercent ?? 0}%`}
            subtitle="Real-time multi-core CPU load"
            icon={Cpu}
            percent={summary?.serverHealth?.cpuUsagePercent || 0}
            accentColor="var(--accent-violet)"
          />

          <MetricCard
            title="Server Memory Usage"
            value={loading ? '...' : `${summary?.serverHealth?.memoryUsagePercent ?? 0}%`}
            subtitle={summary?.serverHealth?.environmentType || 'Host Node'}
            icon={HardDrive}
            percent={summary?.serverHealth?.memoryUsagePercent || 0}
            accentColor="#38BDF8"
          />
        </div>

        {/* Middle Two-Column Grid: Latest Deployment & Server Health */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '20px',
            marginBottom: '28px',
          }}
        >
          {/* Latest Deployment Widget */}
          <div className="hub-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Latest Deployment</h3>
              <Link
                to="/deployments"
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div className="skeleton" style={{ height: '70px', width: '100%' }} />
              </div>
            ) : summary?.latestDeployment ? (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {summary.latestDeployment.serviceName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {summary.latestDeployment.environment}
                    </span>
                  </div>
                  <StatusBadge status={summary.latestDeployment.status} />
                </div>

                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                    lineHeight: 1.4,
                  }}
                >
                  {summary.latestDeployment.commitMessage}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <GitBranch size={13} />
                    <span>{summary.latestDeployment.branch}</span>
                  </div>
                  <div className="font-mono" style={{ color: 'var(--accent-violet)' }}>
                    {summary.latestDeployment.commitSha}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    <Clock size={13} />
                    <span>{new Date(summary.latestDeployment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-subtle)',
                }}
              >
                <Rocket size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  No deployments recorded yet
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Trigger your first deployment in the Deployment Manager
                </p>
                <Link
                  to="/deployments"
                  className="btn btn-secondary"
                  style={{ marginTop: '12px', fontSize: '0.75rem' }}
                >
                  Go to Deployment Manager
                </Link>
              </div>
            )}
          </div>

          {/* EC2 Server Status Summary */}
          <div className="hub-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>EC2 Server Availability</h3>
              <Link
                to="/server-status"
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <span>Live Metrics</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  EC2 Instance Health
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="status-dot active"></span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--success)' }}>
                    Available & Healthy
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Runtime Environment
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {summary?.serverHealth?.environmentType || 'Host Operating System'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Process Uptime
                </span>
                <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {summary?.serverHealth?.uptimeSeconds
                    ? `${Math.floor(summary.serverHealth.uptimeSeconds / 60)} min ${summary.serverHealth.uptimeSeconds % 60}s`
                    : 'Active'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Atlas Database Status
                </span>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color:
                      summary?.integrations?.database?.status === 'connected'
                        ? 'var(--success)'
                        : 'var(--warning)',
                  }}
                >
                  {summary?.integrations?.database?.status === 'connected'
                    ? 'Connected'
                    : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Deployment Activity Table */}
        <div className="hub-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Deployment Activity</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Latest build and deployment runs across your environments
              </p>
            </div>
            <Link to="/deployments" className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
              View All History
            </Link>
          </div>

          <div className="hub-table-wrapper">
            <table className="hub-table">
              <thead>
                <tr>
                  <th className="hub-th">Service / Commit</th>
                  <th className="hub-th">Environment</th>
                  <th className="hub-th">Branch</th>
                  <th className="hub-th">Status</th>
                  <th className="hub-th">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="hub-td" style={{ textAlign: 'center', padding: '32px' }}>
                      Loading recent deployment history...
                    </td>
                  </tr>
                ) : summary?.recentDeployments?.length > 0 ? (
                  summary.recentDeployments.map((dep) => (
                    <tr key={dep._id || dep.commitSha} className="hub-tr">
                      <td className="hub-td">
                        <div style={{ fontWeight: 600 }}>{dep.serviceName}</div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '320px',
                          }}
                        >
                          {dep.commitMessage}
                        </div>
                      </td>
                      <td className="hub-td">
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {dep.environment}
                        </span>
                      </td>
                      <td className="hub-td font-mono" style={{ fontSize: '0.8125rem' }}>
                        {dep.branch}
                      </td>
                      <td className="hub-td">
                        <StatusBadge status={dep.status} />
                      </td>
                      <td className="hub-td" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {new Date(dep.createdAt || dep.deployedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="hub-td"
                      style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}
                    >
                      No deployments recorded yet. Seed demo records or trigger a deployment in the Deployment Manager.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
