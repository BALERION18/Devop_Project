import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Rocket,
  Search,
  Filter,
  RefreshCw,
  Plus,
  GitBranch,
  Clock,
  ExternalLink,
  ChevronRight,
  Terminal,
  X,
  Github,
  Database,
  Sparkles,
} from 'lucide-react';
import api from '../services/api.js';
import { Header } from '../components/Header.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

export const Deployments = () => {
  const { setMobileOpen } = useOutletContext();
  const { addToast } = useNotification();

  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [meta, setMeta] = useState({ total: 0, githubConfigured: false, dbConnected: true });

  // Detail Modal State
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  // Trigger Deployment Modal State
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [triggerForm, setTriggerForm] = useState({
    serviceName: 'devopshub-app',
    environment: 'production',
    branch: 'main',
    commitMessage: 'Manual deployment triggered from DevOpsHub dashboard',
  });
  const [isTriggering, setIsTriggering] = useState(false);
  const [isSyncingGH, setIsSyncingGH] = useState(false);

  const fetchDeployments = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (envFilter !== 'all') params.environment = envFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/deployments', { params });
      if (res.data.success) {
        setDeployments(res.data.deployments || []);
        setMeta({
          total: res.data.total || 0,
          githubConfigured: res.data.githubConfigured,
          dbConnected: res.data.dbConnected,
        });
      }
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
      addToast('Failed to load deployment records.', 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, [statusFilter, envFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDeployments();
  };

  const handleTriggerSubmit = async (e) => {
    e.preventDefault();
    setIsTriggering(true);
    try {
      const res = await api.post('/deployments/trigger', triggerForm);
      if (res.data.success) {
        addToast('Deployment initiated! Building multi-stage container...', 'success');
        setIsTriggerModalOpen(false);
        fetchDeployments();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to trigger deployment.', 'error');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSyncGitHub = async () => {
    setIsSyncingGH(true);
    try {
      const res = await api.post('/deployments/refresh');
      if (res.data.success) {
        addToast(res.data.message || 'GitHub Actions synced successfully!', 'success');
        fetchDeployments();
      } else if (!res.data.configured) {
        addToast('GitHub Actions is not configured in backend .env', 'warning');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'GitHub sync failed.', 'error');
    } finally {
      setIsSyncingGH(false);
    }
  };

  const handleSeedDeployments = async () => {
    try {
      const res = await api.post('/deployments/seed');
      if (res.data.success) {
        addToast('Seeded demo deployments successfully!', 'success');
        fetchDeployments();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Seed failed.', 'error');
    }
  };

  return (
    <>
      <Header
        title="Deployment Manager"
        description="Monitor deployment pipelines, inspect build logs, and manage releases"
        breadcrumbs={['DevOpsHub', 'Deployment Manager']}
        onRefresh={() => fetchDeployments(true)}
        isRefreshing={refreshing}
        setMobileOpen={setMobileOpen}
      />

      <div className="page-container">
        {/* Banner: GitHub Integration Status */}
        {!meta.githubConfigured && (
          <div
            className="hub-card"
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
              borderColor: 'rgba(99, 102, 241, 0.25)',
              marginBottom: '20px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Github size={18} style={{ color: 'var(--accent-primary)' }} />
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <strong>GitHub Actions Telemetry:</strong> Add <code className="font-mono">GITHUB_TOKEN</code> and <code className="font-mono">GITHUB_REPO</code> to your backend environment to automatically sync live CI/CD pipeline runs.
              </div>
            </div>
            <button
              onClick={handleSyncGitHub}
              disabled={isSyncingGH}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <RefreshCw size={13} style={{ animation: isSyncingGH ? 'spin 1s linear infinite' : 'none' }} />
              <span>Test GitHub Sync</span>
            </button>
          </div>
        )}

        {/* Action Bar: Search, Filters, and New Deployment */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '20px',
          }}
        >
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1', minWidth: '240px', maxWidth: '380px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by branch, SHA, commit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8125rem' }}
              />
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          </form>

          {/* Filters & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', height: '38px', fontSize: '0.8125rem', padding: '6px 12px' }}
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="in_progress">In Progress</option>
              <option value="queued">Queued</option>
            </select>

            {/* Environment Filter */}
            <select
              className="form-input"
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              style={{ width: 'auto', height: '38px', fontSize: '0.8125rem', padding: '6px 12px' }}
            >
              <option value="all">All Environments</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>

            {/* Seed Demo Deployments Button */}
            {deployments.length === 0 && (
              <button
                onClick={handleSeedDeployments}
                className="btn btn-secondary"
                style={{ height: '38px', fontSize: '0.8125rem' }}
                title="Seed realistic demo deployments"
              >
                <Sparkles size={14} style={{ color: 'var(--accent-violet)' }} />
                <span>Seed Demo Data</span>
              </button>
            )}

            {/* Trigger Deployment Button */}
            <button
              onClick={() => setIsTriggerModalOpen(true)}
              className="btn btn-primary"
              style={{ height: '38px', fontSize: '0.8125rem' }}
              id="trigger-deployment-btn"
            >
              <Plus size={16} />
              <span>Trigger Deployment</span>
            </button>
          </div>
        </div>

        {/* Deployments History Table */}
        <div className="hub-table-wrapper">
          <table className="hub-table">
            <thead>
              <tr>
                <th className="hub-th">Service & Commit</th>
                <th className="hub-th">Environment</th>
                <th className="hub-th">Branch & SHA</th>
                <th className="hub-th">Status</th>
                <th className="hub-th">Duration</th>
                <th className="hub-th">Author</th>
                <th className="hub-th">Timestamp</th>
                <th className="hub-th" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="hub-td" style={{ textAlign: 'center', padding: '48px' }}>
                    Loading deployments from MongoDB Atlas...
                  </td>
                </tr>
              ) : deployments.length > 0 ? (
                deployments.map((dep) => (
                  <tr key={dep._id || dep.workflowRunId || dep.commitSha} className="hub-tr">
                    <td className="hub-td">
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {dep.serviceName}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          maxWidth: '260px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
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
                    <td className="hub-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <GitBranch size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.8125rem' }}>{dep.branch}</span>
                      </div>
                      <div
                        className="font-mono"
                        style={{ fontSize: '0.6875rem', color: 'var(--accent-violet)', marginTop: '2px' }}
                      >
                        {dep.commitSha}
                      </div>
                    </td>
                    <td className="hub-td">
                      <StatusBadge status={dep.status} />
                    </td>
                    <td className="hub-td" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {dep.durationSeconds ? `${dep.durationSeconds}s` : '--'}
                    </td>
                    <td className="hub-td" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {dep.author}
                    </td>
                    <td className="hub-td" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(dep.createdAt || dep.deployedAt).toLocaleString()}
                    </td>
                    <td className="hub-td" style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedDeployment(dep)}
                        className="btn btn-outline"
                        style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                      >
                        <span>Logs</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="hub-td" style={{ textAlign: 'center', padding: '56px 20px' }}>
                    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                      <Rocket size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>
                        No deployments found
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        {searchQuery || statusFilter !== 'all' || envFilter !== 'all'
                          ? 'No deployments match your current filter criteria.'
                          : 'You haven’t triggered any deployments yet. You can simulate a pipeline run or seed demo records.'}
                      </p>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                          onClick={handleSeedDeployments}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.8125rem' }}
                        >
                          <Sparkles size={14} />
                          <span>Seed Demo Deployments</span>
                        </button>
                        <button
                          onClick={() => setIsTriggerModalOpen(true)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.8125rem' }}
                        >
                          <Plus size={14} />
                          <span>Trigger Deployment</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deployment Detail & Logs Modal */}
      {selectedDeployment && (
        <div className="modal-overlay" onClick={() => setSelectedDeployment(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Terminal size={18} style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
                    Deployment Details — {selectedDeployment.serviceName}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Commit: {selectedDeployment.commitSha} on {selectedDeployment.branch}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeployment(null)}
                className="btn-icon"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Metadata Summary Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                  padding: '14px',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  fontSize: '0.8125rem',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>STATUS</div>
                  <div style={{ marginTop: '4px' }}>
                    <StatusBadge status={selectedDeployment.status} />
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>ENVIRONMENT</div>
                  <div style={{ marginTop: '4px', fontWeight: 600 }}>{selectedDeployment.environment}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>AUTHOR</div>
                  <div style={{ marginTop: '4px', fontWeight: 600 }}>{selectedDeployment.author}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>DURATION</div>
                  <div style={{ marginTop: '4px', fontWeight: 600 }}>
                    {selectedDeployment.durationSeconds ? `${selectedDeployment.durationSeconds}s` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Commit Message */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  COMMIT MESSAGE
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {selectedDeployment.commitMessage}
                </div>
              </div>

              {/* Terminal Logs Output */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  BUILD & DEPLOYMENT TELEMETRY LOGS
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
                  }}
                >
                  {selectedDeployment.logs && selectedDeployment.logs.length > 0 ? (
                    selectedDeployment.logs.map((log, index) => (
                      <div key={index} style={{ marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          [{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '00:00:00'}]
                        </span>{' '}
                        <span style={{ color: 'var(--accent-violet)', fontWeight: 600 }}>
                          [{log.step || 'Step'}]
                        </span>{' '}
                        <span
                          style={{
                            color:
                              log.status === 'success'
                                ? 'var(--success)'
                                : log.status === 'error'
                                ? 'var(--error)'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {log.message}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      No granular logs recorded for this deployment.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {selectedDeployment.workflowRunUrl && (
                <a
                  href={selectedDeployment.workflowRunUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ marginRight: 'auto', fontSize: '0.8125rem' }}
                >
                  <ExternalLink size={14} />
                  <span>View on GitHub Actions</span>
                </a>
              )}
              <button
                onClick={() => setSelectedDeployment(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Deployment Modal */}
      {isTriggerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTriggerModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Rocket size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Trigger Deployment</h3>
              </div>
              <button
                onClick={() => setIsTriggerModalOpen(false)}
                className="btn-icon"
                aria-label="Close trigger modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTriggerSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Service Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={triggerForm.serviceName}
                    onChange={(e) => setTriggerForm({ ...triggerForm, serviceName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Environment</label>
                  <select
                    className="form-input"
                    value={triggerForm.environment}
                    onChange={(e) => setTriggerForm({ ...triggerForm, environment: e.target.value })}
                  >
                    <option value="production">Production (AWS EC2)</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Git Branch</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    value={triggerForm.branch}
                    onChange={(e) => setTriggerForm({ ...triggerForm, branch: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Release Description / Commit Note</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={triggerForm.commitMessage}
                    onChange={(e) => setTriggerForm({ ...triggerForm, commitMessage: e.target.value })}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsTriggerModalOpen(false)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem' }}
                  disabled={isTriggering}
                >
                  <Rocket size={14} />
                  <span>{isTriggering ? 'Dispatching...' : 'Deploy Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
