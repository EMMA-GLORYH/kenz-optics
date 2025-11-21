// js/main.js
// Main Application Logic

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupAdminLogin();
    setupContactForm();
    setupNewsletterForm();
    setupModals();
    console.log('App initialized');
}

// Admin Login
function setupAdminLogin() {
    const adminBtn = document.getElementById('admin-login-btn');
    const modal = document.getElementById('admin-login-modal');
    const closeBtn = document.getElementById('close-admin-login');
    const form = document.getElementById('admin-login-form');
    const errorMsg = document.getElementById('login-error');

    const PASSWORD = 'admin123';

    if (!adminBtn) return;

    adminBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        document.getElementById('admin-password').value = '';
        errorMsg.textContent = '';
        document.body.style.overflow = 'hidden';
    });

    closeBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';

        await new Promise(resolve => setTimeout(resolve, 500));

        if (password === PASSWORD) {
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            sessionStorage.setItem('loginTime', new Date().toISOString());

            showNotification('✅ Login successful!', 'success');

            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            errorMsg.textContent = '❌ Incorrect password';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
            document.getElementById('admin-password').value = '';
        }
    });
}

// Contact Form
function setupContactForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('contact-status');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('contact-name')?.value.trim(),
            email: document.getElementById('contact-email')?.value.trim(),
            message: document.getElementById('contact-message')?.value.trim()
        };

        if (!data.name || !data.email || !data.message) {
            showStatus(status, '❌ Fill all fields', 'error');
            return;
        }

        if (!isValidEmail(data.email)) {
            showStatus(status, '❌ Invalid email', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '📤 Sending...';
        showStatus(status, '📤 Sending...', 'info');

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            console.log('Contact form:', data);

            showStatus(status, '✅ Message sent! We\'ll reply soon.', 'success');
            form.reset();
            showNotification('Message sent! 📧', 'success');
        } catch (error) {
            showStatus(status, '❌ Failed to send', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
}

// Newsletter
function setupNewsletterForm() {
    const form = document.getElementById('newsletter-form');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput?.value.trim();

        if (!email || !isValidEmail(email)) {
            showNotification('❌ Invalid email', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳';

        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            console.log('Newsletter:', email);
            showNotification('🎉 Subscribed successfully!', 'success');
            form.reset();
        } catch (error) {
            showNotification('❌ Subscription failed', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Subscribe';
        }
    });
}

// Modals
function setupModals() {
    window.addEventListener('click', (e) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = 'auto';
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                    modal.setAttribute('aria-hidden', 'true');
                    document.body.style.overflow = 'auto';
                }
            });
        }
    });
}

// Utilities
function showStatus(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.style.color = type === 'success' ? 'var(--success-color)' :
        type === 'error' ? 'var(--error-color)' :
            'var(--primary-color)';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

const style = document.createElement('style');
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