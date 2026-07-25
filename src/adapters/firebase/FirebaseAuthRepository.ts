import {
  signInWithPopup,
  signOut as firebaseSignOut,
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
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
}
