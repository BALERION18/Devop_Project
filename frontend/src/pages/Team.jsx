import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Shield,
  Activity,
  Clock,
  UserCheck,
  CheckCircle2,
  Calendar,
  Lock,
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

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [teamRes, logRes] = await Promise.all([
        api.get('/team/members'),
        api.get('/team/audit-logs'),
      ]);

      if (teamRes.data.success) {
        setTeam(teamRes.data.team || []);
      }
      if (logRes.data.success) {
        setLogs(logRes.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
      addToast('Failed to load team data.', 'error');
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
        addToast(`Updated member role to ${newRole}`, 'success');
        fetchData();
      }
    } catch (err) {
      addToast('Failed to update role.', 'error');
    }
  };

  return (
    <>
      <Header
        title="Team & Access Control (RBAC)"
        description="Manage organizational team members, roles, and review the infrastructure audit trail"
        breadcrumbs={['DevOpsHub', 'Organization', 'Team & Access']}
        onRefresh={() => fetchData(true)}
        isRefreshing={refreshing}
        setMobileOpen={setMobileOpen}
      />

      <div className="page-container">
        {/* Team Members Section */}
        <div className="hub-card" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} style={{ color: 'var(--accent-violet)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                Active Team Members ({team.length})
              </h3>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Role-Based Access Control Enabled
            </span>
          </div>

          <div className="hub-table-wrapper">
            <table className="hub-table">
              <thead>
                <tr>
                  <th className="hub-th">Member Name</th>
                  <th className="hub-th">Email</th>
                  <th className="hub-th">Access Role</th>
                  <th className="hub-th">Last Login</th>
                  <th className="hub-th" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member._id || member.email} className="hub-tr">
                    <td className="hub-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--accent-violet)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{member.name}</div>
                          {member.email === currentUser?.email && (
                            <span style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)' }}>
                              (You)
                            </span>
                          )}
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
                          backgroundColor:
                            member.role === 'admin'
                              ? 'rgba(139, 92, 246, 0.15)'
                              : 'rgba(99, 102, 241, 0.15)',
                          color: member.role === 'admin' ? 'var(--accent-violet)' : '#818CF8',
                          border: '1px solid var(--border-subtle)',
                          fontWeight: 600,
                        }}
                      >
                        {member.role}
                      </span>
                    </td>

                    <td className="hub-td" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {member.lastLogin ? new Date(member.lastLogin).toLocaleString() : 'Recent'}
                    </td>

                    <td className="hub-td" style={{ textAlign: 'right' }}>
                      <select
                        className="form-input"
                        value={member.role}
                        onChange={(e) => handleRoleChange(member._id, e.target.value)}
                        style={{ width: 'auto', fontSize: '0.75rem', padding: '4px 8px', height: '30px' }}
                      >
                        <option value="admin">Admin</option>
                        <option value="devops_engineer">DevOps Engineer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Infrastructure Audit Trail Section */}
        <div className="hub-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                Infrastructure Audit & Activity Trail
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Immutable event stream of deployment dispatches, server additions, and rollback operations
              </p>
            </div>
          </div>

          <div className="hub-table-wrapper">
            <table className="hub-table">
              <thead>
                <tr>
                  <th className="hub-th">Timestamp</th>
                  <th className="hub-th">Engineer</th>
                  <th className="hub-th">Action Event</th>
                  <th className="hub-th">Target Resource</th>
                  <th className="hub-th">Event Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="hub-tr">
                    <td className="hub-td" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="hub-td" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                      {log.actor?.name || 'DevOps Engineer'}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
