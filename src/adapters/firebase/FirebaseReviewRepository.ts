import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  type Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { IReviewRepository } from '../../core/ports/IReviewRepository';
import type { Review, UpdateReviewInput } from '../../core/entities/Review';
import { generateReviewDates, filterReviewDatesInRange } from '../../core/entities/Review';
import type {
  ReviewQuestionnaire,
  CreateQuestionnaireInput,
} from '../../core/entities/ReviewQuestionnaire';
import { calculateAccuracy } from '../../core/entities/ReviewQuestionnaire';
import type {
  ReviewSessionCalendarData,
  ReviewStats,
  ReviewStatsData,
} from '../../core/entities/ProgressData';
import { NotFoundError } from '../../shared/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Helpers — conversão Firestore <-> domínio
// ---------------------------------------------------------------------------

function parseTimestamp(value: Timestamp | null | undefined): Date {
  return value?.toDate() ?? new Date();
}

function reviewFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): Review {
  const data = snapshot.data();

  // Migração: se scheduledDates não existe, derivar de startDate + intervalDays + totalReviews
  let scheduledDates: string[];
  if (Array.isArray(data.scheduledDates) && data.scheduledDates.length > 0) {
    scheduledDates = data.scheduledDates;
  } else if (data.startDate && data.intervalDays && data.totalReviews) {
    // Fallback para dados antigos (migração automática)
    scheduledDates = generateReviewDates(
      data.startDate as string,
      data.intervalDays as number,
      data.totalReviews as number,
    );
  } else {
    scheduledDates = [];
  }

  return {
    id: snapshot.id,
    userId: data.userId,
    name: data.name,
    color: data.color,
    scheduledDates,
    startDate: data.startDate ?? undefined,
    intervalDays: data.intervalDays ?? undefined,
    totalReviews: data.totalReviews ?? undefined,
    createdAt: parseTimestamp(data.createdAt as Timestamp),
    updatedAt: parseTimestamp(data.updatedAt as Timestamp),
  };
}

function questionnaireFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): ReviewQuestionnaire {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    reviewId: data.reviewId,
    date: data.date,
    totalQuestions: data.totalQuestions,
    correctAnswers: data.correctAnswers,
    createdAt: parseTimestamp(data.createdAt as Timestamp),
    updatedAt: parseTimestamp(data.updatedAt as Timestamp),
  };
}

// ---------------------------------------------------------------------------
// FirebaseReviewRepository
// ---------------------------------------------------------------------------

export class FirebaseReviewRepository implements IReviewRepository {
  // Collection paths
  private reviewsCollection(uid: string) {
    return collection(db, 'users', uid, 'reviews');
  }

  private questionnairesCollection(uid: string) {
    return collection(db, 'users', uid, 'reviewQuestionnaires');
  }

  // ---- createReview ----------------------------------------------------------

  async createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    const id = uuidv4();
    const now = serverTimestamp();

    const docData: Record<string, unknown> = {
      userId: review.userId,
      name: review.name,
      color: review.color,
      scheduledDates: review.scheduledDates,
      createdAt: now,
      updatedAt: now,
    };

    // Preservar metadados automáticos se fornecidos
    if (review.startDate !== undefined) docData.startDate = review.startDate;
    if (review.intervalDays !== undefined) docData.intervalDays = review.intervalDays;
    if (review.totalReviews !== undefined) docData.totalReviews = review.totalReviews;

    const docRef = doc(this.reviewsCollection(review.userId), id);
    await setDoc(docRef, docData);

    this._lastUserId = review.userId;

    return {
      id,
      ...review,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // ---- updateReview ----------------------------------------------------------

  async updateReview(id: string, data: UpdateReviewInput): Promise<Review> {
    const userId = this._resolveUserId();
    const docRef = doc(this.reviewsCollection(userId), id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('Review', id);
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.color !== undefined) updatePayload.color = data.color;
    if (data.scheduledDates !== undefined) updatePayload.scheduledDates = data.scheduledDates;
    if (data.startDate !== undefined) updatePayload.startDate = data.startDate;
    if (data.intervalDays !== undefined) updatePayload.intervalDays = data.intervalDays;
    if (data.totalReviews !== undefined) updatePayload.totalReviews = data.totalReviews;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(docRef, updatePayload as any);

    const updatedSnapshot = await getDoc(docRef);
    return reviewFromDoc(updatedSnapshot as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- deleteReview ----------------------------------------------------------

  async deleteReview(id: string): Promise<void> {
    const userId = this._resolveUserId();
    const reviewDocRef = doc(this.reviewsCollection(userId), id);

    const reviewSnapshot = await getDoc(reviewDocRef);
    if (!reviewSnapshot.exists()) {
      throw new NotFoundError('Review', id);
    }

    // Batch delete: remover review + todos os questionários associados
    const batch = writeBatch(db);

    // Deletar a review
    batch.delete(reviewDocRef);

    // Buscar e deletar todos os questionários associados
    const questionnairesQuery = query(
      this.questionnairesCollection(userId),
      where('reviewId', '==', id),
    );
    const questionnairesSnapshot = await getDocs(questionnairesQuery);
    for (const qDoc of questionnairesSnapshot.docs) {
      batch.delete(qDoc.ref);
    }

    await batch.commit();
  }

  // ---- getReviewsByUser ------------------------------------------------------

  async getReviewsByUser(userId: string): Promise<Review[]> {
    this._lastUserId = userId;

    const q = query(this.reviewsCollection(userId), orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => reviewFromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  // ---- getReviewById ---------------------------------------------------------

  async getReviewById(id: string): Promise<Review | null> {
    const userId = this._resolveUserId();
    const docRef = doc(this.reviewsCollection(userId), id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return reviewFromDoc(snapshot as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- createOrUpdateQuestionnaire -------------------------------------------

  async createOrUpdateQuestionnaire(
    input: CreateQuestionnaireInput & { userId: string },
  ): Promise<ReviewQuestionnaire> {
    // Buscar questionário existente por reviewId + date
    const existing = await this.getQuestionnaireByDate(input.reviewId, input.date);

    if (existing) {
      // Update
      const docRef = doc(this.questionnairesCollection(input.userId), existing.id);

      const updatePayload: Record<string, unknown> = {
        totalQuestions: input.totalQuestions,
        correctAnswers: input.correctAnswers,
        updatedAt: serverTimestamp(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateDoc(docRef, updatePayload as any);

      const updatedSnapshot = await getDoc(docRef);
      return questionnaireFromDoc(updatedSnapshot as QueryDocumentSnapshot<DocumentData>);
    }

    // Create
    const id = uuidv4();
    const now = serverTimestamp();
    const docRef = doc(this.questionnairesCollection(input.userId), id);

    const docData = {
      userId: input.userId,
      reviewId: input.reviewId,
      date: input.date,
      totalQuestions: input.totalQuestions,
      correctAnswers: input.correctAnswers,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, docData);

    return {
      id,
      userId: input.userId,
      reviewId: input.reviewId,
      date: input.date,
      totalQuestions: input.totalQuestions,
      correctAnswers: input.correctAnswers,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // ---- getQuestionnairesByReview ---------------------------------------------

  async getQuestionnairesByReview(reviewId: string): Promise<ReviewQuestionnaire[]> {
    const userId = this._resolveUserId();

    const q = query(
      this.questionnairesCollection(userId),
      where('reviewId', '==', reviewId),
      orderBy('date', 'asc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => questionnaireFromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  // ---- getQuestionnaireByDate ------------------------------------------------

  async getQuestionnaireByDate(
    reviewId: string,
    date: string,
  ): Promise<ReviewQuestionnaire | null> {
    const userId = this._resolveUserId();

    const q = query(
      this.questionnairesCollection(userId),
      where('reviewId', '==', reviewId),
      where('date', '==', date),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return questionnaireFromDoc(snapshot.docs[0] as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- getReviewSessionsByDateRange ------------------------------------------

  async getReviewSessionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    reviewIds?: string[],
  ): Promise<ReviewSessionCalendarData[]> {
    // Buscar reviews do usuário
    const allReviews = await this.getReviewsByUser(userId);

    // Filtrar se reviewIds for fornecido
    const reviews =
      reviewIds && reviewIds.length > 0
        ? allReviews.filter((r) => reviewIds.includes(r.id))
        : allReviews;

    if (reviews.length === 0) {
      return [];
    }

    // Buscar todos os questionários do usuário de uma vez (para o range de datas)
    const questionnairesQuery = query(
      this.questionnairesCollection(userId),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
    );
    const questionnairesSnapshot = await getDocs(questionnairesQuery);
    const questionnaires = questionnairesSnapshot.docs.map((d) =>
      questionnaireFromDoc(d as QueryDocumentSnapshot<DocumentData>),
    );

    // Mapear questionários por chave composta: `${reviewId}_${date}`
    const questionnaireMap = new Map<string, ReviewQuestionnaire>();
    for (const q of questionnaires) {
      questionnaireMap.set(`${q.reviewId}_${q.date}`, q);
    }

    const result: ReviewSessionCalendarData[] = [];

    for (const review of reviews) {
      // Usar scheduledDates como fonte da verdade
      const allDates = review.scheduledDates;

      // Filtrar datas que caem no range solicitado
      const datesInRange = filterReviewDatesInRange(allDates, startDate, endDate);

      for (const date of datesInRange) {
        // Determinar o número da revisão (1ª, 2ª, 3ª...)
        const reviewNumber = allDates.indexOf(date) + 1;

        // Buscar questionário para esta data
        const questionnaire = questionnaireMap.get(`${review.id}_${date}`);

        const sessionData: ReviewSessionCalendarData = {
          reviewId: review.id,
          reviewName: review.name,
          reviewColor: review.color,
          date,
          reviewNumber,
          completed: !!questionnaire,
        };

        if (questionnaire) {
          sessionData.questionnaire = {
            totalQuestions: questionnaire.totalQuestions,
            correctAnswers: questionnaire.correctAnswers,
            accuracy: calculateAccuracy(questionnaire.correctAnswers, questionnaire.totalQuestions),
          };
        }

        result.push(sessionData);
      }
    }

    // Ordenar por data
    result.sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  // ---- getReviewStats --------------------------------------------------------

  async getReviewStats(userId: string, reviewIds?: string[]): Promise<ReviewStatsData> {
    // Buscar reviews do usuário
    const allReviews = await this.getReviewsByUser(userId);

    const reviews =
      reviewIds && reviewIds.length > 0
        ? allReviews.filter((r) => reviewIds.includes(r.id))
        : allReviews;

    if (reviews.length === 0) {
      return {
        overallAverageAccuracy: 0,
        overallCompletionPercentage: 0,
        byReview: [],
      };
    }

    // Buscar TODOS os questionários do usuário
    // ⚠️ Em produção, se o número de questionários for > 500, será necessário paginar.
    const allQuestionnairesQuery = query(
      this.questionnairesCollection(userId),
      where('userId', '==', userId),
    );
    const questionnairesSnapshot = await getDocs(allQuestionnairesQuery);
    const allQuestionnaires = questionnairesSnapshot.docs.map((d) =>
      questionnaireFromDoc(d as QueryDocumentSnapshot<DocumentData>),
    );

    const byReview: ReviewStats[] = [];

    for (const review of reviews) {
      // Usar scheduledDates como fonte da verdade
      const allDates = review.scheduledDates;
      const totalReviews = allDates.length;

      // Filtrar questionários desta review
      const reviewQuestionnaires = allQuestionnaires.filter((q) => q.reviewId === review.id);
      const completedReviews = reviewQuestionnaires.length;

      // Calcular acurácia média
      let totalQuestionsAnswered = 0;
      let totalCorrectAnswers = 0;
      let sumAccuracy = 0;

      for (const q of reviewQuestionnaires) {
        totalQuestionsAnswered += q.totalQuestions;
        totalCorrectAnswers += q.correctAnswers;
        sumAccuracy += calculateAccuracy(q.correctAnswers, q.totalQuestions);
      }

      const averageAccuracy = completedReviews > 0 ? Math.round(sumAccuracy / completedReviews) : 0;

      const completionPercentage =
        totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

      byReview.push({
        reviewId: review.id,
        reviewName: review.name,
        reviewColor: review.color,
        totalReviews,
        completedReviews,
        completionPercentage,
        averageAccuracy,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        questionnaires: reviewQuestionnaires,
      });
    }

    // Calcular overall
    const totalAccuracy = byReview.reduce((sum, r) => sum + r.averageAccuracy, 0);
    const totalCompletion = byReview.reduce((sum, r) => sum + r.completionPercentage, 0);

    const overallAverageAccuracy =
      byReview.length > 0 ? Math.round(totalAccuracy / byReview.length) : 0;
    const overallCompletionPercentage =
      byReview.length > 0 ? Math.round(totalCompletion / byReview.length) : 0;

    return {
      overallAverageAccuracy,
      overallCompletionPercentage,
      byReview,
    };
  }

  // ---- helpers internos ----------------------------------------------------

  private _lastUserId: string | null = null;

  private _resolveUserId(): string {
    if (!this._lastUserId) {
      throw new Error(
        'FirebaseReviewRepository: userId não definido. ' +
          'Execute getReviewsByUser ou createReview antes de operações que não recebem userId.',
      );
    }
    return this._lastUserId;
  }
}
