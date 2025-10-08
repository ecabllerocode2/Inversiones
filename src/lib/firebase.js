// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { enableIndexedDbPersistence } from 'firebase/firestore';

try {
  enableIndexedDbPersistence(db);
} catch (err) {
  if (err.code === 'failed-precondition') {
    console.warn('Persistencia offline deshabilitada (múltiples pestañas)');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistencia no soportada en este navegador');
  }
}

// Tu configuración de Firebase (obtén esto desde Firebase Console > Configuración del proyecto > SDK web)
const firebaseConfig = {
  apiKey: "AIzaSyCrY1RF-81Eqq3qpzLvtzrjdFcj0624y68",
  authDomain: "inversiones-c4daf.firebaseapp.com",
  projectId: "inversiones-c4daf",
  storageBucket: "inversiones-c4daf.firebasestorage.app",
  messagingSenderId: "374021178961",
  appId: "1:374021178961:web:5acae928730faeef679a70",
  measurementId: "G-0GDGVVKEZH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);