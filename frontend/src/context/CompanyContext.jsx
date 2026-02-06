import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CompanyContext = createContext(null);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's companies
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies');
      const companiesData = response.data.data || [];
      setCompanies(companiesData);

      // Set active company from localStorage or first company
      const savedCompanyId = localStorage.getItem('activeCompanyId');
      const savedCompany = companiesData.find(c => c._id === savedCompanyId);
      
      if (savedCompany) {
        setActiveCompany(savedCompany);
        setUserRole(savedCompany.role);
      } else if (companiesData.length > 0) {
        setActiveCompany(companiesData[0]);
        setUserRole(companiesData[0].role);
        localStorage.setItem('activeCompanyId', companiesData[0]._id);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Switch active company
  const switchCompany = useCallback((company) => {
    setActiveCompany(company);
    setUserRole(company.role);
    localStorage.setItem('activeCompanyId', company._id);
    
    // Set company ID in API headers
    api.defaults.headers.common['X-Company-Id'] = company._id;
    
    toast.success(`Switched to ${company.name}`);
  }, []);

  // Create new company
  const createCompany = useCallback(async (companyData) => {
    try {
      const response = await api.post('/companies', companyData);
      const newCompany = {
        ...response.data.data.company,
        role: response.data.data.role
      };
      
      setCompanies(prev => [...prev, newCompany]);
      switchCompany(newCompany);
      
      toast.success('Company created successfully!');
      return newCompany;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create company');
      throw err;
    }
  }, [switchCompany]);

  // Join company via code
  const joinCompany = useCallback(async (companyCode) => {
    try {
      const response = await api.post('/companies/join', { companyCode });
      const joinedCompany = {
        ...response.data.data.company,
        role: response.data.data.role
      };
      
      setCompanies(prev => [...prev, joinedCompany]);
      switchCompany(joinedCompany);
      
      toast.success(`Joined ${joinedCompany.name} successfully!`);
      return joinedCompany;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join company');
      throw err;
    }
  }, [switchCompany]);

  // Leave company
  const leaveCompany = useCallback(async (companyId) => {
    try {
      await api.post(`/companies/${companyId}/leave`);
      
      setCompanies(prev => prev.filter(c => c._id !== companyId));
      
      if (activeCompany?._id === companyId) {
        const remaining = companies.filter(c => c._id !== companyId);
        if (remaining.length > 0) {
          switchCompany(remaining[0]);
        } else {
          setActiveCompany(null);
          setUserRole(null);
          localStorage.removeItem('activeCompanyId');
        }
      }
      
      toast.success('Left company successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave company');
      throw err;
    }
  }, [activeCompany, companies, switchCompany]);

  // Update company headers when active company changes
  useEffect(() => {
    if (activeCompany) {
      api.defaults.headers.common['X-Company-Id'] = activeCompany._id;
    } else {
      delete api.defaults.headers.common['X-Company-Id'];
    }
  }, [activeCompany]);

  const value = {
    companies,
    activeCompany,
    userRole,
    loading,
    error,
    fetchCompanies,
    switchCompany,
    createCompany,
    joinCompany,
    leaveCompany,
    hasCompany: companies.length > 0
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export default CompanyContext;