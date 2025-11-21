// js/signup.js
// User Signup with Firebase Authentication

import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

const loadingOverlay = document.getElementById('loading-overlay');
const signupBtn = document.getElementById('signup-btn');

function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('active');
    if (signupBtn) {
        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating Account...';
    }
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('active');
    if (signupBtn) {
        signupBtn.disabled = false;
        signupBtn.textContent = 'Create Account';
    }
}

// Wait for Firebase to be fully loaded
function waitForAuth() {
    return new Promise((resolve) => {
        if (auth) {
            resolve(auth);
        } else {
            setTimeout(() => resolve(waitForAuth()), 100);
        }
    });
}

// Password Toggle
document.getElementById('toggle-password')?.addEventListener('click', function () {
    const passwordInput = document.getElementById('password');
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    this.textContent = passwordInput.type === 'password' ? '👁️' : '🙈';
});

document.getElementById('toggle-confirm-password')?.addEventListener('click', function () {
    const confirmPasswordInput = document.getElementById('confirm-password');
    confirmPasswordInput.type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
    this.textContent = confirmPasswordInput.type === 'password' ? '👁️' : '🙈';
});

// Field Validation
function validateField(fieldId, validationFn, errorMsg) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);

    if (!field || !error) return;

    field.addEventListener('blur', () => {
        if (!validationFn(field.value)) {
            error.textContent = errorMsg;
            field.style.borderColor = '#f44336';
        } else {
            error.textContent = '';
            field.style.borderColor = '#4caf50';
        }
    });

    field.addEventListener('input', () => {
        if (error.textContent && validationFn(field.value)) {
            error.textContent = '';
            field.style.borderColor = '#4caf50';
        }
    });
}

// Validation Rules
validateField('fullname', val => val.trim().length >= 3, 'Name must be at least 3 characters');
validateField('email', val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Invalid email address');
validateField('phone', val => /^[\d\s\+\-\(\)]{10,}$/.test(val), 'Invalid phone number (min 10 digits)');
validateField('address', val => val.trim().length >= 10, 'Address must be at least 10 characters');
validateField('password', val => val.length >= 6, 'Password must be at least 6 characters');

// Confirm Password Validation
const confirmPasswordField = document.getElementById('confirm-password');
if (confirmPasswordField) {
    confirmPasswordField.addEventListener('blur', function () {
        const password = document.getElementById('password').value;
        const confirmPassword = this.value;
        const error = document.getElementById('confirm-password-error');

        if (password !== confirmPassword) {
            error.textContent = 'Passwords do not match';
            this.style.borderColor = '#f44336';
        } else {
            error.textContent = '';
            this.style.borderColor = '#4caf50';
        }
    });
}

// Form Submission
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const terms = document.getElementById('terms').checked;

    // Clear previous errors
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');

    // Validation
    let hasError = false;

    if (fullname.length < 3) {
        document.getElementById('fullname-error').textContent = 'Name must be at least 3 characters';
        hasError = true;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('email-error').textContent = 'Invalid email address';
        hasError = true;
    }

    if (!/^[\d\s\+\-\(\)]{10,}$/.test(phone)) {
        document.getElementById('phone-error').textContent = 'Invalid phone number';
        hasError = true;
    }

    if (address.length < 10) {
        document.getElementById('address-error').textContent = 'Address must be at least 10 characters';
        hasError = true;
    }

    if (password.length < 6) {
        document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
        hasError = true;
    }

    if (password !== confirmPassword) {
        document.getElementById('confirm-password-error').textContent = 'Passwords do not match';
        hasError = true;
    }

    if (!terms) {
        alert('Please accept the terms and conditions');
        return;
    }

    if (hasError) {
        alert('Please fix the errors in the form');
        return;
    }

    showLoading();

    try {
        // Ensure auth is ready
        await waitForAuth();

        console.log('Creating user account...');

        // Create Firebase Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('✅ User created:', user.uid);

        // Update user profile with display name
        await updateProfile(user, {
            displayName: fullname
        });

        // Save additional user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            fullname: fullname,
            email: email,
            phone: phone,
            address: address,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isFirstLogin: true,
            role: 'customer'
        });

        console.log('✅ User data saved to Firestore');

        // Store session data
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('userId', user.uid);
        sessionStorage.setItem('userName', fullname);
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('isFirstLogin', 'true');

        hideLoading();

        // Success message
        alert('🎉 Account created successfully!\n\nWelcome to Kenzy Specs Shop!');

        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        hideLoading();
        console.error('❌ Signup error:', error);

        let errorMessage = 'Failed to create account. ';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = '⚠️ This email is already registered. Please login instead.';
                document.getElementById('email-error').textContent = 'Email already in use';
                break;
            case 'auth/invalid-email':
                errorMessage = '⚠️ Invalid email address format.';
                document.getElementById('email-error').textContent = 'Invalid email format';
                break;
            case 'auth/weak-password':
                errorMessage = '⚠️ Password is too weak. Please use at least 6 characters.';
                document.getElementById('password-error').textContent = 'Password too weak';
                break;
            case 'auth/network-request-failed':
                errorMessage = '⚠️ Network error. Please check your internet connection.';
                break;
            case 'auth/configuration-not-found':
                errorMessage = '⚠️ Authentication not configured. Please enable Email/Password authentication in Firebase Console.';
                break;
            default:
                errorMessage = `⚠️ Error: ${error.message}`;
        }

        alert(errorMessage);
    }
});

console.log('✅ Signup page initialized');