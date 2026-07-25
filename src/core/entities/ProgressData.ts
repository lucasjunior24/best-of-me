export interface TopicProgress {
  topicId: string;
  topicName: string;
  topicColor: string;
  totalSessions: number;
  completedSessions: number;
  percentage: number;
}

export interface ProgressData {
  totalPlannedSessions: number;
  totalCompletedSessions: number;
  completionPercentage: number;
  byTopic: TopicProgress[];
}

export interface CalendarDay {
  date: string;
  sessions: Array<{
    sessionId: string;
    topicId: string;
    topicName: string;
    topicColor: string;
    completed: boolean;
    completedAt?: Date;
    hoursPerDay: number;
  }>;
  allCompleted: boolean;
  anyCompleted: boolean;
}
