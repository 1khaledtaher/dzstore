import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBV_kaqlAtLTBNEcIHpc0rWHTbWXdgsXME",
    authDomain: "store-b5352.firebaseapp.com",
    projectId: "store-b5352",
    storageBucket: "store-b5352.firebasestorage.app",
    messagingSenderId: "994825915869",
    appId: "1:994825915869:web:57e664699a45b3d2fa3a34",
    measurementId: "G-KGZHS02V07"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global State
let allProducts = [];
let categories = [];
let wishlist = [];
let cart = JSON.parse(localStorage.getItem('anaqaCart')) || [];
let orders = [];
let coupons = {};
let appliedCoupon = null;
let currentUser = null;

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupAuthListeners();
});

function initApp() {
    document.body.addEventListener('click', handleGlobalClick);
    document.querySelector('.hamburger').addEventListener('click', () => document.querySelector('.nav-links').classList.toggle('active'));
    document.getElementById('cart-btn').addEventListener('click', openCart);
    document.getElementById('close-cart-btn').addEventListener('click', closeCart);
    document.getElementById('cart-overlay').addEventListener('click', closeCart);
    document.getElementById('apply-coupon-btn').addEventListener('click', applyCoupon);
    document.getElementById('sort-select').addEventListener('change', filterAndSortProducts);
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
    
    const detailModal = document.getElementById('product-detail-modal');
    detailModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-modal') || e.target.id === 'product-detail-modal') {
            closeProductModal();
        }
    });
    document.querySelector('.checkout-btn').addEventListener('click', handleCheckout);
}

// Authentication Logic
function setupAuthListeners() {
    onAuthStateChanged(auth, async (userId) => {
        const authButtonsContainer = document.getElementById('auth-buttons-container');
        if (userId) {
            currentUser = {
                uid: userId.uid,
                email: userId.email,
                displayName: userId.displayName,
            };
            authButtonsContainer.innerHTML = `<button class="cta-button cta-button-small" id="logout-nav-btn">خروج</button>`;
            document.getElementById('logout-nav-btn').addEventListener('click', () => auth.signOut());
            showToast(`أهلاً بك ${userId.displayName || userId.email}`, 'success');
            await loadUserData(userId.uid);
        } else {
            currentUser = null;
            authButtonsContainer.innerHTML = `<button class="cta-button cta-button-small" id="login-nav-btn">تسجيل الدخول</button>`;
            document.getElementById('login-nav-btn').addEventListener('click', openAuthModal);
            wishlist = [];
            orders = [];
            renderAllContent();
        }
    });

    document.querySelector('.close-auth-modal').addEventListener('click', closeAuthModal);
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });

    document.querySelector('#login-form form').addEventListener('submit', handleLogin);
    document.querySelector('#signup-form form').addEventListener('submit', handleSignup);
    document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle);
    document.getElementById('facebook-signin-btn').addEventListener('click', signInWithFacebook);
}

function openAuthModal() {
    document.getElementById('auth-modal').classList.add('open');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('open');
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            closeAuthModal();
            showToast('تم تسجيل الدخول بنجاح!', 'success');
        })
        .catch(error => showToast(`خطأ: ${error.message}`, 'error'));
}

function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;

    if (password !== confirmPassword) {
        showToast('كلمتا المرور غير متطابقتين!', 'error');
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            closeAuthModal();
            showToast('تم إنشاء الحساب وتسجيل الدخول بنجاح!', 'success');
        })
        .catch(error => showToast(`خطأ: ${error.message}`, 'error'));
}

function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then(result => {
            closeAuthModal();
            showToast(`أهلاً بك، ${result.user.displayName}!`, 'success');
        }).catch(error => showToast(`خطأ في تسجيل الدخول عبر جوجل: ${error.message}`, 'error'));
}

function signInWithFacebook() {
    const provider = new FacebookAuthProvider();
    signInWithPopup(auth, provider)
        .then(result => {
            closeAuthModal();
            showToast(`أهلاً بك، ${result.user.displayName}!`, 'success');
        }).catch(error => showToast(`خطأ في تسجيل الدخول عبر فيسبوك: ${error.message}`, 'error'));
}

// Load Data from Firebase
async function loadUserData(userId) {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
        wishlist = userDoc.data().wishlist() || [];
    }
    await loadProducts();
    await loadCategories();
    await loadCoupons();
    await loadOrders(userId);
    renderAllContent();
}

async function loadProducts() {
    allProducts = [];
    const querySnapshot = await getDocs(collection(db, "products"));
    querySnapshot.forEach(doc => {
        allProducts.push({ id: doc.id, ...doc.data() });
    });
}

async function loadCategories() {
    categories = [];
    const querySnapshot = await getDocs(collection(db, "categories"));
    querySnapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() });
    });
}

async function loadCoupons() {
    coupons = {};
    const querySnapshot = await getDocs(collection(db, "coupons"));
    querySnapshot.forEach(doc => {
        coupons[doc.data().code] = { id: doc.id, ...doc.data() };
    });
}

async function loadOrders(userId) {
    orders = [];
    const querySnapshot = await getDocs(collection(db, "orders"));
    querySnapshot.forEach(doc => {
        if (doc.data().userId === userId) {
            orders.push({ id: doc.id, ...doc.data() });
        }
    });
}

// Render Content
function renderAllContent() {
    renderCategories();
    filterAndSortProducts();
    renderFeaturedProducts();
    renderWishlistPage();
    renderOrdersPage();
    updateCart();
}

function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const emptyMsg = containerId === 'wishlist-grid' ? 'قائمة مفضلاتك فارغة حاليًا.' : 'لا توجد منتجات تطابق بحثك.';
    if (products.length === 0) {
        container.innerHTML = `<p class="empty-page-message">${emptyMsg}</p>`;
        return;
    }

    products.forEach(product => {
        const isLiked = wishlist.includes(product.id);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${product.img}" alt="${product.name}" loading="lazy" class="product-main-image" />
            </div>
            <div class="product-actions">
                <button class="action-btn wishlist-btn${isLiked ? ' liked' : ''}" data-product-id="${product.id}" aria-label="Add to wishlist"><i class="fas fa-heart"></i></button>
                <button class="action-btn add-to-cart-btn" data-product-id="${product.id}" aria-label="Add to cart"><i class="fas fa-shopping-cart"></i></button>
            </div>
            <div class="product-info">
                <h3 class="product-name-link">${product.name}</h3>
                <span class="product-price">${product.price} جنيه</span>
            </div>`;
        container.appendChild(card);
    });
}

function renderFeaturedProducts() {
    renderProducts(allProducts.filter(p => p.featured), 'featured-products-grid');
}

function renderCategories() {
    const container = document.getElementById('categories-filter');
    container.innerHTML = '<button class="category-btn active" data-filter="all">الكل</button>';
    categories.forEach(category => {
        container.innerHTML += `<button class="category-btn" data-filter="${category.id}">${category.name}</button>`;
    });
}

function filterAndSortProducts() {
    let productsToDisplay = [...allProducts];
    const activeCategory = document.querySelector('#categories-wrapper .category-btn.active')?.dataset.filter || 'all';
    if (activeCategory !== 'all') {
        productsToDisplay = productsToDisplay.filter(p => p.category === activeCategory);
    }
    const sortValue = document.getElementById('sort-select').value;
    if (sortValue === 'price-asc') productsToDisplay.sort((a, b) => a.price - b.price);
    else if (sortValue === 'price-desc') productsToDisplay.sort((a, b) => b.price - a.price);

    renderProducts(productsToDisplay, 'product-grid');
}

// Page & Modal Navigation
function showPage(pageId) {
    if (!currentUser && (pageId === 'wishlist' || pageId === 'orders')) {
        showToast('يجب عليك تسجيل الدخول أولاً لعرض هذه الصفحة.', 'info');
        openAuthModal();
        return;
    }
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.getElementById(`${pageId}-page`).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-page="${pageId}"]`).classList.add('active');

    if (pageId === 'wishlist') renderWishlistPage();
    if (pageId === 'orders') renderOrdersPage();

    const navLinks = document.querySelector('.nav-links');
    if (navLinks.classList.contains('active')) navLinks.classList.remove('active');
    window.scrollTo(0, 0);
}

function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const container = document.getElementById('product-detail-content');
    const isLiked = wishlist.includes(product.id);

    container.innerHTML = `
        <div class="product-detail-layout">
            <div class="product-gallery">
                <div class="main-image-container"><img src="${product.img}" id="main-product-image" alt="${product.name}"></div>
            </div>
            <div class="product-details-info">
                <div class="detail-header">
                    <h1>${product.name}</h1>
                    <button class="action-btn wishlist-btn ${isLiked ? 'liked' : ''}" data-product-id="${product.id}"><i class="fas fa-heart"></i></button>
                </div>
                <div class="product-rating">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i>
                </div>
                <p class="description">${product.desc}</p>
                <div class="price">${product.price} جنيه</div>
                <div class="product-detail-actions">
                    <button class="cta-button add-to-cart-btn" data-product-id="${product.id}">أضف إلى به السلة</button>
                </div>
                <div class="share-buttons">
                    <p>مشاركة:</p>
                    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent('شاهدي هذا المنتج الرائع: ' + product.name + ' ' + window.location.href)}" target="_blank" class="share-btn whatsapp"><i class="fab fa-whatsapp"></i></a>
                    <a href="#" class="share-btn instagram"><i class="fab fa-instagram"></i></a>
                </div>
            </div>
        </div>`;
    document.getElementById('product-detail-modal').classList.add('open');
}

function closeProductModal() {
    document.getElementById('product-detail-modal').classList.remove('open');
}

// Cart Logic
function openCart() {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
}

function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
}

function addToCart(productId) {
    if (!currentUser) {
        showToast('يجب عليك تسجيل الدخول أولاً للإضافة إلى السلة.', 'info');
        openAuthModal();
        return;
    }

    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) cartItem.quantity++;
    else cart.push({ id: productId, ...product, quantity: 1 });
    showToast('تمت الإضافة إلى سلة المشتريات ✅', 'success');
    updateCart();
}

function updateCart() {
    localStorage.setItem('anaqaCart', JSON.stringify(cart));
    renderCartItems();
    updateCartSummary();
    updateCartCount();
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    if (cart.length === 0) {
        container.innerHTML = '<p class="cart-empty-message">سلة التسوق فارغة.</p>';
        return;
    }
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.img}" alt="${item.name}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <span class="price">${item.price} جنيه</span>
                <div class="cart-item-controls">
                    <button class="quantity-btn" data-id="${item.id}" data-change="-1">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" data-id="${item.id}" data-change="1">+</button>
                    <button class="remove-item-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        </div>`).join('');
}

function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountValue = 0;
    const discountRow = document.getElementById('discount-row');

    if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') discountValue = subtotal * (appliedCoupon.value / 100);
        else discountValue = Math.min(subtotal, appliedCoupon.value);
        discountRow.style.display = 'flex';
        document.getElementById('cart-discount').textContent = `- ${discountValue.toFixed(2)} جنيه`;
    } else {
        discountRow.style.display = 'none';
    }
    const total = Math.max(0, subtotal - discountValue);
    document.getElementById('cart-subtotal').textContent = `${subtotal.toFixed(2)} جنيه`;
    document.getElementById('cart-total').textContent = `${total.toFixed(2)} جنيه`;
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.querySelector('.cart-count');
    cartCountEl.textContent = totalItems;
    cartCountEl.classList.toggle('visible', totalItems > 0);
}

function applyCoupon() {
    const couponInput = document.getElementById('coupon-input');
    const code = couponInput.value.trim().toUpperCase();
    if (coupons[code]) {
        appliedCoupon = coupons[code];
        showToast(`🎉 تم تطبيق الخصم بنجاح`, 'success');
    } else {
        appliedCoupon = null;
        showToast(`⚠ الكود غير صحيح`, 'error');
    }
    couponInput.value = '';
    updateCartSummary();
}

// Checkout & Orders
async function handleCheckout() {
    if (!currentUser) {
        showToast('يجب عليك تسجيل الدخول أولاً لإتمام الشراء.', 'info');
        openAuthModal();
        return;
    }

    if (cart.length === 0) {
        showToast('سلة التسوق فارغة!', 'error');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountValue = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') discountValue = subtotal * (appliedCoupon.value / 100);
        else discountValue = Math.min(subtotal, appliedCoupon.value);
    }
    const total = subtotal - discountValue;

    const newOrder = {
        userId: currentUser.uid,
        date: new Date().toLocaleDateString('ar-EG'),
        items: [...cart],
        total,
        status: 'review'
    };

    try {
        await addDoc(collection(db, "orders"), newOrder);
        cart = [];
        appliedCoupon = null;
        updateCart();
        closeCart();
        showToast('🎉 تم إرسال طلبك بنجاح!', 'success');
        showPage('orders');
        await loadOrders(currentUser.uid);
    } catch (error) {
        showToast(`خطأ: ${error.message}`, 'error');
    }
}

function renderOrdersPage() {
    const container = document.getElementById('orders-list');
    if (!currentUser) {
        container.innerHTML = '<p class="empty-page-message">يجب تسجيل الدخول لعرض الطلبات.</p>';
        return;
    }

    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-page-message">ليس لديك أي طلبات حاليًا.</p>';
        return;
    }

    container.innerHTML = orders.map(order => {
        const statusInfo = {
            review: { text: "تحت المراجعة", class: "review" },
            shipping: { text: "قيد التوصيل", class: "shipping" },
            delivered: { text: "تم الاستلام", class: "delivered" },
            cancelled: { text: "ملغي", class: "cancelled" },
            returned: { text: "تم الإرجاع", class: "returned" }
        }[order.status] || { text: 'غير معروف', class: '' };
        const itemsSummary = order.items.map(item => `${item.name} (x${item.quantity})`).join('، ');

        let actionButtonHTML = '';
        if (order.status === 'review') {
            actionButtonHTML = `<button class="action-button-order cancel" data-order-id="${order.id}">إلغاء الطلب</button>`;
        } else if (order.status === 'delivered') {
            actionButtonHTML = `<button class="action-button-order return" data-order-id="${order.id}">إرجاع الطلب</button>`;
        }

        return `
            <div class="order-card">
                <div class="order-header">
                    <h3>طلب رقم #${order.id}</h3>
                    <span class="order-status ${statusInfo.class}">${statusInfo.text}</span>
                </div>
                <div class="order-items-summary">
                    <p><strong>المنتجات:</strong> ${itemsSummary}</p>
                </div>
                <div class="order-footer">
                    <span>تاريخ الطلب: ${order.date}</span>
                    <div class="order-footer-actions">
                        <span style="margin-right: 15px;">الإجمالي: ${order.total.toFixed(2)} جنيه</span>
                        ${actionButtonHTML}
                    </div>
                </div>
            </div>`;
    }).join('');
}

// Wishlist Logic
async function toggleWishlist(productId) {
    if (!currentUser) {
        showToast('يجب عليك تسجيل الدخول أولاً للإضافة إلى المفضلة.', 'info');
        openAuthModal();
        return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
        await updateDoc(userRef, { wishlist: arrayRemove(productId) });
        showToast('تمت الإزالة من المفضلة 🤍', 'info');
    } else {
        wishlist.push(productId);
        await updateDoc(userRef, { wishlist: arrayUnion(productId) });
        showToast('أُضيف إلى المفضلة ♥️', 'info');
    }
    renderWishlistPage();
}

function renderWishlistPage() {
    const likedProducts = allProducts.filter(p => wishlist.includes(p.id));
    renderProducts(likedProducts, 'wishlist-grid');
}

// Global Event Handler
async function handleGlobalClick(e) {
    const target = e.target;
    let targetBtn;

    // Page navigation
    const navLink = target.closest('[data-page]');
    if (navLink) {
        e.preventDefault();
        showPage(navLink.dataset.pageId);
    }

    // Wishlist button
    if ((targetBtn = target.closest('.wishlist-btn'))) {
        const productId = targetBtn.dataset.productId;
        if (productId) await toggleWishlist(productId);
    }

    // Add to cart button
    else if ((targetBtn = target.closest('.add-to-cart-btn'))) {
        const productId = targetBtn.dataset.productId;
        if (productId) addToCart(productId);
    }

    // Product card image/name click
    else if (target.closest('.product-main-image, .product-name-link')) {
        const productId = target.closest('.product-card').dataset.productId;
        if (productId) openProductModal(productId);
    }

    // Category filter button
    else if ((targetBtn = target.closest('.category-btn'))) {
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        targetBtn.classList.add('active');
        filterAndSortProducts();
    }

    // Cart quantity/remove controls
    const cartControl = target.closest('.quantity-btn, .remove-item-btn');
    if (cartControl) {
        const productId = cartControl.dataset.id;
        if (cartControl.classList.contains('quantity-btn')) {
            const change = parseInt(cartControl.dataset.change);
            const item = cart.find(i => i.id === productId);
            if (item) {
                item.quantity += change;
                if (item.quantity <= 0) cart = cart.filter(i => i.id !== productId);
                updateCart();
            }
        } else {
            cart = cart.filter(i => i.id !== productId);
            showToast('تم حذف المنتج من السلة', 'info');
            updateCart();
        }
    }

    // Order action buttons
    const orderActionBtn = target.closest('.action-button-order');
    if (orderActionBtn) {
        const orderId = orderActionBtn.dataset.orderId;
        if (orderActionBtn.classList.contains('cancel')) {
            await updateDoc(doc(db, "orders", orderId), { status: "cancelled" });
            showToast('تم إلغاء الطلب.', 'info');
            await loadOrders(currentUser.uid);
            renderOrdersPage();
        } else if (orderActionBtn.classList.contains('return')) {
            await updateDoc(doc(db, "orders", orderId), { status: "returned" });
            showToast('تم تسجيل طلب الإرجاع.', 'info');
            await loadOrders(currentUser.uid);
            renderOrdersPage();
        }
    }
}

// Show Toast
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
