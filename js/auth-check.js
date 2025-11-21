// js/auth-check.js
// Check if user is logged in and show appropriate prompts

import { showWalkthrough } from './walkthrough.js';

const loadingOverlay = document.getElementById('loading-overlay');
const authCheckModal = document.getElementById('auth-check-modal');

function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

function checkAuthentication() {
    showLoading();

    const userLoggedIn = sessionStorage.getItem('userLoggedIn');
    const userName = sessionStorage.getItem('userName');
    const hasSeenAuthPrompt = sessionStorage.getItem('hasSeenAuthPrompt');
    const guestMode = sessionStorage.getItem('guestMode');

    // Simulate loading delay for better UX
    setTimeout(() => {
        hideLoading();

        if (userLoggedIn === 'true') {
            console.log('✅ User is logged in:', userName);

            // Show welcome notification
            showNotification(`Welcome back, ${userName}! 👋`, 'success');

            // Show walkthrough for first-time users
            const isFirstLogin = sessionStorage.getItem('isFirstLogin') === 'true';
            if (isFirstLogin) {
                setTimeout(() => {
                    showWalkthrough();
                }, 1000);
            }
        } else if (!hasSeenAuthPrompt && guestMode !== 'true') {
            // Show auth prompt for new visitors who haven't chosen guest mode
            setTimeout(() => {
                if (authCheckModal) {
                    authCheckModal.style.display = 'block';
                    authCheckModal.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                }
            }, 1500);

            sessionStorage.setItem('hasSeenAuthPrompt', 'true');
        } else if (guestMode === 'true') {
            console.log('👤 Continuing as guest');
            showNotification('Browsing as guest', 'info');
        }
    }, 1000);
}

// Continue as guest function
window.continueAsGuest = function () {
    if (authCheckModal) {
        authCheckModal.style.display = 'none';
        authCheckModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
    }

    sessionStorage.setItem('guestMode', 'true');
    showNotification('Continuing as guest. You can sign up anytime!', 'info');
};

// Notification helper
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'var(--success-color)' :
            type === 'error' ? 'var(--error-color)' :
                'var(--primary-color)'};
        color: white;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
        max-width: 350px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add animation styles if not already present
if (!document.getElementById('notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all elements are loaded
    setTimeout(checkAuthentication, 100);
});

// Close auth modal when clicking outside
window.addEventListener('click', (e) => {
    if (authCheckModal && e.target === authCheckModal) {
        authCheckModal.style.display = 'none';
        authCheckModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
        sessionStorage.setItem('guestMode', 'true');
    }
});

// Close auth modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authCheckModal && authCheckModal.style.display === 'block') {
        authCheckModal.style.display = 'none';
        authCheckModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
        sessionStorage.setItem('guestMode', 'true');
    }
});