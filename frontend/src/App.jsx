import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import Verification from './pages/Verification';
import ProfileCard from './pages/ProfileCard';
import FeesConsole from './pages/FeesConsole';
import LibraryConsole from './pages/LibraryConsole';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import Loading from './components/Loading';
import { SessionProvider } from './context/SessionContext';
import Promotion from './pages/Promotion';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading size="lg" text="Authorizing local terminal credentials..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route Permission Guard
const PermissionGuard = ({ permission, children }) => {
  const { admin } = useAuth();

  if (!admin) return <Navigate to="/login" replace />;
  
  if (admin.role === 'SuperAdmin') return children;
  
  if (admin.permissions && admin.permissions.includes(permission)) {
    return children;
  }
  
  return <Navigate to="/" replace />;
};

// Dashboard access or permission-based route redirect
const DashboardOrRedirect = () => {
  const { admin } = useAuth();
  
  if (!admin) return <Navigate to="/login" replace />;
  
  if (admin.role === 'SuperAdmin' || admin.permissions?.includes('dashboard')) {
    return <Dashboard />;
  }
  
  if (admin.permissions && admin.permissions.length > 0) {
    const firstAllowed = admin.permissions[0];
    if (firstAllowed === 'registration') return <Navigate to="/registration" replace />;
    if (firstAllowed === 'verification') return <Navigate to="/verification" replace />;
    if (firstAllowed === 'fees') return <Navigate to="/fees" replace />;
    if (firstAllowed === 'library') return <Navigate to="/library" replace />;
    if (firstAllowed === 'reports') return <Navigate to="/reports" replace />;
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white dark:bg-darkbg-surface rounded-2xl border border-warm-200/50 dark:border-darkbg-border">
      <h2 className="text-lg font-bold text-warm-900 dark:text-slate-100 mb-2">Access Denied</h2>
      <p className="text-xs text-warm-855 dark:text-slate-400">Your account does not possess permission scopes to access any ERP modules. Please contact Super Admin.</p>
    </div>
  );
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Admin authentication */}
        <Route path="/login" element={<Login />} />

        {/* Private ERP Core Layout routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOrRedirect />} />
          <Route path="registration" element={<PermissionGuard permission="registration"><Registration /></PermissionGuard>} />
          <Route path="verification" element={<PermissionGuard permission="verification"><Verification /></PermissionGuard>} />
          <Route path="promotion" element={<PermissionGuard permission="verification"><Promotion /></PermissionGuard>} />
          <Route path="fees" element={<PermissionGuard permission="fees"><FeesConsole /></PermissionGuard>} />
          <Route path="library" element={<PermissionGuard permission="library"><LibraryConsole /></PermissionGuard>} />
          <Route path="users" element={<PermissionGuard permission="users"><UserManagement /></PermissionGuard>} />
          <Route path="reports" element={<PermissionGuard permission="reports"><Reports /></PermissionGuard>} />
          <Route path="profile/:id" element={<ProfileCard />} />
        </Route>

        {/* Route fallbacks */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SessionProvider>
          <AppRoutes />
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
export { AppRoutes };
