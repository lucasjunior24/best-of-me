import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { ISummaryRepository } from '../../core/ports/ISummaryRepository';
import type { Summary, UpdateSummaryInput } from '../../core/entities/Summary';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Helpers — conversão Firestore <-> domínio
// ---------------------------------------------------------------------------

function parseTimestamp(value: Timestamp | null | undefined): Date {
  return value?.toDate() ?? new Date();
}

function docToSummary(snapshot: QueryDocumentSnapshot<DocumentData>): Summary {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    title: data.title,
    content: data.content,
    tags: data.tags ?? [],
    createdAt: parseTimestamp(data.createdAt as Timestamp),
    updatedAt: parseTimestamp(data.updatedAt as Timestamp),
  };
}

// ---------------------------------------------------------------------------
// FirebaseSummaryRepository
// ---------------------------------------------------------------------------

export class FirebaseSummaryRepository implements ISummaryRepository {
  private summariesCollection(uid: string) {
    return collection(db, 'users', uid, 'summaries');
  }

  private summaryDoc(uid: string, summaryId: string) {
    return doc(db, 'users', uid, 'summaries', summaryId);
  }

  // ---- T29.2: createSummary ------------------------------------------------

  async createSummary(summary: Omit<Summary, 'id' | 'createdAt' | 'updatedAt'>): Promise<Summary> {
    const id = uuidv4();
    const docRef = this.summaryDoc(summary.userId, id);

    await setDoc(docRef, {
      userId: summary.userId,
      title: summary.title,
      content: summary.content,
      tags: summary.tags,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Read back to get server timestamps as Dates
    const created = await getDoc(docRef);
    if (!created.exists()) {
      throw new Error('Falha ao criar resumo: documento não encontrado após criação.');
    }

    return docToSummary(created as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- T29.2: updateSummary ------------------------------------------------

  async updateSummary(userId: string, id: string, data: UpdateSummaryInput): Promise<Summary> {
    const docRef = this.summaryDoc(userId, id);

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }

    await updateDoc(docRef, updateData);

    // Read back to get the updated document
    const updated = await getDoc(docRef);
    if (!updated.exists()) {
      throw new Error('Resumo não encontrado após atualização.');
    }

    return docToSummary(updated as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- T29.2: deleteSummary ------------------------------------------------

  async deleteSummary(userId: string, id: string): Promise<void> {
    const docRef = this.summaryDoc(userId, id);
    await deleteDoc(docRef);
  }

  // ---- T29.2: getSummariesByUser -------------------------------------------

  async getSummariesByUser(userId: string): Promise<Summary[]> {
    const q = query(this.summariesCollection(userId), orderBy('updatedAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToSummary);
  }

  // ---- T29.2: getSummaryById -----------------------------------------------

  async getSummaryById(userId: string, id: string): Promise<Summary> {
    const docRef = this.summaryDoc(userId, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error(`Summary not found: ${id}`);
    }

    return docToSummary(snapshot as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- T29.3: getSummariesByTags -------------------------------------------

  async getSummariesByTags(userId: string, tags: string[]): Promise<Summary[]> {
    if (tags.length === 0) {
      return [];
    }

    // Firestore array-contains-any is OR logic. We need AND logic.
    // Strategy: use array-contains-any for initial filter, then apply AND on
    // the client side.
    // array-contains-any accepts max 30 values
    const firestoreTags = tags.slice(0, 30);

    const q = query(
      this.summariesCollection(userId),
      where('tags', 'array-contains-any', firestoreTags),
      orderBy('updatedAt', 'desc'),
    );

    const snapshot = await getDocs(q);
    const summaries = snapshot.docs.map(docToSummary);

    // Apply AND logic on client side: the summary must contain ALL requested tags
    return summaries.filter((s) => tags.every((tag) => s.tags.includes(tag)));
  }

  // ---- T29.3: searchSummaries ----------------------------------------------

  async searchSummaries(userId: string, queryText: string): Promise<Summary[]> {
    if (!queryText.trim()) {
      return this.getSummariesByUser(userId);
    }

    // Firestore doesn't support full-text search natively.
    // Strategy: fetch all summaries for the user and filter client-side.
    const all = await this.getSummariesByUser(userId);

    const lowerQuery = queryText.trim().toLowerCase();
    return all.filter(
      (s) =>
        s.title.toLowerCase().includes(lowerQuery) || s.content.toLowerCase().includes(lowerQuery),
    );
  }
}
