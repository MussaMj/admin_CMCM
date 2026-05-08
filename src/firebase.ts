import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyC2VqEh3MY65CEQxOCkzLNQ0aRySzIGY5I",
    authDomain: "ipam-system-mussajunior.firebaseapp.com",
    projectId: "ipam-system-mussajunior",
    storageBucket: "ipam-system-mussajunior.appspot.com",
    messagingSenderId: "914621674266",
    appId: "1:914621674266:web:c6c7af3bd16fc214b7b2a3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
