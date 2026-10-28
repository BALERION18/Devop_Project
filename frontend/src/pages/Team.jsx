import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Crown,
  UserCheck,
  UserPlus,
  Trash2,
  Lock,
  Mail,
  Activity,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../services/api.js';
import { Header } from '../components/Header.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const Team = () => {
  const { setMobileOpen } = useOutletContext();
  const { user: currentUser } = useAuth();
  const { addToast } = useNotification();

  const [team, setTeam] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Teammate Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    role: 'teammate',
    password: 'Password123!',
  });
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [teamRes, logRes] = await Promise.allSettled([
        api.get('/team/members'),
        api.get('/team/audit-logs'),
      ]);

      let loadedTeam = [];
      if (teamRes.status === 'fulfilled' && teamRes.value?.data?.success) {
        loadedTeam = teamRes.value.data.team || [];
      }

      if (loadedTeam.length === 0 && currentUser) {
        loadedTeam = [
          {
            _id: currentUser.id || currentUser._id || 'current_user',
            name: currentUser.name || 'Workspace Leader',
            email: currentUser.email,
            role: currentUser.role || 'leader',
            teamId: currentUser.teamId || 'default_team',
            createdAt: new Date(),
          },
        ];
      }
      setTeam(loadedTeam);

      if (logRes.status === 'fulfilled' && logRes.value?.data?.success) {
        setLogs(logRes.value.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
      if (isManual) addToast('Failed to load team data.', 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.patch(`/team/members/${userId}/role`, { role: newRole });
      if (res.data.success) {
        addToast(res.data.message || `Updated role to ${newRole.toUpperCase()}`, 'success');
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update role.', 'error');
    }
  };

  const handleAddTeammate = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await api.post('/team/members', addForm);
      if (res.data.success) {
        addToast(res.data.message || 'Teammate added successfully!', 'success');
        setIsAddModalOpen(false);
        setAddForm({
          name: '',
          email: '',
          role: 'teammate',
          password: 'Password123!',
        });
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add teammate.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTeammate = async (userId, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from your project team?`)) return;
    try {
      const res = await api.delete(`/team/members/${userId}`);
      if (res.data.success) {
        addToast(res.data.message || 'Teammate removed.', 'info');
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove teammate.', 'error');
    }
  };

  const leaderCount = team.filter((m) => m.role === 'leader').length;
  const teammateCount = team.filter((m) => m.role === 'teammate').length;

  return (
    <>
      <Header
        title="Project Team & RBAC"
        description="Isolated project workspace with two streamlined roles: Leader and Teammate"
        breadcrumbs={['DevOpsHub', 'Organization', 'Team & Roles']}
        onRefresh={() => fetchData(true)}
        isRefreshing={refreshing}
        setMobileOpen={setMobileOpen}
      />

      <div className="page-container">
        {/* Multi-Tenant Privacy Callout */}
        <div
          className="hub-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '24px',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-violet)',
              }}
            >
              <Crown size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Private Project Workspace</span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    color: 'var(--accent-violet)',
                    fontWeight: 600,
                  }}
                >
                  Strict Multi-Tenant Isolation
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Any new user who registers becomes the <strong>Leader</strong> of their own private workspace.
                You only see teammates you collaborate with, keeping your infrastructure and team strictly confidential.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={15} />
            <span>Add Teammate</span>
          </button>
        </div>

        {/* Team Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div className="hub-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Total Workspace Members
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {team.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              In your active project team
            </div>
          </div>

          <div className="hub-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-violet)', fontWeight: 600, marginBottom: '4px' }}>
              Project Leaders
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-violet)' }}>
              {leaderCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Full management & deployment rights
            </div>
          </div>

          <div className="hub-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600, marginBottom: '4px' }}>
              Teammates
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38BDF8' }}>
              {teammateCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Collaborators & deployment runners
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="hub-card" style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} style={{ color: 'var(--accent-violet)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                Active Teammates ({team.length})
              </h3>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Roles: <strong style={{ color: 'var(--accent-violet)' }}>Leader</strong> or <strong style={{ color: '#38BDF8' }}>Teammate</strong>
            </div>
          </div>

          <div className="hub-table-wrapper">
            <table className="hub-table">
              <thead>
                <tr>
                  <th className="hub-th">Member Name</th>
                  <th className="hub-th">Email</th>
                  <th className="hub-th">Current Role</th>
                  <th className="hub-th">Change Role</th>
                  <th className="hub-th">Last Login</th>
                  <th className="hub-th" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => {
                  const isCurrent = member.email === currentUser?.email;
                  const isLeader = member.role === 'leader';

                  return (
                    <tr key={member._id || member.email} className="hub-tr">
                      <td className="hub-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: isLeader ? 'rgba(139, 92, 246, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                              border: isLeader ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                              color: isLeader ? 'var(--accent-violet)' : '#38BDF8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {member.name ? member.name.substring(0, 2).toUpperCase() : 'TM'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{member.name}</span>
                              {isCurrent && (
                                <span
                                  style={{
                                    fontSize: '0.6875rem',
                                    color: 'var(--accent-primary)',
                                    fontWeight: 600,
                                  }}
                                >
                                  (You)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {isLeader ? 'Project Owner & Lead' : 'Project Collaborator'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="hub-td font-mono" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {member.email}
                      </td>

                      <td className="hub-td">
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: isLeader ? 'rgba(139, 92, 246, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: isLeader ? 'var(--accent-violet)' : '#38BDF8',
                            border: isLeader ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isLeader && <Crown size={12} />}
                          <span>{member.role}</span>
                        </span>
                      </td>

                      <td className="hub-td">
                        <select
                          className="form-input"
                          value={member.role}
                          onChange={(e) => handleRoleChange(member._id, e.target.value)}
                          style={{
                            width: 'auto',
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            height: '30px',
                            fontWeight: 600,
                          }}
                        >
                          <option value="leader">Leader</option>
                          <option value="teammate">Teammate</option>
                        </select>
                      </td>

                      <td className="hub-td" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {member.lastLogin ? new Date(member.lastLogin).toLocaleString() : 'Never logged in'}
                      </td>

                      <td className="hub-td" style={{ textAlign: 'right' }}>
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteTeammate(member._id, member.name)}
                            className="btn-icon"
                            title="Remove Teammate"
                            style={{ color: 'var(--text-muted)', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Infrastructure Audit Trail Section */}
        <div className="hub-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Activity size={18} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                Infrastructure Audit & Activity Trail
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Immutable event stream of deployment dispatches, server actions, and teammate role updates
              </p>
            </div>
          </div>

          <div className="hub-table-wrapper">
            <table className="hub-table">
              <thead>
                <tr>
                  <th className="hub-th">Timestamp</th>
                  <th className="hub-th">Actor</th>
                  <th className="hub-th">Action Event</th>
                  <th className="hub-th">Target Resource</th>
                  <th className="hub-th">Event Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hub-tr">
                      <td className="hub-td" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      <td className="hub-td" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                        {log.actor?.name || 'Project Member'}
                      </td>

                      <td className="hub-td">
                        <span
                          className="font-mono"
                          style={{
                            fontSize: '0.6875rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="hub-td font-mono" style={{ fontSize: '0.8125rem' }}>
                        {log.target}
                      </td>

                      <td className="hub-td" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Teammate Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Add Teammate to Project</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTeammate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Alex Johnson"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. alex@yourcompany.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role in Project</label>
                  <select
                    className="form-input"
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  >
                    <option value="teammate">Teammate (Standard collaborator)</option>
                    <option value="leader">Leader (Full administrative control)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    required
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Teammate can use this password to sign in immediately.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isAdding}>
                  <UserPlus size={14} />
                  <span>{isAdding ? 'Adding...' : 'Add Teammate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
