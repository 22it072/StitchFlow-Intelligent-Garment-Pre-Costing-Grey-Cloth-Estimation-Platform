import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

const defaultSettings = {
  defaultGstPercentage: 5,
  weightDecimalPrecision: 4,
  costDecimalPrecision: 2,
  enableWeft2ByDefault: false,
  currencySymbol: '₹',
  currencyCode: 'INR',
  dateFormat: 'DD/MM/YYYY',
  autoSaveInterval: 30,
  theme: 'light',
};

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setSettings(defaultSettings);
      setLoading(false);
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings({ ...defaultSettings, ...response.data });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await api.put('/settings', newSettings);
      setSettings({ ...defaultSettings, ...response.data });
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  const resetSettings = async () => {
    try {
      const response = await api.post('/settings/reset');
      setSettings({ ...defaultSettings, ...response.data });
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};