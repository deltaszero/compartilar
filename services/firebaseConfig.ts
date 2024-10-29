import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCZ0LkPH1g1IXfFNrB1mSXtlWHGp72YxMQ",
    authDomain: "compartilar-firebase-app.firebaseapp.com",
    projectId: "compartilar-firebase-app",
    storageBucket: "compartilar-firebase-app.appspot.com",
    messagingSenderId: "553179892493",
    appId: "1:553179892493:web:89a9dee151a7ca07b9be44",
    measurementId: "G-9HCWRLGCWX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };