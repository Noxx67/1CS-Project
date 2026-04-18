import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't automatically load saved user - force login every time
    // const savedUser = authService.getUser();
    // if (savedUser) {
    //   setUser(savedUser);
    // }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try { 
      // 1. Corrected typo: console.log
      console.log("Attempting login for:", email);
  
      // 2. Await the service call directly
      const data = await authService.login(email, password);
  
      // 3. Update the state using the result (include must_change_password flag)
      setUser({
        ...data.user,
        must_change_password: data.must_change_password,
      });
  
      // 4. Return the data so the LoginPage knows it was successful
      return data; 
  
    } catch (error) {
      // 5. Log the error and pass it up to the LoginPage UI
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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);