export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
}

export interface Member {
  id: string;
  name: string;
  adminId: string;
  createdAt: number;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  splits: ExpenseSplit[];
  involvedUsers: string[]; // For easy querying in Firestore
  createdBy: string;
  createdAt: number;
  date: number;
  isSettleUp?: boolean;
}
