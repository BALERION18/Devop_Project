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
  Zap,
  Play,
  HardDrive,
  Cloud,
  Layers,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Folder,
  FileText,
  Activity,
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

  // Active Connector Tab: 'mongodb' | 's3' | 'redis'
  const [activeTab, setActiveTab] = useState('mongodb');

  // MongoDB Connector State
  const [mongoUri, setMongoUri] = useState('');
  const [showMongoUri, setShowMongoUri] = useState(false);
  const [isTestingMongo, setIsTestingMongo] = useState(false);
  const [mongoTestResult, setMongoTestResult] = useState(null);
  const [mongoError, setMongoError] = useState(null);

  // AWS S3 Connector State
  const [s3Form, setS3Form] = useState({
    bucketName: 'devopshub-cloud-artifacts-prod',
    region: 'ap-south-1',
    accessKeyId: '',
    secretAccessKey: '',
  });
  const [isTestingS3, setIsTestingS3] = useState(false);
  const [s3TestResult, setS3TestResult] = useState(null);
  const [s3Error, setS3Error] = useState(null);

  // Redis Probe State
  const [redisForm, setRedisForm] = useState({ host: '127.0.0.1', port: 6379 });
  const [isTestingRedis, setIsTestingRedis] = useState(false);
  const [redisTestResult, setRedisTestResult] = useState(null);

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
    // Auto-ping current cluster on initial load for instant data
    handleTestMongo(true);
  }, []);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Copied to clipboard!', 'info', 2000);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Test MongoDB Connection
  const handleTestMongo = async (useCurrent = false) => {
    setIsTestingMongo(true);
    setMongoError(null);
    try {
      const payload = useCurrent ? { mode: 'current' } : { uri: mongoUri };
      const res = await api.post('/integrations/test-mongodb', payload);
      if (res.data.success) {
        setMongoTestResult(res.data);
        addToast(res.data.message || 'MongoDB connection verified!', 'success');
      } else {
        setMongoError(res.data.message);
        setMongoTestResult(null);
      }
    } catch (err) {
      setMongoError(err.response?.data?.message || err.message);
      setMongoTestResult(null);
      addToast('MongoDB connection failed. Check credentials/whitelist.', 'error');
    } finally {
      setIsTestingMongo(false);
    }
  };

  // Test AWS S3 Connection
  const handleTestS3 = async (isDemo = false) => {
    setIsTestingS3(true);
    setS3Error(null);
    try {
      const payload = isDemo ? { mode: 'demo', bucketName: s3Form.bucketName, region: s3Form.region } : s3Form;
      const res = await api.post('/integrations/test-s3', payload);
      if (res.data.success) {
        setS3TestResult(res.data.bucket);
        addToast(res.data.message || 'S3 Bucket connection verified!', 'success');
      } else {
        setS3Error(res.data.message);
        setS3TestResult(null);
      }
    } catch (err) {
      setS3Error(err.response?.data?.message || err.message);
      setS3TestResult(null);
      addToast('AWS S3 verification failed.', 'error');
    } finally {
      setIsTestingS3(false);
    }
  };

  // Test Redis Probe
  const handleTestRedis = async () => {
    setIsTestingRedis(true);
    try {
      const res = await api.post('/integrations/test-redis', redisForm);
      if (res.data.success) {
        setRedisTestResult(res.data.cache);
        addToast('Redis cache probe succeeded!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Redis probe failed.', 'error');
    } finally {
      setIsTestingRedis(false);
    }
  };

  return (
    <>
      <Header
        title="Settings & Cloud Integrations"
        description="Connect and inspect your MongoDB Atlas database, AWS S3 storage, and infrastructure telemetry"
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
                {user?.name || 'DevOps Leader'}
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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROJECT ROLE</div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginTop: '2px',
                  color: 'var(--accent-violet)',
                  textTransform: 'capitalize',
                }}
              >
                {user?.role || 'leader'}
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TEAM WORKSPACE ID</div>
              <div className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '2px' }}>
                {user?.teamId ? user.teamId.slice(0, 14) + '...' : 'Default Team'}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MULTI-CLOUD DATABASE & STORAGE CONNECTOR HUB                              */}
        {/* ========================================================================= */}
        <div className="hub-card" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cloud size={20} style={{ color: 'var(--accent-violet)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                  Multi-Cloud Database & Storage Connectors
                </h3>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Connect any custom MongoDB Atlas cluster, AWS S3 storage bucket, or cache probe to inspect latency, collections, and live cloud telemetry.
              </p>
            </div>

            {/* Connector Tabs Switcher */}
            <div
              style={{
                display: 'flex',
                padding: '4px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('mongodb')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  fontWeight: activeTab === 'mongodb' ? 600 : 500,
                  backgroundColor: activeTab === 'mongodb' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'mongodb' ? 'var(--success)' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Database size={14} />
                <span>MongoDB Atlas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('s3')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  fontWeight: activeTab === 's3' ? 600 : 500,
                  backgroundColor: activeTab === 's3' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 's3' ? '#F59E0B' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <HardDrive size={14} />
                <span>AWS S3 Storage</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('redis')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  fontWeight: activeTab === 'redis' ? 600 : 500,
                  backgroundColor: activeTab === 'redis' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'redis' ? '#38BDF8' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Zap size={14} />
                <span>Redis Probe</span>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* TAB 1: MONGODB ATLAS CONNECTOR                                */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'mongodb' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Custom MongoDB Connection String (URI)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Starts with mongodb+srv://
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                  <input
                    type={showMongoUri ? 'text' : 'password'}
                    className="form-input font-mono"
                    placeholder="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    style={{ paddingRight: '40px', fontSize: '0.8125rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMongoUri(!showMongoUri)}
                    className="btn-icon"
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    title={showMongoUri ? 'Hide password' : 'Show password'}
                  >
                    {showMongoUri ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => handleTestMongo(false)}
                  disabled={isTestingMongo || !mongoUri.trim()}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
                >
                  {isTestingMongo ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
                  <span>Test Custom Connection</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestMongo(true)}
                  disabled={isTestingMongo}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
                >
                  <Sparkles size={14} style={{ color: 'var(--accent-violet)' }} />
                  <span>Inspect Active Atlas Cluster</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMongoUri('mongodb+srv://user_demo:DemoPassword123@ac-cluster-prod.fub48fi.mongodb.net/devopshub?retryWrites=true&w=majority');
                    addToast('Loaded sample MongoDB Atlas connection string!', 'info');
                  }}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8125rem', padding: '8px 14px' }}
                >
                  <span>Load Sample URI</span>
                </button>
              </div>

              {/* Error Alert */}
              {mongoError && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--error)',
                    fontSize: '0.8125rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Connection Failed:</strong> {mongoError}
                    <div style={{ marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      Hint: Make sure your IP is whitelisted (0.0.0.0/0) in MongoDB Atlas Network Access and credentials are correct.
                    </div>
                  </div>
                </div>
              )}

              {/* Live Test Results Card */}
              {mongoTestResult && (
                <div
                  style={{
                    padding: '18px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '4px solid var(--success)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {mongoTestResult.isCustom ? 'Custom MongoDB Database Connected' : 'Production MongoDB Atlas Verified'}
                      </span>
                    </div>
                    <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={12} />
                      <span>{mongoTestResult.latencyMs} ms Latency</span>
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>CLUSTER HOST</div>
                      <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all' }}>
                        {mongoTestResult.host}
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>DATABASE NAME</div>
                      <div className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-violet)', marginTop: '2px' }}>
                        {mongoTestResult.databaseName}
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>DATABASE ENGINE</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {mongoTestResult.serverVersion}
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>COLLECTIONS DETECTED</div>
                      <div style={{ fontWeight: 600, color: 'var(--success)', marginTop: '2px' }}>
                        {mongoTestResult.collectionsCount} Collections
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>TOTAL OBJECTS</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {mongoTestResult.objectsCount} Records
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ENCRYPTION IN TRANSIT</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        TLS 1.3 / SSL Encrypted
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: AWS S3 CLOUD STORAGE BUCKET                            */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 's3' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label className="form-label">S3 Bucket Name</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    placeholder="my-company-devops-bucket"
                    value={s3Form.bucketName}
                    onChange={(e) => setS3Form({ ...s3Form, bucketName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">AWS Region</label>
                  <select
                    className="form-input"
                    value={s3Form.region}
                    onChange={(e) => setS3Form({ ...s3Form, region: e.target.value })}
                  >
                    <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                    <option value="us-east-1">us-east-1 (N. Virginia)</option>
                    <option value="us-west-2">us-west-2 (Oregon)</option>
                    <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                    <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">AWS Access Key ID (Optional for Demo)</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    placeholder="AKIA..."
                    value={s3Form.accessKeyId}
                    onChange={(e) => setS3Form({ ...s3Form, accessKeyId: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">AWS Secret Access Key</label>
                  <input
                    type="password"
                    className="form-input font-mono"
                    placeholder="••••••••••••••••••••••••"
                    value={s3Form.secretAccessKey}
                    onChange={(e) => setS3Form({ ...s3Form, secretAccessKey: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => handleTestS3(false)}
                  disabled={isTestingS3 || !s3Form.bucketName}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
                >
                  {isTestingS3 ? <RefreshCw size={14} className="spin" /> : <HardDrive size={14} />}
                  <span>Inspect S3 Bucket Live</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestS3(true)}
                  disabled={isTestingS3}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
                >
                  <Sparkles size={14} style={{ color: '#F59E0B' }} />
                  <span>Instant 1-Click S3 Demo Bucket</span>
                </button>
              </div>

              {/* S3 Error Alert */}
              {s3Error && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--error)',
                    fontSize: '0.8125rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>S3 Connection Failed:</strong> {s3Error}
                  </div>
                </div>
              )}

              {/* S3 Results Card */}
              {s3TestResult && (
                <div
                  style={{
                    padding: '18px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '4px solid #F59E0B',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} style={{ color: '#F59E0B' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Bucket Connected: {s3TestResult.name}
                      </span>
                    </div>
                    <span className="badge badge-success">
                      {s3TestResult.latencyMs} ms &bull; {s3TestResult.region}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      fontSize: '0.8125rem',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>TOTAL OBJECTS</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {s3TestResult.totalObjects} Artifacts
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ESTIMATED SIZE</div>
                      <div style={{ fontWeight: 600, color: '#F59E0B', marginTop: '2px' }}>
                        {s3TestResult.totalSizeMB} MB
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ENCRYPTION AT REST</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {s3TestResult.serverSideEncryption}
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>PUBLIC ACCESS BLOCK</div>
                      <div style={{ fontWeight: 600, color: 'var(--success)', marginTop: '2px' }}>
                        {s3TestResult.publicAccessBlock}
                      </div>
                    </div>
                  </div>

                  {/* Sample Objects Table */}
                  {s3TestResult.recentObjects && s3TestResult.recentObjects.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                        RECENT STORED ARTIFACTS & BACKUP OBJECTS
                      </div>
                      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        {s3TestResult.recentObjects.map((obj, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderBottom: idx === s3TestResult.recentObjects.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                              fontSize: '0.75rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={13} style={{ color: 'var(--text-muted)' }} />
                              <span className="font-mono">{obj.key}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                              <span className="font-mono">{obj.sizeMB} MB</span>
                              <span>{new Date(obj.lastModified).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: REDIS & MEMORY CACHE PROBE                             */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'redis' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label className="form-label">Redis Host</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    value={redisForm.host}
                    onChange={(e) => setRedisForm({ ...redisForm, host: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Redis Port</label>
                  <input
                    type="number"
                    className="form-input font-mono"
                    value={redisForm.port}
                    onChange={(e) => setRedisForm({ ...redisForm, port: Number(e.target.value) })}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestRedis}
                disabled={isTestingRedis}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '8px 16px', marginBottom: '16px' }}
              >
                {isTestingRedis ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
                <span>Run Cache Health Probe</span>
              </button>

              {redisTestResult && (
                <div
                  style={{
                    padding: '18px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '4px solid #38BDF8',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} style={{ color: '#38BDF8' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Redis Cache Cluster Active
                      </span>
                    </div>
                    <span className="badge badge-success">{redisTestResult.latencyMs} ms Latency</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '12px',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>MEMORY USED</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {redisTestResult.memoryUsedMB} MB
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>TOTAL KEYS</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {redisTestResult.totalKeys} Keys Cached
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>CACHE HIT RATE</div>
                      <div style={{ fontWeight: 600, color: 'var(--success)', marginTop: '2px' }}>
                        {redisTestResult.hitRatePercent}%
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ENGINE VERSION</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {redisTestResult.version}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
            To automate deployment pipelines directly from GitHub Actions to your AWS EC2 instance, ensure the following repository secrets are configured in{' '}
            <strong>GitHub &rarr; Settings &rarr; Secrets and variables &rarr; Actions</strong>:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                name: 'EC2_HOST',
                desc: 'Public IPv4 address or Elastic IP of your deployment host (e.g. 13.232.254.140)',
                sample: '13.232.254.140',
              },
              {
                name: 'EC2_USER',
                desc: 'SSH username for your EC2 AMI distribution (e.g. ubuntu for Ubuntu, ec2-user for Amazon Linux)',
                sample: 'ubuntu',
              },
              {
                name: 'EC2_SSH_KEY',
                desc: 'Complete private OpenSSH key contents (including -----BEGIN OPENSSH PRIVATE KEY-----)',
                sample: '••••••••••••••••••••••••••••••••••••',
              },
              {
                name: 'MONGODB_URI',
                desc: 'Production MongoDB Atlas connection URI with readWrite credentials',
                sample: 'mongodb+srv://user:pass@cluster.mongodb.net/devopshub',
              },
              {
                name: 'JWT_SECRET',
                desc: 'Cryptographically secure 32+ character key for signing authentication tokens',
                sample: 'super_secret_devopshub_jwt_key_production_grade_32_chars',
              },
            ].map((secret) => (
              <div
                key={secret.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-violet)' }} className="font-mono">
                    {secret.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {secret.desc}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(secret.sample, secret.name)}
                  className="btn-icon"
                  title={`Copy ${secret.name} sample`}
                >
                  {copiedKey === secret.name ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
