import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  type Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { IReviewSharingRepository } from '../../core/ports/IReviewSharingRepository';
import type { SharedReview, CreateSharedReviewInput } from '../../core/entities/SharedReview';
import type { Review } from '../../core/entities/Review';
import { NotFoundError } from '../../shared/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseTimestamp(value: Timestamp | null | undefined): Date {
  return value?.toDate() ?? new Date();
}

function sharedReviewFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): SharedReview {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    reviewId: data.reviewId,
    ownerUserId: data.ownerUserId,
    ownerEmail: data.ownerEmail ?? undefined,
    sharedWithUserId: data.sharedWithUserId,
    sharedWithEmail: data.sharedWithEmail,
    permission: data.permission ?? 'edit',
    sharedAt: parseTimestamp(data.sharedAt as Timestamp),
    status: data.status ?? 'pending',
  };
}

// ---------------------------------------------------------------------------
// FirebaseReviewSharingRepository
// ---------------------------------------------------------------------------

export class FirebaseReviewSharingRepository implements IReviewSharingRepository {
  private static readonly COLLECTION = 'sharedReviews';

  private sharedReviewsCollection() {
    return collection(db, FirebaseReviewSharingRepository.COLLECTION);
  }

  // ---- shareReview ----------------------------------------------------------

  async shareReview(input: CreateSharedReviewInput): Promise<SharedReview> {
    const id = uuidv4();
    const now = serverTimestamp();

    const docData = {
      reviewId: input.reviewId,
      ownerUserId: input.ownerUserId,
      ownerEmail: input.ownerEmail ?? null,
      sharedWithUserId: input.sharedWithUserId,
      sharedWithEmail: input.sharedWithEmail,
      permission: input.permission,
      status: 'pending',
      sharedAt: now,
    };

    const docRef = doc(this.sharedReviewsCollection(), id);
    await setDoc(docRef, docData);

    return {
      id,
      ...input,
      sharedAt: new Date(),
      status: 'pending',
    };
  }

  // ---- getPendingInvitations -----------------------------------------------

  async getPendingInvitations(email: string): Promise<SharedReview[]> {
    const q = query(
      this.sharedReviewsCollection(),
      where('sharedWithEmail', '==', email),
      where('status', '==', 'pending'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => sharedReviewFromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  // ---- acceptInvitation ----------------------------------------------------

  async acceptInvitation(sharedId: string, userId: string): Promise<void> {
    const docRef = doc(this.sharedReviewsCollection(), sharedId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('SharedReview', sharedId);
    }

    await updateDoc(docRef, {
      status: 'accepted',
      sharedWithUserId: userId,
    });
  }

  // ---- rejectInvitation ----------------------------------------------------

  async rejectInvitation(sharedId: string): Promise<void> {
    const docRef = doc(this.sharedReviewsCollection(), sharedId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('SharedReview', sharedId);
    }

    await updateDoc(docRef, { status: 'rejected' });
  }

  // ---- getSharedReviews ----------------------------------------------------
  // Retorna reviews que foram compartilhadas COM o usuário (userId)
  // e que o usuário aceitou (status === 'accepted')

  async getSharedReviews(userId: string): Promise<Review[]> {
    const q = query(
      this.sharedReviewsCollection(),
      where('sharedWithUserId', '==', userId),
      where('status', '==', 'accepted'),
    );

    const snapshot = await getDocs(q);
    const links = snapshot.docs.map((d) =>
      sharedReviewFromDoc(d as QueryDocumentSnapshot<DocumentData>),
    );

    if (links.length === 0) return [];

    // Para cada link, buscar a review original na collection do owner
    const reviews: Review[] = [];
    const seenIds = new Set<string>();

    for (const link of links) {
      if (seenIds.has(link.reviewId)) continue;
      seenIds.add(link.reviewId);

      try {
        const reviewDocRef = doc(db, 'users', link.ownerUserId, 'reviews', link.reviewId);
        const reviewSnapshot = await getDoc(reviewDocRef);

        if (reviewSnapshot.exists()) {
          const data = reviewSnapshot.data();
          const review: Review = {
            id: reviewSnapshot.id,
            userId,
            name: data.name,
            color: data.color,
            scheduledDates: data.scheduledDates ?? [],
            startDate: data.startDate ?? undefined,
            intervalDays: data.intervalDays ?? undefined,
            totalReviews: data.totalReviews ?? undefined,
            sharedWith: data.sharedWith ?? [],
            isShared: true,
            ownerUserId: link.ownerUserId,
            createdAt: parseTimestamp(data.createdAt as Timestamp),
            updatedAt: parseTimestamp(data.updatedAt as Timestamp),
          };
          reviews.push(review);
        }
      } catch {
        // Review original pode ter sido deletada — ignorar silenciosamente
      }
    }

    return reviews;
  }

  // ---- removeShare ---------------------------------------------------------

  async removeShare(sharedId: string): Promise<void> {
    const docRef = doc(this.sharedReviewsCollection(), sharedId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('SharedReview', sharedId);
    }

    const data = snapshot.data();

    // Remover o userId do array sharedWith da review original
    try {
      const reviewDocRef = doc(db, 'users', data.ownerUserId, 'reviews', data.reviewId);
      const reviewSnapshot = await getDoc(reviewDocRef);

      if (reviewSnapshot.exists()) {
        const reviewData = reviewSnapshot.data();
        const currentSharedWith: string[] = reviewData.sharedWith ?? [];
        const updatedSharedWith = currentSharedWith.filter(
          (uid: string) => uid !== data.sharedWithUserId,
        );

        await updateDoc(reviewDocRef, { sharedWith: updatedSharedWith });
      }
    } catch {
      // Se a review não existir mais, apenas prosseguir com a remoção do link
    }

    // Deletar o documento de compartilhamento
    await deleteDoc(docRef);
  }

  // ---- findExistingShare ---------------------------------------------------

  async findExistingShare(
    reviewId: string,
    sharedWithUserId: string,
  ): Promise<SharedReview | null> {
    const q = query(
      this.sharedReviewsCollection(),
      where('reviewId', '==', reviewId),
      where('sharedWithUserId', '==', sharedWithUserId),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return sharedReviewFromDoc(docSnap as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- removeShareForReview ------------------------------------------------

  async removeShareForReview(reviewId: string, sharedWithUserId: string): Promise<void> {
    const q = query(
      this.sharedReviewsCollection(),
      where('reviewId', '==', reviewId),
      where('sharedWithUserId', '==', sharedWithUserId),
    );

    const snapshot = await getDocs(q);

    // Deletar todos os documentos de compartilhamento encontrados
    const batch = writeBatch(db);
    for (const docSnap of snapshot.docs) {
      batch.delete(docSnap.ref);
    }
    if (!snapshot.empty) {
      await batch.commit();
    }
  }

  // ---- getSharesForReview (auxiliar para UI de gerenciamento) ----------------

  async getSharesForReview(reviewId: string): Promise<SharedReview[]> {
    const q = query(this.sharedReviewsCollection(), where('reviewId', '==', reviewId));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => sharedReviewFromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  // ---- getUserEmail (auxiliar para enriquecer convites) ---------------------

  async getUserEmail(userId: string): Promise<string | null> {
    // Buscar em qualquer sharedReview que tenha este userId como ownerUserId
    const q = query(this.sharedReviewsCollection(), where('ownerUserId', '==', userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return data.ownerEmail ?? null;
    }
    return null;
  }
}
