import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [activeSession, setActiveSessionState] = useState(() => {
    return localStorage.getItem('activeSession') || '2025-26';
  });

  const [sessions, setSessions] = useState(['All Sessions', '2024-25', '2025-26', '2026-27', '2023-24']);
  const [loading, setLoading] = useState(false);

  // Fetch available sessions from backend
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch('/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map(s => typeof s === 'string' ? s : (s.sessionName || s.name || '')).filter(Boolean);
          const merged = Array.from(new Set(['All Sessions', '2024-25', '2025-26', '2026-27', '2023-24', ...names]));
          setSessions(merged);

          // If there is an active session marked in DB and no local override
          const dbActive = data.find(s => s.isActive);
          if (dbActive && !localStorage.getItem('activeSession')) {
            setActiveSessionState(dbActive.sessionName);
            localStorage.setItem('activeSession', dbActive.sessionName);
          }
        }
      }
    } catch (err) {
      console.error('[SessionContext] Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const setActiveSession = (sessionName) => {
    setActiveSessionState(sessionName);
    localStorage.setItem('activeSession', sessionName);
  };

  return (
    <SessionContext.Provider value={{
      activeSession,
      sessions,
      setActiveSession,
      loading,
      refreshSessions: fetchSessions
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
