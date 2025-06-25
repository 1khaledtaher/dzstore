// =================================================================
// 0. FIREBASE CONFIGURATION
// =================================================================

// هام جدا: استبدل هذا الكائن بالبيانات من حسابك في Firebase
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();


// =================================================================
// 1. DUMMY DATA & CONFIG
// =================================================================
const dummyCategories = ["أساور", "خواتم", "سلاسل", "أقراط"];
const dummyProducts = [
    // ... (بيانات المنتجات كما هي)
    { id: 1, name: "سوار الفراشة الذهبية", desc: "سوار رقيق بتصميم فراشة مطلية بالذهب، مثالي للمناسبات اليومية والخاصة.", price: 120, img: "https://i.ibb.co/hZ8C7xS/p1.jpg", gallery: ["https://i.ibb.co/hZ8C7xS/p1.jpg", "https://i.ibb.co/2d1hVmM/p7.jpg", "https://i.ibb.co/P9W8pXb/p6.jpg"], category: "أساور", featured: true },
    { id: 5, name: "سوار الحروف الشخصي", desc: "سوار يمكنك تخصيصه بحرف من اختيارك.", price: 130, img: "https://i.ibb.co/Xz9tH4D/p5.jpg", gallery: ["https://i.ibb.co/Xz9tH4D/p5.jpg"], category: "أساور" },
    { id: 9, name: "سوار التنس الفضي", desc: "سوار تنس كلاسيكي مرصع بالزركون.", price: 250, img: "https://i.ibb.co/bFHt3T6/p9.jpg", category: "أساور" },
    { id: 13, name: "سوار الخرز الملون", desc: "سوار حيوي مصنوع من الخرز الزجاجي الملون.", price: 75, img: "https://i.ibb.co/zPq1P5X/p13.jpg", category: "أساور" },
    { id: 17, name: "سوار جلدي مضفر", desc: "سوار عصري من الجلد الطبيعي.", price: 90, img: "https://i.ibb.co/WcWzXQ1/p17.jpg", category: "أساور" },
    { id: 2, name: "خاتم النجمة الفضية", desc: "خاتم أنيق من الفضة الإسترليني عيار 925.", price: 95, img: "https://i.ibb.co/pX1g1Pj/p2.jpg", gallery: ["https://i.ibb.co/pX1g1Pj/p2.jpg"], category: "خواتم" },
    { id: 6, name: "خاتم الأمواج", desc: "تصميم عصري مستوحى من أمواج البحر.", price: 110, img: "https://i.ibb.co/P9W8pXb/p6.jpg", gallery: ["https://i.ibb.co/P9W8pXb/p6.jpg"], category: "خواتم", featured: true },
    { id: 10, name: "خاتم التاج الملكي", desc: "خاتم بتصميم تاج مرصع بالفصوص اللامعة.", price: 140, img: "https://i.ibb.co/hVqXyWv/p10.jpg", category: "خواتم" },
    { id: 14, name: "خاتم قابل للتعديل", desc: "خاتم بتصميم مفتوح يناسب جميع المقاسات.", price: 85, img: "https://i.ibb.co/rpx7sHq/p14.jpg", category: "خواتم" },
    { id: 18, name: "خاتم سوليتير", desc: "خاتم خطبة كلاسيكي بفص واحد كبير.", price: 300, img: "https://i.ibb.co/hD8J4tP/p18.jpg", category: "خواتم" },
    { id: 3, name: "سلسلة القلب الكريستالي", desc: "سلسلة ناعمة مع قلادة على شكل قلب.", price: 150, img: "https://i.ibb.co/L8dMh21/p3.jpg", gallery: ["https://i.ibb.co/L8dMh21/p3.jpg", "https://i.ibb.co/Xz9tH4D/p5.jpg"], category: "سلاسل" },
    { id: 7, name: "سلسلة الطبقات الفضية", desc: "مجموعة من سلسلتين لمظهر متكامل.", price: 180, img: "https://i.ibb.co/2d1hVmM/p7.jpg", gallery: ["https://i.ibb.co/2d1hVmM/p7.jpg"], category: "سلاسل" },
    { id: 11, name: "سلسلة العملة القديمة", desc: "قلادة عصرية بتصميم عملة أثرية.", price: 165, img: "https://i.ibb.co/RSCk8sy/p11.jpg", category: "سلاسل", featured: true },
    { id: 15, name: "سلسلة شوكر سوداء", desc: "شوكر أنيق من قماش المخمل الأسود.", price: 60, img: "https://i.ibb.co/ZJv2v3f/p15.jpg", category: "سلاسل" },
    { id: 19, name: "سلسلة اسمك بالخط العربي", desc: "سلسلة بتصميم اسم من اختيارك.", price: 280, img: "https://i.ibb.co/4P2Bpdh/p19.jpg", category: "سلاسل" },
    { id: 4, name: "قرط اللؤلؤة المتدلي", desc: "قرط كلاسيكي يضيف لمسة من الأناقة.", price: 80, img: "https://i.ibb.co/Ld1Jg8N/p4.jpg", gallery: ["https://i.ibb.co/Ld1Jg8N/p4.jpg"], category: "أقراط", featured: true },
    { id: 8, name: "قرط الدائرة الذهبية", desc: "قرط دائري بسيط وأنيق لكل يوم.", price: 75, img: "https://i.ibb.co/PGrrYv0/p8.jpg", gallery: ["https://i.ibb.co/PGrrYv0/p8.jpg"], category: "أقراط" },
    { id: 12, name: "قرط هوب صغير", desc: "قرط Hoop صغير وعملي للاستخدام اليومي.", price: 90, img: "https://i.ibb.co/BqgM0G0/p12.jpg", category: "أقراط" },
    { id: 16, name: "قرط الكفة (Ear Cuff)", desc: "قرط عصري يزين الأذن بدون الحاجة لثقب.", price: 100, img: "https://i.ibb.co/9gPBFyM/p16.jpg", category: "أقراط" },
    { id: 20, name: "قرط الكريستال الملون", desc: "قرط متدلي بأحجار كريستال ملونة.", price: 125, img: "https://i.ibb.co/m8g4W90/p20.jpg", category: "أقراط", featured: true },
];
const coupons = {
    "ANAQA10": { type: "percent", value: 10 },
    "WELCOME50": { type: "fixed", value: 50 }
};
const orderStatuses = {
    review: { text: "تحت المراجعة", class: "review" },
    shipping: { text: "قيد التوصيل", class: "shipping" },
    delivered: { text: "تم الاستلام", class: "delivered" },
    cancelled: { text: "ملغي", class: "cancelled" },
    returned: { text: "تم الإرجاع", class: "returned" },
};

// =================================================================
// 2. GLOBAL STATE
// =================================================================
let allProducts = [];
let categories = [];
let wishlist = JSON.parse(localStorage.getItem('anaqaWishlist')) || [];
let cart = JSON.parse(localStorage.getItem('anaqaCart')) || [];
let orders = JSON.parse(localStorage.getItem('anaqaOrders')) || [];
let appliedCoupon = null;
let currentUser = null; // To hold user auth state

// =================================================================
// 3. DOM & UI INITIALIZATION
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    loadData();
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

// =================================================================
// 4. AUTHENTICATION LOGIC (NEW SECTION)
// =================================================================
function setupAuthListeners() {
    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
        const authButtonsContainer = document.getElementById('auth-buttons-container');
        if (user) {
            // User is signed in
            currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
            };
            // Update UI
            authButtonsContainer.innerHTML = `<button class="cta-button cta-button-small" id="logout-nav-btn">خروج</button>`;
            document.getElementById('logout-nav-btn').addEventListener('click', () => auth.signOut());
            showToast(`أهلاً بك ${user.displayName || user.email}`, 'success');
        } else {
            // User is signed out
            currentUser = null;
            // Update UI
            authButtonsContainer.innerHTML = `<button class="cta-button cta-button-small" id="login-nav-btn">تسجيل الدخول</button>`;
            document.getElementById('login-nav-btn').addEventListener('click', openAuthModal);
            // Clear user-specific data
            wishlist = [];
            orders = [];
            renderAllContent(); // Re-render to show empty state for wishlist/orders
        }
    });

    // Auth modal controls
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

    // Form submissions
    document.querySelector('#login-form form').addEventListener('submit', handleLogin);
    document.querySelector('#signup-form form').addEventListener('submit', handleSignup);
    
    // Social sign in
    document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle);
    // document.getElementById('facebook-signin-btn').addEventListener('click', signInWithFacebook); // Uncomment when ready
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
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            closeAuthModal();
            showToast('تم تسجيل الدخول بنجاح!', 'success');
        })
        .catch(error => {
            showToast(`خطأ: ${error.message}`, 'error');
        });
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

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            closeAuthModal();
            showToast('تم إنشاء الحساب وتسجيل الدخول بنجاح!', 'success');
        })
        .catch(error => {
            showToast(`خطأ: ${error.message}`, 'error');
        });
}

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            closeAuthModal();
            showToast(`أهلاً بك، ${result.user.displayName}!`, 'success');
        }).catch(error => {
            showToast(`خطأ في تسجيل الدخول عبر جوجل: ${error.message}`, 'error');
        });
}

// =================================================================
// 5. DATA LOADING & RENDERING
// =================================================================
function loadData() {
    allProducts = dummyProducts;
    categories = dummyCategories;
    renderAllContent();
}

function renderAllContent() {
     renderCategories();
     filterAndSortProducts();
     renderFeaturedProducts();
     renderWishlistPage();
     renderOrdersPage();
     updateCart();
}

function renderProducts(products, container) {
    if (!container) return;
    container.innerHTML = '';
    const emptyMsg = container.id === 'wishlist-grid' ? 'قائمة مفضلاتك فارغة حاليًا.' : 'لا توجد منتجات تطابق بحثك.';
    if(products.length === 0) {
         container.innerHTML = `<p class="empty-page-message">${emptyMsg}</p>`;
         return;
    }
    
    products.forEach(product => {
        const isLiked = wishlist.includes(product.id);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;
        card.innerHTML = `
            <div class="product-image-container"> <img src="${product.img}" alt="${product.name}" loading="lazy" class="product-main-image" /> </div>
            <div class="product-actions">
                 <button class="action-btn wishlist-btn" data-product-id="${product.id}" aria-label="Add to wishlist"><i class="fas fa-heart"></i></button>
                 <button class="action-btn add-to-cart-btn" data-product-id="${product.id}" aria-label="Add to cart"><i class="fas fa-shopping-bag"></i></button>
            </div>
            <div class="product-info"> <h3 class="product-name-link">${product.name}</h3> <span class="product-price">${product.price} جنيه</span> </div>
        `;
        container.appendChild(card);
    });
    updateWishlistState();
}

function renderFeaturedProducts() {
    renderProducts(allProducts.filter(p => p.featured), document.getElementById('featured-products-grid'));
}

function renderCategories() {
    const container = document.getElementById('categories-filter');
    container.innerHTML = '<button class="category-btn active" data-filter="all">الكل</button>';
    categories.forEach(category => {
        container.innerHTML += `<button class="category-btn" data-filter="${category}">${category}</button>`;
    });
}

function filterAndSortProducts() {
    let productsToDisplay = [...allProducts];
    const activeCategory = document.querySelector('#categories-filter .category-btn.active')?.dataset.filter || 'all';
    if (activeCategory !== 'all') {
        productsToDisplay = allProducts.filter(p => p.category === activeCategory);
    }
    const sortValue = document.getElementById('sort-select').value;
    if (sortValue === 'price-asc') productsToDisplay.sort((a, b) => a.price - b.price);
    else if (sortValue === 'price-desc') productsToDisplay.sort((a, b) => b.price - a.price);
    
    renderProducts(productsToDisplay, document.getElementById('product-grid'));
}


// =================================================================
// 6. PAGE & MODAL NAVIGATION
// =================================================================
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

    if(pageId === 'wishlist') renderWishlistPage();
    if(pageId === 'orders') renderOrdersPage();
    
    const navLinks = document.querySelector('.nav-links');
    if (navLinks.classList.contains('active')) navLinks.classList.remove('active');
    window.scrollTo(0, 0);
}

function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const container = document.getElementById('product-detail-content');
    const galleryHTML = (product.gallery && product.gallery.length > 0 ? product.gallery : [product.img]).map((imgUrl, index) => 
        `<img src="${imgUrl}" alt="صورة مصغرة ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-img-src="${imgUrl}">`
    ).join('');
    
    const isLiked = wishlist.includes(product.id);

    container.innerHTML = `
        <div class="product-detail-layout">
            <div class="product-gallery">
                <div class="main-image-container"><img src="${product.gallery ? product.gallery[0] : product.img}" id="main-product-image" alt="${product.name}"></div>
                <div class="thumbnail-container">${galleryHTML}</div>
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
                    <button class="cta-button add-to-cart-btn" data-product-id="${product.id}">أضف إلى السلة</button>
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

// =================================================================
// 7. CART LOGIC (addToCart is now protected)
// =================================================================
function openCart() {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
}

function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
}

function addToCart(productId) {
    // PROTECTED ACTION
    if (!currentUser) {
        showToast('يجب عليك تسجيل الدخول أولاً للإضافة إلى السلة.', 'info');
        openAuthModal();
        return; // Stop the function
    }
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    const cartItem = cart.find(item => item.id === productId);
    if(cartItem) cartItem.quantity++;
    else cart.push({ ...product, quantity: 1 });
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

    if(appliedCoupon) {
        if(appliedCoupon.type === 'percent') discountValue = subtotal * (appliedCoupon.value / 100);
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
    if(coupons[code]) {
        appliedCoupon = coupons[code];
        showToast(`🎉 تم تطبيق الخصم بنجاح`, 'success');
    } else {
        appliedCoupon = null;
        showToast(`⚠ الكود غير صحيح`, 'error');
    }
    couponInput.value = '';
    updateCartSummary();
}


// =================================================================
// 8. CHECKOUT & ORDERS (Protected)
// =================================================================
function handleCheckout() {
    // PROTECTED ACTION
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
        if(appliedCoupon.type === 'percent') discountValue = subtotal * (appliedCoupon.value / 100);
        else discountValue = Math.min(subtotal, appliedCoupon.value);
    }
    const total = subtotal - discountValue;

    const newOrder = {
        id: Date.now(),
        date: new Date().toLocaleDateString('ar-EG'),
        items: [...cart],
        total: total,
        status: 'review',
        userId: currentUser.uid // Link order to user
    };
    
    orders.unshift(newOrder);
    localStorage.setItem('anaqaOrders', JSON.stringify(orders));
    
    cart = [];
    appliedCoupon = null;
    updateCart();
    closeCart();
    
    showToast('🎉 تم إرسال طلبك بنجاح!', 'success');
    showPage('orders');

    setTimeout(() => updateOrderStatus(newOrder.id, 'shipping'), 15000);
    setTimeout(() => updateOrderStatus(newOrder.id, 'delivered'), 30000);
}

function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== 'cancelled' && order.status !== 'returned') {
        order.status = newStatus;
        localStorage.setItem('anaqaOrders', JSON.stringify(orders));
        if (document.getElementById('orders-page').classList.contains('active')) {
            renderOrdersPage();
        }
         showToast(`تم تحديث حالة الطلب #${orderId} إلى ${orderStatuses[newStatus].text}`, 'info');
    }
}

function cancelOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if(order && order.status === 'review') {
        order.status = 'cancelled';
        localStorage.setItem('anaqaOrders', JSON.stringify(orders));
        renderOrdersPage();
        showToast('تم إلغاء الطلب.', 'info');
    }
}

function returnOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if(order && order.status === 'delivered') {
        order.status = 'returned';
        localStorage.setItem('anaqaOrders', JSON.stringify(orders));
        renderOrdersPage();
        showToast('تم تسجيل طلب الإرجاع.', 'info');
    }
}

function renderOrdersPage() {
    const container = document.getElementById('orders-list');
    
    if (!currentUser) { // Extra check
        container.innerHTML = '<p class="empty-page-message">يجب تسجيل الدخول لعرض الطلبات.</p>';
        return;
    }

    const userOrders = orders.filter(order => order.userId === currentUser.uid);

    if (userOrders.length === 0) {
        container.innerHTML = '<p class="empty-page-message">ليس لديك أي طلبات حاليًا.</p>';
        return;
    }
    container.innerHTML = userOrders.map(order => {
        const statusInfo = orderStatuses[order.status] || {text: 'غير معروف', class: ''};
        const itemsSummary = order.items.map(item => `${item.name} (x${item.quantity})`).join('، ');
        
        let actionButtonHTML = '';
        if(order.status === 'review') {
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
            </div>
        `;
    }).join('');
}


// =================================================================
// 9. WISHLIST LOGIC (Protected)
// =================================================================
function toggleWishlist(productId) {
    // PROTECTED ACTION
    if (!currentUser) {
        showToast('يجب عليك تسجيل الدخول أولاً للإضافة إلى المفضلة.', 'info');
        openAuthModal();
        return; // Stop the function
    }

    const index = wishlist.indexOf(productId);
    if(index > -1) {
        wishlist.splice(index, 1);
        showToast('تمت الإزالة من المفضلة 🤍', 'info');
    } else {
        wishlist.push(productId);
        showToast('أُضيف إلى المفضلة ♥️', 'info');
    }
    localStorage.setItem('anaqaWishlist', JSON.stringify(wishlist));
    updateWishlistState();
    if(document.getElementById('wishlist-page').classList.contains('active')) {
        renderWishlistPage();
    }
}

function updateWishlistState() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const productId = parseInt(btn.dataset.productId);
        if(productId) btn.classList.toggle('liked', wishlist.includes(productId));
    });
}

function renderWishlistPage() {
    const likedProducts = allProducts.filter(p => wishlist.includes(p.id));
    renderProducts(likedProducts, document.getElementById('wishlist-grid'));
}


// =================================================================
// 10. GLOBAL EVENT HANDLER & TOASTS (Unchanged)
// =================================================================
function handleGlobalClick(e) {
    const target = e.target;
    let targetBtn;

    // Page navigation
    const navLink = target.closest('[data-page]');
    if (navLink) {
        e.preventDefault();
        showPage(navLink.dataset.page);
    }
    
    // Wishlist button
    if ((targetBtn = target.closest('.wishlist-btn'))) {
        const productId = parseInt(targetBtn.dataset.productId);
        if(productId) toggleWishlist(productId);
    } 
    // Add to cart button
    else if ((targetBtn = target.closest('.add-to-cart-btn'))) {
        const productId = parseInt(targetBtn.dataset.productId);
        if(productId) addToCart(productId);
    } 
    // Product card image/name click
    else if (target.closest('.product-main-image, .product-name-link')) {
        const productId = parseInt(target.closest('.product-card').dataset.productId);
        if(productId) openProductModal(productId);
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
        const cartProductId = parseInt(cartControl.dataset.id);
        if (cartControl.classList.contains('quantity-btn')) {
            const change = parseInt(cartControl.dataset.change);
            const item = cart.find(i => i.id === cartProductId);
            if (item) {
                item.quantity += change;
                if (item.quantity <= 0) cart = cart.filter(i => i.id !== cartProductId);
                updateCart();
            }
        } else { // Remove button
            cart = cart.filter(i => i.id !== cartProductId);
            showToast('تم حذف المنتج من السلة', 'info');
            updateCart();
        }
    }
    // Product Detail Gallery Thumbnail
    const thumbnail = target.closest('.thumbnail');
    if (thumbnail) {
         document.getElementById('main-product-image').src = thumbnail.dataset.imgSrc;
         document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
         thumbnail.classList.add('active');
    }
    // Order action buttons
    const orderActionBtn = target.closest('.action-button-order');
    if(orderActionBtn){
         const orderId = parseInt(orderActionBtn.dataset.orderId);
         if(orderActionBtn.classList.contains('cancel')) cancelOrder(orderId);
         else if(orderActionBtn.classList.contains('return')) returnOrder(orderId);
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}