
let ORDERS=[];
const PRODUCTS=[{emoji:'👘',name:'القفطان الملكي الذهبي',price:18500,sold:0,stock:'in',stockLabel:'متوفر'},{emoji:'🌸',name:'كراكو السهرة الفضي',price:12000,sold:0,stock:'in',stockLabel:'متوفر'},{emoji:'💍',name:'فستان الزفاف الأبيض',price:35000,sold:0,stock:'low',stockLabel:'مخزون منخفض'},{emoji:'🌙',name:'القفطان الأسود المطرز',price:22000,sold:0,stock:'in',stockLabel:'متوفر'},{emoji:'✨',name:'كراكو التراث الجزائري',price:9800,sold:0,stock:'in',stockLabel:'متوفر'},{emoji:'🌺',name:'قفطان الربيع المنقوش',price:14500,sold:0,stock:'low',stockLabel:'مخزون منخفض'},{emoji:'👑',name:'القفطان الإمبراطوري',price:45000,sold:0,stock:'in',stockLabel:'متوفر'},{emoji:'🌟',name:'كراكو الليلة البيضاء',price:16800,sold:0,stock:'out',stockLabel:'نفد المخزون'}];
let CUSTOMERS=[];
let WILAYAS_DATA=[];
let REVENUE=[];
const WILAYAS_LIST=['أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار','البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر','الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة','قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة','وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي','خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تيموشنت','غرداية','غليزان','المغير','المنيعة','أولاد جلال','برج باجي مختار','بني عباس','تيميمون','تقرت','جانت','عين صالح','عين قزام'];

async function loadOrders() {
  try {
    const res = await fetch('/api/orders');
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
  
  ORDERS = await loadOrders();
  renderOrders(ORDERS);
  renderProducts();
  updateDashboardStats();
});

function showPage(id,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  el.classList.add('active');
  if(id==='analytics')setTimeout(()=>renderChart('analyticsChart'),50);
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
    const res = await fetch('/api/orders/update-status', {
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
      const res = await fetch('/api/orders/clear', { method: 'POST' });
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
    const res = await fetch('/api/orders', {
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

function renderProducts(){document.getElementById('productsGrid').innerHTML=PRODUCTS.map(p=>`<div class="prod-card"><div class="prod-img">${p.emoji}</div><div class="prod-info"><div class="prod-name">${p.name}</div><div class="prod-price">${p.price.toLocaleString()} دج</div><div class="prod-sold">تم بيع ${p.sold} وحدة</div><span class="prod-stock ${p.stock}">${p.stockLabel}</span></div></div>`).join('');}
function renderWilayas(){}
function renderChart(id){}
