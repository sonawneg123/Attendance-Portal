import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ActivatePage } from './pages/ActivatePage';
import { AdminLandingPage } from './pages/AdminLandingPage';
import { ContractorLandingPage } from './pages/ContractorLandingPage';
import { EmployeeLandingPage } from './pages/EmployeeLandingPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProtectedRoute } from './components/routes/ProtectedRoute';

const RoleDispatcher: React.FC = () => {
  const { user, role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-slate-600">लोड होत आहे...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (role) {
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'CONTRACTOR':
      return <Navigate to="/contractor" replace />;
    case 'EMPLOYEE':
      return <Navigate to="/employee" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activate" element={<ActivatePage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Role-protected routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLandingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contractor"
        element={
          <ProtectedRoute allowedRoles={['CONTRACTOR']}>
            <ContractorLandingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <EmployeeLandingPage />
          </ProtectedRoute>
        }
      />

      {/* Root smart redirect */}
      <Route path="/" element={<RoleDispatcher />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
