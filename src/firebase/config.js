// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBuNrWdR_tj4TDr7wxbVGjBQ67G4uYZzoU",
  authDomain: "mulu-c4fc4.firebaseapp.com",
  projectId: "mulu-c4fc4",
  storageBucket: "mulu-c4fc4.firebasestorage.app",
  messagingSenderId: "569141222487",
  appId: "1:569141222487:web:1a4f42c475960eef125712"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
