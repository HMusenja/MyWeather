import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMeApi, loginUserApi, registerUserApi, logoutUserApi } from "../api/userApi";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
    const [initializing, setInitializing] = useState(true);
    const navigate = useNavigate()

  // load current user on mount (if cookie/token exists)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await getMeApi();
        if (mounted) setUser(data?.user || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setInitializing(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    const { data } = await loginUserApi(identifier, password);
    setUser(data?.user || null);
    return data?.user;
  }, []);

  const register = useCallback(async ({ fullName, username, email, password }) => {
    const { data } = await registerUserApi({ fullName, username, email, password });
    setUser(data?.user || null);
    return data?.user;
  }, []);

  const logout = useCallback(async () => {
    try { await logoutUserApi(); } catch {}
      setUser(null);
      navigate("/");
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
