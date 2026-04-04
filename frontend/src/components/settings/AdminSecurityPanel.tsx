/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

// Define enums locally
export enum UserRole {
  ADMIN = 'ADMIN',
  FINANCE = 'FINANCE',
  OPERATOR = 'OPERATOR',
  READONLY = 'READONLY'
}

export enum Permission {
  BILLING_READ = 'BILLING_READ',
  BILLING_WRITE = 'BILLING_WRITE',
  BILLING_DELETE = 'BILLING_DELETE',
  CUSTOMERS_READ = 'CUSTOMERS_READ',
  CUSTOMERS_WRITE = 'CUSTOMERS_WRITE',
  CUSTOMERS_DELETE = 'CUSTOMERS_DELETE',
  PRODUCTS_READ = 'PRODUCTS_READ',
  PRODUCTS_WRITE = 'PRODUCTS_WRITE',
  PRODUCTS_DELETE = 'PRODUCTS_DELETE',
  REPORTS_READ = 'REPORTS_READ',
  REPORTS_EXPORT = 'REPORTS_EXPORT',
  API_READ = 'API_READ',
  API_WRITE = 'API_WRITE',
  ADMIN_SETTINGS = 'ADMIN_SETTINGS',
  USER_MANAGEMENT = 'USER_MANAGEMENT'
}

interface SecurityFeature {
  name: string;
  displayName: string;
  enabled: boolean;
  hasAccess: boolean;
  description: string;
  isPaidFeature: boolean;
}

interface User {
  id: string;
  email: string;
  companyName: string | null;
  role: UserRole | null;
  isActive: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scope: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface SecurityLog {
  id: string;
  eventType: string;
  description: string;
  ipAddress: string | null;
  success: boolean;
  createdAt: string;
  user: { email: string } | null;
}

const AdminSecurityPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('features');
  const [securityFeatures, setSecurityFeatures] = useState<SecurityFeature[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      // Load security features
      const featuresResponse = await fetch(`${API_URL}/admin/security/features`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (featuresResponse.ok) {
        const features = await featuresResponse.json();
        setSecurityFeatures(features);
      }

      // Load users
      const usersResponse = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        setUsers(userData);
      }

      // Load API keys
      const apiKeysResponse = await fetch(`${API_URL}/admin/security/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (apiKeysResponse.ok) {
        const apiKeyData = await apiKeysResponse.json();
        setApiKeys(apiKeyData);
      }

      // Load security logs
      const logsResponse = await fetch(`${API_URL}/admin/security/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setSecurityLogs(logsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load security data:', error);
      setLoading(false);
    }
  };

  const toggleFeature = async (featureName: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/admin/security/features/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ featureName, enabled })
      });

      if (response.ok) {
        setSecurityFeatures(prev =>
          prev.map(feature =>
            feature.name === featureName ? { ...feature, enabled } : feature
          )
        );
      } else {
        const error = await response.json();
        alert(`Failed to toggle feature: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
      alert('Failed to toggle feature');
    }
  };

  const assignRole = async (userId: string, role: UserRole | null) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/admin/users/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role })
      });

      if (response.ok) {
        setUsers(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, role } : user
          )
        );
      } else {
        const error = await response.json();
        alert(`Failed to assign role: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to assign role:', error);
      alert('Failed to assign role');
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/admin/security/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key.id !== keyId));
      } else {
        const error = await response.json();
        alert(`Failed to revoke API key: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      alert('Failed to revoke API key');
    }
  };

  if (loading) {
    return (
      <div className="admin-security-panel">
        <div className="loading">Loading security panel...</div>
      </div>
    );
  }

  return (
    <div className="admin-security-panel">
      <div className="panel-header">
        <h2>Security & Authentication</h2>
        <p>Manage security features, user roles, and monitor access</p>
      </div>

      <div className="tab-navigation">
        <button
          className={activeTab === 'features' ? 'active' : ''}
          onClick={() => setActiveTab('features')}
        >
          Security Features
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          User Roles
        </button>
        <button
          className={activeTab === 'api-keys' ? 'active' : ''}
          onClick={() => setActiveTab('api-keys')}
        >
          API Keys
        </button>
        <button
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          Security Logs
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'features' && (
          <div className="security-features">
            <h3>Security Feature Toggles</h3>
            <div className="features-grid">
              {securityFeatures.map(feature => (
                <div key={feature.name} className="feature-card">
                  <div className="feature-header">
                    <h4>{feature.displayName}</h4>
                    {feature.isPaidFeature && (
                      <span className="paid-badge">PAID</span>
                    )}
                  </div>
                  <p>{feature.description}</p>
                  <div className="feature-controls">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={feature.enabled}
                        disabled={!feature.hasAccess}
                        onChange={(e) => toggleFeature(feature.name, e.target.checked)}
                        aria-label={`Toggle ${feature.displayName}`}
                      />
                      <span className="slider"></span>
                    </label>
                    <span className={`status ${feature.enabled ? 'enabled' : 'disabled'}`}>
                      {feature.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {!feature.hasAccess && (
                    <div className="access-denied">
                      Upgrade plan to access this feature
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="user-management">
            <h3>User Role Management</h3>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Current Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.companyName || '-'}</td>
                      <td>
                        <select
                          value={user.role || ''}
                          onChange={(e) => assignRole(user.id, e.target.value as UserRole || null)}
                          aria-label={`Role for ${user.email}`}
                          title={`Select role for ${user.email}`}
                        >
                          <option value="">No Role</option>
                          <option value={UserRole.ADMIN}>Administrator</option>
                          <option value={UserRole.FINANCE}>Finance Manager</option>
                          <option value={UserRole.OPERATOR}>Operator</option>
                          <option value={UserRole.READONLY}>Read Only</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-secondary">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'api-keys' && (
          <div className="api-key-management">
            <h3>API Key Management</h3>
            <div className="api-keys-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Key Prefix</th>
                    <th>Scope</th>
                    <th>Last Used</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map(apiKey => (
                    <tr key={apiKey.id}>
                      <td>{apiKey.name}</td>
                      <td><code>{apiKey.keyPrefix}...</code></td>
                      <td>{apiKey.scope}</td>
                      <td>{apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                      <td>
                        <span className={`status ${apiKey.isActive ? 'active' : 'revoked'}`}>
                          {apiKey.isActive ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td>
                        {apiKey.isActive && (
                          <button
                            className="btn-danger"
                            onClick={() => revokeApiKey(apiKey.id)}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="security-logs">
            <h3>Security Audit Logs</h3>
            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event</th>
                    <th>User</th>
                    <th>Description</th>
                    <th>IP Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLogs.map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.eventType}</td>
                      <td>{log.user?.email || 'System'}</td>
                      <td>{log.description}</td>
                      <td>{log.ipAddress || '-'}</td>
                      <td>
                        <span className={`status ${log.success ? 'success' : 'failed'}`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-security-panel {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .panel-header {
          margin-bottom: 30px;
        }

        .panel-header h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .panel-header p {
          color: #666;
          margin: 0;
        }

        .tab-navigation {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab-navigation button {
          padding: 12px 20px;
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          font-weight: 500;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .tab-navigation button.active {
          color: #007bff;
          border-bottom-color: #007bff;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .feature-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background: white;
        }

        .feature-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .feature-header h4 {
          margin: 0;
          color: #333;
        }

        .paid-badge {
          background: #ffd700;
          color: #333;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .feature-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #007bff;
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        .status.enabled {
          color: #28a745;
        }

        .status.disabled {
          color: #dc3545;
        }

        .status.active {
          color: #28a745;
        }

        .status.inactive {
          color: #dc3545;
        }

        .status.success {
          color: #28a745;
        }

        .status.failed {
          color: #dc3545;
        }

        .access-denied {
          margin-top: 10px;
          padding: 10px;
          background: #fff3cd;
          color: #856404;
          border-radius: 4px;
          font-size: 14px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background-color: #f8f9fa;
          font-weight: 600;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .loading {
          text-align: center;
          padding: 50px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default AdminSecurityPanel;
