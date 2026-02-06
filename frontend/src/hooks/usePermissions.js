// frontend/src/hooks/usePermissions.js
import { useMemo, useCallback } from 'react';
import { useCompany } from '../context/CompanyContext';

// Permission definitions (mirror of backend) - UPDATED WITH WEAVING MODULE
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
  
  // ========== NEW: WEAVING MODULE PERMISSIONS ==========
  
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
  'productionLogs:edit': ['admin', 'super_admin'], // Stricter - historical data
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

const ROLE_HIERARCHY = {
  viewer: 0,
  editor: 1,
  admin: 2,
  super_admin: 3
};

export const usePermissions = () => {
  const { userRole, activeCompany } = useCompany();

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    if (!userRole) return false;
    if (!PERMISSIONS[permission]) {
      console.warn(`Unknown permission: ${permission}`);
      return false;
    }
    return PERMISSIONS[permission].includes(userRole);
  }, [userRole]);

  // Check if user has any of the permissions
  const hasAnyPermission = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  // Check if user has all permissions
  const hasAllPermissions = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Check if user has specific role
  const hasRole = useCallback((roles) => {
    if (!userRole) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(userRole);
  }, [userRole]);

  // Check if user role is at least the minimum required
  const hasMinRole = useCallback((minRole) => {
    if (!userRole) return false;
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
  }, [userRole]);

  // Check if user can manage another user
  const canManageUser = useCallback((targetRole) => {
    if (!userRole) return false;
    
    // super_admin can manage everyone except other super_admins
    if (userRole === 'super_admin') {
      return targetRole !== 'super_admin';
    }
    
    // admin can manage editors and viewers
    if (userRole === 'admin') {
      return ['viewer', 'editor'].includes(targetRole);
    }
    
    return false;
  }, [userRole]);

  // Get all permissions for current role
  const rolePermissions = useMemo(() => {
    if (!userRole) return [];
    return Object.entries(PERMISSIONS)
      .filter(([_, roles]) => roles.includes(userRole))
      .map(([permission]) => permission);
  }, [userRole]);

  // UI helper - check if element should be visible
  const isVisible = useCallback((permission) => {
    return hasPermission(permission);
  }, [hasPermission]);

  // UI helper - check if element should be disabled
  const isDisabled = useCallback((permission) => {
    return !hasPermission(permission);
  }, [hasPermission]);

  // Computed role checks
  const isAdmin = useMemo(() => hasRole(['admin', 'super_admin']), [hasRole]);
  const isSuperAdmin = useMemo(() => hasRole('super_admin'), [hasRole]);
  const isEditor = useMemo(() => hasMinRole('editor'), [hasMinRole]);
  const isViewer = useMemo(() => userRole === 'viewer', [userRole]);

  return {
    userRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasMinRole,
    canManageUser,
    rolePermissions,
    isVisible,
    isDisabled,
    isAdmin,
    isSuperAdmin,
    isEditor,
    isViewer,
    hasCompanyContext: !!activeCompany
  };
};

export default usePermissions;