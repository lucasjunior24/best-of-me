import type { ReviewQuestionnaire } from './ReviewQuestionnaire';

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
    notes?: string;
  }>;
  allCompleted: boolean;
  anyCompleted: boolean;
}

/**
 * Dados de uma sessão de revisão para exibição no calendário.
 * (Preparação para Sprint 12-14 — o campo é populado futuramente)
 */
export interface ReviewSessionCalendarData {
  reviewId: string;
  reviewName: string;
  reviewColor: string;
  date: string;
  reviewNumber: number;
  questionnaire?: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
  };
  completed: boolean;
}

/**
 * Dia completo do calendário (grid 7 colunas).
 * Inclui sessões de estudo, revisões e metadados para renderização.
 */
export interface CalendarDayFull {
  date: string; // formato YYYY-MM-DD
  dayNumber: number; // 1-31
  isCurrentMonth: boolean;
  isToday: boolean;
  studySessions: CalendarDay['sessions'];
  reviewSessions: ReviewSessionCalendarData[];
  allCompleted: boolean;
  anyCompleted: boolean;
  hasActivities: boolean;
}

/**
 * Estatísticas individuais de uma revisão.
 */
export interface ReviewStats {
  reviewId: string;
  reviewName: string;
  reviewColor: string;
  totalReviews: number; // total planejado (totalReviews do Review)
  completedReviews: number; // quantas revisões já feitas (com questionário)
  completionPercentage: number;
  averageAccuracy: number; // média de acertos em %
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  questionnaires: ReviewQuestionnaire[];
}

/**
 * Estatísticas agregadas de todas as revisões do usuário.
 */
export interface ReviewStatsData {
  overallAverageAccuracy: number;
  overallCompletionPercentage: number;
  byReview: ReviewStats[];
}
