import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

try {
  const app = initializeApp({ apiKey: "test", projectId: "test" });
  console.log("Firebase App initialized.");
  const db = getFirestore(undefined);
  console.log("Firestore initialized with undefined app successfully.");
} catch (e) {
  console.error("Firestore initialization failed:", e);
}
