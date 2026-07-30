import { User } from '../entities/User';

export interface IAuthRepository {
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  /** Busca um usuário pelo e-mail. Retorna null se não encontrado. */
  getUserByEmail(email: string): Promise<User | null>;
}
