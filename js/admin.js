// js/admin.js
// Professional Admin Panel with Complete CRUD Operations

import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from './firebase-config.js';

// ==================== GLOBAL STATE ====================
let allProducts = [];
let filteredProducts = [];
let currentEditId = null;

// ==================== AUTHENTICATION CHECK ====================
function checkAuth() {
    const isAuth = sessionStorage.getItem('isAdminLoggedIn');
    if (!isAuth) {
        alert('⚠️ Unauthorized Access\n\nPlease login as admin from the main page.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ==================== LOADING OVERLAY ====================
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('active');
}

// ==================== SECTION SWITCHING ====================
window.switchSection = function (sectionId) {
    showLoading();

    setTimeout(() => {
        // Hide all sections
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active from all tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Activate corresponding tab
        const targetTab = document.querySelector(`[data-section="${sectionId}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Load data if needed
        if (sectionId === 'dashboard') {
            updateDashboard();
        } else if (sectionId === 'manage-products') {
            loadProductsForManagement();
        }

        hideLoading();
    }, 500);
};

// ==================== DASHBOARD STATISTICS ====================
async function updateDashboard() {
    try {
        const querySnapshot = await getDocs(collection(db, 'spectacles'));
        allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const total = allProducts.length;
        const inStock = allProducts.filter(p => p.stock > 0 && p.active !== false).length;
        const lowStock = allProducts.filter(p => p.stock > 0 && p.stock < 10).length;
        const outOfStock = allProducts.filter(p => p.stock === 0).length;
        const inactive = allProducts.filter(p => p.active === false).length;

        document.getElementById('total-products').textContent = total;
        document.getElementById('in-stock').textContent = inStock;
        document.getElementById('low-stock').textContent = lowStock;
        document.getElementById('out-of-stock').textContent = outOfStock;
        document.getElementById('inactive-products').textContent = inactive;

        console.log('✅ Dashboard updated:', { total, inStock, lowStock, outOfStock, inactive });
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
    }
}

// ==================== IMAGE PREVIEW ====================
function createImagePreview(imageUrl, containerElement) {
    // Find the proper container (the parent form-group div)
    let container = containerElement;
    if (containerElement.tagName === 'INPUT') {
        container = containerElement.closest('.form-group') || containerElement.parentElement;
    }

    if (!container) return;

    // Remove existing preview
    const existingPreview = container.querySelector('.image-preview-box');
    if (existingPreview) existingPreview.remove();

    if (!imageUrl) return;

    // Validate URL format
    try {
        new URL(imageUrl);
    } catch {
        return;
    }

    // Create preview container
    const previewBox = document.createElement('div');
    previewBox.className = 'image-preview-box';
    previewBox.style.cssText = `
        margin-top: 15px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 12px;
        border: 2px dashed #e2e8f0;
        text-align: center;
        transition: all 0.3s ease;
    `;

    // Create loading indicator
    const loadingText = document.createElement('p');
    loadingText.textContent = '⏳ Loading image preview...';
    loadingText.style.cssText = 'color: #64748b; margin: 10px 0; font-size: 0.95rem; font-weight: 500;';
    previewBox.appendChild(loadingText);

    // Create image element
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Product Preview';
    img.style.cssText = `
        max-width: 100%;
        max-height: 350px;
        border-radius: 12px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        display: none;
        margin: 0 auto;
        object-fit: contain;
    `;

    img.onload = function () {
        loadingText.remove();
        img.style.display = 'block';

        // Add success message
        const successMsg = document.createElement('p');
        successMsg.innerHTML = '✅ <strong>Image loaded successfully!</strong>';
        successMsg.style.cssText = `
            color: #4caf50;
            margin-top: 15px;
            font-weight: 600;
            font-size: 0.95rem;
            animation: fadeIn 0.3s ease;
        `;
        previewBox.appendChild(successMsg);

        // Add image dimensions info
        const dimensions = document.createElement('p');
        dimensions.textContent = `📐 Dimensions: ${img.naturalWidth} × ${img.naturalHeight}px`;
        dimensions.style.cssText = 'color: #64748b; font-size: 0.85rem; margin-top: 8px;';
        previewBox.appendChild(dimensions);

        // Add file size estimate
        const sizeEstimate = document.createElement('p');
        const estimatedSize = ((img.naturalWidth * img.naturalHeight * 3) / 1024).toFixed(0);
        sizeEstimate.textContent = `💾 Estimated size: ~${estimatedSize}KB`;
        sizeEstimate.style.cssText = 'color: #64748b; font-size: 0.85rem; margin-top: 5px;';
        previewBox.appendChild(sizeEstimate);

        // Add glow effect to container
        previewBox.style.border = '2px solid #4caf50';
        previewBox.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.2)';
        previewBox.style.background = 'linear-gradient(135deg, #f0fdf4, #dcfce7)';
    };

    img.onerror = function () {
        loadingText.textContent = '⚠️ Failed to load image';
        loadingText.style.color = '#f44336';

        const errorMsg = document.createElement('p');
        errorMsg.innerHTML = '❌ <strong>Invalid image URL or image not accessible</strong>';
        errorMsg.style.cssText = `
            color: #f44336;
            margin-top: 10px;
            font-size: 0.9rem;
            font-weight: 600;
        `;
        previewBox.appendChild(errorMsg);

        const errorHint = document.createElement('p');
        errorHint.textContent = 'Please check the URL and try again';
        errorHint.style.cssText = 'color: #666; font-size: 0.85rem; margin-top: 8px;';
        previewBox.appendChild(errorHint);

        previewBox.style.border = '2px dashed #f44336';
        previewBox.style.background = '#ffebee';
    };

    previewBox.appendChild(img);
    container.appendChild(previewBox);
}

// ==================== FORM VALIDATION ====================
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.fields = {
            name: this.form?.querySelector('#name') || this.form?.querySelector('#edit-name'),
            price: this.form?.querySelector('#price') || this.form?.querySelector('#edit-price'),
            stock: this.form?.querySelector('#stock') || this.form?.querySelector('#edit-stock'),
            image: this.form?.querySelector('#image') || this.form?.querySelector('#edit-image'),
            category: this.form?.querySelector('#category') || this.form?.querySelector('#edit-category')
        };
    }

    validateField(fieldName) {
        const field = this.fields[fieldName];
        if (!field) return true;

        const value = field.value.trim();
        const errorEl = document.getElementById(`${field.id}-error`);

        if (errorEl) errorEl.textContent = '';
        field.style.borderColor = '';

        switch (fieldName) {
            case 'name':
                if (!value || value.length < 3) {
                    if (errorEl) errorEl.textContent = 'Name must be at least 3 characters';
                    field.style.borderColor = '#f44336';
                    return false;
                }
                field.style.borderColor = '#4caf50';
                return true;

            case 'price':
                const price = parseFloat(value);
                if (!value || isNaN(price) || price <= 0) {
                    if (errorEl) errorEl.textContent = 'Valid price required';
                    field.style.borderColor = '#f44336';
                    return false;
                }
                field.style.borderColor = '#4caf50';
                return true;

            case 'stock':
                const stock = parseInt(value);
                if (value === '' || isNaN(stock) || stock < 0) {
                    if (errorEl) errorEl.textContent = 'Valid stock quantity required';
                    field.style.borderColor = '#f44336';
                    return false;
                }
                field.style.borderColor = stock === 0 ? '#f44336' : stock < 10 ? '#ff9800' : '#4caf50';
                return true;

            case 'image':
                if (!value) {
                    if (errorEl) errorEl.textContent = 'Image URL required';
                    field.style.borderColor = '#f44336';
                    return false;
                }
                try {
                    new URL(value);
                    field.style.borderColor = '#4caf50';
                    return true;
                } catch {
                    if (errorEl) errorEl.textContent = 'Invalid URL';
                    field.style.borderColor = '#f44336';
                    return false;
                }

            case 'category':
                if (!value) {
                    if (errorEl) errorEl.textContent = 'Please select a category';
                    field.style.borderColor = '#f44336';
                    return false;
                }
                field.style.borderColor = '#4caf50';
                return true;

            default:
                return true;
        }
    }

    validateAll() {
        const results = Object.keys(this.fields)
            .filter(key => this.fields[key])
            .map(key => this.validateField(key));
        return results.every(result => result === true);
    }
}

// ==================== ADD PRODUCT ====================
class ProductFormManager {
    constructor() {
        this.form = document.getElementById('addProductForm');
        if (!this.form) return;

        this.validator = new FormValidator('addProductForm');
        this.statusMsg = document.getElementById('statusMsg');
        this.submitBtn = document.getElementById('submit-btn');

        this.init();
    }

    init() {
        // Set default values
        const priceField = document.getElementById('price');
        const stockField = document.getElementById('stock');
        if (priceField) priceField.value = '0.01';
        if (stockField) stockField.value = '1';

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Add real-time validation
        ['name', 'price', 'stock', 'image', 'category'].forEach(fieldName => {
            const field = this.validator.fields[fieldName];
            if (field) {
                field.addEventListener('blur', () => this.validator.validateField(fieldName));
            }
        });

        // Add image preview functionality
        const imageField = document.getElementById('image');
        if (imageField) {
            // Preview on paste
            imageField.addEventListener('paste', (e) => {
                setTimeout(() => {
                    const imageUrl = imageField.value.trim();
                    if (imageUrl) {
                        createImagePreview(imageUrl, imageField);
                    }
                }, 100);
            });

            // Preview on input (typing or pasting)
            let previewTimeout;
            imageField.addEventListener('input', () => {
                clearTimeout(previewTimeout);
                const imageUrl = imageField.value.trim();

                // Clear preview if field is empty
                if (!imageUrl) {
                    const existingPreview = imageField.closest('.form-group')?.querySelector('.image-preview-box');
                    if (existingPreview) existingPreview.remove();
                    return;
                }

                previewTimeout = setTimeout(() => {
                    createImagePreview(imageUrl, imageField);
                }, 800); // Wait 800ms after user stops typing
            });

            // Preview on blur (when field loses focus)
            imageField.addEventListener('blur', () => {
                const imageUrl = imageField.value.trim();
                if (imageUrl) {
                    createImagePreview(imageUrl, imageField);
                }
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validator.validateAll()) {
            this.showStatus('❌ Please fix the errors in the form', 'error');
            return;
        }

        this.setLoading(true);
        this.showStatus('📤 Saving product to database...');

        try {
            const stockQty = parseInt(document.getElementById('stock').value);
            const categoryValue = document.getElementById('category').value;

            const productData = {
                name: document.getElementById('name').value.trim(),
                price: parseFloat(document.getElementById('price').value),
                stock: stockQty,
                stockStatus: stockQty > 0 ? 'In Stock' : 'Out of Stock',
                image: document.getElementById('image').value.trim(),
                category: categoryValue || 'Uncategorized',
                description: document.getElementById('description')?.value.trim() || 'Premium quality spectacles.',
                active: true,
                featured: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'spectacles'), productData);

            console.log('✅ Product added:', docRef.id);

            this.showStatus(`✅ Product "${productData.name}" added successfully!`, 'success');
            this.reset();
            updateDashboard();

        } catch (error) {
            console.error('❌ Error adding product:', error);
            this.showStatus(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    showStatus(message, type = 'info') {
        if (!this.statusMsg) return;
        this.statusMsg.textContent = message;
        this.statusMsg.style.color = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#0a4b78';
        if (type === 'success') {
            setTimeout(() => this.statusMsg.textContent = '', 5000);
        }
    }

    setLoading(loading) {
        if (this.submitBtn) {
            this.submitBtn.disabled = loading;
            this.submitBtn.textContent = loading ? '⏳ Saving...' : '💾 Save Product';
        }
    }

    reset() {
        this.form.reset();
        const priceField = document.getElementById('price');
        const stockField = document.getElementById('stock');
        if (priceField) priceField.value = '0.01';
        if (stockField) stockField.value = '1';

        Object.values(this.validator.fields).forEach(field => {
            if (field) field.style.borderColor = '';
        });

        document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');

        // Remove image preview
        document.querySelectorAll('.image-preview-box').forEach(el => el.remove());
    }
}

// ==================== LOAD & DISPLAY PRODUCTS ====================
async function loadProductsForManagement() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '<p style="text-align: center; padding: 40px;">Loading products...</p>';

    try {
        const q = query(collection(db, 'spectacles'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        filteredProducts = [...allProducts];

        renderProductsTable(filteredProducts);

    } catch (error) {
        console.error('❌ Error loading products:', error);
        productsList.innerHTML = '<div class="no-products"><div class="no-products-icon">❌</div><p>Error loading products</p></div>';
    }
}

function renderProductsTable(products) {
    const productsList = document.getElementById('productsList');

    if (products.length === 0) {
        productsList.innerHTML = `
            <div class="no-products">
                <div class="no-products-icon">📦</div>
                <h3>No Products Found</h3>
                <p>Start by adding your first product!</p>
                <button class="action-btn" onclick="switchSection('add-product')" style="margin-top: 20px;">➕ Add Product</button>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <table class="products-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => {
        const stock = product.stock || 0;
        const isActive = product.active !== false;

        let stockBadge = '';
        if (stock === 0) {
            stockBadge = '<span class="stock-badge stock-out">Out of Stock</span>';
        } else if (stock < 10) {
            stockBadge = `<span class="stock-badge stock-low">Low (${stock})</span>`;
        } else {
            stockBadge = `<span class="stock-badge stock-in">In Stock (${stock})</span>`;
        }

        const statusBadge = isActive
            ? '<span class="status-badge status-active">Active</span>'
            : '<span class="status-badge status-inactive">Inactive</span>';

        return `
                        <tr>
                            <td><img src="${product.image}" alt="${product.name}" class="product-img" onerror="this.src='https://via.placeholder.com/60?text=No+Image'"></td>
                            <td><strong>${product.name}</strong></td>
                            <td>${product.category || 'N/A'}</td>
                            <td style="font-weight: 600; color: var(--secondary-color);">GHS ${product.price.toFixed(2)}</td>
                            <td>${stockBadge}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="btn-icon btn-edit" onclick="openEditModal('${product.id}')" title="Edit">✏️</button>
                                    <button class="btn-icon btn-toggle" onclick="toggleProductStatus('${product.id}', ${isActive})" title="${isActive ? 'Deactivate' : 'Activate'}">${isActive ? '🔒' : '🔓'}</button>
                                    <button class="btn-icon btn-delete" onclick="deleteProduct('${product.id}', '${product.name.replace(/'/g, "\\'")}')" title="Delete">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    productsList.innerHTML = tableHTML;
}

// ==================== SEARCH & FILTER ====================
function setupFilters() {
    const searchInput = document.getElementById('searchProducts');
    const categoryFilter = document.getElementById('filterCategory');
    const statusFilter = document.getElementById('filterStatus');

    function applyFilters() {
        let filtered = [...allProducts];

        // Search filter
        const searchTerm = searchInput?.value.toLowerCase() || '';
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                (p.category || '').toLowerCase().includes(searchTerm) ||
                (p.description || '').toLowerCase().includes(searchTerm)
            );
        }

        // Category filter
        const selectedCategory = categoryFilter?.value || '';
        if (selectedCategory) {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        // Status filter
        const selectedStatus = statusFilter?.value || '';
        if (selectedStatus === 'active') {
            filtered = filtered.filter(p => p.active !== false);
        } else if (selectedStatus === 'inactive') {
            filtered = filtered.filter(p => p.active === false);
        }

        filteredProducts = filtered;
        renderProductsTable(filteredProducts);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
}

// ==================== EDIT PRODUCT ====================
window.openEditModal = function (productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    currentEditId = productId;

    document.getElementById('edit-id').value = productId;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-stock').value = product.stock;
    document.getElementById('edit-image').value = product.image;
    document.getElementById('edit-category').value = product.category || 'Classic';
    document.getElementById('edit-description').value = product.description || '';

    // Show image preview for existing product
    const editImageField = document.getElementById('edit-image');
    if (editImageField && product.image) {
        setTimeout(() => {
            createImagePreview(product.image, editImageField);
        }, 100);
    }

    // Add image preview functionality for edit modal
    if (editImageField) {
        // Remove previous listeners by cloning
        const newEditImageField = editImageField.cloneNode(true);
        editImageField.parentNode.replaceChild(newEditImageField, editImageField);

        // Add new listeners
        let previewTimeout;

        newEditImageField.addEventListener('input', () => {
            clearTimeout(previewTimeout);
            const imageUrl = newEditImageField.value.trim();

            // Clear preview if field is empty
            if (!imageUrl) {
                const existingPreview = newEditImageField.closest('.form-group')?.querySelector('.image-preview-box');
                if (existingPreview) existingPreview.remove();
                return;
            }

            previewTimeout = setTimeout(() => {
                createImagePreview(imageUrl, newEditImageField);
            }, 800);
        });

        newEditImageField.addEventListener('paste', (e) => {
            setTimeout(() => {
                const imageUrl = newEditImageField.value.trim();
                if (imageUrl) {
                    createImagePreview(imageUrl, newEditImageField);
                }
            }, 100);
        });

        newEditImageField.addEventListener('blur', () => {
            const imageUrl = newEditImageField.value.trim();
            if (imageUrl) {
                createImagePreview(imageUrl, newEditImageField);
            }
        });
    }

    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
    }
};

window.closeEditModal = function () {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    currentEditId = null;

    // Remove image preview when closing modal
    document.querySelectorAll('.image-preview-box').forEach(el => el.remove());
};

document.getElementById('editProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentEditId) return;

    const validator = new FormValidator('editProductForm');
    if (!validator.validateAll()) {
        alert('Please fix the errors in the form');
        return;
    }

    const updateBtn = document.getElementById('update-btn');
    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.textContent = '⏳ Updating...';
    }

    try {
        const stockQty = parseInt(document.getElementById('edit-stock').value);

        const updatedData = {
            name: document.getElementById('edit-name').value.trim(),
            price: parseFloat(document.getElementById('edit-price').value),
            stock: stockQty,
            stockStatus: stockQty > 0 ? 'In Stock' : 'Out of Stock',
            image: document.getElementById('edit-image').value.trim(),
            category: document.getElementById('edit-category').value,
            description: document.getElementById('edit-description').value.trim(),
            updatedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'spectacles', currentEditId), updatedData);

        alert('✅ Product updated successfully!');
        closeEditModal();
        loadProductsForManagement();
        updateDashboard();

    } catch (error) {
        console.error('❌ Error updating product:', error);
        alert('❌ Error updating product: ' + error.message);
    } finally {
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.textContent = '💾 Update Product';
        }
    }
});

// ==================== TOGGLE PRODUCT STATUS ====================
window.toggleProductStatus = async function (productId, currentStatus) {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} this product?`)) return;

    showLoading();

    try {
        await updateDoc(doc(db, 'spectacles', productId), {
            active: newStatus,
            updatedAt: serverTimestamp()
        });

        hideLoading();
        alert(`✅ Product ${action}d successfully!`);
        loadProductsForManagement();
        updateDashboard();

    } catch (error) {
        hideLoading();
        console.error('❌ Error toggling status:', error);
        alert('❌ Error: ' + error.message);
    }
};

// ==================== DELETE PRODUCT ====================
window.deleteProduct = async function (productId, productName) {
    if (!confirm(`⚠️ Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone.`)) return;

    showLoading();

    try {
        await deleteDoc(doc(db, 'spectacles', productId));

        hideLoading();
        alert('✅ Product deleted successfully!');
        loadProductsForManagement();
        updateDashboard();

    } catch (error) {
        hideLoading();
        console.error('❌ Error deleting product:', error);
        alert('❌ Error deleting product: ' + error.message);
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    new ProductFormManager();
    updateDashboard();
    setupFilters();

    console.log('✅ Admin panel initialized successfully');
});