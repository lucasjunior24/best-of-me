import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
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
import type { IStudyRepository } from '../../core/ports/IStudyRepository';
import type { StudyTopic, UpdateStudyTopicInput } from '../../core/entities/StudyTopic';
import type { StudySession } from '../../core/entities/StudySession';
import type { ProgressData, TopicProgress } from '../../core/entities/ProgressData';
import { NotFoundError } from '../../shared/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Helpers — conversão Firestore <-> domínio
// ---------------------------------------------------------------------------

function parseTimestamp(value: Timestamp | null | undefined): Date {
  return value?.toDate() ?? new Date();
}

function topicFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): StudyTopic {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    name: data.name,
    color: data.color,
    totalDays: data.totalDays,
    hoursPerDay: data.hoursPerDay,
    createdAt: parseTimestamp(data.createdAt as Timestamp),
    updatedAt: parseTimestamp(data.updatedAt as Timestamp),
    sharedWith: data.sharedWith ?? [],
    isShared: data.isShared ?? false,
    ownerUserId: data.ownerUserId ?? data.userId,
  };
}

function sessionFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): StudySession {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    topicId: data.topicId,
    date: data.date,
    completed: data.completed ?? false,
    completedAt: data.completedAt ? parseTimestamp(data.completedAt as Timestamp) : undefined,
    duration: data.duration,
    createdAt: parseTimestamp(data.createdAt as Timestamp),
    notes: data.notes ?? undefined,
    createdBy: data.createdBy ?? undefined,
    completedBy: data.completedBy ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// FirebaseStudyRepository
// ---------------------------------------------------------------------------

export class FirebaseStudyRepository implements IStudyRepository {
  // Collection paths as regular methods (not getters — TS getters cannot take params)
  private topicsCollection(uid: string) {
    return collection(db, 'users', uid, 'topics');
  }

  private sessionsCollection(uid: string) {
    return collection(db, 'users', uid, 'sessions');
  }

  // ---- T4.2: createTopic --------------------------------------------------

  async createTopic(
    topic: Omit<StudyTopic, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StudyTopic> {
    const id = uuidv4();
    const now = serverTimestamp();

    const docData = {
      userId: topic.userId,
      name: topic.name,
      color: topic.color,
      totalDays: topic.totalDays,
      hoursPerDay: topic.hoursPerDay,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = doc(this.topicsCollection(topic.userId), id);
    await setDoc(docRef, docData);

    this._lastUserId = topic.userId;

    return {
      id,
      ...topic,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // ---- T4.2: updateTopic --------------------------------------------------

  async updateTopic(id: string, data: UpdateStudyTopicInput): Promise<StudyTopic> {
    const userId = this._resolveUserId();
    const docRef = doc(this.topicsCollection(userId), id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('StudyTopic', id);
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.color !== undefined) updatePayload.color = data.color;
    if (data.totalDays !== undefined) updatePayload.totalDays = data.totalDays;
    if (data.hoursPerDay !== undefined) updatePayload.hoursPerDay = data.hoursPerDay;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(docRef, updatePayload as any);

    // Retorna o documento atualizado
    const updatedSnapshot = await getDoc(docRef);
    return topicFromDoc(updatedSnapshot as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- T4.2: deleteTopic --------------------------------------------------

  async deleteTopic(id: string): Promise<void> {
    const userId = this._resolveUserId();
    const topicDocRef = doc(this.topicsCollection(userId), id);

    const topicSnapshot = await getDoc(topicDocRef);
    if (!topicSnapshot.exists()) {
      throw new NotFoundError('StudyTopic', id);
    }

    // Batch delete: remover o tópico + todas as sessions associadas
    const batch = writeBatch(db);

    // Deletar o tópico
    batch.delete(topicDocRef);

    // Buscar e deletar todas as sessions associadas
    const sessionsQuery = query(this.sessionsCollection(userId), where('topicId', '==', id));
    const sessionsSnapshot = await getDocs(sessionsQuery);
    for (const sessionDoc of sessionsSnapshot.docs) {
      batch.delete(sessionDoc.ref);
    }

    await batch.commit();
  }

  // ---- T4.3: getTopicsByUser -----------------------------------------------

  async getTopicsByUser(userId: string): Promise<StudyTopic[]> {
    this._lastUserId = userId;

    const q = query(this.topicsCollection(userId), orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => topicFromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  // ---- T4.4: scheduleSessions ----------------------------------------------

  async scheduleSessions(
    sessions: Omit<StudySession, 'id' | 'createdAt' | 'completed' | 'completedAt'>[],
  ): Promise<StudySession[]> {
    if (sessions.length === 0) return [];

    const userId = sessions[0].userId;
    const now = serverTimestamp();

    // Buscar sessions existentes para verificar duplicatas (mesmo topicId + date)
    const existingQuery = query(this.sessionsCollection(userId), where('userId', '==', userId));
    const existingSnapshot = await getDocs(existingQuery);
    const existingKeys = new Set(
      existingSnapshot.docs.map((d) => `${d.data().topicId}_${d.data().date}`),
    );

    // Filtrar apenas sessions que NÃO são duplicatas
    const newSessions = sessions.filter((s) => !existingKeys.has(`${s.topicId}_${s.date}`));

    if (newSessions.length === 0) return [];

    const createdSessions: StudySession[] = [];
    const maxBatchSize = 500;

    // Processar em lotes de até 500 operações
    for (let i = 0; i < newSessions.length; i += maxBatchSize) {
      const chunk = newSessions.slice(i, i + maxBatchSize);
      const batch = writeBatch(db);

      const chunkResults: StudySession[] = [];

      for (const session of chunk) {
        const id = uuidv4();
        const docRef = doc(this.sessionsCollection(userId), id);

        const docData = {
          userId: session.userId,
          topicId: session.topicId,
          date: session.date,
          duration: session.duration,
          completed: false,
          createdAt: now,
        };

        batch.set(docRef, docData);
        chunkResults.push({
          id,
          ...session,
          completed: false,
          createdAt: new Date(),
        });
      }

      await batch.commit();
      createdSessions.push(...chunkResults);
    }

    return createdSessions;
  }

  // ---- T4.5: getSessionsByDateRange ----------------------------------------

  async getSessionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    topicIds?: string[],
  ): Promise<StudySession[]> {
    const sessionsMap = new Map<string, StudySession>();

    if (!topicIds || topicIds.length === 0) {
      // Query simples: range de datas sem filtro de tópico
      const q = query(
        this.sessionsCollection(userId),
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc'),
      );

      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        const session = sessionFromDoc(docSnap as QueryDocumentSnapshot<DocumentData>);
        sessionsMap.set(session.id, session);
      }
    } else {
      // Múltiplas queries agrupadas em chunks de 10 (limite do Firestore 'in')
      const chunks = this.chunkArray(topicIds, 10);

      for (const chunk of chunks) {
        const q = query(
          this.sessionsCollection(userId),
          where('userId', '==', userId),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          where('topicId', 'in', chunk),
          orderBy('date', 'asc'),
        );

        const snapshot = await getDocs(q);
        for (const docSnap of snapshot.docs) {
          const session = sessionFromDoc(docSnap as QueryDocumentSnapshot<DocumentData>);
          sessionsMap.set(session.id, session);
        }
      }
    }

    return Array.from(sessionsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  // ---- T4.6: toggleSessionCompletion ---------------------------------------

  async toggleSessionCompletion(sessionId: string, userId: string): Promise<StudySession> {
    const docRef = doc(this.sessionsCollection(userId), sessionId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('StudySession', sessionId);
    }

    const currentData = snapshot.data();
    const currentlyCompleted = currentData.completed ?? false;

    const updatePayload: Record<string, unknown> = {
      completed: !currentlyCompleted,
      completedAt: currentlyCompleted ? null : serverTimestamp(),
      completedBy: currentlyCompleted ? null : userId,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(docRef, updatePayload as any);

    const updatedSnapshot = await getDoc(docRef);
    return sessionFromDoc(updatedSnapshot as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- updateTotalDays (Sprint 34 — T34.4) ----------------------------------

  async updateTotalDays(topicId: string, totalDays: number, userId: string): Promise<StudyTopic> {
    const docRef = doc(this.topicsCollection(userId), topicId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('StudyTopic', topicId);
    }

    const updatePayload: Record<string, unknown> = {
      totalDays,
      updatedAt: serverTimestamp(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(docRef, updatePayload as any);

    const updatedSnapshot = await getDoc(docRef);
    return topicFromDoc(updatedSnapshot as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- deleteSessionsByTopic -----------------------------------------------

  async deleteSessionsByTopic(userId: string, topicId: string): Promise<void> {
    const sessionsQuery = query(this.sessionsCollection(userId), where('topicId', '==', topicId));
    const sessionsSnapshot = await getDocs(sessionsQuery);

    if (sessionsSnapshot.empty) return;

    const batch = writeBatch(db);
    for (const sessionDoc of sessionsSnapshot.docs) {
      batch.delete(sessionDoc.ref);
    }
    await batch.commit();
  }

  // ---- updateSessionNotes --------------------------------------------------

  async updateSessionNotes(
    sessionId: string,
    userId: string,
    notes: string,
  ): Promise<StudySession> {
    const docRef = doc(this.sessionsCollection(userId), sessionId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('StudySession', sessionId);
    }

    await updateDoc(docRef, { notes });

    const updatedSnapshot = await getDoc(docRef);
    return sessionFromDoc(updatedSnapshot as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- T4.7: getProgress ---------------------------------------------------

  async getProgress(userId: string, topicIds?: string[]): Promise<ProgressData> {
    // Buscar todos os tópicos do usuário
    const topics = await this.getTopicsByUser(userId);

    // Filtrar tópicos se topicIds fornecido
    const relevantTopics =
      topicIds && topicIds.length > 0 ? topics.filter((t) => topicIds.includes(t.id)) : topics;

    const relevantTopicIds = new Set(relevantTopics.map((t) => t.id));

    // Buscar TODAS as sessions do usuário
    // ⚠️ Em produção, se o número de sessions for > 500, será necessário paginar.
    // Para o MVP, assumimos volume gerenciável.
    const allSessionsQuery = query(this.sessionsCollection(userId), where('userId', '==', userId));
    const sessionsSnapshot = await getDocs(allSessionsQuery);
    const allSessions = sessionsSnapshot.docs.map((d) =>
      sessionFromDoc(d as QueryDocumentSnapshot<DocumentData>),
    );

    // Filtrar sessions pelos topicIds relevantes
    const filteredSessions = allSessions.filter((s) => relevantTopicIds.has(s.topicId));

    // Calcular totais globais
    const totalPlannedSessions = filteredSessions.length;
    const totalCompletedSessions = filteredSessions.filter((s) => s.completed).length;
    const completionPercentage =
      totalPlannedSessions > 0
        ? Math.round((totalCompletedSessions / totalPlannedSessions) * 100)
        : 0;

    // Agrupar por tópico
    const topicMap = new Map<string, StudyTopic>();
    for (const topic of relevantTopics) {
      topicMap.set(topic.id, topic);
    }

    const sessionsByTopic = new Map<string, StudySession[]>();
    for (const session of filteredSessions) {
      if (!sessionsByTopic.has(session.topicId)) {
        sessionsByTopic.set(session.topicId, []);
      }
      sessionsByTopic.get(session.topicId)!.push(session);
    }

    const byTopic: TopicProgress[] = [];
    for (const [topicId, topicSessions] of sessionsByTopic) {
      const topic = topicMap.get(topicId);
      if (!topic) continue;

      const total = topicSessions.length;
      const completed = topicSessions.filter((s) => s.completed).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      byTopic.push({
        topicId,
        topicName: topic.name,
        topicColor: topic.color,
        totalSessions: total,
        completedSessions: completed,
        percentage,
      });
    }

    // Adicionar tópicos sem sessions (0/0)
    for (const topic of relevantTopics) {
      if (!sessionsByTopic.has(topic.id)) {
        byTopic.push({
          topicId: topic.id,
          topicName: topic.name,
          topicColor: topic.color,
          totalSessions: 0,
          completedSessions: 0,
          percentage: 0,
        });
      }
    }

    return {
      totalPlannedSessions,
      totalCompletedSessions,
      completionPercentage,
      byTopic,
    };
  }

  // ---- helpers internos ----------------------------------------------------

  private _lastUserId: string | null = null;

  private _resolveUserId(): string {
    if (!this._lastUserId) {
      throw new Error(
        'FirebaseStudyRepository: userId não definido. ' +
          'Execute getTopicsByUser ou createTopic antes de operações que não recebem userId.',
      );
    }
    return this._lastUserId;
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
