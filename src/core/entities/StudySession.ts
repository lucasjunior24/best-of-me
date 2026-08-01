export interface StudySession {
  id: string;
  userId: string;
  topicId: string;
  date: string;
  completed: boolean;
  completedAt?: Date;
  duration?: number;
  createdAt: Date;
  /** ID do usuário que criou a session (útil em temas compartilhados) */
  createdBy?: string;
  /** ID do usuário que concluiu a session */
  completedBy?: string;
  /** Anotações/comentários do usuário sobre esta sessão */
  notes?: string;
}

export type StudySessionWithTopic = StudySession & {
  topicName: string;
  topicColor: string;
};
