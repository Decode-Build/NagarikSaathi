import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [langMode, setLangMode] = useState('en');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [operatorStats, setOperatorStats] = useState({ citizensHelped: 0, avgResponseTimeSec: null, matchRate: 'N/A', districtRank: 'N/A', categoriesMatched: [], recentActivity: [] });
  
  const API_BASE = import.meta.env?.VITE_API_URL 
    || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : '/api');

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setCurrentUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken('');
          setCurrentUser(null);
        });
    }
  }, [token, API_BASE]);

  return (
    <AppContext.Provider value={{
      langMode, setLangMode,
      token, setToken,
      currentUser, setCurrentUser,
      operatorStats, setOperatorStats,
      API_BASE
    }}>
      {children}
    </AppContext.Provider>
  );
};
