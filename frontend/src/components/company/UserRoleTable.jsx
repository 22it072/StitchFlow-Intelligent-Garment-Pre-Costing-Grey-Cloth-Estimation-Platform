// frontend/src/components/company/UserRoleTable.jsx
import React, { useState } from 'react';
import { 
  MoreVertical, 
  Shield, 
  Edit3, 
  Eye, 
  Trash2, 
  Crown,
  UserMinus
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', icon: Eye, color: 'gray' },
  { value: 'editor', label: 'Editor', icon: Edit3, color: 'green' },
  { value: 'admin', label: 'Admin', icon: Shield, color: 'blue' },
  { value: 'super_admin', label: 'Super Admin', icon: Crown, color: 'purple' }
];

const UserRoleTable = ({ 
  users, 
  currentUserId,
  onRoleChange, 
  onRemoveUser,
  onTransferOwnership,
  loading = false 
}) => {
  const [openMenu, setOpenMenu] = useState(null);
  const { isSuperAdmin, canManageUser, hasPermission } = usePermissions();

  const getRoleConfig = (role) => {
    return ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[0];
  };

  const getRoleBadgeStyles = (role) => {
    const styles = {
      viewer: 'bg-gray-100 text-gray-700',
      editor: 'bg-green-100 text-green-700',
      admin: 'bg-blue-100 text-blue-700',
      super_admin: 'bg-purple-100 text-purple-700'
    };
    return styles[role] || styles.viewer;
  };

  const handleRoleChange = (userId, newRole) => {
    onRoleChange(userId, newRole);
    setOpenMenu(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-500">
              User
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">
              Role
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">
              Joined
            </th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => {
            const roleConfig = getRoleConfig(user.role);
            const RoleIcon = roleConfig.icon;
            const isCurrentUser = user._id === currentUserId;
            const canManage = canManageUser(user.role) && !isCurrentUser;

            return (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                      flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-gray-500">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm 
                    font-medium ${getRoleBadgeStyles(user.role)}`}>
                    <RoleIcon className="w-3.5 h-3.5" />
                    {roleConfig.label}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  {new Date(user.joinedAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 text-right">
                  {canManage && hasPermission('users:change_role') && (
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenMenu(openMenu === user._id ? null : user._id)}
                        className="p-2 text-gray-500 hover:text-gray-700 
                          hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {openMenu === user._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white 
                          rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                          <div className="py-1">
                            <p className="px-4 py-2 text-xs font-medium text-gray-500 
                              uppercase tracking-wider">
                              Change Role
                            </p>
                            {ROLE_OPTIONS
                              .filter(role => {
                                if (isSuperAdmin) return role.value !== 'super_admin';
                                return ['viewer', 'editor'].includes(role.value);
                              })
                              .map((role) => {
                                const Icon = role.icon;
                                return (
                                  <button
                                    key={role.value}
                                    onClick={() => handleRoleChange(user._id, role.value)}
                                    disabled={user.role === role.value}
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm 
                                      hover:bg-gray-100 transition-colors
                                      ${user.role === role.value 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : 'text-gray-700'}`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    {role.label}
                                  </button>
                                );
                              })}
                          </div>

                          <div className="border-t border-gray-200 py-1">
                            {isSuperAdmin && (
                              <button
                                onClick={() => {
                                  onTransferOwnership?.(user._id);
                                  setOpenMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm 
                                  text-purple-600 hover:bg-purple-50 transition-colors"
                              >
                                <Crown className="w-4 h-4" />
                                Transfer Ownership
                              </button>
                            )}
                            <button
                              onClick={() => {
                                onRemoveUser?.(user._id);
                                setOpenMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm 
                                text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <UserMinus className="w-4 h-4" />
                              Remove User
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
};

export default UserRoleTable;