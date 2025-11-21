// js/walkthrough.js
// First-Time User Walkthrough - Guided Tour for New Users

const walkthroughSteps = [
    {
        icon: '🛍️',
        title: 'Welcome to Kenzy Specs!',
        text: 'Discover premium spectacles crafted for timeless elegance. Let us show you around!',
        target: null
    },
    {
        icon: '🔍',
        title: 'Search & Filter',
        text: 'Use the search bar and price filters to find exactly what you\'re looking for.',
        target: '.filters'
    },
    {
        icon: '🛒',
        title: 'Shopping Cart',
        text: 'Click the cart icon to view your items and proceed to checkout.',
        target: '#cart-btn'
    },
    {
        icon: '👤',
        title: 'Your Account',
        text: 'Manage your profile, view orders, and track deliveries from your account.',
        target: '.header-actions'
    },
    {
        icon: '🎉',
        title: 'Ready to Shop!',
        text: 'You\'re all set! Start browsing our collection and find your perfect frames.',
        target: null
    }
];

let currentStep = 0;

function showWalkthrough() {
    const isFirstLogin = sessionStorage.getItem('isFirstLogin') === 'true';

    if (!isFirstLogin) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'walkthrough-overlay';
    overlay.id = 'walkthrough-overlay';

    document.body.appendChild(overlay);

    // Show first step
    displayStep(0);
    overlay.classList.add('active');
}

function displayStep(stepIndex) {
    const step = walkthroughSteps[stepIndex];
    const overlay = document.getElementById('walkthrough-overlay');

    // Remove previous content
    const existingContent = overlay.querySelector('.walkthrough-content');
    if (existingContent) {
        existingContent.remove();
    }

    // Remove previous highlight
    document.querySelectorAll('.walkthrough-highlight').forEach(el => {
        el.classList.remove('walkthrough-highlight');
    });

    // Create content
    const content = document.createElement('div');
    content.className = 'walkthrough-content';

    // Position content
    if (step.target) {
        const targetElement = document.querySelector(step.target);
        if (targetElement) {
            targetElement.classList.add('walkthrough-highlight');
            const rect = targetElement.getBoundingClientRect();

            // Position below the target element
            content.style.top = `${rect.bottom + 20}px`;

            // Center horizontally, but keep within viewport
            let leftPosition = rect.left + (rect.width / 2) - 200; // 200 is half of max-width
            leftPosition = Math.max(10, Math.min(leftPosition, window.innerWidth - 420));
            content.style.left = `${leftPosition}px`;
        }
    } else {
        // Center on screen
        content.style.top = '50%';
        content.style.left = '50%';
        content.style.transform = 'translate(-50%, -50%)';
    }

    content.innerHTML = `
        <div class="walkthrough-header">
            <h3>${step.title}</h3>
            <button class="walkthrough-close" onclick="closeWalkthrough()">×</button>
        </div>
        <div class="walkthrough-body">
            <div class="walkthrough-icon">${step.icon}</div>
            <p>${step.text}</p>
        </div>
        <div class="walkthrough-footer">
            <div class="walkthrough-dots">
                ${walkthroughSteps.map((_, i) =>
        `<div class="walkthrough-dot ${i === stepIndex ? 'active' : ''}"></div>`
    ).join('')}
            </div>
            <div class="walkthrough-buttons">
                ${stepIndex > 0 ? '<button class="walkthrough-btn skip" onclick="previousStep()">Back</button>' : ''}
                <button class="walkthrough-btn skip" onclick="closeWalkthrough()">Skip</button>
                ${stepIndex < walkthroughSteps.length - 1
            ? '<button class="walkthrough-btn next" onclick="nextStep()">Next</button>'
            : '<button class="walkthrough-btn next" onclick="finishWalkthrough()">Get Started</button>'}
            </div>
        </div>
    `;

    overlay.appendChild(content);
}

function nextStep() {
    currentStep++;
    if (currentStep < walkthroughSteps.length) {
        displayStep(currentStep);
    }
}

function previousStep() {
    currentStep--;
    if (currentStep >= 0) {
        displayStep(currentStep);
    }
}

function closeWalkthrough() {
    const overlay = document.getElementById('walkthrough-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }

    // Remove all highlights
    document.querySelectorAll('.walkthrough-highlight').forEach(el => {
        el.classList.remove('walkthrough-highlight');
    });

    // Mark walkthrough as completed
    sessionStorage.setItem('isFirstLogin', 'false');

    // Reset step counter
    currentStep = 0;
}

function finishWalkthrough() {
    closeWalkthrough();

    // Show success message
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 20px 30px;
        background: var(--success-color);
        color: white;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = '🎉 Enjoy shopping at Kenzy Specs!';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export functions to global scope for inline onclick handlers
window.nextStep = nextStep;
window.previousStep = previousStep;
window.closeWalkthrough = closeWalkthrough;
window.finishWalkthrough = finishWalkthrough;

// Export main function for module import
export { showWalkthrough };