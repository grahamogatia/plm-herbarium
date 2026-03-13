// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFlM_zIhrr7dUOTNclB-zUUPuohXs-Gjg",
  authDomain: "plm-herbarium.firebaseapp.com",
  projectId: "plm-herbarium",
  storageBucket: "plm-herbarium.firebasestorage.app",
  messagingSenderId: "525942186514",
  appId: "1:525942186514:web:a4ba08f3389d30b534eecb",
  measurementId: "G-2521QGC5Z1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
