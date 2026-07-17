
const BACKEND_URL = window.location.hostname === 'zaphera-coftan-pro-1.onrender.com' 
  ? 'https://zaphera-coftan-pro-1-m.onrender.com' 
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') 
    ? 'http://localhost:5000' 
    : '';
let ORDERS=[];
let PRODUCTS=[];
let CUSTOMERS=[];
let WILAYAS_DATA=[];
let REVENUE=[];

async function loadProductsFromAPI() {
  try {
    const res = await fetch(BACKEND_URL + '/api/products');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend server unreachable, falling back to local fallback products', err);
  }
  return [
    { id: "caftan-zahia", name: 'قفطان "لالة زاهية"', price: 48000, tag: "جديد", image: "assets/caftan-zahia.png" },
    { id: "karakou-velvet", name: "كراكو مخمل ذهبي", price: 62000, tag: "الأكثر رواجاً", image: "assets/karakou-velvet.png" }
  ];
}
const WILAYAS_LIST=['أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار','البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر','الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة','قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة','وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي','خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تيموشنت','غرداية','غليزان','المغير','المنيعة','أولاد جلال','برج باجي مختار','بني عباس','تيميمون','تقرت','جانت','عين صالح','عين قزام'];

async function loadOrders() {
  try {
    const res = await fetch(BACKEND_URL + '/api/orders');
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data.orders || []);
    }
  } catch (err) {
    console.warn('Backend server unreachable, falling back to local storage', err);
  }
  return JSON.parse(localStorage.getItem('zf_orders') || '[]');
}

window.addEventListener('DOMContentLoaded',async ()=>{
  document.getElementById('currentDate').textContent=new Date().toLocaleDateString('ar-DZ',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const sel=document.getElementById('wilayaSelect');
  if(sel) {
    WILAYAS_LIST.forEach(w=>{const o=document.createElement('option');o.textContent=w;sel.appendChild(o);});
  }
  
  PRODUCTS = await loadProductsFromAPI();
  ORDERS = await loadOrders();
  renderOrders(ORDERS);
  renderProducts();
  updateDashboardStats();
  await loadStoreSettings();

  // Background refresh polling every 8 seconds to automatically show new orders
  setInterval(async () => {
    try {
      const freshOrders = await loadOrders();
      if (freshOrders.length !== ORDERS.length) {
        console.log('🔄 New orders detected via background polling. Refreshing stats & order table.');
        ORDERS = freshOrders;
        renderOrders(ORDERS);
        updateDashboardStats();
      }
    } catch (err) {
      console.warn('Background update fetch failed:', err);
    }
  }, 8000);
});

function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar && backdrop) {
    const isOpen = sidebar.classList.toggle('open');
    if (isOpen) {
      backdrop.classList.add('active');
    } else {
      backdrop.classList.remove('active');
    }
  }
}

function showPage(id,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  el.classList.add('active');
  if(id==='analytics')setTimeout(()=>renderChart('analyticsChart'),50);

  // Auto-close sidebar on mobile
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }
}

async function loadStoreSettings() {
  try {
    const res = await fetch(BACKEND_URL + '/api/settings');
    if (res.ok) {
      const s = await res.json();
      // Store Info
      if (document.getElementById('cfgStoreName')) document.getElementById('cfgStoreName').value = s.storeName || '';
      if (document.getElementById('cfgWhatsappNumber')) document.getElementById('cfgWhatsappNumber').value = s.whatsappNumber || '';
      if (document.getElementById('cfgStoreEmail')) document.getElementById('cfgStoreEmail').value = s.email || '';
      if (document.getElementById('cfgStoreDesc')) document.getElementById('cfgStoreDesc').value = s.description || '';
      
      // Shipping Info
      if (document.getElementById('cfgShippingCost')) document.getElementById('cfgShippingCost').value = s.shippingCost || 400;
      if (document.getElementById('cfgDeliveryTime')) document.getElementById('cfgDeliveryTime').value = s.deliveryTime || '3 - 5 أيام عمل';
      if (document.getElementById('cfgShippingCompany')) document.getElementById('cfgShippingCompany').value = s.shippingCompany || 'Yalidine';
      
      // Google Sheets
      if (document.getElementById('cfgGoogleEmail')) document.getElementById('cfgGoogleEmail').value = s.googleEmail || '';
      if (document.getElementById('cfgGooglePrivateKey')) document.getElementById('cfgGooglePrivateKey').value = s.googlePrivateKey || '';
      if (document.getElementById('cfgGoogleSpreadsheetId')) document.getElementById('cfgGoogleSpreadsheetId').value = s.googleSpreadsheetId || '';
      
      // Pixels
      if (document.getElementById('cfgMetaPixelId')) document.getElementById('cfgMetaPixelId').value = s.metaPixelId || '';
      if (document.getElementById('cfgMetaAccessToken')) document.getElementById('cfgMetaAccessToken').value = s.metaAccessToken || '';
      if (document.getElementById('cfgTiktokPixelId')) document.getElementById('cfgTiktokPixelId').value = s.tiktokPixelId || '';
      if (document.getElementById('cfgTiktokAccessToken')) document.getElementById('cfgTiktokAccessToken').value = s.tiktokAccessToken || '';
      if (document.getElementById('cfgSnapPixelId')) document.getElementById('cfgSnapPixelId').value = s.snapPixelId || '';
      if (document.getElementById('cfgSnapAccessToken')) document.getElementById('cfgSnapAccessToken').value = s.snapAccessToken || '';
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

async function updateSettingsAPI(data, successMessage) {
  try {
    const res = await fetch(BACKEND_URL + '/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      alert('✅ ' + successMessage);
      await loadStoreSettings();
    } else {
      const err = await res.json();
      alert('❌ فشل الحفظ: ' + (err.error || 'خطأ غير معروف'));
    }
  } catch (err) {
    console.error('Failed to save settings:', err);
    alert('❌ فشل الاتصال بالخادم لحفظ الإعدادات');
  }
}

function saveStoreSettings() {
  const data = {
    storeName: document.getElementById('cfgStoreName').value.trim(),
    whatsappNumber: document.getElementById('cfgWhatsappNumber').value.trim(),
    email: document.getElementById('cfgStoreEmail').value.trim(),
    description: document.getElementById('cfgStoreDesc').value.trim()
  };
  updateSettingsAPI(data, 'تم حفظ معلومات المتجر بنجاح!');
}

function saveShippingSettings() {
  const data = {
    shippingCost: Number(document.getElementById('cfgShippingCost').value) || 0,
    deliveryTime: document.getElementById('cfgDeliveryTime').value,
    shippingCompany: document.getElementById('cfgShippingCompany').value
  };
  updateSettingsAPI(data, 'تم حفظ إعدادات الشحن بنجاح!');
}

function saveGoogleSettings() {
  const data = {
    googleEmail: document.getElementById('cfgGoogleEmail').value.trim(),
    googlePrivateKey: document.getElementById('cfgGooglePrivateKey').value.trim(),
    googleSpreadsheetId: document.getElementById('cfgGoogleSpreadsheetId').value.trim()
  };
  updateSettingsAPI(data, 'تم حفظ إعدادات Google Sheets بنجاح!');
}

function savePixelSettings() {
  const data = {
    metaPixelId: document.getElementById('cfgMetaPixelId').value.trim(),
    metaAccessToken: document.getElementById('cfgMetaAccessToken').value.trim(),
    tiktokPixelId: document.getElementById('cfgTiktokPixelId').value.trim(),
    tiktokAccessToken: document.getElementById('cfgTiktokAccessToken').value.trim(),
    snapPixelId: document.getElementById('cfgSnapPixelId').value.trim(),
    snapAccessToken: document.getElementById('cfgSnapAccessToken').value.trim()
  };
  updateSettingsAPI(data, 'تم حفظ إعدادات البيكسل بنجاح!');
}

function renderOrders(data){
  const sm={pending:'<span class="badge pending">⏳ معلّق</span>',confirmed:'<span class="badge confirmed">✅ مؤكّد</span>',shipped:'<span class="badge shipped">🚚 شحن</span>',delivered:'<span class="badge delivered">📬 مُسلَّم</span>',cancelled:'<span class="badge cancelled">❌ ملغي</span>'};
  document.getElementById('ordersBody').innerHTML=data.map(o=>`<tr><td><span class="order-id">#${o.id}</span></td><td><strong>${o.name}</strong></td><td style="direction:ltr;text-align:right;">${o.phone}</td><td><span class="wilaya-chip">${o.wilaya}</span></td><td style="font-size:.8rem;">${o.product}</td><td><strong>${o.amount.toLocaleString()} دج</strong></td><td>${sm[o.status]}</td><td style="font-size:.75rem;color:var(--text2);">${o.date}</td><td><div style="display:flex;gap:6px;"><button class="btn btn-outline" style="padding:5px 10px;font-size:.7rem;" onclick="changeStatus('${o.id}')">تعديل</button><a href="https://wa.me/${o.phone.replace(/\s/g,'').replace(/^0/,'213')}" target="_blank" class="btn btn-gold" style="padding:5px 10px;font-size:.7rem;text-decoration:none;">واتساب</a></div></td></tr>`).join('');
}

function filterOrders(status,btn){
  document.querySelectorAll('.tab-bar .tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  renderOrders(status==='all'?ORDERS:ORDERS.filter(o=>o.status===status));
}

async function changeStatus(id){
  const o=ORDERS.find(x=>x.id===id);if(!o)return;
  const s=['pending','confirmed','shipped','delivered','cancelled'];
  const newStatus = s[(s.indexOf(o.status)+1)%s.length];
  o.status = newStatus;
  
  try {
    const res = await fetch(BACKEND_URL + '/api/orders/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ id, status: newStatus })
    });
    if (res.ok) {
      console.log('Order status updated on server');
    } else {
      throw new Error('Server update failed');
    }
  } catch (err) {
    console.warn('Backend server unreachable, falling back to local storage', err);
    localStorage.setItem('zf_orders', JSON.stringify(ORDERS));
  }
  
  renderOrders(ORDERS);
  updateDashboardStats();
}

async function clearAllOrders() {
  if (confirm('⚠️ هل أنت متأكد من رغبتك في حذف جميع الطلبيات نهائياً؟')) {
    ORDERS = [];
    
    try {
      const res = await fetch(BACKEND_URL + '/api/orders/clear', { method: 'POST' });
      if (res.ok) {
        console.log('Orders cleared on server');
      } else {
        throw new Error('Server clear failed');
      }
    } catch (err) {
      console.warn('Backend server unreachable, falling back to local storage', err);
      localStorage.removeItem('zf_orders');
    }
    
    renderOrders(ORDERS);
    updateDashboardStats();
    alert('✅ تم مسح جميع الطلبيات بنجاح!');
  }
}

async function addOrder(){
  const name = document.getElementById('mAddName').value.trim();
  const phone = document.getElementById('mAddPhone').value.trim();
  const wilaya = document.getElementById('wilayaSelect').value;
  const commune = document.getElementById('mAddCommune').value.trim();
  const address = document.getElementById('mAddAddress').value.trim();
  const product = document.getElementById('mAddProduct').value;
  const amount = Number(document.getElementById('mAddAmount').value) || 0;
  const status = document.getElementById('mAddStatus').value;
  
  if(!name || !phone || !wilaya) {
    alert('⚠️ يرجى ملء الاسم الكامل، رقم الهاتف، واختيار الولاية');
    return;
  }
  
  const orderId = 'ZF-' + Math.floor(1000 + Math.random() * 9000);
  const newOrder = {
    id: orderId,
    name,
    phone,
    wilaya,
    product,
    amount,
    status,
    date: new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' })
  };
  
  ORDERS.unshift(newOrder);
  
  try {
    const res = await fetch(BACKEND_URL + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(newOrder)
    });
    if (res.ok) {
      console.log('Manual order saved to server');
    } else {
      throw new Error('Server save failed');
    }
  } catch (err) {
    console.warn('Backend server unreachable, falling back to local storage', err);
    localStorage.setItem('zf_orders', JSON.stringify(ORDERS));
  }
  
  document.getElementById('addOrderModal').classList.remove('open');
  // Reset fields
  document.getElementById('mAddName').value = '';
  document.getElementById('mAddPhone').value = '';
  document.getElementById('mAddCommune').value = '';
  document.getElementById('mAddAddress').value = '';
  document.getElementById('mAddAmount').value = '';
  
  renderOrders(ORDERS);
  updateDashboardStats();
  alert('✅ تم إضافة وحفظ الطلب بنجاح!');
}

function updateDashboardStats() {
  const activeOrders = ORDERS.filter(o => o.status !== 'cancelled');
  const revenue = activeOrders.reduce((sum, o) => sum + Number(o.amount), 0);
  const totalCount = ORDERS.length;
  const pendingCount = ORDERS.filter(o => o.status === 'pending').length;
  
  const uniquePhones = new Set(ORDERS.map(o => o.phone));
  const customerCount = uniquePhones.size;

  const kpiRevenue = document.getElementById('kpiRevenue');
  const kpiOrders = document.getElementById('kpiOrders');
  const kpiCustomers = document.getElementById('kpiCustomers');
  const kpiPending = document.getElementById('kpiPending');

  if (kpiRevenue) kpiRevenue.innerHTML = `${revenue.toLocaleString()}<span style="font-size:.9rem;color:var(--gold);"> دج</span>`;
  if (kpiOrders) kpiOrders.textContent = totalCount;
  if (kpiCustomers) kpiCustomers.textContent = customerCount;
  if (kpiPending) kpiPending.textContent = pendingCount;

  const ordersPageSub = document.getElementById('ordersPageSub');
  if (ordersPageSub) {
    ordersPageSub.textContent = `${totalCount} طلب إجمالاً — ${pendingCount} معلّق`;
  }

  const tabAll = document.querySelector('.tab-bar button:nth-child(1)');
  const tabPending = document.querySelector('.tab-bar button:nth-child(2)');
  const tabConfirmed = document.querySelector('.tab-bar button:nth-child(3)');
  const tabShipped = document.querySelector('.tab-bar button:nth-child(4)');
  const tabDelivered = document.querySelector('.tab-bar button:nth-child(5)');
  const tabCancelled = document.querySelector('.tab-bar button:nth-child(6)');

  if (tabAll) tabAll.textContent = `الكل (${totalCount})`;
  if (tabPending) tabPending.textContent = `⏳ معلّقة (${ORDERS.filter(o => o.status === 'pending').length})`;
  if (tabConfirmed) tabConfirmed.textContent = `✅ مؤكّدة (${ORDERS.filter(o => o.status === 'confirmed').length})`;
  if (tabShipped) tabShipped.textContent = `🚚 في الشحن (${ORDERS.filter(o => o.status === 'shipped').length})`;
  if (tabDelivered) tabDelivered.textContent = `📬 مُسلَّمة (${ORDERS.filter(o => o.status === 'delivered').length})`;
  if (tabCancelled) tabCancelled.textContent = `❌ ملغاة (${ORDERS.filter(o => o.status === 'cancelled').length})`;
  
  const sidebarBadge = document.querySelector('.nav-badge');
  if (sidebarBadge) sidebarBadge.textContent = pendingCount;
  
  const customersMap = {};
  ORDERS.forEach(o => {
    if (!customersMap[o.phone]) {
      customersMap[o.phone] = {
        name: o.name,
        phone: o.phone,
        wilaya: o.wilaya,
        orders: 0,
        spent: 0,
        last: o.date
      };
    }
    const c = customersMap[o.phone];
    c.orders += 1;
    if (o.status !== 'cancelled') c.spent += Number(o.amount);
    c.last = o.date;
  });

  const CUSTOMERS_LIST = Object.values(customersMap);
  const customersBody = document.getElementById('customersBody');
  if (customersBody) {
    customersBody.innerHTML = CUSTOMERS_LIST.map((c, i) => `
      <tr>
        <td style="color:var(--text2);">${i+1}</td>
        <td><strong>${c.name}</strong></td>
        <td style="direction:ltr;text-align:right;font-size:.82rem;">${c.phone}</td>
        <td><span class="wilaya-chip">${c.wilaya}</span></td>
        <td style="text-align:center;font-weight:700;color:var(--gold);">${c.orders}</td>
        <td><strong>${c.spent.toLocaleString()} دج</strong></td>
        <td style="font-size:.75rem;color:var(--text2);">${c.last}</td>
      </tr>
    `).join('');
  }

  const sortedCustomers = [...CUSTOMERS_LIST].sort((a,b) => b.spent - a.spent).slice(0, 4);
  const bestCustomersCard = document.querySelector('.dash-grid-3 .card:nth-child(1)');
  if (bestCustomersCard) {
    bestCustomersCard.innerHTML = `
      <div class="card-head"><div class="card-title">👑 أفضل العميلات</div></div>
      ${sortedCustomers.length === 0 ? '<div style="text-align:center;padding:40px 0;color:var(--text2);font-size:.85rem;">لا توجد عميلات حالياً</div>' : sortedCustomers.map(c => `
        <div class="client-row">
          <div class="client-av">${c.name.charAt(0)}</div>
          <div>
            <div class="client-name">${c.name}</div>
            <div class="client-orders">${c.orders} طلبات — ${c.wilaya}</div>
          </div>
          <div class="client-spent">${c.spent.toLocaleString()} دج</div>
        </div>
      `).join('')}
    `;
  }
}

function renderProducts() {
  const container = document.getElementById('productsGrid');
  if (!container) return;
  
  const productsCountEl = document.querySelector('#page-products div div div:nth-child(2)');
  if (productsCountEl) {
    productsCountEl.textContent = `${PRODUCTS.length} منتجات نشطة`;
  }
  
  container.innerHTML = PRODUCTS.map(p => {
    const mainImg = p.image || 'assets/caftan-zahia.png';
    const tagText = p.tag ? `<span class="prod-stock in" style="margin-top:0; margin-right:8px;">${p.tag}</span>` : '';
    const oldPriceText = p.oldPrice ? `<span style="text-decoration:line-through; font-size:0.75rem; color:var(--text2); margin-right:8px;">${p.oldPrice.toLocaleString()} دج</span>` : '';
    
    return `
      <div class="prod-card" style="display:flex; flex-direction:column; justify-content:space-between; height:100%;">
        <div>
          <div class="prod-img" style="background-image:url('${mainImg}'); background-size:cover; background-position:center; height:180px;"></div>
          <div class="prod-info">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
              <div class="prod-name" style="margin-bottom:0; font-weight:700;">${p.name}</div>
              ${tagText}
            </div>
            <div style="font-size:0.75rem; color:var(--text2); margin-bottom:8px; direction:ltr; text-align:right;">${p.id}</div>
            <div class="prod-price">${p.price.toLocaleString()} دج ${oldPriceText}</div>
            <div class="prod-sold" style="margin-top:8px;">🎯 تم بيع ${p.sold || 0} وحدة</div>
            <div style="font-size:0.72rem; color:var(--text2); margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              📂 الأقسام: ${p.grids ? p.grids.join(', ') : 'بدون'}
            </div>
          </div>
        </div>
        <div style="padding:14px; border-top:1px solid rgba(255,255,255,0.04); display:flex; gap:8px;">
          <button class="btn btn-outline" style="flex:1; padding:6px 10px; font-size:0.78rem;" onclick="openEditProductModal('${p.id}')">✏️ تعديل</button>
          <button class="btn btn-outline" style="flex:1; padding:6px 10px; font-size:0.78rem; border-color:var(--red); color:var(--red);" onclick="deleteProduct('${p.id}')">🗑️ حذف</button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddProductModal() {
  document.getElementById('productModalTitle').querySelector('span').textContent = '👑 إضافة منتج جديد';
  document.getElementById('mProdIdHidden').value = '';
  document.getElementById('mProdId').value = '';
  document.getElementById('mProdId').disabled = false;
  document.getElementById('mProdSku').value = '';
  document.getElementById('mProdSlug').value = '';
  document.getElementById('mProdPriority').value = '0';
  document.getElementById('mProdName').value = '';
  document.getElementById('mProdNameFr').value = '';
  document.getElementById('mProdPrice').value = '';
  document.getElementById('mProdOldPrice').value = '';
  document.getElementById('mProdCost').value = '';
  document.getElementById('mProdImage').value = 'assets/caftan-zahia.png';
  document.getElementById('mProdTag').value = '';
  document.getElementById('mProdTagFr').value = '';
  document.getElementById('mProdImages').value = '';
  document.getElementById('mProdDesc').value = '';
  document.getElementById('mProdDescFr').value = '';
  
  document.getElementById('mProdIsLandingPage').checked = false;
  document.getElementById('mProdIsDigital').checked = false;
  document.getElementById('mProdDigitalCode').value = '';
  document.getElementById('digitalGroup').style.display = 'none';
  
  document.getElementById('mProdPixelType').value = 'none';
  document.getElementById('mProdPixelId').value = '';
  document.getElementById('mProdFakeViewers').value = '12';
  document.getElementById('mProdFakeOrders').value = '248';

  document.querySelectorAll('input[name="mProdGrids"]').forEach(cb => cb.checked = false);
  document.getElementById('addProductModal').classList.add('open');
}

function openEditProductModal(productId) {
  const p = PRODUCTS.find(item => item.id === productId);
  if (!p) return;
  
  document.getElementById('productModalTitle').querySelector('span').textContent = '✏️ تعديل منتج: ' + p.name;
  document.getElementById('mProdIdHidden').value = p.id;
  document.getElementById('mProdId').value = p.id;
  document.getElementById('mProdId').disabled = true;
  document.getElementById('mProdSku').value = p.sku || '';
  document.getElementById('mProdSlug').value = p.slug || '';
  document.getElementById('mProdPriority').value = p.priority || '0';
  document.getElementById('mProdName').value = p.name || '';
  document.getElementById('mProdNameFr').value = p.name_fr || '';
  document.getElementById('mProdPrice').value = p.price || '';
  document.getElementById('mProdOldPrice').value = p.oldPrice || '';
  document.getElementById('mProdCost').value = p.cost || '';
  document.getElementById('mProdImage').value = p.image || '';
  document.getElementById('mProdTag').value = p.tag || '';
  document.getElementById('mProdTagFr').value = p.tag_fr || '';
  document.getElementById('mProdImages').value = p.images ? p.images.join(', ') : '';
  document.getElementById('mProdDesc').value = p.desc || '';
  document.getElementById('mProdDescFr').value = p.desc_fr || '';
  
  document.getElementById('mProdIsLandingPage').checked = !!p.isLandingPage;
  document.getElementById('mProdIsDigital').checked = !!p.isDigital;
  document.getElementById('mProdDigitalCode').value = p.digitalCode || '';
  document.getElementById('digitalGroup').style.display = p.isDigital ? 'block' : 'none';
  
  document.getElementById('mProdPixelType').value = p.pixelType || 'none';
  document.getElementById('mProdPixelId').value = p.pixelId || '';
  document.getElementById('mProdFakeViewers').value = p.fakeViewers || '12';
  document.getElementById('mProdFakeOrders').value = p.fakeOrders || '248';
  
  document.querySelectorAll('input[name="mProdGrids"]').forEach(cb => {
    cb.checked = p.grids ? p.grids.includes(cb.value) : false;
  });
  
  document.getElementById('addProductModal').classList.add('open');
}

function closeProductModal() {
  document.getElementById('addProductModal').classList.remove('open');
}

async function saveProductForm() {
  const idHidden = document.getElementById('mProdIdHidden').value;
  const id = document.getElementById('mProdId').value.trim();
  const sku = document.getElementById('mProdSku').value.trim();
  const slug = document.getElementById('mProdSlug').value.trim();
  const priority = Number(document.getElementById('mProdPriority').value) || 0;
  const name = document.getElementById('mProdName').value.trim();
  const name_fr = document.getElementById('mProdNameFr').value.trim();
  const price = Number(document.getElementById('mProdPrice').value) || 0;
  const oldPriceVal = document.getElementById('mProdOldPrice').value.trim();
  const oldPrice = oldPriceVal ? Number(oldPriceVal) : null;
  const cost = Number(document.getElementById('mProdCost').value) || 0;
  const image = document.getElementById('mProdImage').value.trim();
  const tag = document.getElementById('mProdTag').value.trim();
  const tag_fr = document.getElementById('mProdTagFr').value.trim();
  const imagesStr = document.getElementById('mProdImages').value.trim();
  const images = imagesStr ? imagesStr.split(',').map(s => s.trim()) : [];
  const desc = document.getElementById('mProdDesc').value.trim();
  const desc_fr = document.getElementById('mProdDescFr').value.trim();
  
  const isLandingPage = document.getElementById('mProdIsLandingPage').checked;
  const isDigital = document.getElementById('mProdIsDigital').checked;
  const digitalCode = document.getElementById('mProdDigitalCode').value.trim();
  
  const pixelType = document.getElementById('mProdPixelType').value;
  const pixelId = document.getElementById('mProdPixelId').value.trim();
  const fakeViewers = Number(document.getElementById('mProdFakeViewers').value) || 12;
  const fakeOrders = Number(document.getElementById('mProdFakeOrders').value) || 248;
  
  const grids = [];
  document.querySelectorAll('input[name="mProdGrids"]:checked').forEach(cb => {
    grids.push(cb.value);
  });
  
  if (!id || !name || !price) {
    alert('⚠️ يرجى ملء حقول المعرف (ID)، اسم المنتج، والسعر!');
    return;
  }
  
  const payload = {
    id, sku, slug, priority, name, name_fr, price, oldPrice, cost, image, images, grids, desc, desc_fr,
    isLandingPage, isDigital, digitalCode, pixelType, pixelId, fakeViewers, fakeOrders
  };
  
  const isEdit = idHidden !== '';
  const url = isEdit ? BACKEND_URL + '/api/products/' + idHidden : BACKEND_URL + '/api/products';
  const method = isEdit ? 'PUT' : 'POST';
  
  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      alert(isEdit ? '✅ تم تعديل المنتج والخيارات بنجاح!' : '✅ تم إضافة المنتج والخيارات بنجاح!');
      PRODUCTS = await loadProductsFromAPI();
      renderProducts();
      closeProductModal();
    } else {
      const errData = await res.json();
      alert('❌ فشل حفظ المنتج: ' + (errData.error || 'خطأ غير معروف'));
    }
  } catch (err) {
    console.error('Save product error:', err);
    alert('❌ خطأ في الاتصال بالخادم!');
  }
}

async function deleteProduct(productId) {
  if (!confirm('⚠️ هل أنتِ متأكدة من حذف هذا المنتج نهائياً؟')) return;
  
  try {
    const res = await fetch(BACKEND_URL + '/api/products/' + productId, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      alert('✅ تم حذف المنتج بنجاح!');
      PRODUCTS = await loadProductsFromAPI();
      renderProducts();
    } else {
      const errData = await res.json();
      alert('❌ فشل حذف المنتج: ' + (errData.error || 'خطأ غير معروف'));
    }
  } catch (err) {
    console.error('Delete product error:', err);
    alert('❌ خطأ في الاتصال بالخادم!');
  }
}

function renderWilayas(){}
function renderChart(id){}
