import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDU79SJrsSSAV4v4VJ7FPnPEHziAPgllNY",
  authDomain: "budget-management-demo-app.firebaseapp.com",
  projectId: "budget-management-demo-app",
  storageBucket: "budget-management-demo-app.firebasestorage.app",
  messagingSenderId: "158260077545",
  appId: "1:158260077545:web:338933606322ae3dc32178"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
