import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Thay thế thông tin này bằng cấu hình Firebase của bạn
// Bạn có thể lấy thông tin này trong Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
  apiKey: "AIzaSyAZH7ogjfwVRxDB9-5fk4Y_a7XfWKr6ZE4",
  authDomain: "splitwise-d6959.firebaseapp.com",
  projectId: "splitwise-d6959",
  storageBucket: "splitwise-d6959.firebasestorage.app",
  messagingSenderId: "479584441684",
  appId: "1:479584441684:web:cd88ba10018b1ee76aa4c1",
  measurementId: "G-GH7F7H0VZB",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
