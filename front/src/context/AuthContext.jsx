import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { TEMP_FRONTEND_PREVIEW_MODE, TEMP_PREVIEW_USER } from '../config/previewMode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (TEMP_FRONTEND_PREVIEW_MODE) {
      setUser(TEMP_PREVIEW_USER);
      setLoading(false);
      return;
    }

    // Restore session from localStorage so page refreshes don't log the user out
    const storedUser = authService.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try { 
      console.log("Attempting login for:", email);
      const data = await authService.login(email, password);

      setUser({
        ...data.user,
        must_change_password: data.must_change_password,
      });

      return data; 
    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      throw error; 
    }
  };

  const logout = () => {
    try {
      authService.logout();
    } catch (error) {
      console.error("Logout Error:", error.response);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
