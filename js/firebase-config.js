// js/firebase-config.js
// Firebase Configuration with Authentication Support

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCs31mTzhhtcBqAgMxdqL620cyEPmAJ6n8",
    authDomain: "kenzy-specs.firebaseapp.com",
    projectId: "kenzy-specs",
    storageBucket: "kenzy-specs.firebasestorage.app",
    messagingSenderId: "927450203432",
    appId: "1:927450203432:web:2b68b9706fc8ca3e8dfc1d",
    measurementId: "G-5D0HC34FT2"
};

// Initialize Firebase Services
let app;
let db;
let auth;

try {
    // Initialize Firebase App
    app = initializeApp(firebaseConfig);
    
    // Initialize Firestore Database
    db = getFirestore(app);
    
    // Initialize Firebase Authentication
    auth = getAuth(app);

    // Enable offline persistence for Firestore
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only.');
        } else if (err.code === 'unimplemented') {
            console.warn('⚠️ Browser doesn\'t support offline persistence.');
        }
    });

    console.log('✅ Firebase initialized successfully');
    console.log('✅ Authentication enabled');
    console.log('✅ Firestore database connected');
    
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    alert('Failed to connect to database. Please refresh the page.');
}

// Export Firebase services for use in other modules
export { app, db, auth };