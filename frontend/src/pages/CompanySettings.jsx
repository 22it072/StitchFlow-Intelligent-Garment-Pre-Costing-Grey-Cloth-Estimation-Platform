// frontend/src/pages/CompanySettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Shield,
  Save,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { usePermissions } from '../hooks/usePermissions';
import { AccessDenied } from '../components/guards/PermissionGuard';
import JoinCodeDisplay from '../components/company/JoinCodeDisplay';
import api from '../services/api';
import toast from 'react-hot-toast';

const CompanySettings = () => {
  const navigate = useNavigate();
  const { activeCompany, leaveCompany, fetchCompanies } = useCompany();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
    companyCode: ''
  });
  const [settings, setSettings] = useState({
    defaultRole: 'viewer',
    allowJoinViaCode: true,
    maxUsers: 50
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check permission
  if (!hasPermission('company:settings')) {
    return <AccessDenied message="You don't have permission to access company settings" />;
  }

  useEffect(() => {
    if (activeCompany) {
      fetchCompanyDetails();
    }
  }, [activeCompany]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/companies/${activeCompany._id}`);
      const data = response.data.data;
      setCompanyData({
        name: data.name,
        description: data.description || '',
        companyCode: data.companyCode || ''
      });
      setSettings(data.settings || {
        defaultRole: 'viewer',
        allowJoinViaCode: true,
        maxUsers: 50
      });
    } catch (err) {
      toast.error('Failed to fetch company details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/companies/${activeCompany._id}`, {
        name: companyData.name,
        description: companyData.description,
        settings
      });
      toast.success('Company settings saved successfully');
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async () => {
    const confirmText = prompt(`Type "${activeCompany.name}" to confirm deletion:`);
    if (confirmText !== activeCompany.name) {
      toast.error('Company name did not match');
      return;
    }

    try {
      await api.delete(`/companies/${activeCompany._id}`);
      toast.success('Company deleted successfully');
      navigate('/companies/join');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete company');
    }
  };

  const handleLeaveCompany = async () => {
    if (!confirm('Are you sure you want to leave this company?')) {
      return;
    }

    try {
      await leaveCompany(activeCompany._id);
      navigate('/companies/join');
    } catch (err) {
      // Error handled in context
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-7 h-7 text-blue-600" />
            Company Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your company configuration
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-500" />
          Basic Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={companyData.name}
              onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 
                rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={companyData.description}
              onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 
                rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Join Code */}
      {companyData.companyCode && (
        <JoinCodeDisplay
          companyCode={companyData.companyCode}
          companyId={activeCompany._id}
          onCodeRegenerated={(newCode) => setCompanyData({ ...companyData, companyCode: newCode })}
        />
      )}

      {/* Access Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-500" />
          Access Settings
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                Allow Join via Code
              </p>
              <p className="text-sm text-gray-500">
                Let users join using the company code
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowJoinViaCode}
                onChange={(e) => setSettings({ ...settings, allowJoinViaCode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                peer-focus:ring-blue-300 rounded-full peer 
                peer-checked:after:translate-x-full peer-checked:after:border-white 
                after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Role for New Members
            </label>
            <select
              value={settings.defaultRole}
              onChange={(e) => setSettings({ ...settings, defaultRole: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 
                rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900"
            >
              <option value="viewer">Viewer (View Only)</option>
              <option value="editor">Editor (View, Create, Edit)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Users
            </label>
            <input
              type="number"
              value={settings.maxUsers}
              onChange={(e) => setSettings({ ...settings, maxUsers: parseInt(e.target.value) })}
              min={1}
              max={1000}
              className="w-full px-4 py-3 border border-gray-300 
                rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 
            disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save Changes
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Leave Company</p>
              <p className="text-sm text-gray-500">
                Remove yourself from this company
              </p>
            </div>
            <button
              onClick={handleLeaveCompany}
              className="px-4 py-2 text-red-600 hover:bg-red-100 
                rounded-lg transition-colors"
            >
              Leave
            </button>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Delete Company</p>
                <p className="text-sm text-gray-500">
                  Permanently delete this company and all its data
                </p>
              </div>
              <button
                onClick={handleDeleteCompany}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 
                  text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;