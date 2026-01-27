import React, { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [appSettings, setAppSettings] = useState({
    defaultGstPercentage: settings.defaultGstPercentage,
    weightDecimalPrecision: settings.weightDecimalPrecision,
    costDecimalPrecision: settings.costDecimalPrecision,
    enableWeft2ByDefault: settings.enableWeft2ByDefault,
    currencySymbol: settings.currencySymbol,
    dateFormat: settings.dateFormat,
    autoSaveInterval: settings.autoSaveInterval,
    theme: settings.theme,
  });

  useEffect(() => {
    setProfileData(prev => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
      company: user?.company || '',
      phone: user?.phone || '',
    }));
  }, [user]);

  useEffect(() => {
    setAppSettings({
      defaultGstPercentage: settings.defaultGstPercentage,
      weightDecimalPrecision: settings.weightDecimalPrecision,
      costDecimalPrecision: settings.costDecimalPrecision,
      enableWeft2ByDefault: settings.enableWeft2ByDefault,
      currencySymbol: settings.currencySymbol,
      dateFormat: settings.dateFormat,
      autoSaveInterval: settings.autoSaveInterval,
      theme: settings.theme,
    });
  }, [settings]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    
    const updateData = {
      name: profileData.name,
      email: profileData.email,
      company: profileData.company,
      phone: profileData.phone,
    };

    if (profileData.newPassword) {
      updateData.password = profileData.newPassword;
    }

    const success = await updateProfile(updateData);
    
    if (success) {
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    }
    
    setLoading(false);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await updateSettings({
      ...appSettings,
      defaultGstPercentage: parseFloat(appSettings.defaultGstPercentage),
      weightDecimalPrecision: parseInt(appSettings.weightDecimalPrecision),
      costDecimalPrecision: parseInt(appSettings.costDecimalPrecision),
      autoSaveInterval: parseInt(appSettings.autoSaveInterval),
    });
    
    if (success) {
      toast.success('Settings updated successfully');
    }
    
    setLoading(false);
  };

  const handleResetSettings = async () => {
    if (!window.confirm('Reset all settings to default values?')) return;
    
    setLoading(true);
    const success = await resetSettings();
    if (success) {
      toast.success('Settings reset to defaults');
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'app', label: 'Application', icon: SettingsIcon },
  ];

  const currencyOptions = [
    { value: '₹', label: '₹ - Indian Rupee' },
    { value: '$', label: '$ - US Dollar' },
    { value: '€', label: '€ - Euro' },
    { value: '£', label: '£ - British Pound' },
  ];

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card padding="p-4" className="lg:col-span-1 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                  />
                  <Input
                    label="Company"
                    name="company"
                    value={profileData.company}
                    onChange={handleProfileChange}
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>

                <hr />

                <h3 className="text-md font-medium text-gray-900">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={profileData.currentPassword}
                    onChange={handleProfileChange}
                  />
                  <Input
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={profileData.newPassword}
                    onChange={handleProfileChange}
                  />
                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" icon={Save} loading={loading}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'app' && (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Application Settings</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={RefreshCw}
                  onClick={handleResetSettings}
                >
                  Reset to Defaults
                </Button>
              </div>

              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                {/* Calculation Settings */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Calculation Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Default GST %"
                      name="defaultGstPercentage"
                      type="number"
                      step="0.01"
                      value={appSettings.defaultGstPercentage}
                      onChange={handleSettingsChange}
                    />
                    <Input
                      label="Weight Decimal Precision"
                      name="weightDecimalPrecision"
                      type="number"
                      min="1"
                      max="6"
                      value={appSettings.weightDecimalPrecision}
                      onChange={handleSettingsChange}
                    />
                    <Input
                      label="Cost Decimal Precision"
                      name="costDecimalPrecision"
                      type="number"
                      min="1"
                      max="4"
                      value={appSettings.costDecimalPrecision}
                      onChange={handleSettingsChange}
                    />
                  </div>
                </div>

                <hr />

                {/* Display Settings */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Display Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      label="Currency Symbol"
                      name="currencySymbol"
                      value={appSettings.currencySymbol}
                      onChange={handleSettingsChange}
                      options={currencyOptions}
                    />
                    <Select
                      label="Date Format"
                      name="dateFormat"
                      value={appSettings.dateFormat}
                      onChange={handleSettingsChange}
                      options={dateFormatOptions}
                    />
                    <Select
                      label="Theme"
                      name="theme"
                      value={appSettings.theme}
                      onChange={handleSettingsChange}
                      options={themeOptions}
                    />
                  </div>
                </div>

                <hr />

                {/* Behavior Settings */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Behavior Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Auto-save Interval (seconds)"
                      name="autoSaveInterval"
                      type="number"
                      min="10"
                      max="300"
                      value={appSettings.autoSaveInterval}
                      onChange={handleSettingsChange}
                    />
                    <div className="flex items-center space-x-3 pt-8">
                      <input
                        type="checkbox"
                        name="enableWeft2ByDefault"
                        id="enableWeft2ByDefault"
                        checked={appSettings.enableWeft2ByDefault}
                        onChange={handleSettingsChange}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="enableWeft2ByDefault" className="text-sm text-gray-700">
                        Enable Weft-2 by default in new estimates
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" icon={Save} loading={loading}>
                    Save Settings
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;