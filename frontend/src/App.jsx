import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SuperAdminProvider, useSuperAdmin } from './context/SuperAdminContext';
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
import Results from './pages/Results';
import StudentDossier from './pages/StudentDossier';
import DatabaseSettings from './pages/DatabaseSettings';
import PaymentGatewaySettings from './pages/PaymentGatewaySettings';
import AboutSoftware from './pages/AboutSoftware';
import SplashScreen from './components/brand/SplashScreen';

// Super Admin Portal Imports
import SuperAdminLayout from './components/superadmin/SuperAdminLayout';
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import RegisterCollege from './pages/superadmin/RegisterCollege';
import CollegeList from './pages/superadmin/CollegeList';
import CollegeProfile from './pages/superadmin/CollegeProfile';
import LicenseManagement from './pages/superadmin/LicenseManagement';
import FeatureControl from './pages/superadmin/FeatureControl';
import DatabaseManagement from './pages/superadmin/DatabaseManagement';
import PaymentManagement from './pages/superadmin/PaymentManagement';
import SupportManagement from './pages/superadmin/SupportManagement';
import AuditLogViewer from './pages/superadmin/AuditLogViewer';

// Protected Route Wrapper (College Admin)
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

// Protected Route Wrapper (Super Admin Master)
const SuperAdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSuperAdmin();

  if (loading) {
    return <Loading size="lg" text="Authenticating Super Admin Master Session..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/superadmin/login" replace />;
  }

  return children;
};

// Route Permission Guard (College Admin)
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
        {/* ========================================================================= */}
        {/* SUPER ADMIN HQ PORTAL ROUTES                                              */}
        {/* ========================================================================= */}
        <Route path="/superadmin/login" element={<SuperAdminLogin />} />
        <Route
          path="/superadmin"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminLayout />
            </SuperAdminProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="colleges" element={<CollegeList />} />
          <Route path="colleges/new" element={<RegisterCollege />} />
          <Route path="colleges/:id" element={<CollegeProfile />} />
          <Route path="licenses" element={<LicenseManagement />} />
          <Route path="feature-control" element={<FeatureControl />} />
          <Route path="database" element={<DatabaseManagement />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="support" element={<SupportManagement />} />
          <Route path="audit" element={<AuditLogViewer />} />
        </Route>

        {/* ========================================================================= */}
        {/* COLLEGE CLIENT APPLICATION ROUTES                                         */}
        {/* ========================================================================= */}
        <Route path="/login" element={<Login />} />

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
          <Route path="results" element={<PermissionGuard permission="verification"><Results /></PermissionGuard>} />
          <Route path="fees" element={<PermissionGuard permission="fees"><FeesConsole /></PermissionGuard>} />
          <Route path="payment-gateway" element={<PermissionGuard permission="fees"><PaymentGatewaySettings /></PermissionGuard>} />
          <Route path="library" element={<PermissionGuard permission="library"><LibraryConsole /></PermissionGuard>} />
          <Route path="users" element={<PermissionGuard permission="users"><UserManagement /></PermissionGuard>} />
          <Route path="reports" element={<PermissionGuard permission="reports"><Reports /></PermissionGuard>} />
          <Route path="database-settings" element={<PermissionGuard permission="users"><DatabaseSettings /></PermissionGuard>} />
          <Route path="profile/:id" element={<ProfileCard />} />
          <Route path="dossier" element={<StudentDossier />} />
          <Route path="dossier/:id" element={<StudentDossier />} />
          <Route path="about" element={<AboutSoftware />} />
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
      <SuperAdminProvider>
        <AuthProvider>
          <SessionProvider>
            <SplashScreen />
            <AppRoutes />
          </SessionProvider>
        </AuthProvider>
      </SuperAdminProvider>
    </ThemeProvider>
  );
}

export default App;
export { AppRoutes };
