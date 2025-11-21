// js/product-list.js
// Professional Product Management with Enhanced Features

import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from './firebase-config.js';

// Global State
let products = [];
let cart = JSON.parse(localStorage.getItem('kenzyCart')) || [];
let isLoading = false;

// DOM Cache
const DOM = {};

// Initialize
document.addEventListener('DOMContentLoaded', initializeShop);

function initializeShop() {
    cacheDOMElements();
    setupEventListeners();
    loadProducts();
    updateCartCount();
}

function cacheDOMElements() {
    DOM.productList = document.getElementById('product-list');
    DOM.searchInput = document.getElementById('search');
    DOM.priceFilter = document.getElementById('price-filter');
    DOM.loadingIndicator = document.getElementById('loading-indicator');
    DOM.cartBtn = document.getElementById('cart-btn');
    DOM.cartModal = document.getElementById('cart-modal');
    DOM.closeCart = document.getElementById('close-cart');
    DOM.cartItemsContainer = document.getElementById('cart-items');
    DOM.cartTotalElement = document.getElementById('cart-total');
    DOM.cartCountElement = document.getElementById('cart-count');
    DOM.productModal = document.getElementById('product-modal');
    DOM.closeModal = document.getElementById('close-modal');
    DOM.modalDetails = document.getElementById('modal-details');
    DOM.checkoutBtn = document.getElementById('checkout-btn');
}

function setupEventListeners() {
    // Debounced search
    let searchTimeout;
    DOM.searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndDisplayProducts, 300);
    });

    DOM.priceFilter?.addEventListener('change', filterAndDisplayProducts);
    DOM.cartBtn?.addEventListener('click', openCartModal);
    DOM.closeCart?.addEventListener('click', closeCartModal);
    DOM.closeModal?.addEventListener('click', closeProductModal);
    DOM.checkoutBtn?.addEventListener('click', handleCheckout);

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === DOM.cartModal) closeCartModal();
        if (e.target === DOM.productModal) closeProductModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCartModal();
            closeProductModal();
        }
    });
}

// Cart Functions
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (DOM.cartCountElement) {
        DOM.cartCountElement.textContent = count;
        // Animate count
        DOM.cartCountElement.style.transform = 'scale(1.3)';
        setTimeout(() => {
            DOM.cartCountElement.style.transform = 'scale(1)';
        }, 200);
    }
}

function saveCart() {
    try {
        localStorage.setItem('kenzyCart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
    } catch (error) {
        console.error('Error saving cart:', error);
        showNotification('Cart save failed', 'error');
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    saveCart();
    showNotification(`✓ ${product.name} added to cart!`, 'success');
}

function updateItemQuantity(e) {
    const id = e.target.dataset.id;
    let newQuantity = parseInt(e.target.value, 10);

    if (isNaN(newQuantity) || newQuantity < 1) {
        newQuantity = 1;
        e.target.value = 1;
    }

    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
    }
}

function removeItem(e) {
    const id = e.target.dataset.id;
    const item = cart.find(i => i.id === id);

    if (item) {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            deleteItem(e);
        } else {
            saveCart();
        }
    }
}

function deleteItem(e) {
    const id = e.target.dataset.id;
    const item = cart.find(i => i.id === id);

    if (item && confirm(`Remove ${item.name} from cart?`)) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        showNotification('Item removed', 'success');
    }
}

// Product Loading
async function loadProducts() {
    if (isLoading) return;

    isLoading = true;
    DOM.loadingIndicator.style.display = 'block';

    try {
        const q = query(collection(db, 'spectacles'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        products = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (products.length === 0) {
            DOM.productList.innerHTML = '<div class="loading">No products available. Check back soon!</div>';
        } else {
            filterAndDisplayProducts();
        }

        console.log(`✅ Loaded ${products.length} products`);
    } catch (error) {
        console.error('Error loading products:', error);
        DOM.productList.innerHTML = '<p class="error-msg" style="text-align:center; padding: 60px; font-size: 1.2rem;">⚠️ Unable to load products. Please check your connection.</p>';
        showNotification('Failed to load products', 'error');
    } finally {
        isLoading = false;
        DOM.loadingIndicator.style.display = 'none';
    }
}

function createProductCard(product) {
    const description = product.description
        ? (product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description)
        : 'Premium quality spectacles designed for style and comfort.';

    return `
        <div class="card" data-product-id="${product.id}" tabindex="0" role="article">
            <img src="${product.image}" 
                 alt="${product.name}" 
                 loading="lazy" 
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2220%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            <h3>${product.name}</h3>
            <p class="price">GHS ${parseFloat(product.price).toFixed(2)}</p>
            <p>${description}</p>
            <button data-product-id="${product.id}">Add to Cart</button>
        </div>
    `;
}

function displayProducts(items) {
    if (items.length === 0) {
        DOM.productList.innerHTML = '<div class="loading">No products match your criteria.</div>';
        return;
    }

    DOM.productList.innerHTML = items.map(createProductCard).join('');
    attachProductListeners();
}

function attachProductListeners() {
    DOM.productList.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', handleCardClick);
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(e);
            }
        });

        const button = card.querySelector('button');
        if (button) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                addToCart(button.dataset.productId);
            });
        }
    });
}

function filterAndDisplayProducts() {
    const query = DOM.searchInput.value.toLowerCase().trim();
    const priceRange = DOM.priceFilter.value;

    const filtered = products.filter(product => {
        const matchesSearch = !query ||
            product.name.toLowerCase().includes(query) ||
            (product.description && product.description.toLowerCase().includes(query));

        let matchesPrice = true;
        const price = parseFloat(product.price);

        if (priceRange) {
            switch (priceRange) {
                case '0-100':
                    matchesPrice = price <= 100;
                    break;
                case '100-200':
                    matchesPrice = price > 100 && price <= 200;
                    break;
                case '200+':
                    matchesPrice = price > 200;
                    break;
            }
        }

        return matchesSearch && matchesPrice;
    });

    displayProducts(filtered);
}

// Modal Functions
function openCartModal() {
    DOM.cartModal.style.display = 'block';
    DOM.cartModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderCart();
}

function closeCartModal() {
    DOM.cartModal.style.display = 'none';
    DOM.cartModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
}

function closeProductModal() {
    DOM.productModal.style.display = 'none';
    DOM.productModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
}

function handleCardClick(event) {
    const card = event.currentTarget;
    const productId = card.dataset.productId;
    const product = products.find(p => p.id === productId);

    if (product) {
        renderProductModal(product);
    }
}

function renderProductModal(product) {
    const description = product.description || 'Premium quality spectacles with elegant design.';

    DOM.modalDetails.innerHTML = `
        <img src="${product.image}" 
             alt="${product.name}" 
             class="modal-product-image"
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2220%22%3ENo Image%3C/text%3E%3C/svg%3E'">
        <h3 id="modal-title">${product.name}</h3>
        <p style="font-size: 1.8rem; font-weight: 700; color: var(--secondary-color); margin: 20px 0;">
            GHS ${parseFloat(product.price).toFixed(2)}
        </p>
        <p style="text-align: left; line-height: 1.8; color: var(--text-secondary);">${description}</p>
        <button class="btn-primary" data-product-id="${product.id}" style="margin-top: 24px; width: 100%;">
            Add to Cart
        </button>
    `;

    DOM.modalDetails.querySelector('.btn-primary').addEventListener('click', () => {
        addToCart(product.id);
        closeProductModal();
    });

    DOM.productModal.style.display = 'block';
    DOM.productModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function renderCart() {
    if (cart.length === 0) {
        DOM.cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p style="font-size: 1.2rem; margin-bottom: 10px;">🛒 Your cart is empty</p>
                <p>Add some stylish spectacles!</p>
            </div>
        `;
        DOM.cartTotalElement.textContent = 'Total: GHS 0.00';
        return;
    }

    let total = 0;
    DOM.cartItemsContainer.innerHTML = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return `
            <div class="cart-item">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>GHS ${parseFloat(item.price).toFixed(2)} × ${item.quantity} = GHS ${subtotal.toFixed(2)}</p>
                </div>
                <div class="item-actions">
                    <input type="number" class="quantity-input" data-id="${item.id}" value="${item.quantity}" min="1" max="99">
                    <button class="btn-secondary" data-action="remove" data-id="${item.id}" style="padding: 8px 16px;">−</button>
                    <button class="btn-secondary" data-action="delete" data-id="${item.id}" style="background: var(--error-color); padding: 8px 16px;">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    DOM.cartTotalElement.textContent = `Total: GHS ${total.toFixed(2)}`;

    // Attach listeners
    DOM.cartItemsContainer.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', updateItemQuantity);
    });

    DOM.cartItemsContainer.querySelectorAll('[data-action="remove"]').forEach(button => {
        button.addEventListener('click', removeItem);
    });

    DOM.cartItemsContainer.querySelectorAll('[data-action="delete"]').forEach(button => {
        button.addEventListener('click', deleteItem);
    });
}

function handleCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (confirm(`Proceed to checkout?\n\nTotal: GHS ${total.toFixed(2)}\n\nThis will redirect to payment processing.`)) {
        showNotification('Redirecting to checkout...', 'success');

        setTimeout(() => {
            alert('Thank you for your order! 🎉\n\nOrder confirmation will be sent to your email.\n\n(Demo mode - integrate payment gateway for production)');
            cart = [];
            saveCart();
            closeCartModal();
        }, 1500);
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--primary-color)'};
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
    }, 3000);
}

// Animation CSS
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

// Export
window.kenzyShop = { loadProducts, cart, addToCart };
        