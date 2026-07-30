export interface StudyTopic {
  id: string;
  userId: string;
  name: string;
  color: string;
  totalDays: number;
  hoursPerDay: number;
  createdAt: Date;
  updatedAt: Date;
  /** IDs dos usuários com quem o tema foi compartilhado */
  sharedWith?: string[];
  /** Indica se o tema foi recebido via compartilhamento */
  isShared?: boolean;
  /** ID do usuário que criou o tema originalmente */
  ownerUserId?: string;
}

export type CreateStudyTopicInput = {
  name: string;
  color: string;
  totalDays: number;
  hoursPerDay: number;
  scheduledDates: string[];
};

export type UpdateStudyTopicInput = Partial<
  Omit<CreateStudyTopicInput, 'scheduledDates'> & {
    sharedWith?: string[];
  }
>;
