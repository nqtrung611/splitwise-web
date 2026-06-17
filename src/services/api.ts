import { collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile, Expense, Member } from '../types';

// Users
export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as UserProfile;
};

export const getUserById = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as UserProfile;
  return null;
};

// Members (Single Admin Ledger)
export const createMember = async (adminId: string, name: string) => {
  const docRef = await addDoc(collection(db, 'members'), {
    name,
    adminId,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const getMembers = async (adminId: string): Promise<Member[]> => {
  const q = query(collection(db, 'members'), where('adminId', '==', adminId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
};

// Expenses
export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'expenses'), {
    ...expense,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  // Simplification for MVP: Fetch expenses where the user is involved in 'splits' or is the payer
  // A robust query in Firestore would require an array of involved userIds at the root level of expense.
  // So we should structure Expense to have `involvedUsers: string[]`
  
  const q = query(collection(db, 'expenses'), where('involvedUsers', 'array-contains', userId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)).sort((a, b) => b.date - a.date);
};
