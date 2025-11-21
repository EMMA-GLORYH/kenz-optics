// js/login.js
// User Login with Firebase Authentication

import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

const loadingOverlay = document.getElementById('loading-overlay');

function showLoading() {
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

// Password Toggle
document.getElementById('toggle-password')?.addEventListener('click', function () {
    const passwordInput = document.getElementById('password');
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    this.textContent = passwordInput.type === 'password' ? '👁️' : '🙈';
});

// Form Submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    if (!email || !password) {
        alert('Please enter your email and password');
        return;
    }

    showLoading();

    try {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        console.log('✅ User logged in:', user.uid);

        // Store user data
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('userId', user.uid);
        sessionStorage.setItem('userName', userData.fullname);
        sessionStorage.setItem('isFirstLogin', userData.isFirstLogin ? 'true' : 'false');

        if (rememberMe) {
            localStorage.setItem('userEmail', email);
        }

        // Update isFirstLogin to false
        if (userData.isFirstLogin) {
            await updateDoc(doc(db, 'users', user.uid), {
                isFirstLogin: false
            });
        }

        hideLoading();

        alert(`Welcome back, ${userData.fullname}!`);
        window.location.href = 'index.html';

    } catch (error) {
        hideLoading();
        console.error('Login error:', error);

        let errorMessage = 'Login failed. ';

        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/invalid-credential':
                errorMessage += 'Invalid credentials.';
                break;
            default:
                errorMessage += error.message;
        }

        alert(errorMessage);
    }
});

// Pre-fill email if remembered
window.addEventListener('DOMContentLoaded', () => {
    const rememberedEmail = localStorage.getItem('userEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('remember-me').checked = true;
    }
});