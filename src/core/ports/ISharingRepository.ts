import type { SharedTopic, CreateSharedTopicInput } from '../entities/SharedTopic';
import type { StudyTopic } from '../entities/StudyTopic';

export interface ISharingRepository {
  shareTopic(input: CreateSharedTopicInput): Promise<SharedTopic>;
  getPendingInvitations(email: string): Promise<SharedTopic[]>;
  acceptInvitation(sharedId: string, userId: string): Promise<void>;
  rejectInvitation(sharedId: string): Promise<void>;
  getSharedTopics(userId: string): Promise<StudyTopic[]>;
  removeShare(sharedId: string): Promise<void>;
  /** Busca um SharedTopic pelo ID do tópico e usuário destino (para evitar duplicatas) */
  findExistingShare(topicId: string, sharedWithUserId: string): Promise<SharedTopic | null>;
}
