import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from '../lib/firebase';
import { User, Post, Community, MarketplaceListing, Report, AuditLog } from '../types';

export const firestoreService = {
  // Sync user profile to Firestore
  async saveUser(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        ...user,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore saveUser non-blocking warning:', err);
    }
  },

  async getUser(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as User;
      }
    } catch (err) {
      console.warn('Firestore getUser error:', err);
    }
    return null;
  },

  // Posts
  async savePost(post: Post): Promise<void> {
    try {
      const postRef = doc(db, 'posts', post.id);
      await setDoc(postRef, {
        ...post,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore savePost error:', err);
    }
  },

  async deletePost(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
    } catch (err) {
      console.warn('Firestore deletePost error:', err);
    }
  },

  // Communities
  async saveCommunity(community: Community): Promise<void> {
    try {
      const comRef = doc(db, 'communities', community.id);
      await setDoc(comRef, {
        ...community,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore saveCommunity error:', err);
    }
  },

  // Listings
  async saveListing(listing: MarketplaceListing): Promise<void> {
    try {
      const listRef = doc(db, 'listings', listing.id);
      await setDoc(listRef, {
        ...listing,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore saveListing error:', err);
    }
  },

  async deleteListing(listingId: string): Promise<void> {
    try {
      const listRef = doc(db, 'listings', listingId);
      await deleteDoc(listRef);
    } catch (err) {
      console.warn('Firestore deleteListing error:', err);
    }
  },

  // Reports
  async saveReport(report: Report): Promise<void> {
    try {
      const repRef = doc(db, 'reports', report.id);
      await setDoc(repRef, {
        ...report,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore saveReport error:', err);
    }
  },

  // Audit Logs
  async saveAuditLog(log: AuditLog): Promise<void> {
    try {
      const logRef = doc(db, 'auditLogs', log.id);
      await setDoc(logRef, {
        ...log,
        createdAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore saveAuditLog error:', err);
    }
  }
};
