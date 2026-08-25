import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and check current admin session
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAdmin(data);
        } else {
          // Token expired or invalid
          localStorage.removeItem('token');
          setAdmin(null);
        }
      } catch (err) {
        console.error('[Auth Session Check] Local network/server offline:', err.message);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Admin login action
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid administrator credentials');
      }

      localStorage.setItem('token', data.token);
      setAdmin({
        _id: data._id,
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role || 'Staff',
        permissions: data.permissions || []
      });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('token');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{
      admin,
      isAuthenticated: !!admin,
      loading,
      error,
      login,
      logout,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
