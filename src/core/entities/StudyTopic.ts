export interface StudyTopic {
  id: string;
  userId: string;
  name: string;
  color: string;
  totalDays: number;
  hoursPerDay: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateStudyTopicInput = {
  name: string;
  color: string;
  totalDays: number;
  hoursPerDay: number;
  scheduledDates: string[];
};

export type UpdateStudyTopicInput = Partial<Omit<CreateStudyTopicInput, 'scheduledDates'>>;
