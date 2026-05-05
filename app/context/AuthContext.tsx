import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../lib/apiBase';

export type UserRole = 'applicant' | 'campus_admin' | 'chms_admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  campusId?: string | null;
  campusName?: string | null;
  phone?: string;
  gender?: string;
  academicLevel?: string;
  yearsOfService?: number;
  maritalStatus?: string;
  jobResponsibility?: string;
  isDisabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  /** Merge fields into logged-in user and persist to localStorage. */
  patchUser: (partial: Partial<User>) => void;
  register: (
    userData: Partial<User> & { email: string; password: string; campusId: string }
  ) => Promise<{ ok: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
interface ApiAuthResponse {
  message?: string;
  user?: User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage for saved user
    const savedUser = localStorage.getItem('ochms_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const result = (await response.json()) as ApiAuthResponse;
      if (!result.user) {
        return false;
      }

      setUser(result.user);
      localStorage.setItem('ochms_user', JSON.stringify(result.user));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ochms_user');
  };

  const patchUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...partial };
      localStorage.setItem('ochms_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const register = async (
    userData: Partial<User> & { email: string; password: string; campusId: string }
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const campusNum = Number(userData.campusId);
      if (!userData.campusId || Number.isNaN(campusNum) || campusNum < 1) {
        return { ok: false, message: 'Please select a campus.' };
      }

      const response = await fetch(`${API_BASE_URL}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          campusId: campusNum,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as ApiAuthResponse & {
        error?: string;
      };

      if (!response.ok) {
        return {
          ok: false,
          message: result.message || result.error || `Registration failed (${response.status})`,
        };
      }

      if (!result.user) {
        return { ok: false, message: 'Invalid response from server.' };
      }

      const u: User = {
        ...result.user,
        id: String(result.user.id),
        campusId: result.user.campusId != null ? String(result.user.campusId) : null,
        campusName: result.user.campusName ?? null,
      };

      setUser(u as User);
      localStorage.setItem('ochms_user', JSON.stringify(u));
      return { ok: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { ok: false, message: 'Network error. Is Apache (XAMPP) running on port 80?' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, patchUser, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
