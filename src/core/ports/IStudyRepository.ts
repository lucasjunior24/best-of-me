import { StudyTopic, UpdateStudyTopicInput } from '../entities/StudyTopic';
import { StudySession } from '../entities/StudySession';
import { ProgressData } from '../entities/ProgressData';

export interface IStudyRepository {
  // Topics CRUD
  createTopic(topic: Omit<StudyTopic, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudyTopic>;
  updateTopic(id: string, data: UpdateStudyTopicInput): Promise<StudyTopic>;
  deleteTopic(id: string): Promise<void>;
  getTopicsByUser(userId: string): Promise<StudyTopic[]>;

  // Sessions
  scheduleSessions(
    sessions: Omit<StudySession, 'id' | 'createdAt' | 'completed' | 'completedAt'>[],
  ): Promise<StudySession[]>;
  getSessionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    topicIds?: string[],
  ): Promise<StudySession[]>;
  toggleSessionCompletion(sessionId: string, userId: string): Promise<StudySession>;

  // Progress
  getProgress(userId: string, topicIds?: string[]): Promise<ProgressData>;
}
