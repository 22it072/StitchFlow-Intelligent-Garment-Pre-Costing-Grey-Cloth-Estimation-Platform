// frontend/src/utils/rbac.js

// Role display configurations
export const ROLE_CONFIG = {
  viewer: {
    label: 'Viewer',
    description: 'View-only access to all data',
    color: 'gray',
    icon: 'Eye'
  },
  editor: {
    label: 'Editor',
    description: 'Can create and edit data',
    color: 'green',
    icon: 'Edit3'
  },
  admin: {
    label: 'Admin',
    description: 'Full access including user management',
    color: 'blue',
    icon: 'Shield'
  },
  super_admin: {
    label: 'Super Admin',
    description: 'System-level control and ownership',
    color: 'purple',
    icon: 'Crown'
  }
};

// Permission definitions (must match backend)
export const PERMISSIONS = {
  // Dashboard
  'dashboard:view': ['viewer', 'editor', 'admin', 'super_admin'],

  // Yarns
  'yarns:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'yarns:create': ['editor', 'admin', 'super_admin'],
  'yarns:edit': ['editor', 'admin', 'super_admin'],
  'yarns:delete': ['admin', 'super_admin'],

  // Estimates
  'estimates:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'estimates:create': ['editor', 'admin', 'super_admin'],
  'estimates:edit': ['editor', 'admin', 'super_admin'],
  'estimates:delete': ['admin', 'super_admin'],

  // Production Planning
  'production:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'production:create': ['editor', 'admin', 'super_admin'],
  'production:edit': ['editor', 'admin', 'super_admin'],
  'production:delete': ['admin', 'super_admin'],

  // ========== NEW: Weaving Module Permissions ==========
  
  // Looms
  'looms:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'looms:create': ['editor', 'admin', 'super_admin'],
  'looms:edit': ['editor', 'admin', 'super_admin'],
  'looms:delete': ['admin', 'super_admin'],
  'looms:manage_status': ['editor', 'admin', 'super_admin'],

  // Production Logs
  'productionLogs:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'productionLogs:create': ['editor', 'admin', 'super_admin'],
  'productionLogs:edit': ['admin', 'super_admin'],
  'productionLogs:delete': ['admin', 'super_admin'],

  // Yarn Stock
  'yarnStock:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'yarnStock:create': ['editor', 'admin', 'super_admin'],
  'yarnStock:receive': ['editor', 'admin', 'super_admin'],
  'yarnStock:issue': ['editor', 'admin', 'super_admin'],
  'yarnStock:return': ['editor', 'admin', 'super_admin'],

  // Warp Beams
  'warpBeams:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'warpBeams:create': ['editor', 'admin', 'super_admin'],
  'warpBeams:edit': ['editor', 'admin', 'super_admin'],
  'warpBeams:delete': ['admin', 'super_admin'],
  'warpBeams:assign': ['editor', 'admin', 'super_admin'],

  // Fabric Rolls
  'fabricRolls:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'fabricRolls:create': ['editor', 'admin', 'super_admin'],
  'fabricRolls:dispatch': ['editor', 'admin', 'super_admin'],

  // Weaving Dashboard
  'weaving:view': ['viewer', 'editor', 'admin', 'super_admin'],

  // Analytics
  'analytics:view': ['viewer', 'editor', 'admin', 'super_admin'],

  // Company & Users
  'company:settings': ['admin', 'super_admin'],
  'users:view': ['admin', 'super_admin'],

  // Settings
  'settings:view': ['viewer', 'editor', 'admin', 'super_admin'],
};

// Check if role has permission
export const hasPermission = (role, permission) => {
  if (!PERMISSIONS[permission]) {
    return false;
  }
  return PERMISSIONS[permission].includes(role);
};

// Get role badge color classes
export const getRoleBadgeColor = (role) => {
  const colors = {
    viewer: 'bg-gray-100 text-gray-700',
    editor: 'bg-green-100 text-green-700',
    admin: 'bg-blue-100 text-blue-700',
    super_admin: 'bg-purple-100 text-purple-700'
  };
  return colors[role] || colors.viewer;
};

// Format role for display
export const formatRole = (role) => {
  return ROLE_CONFIG[role]?.label || role;
};

// Check if role1 can manage role2
export const canRoleManage = (managerRole, targetRole) => {
  const hierarchy = { viewer: 0, editor: 1, admin: 2, super_admin: 3 };
  return hierarchy[managerRole] > hierarchy[targetRole];
};