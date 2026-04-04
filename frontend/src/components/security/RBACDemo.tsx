/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { simplifiedRbacService, UserRole, Permission } from '../../services/simplifiedRbacService';

const RBACDemo: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string>('demo-readonly');
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);

  const demoUsers = [
    { id: 'demo-admin', label: 'Admin User', role: UserRole.ADMIN },
    { id: 'demo-finance', label: 'Finance User', role: UserRole.FINANCE },
    { id: 'demo-operator', label: 'Operator User', role: UserRole.OPERATOR },
    { id: 'demo-readonly', label: 'Read-Only User', role: UserRole.READONLY }
  ];

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      const permissions = await simplifiedRbacService.getUserPermissions(currentUser);
      const roles = await simplifiedRbacService.getAllRoles();
      
      setUserPermissions(permissions);
      setAllRoles(roles);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const testPermissions = async () => {
    const testCases = [
      { permission: Permission.BILLING_READ, action: 'read' as const },
      { permission: Permission.BILLING_WRITE, action: 'write' as const },
      { permission: Permission.BILLING_DELETE, action: 'delete' as const },
      { permission: Permission.CUSTOMERS_WRITE, action: 'write' as const },
      { permission: Permission.ADMIN_SETTINGS, action: 'read' as const },
      { permission: Permission.USER_MANAGEMENT, action: 'write' as const }
    ];

    const results = await Promise.all(
      testCases.map(async (test) => {
        const hasPermission = await simplifiedRbacService.hasPermission(
          currentUser,
          test.permission,
          test.action
        );
        return {
          ...test,
          hasPermission
        };
      })
    );

    setTestResults(results);
  };

  useEffect(() => {
    loadUserPermissions();
  }, [currentUser]);

  useEffect(() => {
    if (!loading) {
      testPermissions();
    }
  }, [loading, currentUser]);

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'text-red-600 bg-red-50 border-red-200';
      case UserRole.FINANCE: return 'text-blue-600 bg-blue-50 border-blue-200';
      case UserRole.OPERATOR: return 'text-green-600 bg-green-50 border-green-200';
      case UserRole.READONLY: return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading RBAC demo...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔐 Role-Based Access Control Demo</h2>
        <p className="text-gray-600">Test how different user roles affect system permissions</p>
      </div>

      {/* User Selector */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Switch User (Demo Mode):
        </label>
        <select
          value={currentUser}
          onChange={(e) => setCurrentUser(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Select demo user to test different roles"
        >
          {demoUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.label} ({user.role})
            </option>
          ))}
        </select>
      </div>

      {/* Current User Info */}
      {userPermissions && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Current User Permissions</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-blue-600">Role:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded border ${getRoleColor(userPermissions.role)}`}>
              {userPermissions.role}
            </span>
          </div>
          <div className="text-sm text-blue-600">
            Permissions: {userPermissions.permissions.length} assigned
          </div>
        </div>
      )}

      {/* Permission Test Results */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">🧪 Permission Test Results</h3>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {testResults.map((test, index) => (
            <div
              key={index}
              className={`p-3 rounded border ${
                test.hasPermission
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="text-sm font-medium">
                {test.permission.replace('_', ' ')}
              </div>
              <div className="text-xs">
                Action: {test.action}
              </div>
              <div className="text-xs font-bold">
                {test.hasPermission ? '✅ ALLOWED' : '❌ DENIED'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Roles Overview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Role Definitions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {allRoles.map((role) => (
            <div key={role.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{role.displayName}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded border ${getRoleColor(role.name)}`}>
                  {role.name}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{role.description}</p>
              <div className="text-xs text-gray-500">
                {role.permissions.length} permissions assigned
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Permissions Matrix */}
      {userPermissions && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            📊 Detailed Permissions for {userPermissions.role}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Permission
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Read
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Write
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userPermissions.permissions.map((perm: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {perm.permission.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {perm.canRead ? (
                        <span className="text-green-600">✅</span>
                      ) : (
                        <span className="text-red-600">❌</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {perm.canWrite ? (
                        <span className="text-green-600">✅</span>
                      ) : (
                        <span className="text-red-600">❌</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {perm.canDelete ? (
                        <span className="text-green-600">✅</span>
                      ) : (
                        <span className="text-red-600">❌</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Implementation Notes */}
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-sm font-semibold text-yellow-800 mb-2">💡 Implementation Notes</h3>
        <div className="text-xs text-yellow-700 space-y-1">
          <div>• This RBAC system supports 4 roles: Admin, Finance, Operator, Read-Only</div>
          <div>• Permissions are granular with read/write/delete capabilities</div>
          <div>• Middleware available for API route protection</div>
          <div>• Full database schema implemented (currently using in-memory demo)</div>
          <div>• Enterprise-ready with audit logging and security events</div>
        </div>
      </div>
    </div>
  );
};

export default RBACDemo;
