export interface StudySession {
  id: string;
  userId: string;
  topicId: string;
  date: string;
  completed: boolean;
  completedAt?: Date;
  duration?: number;
  createdAt: Date;
}

export type StudySessionWithTopic = StudySession & {
  topicName: string;
  topicColor: string;
};
