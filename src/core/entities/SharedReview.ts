export interface SharedReview {
  id: string;
  reviewId: string;
  ownerUserId: string;
  ownerEmail?: string;
  sharedWithUserId: string;
  sharedWithEmail: string;
  permission: 'edit' | 'view';
  sharedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export type CreateSharedReviewInput = {
  reviewId: string;
  ownerUserId: string;
  ownerEmail?: string;
  sharedWithUserId: string;
  sharedWithEmail: string;
  permission: 'edit' | 'view';
};
