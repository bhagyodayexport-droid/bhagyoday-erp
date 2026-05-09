import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCydxAvW7eoPRwXDWYtYsxDZqjryzNqYfw",
  authDomain: "gen-lang-client-0459045258.firebaseapp.com",
  projectId: "gen-lang-client-0459045258",
  storageBucket: "gen-lang-client-0459045258.firebasestorage.app",
  messagingSenderId: "881598923154",
  appId: "1:881598923154:web:63a83d1246dd426eadc14b",
  databaseURL: undefined,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-731485ae-d171-4360-8178-5dc6a7e22364");

export default app;
