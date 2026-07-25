import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../../core/entities/User';
import { FirebaseAuthRepository } from '../../adapters/firebase/FirebaseAuthRepository';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const authRepository = new FirebaseAuthRepository();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authRepository.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    const loggedUser = await authRepository.signInWithGoogle();
    setUser(loggedUser);
  }, []);

  const signOut = useCallback(async () => {
    await authRepository.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
