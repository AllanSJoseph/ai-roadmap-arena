import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUser, removeToken, getToken } from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedUser = getUser();
    const token = getToken();
    if (cachedUser && token) {
      setUserState(cachedUser);
    } else {
      removeToken(); // Clear mismatching tokens
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUserState(userData);
  };

  const logout = () => {
    removeToken();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
