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
  serverTimestamp,
  type Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { ISharingRepository } from '../../core/ports/ISharingRepository';
import type { SharedTopic, CreateSharedTopicInput } from '../../core/entities/SharedTopic';
import type { StudyTopic } from '../../core/entities/StudyTopic';
import { NotFoundError } from '../../shared/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseTimestamp(value: Timestamp | null | undefined): Date {
  return value?.toDate() ?? new Date();
}

function sharedTopicFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): SharedTopic {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    topicId: data.topicId,
    ownerUserId: data.ownerUserId,
    sharedWithUserId: data.sharedWithUserId,
    sharedWithEmail: data.sharedWithEmail,
    permission: data.permission ?? 'edit',
    sharedAt: parseTimestamp(data.sharedAt as Timestamp),
    status: data.status ?? 'pending',
  };
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
    isShared: false,
    ownerUserId: data.ownerUserId ?? data.userId,
  };
}

// ---------------------------------------------------------------------------
// FirebaseSharingRepository
// ---------------------------------------------------------------------------

export class FirebaseSharingRepository implements ISharingRepository {
  private static readonly COLLECTION = 'sharedTopics';

  private sharedTopicsCollection() {
    return collection(db, FirebaseSharingRepository.COLLECTION);
  }

  // ---- shareTopic ----------------------------------------------------------

  async shareTopic(input: CreateSharedTopicInput): Promise<SharedTopic> {
    const id = uuidv4();
    const now = serverTimestamp();

    const docData = {
      topicId: input.topicId,
      ownerUserId: input.ownerUserId,
      sharedWithUserId: input.sharedWithUserId,
      sharedWithEmail: input.sharedWithEmail,
      permission: input.permission,
      status: 'pending',
      sharedAt: now,
    };

    const docRef = doc(this.sharedTopicsCollection(), id);
    await setDoc(docRef, docData);

    return {
      id,
      ...input,
      sharedAt: new Date(),
      status: 'pending',
    };
  }

  // ---- getPendingInvitations -----------------------------------------------

  async getPendingInvitations(email: string): Promise<SharedTopic[]> {
    const q = query(
      this.sharedTopicsCollection(),
      where('sharedWithEmail', '==', email),
      where('status', '==', 'pending'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => sharedTopicFromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  // ---- acceptInvitation ----------------------------------------------------

  async acceptInvitation(sharedId: string, userId: string): Promise<void> {
    const docRef = doc(this.sharedTopicsCollection(), sharedId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('SharedTopic', sharedId);
    }

    await updateDoc(docRef, {
      status: 'accepted',
      sharedWithUserId: userId,
    });
  }

  // ---- rejectInvitation ----------------------------------------------------

  async rejectInvitation(sharedId: string): Promise<void> {
    const docRef = doc(this.sharedTopicsCollection(), sharedId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('SharedTopic', sharedId);
    }

    await updateDoc(docRef, { status: 'rejected' });
  }

  // ---- getSharedTopics -----------------------------------------------------
  // Retorna os tópicos que foram compartilhados COM o usuário (userId)
  // e que o usuário aceitou (status === 'accepted')

  async getSharedTopics(userId: string): Promise<StudyTopic[]> {
    const q = query(
      this.sharedTopicsCollection(),
      where('sharedWithUserId', '==', userId),
      where('status', '==', 'accepted'),
    );

    const snapshot = await getDocs(q);
    const links = snapshot.docs.map((d) =>
      sharedTopicFromDoc(d as QueryDocumentSnapshot<DocumentData>),
    );

    if (links.length === 0) return [];

    // Para cada link, buscar o tópico original na collection do owner
    const topics: StudyTopic[] = [];
    const seenIds = new Set<string>();

    for (const link of links) {
      if (seenIds.has(link.topicId)) continue;
      seenIds.add(link.topicId);

      try {
        const topicDocRef = doc(db, 'users', link.ownerUserId, 'topics', link.topicId);
        const topicSnapshot = await getDoc(topicDocRef);

        if (topicSnapshot.exists()) {
          const topic = topicFromDoc(topicSnapshot as QueryDocumentSnapshot<DocumentData>);
          // Marcar como compartilhado (sobrescrevendo o userId que veio do documento)
          topic.isShared = true;
          topic.ownerUserId = link.ownerUserId;
          // O userId do documento original é o owner; para o receptor, o userId efetivo é o próprio
          topics.push(topic);
        }
      } catch {
        // Tópico original pode ter sido deletado — ignorar silenciosamente
      }
    }

    return topics;
  }

  // ---- removeShare ---------------------------------------------------------

  async removeShare(sharedId: string): Promise<void> {
    const docRef = doc(this.sharedTopicsCollection(), sharedId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new NotFoundError('SharedTopic', sharedId);
    }

    const data = snapshot.data();

    // Remover o userId do array sharedWith do tópico original
    try {
      const topicDocRef = doc(db, 'users', data.ownerUserId, 'topics', data.topicId);
      const topicSnapshot = await getDoc(topicDocRef);

      if (topicSnapshot.exists()) {
        const topicData = topicSnapshot.data();
        const currentSharedWith: string[] = topicData.sharedWith ?? [];
        const updatedSharedWith = currentSharedWith.filter(
          (uid: string) => uid !== data.sharedWithUserId,
        );

        await updateDoc(topicDocRef, { sharedWith: updatedSharedWith });
      }
    } catch {
      // Se o tópico não existir mais, apenas prosseguir com a remoção do link
    }

    // Deletar o documento de compartilhamento
    await deleteDoc(docRef);
  }

  // ---- findExistingShare ---------------------------------------------------

  async findExistingShare(topicId: string, sharedWithUserId: string): Promise<SharedTopic | null> {
    const q = query(
      this.sharedTopicsCollection(),
      where('topicId', '==', topicId),
      where('sharedWithUserId', '==', sharedWithUserId),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return sharedTopicFromDoc(docSnap as QueryDocumentSnapshot<DocumentData>);
  }

  // ---- getSharesForTopic (auxiliar para UI de gerenciamento) ----------------
  // Retorna todos os compartilhamentos de um tópico específico

  async getSharesForTopic(topicId: string): Promise<SharedTopic[]> {
    const q = query(this.sharedTopicsCollection(), where('topicId', '==', topicId));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => sharedTopicFromDoc(d as QueryDocumentSnapshot<DocumentData>));
  }

  // ---- getOwnerEmail (auxiliar para UI de convites) ------------------------
  // Busca o SharedTopic e retorna additional info

  async getSharedTopicById(sharedId: string): Promise<SharedTopic | null> {
    const docRef = doc(this.sharedTopicsCollection(), sharedId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    return sharedTopicFromDoc(snapshot as QueryDocumentSnapshot<DocumentData>);
  }
}
