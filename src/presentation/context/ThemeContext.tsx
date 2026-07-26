import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '../../adapters/firebase/config';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage indisponível
  }

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function persistTheme(theme: Theme, user: User | null) {
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // localStorage indisponível
  }

  if (user) {
    const prefDoc = doc(db, 'users', user.uid, 'preferences', 'theme');
    setDoc(prefDoc, { theme }, { merge: true }).catch(() => {
      // falha silenciosa — localStorage é a fonte primária
    });
  }
}

async function loadThemeFromFirestore(user: User): Promise<Theme | null> {
  try {
    const prefDoc = doc(db, 'users', user.uid, 'preferences', 'theme');
    const snapshot = await getDoc(prefDoc);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.theme === 'dark' || data.theme === 'light') {
        return data.theme as Theme;
      }
    }
  } catch {
    // falha silenciosa ao ler do Firestore
  }
  return null;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [user, setUser] = useState<User | null>(null);

  // Apply class on mount and on theme change
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // Watch Firebase auth state to sync Firestore preferences
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // User signed in — try to load theme from Firestore
        loadThemeFromFirestore(firebaseUser).then((remoteTheme) => {
          if (remoteTheme) {
            setTheme(remoteTheme);
          } else {
            // No remote preference yet — save current local preference to Firestore
            setDoc(
              doc(db, 'users', firebaseUser.uid, 'preferences', 'theme'),
              { theme: getInitialTheme() },
              { merge: true },
            ).catch(() => {});
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      persistTheme(next, user);
      return next;
    });
  }, [user]);

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
