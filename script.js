// DZ Store - النسخة الأحدث: القائمة الجانبية وسط، الهامبرجر toggle، زر المفضلة تحديث لحظي، المنتجات دائماً متاحة.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
let lastOrderTime = 0;
let lastOrderId = 0;

let modalCurrentProductId = null;
let modalFavClickLock = false;

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
    if (!hash || !['home', 'shop', 'favorites', 'cart', 'orders', 'profile'].includes(hash)) hash = 'home';
    // فقط هذه الصفحات تتطلب تسجيل الدخول
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
    if (hash === 'shop') renderShop();
    if (hash === 'home') {
        renderFeaturedProducts();
        renderGreeting();
    }
}
window.addEventListener('hashchange', route);

// --------- Initializers / Loading ----------
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('loading-overlay').style.display = "flex";
    await initApp();
    document.getElementById('loading-overlay').style.display = "none";
    route();

    // Hamburger toggle (فتح وغلق بنفس الزر)
    const hamburger = document.querySelector('.hamburger');
    hamburger.addEventListener('click', () => {
      document.querySelector('.nav-links').classList.toggle('open');
    });
    document.body.addEventListener('click', function(e) {
      if (window.innerWidth < 800 && !e.target.closest('.nav-links') && !e.target.classList.contains('hamburger')) {
        document.querySelector('.nav-links').classList.remove('open');
      }
    });
    document.getElementById('close-product-modal').onclick = closeProductModal;
    document.getElementById('modal-add-cart').onclick = () => addToCart(modalCurrentProductId, true);
    document.getElementById('modal-add-fav').onclick = modalFavHandler;
    document.getElementById('show-all-featured').onclick = () => { location.hash = "#shop"; };
    document.getElementById('shop-category-filter').onchange = renderShop;
    document.getElementById('shop-sort-filter').onchange = renderShop;
    document.getElementById('shop-type-filter').onchange = renderShop;
    document.getElementById('shop-search-filter').oninput = renderShop;
});

async function initApp() {
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
    document.getElementById('refresh-profile-btn').addEventListener('click', () => { showToast('تم تحديث البيانات!', 'success'); renderProfile(); });

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
function renderGreeting() {
    const greet = document.getElementById('home-greeting');
    if (!greet) return;
    if (!user) { greet.innerHTML = ''; return; }
    const hour = new Date().getHours();
    const isMorning = hour >= 5 && hour < 18;
    const name = user.displayName || user.email.split('@')[0];
    greet.innerHTML = ` ${isMorning ? "صباح" : "مساء"} الخير <span style="color:#f59e42">${name}</span> 👋`;
}

// --------- Load Data ---------
async function loadUserData() {
    await loadProducts();
    await loadCategories();
    await loadCoupons();
    await loadOrders();
    await loadCartFromDB();
    await loadFavoritesFromDB();
    await loadLastOrderId();
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
async function loadCartFromDB() {
    if (!user) { cart = JSON.parse(localStorage.getItem('cart_guest')) || []; updateCartUI(); return; }
    const docSnap = await getDoc(doc(db, "users", user.uid, "cart", "cart"));
    cart = docSnap.exists() ? docSnap.data().items : [];
    updateCartUI();
}
async function loadFavoritesFromDB() {
    if (!user) { favorites = JSON.parse(localStorage.getItem('fav_guest')) || []; updateFavUI(); return; }
    const docSnap = await getDoc(doc(db, "users", user.uid, "favorites", "favorites"));
    favorites = docSnap.exists() ? docSnap.data().items : [];
    updateFavUI();
}
async function loadLastOrderId() {
    const docSnap = await getDoc(doc(db, "meta", "lastOrderId"));
    lastOrderId = docSnap.exists() ? (docSnap.data().value || 10000) : 10000;
}
function renderContent() {
    renderFeaturedProducts();
    renderCategories();
    renderCart();
    renderFavorites();
    renderOrders();
    renderProfile();
    renderShop();
    renderGreeting();
}

// --------- Featured Products ----------
function renderFeaturedProducts() {
    const container = document.getElementById('featured-products-grid');
    if (!container) return;
    let featuredProducts = products.filter(p => p.featured);
    if (featuredProducts.length === 0 && products.length === 1) featuredProducts = products;
    if (featuredProducts.length > 3) featuredProducts = featuredProducts.slice(0, 3);
    container.innerHTML = featuredProducts.length === 0
        ? '<p class="empty-message">لا توجد منتجات مميزة حاليًا.</p>'
        : featuredProducts.map(product => makeProductCard(product, true)).join('');
}

// --------- Shop Page ----------
function renderShop() {
    const grid = document.getElementById('shop-products-grid');
    if (!grid) return;
    const catSelect = document.getElementById('shop-category-filter');
    const sortSelect = document.getElementById('shop-sort-filter');
    const typeSelect = document.getElementById('shop-type-filter');
    const searchInput = document.getElementById('shop-search-filter');

    if (catSelect && catSelect.innerHTML.trim() === '') {
        catSelect.innerHTML = '<option value="all">كل التصنيفات</option>' +
            categories.map(category => `<option value="${category.id}">${category.name}</option>`).join('');
    }

    let filteredProducts = [...products];
    if (catSelect.value !== "all") filteredProducts = filteredProducts.filter(p => p.category === catSelect.value);

    // بحث fuzzy بسيط
    const q = (searchInput.value || "").toLowerCase().trim();
    if (q.length) {
        filteredProducts = filteredProducts.filter(product => fuzzyMatch(product.name, q) || fuzzyMatch(product.desc || "", q));
    }

    // ترتيب
    if (sortSelect.value === "price-high") {
        filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortSelect.value === "price-low") {
        filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    // نوع العرض
    if (typeSelect.value === "categories") {
        grid.innerHTML = categories.map(cat => {
            const items = filteredProducts.filter(p => p.category === cat.id);
            if (!items.length) return '';
            return `
              <div class="category-block">
                <h3>${cat.name}</h3>
                <div class="products-grid">
                  ${items.map(product => makeProductCard(product, false)).join('')}
                </div>
              </div>
            `;
        }).join('');
    } else {
        grid.innerHTML = filteredProducts.length === 0
            ? '<p class="empty-message">لا توجد منتجات متاحة.</p>'
            : filteredProducts.map(product => makeProductCard(product, false)).join('');
    }
}

// --------- Products Card + Fuzzy Match ----------
function makeProductCard(product, isFeatured = false) {
    const isFav = favorites.some(f => f === product.id);
    return `
      <div class="product-card${isFeatured ? ' featured' : ''}${isFav ? ' favorite' : ''}" data-product-id="${product.id}">
        <img src="${product.img}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.desc || ''}</p>
        <p class="price">${product.price} جنيه</p>
        <div class="product-actions">
          <button class="add-to-cart-btn" data-product-id="${product.id}">أضف للسلة</button>
          <button class="add-to-fav-btn${isFav ? ' fav' : ''}" data-product-id="${product.id}">
            ${isFav ? "★ تمت الإضافة للمفضلة" : "☆ أضف للمفضلة"}
          </button>
        </div>
      </div>
    `;
}
function fuzzyMatch(str, q) {
    str = (str || "").toLowerCase();
    if (str.includes(q)) return true;
    if (q.length < 2) return false;
    let diffs = 0;
    let i = 0, j = 0;
    while (i < str.length && j < q.length) {
        if (str[i] === q[j]) { i++; j++; }
        else { diffs++; i++; if (diffs > 2) return false; }
    }
    return diffs <= 2;
}

// --------- Favorites ----------
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
        : favProducts.map(product => makeProductCard(product, false)).join('');
}
function updateFavUI() {}

// --------- Cart ----------
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

// --------- Orders ----------
async function cancelOrder(orderId) {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: "cancelled" });
    showToast("تم إلغاء الطلب بنجاح!", "success");
    await loadOrders();
    renderOrders();
}
function formatOrderDate(dateISO) {
    const d = new Date(dateISO);
    let hours = d.getHours();
    let mins = d.getMinutes();
    let ampm = hours >= 12 ? "مساءً" : "صباحًا";
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    mins = mins < 10 ? "0" + mins : mins;
    const dateStr = d.toLocaleDateString('ar-EG');
    return `${dateStr} - ${hours}:${mins} ${ampm}`;
}
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
        let couponInfo = "";
        let totalBefore = order.total_before_discount ? `<p><strong>الإجمالي قبل الخصم:</strong> ${order.total_before_discount.toFixed(2)} جنيه</p>` : "";
        let couponCodeText = order.coupon_code ? `<p><strong>كود الخصم المستخدم:</strong> ${order.coupon_code}</p>` : "";
        let totalAfter = order.total !== order.total_before_discount ? `<p><strong>الإجمالي بعد الخصم:</strong> ${order.total.toFixed(2)} جنيه</p>` : "";

        return `
            <div class="order-card">
                <div class="order-header">
                    <h3>طلب رقم #${order.order_number || order.id}</h3>
                    <span class="order-status ${statusInfo.class}">${statusInfo.text}</span>
                </div>
                <div class="order-items-summary">
                    <p><strong>المنتجات:</strong> ${itemsSummary}</p>
                    ${totalBefore}${totalAfter}
                    ${couponCodeText}
                    <p><strong>تاريخ الطلب:</strong> ${formatOrderDate(order.date)}</p>
                    ${order.status === "review" ? `<button class="small-btn danger-btn" onclick="window.cancelOrder && cancelOrder('${order.id}')">إرجاع / إلغاء الطلب</button>` : ""}
                </div>
            </div>`;
    }).join('');
}
window.cancelOrder = cancelOrder;

// --------- Profile ---------
function renderProfile() {
    if (!user) return;
    document.getElementById('profile-fullname').textContent = user.displayName || user.email.split('@')[0];
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-date').textContent = user.metadata?.creationTime?.split(' ')[0] || "-";
    document.getElementById('profile-avatar-img').src = `https://ui-avatars.com/api/?background=3b82f6&color=fff&name=${encodeURIComponent(user.displayName || user.email.charAt(0))}`;
    // إذا كان تسجيل جوجل فقط أخفِ زر تغيير كلمة السر
    if (user.providerData.some(p => p.providerId === "google.com")) {
        document.getElementById('refresh-profile-btn').style.display = "";
        const changePassBtn = document.getElementById('change-password-btn');
        if (changePassBtn) changePassBtn.style.display = "none";
    }
}

// --------- Cart/Fav/Product Modal Actions ----------
function handleGlobalClick(e) {
    const target = e.target;

    // المنتج: فتح النافذة المنبثقة عند الضغط على البطاقة
    if (target.closest('.product-card') && !target.classList.contains('add-to-cart-btn') && !target.classList.contains('add-to-fav-btn')) {
        const card = target.closest('.product-card');
        const productId = card.dataset.productId;
        openProductModal(productId);
    }

    if (target.classList.contains('add-to-cart-btn')) {
        const productId = target.dataset.productId;
        if (!user) { openAuthModal(); showToast('سجّل الدخول لإضافة منتجات للسلة', 'error'); return; }
        addToCart(productId);
    }
    if (target.classList.contains('add-to-fav-btn')) {
        const productId = target.dataset.productId;
        if (!user) { openAuthModal(); showToast('سجّل الدخول لإضافة للمفضلة', 'error'); return; }
        toggleFavorite(productId, target);
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
    if (target.id === "product-modal") closeProductModal();
}
function modalFavHandler() {
    if (modalFavClickLock) return;
    modalFavClickLock = true;
    setTimeout(() => modalFavClickLock = false, 250);
    if (!user) { openAuthModal(); showToast('سجّل الدخول لإضافة للمفضلة', 'error'); return; }
    toggleFavorite(modalCurrentProductId, document.getElementById('modal-add-fav'));
    updateModalFavBtn();
}
function openProductModal(productId) {
    modalCurrentProductId = productId;
    const modal = document.getElementById('product-modal');
    const product = products.find(p => p.id === productId);
    if (!modal || !product) return;
    document.getElementById('modal-product-img').src = product.img;
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-desc').textContent = product.desc || "";
    document.getElementById('modal-product-extra').innerHTML = `<p class="price">${product.price} جنيه</p>`;
    updateModalFavBtn();
    modal.classList.add('open');
}
function closeProductModal() {
    document.getElementById('product-modal').classList.remove('open');
    modalCurrentProductId = null;
}
function updateModalFavBtn() {
    const btn = document.getElementById('modal-add-fav');
    if (!btn) return;
    const isFav = favorites.includes(modalCurrentProductId);
    btn.innerHTML = isFav ? "★ تمت الإضافة للمفضلة" : "☆ أضف للمفضلة";
    btn.classList.toggle("fav", isFav);
}

// --------- Cart/Fav DB ----------
function addToCart(productId, fromModal = false) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({ id: productId, name: product.name, price: product.price, quantity: 1, img: product.img });
    }
    saveCart();
    saveCartToDB();
    renderCart();
    showToast('تم إضافة المنتج إلى السلة!', 'success');
    if (fromModal) closeProductModal();
}
function updateCartItemQuantity(productId, action) {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return;
    if (action === 'increase') cartItem.quantity += 1;
    else if (action === 'decrease' && cartItem.quantity > 1) cartItem.quantity -= 1;
    saveCart();
    saveCartToDB();
    renderCart();
}
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    saveCartToDB();
    renderCart();
    showToast('تم إزالة المنتج من السلة!', 'success');
}
function saveCart() {
    if (!user) localStorage.setItem('cart_guest', JSON.stringify(cart));
    updateCartUI();
}
async function saveCartToDB() {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "cart", "cart"), { items: cart });
}
function toggleFavorite(productId, btn = null) {
    let isFav = favorites.includes(productId);
    if (isFav) {
        favorites = favorites.filter(id => id !== productId);
        showToast('تم إزالة المنتج من المفضلة', 'info');
    } else {
        favorites.push(productId);
        showToast('تمت إضافة المنتج للمفضلة', 'success');
    }
    saveFavorites();
    saveFavoritesToDB();
    // تحديث الزر الحالي لحظياً
    if (btn) {
        btn.classList.toggle("fav", !isFav);
        btn.innerHTML = !isFav ? "★ تمت الإضافة للمفضلة" : "☆ أضف للمفضلة";
    }
    // تحديث كل أزرار المفضلة الأخرى لحظياً
    document.querySelectorAll(`.add-to-fav-btn[data-product-id="${productId}"]`).forEach(el => {
        el.classList.toggle("fav", favorites.includes(productId));
        el.innerHTML = favorites.includes(productId) ? "★ تمت الإضافة للمفضلة" : "☆ أضف للمفضلة";
    });
    updateModalFavBtn();
}
function saveFavorites() {
    if (!user) localStorage.setItem('fav_guest', JSON.stringify(favorites));
}
async function saveFavoritesToDB() {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "favorites", "favorites"), { items: favorites });
}
function getUserKey() { return user ? user.uid : "guest"; }

// --------- كوبون الخصم ----------
function applyCoupon() {
    const couponCode = document.getElementById('coupon-code')?.value?.toUpperCase();
    if (!couponCode) {
        showToast('الرجاء إدخال كود الخصم', 'error');
        updateCartTotal();
        return;
    }
    const coupon = Object.values(coupons).find(c => c.code === couponCode);
    if (!coupon) {
        showToast('كود الخصم غير صالح', 'error');
        updateCartTotal();
        return;
    }
    updateCartTotal();
    showToast('تم تطبيق كود الخصم بنجاح!', 'success');
}

// --------- Checkout ----------
async function handleCheckout() {
    if (!user) { openAuthModal(); showToast('سجّل الدخول أولاً لإتمام الطلب', 'error'); return; }
    if (!cart.length) { showToast('سلة التسوق فارغة', 'error'); return; }
    const now = Date.now();
    if (now - lastOrderTime < 60000) {
        showToast("يرجى الانتظار دقيقة قبل إرسال طلب جديد.", "error");
        return;
    }

    let total = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    const couponCode = document.getElementById('coupon-code')?.value?.toUpperCase() || "";
    let totalBefore = total;
    if (couponCode) {
        const coupon = Object.values(coupons).find(c => c.code === couponCode);
        if (coupon) {
            total = coupon.type === 'percent'
                ? total * (1 - coupon.value / 100)
                : total - coupon.value;
            total = Math.max(total, 0);
        }
    }
    // رقم طلب فريد 5 أرقام (يزيد كل مرة)
    const newOrderNumber = lastOrderId + 1;
    try {
        await setDoc(doc(db, "meta", "lastOrderId"), { value: newOrderNumber });
        lastOrderId = newOrderNumber;
    } catch (e) {
        lastOrderId = Math.floor(10000 + Math.random() * 89999);
    }

    const order = {
    userId: user.uid,
    items: cart,
    total: total,
    total_before_discount: totalBefore,
    status: 'review',
    date: new Date().toISOString(),
    order_number: lastOrderId
    };
    if (couponCode) {
        order.coupon_code = couponCode;
    }
    try {
        await addDoc(collection(db, "orders"), order);
        cart = [];
        saveCart();
        saveCartToDB();
        renderCart();
        await loadOrders();
        renderOrders();
        lastOrderTime = Date.now();
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

// --------- التصنيفات ----------
function renderCategories() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    categoryFilter.innerHTML = '<option value="all">كل التصنيفات</option>' +
        categories.map(category => `<option value="${category.id}">${category.name}</option>`).join('');
}
