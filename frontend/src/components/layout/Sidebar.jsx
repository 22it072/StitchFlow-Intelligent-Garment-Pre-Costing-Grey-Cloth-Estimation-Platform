import React from 'react';
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
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/yarns', icon: Layers, label: 'Yarn Library' },
    { path: '/estimates/new', icon: Calculator, label: 'New Estimate' },
    { path: '/estimates', icon: History, label: 'Estimate History' },
    { path: '/estimates/compare', icon: BarChart3, label: 'Compare' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside
      className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-xl
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">StitchFlow</h1>
            <p className="text-xs text-gray-500">Textile Costing</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/estimates' && location.pathname.startsWith('/estimates') && 
             !location.pathname.includes('/new') && !location.pathname.includes('/compare'));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <h3 className="font-semibold text-sm">Need Help?</h3>
          <p className="text-xs text-indigo-100 mt-1">
            Check our documentation for detailed guides.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;