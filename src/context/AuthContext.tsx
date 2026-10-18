import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '@/types';

const API_BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3001';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  intendedPath: string | null;
  setIntendedPath: (path: string | null) => void;
  pendingItemId: string | null;
  setPendingItemId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'mender_auth_user';
const REGISTERED_EMAILS_KEY = 'mender_registered_emails';

function getRegisteredEmails(): string[] {
  try {
    const raw = localStorage.getItem(REGISTERED_EMAILS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}

function registerEmail(email: string): void {
  const emails = getRegisteredEmails();
  if (!emails.includes(email)) {
    emails.push(email);
    localStorage.setItem(REGISTERED_EMAILS_KEY, JSON.stringify(emails));
  }
}

function hydrateUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    // Basic shape validation
    if (parsed && typeof parsed.id === 'string' && typeof parsed.email === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(hydrateUser);
  const [intendedPath, setIntendedPath] = useState<string | null>(null);
  const [pendingItemId, _setPendingItemIdRaw] = useState<string | null>(() => {
    return sessionStorage.getItem('mender_pending_item_id');
  });
  const navigate = useNavigate();

  const setPendingItemId = useCallback((id: string | null) => {
    if (id === null) {
      sessionStorage.removeItem('mender_pending_item_id');
    } else {
      sessionStorage.setItem('mender_pending_item_id', id);
    }
    _setPendingItemIdRaw(id);
  }, []);

  const login = useCallback((email: string, password: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      // Try real API first
      fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
        .then(async (res) => {
          if (res.ok) {
            const { token, user } = await res.json() as {
              token: string;
              user: { id: string; full_name: string; email: string; phone: string | null; role: string };
            };
            const words = user.full_name.trim().split(/\s+/);
            const avatarInitials = words.slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
            const newUser: AuthUser = {
              id: user.id,
              name: user.full_name,
              email: user.email,
              phone: user.phone ?? undefined,
              avatarInitials,
            };
            localStorage.setItem('mender_auth_token', token);
            setUser(newUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
            resolve();
          } else {
            const err = await res.json() as { error?: string };
            reject(new Error(err.error ?? 'Login failed'));
          }
        })
        .catch(() => {
          // Network error — fall back to mock auth (development only)
          if (!import.meta.env.DEV) {
            reject(new Error('Unable to reach the authentication server. Please try again.'));
            return;
          }
          setTimeout(() => {
            const registeredEmails = getRegisteredEmails();
            if (!registeredEmails.includes(email)) {
              reject(new Error('No account found for this email. Please sign up first.'));
              return;
            }
            // Restore the name saved at signup; fall back to email local part only if absent
            const savedName = localStorage.getItem(`mender_name_${email}`);
            let name: string;
            let avatarInitials: string;
            if (savedName) {
              const words = savedName.trim().split(/\s+/);
              name = savedName.trim();
              avatarInitials = words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
            } else {
              const localPart = email.split('@')[0] ?? email;
              const words = localPart.split(/[._]/).filter(Boolean);
              const nameWords = words.length > 0 ? words : [localPart];
              name = nameWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
              avatarInitials = nameWords.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
            }
            const savedPhone = localStorage.getItem(`mender_phone_${email}`) ?? '';
            const newUser: AuthUser = { id: crypto.randomUUID(), name, email, phone: savedPhone, avatarInitials };
            setUser(newUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
            resolve();
          }, 500);
        });
    });
  }, []);

  const signup = useCallback((name: string, email: string, phone: string, password: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      // Try real API first
      fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, phone, password }),
      })
        .then(async (res) => {
          if (res.ok) {
            const { token, user } = await res.json() as {
              token: string;
              user: { id: string; full_name: string; email: string; phone: string | null; role: string };
            };
            const words = user.full_name.trim().split(/\s+/);
            const avatarInitials = words.slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
            const newUser: AuthUser = {
              id: user.id,
              name: user.full_name,
              email: user.email,
              phone: user.phone ?? undefined,
              avatarInitials,
            };
            localStorage.setItem('mender_auth_token', token);
            setUser(newUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
            registerEmail(email);
            resolve();
          } else {
            const err = await res.json() as { error?: string };
            reject(new Error(err.error ?? 'Signup failed'));
          }
        })
        .catch(() => {
          // Network error — fall back to mock auth (development only)
          if (!import.meta.env.DEV) {
            reject(new Error('Unable to reach the authentication server. Please try again.'));
            return;
          }
          setTimeout(() => {
            const words = name.trim().split(/\s+/);
            const avatarInitials = words
              .slice(0, 2)
              .map(w => w[0]?.toUpperCase() ?? '')
              .join('');
            const newUser: AuthUser = {
              id: crypto.randomUUID(),
              name: name.trim(),
              email,
              phone: phone.trim(),
              avatarInitials,
            };
            setUser(newUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
            localStorage.setItem(`mender_phone_${email}`, phone.trim());
            localStorage.setItem(`mender_name_${email}`, name.trim());
            registerEmail(email);
            resolve();
          }, 500);
        });
    });
  }, []);

  // Navigation after signup is handled in SignUpPage via intendedPath
  // (signup resolves, then the page navigates)

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mender_auth_token');
    localStorage.removeItem(STORAGE_KEY);
    navigate('/');
  }, [navigate]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    login,
    signup,
    logout,
    intendedPath,
    setIntendedPath,
    pendingItemId,
    setPendingItemId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
