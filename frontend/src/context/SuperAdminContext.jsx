import React, { createContext, useContext, useState, useEffect } from 'react';

const SuperAdminContext = createContext();

export const SuperAdminProvider = ({ children }) => {
  const [superAdmin, setSuperAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('superAdminToken') || null);
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState([]);

  // Fetch current super admin profile
  const fetchProfile = async (authToken) => {
    try {
      const res = await fetch('/api/superadmin/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuperAdmin(data.superAdmin);
      } else {
        logout();
      }
    } catch (err) {
      console.error('[SuperAdmin Auth Check Failed]:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary alerts for header notification drawer
  const fetchAlerts = async () => {
    const activeToken = localStorage.getItem('superAdminToken');
    if (!activeToken) return;
    try {
      const res = await fetch('/api/superadmin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveAlerts(data.expiryAlerts || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
      fetchAlerts();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, adminData) => {
    localStorage.setItem('superAdminToken', newToken);
    setToken(newToken);
    setSuperAdmin(adminData);
    fetchAlerts();
  };

  const logout = () => {
    localStorage.removeItem('superAdminToken');
    setToken(null);
    setSuperAdmin(null);
  };

  return (
    <SuperAdminContext.Provider
      value={{
        superAdmin,
        token,
        loading,
        activeAlerts,
        refreshAlerts: fetchAlerts,
        isAuthenticated: !!token && !!superAdmin,
        login,
        logout
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = () => useContext(SuperAdminContext);