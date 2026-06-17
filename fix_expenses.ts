import { db } from './src/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

async function fixExpenses() {
  const snapshot = await getDocs(collection(db, 'expenses'));
  let fixed = 0;
  for (const expenseDoc of snapshot.docs) {
    const data = expenseDoc.data();
    if (data.createdBy && (!data.involvedUsers || !data.involvedUsers.includes(data.createdBy))) {
      const newInvolved = Array.from(new Set([...(data.involvedUsers || []), data.createdBy]));
      await updateDoc(doc(db, 'expenses', expenseDoc.id), {
        involvedUsers: newInvolved
      });
      fixed++;
    }
  }
  console.log(`Fixed ${fixed} expenses.`);
  process.exit(0);
}

fixExpenses().catch(console.error);
