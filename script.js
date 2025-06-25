// DZ Store - نسخة متجاوبة بالكامل للهاتف والتابلت والمكتب

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBV_kaqlAtLTBNEcIHpc0rWHTbWXdgsXME",
    authDomain: "store-b5352.firebaseapp.com",
    projectId: "store-b5352",
    storageBucket: "store-b5352.firebasestorage.app",
    messagingSenderId: "994825915869",
    appId: "1:994825915869:web:57e664699a45b3d2fa3a34",
    measurementId: "G-KGZHS02V07"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;
let products = [];
let categories = [];
let cart = [];
let favorites = [];
let coupons = {};
let orders = [];

// --------- SPA Routing ----------
function showSection(section) {
    document.querySelectorAll('.page-section').forEach(sec => sec.style.display = 'none');
    const el = document.getElementById(section + '-section');
    if (el) el.style.display = '';
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-section="${section}"]`);
    if (activeLink) activeLink.classList.add('active');
}
function route() {
    let hash = location.hash.replace('#', '');
    if (!hash || !['home', 'favorites', 'cart', 'orders', 'profile'].includes(hash)) hash = 'home';
    if (['cart', 'favorites', 'orders', 'profile'].includes(hash) && !user) {
        openAuthModal();
        location.hash = '#home';
        showToast('يجب تسجيل الدخول للوصول إلى هذه الصفحة', 'error');
        return;
    }
    showSection(hash);
    if (hash === 'favorites') renderFavorites();
    if (hash === 'cart') renderCart();
    if (hash === 'orders') renderOrders();
    if (hash === 'profile') renderProfile();
}
window.addEventListener('hashchange', route);

// --------- Initializers ----------
document.addEventListener('DOMContentLoaded', async () => {
    initApp();
    route();
    // Hamburger menu
    document.querySelector('.hamburger').addEventListener('click', openHamburgerMenu);
    document.body.addEventListener('click', function(e) {
      if (e.target.classList.contains('nav-link') || e.target.id === 'auth-btn') closeHamburgerMenu();
      if (window.innerWidth < 800 && !e.target.closest('.nav-links') && !e.target.classList.contains('hamburger')) closeHamburgerMenu();
    });
});

function openHamburgerMenu() {
  document.querySelector('.nav-links').classList.add('open');
}
function closeHamburgerMenu() {
  document.querySelector('.nav-links').classList.remove('open');
}

function initApp() {
    document.body.addEventListener('click', handleGlobalClick);

    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('signup-btn').addEventListener('click', handleSignup);
    document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle);
    document.getElementById('google-signup-btn').addEventListener('click', signInWithGoogle);
    document.getElementById('apply-coupon').addEventListener('click', applyCoupon);
    document.getElementById('checkout-btn').addEventListener('click', handleCheckout);

    document.getElementById('show-signup').addEventListener('click', e => {e.preventDefault(); showSignupForm();});
    document.getElementById('show-login').addEventListener('click', e => {e.preventDefault(); showLoginForm();});

    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('change-password-btn').addEventListener('click', handleChangePassword);
    document.getElementById('refresh-profile-btn').addEventListener('click', () => { showToast('تم تحديث البيانات!', 'success'); renderProfile(); });

    document.getElementById('search-filter').addEventListener('input', renderProducts);
    document.getElementById('category-filter').addEventListener('change', renderProducts);

    onAuthStateChanged(auth, async (currentUser) => {
        user = currentUser;
        updateAuthUI();
        if (user) {
            document.getElementById('profile-name').textContent = user.displayName || "حسابي";
            await loadUserData();
        } else {
            document.getElementById('profile-name').textContent = "حسابي";
            renderContent();
        }
        route();
    });
}

// --------- Auth UI ---------
function updateAuthUI() {
    const authText = document.getElementById('auth-text');
    const authBtn = document.getElementById('auth-btn');
    if (authText && authBtn) {
        if (user) {
            authText.textContent = 'تسجيل الخروج';
            authBtn.onclick = handleLogout;
        } else {
            authText.textContent = 'تسجيل الدخول';
            authBtn.onclick = openAuthModal;
        }
    }
}

// --------- Load Data ---------
async function loadUserData() {
    await loadProducts();
    await loadCategories();
    await loadCoupons();
    await loadOrders();
    loadCart();
    loadFavorites();
    renderContent();
}
async function loadProducts() {
    products = [];
    const querySnapshot = await getDocs(collection(db, "products"));
    querySnapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
}
async function loadCategories() {
    categories = [];
    const querySnapshot = await getDocs(collection(db, "categories"));
    querySnapshot.forEach(doc => categories.push({ id: doc.id, ...doc.data() }));
}
async function loadCoupons() {
    coupons = {};
    const querySnapshot = await getDocs(collection(db, "coupons"));
    querySnapshot.forEach(doc => { coupons[doc.id] = { id: doc.id, ...doc.data() }; });
}
async function loadOrders() {
    if (!user) return;
    orders = [];
    const querySnapshot = await getDocs(collection(db, "orders"));
    querySnapshot.forEach(doc => {
        if (doc.data().userId === user.uid) orders.push({ id: doc.id, ...doc.data() });
    });
}
function loadCart() {
    cart = JSON.parse(localStorage.getItem('cart_' + getUserKey())) || [];
    updateCartUI();
}
function loadFavorites() {
    favorites = JSON.parse(localStorage.getItem('fav_' + getUserKey())) || [];
    updateFavUI();
}
function renderContent() {
    renderProducts();
    renderCategories();
    renderCart();
    renderFavorites();
    renderOrders();
    renderProfile();
}

// --------- Products ---------
function renderProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const searchFilter = document.getElementById('search-filter')?.value.toLowerCase() || '';
    const filteredProducts = products.filter(product =>
        (categoryFilter === 'all' || (product.category && product.category === categoryFilter)) &&
        (
            (product.name && product.name.toLowerCase().includes(searchFilter)) ||
            (product.desc && product.desc.toLowerCase().includes(searchFilter))
        )
    );
    container.innerHTML = filteredProducts.length === 0
        ? '<p class="empty-message">لا توجد منتجات متاحة.</p>'
        : filteredProducts.map(product => {
            const isFav = favorites.some(f => f === product.id);
            return `
            <div class="product-card${isFav ? ' favorite' : ''}">
                <img src="${product.img}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.desc || ''}</p>
                <p class="price">${product.price} جنيه</p>
                <div class="product-actions">
                  <button class="add-to-cart-btn" data-product-id="${product.id}">أضف للسلة</button>
                  <button class="add-to-fav-btn" data-product-id="${product.id}" style="${isFav ? 'background:#fbbf24;' : ''}">
                    ${isFav ? "★" : "☆"} مفضلة
                  </button>
                </div>
            </div>`;
        }).join('');
}
function renderCategories() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    categoryFilter.innerHTML = '<option value="all">كل التصنيفات</option>' +
        categories.map(category => `<option value="${category.id}">${category.name}</option>`).join('');
}

// --------- Favorites ---------
function renderFavorites() {
    const container = document.getElementById('favorites-grid');
    if (!container) return;
    if (!favorites.length) {
        container.innerHTML = '<p class="empty-message">لا توجد منتجات مفضلة بعد.</p>';
        return;
    }
    const favProducts = products.filter(p => favorites.includes(p.id));
    container.innerHTML = favProducts.length === 0
        ? '<p class="empty-message">لا توجد منتجات مفضلة بعد.</p>'
        : favProducts.map(product => `
            <div class="product-card favorite">
                <img src="${product.img}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.desc || ''}</p>
                <p class="price">${product.price} جنيه</p>
                <div class="product-actions">
                  <button class="add-to-cart-btn" data-product-id="${product.id}">أضف للسلة</button>
                  <button class="add-to-fav-btn" data-product-id="${product.id}" style="background:#fbbf24;">★ مفضلة</button>
                </div>
            </div>`).join('');
}
function updateFavUI() {
    // يمكن إضافة عداد للمفضلة في الـ Navbar إذا رغبت
}

// --------- Cart ---------
function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    if (!cart.length) {
        container.innerHTML = '<p class="empty-message">السلة فارغة.</p>';
        updateCartTotal();
        return;
    }
    container.innerHTML = cart.map(item => {
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
                <button class="remove-from-cart" data-product-id="${product.id}">إزالة</button>
            </div>
        `;
    }).join('');
    updateCartTotal();
}
function updateCartTotal() {
    const totalElement = document.getElementById('cart-total');
    const discountedTotalElement = document.getElementById('cart-discounted-total');
    const discountRow = document.getElementById('discount-row');
    let total = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    totalElement.textContent = total.toFixed(2);

    const couponCode = document.getElementById('coupon-code')?.value?.toUpperCase() || "";
    let discountedTotal = total;
    if (couponCode) {
        const coupon = Object.values(coupons).find(c => c.code === couponCode);
        if (coupon) {
            discountedTotal = coupon.type === 'percent'
                ? total * (1 - coupon.value / 100)
                : total - coupon.value;
            discountedTotal = Math.max(discountedTotal, 0);
        }
    }
    discountedTotalElement.textContent = discountedTotal.toFixed(2);
    if (discountedTotal < total) {
        discountRow.style.display = '';
    } else {
        discountRow.style.display = 'none';
    }
}
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
}

// --------- Orders ---------
function renderOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    if (!orders.length) {
        container.innerHTML = '<p class="empty-message">لا توجد طلبات حاليًا.</p>';
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
        return `
            <div class="order-card">
                <div class="order-header">
                    <h3>طلب رقم #${order.id}</h3>
                    <span class="order-status ${statusInfo.class}">${statusInfo.text}</span>
                </div>
                <div class="order-items-summary">
                    <p><strong>المنتجات:</strong> ${itemsSummary}</p>
                    <p><strong>الإجمالي:</strong> ${order.total.toFixed(2)} جنيه</p>
                    <p><strong>تاريخ الطلب:</strong> ${order.date.split('T')[0]}</p>
                </div>
            </div>`;
    }).join('');
}

// --------- Profile ---------
function renderProfile() {
    if (!user) return;
    document.getElementById('profile-fullname').textContent = user.displayName || user.email.split('@')[0];
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-date').textContent = user.metadata?.creationTime?.split(' ')[0] || "-";
    document.getElementById('profile-avatar-img').src = `https://ui-avatars.com/api/?background=3b82f6&color=fff&name=${encodeURIComponent(user.displayName || user.email.charAt(0))}`;
}

// --------- Cart/Fav Actions ----------
function handleGlobalClick(e) {
    const target = e.target;

    if (target.classList.contains('add-to-cart-btn')) {
        const productId = target.dataset.productId;
        if (!user) { openAuthModal(); showToast('سجّل الدخول لإضافة منتجات للسلة', 'error'); return; }
        addToCart(productId);
    }
    if (target.classList.contains('add-to-fav-btn')) {
        const productId = target.dataset.productId;
        if (!user) { openAuthModal(); showToast('سجّل الدخول لإضافة للمفضلة', 'error'); return; }
        toggleFavorite(productId);
    }
    if (target.classList.contains('quantity-btn')) {
        const productId = target.dataset.productId;
        const action = target.dataset.action;
        updateCartItemQuantity(productId, action);
    }
    if (target.classList.contains('remove-from-cart')) {
        const productId = target.dataset.productId;
        removeFromCart(productId);
    }
    const authModal = document.getElementById('auth-modal');
    if (authModal && target === authModal) closeAuthModal();
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
    saveCart();
    renderCart();
    showToast('تم إضافة المنتج إلى السلة!', 'success');
}
function updateCartItemQuantity(productId, action) {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return;
    if (action === 'increase') cartItem.quantity += 1;
    else if (action === 'decrease' && cartItem.quantity > 1) cartItem.quantity -= 1;
    saveCart();
    renderCart();
}
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    showToast('تم إزالة المنتج من السلة!', 'success');
}
function saveCart() {
    localStorage.setItem('cart_' + getUserKey(), JSON.stringify(cart));
    updateCartUI();
}
function toggleFavorite(productId) {
    if (favorites.includes(productId)) {
        favorites = favorites.filter(id => id !== productId);
        showToast('تم إزالة المنتج من المفضلة', 'info');
    } else {
        favorites.push(productId);
        showToast('تمت إضافة المنتج للمفضلة', 'success');
    }
    localStorage.setItem('fav_' + getUserKey(), JSON.stringify(favorites));
    renderProducts();
    renderFavorites();
}
function getUserKey() { return user ? user.uid : "guest"; }

// --------- كوبون الخصم ----------
function applyCoupon() {
    updateCartTotal();
    showToast('تم تطبيق كود الخصم بنجاح!', 'success');
}

// --------- Checkout ----------
async function handleCheckout() {
    if (!user) { openAuthModal(); showToast('سجّل الدخول أولاً لإتمام الطلب', 'error'); return; }
    if (!cart.length) { showToast('سلة التسوق فارغة', 'error'); return; }
    let total = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    const couponCode = document.getElementById('coupon-code')?.value?.toUpperCase() || "";
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
        saveCart();
        renderCart();
        await loadOrders();
        renderOrders();
        showToast('تم إنشاء الطلب بنجاح!', 'success');
    } catch (error) {
        showToast(`خطأ: ${error.message}`, 'error');
    }
}

// --------- Auth & Profile ---------
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    if (!email || !password) { showToast('الرجاء إدخال البريد وكلمة المرور', 'error'); return; }
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
    if (!email || !password) { showToast('الرجاء إدخال البريد وكلمة المرور', 'error'); return; }
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
            route();
        })
        .catch(error => showToast(`خطأ: ${error.message}`, 'error'));
}
function handleChangePassword() {
    if (!user) return;
    sendPasswordResetEmail(auth, user.email)
        .then(() => showToast('تم إرسال رابط تغيير كلمة المرور للبريد الإلكتروني', 'success'))
        .catch(error => showToast(`خطأ: ${error.message}`, 'error'));
}

// --------- Auth Modal ---------
function openAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.classList.add('open');
        showLoginForm();
    }
}
function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.classList.remove('open');
}
function showSignupForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
}
function showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
}

// --------- Toast ---------
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2900);
}
