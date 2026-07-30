import {
  signInWithPopup,
  signOut as firebaseSignOut,
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import type { IAuthRepository } from '../../core/ports/IAuthRepository';
import type { User } from '../../core/entities/User';

function firebaseUserToUser(firebaseUser: import('firebase/auth').User): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName ?? 'Usuário',
    photoURL: firebaseUser.photoURL ?? undefined,
  };
}

export class FirebaseAuthRepository implements IAuthRepository {
  private currentUser: User | null = null;

  async signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = firebaseUserToUser(result.user);
    this.currentUser = user;
    return user;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(getAuth());
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const unsubscribe = firebaseOnAuthStateChanged(getAuth(), (firebaseUser) => {
      if (firebaseUser) {
        const user = firebaseUserToUser(firebaseUser);
        this.currentUser = user;
        callback(user);
      } else {
        this.currentUser = null;
        callback(null);
      }
    });
    return unsubscribe;
  }

  /**
   * Verifica se um e-mail está registrado no Firebase Auth.
   * Como o client SDK não expõe os dados do usuário por e-mail,
   * usamos fetchSignInMethodsForEmail para verificar se o e-mail
   * possui provedores de login (ou seja, está cadastrado).
   * Retorna um User parcial (sem id real, apenas e-mail) se existir,
   * ou null caso contrário.
   *
   * TODO Sprint 22: Substituir por Cloud Function que busca UID real.
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        // Não temos o UID pelo client SDK, mas sabemos que o e-mail existe.
        // O UID será resolvido corretamente na Sprint 22 via Cloud Function.
        return {
          id: '',
          email,
          displayName: email,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}
