// backend/utils/permissions.js

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY = {
  viewer: 0,
  editor: 1,
  admin: 2,
  super_admin: 3
};

// Permission definitions - COMPLETE WITH WEAVING MODULE
const PERMISSIONS = {
  // Dashboard
  'dashboard:view': ['viewer', 'editor', 'admin', 'super_admin'],

  // Yarns
  'yarns:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'yarns:create': ['editor', 'admin', 'super_admin'],
  'yarns:edit': ['editor', 'admin', 'super_admin'],
  'yarns:delete': ['admin', 'super_admin'],
  'yarns:import': ['editor', 'admin', 'super_admin'],
  'yarns:export': ['viewer', 'editor', 'admin', 'super_admin'],

  // Estimates
  'estimates:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'estimates:create': ['editor', 'admin', 'super_admin'],
  'estimates:edit': ['editor', 'admin', 'super_admin'],
  'estimates:delete': ['admin', 'super_admin'],
  'estimates:duplicate': ['editor', 'admin', 'super_admin'],
  'estimates:export': ['viewer', 'editor', 'admin', 'super_admin'],

  // Production (Planning)
  'production:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'production:create': ['editor', 'admin', 'super_admin'],
  'production:edit': ['editor', 'admin', 'super_admin'],
  'production:delete': ['admin', 'super_admin'],
  'production:manage': ['admin', 'super_admin'],

  // ========== WEAVING MODULE PERMISSIONS ==========

  // Weaving Dashboard
  'weaving:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'weaving:manage': ['admin', 'super_admin'],

  // Looms Module
  'looms:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'looms:create': ['editor', 'admin', 'super_admin'],
  'looms:edit': ['editor', 'admin', 'super_admin'],
  'looms:delete': ['admin', 'super_admin'],
  'looms:manage_status': ['editor', 'admin', 'super_admin'],

  // Production Logs (Actual Daily Production)
  'productionLogs:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'productionLogs:create': ['editor', 'admin', 'super_admin'],
  'productionLogs:edit': ['admin', 'super_admin'],
  'productionLogs:delete': ['admin', 'super_admin'],
  'productionLogs:verify': ['admin', 'super_admin'],

  // Yarn Stock
  'yarnStock:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'yarnStock:create': ['editor', 'admin', 'super_admin'],
  'yarnStock:receive': ['editor', 'admin', 'super_admin'],
  'yarnStock:issue': ['editor', 'admin', 'super_admin'],
  'yarnStock:return': ['editor', 'admin', 'super_admin'],
  'yarnStock:adjust': ['admin', 'super_admin'],
  'yarnStock:delete': ['admin', 'super_admin'],

  // Warp Beams
  'warpBeams:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'warpBeams:create': ['editor', 'admin', 'super_admin'],
  'warpBeams:edit': ['editor', 'admin', 'super_admin'],
  'warpBeams:delete': ['admin', 'super_admin'],
  'warpBeams:assign': ['editor', 'admin', 'super_admin'],
  'warpBeams:consume': ['editor', 'admin', 'super_admin'],

  // Fabric Rolls
  'fabricRolls:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'fabricRolls:create': ['editor', 'admin', 'super_admin'],
  'fabricRolls:dispatch': ['editor', 'admin', 'super_admin'],
  'fabricRolls:reject': ['admin', 'super_admin'],
  'fabricRolls:delete': ['admin', 'super_admin'],

  // Wastage
  'wastage:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'wastage:create': ['editor', 'admin', 'super_admin'],
  'wastage:delete': ['admin', 'super_admin'],

  // ========== END WEAVING MODULE PERMISSIONS ==========

  // Analytics
  'analytics:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'analytics:export': ['editor', 'admin', 'super_admin'],

  // Company Management
  'company:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'company:edit': ['admin', 'super_admin'],
  'company:delete': ['super_admin'],
  'company:settings': ['admin', 'super_admin'],
  'company:regenerate_code': ['admin', 'super_admin'],

  // User Management
  'users:view': ['admin', 'super_admin'],
  'users:invite': ['admin', 'super_admin'],
  'users:remove': ['admin', 'super_admin'],
  'users:change_role': ['admin', 'super_admin'],
  'users:manage_admins': ['super_admin'],

  // Settings
  'settings:view': ['viewer', 'editor', 'admin', 'super_admin'],
  'settings:edit': ['admin', 'super_admin']
};

// Check if role has permission
const hasPermission = (role, permission) => {
  if (!role) {
    console.warn('No role provided for permission check');
    return false;
  }
  if (!PERMISSIONS[permission]) {
    console.warn(`Unknown permission: ${permission}`);
    return false;
  }
  return PERMISSIONS[permission].includes(role);
};

// Check if role has any of the permissions
const hasAnyPermission = (role, permissions) => {
  if (!Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(role, permission));
};

// Check if role has all of the permissions
const hasAllPermissions = (role, permissions) => {
  if (!Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(role, permission));
};

// Compare roles (returns true if role1 >= role2)
const isRoleHigherOrEqual = (role1, role2) => {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2];
};

// Get all permissions for a role
const getRolePermissions = (role) => {
  if (!role) return [];
  const permissions = [];
  for (const [permission, allowedRoles] of Object.entries(PERMISSIONS)) {
    if (allowedRoles.includes(role)) {
      permissions.push(permission);
    }
  }
  return permissions;
};

// Get permission categories
const getPermissionCategories = () => {
  const categories = {};
  for (const permission of Object.keys(PERMISSIONS)) {
    const [category] = permission.split(':');
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(permission);
  }
  return categories;
};

// Role display names
const ROLE_DISPLAY_NAMES = {
  viewer: 'Viewer',
  editor: 'Editor',
  admin: 'Admin',
  super_admin: 'Super Admin'
};

// Role descriptions
const ROLE_DESCRIPTIONS = {
  viewer: 'View-only access to all data',
  editor: 'Can create and edit data',
  admin: 'Full access including user management',
  super_admin: 'System-level control and ownership'
};

module.exports = {
  ROLE_HIERARCHY,
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleHigherOrEqual,
  getRolePermissions,
  getPermissionCategories,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS
};