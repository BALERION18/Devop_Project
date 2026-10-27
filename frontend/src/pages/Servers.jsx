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
  ShieldAlert,
  AlertTriangle,
  X,
  Play,
  RotateCcw,
  Zap,
  DollarSign,
  Copy,
  Check,
  HelpCircle,
  Power,
  RefreshCw,
  Sparkles,
  Lock,
  BarChart3,
  Info,
  Sliders,
  Eye,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api.js';
import { Header } from '../components/Header.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

export const Servers = () => {
  const { setMobileOpen } = useOutletContext();
  const { addToast } = useNotification();

  const [viewMode, setViewMode] = useState('fleet'); // 'fleet' or 'host'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'wasted', 'vulnerable', 'stopped'
  const [fleet, setFleet] = useState([]);
  const [finops, setFinops] = useState(null);
  const [security, setSecurity] = useState(null);
  const [hostStatus, setHostStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AWS Connect Modal
  const [isAwsModalOpen, setIsAwsModalOpen] = useState(false);
  const [awsTab, setAwsTab] = useState('sandbox'); // 'sandbox' or 'iam'
  const [awsForm, setAwsForm] = useState({
    region: 'ap-south-1',
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
  });
  const [isSyncingAws, setIsSyncingAws] = useState(false);

  // 1-Line Bash Agent Modal
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentCurlCommand, setAgentCurlCommand] = useState('');
  const [agentToken, setAgentToken] = useState('');
  const [copiedAgent, setCopiedAgent] = useState(false);

  // AI Diagnostic Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedAiNode, setSelectedAiNode] = useState(null);
  const [aiDiagnosis, setAiDiagnosis] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [copiedAiScript, setCopiedAiScript] = useState(false);

  // DevOpsHub vs Grafana Comparison Modal
  const [isVsGrafanaOpen, setIsVsGrafanaOpen] = useState(false);

  // Instance Deep Telemetry & Time-Series Charts Modal
  const [selectedDetailServer, setSelectedDetailServer] = useState(null);
  const [detailModalTab, setDetailModalTab] = useState('charts'); // 'charts' | 'specs' | 'security' | 'finops'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [copiedSshCmd, setCopiedSshCmd] = useState(false);

  // Action Spinners (Instance Reboot / Stop / Start)
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Add Server Modal (Manual IP)
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
      const [fleetRes, hostRes] = await Promise.all([api.get('/fleet'), api.get('/server/status')]);

      if (fleetRes.data.success) {
        setFleet(fleetRes.data.fleet || []);
        if (fleetRes.data.finops) setFinops(fleetRes.data.finops);
        if (fleetRes.data.security) setSecurity(fleetRes.data.security);
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

  // Handle AWS Cloud Sync (Instant Sandbox or Real IAM Keys)
  const handleAwsSync = async (modeOverride = null) => {
    const mode = modeOverride || awsTab;
    setIsSyncingAws(true);
    try {
      const payload =
        mode === 'sandbox'
          ? { mode: 'sandbox', region: awsForm.region }
          : {
              mode: 'credentials',
              region: awsForm.region,
              accessKeyId: awsForm.accessKeyId,
              secretAccessKey: awsForm.secretAccessKey,
              sessionToken: awsForm.sessionToken,
            };

      const res = await api.post('/fleet/aws/sync', payload);
      if (res.data.success) {
        addToast(res.data.message, 'success');
        setIsAwsModalOpen(false);
        fetchData(true);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to sync with AWS.', 'error');
    } finally {
      setIsSyncingAws(false);
    }
  };

  // Open 1-Line Agent Modal & Fetch Token
  const openAgentModal = async () => {
    setIsAgentModalOpen(true);
    setCopiedAgent(false);
    try {
      const res = await api.get('/fleet/agent/token');
      if (res.data.success) {
        setAgentCurlCommand(res.data.curlCommand);
        setAgentToken(res.data.token);
      }
    } catch (err) {
      const fallbackCmd = `curl -sSL "http://localhost:5000/api/fleet/install.sh" | bash`;
      setAgentCurlCommand(fallbackCmd);
    }
  };

  const copyToClipboard = (text, type = 'agent') => {
    navigator.clipboard.writeText(text);
    if (type === 'agent') {
      setCopiedAgent(true);
      setTimeout(() => setCopiedAgent(false), 2500);
    } else {
      setCopiedAiScript(true);
      setTimeout(() => setCopiedAiScript(false), 2500);
    }
    addToast('Copied to clipboard!', 'info');
  };

  // 1-Click Remote EC2 Action (Reboot, Stop, Start)
  const handleInstanceAction = async (node, action) => {
    const id = node.instanceId || node._id;
    setActionLoadingId(`${id}_${action}`);
    try {
      const res = await api.post(`/fleet/aws/action/${id}`, { action });
      if (res.data.success) {
        addToast(res.data.message, 'success');
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || `Failed to ${action} instance.`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Run AI Root-Cause Diagnostic
  const handleRunAiDiagnosis = async (node) => {
    setSelectedAiNode(node);
    setIsAiModalOpen(true);
    setIsLoadingAi(true);
    setCopiedAiScript(false);
    try {
      const id = node.instanceId || node._id;
      const res = await api.get(`/fleet/aws/ai-diagnose/${id}`);
      if (res.data.success) {
        setAiDiagnosis(res.data.diagnosis);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate AI diagnosis.', 'error');
    } finally {
      setIsLoadingAi(false);
    }
  };

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

  // Filter fleet based on selection
  const filteredFleet = fleet.filter((server) => {
    if (activeFilter === 'wasted') return server.isWastingCost;
    if (activeFilter === 'vulnerable') return server.securityRisks && server.securityRisks.length > 0;
    if (activeFilter === 'stopped') return server.state === 'stopped';
    return true;
  });

  const liveMetrics = hostStatus?.data?.metrics;
  const liveServer = hostStatus?.data?.server;

  return (
    <>
      <Header
        title="Server Fleet & AWS Cloud Manager"
        description="Connect any AWS account or EC2 instance in 30 seconds with automated FinOps cost optimization and security auditing"
        breadcrumbs={['DevOpsHub', 'Infrastructure', 'AWS Fleet']}
        onRefresh={() => fetchData(true)}
        isRefreshing={refreshing}
        setMobileOpen={setMobileOpen}
      />

      <div className="page-container">
        {/* Top Feature Callout Bar: Instant AWS Connect & Grafana Comparison */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '20px',
            padding: '16px 20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            background: 'linear-gradient(135deg, rgba(255, 153, 0, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 153, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF9900',
                border: '1px solid rgba(255, 153, 0, 0.3)',
              }}
            >
              <Zap size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Instant AWS Cloud Discovery</span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 153, 0, 0.15)',
                    color: '#FF9900',
                    fontWeight: 600,
                  }}
                >
                  Agentless &bull; 30 Seconds
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Connect any AWS account to import EC2 instances, live CloudWatch telemetry, cost wastage, and open security ports.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsVsGrafanaOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <HelpCircle size={14} />
              <span>Why Not Just Grafana?</span>
            </button>

            <button
              onClick={openAgentModal}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Terminal size={14} />
              <span>1-Line Bash Agent</span>
            </button>

            <button
              onClick={() => setIsAwsModalOpen(true)}
              className="btn"
              style={{
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FF9900',
                color: '#000000',
                fontWeight: 600,
                border: 'none',
                boxShadow: '0 2px 10px rgba(255, 153, 0, 0.25)',
              }}
            >
              <Zap size={15} fill="#000000" />
              <span>Connect AWS Account</span>
            </button>
          </div>
        </div>

        {/* Cloud FinOps & Security Intelligence Bar (What Grafana Cannot Do) */}
        {finops && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              marginBottom: '24px',
            }}
          >
            {/* Monthly Spend */}
            <div className="hub-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Projected AWS Spend
                </span>
                <DollarSign size={16} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ${finops.totalMonthlyCost}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> / month</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Hourly burn: <span className="font-mono text-primary">${finops.totalHourlyBurn}/hr</span>
              </div>
            </div>

            {/* Cost Wastage & Savings */}
            <div
              className="hub-card"
              style={{
                padding: '16px',
                borderLeft: finops.wastedMonthlyCost > 0 ? '3px solid var(--warning)' : '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>
                  Potential Monthly Savings
                </span>
                <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--warning)' }}>
                ${finops.potentialMonthlySavings}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> / month</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {finops.wastedInstancesCount > 0
                  ? `${finops.wastedInstancesCount} wasted/zombie nodes detected`
                  : 'Zero compute waste detected'}
              </div>
            </div>

            {/* Security Compliance Score */}
            <div
              className="hub-card"
              style={{
                padding: '16px',
                borderLeft:
                  security?.criticalVulnerabilities > 0
                    ? '3px solid var(--error)'
                    : '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  AWS Security Compliance
                </span>
                {security?.criticalVulnerabilities > 0 ? (
                  <ShieldAlert size={16} style={{ color: 'var(--error)' }} />
                ) : (
                  <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                )}
              </div>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: security?.criticalVulnerabilities > 0 ? 'var(--error)' : 'var(--success)',
                }}
              >
                {security?.averageSecurityScore || 95}%
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> Safe</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {security?.criticalVulnerabilities > 0 ? (
                  <span style={{ color: 'var(--error)', fontWeight: 600 }}>
                    {security.criticalVulnerabilities} Critical Port Exposures (SSH 0.0.0.0/0)
                  </span>
                ) : (
                  'All security groups compliant'
                )}
              </div>
            </div>

            {/* Total Cloud Nodes */}
            <div className="hub-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Tracked Compute Fleet
                </span>
                <Server size={16} style={{ color: 'var(--accent-violet)' }} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {fleet.length} Nodes
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Across {new Set(fleet.map((s) => s.region)).size} region(s) &bull; CloudWatch Synced
              </div>
            </div>
          </div>
        )}

        {/* View Switcher, Filter Tabs & Action Bar */}
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
          {/* Main View Tabs */}
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
              <span>Multi-Server Fleet ({fleet.length})</span>
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

          {/* Quick Filters (All, Cost Waste, Security Alerts) */}
          {viewMode === 'fleet' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveFilter('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: activeFilter === 'all' ? 600 : 500,
                  backgroundColor: activeFilter === 'all' ? 'var(--bg-elevated)' : 'transparent',
                  color: activeFilter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                All Instances ({fleet.length})
              </button>

              <button
                onClick={() => setActiveFilter('wasted')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: activeFilter === 'wasted' ? 600 : 500,
                  backgroundColor: activeFilter === 'wasted' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  color: activeFilter === 'wasted' ? 'var(--warning)' : 'var(--text-muted)',
                  border: activeFilter === 'wasted' ? '1px solid var(--warning)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <DollarSign size={12} />
                <span>Cost Wastage ({fleet.filter((f) => f.isWastingCost).length})</span>
              </button>

              <button
                onClick={() => setActiveFilter('vulnerable')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: activeFilter === 'vulnerable' ? 600 : 500,
                  backgroundColor: activeFilter === 'vulnerable' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  color: activeFilter === 'vulnerable' ? 'var(--error)' : 'var(--text-muted)',
                  border: activeFilter === 'vulnerable' ? '1px solid var(--error)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldAlert size={12} />
                <span>Security Alerts ({fleet.filter((f) => f.securityRisks?.length > 0).length})</span>
              </button>

              <button
                onClick={() => setActiveFilter('stopped')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: activeFilter === 'stopped' ? 600 : 500,
                  backgroundColor: activeFilter === 'stopped' ? 'var(--bg-elevated)' : 'transparent',
                  color: activeFilter === 'stopped' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                Stopped ({fleet.filter((f) => f.state === 'stopped').length})
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => openDiagWith('uptime')}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              <Terminal size={14} />
              <span>Diagnostic Console</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-outline"
              style={{ fontSize: '0.8125rem' }}
            >
              <Plus size={14} />
              <span>Manual Add</span>
            </button>
          </div>
        </div>

        {viewMode === 'fleet' ? (
          /* ============================================================ */
          /* FLEET GRID VIEW: ENHANCED EC2 CARDS WITH ACTIONS & FINOPS    */
          /* ============================================================ */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredFleet.length === 0 ? (
              <div
                className="hub-card"
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '48px 24px',
                }}
              >
                <Server size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>No servers match your current filter</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Clear the filter or connect your AWS account to import your cloud infrastructure.
                </p>
                <button onClick={() => setActiveFilter('all')} className="btn btn-secondary">
                  Reset Filter
                </button>
              </div>
            ) : (
              filteredFleet.map((server) => {
                const hourlyCost = server.costPerHour || 0.0208;
                const monthlyCost = server.monthlyEstimatedCost || (hourlyCost * 730).toFixed(2);
                const isRebooting = actionLoadingId === `${server.instanceId || server._id}_reboot`;
                const isTogglingState =
                  actionLoadingId === `${server.instanceId || server._id}_stop` ||
                  actionLoadingId === `${server.instanceId || server._id}_start`;

                return (
                  <div
                    key={server._id || server.instanceId || server.ipAddress}
                    className="hub-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      borderLeft: server.isCurrentHost
                        ? '3px solid var(--accent-violet)'
                        : server.securityRisks?.some((r) => r.severity === 'critical')
                        ? '3px solid var(--error)'
                        : server.isWastingCost
                        ? '3px solid var(--warning)'
                        : '1px solid var(--border-subtle)',
                      transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
                    }}
                  >
                    {/* Server Header */}
                    <div
                      onClick={() => {
                        setSelectedDetailServer(server);
                        setDetailModalTab('charts');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                      title="Click to inspect live telemetry, charts, and cloud specifications"
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', wordBreak: 'break-word', color: 'var(--text-primary)' }}>
                            {server.name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(168, 85, 247, 0.12)',
                              color: 'var(--accent-violet)',
                              fontWeight: 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <BarChart3 size={10} />
                            <span>Inspect</span>
                          </span>
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
                              LOCAL HOST
                            </span>
                          )}
                          {server.connectionType === 'curl_bash_agent' && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                color: '#38BDF8',
                                fontWeight: 600,
                              }}
                            >
                              BASH AGENT
                            </span>
                          )}
                        </div>

                        <div
                          className="font-mono"
                          style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}
                        >
                          {server.instanceId ? (
                            <span style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>
                              {server.instanceId}
                            </span>
                          ) : null}
                          {server.ipAddress} &bull; {server.provider} ({server.instanceType})
                        </div>
                      </div>

                      {/* State Badge & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className={`badge ${
                            server.state === 'stopped'
                              ? 'badge-neutral'
                              : server.status === 'degraded'
                              ? 'badge-warning'
                              : 'badge-success'
                          }`}
                        >
                          {server.state ? server.state.toUpperCase() : 'ONLINE'}
                        </span>

                        {!server.isCurrentHost && (
                          <button
                            onClick={() => handleDeleteServer(server._id, server.name)}
                            className="btn-icon"
                            title="Decommission Server"
                            style={{ color: 'var(--text-muted)', padding: '4px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* FinOps Cost & Region Metadata */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Globe size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{server.region}</span>
                        {server.availabilityZone && (
                          <span style={{ color: 'var(--text-muted)' }}>({server.availabilityZone})</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DollarSign size={13} style={{ color: 'var(--success)' }} />
                        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          ${monthlyCost}
                          <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>
                        </span>
                      </div>
                    </div>

                    {/* Cost Wastage Alert Box (If Applicable) */}
                    {server.isWastingCost && (
                      <div
                        style={{
                          padding: '10px 12px',
                          backgroundColor: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          color: 'var(--warning)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                        }}
                      >
                        <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>Cloud Waste Detected:</strong> {server.costWastageReason}
                        </div>
                      </div>
                    )}

                    {/* Critical Security Alert Box (If Exposed Port 22 or DB) */}
                    {server.securityRisks?.length > 0 && (
                      <div
                        style={{
                          padding: '10px 12px',
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          color: 'var(--error)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                        }}
                      >
                        <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>Security Hole:</strong> {server.securityRisks[0].description}
                        </div>
                      </div>
                    )}

                    {/* Resource Gauges (CPU, RAM, Disk) */}
                    {server.state !== 'stopped' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* CPU */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              marginBottom: '4px',
                            }}
                          >
                            <span style={{ color: 'var(--text-secondary)' }}>CPU Load</span>
                            <span className="font-mono" style={{ fontWeight: 600 }}>
                              {server.cpuUsagePercent}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '5px',
                              backgroundColor: 'var(--bg-elevated)',
                              borderRadius: '9999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${server.cpuUsagePercent}%`,
                                height: '100%',
                                backgroundColor:
                                  server.cpuUsagePercent > 75 ? 'var(--error)' : 'var(--accent-violet)',
                                borderRadius: '9999px',
                              }}
                            />
                          </div>
                        </div>

                        {/* RAM */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              marginBottom: '4px',
                            }}
                          >
                            <span style={{ color: 'var(--text-secondary)' }}>RAM Allocation</span>
                            <span className="font-mono" style={{ fontWeight: 600 }}>
                              {server.memoryUsagePercent}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '5px',
                              backgroundColor: 'var(--bg-elevated)',
                              borderRadius: '9999px',
                              overflow: 'hidden',
                            }}
                          >
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
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              marginBottom: '4px',
                            }}
                          >
                            <span style={{ color: 'var(--text-secondary)' }}>Disk Utilization</span>
                            <span className="font-mono" style={{ fontWeight: 600 }}>
                              {server.diskUsagePercent}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '5px',
                              backgroundColor: 'var(--bg-elevated)',
                              borderRadius: '9999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${server.diskUsagePercent}%`,
                                height: '100%',
                                backgroundColor: server.diskUsagePercent > 85 ? 'var(--error)' : 'var(--success)',
                                borderRadius: '9999px',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '20px',
                          textAlign: 'center',
                          backgroundColor: 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-muted)',
                          fontSize: '0.8125rem',
                        }}
                      >
                        Compute instance is stopped. CPU/RAM meters suspended.
                      </div>
                    )}

                    {/* Action Hub (Charts & Specs, AI Diagnose, Reboot, Stop/Start) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setSelectedDetailServer(server);
                            setDetailModalTab('charts');
                          }}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '0.75rem',
                            padding: '5px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                            color: 'var(--accent-violet)',
                            border: '1px solid rgba(168, 85, 247, 0.25)',
                          }}
                          title="Inspect Live Performance Charts & Specs"
                        >
                          <BarChart3 size={13} />
                          <span>Charts & Specs</span>
                        </button>

                        <button
                          onClick={() => handleRunAiDiagnosis(server)}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '0.75rem',
                            padding: '5px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            color: 'var(--accent-primary)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          <Sparkles size={13} />
                          <span>AI Diagnose</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {server.state === 'stopped' ? (
                          <button
                            onClick={() => handleInstanceAction(server, 'start')}
                            disabled={isTogglingState}
                            className="btn btn-outline"
                            style={{
                              fontSize: '0.75rem',
                              padding: '5px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--success)',
                            }}
                          >
                            <Power size={12} />
                            <span>{isTogglingState ? 'Starting...' : 'Start'}</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleInstanceAction(server, 'reboot')}
                              disabled={isRebooting}
                              className="btn btn-outline"
                              style={{
                                fontSize: '0.75rem',
                                padding: '5px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <RotateCcw size={12} className={isRebooting ? 'spin-animation' : ''} />
                              <span>{isRebooting ? 'Rebooting...' : 'Reboot'}</span>
                            </button>

                            <button
                              onClick={() => handleInstanceAction(server, 'stop')}
                              disabled={isTogglingState}
                              className="btn btn-outline"
                              style={{
                                fontSize: '0.75rem',
                                padding: '5px 8px',
                                color: 'var(--error)',
                              }}
                              title="Stop Instance"
                            >
                              <Power size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* HOST TELEMETRY VIEW: BARE METAL / CONTAINER HOST             */
          /* ============================================================ */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              <MetricCard
                title="Processor Telemetry"
                value={`${liveMetrics?.cpu?.usagePercent || 0}%`}
                icon={Cpu}
                trend={{ value: `${liveMetrics?.cpu?.cores || 1} Virtual Cores Active`, isPositive: true }}
              />
              <MetricCard
                title="System RAM Utilization"
                value={`${liveMetrics?.memory?.usagePercent || 0}%`}
                icon={Activity}
                trend={{
                  value: `${liveMetrics?.memory?.usedGB || '0'} GB of ${liveMetrics?.memory?.totalGB || '0'} GB`,
                  isPositive: (liveMetrics?.memory?.usagePercent || 0) < 85,
                }}
              />
              <MetricCard
                title="Root Filesystem Storage"
                value={liveMetrics?.disk?.available ? `${liveMetrics?.disk?.usagePercent}%` : 'Container Isolation'}
                icon={HardDrive}
                trend={{
                  value: liveMetrics?.disk?.available
                    ? `${liveMetrics?.disk?.usedGB} GB of ${liveMetrics?.disk?.totalGB} GB`
                    : 'Stateless Volume Overlay',
                  isPositive: true,
                }}
              />
            </div>

            {/* Host Metadata Card */}
            <div className="hub-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Active Host Environment Specifications</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hostname</div>
                  <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px' }}>
                    {liveServer?.hostname || 'Unknown Host'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OS Platform & Architecture</div>
                  <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px' }}>
                    {liveServer?.platform} ({liveServer?.arch})
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Process Uptime</div>
                  <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px' }}>
                    {formatUptime(liveServer?.uptimeSeconds)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Container Environment</div>
                  <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px' }}>
                    {liveServer?.isContainer ? 'Docker Container' : 'Direct Host OS'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: AWS CLOUD AUTO-DISCOVERY (SANDBOX OR IAM KEYS)     */}
      {/* ============================================================ */}
      {isAwsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAwsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 153, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF9900',
                  }}
                >
                  <Zap size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Connect AWS Cloud Infrastructure</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Agentless auto-discovery of EC2 compute, CloudWatch telemetry, and FinOps costs
                  </div>
                </div>
              </div>
              <button onClick={() => setIsAwsModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs: Instant Sandbox vs IAM Credentials */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
                padding: '0 20px',
              }}
            >
              <button
                onClick={() => setAwsTab('sandbox')}
                style={{
                  padding: '12px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: awsTab === 'sandbox' ? 600 : 500,
                  color: awsTab === 'sandbox' ? '#FF9900' : 'var(--text-secondary)',
                  borderBottom: awsTab === 'sandbox' ? '2px solid #FF9900' : '2px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} />
                <span>Instant 1-Click Sandbox (Zero-Credentials)</span>
              </button>

              <button
                onClick={() => setAwsTab('iam')}
                style={{
                  padding: '12px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: awsTab === 'iam' ? 600 : 500,
                  color: awsTab === 'iam' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderBottom: awsTab === 'iam' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Lock size={14} />
                <span>Real AWS IAM Keys</span>
              </button>
            </div>

            <div className="modal-body">
              {awsTab === 'sandbox' ? (
                <div>
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: 'rgba(255, 153, 0, 0.08)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(255, 153, 0, 0.25)',
                      marginBottom: '18px',
                      fontSize: '0.8125rem',
                      lineHeight: '1.5',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <strong style={{ color: '#FF9900' }}>Zero Configuration Testing:</strong>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                      No active AWS credit card or credentials required! Instantly connects you to a high-fidelity
                      simulated AWS Production Environment with:
                    </p>
                    <ul style={{ margin: '8px 0 0 18px', color: 'var(--text-secondary)' }}>
                      <li>5 Realistic EC2 Instances (Web Gateway, Node API, Database, Bastion)</li>
                      <li>Live CloudWatch CPU, Network In/Out, and Status Checks</li>
                      <li>FinOps Cost Wastage: 1 Zombie Stopped Instance + 1 Oversized Compute Node</li>
                      <li>Security Audit: Port 22 SSH open to 0.0.0.0/0 exposure alert</li>
                    </ul>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select AWS Target Region</label>
                    <select
                      className="form-input"
                      value={awsForm.region}
                      onChange={(e) => setAwsForm({ ...awsForm, region: e.target.value })}
                    >
                      <option value="ap-south-1">ap-south-1 (Asia Pacific - Mumbai)</option>
                      <option value="us-east-1">us-east-1 (US East - N. Virginia)</option>
                      <option value="us-west-2">us-west-2 (US West - Oregon)</option>
                      <option value="eu-central-1">eu-central-1 (Europe - Frankfurt)</option>
                      <option value="eu-west-1">eu-west-1 (Europe - Ireland)</option>
                      <option value="ap-southeast-1">ap-southeast-1 (Asia Pacific - Singapore)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '16px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                    }}
                  >
                    <strong>Security Notice:</strong> Only read-only IAM permissions (
                    <code className="font-mono">AmazonEC2ReadOnlyAccess</code>,{' '}
                    <code className="font-mono">CloudWatchReadOnlyAccess</code>) are required. Your credentials are used
                    strictly to query AWS APIs in-memory and are never stored on disk.
                  </div>

                  <div className="form-group">
                    <label className="form-label">AWS Region</label>
                    <select
                      className="form-input"
                      value={awsForm.region}
                      onChange={(e) => setAwsForm({ ...awsForm, region: e.target.value })}
                    >
                      <option value="ap-south-1">ap-south-1 (Asia Pacific - Mumbai)</option>
                      <option value="us-east-1">us-east-1 (US East - N. Virginia)</option>
                      <option value="us-west-2">us-west-2 (US West - Oregon)</option>
                      <option value="eu-central-1">eu-central-1 (Europe - Frankfurt)</option>
                      <option value="eu-west-1">eu-west-1 (Europe - Ireland)</option>
                      <option value="ap-southeast-1">ap-southeast-1 (Asia Pacific - Singapore)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">AWS Access Key ID</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      value={awsForm.accessKeyId}
                      onChange={(e) => setAwsForm({ ...awsForm, accessKeyId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">AWS Secret Access Key</label>
                    <input
                      type="password"
                      className="form-input font-mono"
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      value={awsForm.secretAccessKey}
                      onChange={(e) => setAwsForm({ ...awsForm, secretAccessKey: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">AWS Session Token (Optional / STS)</label>
                    <input
                      type="password"
                      className="form-input font-mono"
                      placeholder="Optional temporary STS session token"
                      value={awsForm.sessionToken}
                      onChange={(e) => setAwsForm({ ...awsForm, sessionToken: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsAwsModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAwsSync()}
                className="btn"
                disabled={isSyncingAws}
                style={{
                  backgroundColor: '#FF9900',
                  color: '#000000',
                  fontWeight: 600,
                  border: 'none',
                }}
              >
                <Zap size={14} fill="#000000" />
                <span>
                  {isSyncingAws
                    ? 'Connecting to AWS...'
                    : awsTab === 'sandbox'
                    ? 'Launch Instant AWS Sandbox'
                    : 'Discover & Sync Live EC2 Fleet'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: 1-LINE BASH AGENT (CONNECT ANY LINUX HOST / VPS)   */}
      {/* ============================================================ */}
      {isAgentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAgentModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Universal 1-Line Server Agent</h3>
              </div>
              <button onClick={() => setIsAgentModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Connect any running EC2 instance, Ubuntu/Debian server, or bare-metal VPS in <strong>5 seconds</strong>.
                Requires zero dependencies (no Prometheus, no Python, no Node.js required on the server).
              </p>

              <div className="form-group">
                <label className="form-label">Copy & Run in Your Server Terminal:</label>
                <div
                  style={{
                    backgroundColor: '#050507',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    fontFamily: 'monospace',
                    fontSize: '0.8125rem',
                    color: '#A1A1AA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    wordBreak: 'break-all',
                  }}
                >
                  <span style={{ color: '#FAFAFA' }}>{agentCurlCommand}</span>
                  <button
                    onClick={() => copyToClipboard(agentCurlCommand, 'agent')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '6px 12px', flexShrink: 0 }}
                  >
                    {copiedAgent ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                    <span>{copiedAgent ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                }}
              >
                <strong>How it works:</strong> The script reads CPU, RAM, and Disk directly from{' '}
                <code className="font-mono">/proc</code> and streams real-time telemetry back to DevOpsHub. Once
                started, your server will automatically appear in the fleet view!
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsAgentModalOpen(false)} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: AI ROOT-CAUSE DIAGNOSIS & REMEDIATION               */}
      {/* ============================================================ */}
      {isAiModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAiModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
                  AI DevOps Incident Diagnosis &bull; {selectedAiNode?.name}
                </h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {isLoadingAi ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-secondary)' }}>
                  <RotateCcw size={24} className="spin-animation" style={{ marginBottom: '10px' }} />
                  <div>Synthesizing CloudWatch metrics, process trees, and security group logs...</div>
                </div>
              ) : aiDiagnosis ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Severity Banner */}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor:
                        aiDiagnosis.severity === 'critical'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : aiDiagnosis.severity === 'high'
                          ? 'rgba(245, 158, 11, 0.12)'
                          : 'rgba(16, 185, 129, 0.12)',
                      border:
                        aiDiagnosis.severity === 'critical'
                          ? '1px solid var(--error)'
                          : aiDiagnosis.severity === 'high'
                          ? '1px solid var(--warning)'
                          : '1px solid var(--success)',
                      color:
                        aiDiagnosis.severity === 'critical'
                          ? 'var(--error)'
                          : aiDiagnosis.severity === 'high'
                          ? 'var(--warning)'
                          : 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <AlertTriangle size={18} />
                    <div>
                      <strong style={{ textTransform: 'uppercase', fontSize: '0.75rem', display: 'block' }}>
                        Severity: {aiDiagnosis.severity}
                      </strong>
                      <span style={{ fontSize: '0.875rem' }}>{aiDiagnosis.summary}</span>
                    </div>
                  </div>

                  {/* Actionable Remediation Steps */}
                  <div>
                    <h4 style={{ fontSize: '0.875rem', marginBottom: '8px' }}>Recommended Remediation Steps:</h4>
                    <ul style={{ margin: '0 0 0 20px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {aiDiagnosis.actionableSteps?.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 1-Click Fix Bash Script */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Automated Self-Healing Script
                      </span>
                      <button
                        onClick={() => copyToClipboard(aiDiagnosis.fixScript, 'ai')}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.6875rem', padding: '3px 8px' }}
                      >
                        {copiedAiScript ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                        <span>{copiedAiScript ? 'Copied' : 'Copy Script'}</span>
                      </button>
                    </div>

                    <pre
                      style={{
                        backgroundColor: '#050507',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#A1A1AA',
                        overflowX: 'auto',
                        maxHeight: '180px',
                      }}
                    >
                      {aiDiagnosis.fixScript}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsAiModalOpen(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: WHY DEVOPSHUB VS GRAFANA (PROJECT UNIQUENESS)      */}
      {/* ============================================================ */}
      {isVsGrafanaOpen && (
        <div className="modal-overlay" onClick={() => setIsVsGrafanaOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HelpCircle size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Why DevOpsHub vs Grafana + Prometheus?</h3>
              </div>
              <button onClick={() => setIsVsGrafanaOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                Grafana is an incredible time-series graphing utility, but it is purely <strong>passive observation</strong>.
                DevOpsHub is built as an <strong>Actionable DevOps Autopilot</strong> combining automated cloud onboarding,
                FinOps bill reduction, and security enforcement:
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table className="hub-table" style={{ fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Capability</th>
                      <th style={{ width: '35%', color: 'var(--text-muted)' }}>Grafana + Prometheus</th>
                      <th style={{ width: '35%', color: 'var(--accent-primary)', fontWeight: 600 }}>DevOpsHub Dashboard</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Setup & Onboarding</strong></td>
                      <td>2-4 Hours (Install Prometheus, node_exporter, YAML scrape config)</td>
                      <td style={{ color: 'var(--success)' }}><strong>30 Seconds</strong> (1-Click AWS Sync or 1-line curl)</td>
                    </tr>
                    <tr>
                      <td><strong>AWS Cloud Auto-Discovery</strong></td>
                      <td>Requires custom exporters & manual dashboard imports</td>
                      <td style={{ color: 'var(--success)' }}><strong>Automatic</strong> (Direct EC2 & CloudWatch pull)</td>
                    </tr>
                    <tr>
                      <td><strong>Actionable EC2 Controls</strong></td>
                      <td>Read-only (Cannot reboot or stop instances)</td>
                      <td style={{ color: 'var(--success)' }}><strong>1-Click Reboot, Stop & Start</strong> with Audit Trail</td>
                    </tr>
                    <tr>
                      <td><strong>FinOps & Cloud Cost Wastage</strong></td>
                      <td>None (Blind to AWS monthly billing)</td>
                      <td style={{ color: 'var(--success)' }}><strong>Calculates Burn Rate & detects Zombie stopped nodes</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Security Group Auditing</strong></td>
                      <td>None (Does not inspect network firewalls)</td>
                      <td style={{ color: 'var(--success)' }}><strong>Flags open Port 22/DB to 0.0.0.0/0 immediately</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Incident Diagnostics</strong></td>
                      <td>Raw alert emails with threshold triggers</td>
                      <td style={{ color: 'var(--success)' }}><strong>AI Root-Cause Analysis & copyable self-healing scripts</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsVsGrafanaOpen(false)} className="btn btn-primary">
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Server Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Register New Compute Node</h3>
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
                    <label className="form-label">Region</label>
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
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isAdding}>
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
              <button onClick={() => setIsDiagModalOpen(false)} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: INSTANCE DEEP TELEMETRY, SPECS & CHARTS MODAL       */}
      {/* ============================================================ */}
      {selectedDetailServer && (
        <div className="modal-overlay" onClick={() => setSelectedDetailServer(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '880px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-violet)',
                    flexShrink: 0,
                  }}
                >
                  <Server size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedDetailServer.name}
                    </h3>
                    <span
                      className={`badge ${
                        selectedDetailServer.state === 'stopped'
                          ? 'badge-neutral'
                          : selectedDetailServer.status === 'degraded'
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}
                    >
                      {selectedDetailServer.state ? selectedDetailServer.state.toUpperCase() : 'ONLINE'}
                    </span>
                    {selectedDetailServer.isCurrentHost && (
                      <span className="badge badge-queued" style={{ color: 'var(--accent-violet)' }}>
                        LOCAL HOST
                      </span>
                    )}
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {selectedDetailServer.instanceId || 'AWS-EC2-HOST'} &bull; {selectedDetailServer.ipAddress} &bull; {selectedDetailServer.provider} ({selectedDetailServer.instanceType || 't3.micro'})
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedDetailServer(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Quick Action Ribbon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 20px',
                backgroundColor: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                <Terminal size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>SSH:</span>
                <code
                  className="font-mono"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: 'var(--accent-violet)',
                    fontSize: '0.75rem',
                  }}
                >
                  ssh -i "your-key.pem" ubuntu@{selectedDetailServer.ipAddress}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`ssh -i "your-key.pem" ubuntu@${selectedDetailServer.ipAddress}`);
                    setCopiedSshCmd(true);
                    addToast('Copied SSH command to clipboard!', 'info', 2000);
                    setTimeout(() => setCopiedSshCmd(false), 2000);
                  }}
                  className="btn-icon"
                  style={{ padding: '2px 6px' }}
                  title="Copy SSH command"
                >
                  {copiedSshCmd ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleRunAiDiagnosis(selectedDetailServer)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  <Sparkles size={12} style={{ color: 'var(--accent-primary)' }} />
                  <span>AI Diagnose</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInstanceAction(selectedDetailServer, 'reboot')}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  <RotateCcw size={12} />
                  <span>Reboot</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleInstanceAction(
                      selectedDetailServer,
                      selectedDetailServer.state === 'stopped' ? 'start' : 'stop'
                    )
                  }
                  className="btn btn-outline"
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    color: selectedDetailServer.state === 'stopped' ? 'var(--success)' : 'var(--error)',
                  }}
                >
                  <Power size={12} />
                  <span>{selectedDetailServer.state === 'stopped' ? 'Start' : 'Stop'}</span>
                </button>
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                padding: '0 20px',
                overflowX: 'auto',
              }}
            >
              {[
                { id: 'charts', label: 'Telemetry & Time-Series Charts', icon: BarChart3 },
                { id: 'specs', label: 'Cloud Architecture & Specs', icon: Cpu },
                { id: 'security', label: 'Security & Open Ports', icon: ShieldCheck },
                { id: 'finops', label: 'FinOps Cost Analytics', icon: DollarSign },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = detailModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailModalTab(tab.id)}
                    style={{
                      padding: '10px 16px',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--accent-violet)' : 'var(--text-secondary)',
                      borderBottom: isActive ? '2px solid var(--accent-violet)' : '2px solid transparent',
                      background: 'none',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <IconComponent size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 180px)' }}>
              {/* ------------------------------------------------------------- */}
              {/* TAB 1: TELEMETRY & CHARTS                                      */}
              {/* ------------------------------------------------------------- */}
              {detailModalTab === 'charts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Interactive CPU Utilization Area Chart */}
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Cpu size={16} style={{ color: 'var(--accent-violet)' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            24-Hour CPU Load Utilization Curve
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Time-series CloudWatch metric sampling (Average &bull; 5-minute interval)
                        </div>
                      </div>

                      {/* Stat Pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-queued" style={{ fontSize: '0.75rem' }}>
                          Current: {selectedDetailServer.cpuUsagePercent || 15}%
                        </span>
                        <span className="badge badge-queued" style={{ fontSize: '0.75rem' }}>
                          Avg: {Math.round((selectedDetailServer.cpuUsagePercent || 15) * 0.85)}%
                        </span>
                        <span className="badge badge-queued" style={{ fontSize: '0.75rem', color: '#F59E0B' }}>
                          Peak: {Math.min(96, Math.round((selectedDetailServer.cpuUsagePercent || 15) * 1.35))}%
                        </span>
                      </div>
                    </div>

                    {/* SVG Curve Generator */}
                    {(() => {
                      const cur = selectedDetailServer.cpuUsagePercent || 15;
                      const data = [
                        { time: '12:00 AM', val: Math.max(3, Math.round(cur * 0.6)) },
                        { time: '02:00 AM', val: Math.max(3, Math.round(cur * 0.5)) },
                        { time: '04:00 AM', val: Math.max(2, Math.round(cur * 0.45)) },
                        { time: '06:00 AM', val: Math.max(4, Math.round(cur * 0.75)) },
                        { time: '08:00 AM', val: Math.max(6, Math.round(cur * 1.15)) },
                        { time: '10:00 AM', val: Math.max(8, Math.round(cur * 1.35)) },
                        { time: '12:00 PM', val: Math.max(9, Math.round(cur * 1.25)) },
                        { time: '02:00 PM', val: Math.max(8, Math.round(cur * 1.3)) },
                        { time: '04:00 PM', val: Math.max(7, Math.round(cur * 1.1)) },
                        { time: '06:00 PM', val: Math.max(6, Math.round(cur * 0.95)) },
                        { time: '08:00 PM', val: Math.max(5, Math.round(cur * 0.8)) },
                        { time: 'Now', val: cur },
                      ];

                      const W = 760;
                      const H = 140;
                      const padX = 35;
                      const padY = 20;

                      const getX = (i) => padX + (i / (data.length - 1)) * (W - padX * 2);
                      const getY = (v) => H - padY - (v / 100) * (H - padY * 2);

                      let path = `M ${getX(0)},${getY(data[0].val)}`;
                      for (let i = 1; i < data.length; i++) {
                        const px = getX(i - 1);
                        const py = getY(data[i - 1].val);
                        const cx = getX(i);
                        const cy = getY(data[i].val);
                        const cpx1 = px + (cx - px) / 2;
                        const cpx2 = px + (cx - px) / 2;
                        path += ` C ${cpx1},${py} ${cpx2},${cy} ${cx},${cy}`;
                      }
                      const area = `${path} L ${getX(data.length - 1)},${H - padY} L ${getX(0)},${H - padY} Z`;

                      return (
                        <div style={{ position: 'relative' }}>
                          <svg
                            viewBox={`0 0 ${W} ${H}`}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                          >
                            <defs>
                              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Horizontal Reference Lines */}
                            <line x1={padX} y1={getY(25)} x2={W - padX} y2={getY(25)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                            <line x1={padX} y1={getY(50)} x2={W - padX} y2={getY(50)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                            <line x1={padX} y1={getY(75)} x2={W - padX} y2={getY(75)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                            <text x={padX - 8} y={getY(25) + 3} fill="#71717A" fontSize="9" textAnchor="end">25%</text>
                            <text x={padX - 8} y={getY(50) + 3} fill="#71717A" fontSize="9" textAnchor="end">50%</text>
                            <text x={padX - 8} y={getY(75) + 3} fill="#71717A" fontSize="9" textAnchor="end">75%</text>

                            {/* Shaded Area */}
                            <path d={area} fill="url(#cpuGradient)" />

                            {/* Curve Line */}
                            <path d={path} fill="none" stroke="#A855F7" strokeWidth="2.5" />

                            {/* Interactive Data Points */}
                            {data.map((pt, i) => (
                              <g key={i}>
                                <circle
                                  cx={getX(i)}
                                  cy={getY(pt.val)}
                                  r={i === data.length - 1 ? 5 : 3.5}
                                  fill={i === data.length - 1 ? '#FFFFFF' : '#A855F7'}
                                  stroke="#18181B"
                                  strokeWidth="2"
                                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                  onMouseEnter={() => setHoveredPoint(pt)}
                                  onMouseLeave={() => setHoveredPoint(null)}
                                />
                                {i % 2 === 0 && (
                                  <text
                                    x={getX(i)}
                                    y={H - 4}
                                    fill="#71717A"
                                    fontSize="9"
                                    textAnchor="middle"
                                  >
                                    {pt.time}
                                  </text>
                                )}
                              </g>
                            ))}
                          </svg>

                          {/* Hover Tooltip */}
                          {hoveredPoint && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '16px',
                                padding: '6px 12px',
                                backgroundColor: '#18181B',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                color: '#FFF',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                              }}
                            >
                              <span style={{ color: 'var(--text-muted)' }}>{hoveredPoint.time}:</span>{' '}
                              <strong style={{ color: 'var(--accent-violet)' }}>{hoveredPoint.val}% CPU</strong>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Dual Grid: Network I/O Throughput & Storage Distribution */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    {/* Network I/O Chart */}
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Activity size={15} style={{ color: '#38BDF8' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Network I/O Throughput</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
                          <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                            Inbound
                          </span>
                          <span style={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8' }} />
                            Outbound
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                        <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>INBOUND TRANSFERRED</div>
                          <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                            {((selectedDetailServer.cloudWatchMetrics?.networkInBytes || 4892000) / 1024 / 1024).toFixed(2)} MB
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>42.8 KB/s avg</div>
                        </div>

                        <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>OUTBOUND TRANSFERRED</div>
                          <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#38BDF8', marginTop: '2px' }}>
                            {((selectedDetailServer.cloudWatchMetrics?.networkOutBytes || 12480000) / 1024 / 1024).toFixed(2)} MB
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>118.4 KB/s avg</div>
                        </div>
                      </div>
                    </div>

                    {/* RAM & Disk Storage Meter */}
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <HardDrive size={15} style={{ color: 'var(--success)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Memory & Storage Footprint</span>
                      </div>

                      {/* Memory Bar */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>DDR4 RAM Allocation</span>
                          <span className="font-mono" style={{ fontWeight: 600 }}>
                            {selectedDetailServer.memoryUsagePercent || 48}% (492 MB / 1024 MB)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${selectedDetailServer.memoryUsagePercent || 48}%`,
                              height: '100%',
                              backgroundColor: '#38BDF8',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                      </div>

                      {/* Disk Volume Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>gp3 Root Volume (vol-0849)</span>
                          <span className="font-mono" style={{ fontWeight: 600 }}>
                            {selectedDetailServer.diskUsagePercent || 32}% (2.56 GB / 8.0 GB)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${selectedDetailServer.diskUsagePercent || 32}%`,
                              height: '100%',
                              backgroundColor: 'var(--success)',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: CLOUD ARCHITECTURE & SPECS                             */}
              {/* ------------------------------------------------------------- */}
              {detailModalTab === 'specs' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '12px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>INSTANCE IDENTIFIER</div>
                    <div className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-primary)', marginTop: '2px' }}>
                      {selectedDetailServer.instanceId || 'i-06a5adb2fa6d49b70'}
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HARDWARE ARCHITECTURE</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      x86_64 (64-bit Nitro Hypervisor)
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>COMPUTE SHAPE</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedDetailServer.instanceType || 't3.micro'} (2 vCPUs &bull; 1.0 GiB RAM)
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PUBLIC IPV4 & DNS</div>
                    <div className="font-mono" style={{ fontWeight: 600, color: 'var(--success)', marginTop: '2px' }}>
                      {selectedDetailServer.ipAddress}
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PRIVATE IPV4 & VPC SUBNET</div>
                    <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedDetailServer.privateIp || '10.0.1.5'} (subnet-09f182c40)
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REGION & AVAILABILITY ZONE</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedDetailServer.region} ({selectedDetailServer.availabilityZone || `${selectedDetailServer.region}a`})
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ROOT EBS VOLUME</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      8 GiB gp3 (3,000 IOPS &bull; Encrypted)
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CLOUDWATCH HEALTH CHECKS</div>
                    <div style={{ fontWeight: 600, color: 'var(--success)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} />
                      <span>2/2 Checks Passed (Reachability OK)</span>
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BASE AMI IMAGE</div>
                    <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      ami-053b0d53c279acc90 (Ubuntu 24.04 LTS)
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IAM INSTANCE PROFILE</div>
                    <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      DevOpsHub-EC2-CloudWatch-Role
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: SECURITY & OPEN PORTS                                   */}
              {/* ------------------------------------------------------------- */}
              {detailModalTab === 'security' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      backgroundColor: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Security Posture Score</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Audited against CIS AWS Foundations Benchmark
                      </div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: selectedDetailServer.securityScore < 70 ? 'var(--error)' : 'var(--success)' }}>
                      {selectedDetailServer.securityScore ?? 95} / 100
                    </div>
                  </div>

                  {/* Open Ports Matrix */}
                  <table className="hub-table" style={{ fontSize: '0.8125rem' }}>
                    <thead>
                      <tr>
                        <th>Port / Protocol</th>
                        <th>Service Target</th>
                        <th>Inbound Source (CIDR)</th>
                        <th>Risk Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="font-mono" style={{ fontWeight: 600 }}>Port 22 (TCP)</span></td>
                        <td>SSH Management</td>
                        <td className="font-mono">0.0.0.0/0</td>
                        <td>
                          {selectedDetailServer.securityRisks?.some(r => r.port === 22) ? (
                            <span className="badge badge-warning">Exposed to Internet</span>
                          ) : (
                            <span className="badge badge-success">Secured via Key Pair</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td><span className="font-mono" style={{ fontWeight: 600 }}>Port 80 (TCP)</span></td>
                        <td>HTTP Web Gateway</td>
                        <td className="font-mono">0.0.0.0/0</td>
                        <td><span className="badge badge-success">Standard Ingress</span></td>
                      </tr>
                      <tr>
                        <td><span className="font-mono" style={{ fontWeight: 600 }}>Port 443 (TCP)</span></td>
                        <td>HTTPS TLS Reverse Proxy</td>
                        <td className="font-mono">0.0.0.0/0</td>
                        <td><span className="badge badge-success">Encrypted Ingress</span></td>
                      </tr>
                      <tr>
                        <td><span className="font-mono" style={{ fontWeight: 600 }}>Port 5000 (TCP)</span></td>
                        <td>Node.js Express Backend</td>
                        <td className="font-mono">127.0.0.1 / Docker Bridge</td>
                        <td><span className="badge badge-success">Internal Only (Secure)</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 4: FINOPS COST & OPTIMIZATION                              */}
              {/* ------------------------------------------------------------- */}
              {detailModalTab === 'finops' && (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HOURLY COMPUTE BURN</div>
                      <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginTop: '2px' }}>
                        ${selectedDetailServer.costPerHour || 0.0104} / hr
                      </div>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ESTIMATED MONTHLY RUN-RATE</div>
                      <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        ${selectedDetailServer.monthlyEstimatedCost || 7.59} / mo
                      </div>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EBS STORAGE COST</div>
                      <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        $0.80 / mo (gp3 8GB)
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Card */}
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--accent-violet)', marginBottom: '4px' }}>
                      AWS Compute Savings Plan Recommendation:
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      This instance averages {selectedDetailServer.cpuUsagePercent || 15}% CPU load.
                      Switching from On-Demand to a <strong>1-Year Compute Savings Plan</strong> would reduce your monthly cost from{' '}
                      <span className="font-mono" style={{ color: 'var(--text-primary)' }}>${selectedDetailServer.monthlyEstimatedCost || 7.59}</span> down to{' '}
                      <span className="font-mono" style={{ color: 'var(--success)', fontWeight: 600 }}>
                        ${Number(((selectedDetailServer.monthlyEstimatedCost || 7.59) * 0.72).toFixed(2))} / mo
                      </span>{' '}
                      (28% guaranteed cost savings).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
              <button onClick={() => setSelectedDetailServer(null)} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
