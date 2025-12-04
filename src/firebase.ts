import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXkOdp_qnAt-nXfxsPvcaBKbJtimwfLWY",
  authDomain: "kids-school-57af5.firebaseapp.com",
  projectId: "kids-school-57af5",
  storageBucket: "kids-school-57af5.firebasestorage.app",
  messagingSenderId: "1011553264786",
  appId: "1:1011553264786:web:53edfe9524ee7bd595b24b",
  measurementId: "G-RS71KPSSMX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

