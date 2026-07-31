import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/client";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const accessToken = localStorage.getItem("access");

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me/");
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  const login = async (username, password) => {
    const response = await api.post("/auth/login/", {
      username,
      password,
    });

    localStorage.setItem("access", response.data.access);
    localStorage.setItem("refresh", response.data.refresh);

    const userResponse = await api.get("/auth/me/");
    setUser(userResponse.data);

    return userResponse.data;
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
