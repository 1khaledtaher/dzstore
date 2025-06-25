import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
let user = null;
let products = [];
let categories = [];
let cart = [];
let coupons = {};
let orders = [];

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    const body = document.body;
    if (body) body.addEventListener('click', handleGlobalClick);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'login') {
        openAuthModal();
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) navLinks.classList.toggle('active');
        });
    }

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);

    const signupBtn = document.getElementById('signup-btn');
    if (signupBtn) signupBtn.addEventListener('click', handleSignup);

    const googleSignInBtn = document.getElementById('google-signin-btn');
    if (googleSignInBtn) googleSignInBtn.addEventListener('click', signInWithGoogle);

    const googleSignUpBtn = document.getElementById('google-signup-btn');
    if (googleSignUpBtn) googleSignUpBtn.addEventListener('click', signInWithGoogle);

    const applyCouponBtn = document.getElementById('apply-coupon');
    if (applyCouponBtn) applyCouponBtn.addEventListener('click', applyCoupon);

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);

    onAuthStateChanged(auth, (currentUser) => {
        user = currentUser;
        updateAuthUI();
        if (user) {
            loadUserData();
            if (['YOUR_ADMIN_UID'].includes(user.uid)) {
                window.location.href = "admin.html";
            }
        } else {
            renderContent();
        }
    });
}

function updateAuthUI() {
    const authText = document.getElementById('auth-text');
    const authBtn = document.querySelector('.auth-btn');
    if (authText && authBtn) {
        if (user) {
            authText.textContent = 'تسجيل الخروج';
            authBtn.addEventListener('click', handleLogout);
        } else {
            authText.textContent = 'تسجيل الدخول';
            authBtn.addEventListener('click', openAuthModal);
        }
    }
}

async function loadUserData() {
    await loadProducts();
    await loadCategories();
    await loadCoupons();
    await loadOrders();
    loadCart();
    renderContent();
}

async function loadProducts() {
    products = [];
    const querySnapshot = await getDocs(collection(db, "products"));
    querySnapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
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
        coupons[doc.id] = { id: doc.id, ...doc.data() };
    });
}

async function loadOrders() {
    if (!user) return;
    orders = [];
    const querySnapshot = await getDocs(collection(db, "orders"));
    querySnapshot.forEach(doc => {
        if (doc.data().userId === user.uid) {
            orders.push({ id: doc.id, ...doc.data() });
        }
    });
}

function loadCart() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartUI();
}

function renderContent() {
    renderFeaturedProducts();
    renderProducts();
    renderCategories();
    renderCart();
    renderOrders();
}

function renderFeaturedProducts() {
    const container = document.getElementById('featured-products-grid');
    if (!container) return;
    const featuredProducts = products.filter(p => p.featured);
    container.innerHTML = featuredProducts.length === 0
        ? '<p class="empty-message">لا توجد منتجات مميزة حاليًا.</p>'
        : featuredProducts.map(product => `
            <div class="product-card featured">
                <img src="${product.img}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.desc || ''}</p>
                <p class="price">${product.price} جنيه</p>
                <button class="cta-button add-to-cart" data-product-id="${product.id}">أضف إلى السلة</button>
            </div>`).join('');
}

function renderProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const searchFilter = document.getElementById('search-filter')?.value.toLowerCase() || '';
    const filteredProducts = products.filter(product => 
        (categoryFilter === 'all' || product.category && product.category === categoryFilter) &&
        (product.name.toLowerCase().includes(searchFilter) || (product.desc && product.description)?.toLowerCase().includes(searchFilter))
    );
    container.innerHTML = filteredProducts.length === 0
        ? '<p class="empty-message">لا توجد منتجات متاحة.</p>'
        : filteredProducts.map(product => `
            <div class="product-card">
                <img src="${product.img}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.desc || ''}</p>
                <p class="price">${product.price} جنيه</p>
                <button class="cta-button add-to-cart-btn" data-product-id="${product.id}"">أضف إلى السلة</button>
            </div>`).join('');
}

function renderCategories() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    categoryFilter.innerHTML = '<option value="all">جميع الأقسام</option>' +
        categories.map(category => `<option value="${category.id}">${category.name}</option>`).join('');
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    container.innerHTML = cart.length === 0
        ? '<p class="empty-message">السلة فارغة.</p>'
        : cart.map(item => {
            const product = products.find(p => p.id === item.id);
            if (!product) return '';
            return `
                <div class="cart-item">
                    <img src="${product.img}" alt="${product.name}">
                    <div class="cart-item-details">
                        <h3>${product.name}</h3>
                        <p>السعر: ${product.price} جنيه</p>
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-product-id="${product.id}" data-action="decrease">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn" data-product-id="${product.id}" data-action="increase">+</button>
                        </div>
                    </div>
                    <button class="remove-from-cart" data-product-id="${product.id}" data-product-id="${product.id}">إزالة</button>
                </div>
            `;
        }).join('');

    updateCartTotal();
}

function updateCartTotal() {
    const totalElement = document.getElementById('cart-total');
    const discountedTotalElement = document.getElementById('cart-total-total');
    if (!totalElement || !discountedTotalElement) return;
    let total = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    totalElement.textContent = total.toFixed(2);
    discountedTotalElement.textContent = total.toFixed(2); // Update with coupon logic if needed
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    if (!email || !password) {
        showToast('الرجاء إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            closeAuthModal();
            showToast('تم تسجيل الدخول بنجاح!', 'success');
        })
        .catch(error => showToast(`خطأ: ${error.message}`, 'error'));
}

function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-password')?.value;
    if (!email || !password) {
        showToast('الرجاء إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            closeAuthModal();
            showToast('تم إنشاء الحساب بنجاح!', 'success');
        })
        .catch(error => showToast(`خطأ: ${error.message}`, 'error'));
}

function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then(() => {
            closeAuthModal();
            showToast('تم تسجيل الدخول بنجاح!', 'success');
        })
        .catch(error => showToast(`خطأ: ${error.message}`, 'error'));
}

function handleLogout() {
    signOut(auth)
        .then(() => {
            showToast('تم تسجيل الخروج بنجاح!', 'success');
            user = null;
            updateAuthUI();
        })
        .catch(error => showToast(`خطأ: ${error.message}`, 'error'));
}

async function applyCoupon() {
    const couponCode = document.getElementById('coupon-code')?.value.toUpperCase();
    if (!couponCode) {
        showToast('الرجاء إدخال كود الخصم', 'error');
        return;
    }
    const coupon = Object.values(coupons).find(c => c.code === couponCode);
    if (!coupon) {
        showToast('كود الخصم غير صالح', 'error');
        return;
    }
    let total = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    let discountedTotal = coupon.type === 'percent'
        ? total * (1 - coupon.value / 100)
        : total - coupon.value;
    discountedTotal = Math.max(discountedTotal, 0);
    document.getElementById('cart-discounted-total').textContent = discountedTotal.toFixed(2);
    showToast('تم تطبيق كود الخصم بنجاح!', 'success');
}

async function handleCheckout() {
    if (!user) {
        showToast('الرجاء تسجيل الدخول لإتمام الطلب', 'error');
        openAuthModal();
        return;
    }
    if (cart.length === 0) {
        showToast('سلة التسوق فارغة', 'error');
        return;
    }
    let total = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    const couponCode = document.getElementById('coupon-code')?.value.toUpperCase();
    if (couponCode) {
        const coupon = Object.values(coupons).find(c => c.code === couponCode);
        if (coupon) {
            total = coupon.type === 'percent'
                ? total * (1 - coupon.value / 100)
                : total - coupon.value;
            total = Math.max(total, 0);
        }
    }
    const order = {
        userId: user.uid,
        items: cart,
        total: total,
        status: 'review',
        date: new Date().toISOString()
    };
    try {
        await addDoc(collection(db, "orders"), order);
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
        renderCart();
        renderOrders();
        showToast('تم إنشاء الطلب بنجاح!', 'success');
    } catch (error) {
        showToast(`خطأ: ${error.message}`, 'error');
    }
}

function renderOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    container.innerHTML = orders.length === 0
        ? '<p class="empty-message">لا توجد طلبات حاليًا.</p>'
        : orders.map(order => {
            const statusInfo = {
                review: { text: "تحت المراجعة", class: "review" },
                shipping: { text: "قيد التوصيل", class: "shipping" },
                delivered: { text: "تم الاستلام", class: "delivered" },
                cancelled: { text: "ملغي", class: "cancelled" },
                returned: { text: "تم الإرجاع", class: "returned" }
            }[order.status] || { text: 'غير معروف', class: '' };
            const itemsSummary = order.items.map(item => `${item.name} (x${item.quantity})`).join('، ');
            return `
                <div class="order-card">
                    <div class="order-header">
                        <h3>طلب رقم #${order.id}</h3>
                        <span class="order-status ${statusInfo.class}">${statusInfo.text}</span>
                    </div>
                    <div class="order-items-summary">
                        <p><strong>المنتجات:</strong> ${itemsSummary}</p>
                        <p><strong>الإجمالي:</strong> ${order.total.toFixed(2)} جنيه</p>
                        <p><strong>تاريخ الطلب:</strong> ${order.date}</p>
                    </div>
                </div>`;
        }).join('');
}

function handleGlobalClick(e) {
    const target = e.target;

    const addToCartBtn = target.closest('.add-to-cart-btn');
    if (addToCartBtn) {
        const productId = addToCartBtn.dataset.productId;
        addToCart(productId);
    }

    const quantityBtn = target.closest('.quantity-btn');
    if (quantityBtn) {
        const productId = quantityBtn.dataset.productId;
        const action = quantityBtn.dataset.action;
        updateCartItemQuantity(productId, action);
    }

    const removeFromCartBtn = target.closest('.remove-from-cart-btn');
    if (removeFromCartBtn) {
        const productId = removeFromCartBtn.dataset.productId;
        removeFromCart(productId);
    }

    const showSignupBtn = target.closest('#show-signup');
    if (showSignupBtn) {
        e.preventDefault();
        showSignupForm();
    }

    const showLoginBtn = target.closest('#show-login');
    if (showLoginBtn) {
        e.preventDefault();
        showLoginForm();
    }

    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter && target === categoryFilter) {
        renderProducts();
    }

    const searchInput = document.getElementById('search-filter');
    if (searchInput && target === searchInput) {
        searchInput.addEventListener('input', () => renderProducts());
    }

    const authModal = document.getElementById('auth-modal');
    if (authModal && target === authModal) {
        closeAuthModal();
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({ id: productId, name: product.name, price: product.price, quantity: 1, img: product.img });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    showToast('تم إضافة المنتج إلى السلة!', 'success');
}

function updateCartItemQuantity(productId, action) {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return;
    if (action === 'increase') {
        cartItem.quantity += 1;
    } else if (action === 'decrease' && cartItem.quantity > 1) {
        cartItem.quantity -= 1;
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    renderCart();
    showToast('تم إزالة المنتج من السلة!', 'success');
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
}

function openAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.classList.add('open');
}

function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.classList.remove('open');
}

function showSignupForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    if (loginForm && signupForm) {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
}

function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    if (loginForm && signupForm) {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
