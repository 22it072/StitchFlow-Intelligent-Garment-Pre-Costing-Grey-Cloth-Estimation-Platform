// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CompanyProvider, useCompany } from './context/CompanyContext';
import NotificationContainer from './components/notifications/NotificationContainer';

// Layout
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Main Pages
import Dashboard from './pages/Dashboard';
import YarnLibrary from './pages/YarnLibrary';
import NewEstimate from './pages/NewEstimate';
import EstimateHistory from './pages/EstimateHistory';
import EstimateDetail from './pages/EstimateDetail';
import EstimateComparison from './pages/EstimateComparison';
import Settings from './pages/Settings';

// Production Planning Pages
import ProductionPlanner from './pages/ProductionPlanner';
import ProductionHistory from './pages/ProductionHistory';
import ProductionDetail from './pages/ProductionDetail';
import ProductionAnalyticsPage from './pages/ProductionAnalyticsPage';

// Company Pages
import JoinCompany from './pages/JoinCompany';
import CompanySettings from './pages/CompanySettings';
import UserManagement from './pages/UserManagement';

// ========== NEW: Weaving Module Pages ==========
import WeavingDashboard from './pages/weaving/WeavingDashboard';
import LoomManagement from './pages/looms/LoomManagement';
import ProductionLogEntry from './pages/production-logs/ProductionLogEntry';
import ProductionLogHistory from './pages/production-logs/ProductionLogHistory';
import YarnStockManagement from './pages/yarn-stock/YarnStockManagement';
import WarpBeamManagement from './pages/warp-beams/WarpBeamManagement';
import FabricRollManagement from './pages/fabric-rolls/FabricRollManagement';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Company Required Route
const CompanyRequiredRoute = ({ children }) => {
  const { activeCompany, loading, hasCompany } = useCompany();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company data...</p>
        </div>
      </div>
    );
  }

  if (!hasCompany) {
    return <Navigate to="/companies/join" replace />;
  }

  if (!activeCompany) {
    return <Navigate to="/companies/join" replace />;
  }

  return children;
};

// Public Route
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="spinner"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Content with Routes
const AppContent = () => {
  return (
    <>
      <NotificationContainer />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Company Join/Create */}
        <Route
          path="/companies/join"
          element={
            <ProtectedRoute>
              <JoinCompany />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes with Company Required */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <CompanyRequiredRoute>
                <Layout />
              </CompanyRequiredRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="yarns" element={<YarnLibrary />} />
          
          {/* Estimates */}
          <Route path="estimates/new" element={<NewEstimate />} />
          <Route path="estimates/edit/:id" element={<NewEstimate />} />
          <Route path="estimates/compare" element={<EstimateComparison />} />
          <Route path="estimates/:id" element={<EstimateDetail />} />
          <Route path="estimates" element={<EstimateHistory />} />
          
          {/* Production Planning */}
          <Route path="productions/new" element={<ProductionPlanner />} />
          <Route path="productions/analytics" element={<ProductionAnalyticsPage />} />
          <Route path="productions/:id" element={<ProductionDetail />} />
          <Route path="productions" element={<ProductionHistory />} />
          
          {/* ========== NEW: Weaving Module Routes ========== */}
          <Route path="weaving" element={<WeavingDashboard />} />
          <Route path="looms" element={<LoomManagement />} />
          <Route path="production-logs/new" element={<ProductionLogEntry />} />
          <Route path="production-logs" element={<ProductionLogHistory />} />
          <Route path="yarn-stocks" element={<YarnStockManagement />} />
          <Route path="warp-beams" element={<WarpBeamManagement />} />
          <Route path="fabric-rolls" element={<FabricRollManagement />} />
          
          {/* Company Settings */}
          <Route path="company/settings" element={<CompanySettings />} />
          <Route path="company/users" element={<UserManagement />} />
          
          {/* User Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

function App() {
  const { user } = useAuth();

  return (
    <>
      {user ? (
        <CompanyProvider>
          <AppContent />
        </CompanyProvider>
      ) : (
        <AppContent />
      )}
    </>
  );
}

export default App;