import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Plus,
  Terminal,
  Trash2,
  CheckCircle2,
  Box,
  Globe,
  Clock,
  Layers,
  ShieldCheck,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import api from '../services/api.js';
import { Header } from '../components/Header.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

export const Servers = () => {
  const { setMobileOpen } = useOutletContext();
  const { addToast } = useNotification();

  const [viewMode, setViewMode] = useState('fleet'); // 'fleet' or 'host'
  const [fleet, setFleet] = useState([]);
  const [hostStatus, setHostStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Server Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    ipAddress: '',
    provider: 'AWS EC2',
    instanceType: 't3.micro',
    region: 'ap-south-1 (Mumbai)',
    environment: 'production',
    tags: 'ec2, microservice',
  });
  const [isAdding, setIsAdding] = useState(false);

  // Diagnostic Runner Modal
  const [isDiagModalOpen, setIsDiagModalOpen] = useState(false);
  const [diagCommand, setDiagCommand] = useState('uptime');
  const [diagOutput, setDiagOutput] = useState('');
  const [isExecutingDiag, setIsExecutingDiag] = useState(false);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [fleetRes, hostRes] = await Promise.all([
        api.get('/fleet'),
        api.get('/server/status'),
      ]);

      if (fleetRes.data.success) {
        setFleet(fleetRes.data.fleet || []);
      }
      if (hostRes.data.success) {
        setHostStatus(hostRes.data);
      }
    } catch (err) {
      console.error('Failed to load fleet data:', err);
      addToast('Failed to retrieve server fleet data.', 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddServer = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await api.post('/fleet', addForm);
      if (res.data.success) {
        addToast('Server node added to fleet successfully!', 'success');
        setIsAddModalOpen(false);
        setAddForm({
          name: '',
          ipAddress: '',
          provider: 'AWS EC2',
          instanceType: 't3.micro',
          region: 'ap-south-1 (Mumbai)',
          environment: 'production',
          tags: 'ec2, microservice',
        });
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add server.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteServer = async (id, name) => {
    if (!confirm(`Are you sure you want to decommission server "${name}"?`)) return;
    try {
      const res = await api.delete(`/fleet/${id}`);
      if (res.data.success) {
        addToast(`Server "${name}" removed from fleet.`, 'info');
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete server.', 'error');
    }
  };

  const handleRunDiagnostic = async (cmd) => {
    const commandToRun = cmd || diagCommand;
    setIsExecutingDiag(true);
    try {
      const res = await api.post('/fleet/diagnostic', { command: commandToRun });
      if (res.data.success) {
        setDiagOutput(res.data.output);
      }
    } catch (err) {
      setDiagOutput(err.response?.data?.message || 'Failed to execute diagnostic probe.');
    } finally {
      setIsExecutingDiag(false);
    }
  };

  const openDiagWith = (cmd) => {
    setDiagCommand(cmd);
    setIsDiagModalOpen(true);
    handleRunDiagnostic(cmd);
  };

  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return 'Active';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  const liveMetrics = hostStatus?.data?.metrics;
  const liveServer = hostStatus?.data?.server;

  return (
    <>
      <Header
        title="Server Fleet & Infrastructure"
        description="Manage multi-server fleets, EC2 compute nodes, and live host diagnostics"
        breadcrumbs={['DevOpsHub', 'Infrastructure', 'Server Fleet']}
        onRefresh={() => fetchData(true)}
        isRefreshing={refreshing}
        setMobileOpen={setMobileOpen}
      />

      <div className="page-container">
        {/* View Switcher & Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              padding: '4px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setViewMode('fleet')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                fontWeight: viewMode === 'fleet' ? 600 : 500,
                color: viewMode === 'fleet' ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: viewMode === 'fleet' ? 'var(--bg-elevated)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Server size={14} />
              <span>Fleet Overview ({fleet.length} Nodes)</span>
            </button>

            <button
              onClick={() => setViewMode('host')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                fontWeight: viewMode === 'host' ? 600 : 500,
                color: viewMode === 'host' ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: viewMode === 'host' ? 'var(--bg-elevated)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Activity size={14} />
              <span>Active Host Telemetry</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => openDiagWith('uptime')}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              <Terminal size={14} />
              <span>Run Diagnostic Probe</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem' }}
            >
              <Plus size={15} />
              <span>Register New Server</span>
            </button>
          </div>
        </div>

        {viewMode === 'fleet' ? (
          /* ============================================================ */
          /* FLEET GRID VIEW: MULTI-SERVER MANAGEMENT                     */
          /* ============================================================ */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {fleet.map((server) => (
              <div
                key={server._id || server.ipAddress}
                className="hub-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  borderLeft: server.isCurrentHost ? '3px solid var(--accent-violet)' : '1px solid var(--border-subtle)',
                }}
              >
                {/* Server Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{server.name}</span>
                      {server.isCurrentHost && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--accent-subtle)',
                            color: 'var(--accent-violet)',
                            fontWeight: 600,
                          }}
                        >
                          HOST
                        </span>
                      )}
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {server.ipAddress} &bull; {server.provider} ({server.instanceType})
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge badge-success">Online</span>
                    {!server.isCurrentHost && (
                      <button
                        onClick={() => handleDeleteServer(server._id, server.name)}
                        className="btn-icon"
                        title="Decommission Server"
                        style={{ color: 'var(--text-muted)', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Resource Gauges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* CPU */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>CPU Load</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{server.cpuUsagePercent}%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-elevated)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${server.cpuUsagePercent}%`,
                          height: '100%',
                          backgroundColor: server.cpuUsagePercent > 75 ? 'var(--error)' : 'var(--accent-violet)',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>

                  {/* RAM */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>RAM Allocation</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{server.memoryUsagePercent}%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-elevated)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${server.memoryUsagePercent}%`,
                          height: '100%',
                          backgroundColor: server.memoryUsagePercent > 80 ? 'var(--error)' : '#38BDF8',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Disk */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Storage (Disk)</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{server.diskUsagePercent}%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-elevated)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${server.diskUsagePercent}%`,
                          height: '100%',
                          backgroundColor: 'var(--success)',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer details: Region, Uptime, Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={13} />
                    <span>{server.region}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Uptime: {formatUptime(server.uptimeSeconds)}</span>
                    <button
                      onClick={() => openDiagWith('df -h')}
                      className="btn btn-outline"
                      style={{ padding: '3px 8px', fontSize: '0.6875rem' }}
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ============================================================ */
          /* HOST TELEMETRY: CURRENT INSTANCE DEEP DIVE                   */
          /* ============================================================ */
          <div>
            <div
              className="hub-card"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>AWS EC2 Instance Online & Serving Traffic</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Public IPv4: <strong>13.232.254.140</strong> &bull; Node.js {liveMetrics?.process?.nodeVersion || 'v22'} &bull; Docker Container
                  </div>
                </div>
              </div>

              <a
                href="http://13.232.254.140/api/health"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem' }}
              >
                /api/health Probe
              </a>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '24px',
              }}
            >
              <MetricCard
                title="Real CPU Utilization"
                value={`${liveMetrics?.cpu?.usagePercent ?? 0}%`}
                subtitle="Sampled via delta clock ticks across all cores"
                icon={Cpu}
                percent={liveMetrics?.cpu?.usagePercent || 0}
                accentColor="var(--accent-violet)"
              />

              <MetricCard
                title="RAM Usage"
                value={`${liveMetrics?.memory?.usagePercent ?? 0}%`}
                subtitle={`Used: ${liveMetrics?.memory?.usedGB || 0.4} GB / Total: ${liveMetrics?.memory?.totalGB || 0.9} GB`}
                icon={Activity}
                percent={liveMetrics?.memory?.usagePercent || 0}
                accentColor="#38BDF8"
              />

              <MetricCard
                title="Disk Usage"
                value={liveMetrics?.disk?.available ? `${liveMetrics.disk.usagePercent}%` : '31%'}
                subtitle={`Mount: ${liveMetrics?.disk?.mountPoint || '/'}`}
                icon={HardDrive}
                percent={liveMetrics?.disk?.available ? liveMetrics.disk.usagePercent : 31}
                accentColor="var(--success)"
              />
            </div>
          </div>
        )}
      </div>

      {/* Register Server Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={18} style={{ color: 'var(--accent-violet)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Register New Server / Node</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddServer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Server / Cluster Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. EC2-Worker-Mumbai"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">IP Address / Hostname</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    placeholder="e.g. 13.232.xxx.xxx or internal DNS"
                    value={addForm.ipAddress}
                    onChange={(e) => setAddForm({ ...addForm, ipAddress: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Cloud Provider</label>
                    <select
                      className="form-input"
                      value={addForm.provider}
                      onChange={(e) => setAddForm({ ...addForm, provider: e.target.value })}
                    >
                      <option value="AWS EC2">AWS EC2</option>
                      <option value="Google Cloud">Google Cloud</option>
                      <option value="DigitalOcean">DigitalOcean</option>
                      <option value="Azure">Azure</option>
                      <option value="On-Premise Bare-Metal">On-Premise Bare-Metal</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Instance Type</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. t3.micro, t3.small"
                      value={addForm.instanceType}
                      onChange={(e) => setAddForm({ ...addForm, instanceType: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">AWS Region</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addForm.region}
                      onChange={(e) => setAddForm({ ...addForm, region: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Environment</label>
                    <select
                      className="form-input"
                      value={addForm.environment}
                      onChange={(e) => setAddForm({ ...addForm, environment: e.target.value })}
                    >
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. backend, redis, worker"
                    value={addForm.tags}
                    onChange={(e) => setAddForm({ ...addForm, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isAdding}
                >
                  <Plus size={14} />
                  <span>{isAdding ? 'Registering...' : 'Add Server Node'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diagnostic Probe Runner Modal */}
      {isDiagModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDiagModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Remote Server Diagnostic Console</h3>
              </div>
              <button onClick={() => setIsDiagModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['uptime', 'df -h', 'free -m', 'docker ps', 'netstat -tuln'].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setDiagCommand(cmd);
                      handleRunDiagnostic(cmd);
                    }}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      fontFamily: 'monospace',
                      backgroundColor: diagCommand === cmd ? 'var(--border-subtle)' : undefined,
                    }}
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              <div
                style={{
                  backgroundColor: '#050507',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  color: '#A1A1AA',
                }}
              >
                {isExecutingDiag ? (
                  <div style={{ color: 'var(--accent-violet)' }}>Executing command on host...</div>
                ) : (
                  diagOutput || 'Select or enter a command above to inspect node.'
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => handleRunDiagnostic(diagCommand)}
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem' }}
                disabled={isExecutingDiag}
              >
                <RotateCcw size={13} />
                <span>Re-run Command</span>
              </button>
              <button
                onClick={() => setIsDiagModalOpen(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
