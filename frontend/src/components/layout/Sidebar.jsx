// frontend/src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Scissors,
  Calculator,
  History,
  Settings,
  X,
  Layers,
  BarChart3,
  Factory,
  FileText,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Users,
  Building2,
  Package,
  Disc,
  Scroll,
  Activity,
  Plus,
} from 'lucide-react';
import CompanySwitcher from '../company/CompanySwitcher';
import { usePermissions } from '../../hooks/usePermissions';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { hasPermission, isAdmin, userRole } = usePermissions();

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    production: false,
    weaving: false,
    company: false,
  });

  // Auto-expand section based on current route
  useEffect(() => {
    const path = location.pathname;
    
    setExpandedSections(prev => ({
      ...prev,
      production: path.startsWith('/productions'),
      weaving: path.startsWith('/weaving') ||
               path.startsWith('/looms') ||
               path.startsWith('/production-logs') ||
               path.startsWith('/yarn-stocks') ||
               path.startsWith('/warp-beams') ||
               path.startsWith('/fabric-rolls'),
      company: path.startsWith('/company'),
    }));
  }, [location.pathname]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Check if path is active
  const isPathActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Navigation item component
  const NavItem = ({ to, icon: Icon, label, permission, exact = false }) => {
    // Check permission if specified
    if (permission && !hasPermission(permission)) {
      return null;
    }

    const isActive = isPathActive(to, exact);

    return (
      <NavLink
        to={to}
        onClick={onClose}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm
          transition-all duration-200
          ${isActive
            ? 'bg-indigo-50 text-indigo-600 font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
        <span className="truncate">{label}</span>
      </NavLink>
    );
  };

  // Section header component
  const SectionHeader = ({ icon: Icon, label, section, color = 'gray' }) => {
    const expanded = expandedSections[section];
    const colorClasses = {
      gray: 'border-gray-100',
      indigo: 'border-indigo-100',
      green: 'border-green-100',
    };
    
    return (
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </span>
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
    );
  };

  // Get role display config
  const getRoleConfig = () => {
    switch (userRole) {
      case 'super_admin':
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' };
      case 'admin':
        return { label: 'Admin', color: 'bg-blue-100 text-blue-700' };
      case 'editor':
        return { label: 'Editor', color: 'bg-green-100 text-green-700' };
      case 'viewer':
      default:
        return { label: 'Viewer', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const roleConfig = getRoleConfig();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-screen w-64 bg-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">StitchFlow</h1>
              <p className="text-xs text-gray-500">Textile Costing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Company Switcher */}
        <div className="flex-shrink-0 border-b border-gray-200">
          <CompanySwitcher />
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            
            {/* Main Menu */}
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main Menu
            </p>

            <NavItem
              to="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              permission="dashboard:view"
              exact
            />

            <NavItem
              to="/yarns"
              icon={Layers}
              label="Yarn Library"
              permission="yarns:view"
            />

            <NavItem
              to="/estimates/new"
              icon={Calculator}
              label="New Estimate"
              permission="estimates:create"
              exact
            />

            <NavItem
              to="/estimates"
              icon={History}
              label="Estimate History"
              permission="estimates:view"
              exact
            />

            <NavItem
              to="/estimates/compare"
              icon={BarChart3}
              label="Compare"
              permission="estimates:view"
              exact
            />

            {/* Production Planning Section */}
            <div className="pt-4">
              <SectionHeader
                icon={Calculator}
                label="Production Plan"
                section="production"
              />
              
              {expandedSections.production && (
                <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-100 pl-3">
                  <NavItem
                    to="/productions/new"
                    icon={Plus}
                    label="Production Planner"
                    permission="production:create"
                    exact
                  />
                  <NavItem
                    to="/productions"
                    icon={FileText}
                    label="Production History"
                    permission="production:view"
                    exact
                  />
                  <NavItem
                    to="/productions/analytics"
                    icon={TrendingUp}
                    label="Analytics"
                    permission="analytics:view"
                    exact
                  />
                </div>
              )}
            </div>

            {/* Weaving Module Section */}
            <div className="pt-4">
              <SectionHeader
                icon={Factory}
                label="Weaving Module"
                section="weaving"
                color="indigo"
              />
              
              {expandedSections.weaving && (
                <div className="mt-1 ml-4 space-y-1 border-l-2 border-indigo-100 pl-3">
                  <NavItem
                    to="/weaving"
                    icon={Activity}
                    label="Weaving Dashboard"
                    permission="weaving:view"
                    exact
                  />
                  <NavItem
                    to="/looms"
                    icon={Factory}
                    label="Loom Management"
                    permission="looms:view"
                  />
                  <NavItem
                    to="/production-logs/new"
                    icon={Plus}
                    label="Log Production"
                    permission="productionLogs:create"
                    exact
                  />
                  <NavItem
                    to="/production-logs"
                    icon={FileText}
                    label="Production Logs"
                    permission="productionLogs:view"
                    exact
                  />
                  <NavItem
                    to="/yarn-stocks"
                    icon={Package}
                    label="Yarn Stock"
                    permission="yarnStock:view"
                  />
                  <NavItem
                    to="/warp-beams"
                    icon={Disc}
                    label="Warp Beams"
                    permission="warpBeams:view"
                  />
                  <NavItem
                    to="/fabric-rolls"
                    icon={Scroll}
                    label="Fabric Rolls"
                    permission="fabricRolls:view"
                  />
                </div>
              )}
            </div>

            {/* Company Section - Admin Only */}
            {isAdmin && (
              <div className="pt-4">
                <SectionHeader
                  icon={Building2}
                  label="Company"
                  section="company"
                />
                
                {expandedSections.company && (
                  <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-100 pl-3">
                    <NavItem
                      to="/company/users"
                      icon={Users}
                      label="Manage Users"
                      permission="users:view"
                    />
                    <NavItem
                      to="/company/settings"
                      icon={Settings}
                      label="Company Settings"
                      permission="company:settings"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Settings Section */}
            <div className="pt-4 mt-4 border-t border-gray-100">
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Account
              </p>
              <NavItem
                to="/settings"
                icon={Settings}
                label="Settings"
                permission="settings:view"
              />
            </div>

          </nav>
        </div>

        {/* Role Badge at Bottom */}
        {userRole && (
          <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-gray-50">
            <div className={`text-center py-2 px-3 rounded-lg text-xs font-medium ${roleConfig.color}`}>
              Your Role: {roleConfig.label}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;