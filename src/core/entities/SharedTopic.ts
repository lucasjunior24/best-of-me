export interface SharedTopic {
  id: string;
  topicId: string;
  ownerUserId: string;
  sharedWithUserId: string;
  sharedWithEmail: string;
  permission: 'edit' | 'view';
  sharedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export type CreateSharedTopicInput = {
  topicId: string;
  ownerUserId: string;
  sharedWithUserId: string;
  sharedWithEmail: string;
  permission: 'edit' | 'view';
};
