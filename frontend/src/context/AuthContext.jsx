import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedToken}`;
          const response = await api.get("/auth/me");
          setUser(response.data.data.user);
          setToken(storedToken);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          delete api.defaults.headers.common["Authorization"];
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const {
        user: userData,
        token: accessToken,
        refreshToken,
      } = response.data.data;

      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      setUser(userData);
      setToken(accessToken);
      setIsAuthenticated(true);

      toast.success(`Welcome back, ${userData.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Register
  const register = useCallback(
    async (name, email, password, organization = "default") => {
      try {
        const response = await api.post("/auth/register", {
          name,
          email,
          password,
          organization,
        });
        const {
          user: userData,
          token: accessToken,
          refreshToken,
        } = response.data.data;

        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        setUser(userData);
        setToken(accessToken);
        setIsAuthenticated(true);

        toast.success("Registration successful! Welcome aboard!");
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || "Registration failed";
        toast.error(message);
        return { success: false, message };
      }
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data) => {
    try {
      const response = await api.put("/auth/me", data);
      setUser(response.data.data.user);
      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Update failed";
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await api.put("/auth/password", { currentPassword, newPassword });
      toast.success("Password changed successfully");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Password change failed";
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // Check if user has specific role
  const hasRole = useCallback(
    (roles) => {
      if (!user) return false;
      if (typeof roles === "string") return user.role === roles;
      return roles.includes(user.role);
    },
    [user]
  );

  // Check if user can perform action
  const canPerform = useCallback(
    (action) => {
      if (!user) return false;

      const permissions = {
        upload: ["viewer", "editor", "admin"],
        delete: ["editor", "admin"],
        manage_users: ["admin"],
        view_all: ["admin"],
      };

      const allowedRoles = permissions[action] || [];
      return allowedRoles.includes(user.role);
    },
    [user]
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    canPerform,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
