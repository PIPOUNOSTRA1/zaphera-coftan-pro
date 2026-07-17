
const API_URL = window.CONFIG?.API_URL || (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : '/api');

// Unique event ID generated on page load for browser-to-server deduplication
const pageEventId = 'ZF-EV-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();

// Extract UTM parameters from query string
function getUTMParameters() {
  const params = new URLSearchParams(window.location.search);
  const utms = [];
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
    if (params.get(key)) {
      utms.push(`${key}=${params.get(key)}`);
    }
  });
  return utms.join('&');
}

// Determine customer acquisition source
function getOrderSource() {
  const params = new URLSearchParams(window.location.search);
  return params.get('utm_source') || (document.referrer ? new URL(document.referrer).hostname : 'Direct');
}

// Unified client-side pixel event tracking (Meta, TikTok, Snapchat, GA4)
function trackBrowserEvent(eventName, eventData = {}) {
  const eventId = eventData.event_id || pageEventId;
  const value = eventData.value || 0;

  console.log(`📡 [Browser Pixel] Event: ${eventName} (ID: ${eventId})`, eventData);

  // 1. Meta Pixel
  if (typeof fbq === 'function') {
    fbq('track', eventName, {
      value: value,
      currency: 'DZD',
      ...eventData
    }, { eventID: eventId });
  }

  // 2. TikTok Pixel
  if (typeof ttq === 'function') {
    ttq.track(eventName, {
      value: value,
      currency: 'DZD',
      ...eventData
    }, { event_id: eventId });
  }

  // 3. Snapchat Pixel
  if (typeof snaptr === 'function') {
    let snapEvent = eventName;
    if (eventName === 'Purchase') snapEvent = 'PURCHASE';
    if (eventName === 'PageView') snapEvent = 'PAGE_VIEW';
    if (eventName === 'AddToCart') snapEvent = 'ADD_CART';
    if (eventName === 'InitiateCheckout') snapEvent = 'START_CHECKOUT';

    snaptr('track', snapEvent, {
      price: value,
      currency: 'DZD',
      ...eventData,
      uuid_c1: eventId
    });
  }

  // 4. GA4 (Google Analytics)
  if (typeof gtag === 'function') {
    gtag('event', eventName, {
      value: value,
      currency: 'DZD',
      event_id: eventId,
      ...eventData
    });
  }
}

async function initDynamicPixels() {
  try {
    const res = await fetch(API_URL + '/settings');
    if (!res.ok) {
      trackBrowserEvent('PageView');
      return;
    }
    const settings = await res.json();
    
    // 1. Meta Pixel
    if (settings.metaPixelId) {
      console.log('Initializing Meta Pixel:', settings.metaPixelId);
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      fbq('init', settings.metaPixelId);
    }
    
    // 2. TikTok Pixel
    if (settings.tiktokPixelId) {
      console.log('Initializing TikTok Pixel:', settings.tiktokPixelId);
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var e=0;e<ttq.methods.length;e++)ttq.setAndDefer(ttq,ttq.methods[e]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.mixpool;w[t]._i=w[t]._i||{},w[t]._i[e]=[],w[t]._i[e]._u=r,w[t]._t=w[t]._t||+new Date,w[t]._o=w[t]._o||{},w[t]._o[e]=n||{};var a=d.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var i=d.getElementsByTagName("script")[0];i.parentNode.insertBefore(a,i)};
        ttq.load(settings.tiktokPixelId);
        ttq.page();
      }(window, document, 'ttq');
    }
    
    // 3. Snapchat Pixel
    if (settings.snapPixelId) {
      console.log('Initializing Snapchat Pixel:', settings.snapPixelId);
      (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
      {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
      a.queue=[];var s=t.createElement(n);s.async=!0;
      s.src="https://sc-static.net/scevent.min.js";
      var r=t.getElementsByTagName(n)[0];r.parentNode.insertBefore(s,r)}
      )(window,document,"script");
      
      snaptr('init', settings.snapPixelId);
    }
    
    trackBrowserEvent('PageView');
  } catch (err) {
    console.error('Error initializing dynamic pixels:', err);
    trackBrowserEvent('PageView');
  }
}

// Track initial PageView
initDynamicPixels();

// Record visit traffic on server
fetch(`${API_URL}/visit`, { method: 'POST' }).catch(err => console.warn('Failed to track visit on server', err));

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   RUNWAY — real video, scroll-scrubbed.
   ========================================================= */
(function(){
  const wrap    = document.getElementById('runwayWrap');
  const video   = document.getElementById('modelVideo');
  const fill    = document.getElementById('runwayFill');
  const label   = document.getElementById('runwayLabel');
  const eyebrow = document.getElementById('rwEyebrow');
  const rwProg  = document.getElementById('rwProgress');
  if(!wrap || !video) return;

  const stepLabels = [
    '✦ ولادة القطعة من التراث الجزائري العريق',
    '✦ الحرفة اليدوية — صبرٌ يُحوَّل إلى فن',
    '✦ أوجُ الفخامة الجزائرية في كل لحظة',
    '✦ التفصيل الملكي — كل خيط بنيّة وعشق',
    '✦ زاڤيرا تُتوّجكِ — أنتِ البطلة دائمًا'
  ];

  /* ── Force muted ── */
  video.muted = true;
  video.setAttribute('muted','');
  video.load();

  /* ── Unlock once: play then pause so currentTime becomes writable ── */
  let unlocked = false;
  function unlock(){
    if(unlocked) return;
    unlocked = true;
    video.play().then(()=>{ video.pause(); video.currentTime = 0; }).catch(()=>{});
  }
  unlock();
  setTimeout(unlock, 300);
  window.addEventListener('scroll',     unlock, {once:true, passive:true});
  window.addEventListener('click',      unlock, {once:true});
  window.addEventListener('touchstart', unlock, {once:true, passive:true});
  video.addEventListener('canplay',     ()=>{ unlock(); }, {once:true});

  /* ─── One-time entry animation via GSAP ─── */
  if(eyebrow) gsap.fromTo(eyebrow,
    { opacity:0, y:30 },
    { opacity:1, y:0, duration:1.2, ease:'power3.out',
      scrollTrigger:{ trigger:wrap, start:'top 75%', once:true } }
  );
  if(rwProg) gsap.to(rwProg,
    { opacity:1, duration:0.8, delay:0.5,
      scrollTrigger:{ trigger:wrap, start:'top 75%', once:true } }
  );
  if(label) gsap.to(label,
    { opacity:1, duration:0.8, delay:0.5,
      scrollTrigger:{ trigger:wrap, start:'top 75%', once:true } }
  );

  /* ─── Scroll progress 0→1 ─── */
  function computeProgress(){
    const rect  = wrap.getBoundingClientRect();
    const total = wrap.offsetHeight - window.innerHeight;
    if(total <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / total));
  }

  /* ─── Apply all scroll-driven changes ─── */
  function applyProgress(p){

    /* 1 ── VIDEO SEEK — only seek if time change is meaningful */
    const dur = video.duration;
    if(dur > 0){
      const targetTime = p * dur;
      if(Math.abs(video.currentTime - targetTime) > 0.04) {
        try{ video.currentTime = targetTime; }catch(e){}
      }
    }

    /* 2 ── PROGRESS BAR */
    if(fill) fill.style.width = (p * 100).toFixed(1) + '%';

    /* 3 ── STEP LABEL */
    if(label){
      const idx = Math.min(stepLabels.length-1, Math.floor(p * stepLabels.length));
      label.textContent = stepLabels[idx];
    }

    /* 4 ── STEP TITLES cross-fade */
    const STEPS  = 5;
    const active = Math.min(STEPS-1, Math.floor(p * STEPS));
    const frac   = (p * STEPS) - active;

    for(let i = 0; i < STEPS; i++){
      const el = document.getElementById('rwStep' + i);
      if(!el) continue;
      if(i === active){
        const op  = frac < 0.15 ? frac/0.15 : frac > 0.85 ? (1-frac)/0.15 : 1;
        const yPx = frac < 0.15 ? 28*(1-frac/0.15) : frac > 0.85 ? -20*((frac-0.85)/0.15) : 0;
        const sc  = 0.88 + 0.12 * Math.min(op, 1);
        el.style.opacity   = op.toFixed(3);
        el.style.transform = 'translateY('+yPx.toFixed(1)+'px) scale('+sc.toFixed(3)+')';
      } else {
        el.style.opacity   = '0';
        el.style.transform = i < active ? 'translateY(-28px) scale(0.9)' : 'translateY(28px) scale(0.9)';
      }
    }

    /* 5 ── VIDEO zoom + sharpen */
    const scale  = (0.62 + p*0.38).toFixed(3);
    const blur   = Math.max(0, 6 - p*6).toFixed(2);
    const bright = (0.55 + p*0.33).toFixed(3);
    const sat    = (0.80 + p*0.20).toFixed(3);
    const yPct   = (6   - p*6).toFixed(2);
    const tf     = 'scale('+scale+') translateY('+yPct+'%)';
    const fi     = 'blur('+blur+'px) brightness('+bright+') saturate('+sat+')';
    video.style.transform = tf;
    video.style.filter    = fi;
    const img = wrap.querySelector('.runway-figure img');
    if(img){ img.style.transform = tf; img.style.filter = fi; }
  }

  /* ─── RAF loop ─── */
  let latest = 0, smooth = 0;
  window.addEventListener('scroll', ()=>{ latest = computeProgress(); }, {passive:true});
  window.addEventListener('resize', ()=>{ latest = computeProgress(); });
  latest = computeProgress();

  (function tick(){
    smooth += (latest - smooth) * 0.18;
    if(Math.abs(smooth - latest) < 0.0005) smooth = latest;
    applyProgress(smooth);
    requestAnimationFrame(tick);
  })();

})();





/* ---------------- Progress bar ---------------- */
const progress = document.getElementById('progress');
window.addEventListener('scroll', ()=>{
  const h = document.documentElement;
  const pct = h.scrollTop / (h.scrollHeight - h.clientHeight);
  progress.style.transform = `scaleX(${pct})`;
});

/* ---------------- Nav on scroll ---------------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', ()=>{ nav.classList.toggle('scrolled', window.scrollY > 60); });

/* ---------------- Particle "fog" canvas (lightweight, no deps) ---------------- */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let w,h,particles=[];
function resize(){ w=canvas.width=canvas.offsetWidth; h=canvas.height=canvas.offsetHeight; }
window.addEventListener('resize', resize);
resize();
for(let i=0;i<70;i++){
  particles.push({
    x:Math.random()*w, y:Math.random()*h,
    r:Math.random()*1.8+0.4,
    vy:-(Math.random()*0.25+0.05),
    vx:(Math.random()-0.5)*0.1,
    a:Math.random()*0.5+0.1
  });
}
function drawParticles(){
  ctx.clearRect(0,0,w,h);
  particles.forEach(p=>{
    p.y += p.vy; p.x += p.vx;
    if(p.y < -10) { p.y = h+10; p.x = Math.random()*w; }
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = `rgba(201,162,75,${p.a})`;
    ctx.fill();
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

/* ---------------- Hero entrance ---------------- */
const heroTl = gsap.timeline({defaults:{ease:'power3.out'}});
heroTl
  .to('#silhouette',{opacity:1,duration:1.6},0.1)
  .to('.eyebrow',{opacity:1,y:0,duration:.9},0.3)
  .from('.eyebrow',{y:20},0.3)
  .to('.hero h1',{opacity:1,duration:1.1},0.5)
  .from('.hero h1',{y:40},0.5)
  .to('.hero-sub',{opacity:1,duration:1},0.8)
  .from('.hero-sub',{y:20},0.8)
  .to('.hero-cta',{opacity:1,duration:1},1.0)
  .from('.hero-cta',{y:20},1.0)
  .to('.scroll-hint',{opacity:1,duration:1},1.3);

/* Walking woman: silhouette advances & camera-zoom feel while scrolling hero */
gsap.to('#silhouette',{
  scale:1.15, y:-20,
  scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:1 }
});
gsap.to('.hero-fog',{
  opacity:0.4,
  scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:1 }
});

/* ---------------- Reveal-on-scroll (IntersectionObserver — works on file://) ---------------- */
let _revealObserver = null;
function initReveal() {
  if (!_revealObserver) {
    _revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          _revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  }

  // Only observe elements not yet revealed
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    _revealObserver.observe(el);
  });
}
initReveal();

/* ---------------- Chapter rail dots ---------------- */
const chapters = document.querySelectorAll('.chapter, .final-cta');
const rail = document.getElementById('rail');
chapters.forEach((sec,i)=>{
  const dot = document.createElement('div');
  dot.className='rail-dot';
  dot.addEventListener('click',()=>sec.scrollIntoView({behavior:'smooth'}));
  rail.appendChild(dot);
  ScrollTrigger.create({
    trigger:sec, start:'top center', end:'bottom center',
    onToggle:self=>{ if(self.isActive){ document.querySelectorAll('.rail-dot').forEach(d=>d.classList.remove('active')); dot.classList.add('active'); } }
  });
});

/* ---------------- 3D tilt on product cards ---------------- */
function attachTilt(card){
  card.addEventListener('mousemove', e=>{
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width - 0.5;
    const y = (e.clientY - r.top)/r.height - 0.5;
    gsap.to(card,{rotateY:x*10, rotateX:-y*10, duration:.4, ease:'power2.out'});
  });
  card.addEventListener('mouseleave', ()=>{ gsap.to(card,{rotateY:0,rotateX:0,duration:.6,ease:'power3.out'}); });
}

/* ---------------- Translation & Localization Data ---------------- */
const translations = {
  ar: {
    nav_collection: "المجموعة",
    nav_caftan: "القفطان",
    nav_karakou: "الكراكو",
    nav_wedding: "الزفاف",
    nav_reviews: "آراء العميلات",
    eyebrow_sub: "دار أزياء جزائرية فاخرة — تأسست بروح الحرفة الأصيلة",
    hero_title: "أناقة <em>تُروى</em><br>لا تُلبس فقط",
    hero_sub: "قفطان · كراكو · فساتين سهرة وزفاف — قِطع مصنوعة يدويًا لِلحظاتك الاستثنائية",
    hero_cta: "اكتشفي المجموعة ↙",
    scroll_hint: "مرّري للأسفل",
    runway_eyebrow: "تجربة العرض الحي",
    runway_title: "تتقدّم نحوكِ <em>بأناقة القفطان الأسود</em>",
    runway_label_1: "تظهر من بعيد بين الأقواس المغربية",
    runway_label_2: "القفطان الأسود يتقدّم بثقة",
    runway_label_3: "خيوط الذهب تتلألأ مع كل خطوة",
    runway_label_4: "التطريز يتّضح تفصيلاً بتفصيل",
    runway_label_5: "وجهًا لوجه معكِ",
    chapter_1_num: "١",
    chapter_1_title: "حرفة <em>جزائرية</em> بمعايير عالمية",
    chapter_1_desc: "كل قطعة في زاڤيرا كوفتان تُخاط بأيدي حرفيات ماهرات، بخيوط الذهب والحرير، امتدادًا لتراث الأزياء الجزائرية الأصيل — بلمسة عصرية تليق بمناسباتك الأكثر أهمية.",
    stat_experience: "سنة خبرة",
    stat_clients: "عميلة راضية",
    stat_handmade: "صناعة يدوية",
    chapter_2_title: "مجموعة <em>الخريف</em> الجديدة",
    chapter_2_desc: "أحدث إصدارات القفطان والكراكو، مستوحاة من عمارة القصور الأندلسية القديمة.",
    chapter_3_title: "القفطان <em>الملكي</em>",
    chapter_3_desc: "تصاميم قفطان مطرزة يدويًا بخيوط الذهب، لإطلالة تليق بالملكات.",
    chapter_4_title: "الكراكو <em>الجزائري</em> الأصيل",
    chapter_4_desc: "قطعة تراثية خالدة، بقصّة مخملية وتطريز \"الفتلة\" الذهبي التقليدي.",
    chapter_5_title: "مجموعة <em>الزفاف</em>",
    chapter_5_desc: "فساتين زفاف مصممة لليلة العمر، من الحرير الطبيعي والدانتيل الفرنسي.",
    chapter_6_title: "الأكثر <em>طلبًا</em>",
    chapter_6_desc: "القطع التي اخترنها عميلاتنا أكثر من غيرها هذا الموسم.",
    chapter_7_title: "رحلة <em>الحرفة</em>",
    chapter_7_step1_title: "01 — اختيار القماش",
    chapter_7_step1_desc: "ننتقي أجود أنواع الحرير والمخمل من موردين موثوقين، مع فحص دقيق لكل قطعة قماش.",
    chapter_7_step2_title: "02 — الرسم والتصميم",
    chapter_7_step2_desc: "تبدأ كل قطعة برسم يدوي يحدد مسار التطريز والخيوط الذهبية بدقة متناهية.",
    chapter_7_step3_title: "03 — التطريز اليدوي",
    chapter_7_step3_desc: "حرفيات متخصصات يقضين أيامًا في تطريز كل قطعة بتقنية \"الفتلة\" التقليدية.",
    chapter_7_step4_title: "04 — التفصيل والقصّة",
    chapter_7_step4_desc: "قصّة مصممة لتناسب مختلف أشكال الجسم، مع لمسات نهائية تعكس الفخامة.",
    chapter_7_step5_title: "05 — الفحص النهائي",
    chapter_7_step5_desc: "فحص دقيق لكل تفصيل قبل التغليف الفاخر والشحن إليك.",
    chapter_8_title: "قالت <em>عميلاتنا</em>",
    final_cta_eyebrow: "لحظتك الاستثنائية تستحق الأفضل",
    final_cta_title: "اكتشفي مجموعتك <em>الفاخرة</em> اليوم",
    final_cta_desc: "توصيل لجميع الولايات · الدفع عند الاستلام · إرجاع سهل خلال 14 يوم",
    final_cta_btn: "تسوّقي الآن",
    footer_desc: "دار أزياء جزائرية فاخرة متخصصة في القفطان والكراكو وفساتين المناسبات، مصنوعة يدويًا بحب.",
    footer_store: "المتجر",
    footer_care: "العناية",
    footer_guide: "دليل المقاسات",
    footer_shipping: "الشحن والتوصيل",
    footer_returns: "سياسة الإرجاع",
    footer_contact: "تواصلي معنا",
    footer_follow: "تابعينا",
    footer_rights: "© 2026 ZAPHERA COFTAN — جميع الحقوق محفوظة",
    quick_view: "عرض سريع",
    add_to_cart: "أضيفي للسلة",
    cart_title: "سلة المشتريات",
    cart_empty: "سلتك فارغة حالياً. تصفحي المجموعة وأضيفي ما يعجبك.",
    checkout_title: "اتمام الطلب (الدفع عند الاستلام)",
    client_name: "الاسم الكامل *",
    client_phone: "رقم الهاتف *",
    client_wilaya: "الولاية *",
    client_commune: "البلدية *",
    client_address: "العنوان الكامل *",
    desk_delivery: "توصيل للمكتب (Stop Desk) - تكلفة شحن أقل",
    subtotal: "المجموع الفرعي:",
    shipping: "تكلفة الشحن:",
    total: "المجموع الإجمالي:",
    confirm_order: "تأكيد طلبكِ الآن ↙",
    wishlist_title: "المفضلة",
    wishlist_empty: "قائمة المفضلة فارغة حالياً.",
    size_label: "المقاس:",
    custom_size_btn: "تفصيل على المقاس 📏",
    custom_fitting_title: "القياسات المطلوبة (بالسنتيمتر):",
    lbl_chest: "محيط الصدر",
    lbl_waist: "محيط الخصر",
    lbl_hips: "محيط الأوراك",
    lbl_shoulders: "عرض الظهر والكتفين",
    lbl_height: "الطول الكلي",
    custom_fitting_note: "* سيتم التفصيل خصيصاً على مقاسكِ، قد يتطلب الشحن 5-7 أيام إضافية للتفصيل.",
    txt_custom_fitting_note: "* سيتم التفصيل خصيصاً على مقاسكِ، قد يتطلب الشحن 5-7 أيام إضافية للتفصيل.",
    search_placeholder: "ابحثي عن قفطان، كراكو، فستان...",
    toast_added_cart: "تم إضافة المنتج إلى السلة بنجاح.",
    toast_added_wishlist: "تم إضافة المنتج إلى المفضلة.",
    toast_removed_wishlist: "تم إزالة المنتج من المفضلة.",
    toast_view_cart: "عرض السلة",
    toast_order_success: "تم تسجيل طلبكِ بنجاح! سنتصل بكِ قريباً.",
    success_title: "شكراً لطلبكِ الفاخر!",
    success_desc: "تم استلام طلبكِ بنجاح تحت الرقم: ",
    success_note: "سيتصل بكِ فريق مبيعات زاڤيرا خلال 24 ساعة لتأكيد المقاسات وتأكيد الشحن.",
    success_close: "متابعة التسوق",
    invoice_title: "فاتورة الطلب التقديرية",
    invoice_client: "العميلة:",
    invoice_phone: "الهاتف:",
    invoice_wilaya: "الولاية:",
    invoice_address: "العنوان:",
    invoice_delivery: "طريقة التوصيل:",
    invoice_home: "توصيل للمنزل",
    invoice_desk: "توصيل للمكتب (Stop Desk)",
    validation_wilaya: "يرجى اختيار الولاية أولاً لتحديد تكلفة التوصيل.",
    validation_measurements: "يرجى ملء جميع قياسات الجسم لبدء التفصيل المخصص.",
    validation_phone: "يرجى إدخال رقم هاتف صحيح في الجزائر (مثل: 05/06/07).",
    custom_size_badge: "تفصيل خاص",
    add_cart_wishlist: "أضيفي للسلة",
    quick_view_wishlist: "عرض سريع"
  },
  fr: {
    nav_collection: "Collection",
    nav_caftan: "Caftan",
    nav_karakou: "Karakou",
    nav_wedding: "Mariage",
    nav_reviews: "Avis",
    eyebrow_sub: "Maison de haute couture algérienne — Fondée sur l'authenticité de l'artisanat",
    hero_title: "L'élégance qui <em>se raconte</em><br>ne se porte pas seulement",
    hero_sub: "Caftans · Karakous · Robes de soirée et mariée — Pièces faites main pour vos moments exceptionnels",
    hero_cta: "Découvrir la Collection ↙",
    scroll_hint: "Faites défiler",
    runway_eyebrow: "L'expérience Runway",
    runway_title: "Avancer vers vous avec <em>l'élégance du Caftan Noir</em>",
    runway_label_1: "Apparition au loin sous les arches mauresques",
    runway_label_2: "Le Caftan Noir avance avec assurance",
    runway_label_3: "Les fils d'or scintillent à chaque pas",
    runway_label_4: "Les broderies se révèlent détail par détail",
    runway_label_5: "Face à face avec vous",
    chapter_1_num: "I",
    chapter_1_title: "Artisanat <em>Algérien</em>, standards mondiaux",
    chapter_1_desc: "Chaque pièce chez ZAPHERA est cousue par des mains expertes, avec des fils d'or et de soie, héritage d'un savoir-faire algérien authentique avec une touche moderne pour vos événements majeurs.",
    stat_experience: "ans d'expérience",
    stat_clients: "clientes satisfaites",
    stat_handmade: "100% fait main",
    chapter_2_title: "Nouvelle Collection <em>Automne</em>",
    chapter_2_desc: "Les dernières créations de Caftans et Karakous, inspirées de l'architecture andalouse.",
    chapter_3_title: "Le Caftan <em>Royal</em>",
    chapter_3_desc: "Modèles brodés main avec des fils d'or, pour une allure digne des reines.",
    chapter_4_title: "L'authentique <em>Karakou Algérien</em>",
    chapter_4_desc: "Une pièce intemporelle en velours brodé du traditionnel fil doré 'Fetla'.",
    chapter_5_title: "Collection <em>Mariage</em>",
    chapter_5_desc: "Robes de mariée d'exception en soie naturelle et dentelle française.",
    chapter_6_title: "Les Plus <em>Demandés</em>",
    chapter_6_desc: "Les coups de cœur choisis par nos clientes cette saison.",
    chapter_7_title: "Le Voyage de <em>l'Artisanat</em>",
    chapter_7_step1_title: "01 — Choix des Tissus",
    chapter_7_step1_desc: "Sélection rigoureuse des soies et velours de première qualité auprès de fournisseurs certifiés.",
    chapter_7_step2_title: "02 — Dessin & Conception",
    chapter_7_step2_desc: "Chaque création commence par un tracé manuel précisant les motifs de broderie.",
    chapter_7_step3_title: "03 — Broderie à la Main",
    chapter_7_step3_desc: "Nos artisanes passent des jours à broder minutieusement en utilisant la technique 'Fetla'.",
    chapter_7_step4_title: "04 — Coupe & Ajustement",
    chapter_7_step4_desc: "Une coupe haute couture ajustée pour sublimer toutes les silhouettes.",
    chapter_7_step5_title: "05 — Inspection Finale",
    chapter_7_step5_desc: "Contrôle qualité strict avant l'emballage de luxe et l'expédition.",
    chapter_8_title: "Ce qu'elles <em>disent</em> de nous",
    final_cta_eyebrow: "Votre moment d'exception mérite l'excellence",
    final_cta_title: "Découvrez votre collection <em>de luxe</em> aujourd'hui",
    final_cta_desc: "Livraison sur 58 wilayas · Paiement à la livraison · Retours sous 14 jours",
    final_cta_btn: "Acheter maintenant",
    footer_desc: "Maison de couture algérienne de luxe spécialisée dans le Caftan, le Karakou et les robes d'événements, faite main avec amour.",
    footer_store: "Boutique",
    footer_care: "Services",
    footer_guide: "Guide des tailles",
    footer_shipping: "Livraison",
    footer_returns: "Retours",
    footer_contact: "Contactez-nous",
    footer_follow: "Suivez-nous",
    footer_rights: "© 2026 ZAPHERA COFTAN — Tous droits réservés",
    quick_view: "Aperçu rapide",
    add_to_cart: "Ajouter au Panier",
    cart_title: "Votre Panier",
    cart_empty: "Votre panier est vide. Parcourez la collection pour ajouter des pièces.",
    checkout_title: "Finaliser la commande (COD)",
    client_name: "Nom complet *",
    client_phone: "Numéro de téléphone *",
    client_wilaya: "Wilaya *",
    client_commune: "Commune *",
    client_address: "Adresse complète *",
    desk_delivery: "Livraison au bureau (Stop Desk) - Tarif réduit",
    subtotal: "Sous-total :",
    shipping: "Frais de port :",
    total: "Total :",
    confirm_order: "Confirmer ma commande ↙",
    wishlist_title: "Favoris",
    wishlist_empty: "Votre liste de favoris est vide.",
    size_label: "Taille :",
    custom_size_btn: "Sur Mesure 📏",
    custom_fitting_title: "Mesures Requises (en cm) :",
    lbl_chest: "Tour de poitrine",
    lbl_waist: "Tour de taille",
    lbl_hips: "Tour de hanches",
    lbl_shoulders: "Largeur épaules",
    lbl_height: "Hauteur totale",
    custom_fitting_note: "* Confectionné sur mesure pour vous. Comptez 5 à 7 jours supplémentaires pour la fabrication.",
    txt_custom_fitting_note: "* Confectionné sur mesure pour vous. Comptez 5 à 7 jours supplémentaires pour la fabrication.",
    search_placeholder: "Rechercher caftan, karakou, robe...",
    toast_added_cart: "Produit ajouté au panier.",
    toast_added_wishlist: "Produit ajouté aux favoris.",
    toast_removed_wishlist: "Produit retiré des favoris.",
    toast_view_cart: "Voir Panier",
    toast_order_success: "Votre commande a été enregistrée avec succès !",
    success_title: "Merci pour votre confiance !",
    success_desc: "Commande reçue sous le numéro : ",
    success_note: "Notre service client vous contactera sous 24h pour valider vos mesures et confirmer l'expédition.",
    success_close: "Continuer mes achats",
    invoice_title: "Facture Proforma",
    invoice_client: "Cliente :",
    invoice_phone: "Téléphone :",
    invoice_wilaya: "Wilaya :",
    invoice_address: "Adresse :",
    invoice_delivery: "Livraison :",
    invoice_home: "Livraison à domicile",
    invoice_desk: "Livraison au Point Relais (Stop Desk)",
    validation_wilaya: "Veuillez choisir une wilaya pour calculer les frais de livraison.",
    validation_measurements: "Veuillez renseigner toutes vos mensurations pour le sur-mesure.",
    validation_phone: "Veuillez entrer un numéro de téléphone valide en Algérie.",
    custom_size_badge: "Sur-mesure",
    add_cart_wishlist: "Ajouter au panier",
    quick_view_wishlist: "Détails"
  }
};

/* ---------------- Product Database ---------------- */
const productsData = [
  {
    id: 'caftan-zahia',
    name: 'قفطان "لالة زاهية"',
    name_fr: 'Caftan "Lalla Zahia"',
    price: 48000,
    oldPrice: null,
    tag: 'جديد',
    tag_fr: 'Nouveau',
    image: 'assets/caftan-zahia.png',
    grids: ['grid-new', 'grid-caftan', 'grid-best'],
    desc: 'قفطان مخملي (قطيفة) باللون الأخضر الزمردي الملكي، مطرز يدوياً بخيوط الذهب الفاخرة على طول الصدر والأكمام، بتصميم أندلسي راقٍ يجمع بين التراث والمعاصرة.',
    desc_fr: 'Caftan d\'exception en velours vert émeraude royal, brodé manuellement au fil d\'or précieux le long du col et des manches, coupe andalouse royale.'
  },
  {
    id: 'karakou-velvet',
    name: 'كراكو مخمل ذهبي',
    name_fr: 'Karakou Velours Doré',
    price: 62000,
    oldPrice: 75000,
    tag: 'الأكثر رواجاً',
    tag_fr: 'Populaire',
    image: 'assets/karakou-velvet.png',
    grids: ['grid-new', 'grid-karakou', 'grid-best'],
    desc: 'كراكو جزائري تقليدي من المخمل الأزرق الداكن الفاخر، مع سترة مطرزة يدوياً بالفتلة الذهبية الأصلية وسروال شلقة من الحرير الذهبي الانسيابي.',
    desc_fr: 'Karakou algérien traditionnel en velours bleu nuit de prestige, veste cintrée travaillée en Fetla d\'or authentique et seroual chalqa en soie dorée.'
  },
  {
    id: 'dress-star',
    name: 'فستان سهرة "نجمة الليل"',
    name_fr: 'Robe de Soirée "Étoile de Nuit"',
    price: 39500,
    oldPrice: null,
    tag: 'جديد',
    tag_fr: 'Nouveau',
    image: 'assets/dress-star.png',
    grids: ['grid-new', 'grid-best'],
    desc: 'فستان سهرة مستوحى من سحر الليل، مصمم من الحرير الناعم بلون كحلي داكن يتلألأ ببريق ناعم، مع قصة منسدلة ولمسة ذهبية تقليدية مذهلة.',
    desc_fr: 'Robe de soirée inspirée du ciel nocturne, taillée dans de la soie fluide bleu nuit parsemée de reflets, ornée de détails dorés aux épaules.'
  },
  {
    id: 'caftan-alhambra',
    name: 'قفطان "قصر الحمراء"',
    name_fr: 'Caftan "Palais de l\'Alhambra"',
    price: 55000,
    oldPrice: null,
    tag: 'حصري',
    tag_fr: 'Exclusif',
    image: 'assets/caftan-alhambra.png',
    grids: ['grid-new', 'grid-caftan', 'grid-best'],
    desc: 'تحفة فنية تجسد عمارة الأندلس، قفطان بلون عاجي راقٍ وتطريزات ذهبية كثيفة تغطي الأكمام والصدر، مصمم بفتحة أمامية ملكية وحزام عريض.',
    desc_fr: 'Une œuvre d\'art rappelant les palais andalous, caftan ivoire aux broderies denses de fil d\'or royal, doté d\'une traîne gracieuse.'
  },
  {
    id: 'wedding-princess',
    name: 'فستان زفاف "الأميرة"',
    name_fr: 'Robe de Mariée "La Princesse"',
    price: 120000,
    oldPrice: null,
    tag: 'زفاف',
    tag_fr: 'Mariage',
    image: 'assets/wedding-princess.png',
    grids: ['grid-wedding', 'grid-best'],
    desc: 'فستان زفاف ساحر من الدانتيل الفرنسي الفاخر والحرير الطبيعي، مصمم خصيصاً لعروس تبحث عن الفخامة والجاذبية الملكية ليلة العمر.',
    desc_fr: 'Robe de mariée de conte de fées faite de dentelle française et soie pure, idéale pour une mariée à la recherche de l\'éclat impérial.'
  },
  {
    id: 'caftan-hand',
    name: 'قفطان مطرز يدويًا',
    name_fr: 'Caftan Brodé Main',
    price: 41000,
    oldPrice: null,
    tag: null,
    tag_fr: null,
    image: 'assets/caftan-zahia.png',
    grids: ['grid-caftan'],
    desc: 'قفطان خفيف وراقي بتطريزات يدوية ناعمة من مجوهرات وحبات اللؤلؤ على طول الفتحة، مثالي للاستقبالات العائلية والمناسبات الدافئة.',
    desc_fr: 'Caftan léger et raffiné avec de fines broderies artisanales perlées le long de l\'ouverture, idéal pour les réceptions familiales.'
  },
  {
    id: 'caftan-tlemcen',
    name: 'قفطان تلمساني كلاسيك',
    name_fr: 'Caftan Tlemcen Classique',
    price: 49900,
    oldPrice: 58000,
    tag: null,
    tag_fr: null,
    image: 'assets/caftan-alhambra.png',
    grids: ['grid-caftan'],
    desc: 'قفطان مستوحى من اللباس التلمساني العتيق، بنقوش ذهبية واسعة وحزام مذهب تقليدي، يعبر عن أصالة الغرب الجزائري.',
    desc_fr: 'Caftan inspiré du costume traditionnel de Tlemcen, paré de galons dorés et d\'une ceinture dorée ancienne.'
  },
  {
    id: 'karakou-jewel',
    name: 'كراكو "الجوهرة"',
    name_fr: 'Karakou "Le Joyau"',
    price: 67000,
    oldPrice: null,
    tag: 'حصري',
    tag_fr: 'Exclusif',
    image: 'assets/karakou-velvet.png',
    grids: ['grid-karakou'],
    desc: 'سترة كراكو قطيفة ملكية سوداء مطرزة بغزارة بالخرز الذهبي ومسار الفتلة المعقد، مع سروال مدور تقليدي شيك من الحرير الساتاني.',
    desc_fr: 'Veste karakou en velours noir brodé de perles dorées denses et motifs de Fetla fins, accompagnée de son seroual mdower en satin.'
  },
  {
    id: 'karakou-fetla',
    name: 'كراكو مطرز فتلة ذهبية',
    name_fr: 'Karakou Brodé Fetla',
    price: 59000,
    oldPrice: null,
    tag: null,
    tag_fr: null,
    image: 'assets/karakou-velvet.png',
    grids: ['grid-karakou'],
    desc: 'كراكو كلاسيكي يبرز مهارة الحرفيات الجزائريات بتطريز فتلة ذهبية متقنة بنقوش الأزهار التراثية، مع سروال شلقة حريري مريح.',
    desc_fr: 'Karakou classique en velours brodé en Fetla d\'or traditionnelle avec des motifs floraux raffinés, élégance intemporelle.'
  },
  {
    id: 'karakou-red',
    name: 'كراكو تقليدي مخمل أحمر',
    name_fr: 'Karakou Traditionnel Rouge',
    price: 52500,
    oldPrice: null,
    tag: null,
    tag_fr: null,
    image: 'assets/karakou-velvet.png',
    grids: ['grid-karakou'],
    desc: 'كراكو بلون أحمر مخملي دافئ وتطريزات ذهبية كلاسيكية، مصمم بقصّة مخصرة تبرز جمال القوام وسروال انسيابي ذهبي.',
    desc_fr: 'Karakou cintré en velours bordeaux velouté, broderie traditionnelle dorée et pantalon fluide assorti.'
  },
  {
    id: 'wedding-lace',
    name: 'فستان زفاف دانتيل فرنسي',
    name_fr: 'Robe de Mariée Dentelle',
    price: 98000,
    oldPrice: null,
    tag: 'زفاف',
    tag_fr: 'Mariage',
    image: 'assets/wedding-princess.png',
    grids: ['grid-wedding'],
    desc: 'فستان زفاف مغطى بالدانتيل الفرنسي الفاخر من الأعلى إلى الأسفل، بتفاصيل يدوية على الأكتاف وظهر من الشيفون المطرز العتيق.',
    desc_fr: 'Robe de mariée recouverte de dentelle de Calais délicate, dos boutonné raffiné et longue traîne féerique.'
  },
  {
    id: 'wedding-classic',
    name: 'فستان زفاف كلاسيكي',
    name_fr: 'Robe de Mariée Classique',
    price: 89500,
    oldPrice: 105000,
    tag: 'زفاف',
    tag_fr: 'Mariage',
    image: 'assets/wedding-princess.png',
    grids: ['grid-wedding'],
    desc: 'فستان زفاف كلاسيكي بكتف منسدل وتنورة ملكية واسعة من الساتان الثقيل اللامع، يجسد البساطة والوقار الراقي.',
    desc_fr: 'Robe de mariée classique hors épaules avec jupe volumineuse en satin duchesse lourd, style minimaliste chic.'
  }
];

/* ---------------- Algerian Wilayas Shipping Fees ---------------- */
const wilayas = [
  { code: '01', name: 'أدرار', name_fr: 'Adrar', homeFee: 1000, deskFee: 700 },
  { code: '02', name: 'الشلف', name_fr: 'Chlef', homeFee: 650, deskFee: 450 },
  { code: '03', name: 'الأغواط', name_fr: 'Laghouat', homeFee: 700, deskFee: 500 },
  { code: '04', name: 'أم البواقي', name_fr: 'Oum El Bouaghi', homeFee: 650, deskFee: 450 },
  { code: '05', name: 'باتنة', name_fr: 'Batna', homeFee: 650, deskFee: 450 },
  { code: '06', name: 'بجاية', name_fr: 'Bejaia', homeFee: 650, deskFee: 450 },
  { code: '07', name: 'بسكرة', name_fr: 'Biskra', homeFee: 700, deskFee: 500 },
  { code: '08', name: 'بشار', name_fr: 'Bechar', homeFee: 1000, deskFee: 700 },
  { code: '09', name: 'البليدة', name_fr: 'Blida', homeFee: 500, deskFee: 350 },
  { code: '10', name: 'البويرة', name_fr: 'Bouira', homeFee: 600, deskFee: 400 },
  { code: '11', name: 'تمنراست', name_fr: 'Tamanrasset', homeFee: 1100, deskFee: 800 },
  { code: '12', name: 'تبسة', name_fr: 'Tebessa', homeFee: 650, deskFee: 450 },
  { code: '13', name: 'تلمسان', name_fr: 'Tlemcen', homeFee: 650, deskFee: 450 },
  { code: '14', name: 'تيارت', name_fr: 'Tiaret', homeFee: 650, deskFee: 450 },
  { code: '15', name: 'تيزي وزو', name_fr: 'Tizi Ouzou', homeFee: 600, deskFee: 400 },
  { code: '16', name: 'الجزائر العاصمة', name_fr: 'Alger', homeFee: 400, deskFee: 250 },
  { code: '17', name: 'الجلفة', name_fr: 'Djelfa', homeFee: 650, deskFee: 450 },
  { code: '18', name: 'جيجل', name_fr: 'Jijel', homeFee: 650, deskFee: 450 },
  { code: '19', name: 'سطيف', name_fr: 'Setif', homeFee: 600, deskFee: 400 },
  { code: '20', name: 'سعيدة', name_fr: 'Saida', homeFee: 650, deskFee: 450 },
  { code: '21', name: 'سكيكدة', name_fr: 'Skikda', homeFee: 650, deskFee: 450 },
  { code: '22', name: 'سيدي بلعباس', name_fr: 'Sidi Bel Abbes', homeFee: 650, deskFee: 450 },
  { code: '23', name: 'عنابة', name_fr: 'Annaba', homeFee: 600, deskFee: 400 },
  { code: '24', name: 'قالمة', name_fr: 'Guelma', homeFee: 650, deskFee: 450 },
  { code: '25', name: 'قسنطينة', name_fr: 'Constantine', homeFee: 600, deskFee: 400 },
  { code: '26', name: 'المدية', name_fr: 'Medea', homeFee: 600, deskFee: 400 },
  { code: '27', name: 'مستغانم', name_fr: 'Mostaganem', homeFee: 650, deskFee: 450 },
  { code: '28', name: 'المسيلة', name_fr: 'M\'sila', homeFee: 650, deskFee: 450 },
  { code: '29', name: 'معسكر', name_fr: 'Mascara', homeFee: 650, deskFee: 450 },
  { code: '30', name: 'ورقلة', name_fr: 'Ouargla', homeFee: 900, deskFee: 600 },
  { code: '31', name: 'وهران', name_fr: 'Oran', homeFee: 600, deskFee: 400 },
  { code: '32', name: 'البيض', name_fr: 'El Bayadh', homeFee: 750, deskFee: 500 },
  { code: '33', name: 'إليزي', name_fr: 'Illizi', homeFee: 1200, deskFee: 900 },
  { code: '34', name: 'برج بوعريريج', name_fr: 'Bordj Bou Arreridj', homeFee: 600, deskFee: 400 },
  { code: '35', name: 'بومرداس', name_fr: 'Boumerdes', homeFee: 500, deskFee: 350 },
  { code: '36', name: 'الطارف', name_fr: 'El Tarf', homeFee: 650, deskFee: 450 },
  { code: '37', name: 'تندوف', name_fr: 'Tindouf', homeFee: 1200, deskFee: 900 },
  { code: '38', name: 'تيسمسيلت', name_fr: 'Tissemsilt', homeFee: 650, deskFee: 450 },
  { code: '39', name: 'الوادي', name_fr: 'El Oued', homeFee: 750, deskFee: 500 },
  { code: '40', name: 'خنشلة', name_fr: 'Khenchela', homeFee: 650, deskFee: 450 },
  { code: '41', name: 'سوق أهراس', name_fr: 'Souk Ahras', homeFee: 650, deskFee: 450 },
  { code: '42', name: 'تيبازة', name_fr: 'Tipaza', homeFee: 500, deskFee: 350 },
  { code: '43', name: 'ميلة', name_fr: 'Mila', homeFee: 650, deskFee: 450 },
  { code: '44', name: 'عين الدفلى', name_fr: 'Ain Defla', homeFee: 600, deskFee: 400 },
  { code: '45', name: 'النعامة', name_fr: 'Naama', homeFee: 750, deskFee: 550 },
  { code: '46', name: 'عين تموشنت', name_fr: 'Ain Temouchent', homeFee: 650, deskFee: 450 },
  { code: '47', name: 'غرداية', name_fr: 'Ghardaia', homeFee: 800, deskFee: 550 },
  { code: '48', name: 'غليزان', name_fr: 'Relizane', homeFee: 650, deskFee: 450 },
  { code: '49', name: 'تيميمون', name_fr: 'Timimoun', homeFee: 1000, deskFee: 700 },
  { code: '50', name: 'برج باجي مختار', name_fr: 'Bordj Badji Mokhtar', homeFee: 1300, deskFee: 1000 },
  { code: '51', name: 'أولاد جلال', name_fr: 'Ouled Djellal', homeFee: 750, deskFee: 500 },
  { code: '52', name: 'بني عباس', name_fr: 'Béni Abbès', homeFee: 1000, deskFee: 700 },
  { code: '53', name: 'عين صالح', name_fr: 'In Salah', homeFee: 1100, deskFee: 800 },
  { code: '54', name: 'عين قزام', name_fr: 'In Guezzam', homeFee: 1200, deskFee: 900 },
  { code: '55', name: 'تقرت', name_fr: 'Touggourt', homeFee: 900, deskFee: 600 },
  { code: '56', name: 'جانت', name_fr: 'Djanet', homeFee: 1200, deskFee: 900 },
  { code: '57', name: 'المغير', name_fr: 'El M\'Ghair', homeFee: 800, deskFee: 550 },
  { code: '58', name: 'المنيعة', name_fr: 'El Meniaa', homeFee: 800, deskFee: 550 }
];

/* ---------------- App State ---------------- */
let cart = JSON.parse(localStorage.getItem('zf_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('zf_wishlist') || '[]');
let currentLang = localStorage.getItem('zf_lang') || 'ar';
let selectedSize = '38';
let activeProductId = '';

/* ---------------- Format Currency Helper ---------------- */
function formatPrice(amount) {
  if (currentLang === 'ar') {
    return amount.toLocaleString('ar-DZ') + ' دج';
  } else {
    return amount.toLocaleString('fr-DZ') + ' DA';
  }
}

/* ---------------- Render Products to Grids ---------------- */
function renderProducts() {
  const grids = ['grid-new', 'grid-caftan', 'grid-karakou', 'grid-wedding', 'grid-best'];
  
  grids.forEach(gridId => {
    const container = document.getElementById(gridId);
    if (!container) return;
    container.innerHTML = '';
    
    productsData.forEach(p => {
      // Filter if product belongs to this grid
      if (p.grids.includes(gridId)) {
        const isWishlisted = wishlist.includes(p.id);
        const card = document.createElement('div');
        card.className = 'card reveal';
        
        const displayName = currentLang === 'ar' ? p.name : p.name_fr;
        const displayTag = currentLang === 'ar' ? p.tag : p.tag_fr;
        const displayPrice = formatPrice(p.price);
        const displayOldPrice = p.oldPrice ? formatPrice(p.oldPrice) : '';
        const quickViewText = translations[currentLang].quick_view;
        const addCartText = translations[currentLang].add_to_cart;
        
        card.innerHTML = `
          <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${p.id}" title="${translations[currentLang].wishlist_title}">
            ${isWishlisted ? '♥' : '♡'}
          </button>
          <div class="card-img pp-trigger" data-id="${p.id}" style="background-image: url('${p.image}'); cursor: pointer;">
            <div class="glow"></div>
            <div class="fabric"></div>
            ${displayTag ? `<span class="tag">${displayTag}</span>` : ''}
          </div>
          <div class="card-body pp-trigger" data-id="${p.id}" style="cursor: pointer;">
            <h3>${displayName}</h3>
            <div class="price">${displayPrice} ${p.oldPrice ? `<s>${displayOldPrice}</s>` : ''}</div>
          </div>
          <div class="card-actions">
            <button class="qv-btn" data-id="${p.id}">${quickViewText}</button>
            <button class="card-buynow-btn pp-open-btn" data-id="${p.id}">🛍️ اطلبي الآن</button>
          </div>
        `;
        
        container.appendChild(card);
        attachTilt(card);
      }
    });
  });
  
  // Attach Event Listeners to rendered buttons
  document.querySelectorAll('.qv-btn').forEach(btn => {
    btn.addEventListener('click', () => openQuickView(btn.getAttribute('data-id')));
  });
  
  document.querySelectorAll('.pp-open-btn, .pp-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      openProductPage(btn.getAttribute('data-id'));
    });
  });
  
  document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(btn.getAttribute('data-id'));
    });
  });

  // Re-observe newly rendered .reveal elements
  if (typeof initReveal === 'function') initReveal();
}

/* ---------------- Render Reviews ---------------- */
const reviews = {
  ar: [
    ['القفطان أكثر من رائع، الخياطة دقيقة جدًا والألوان طبيعية تمامًا.', 'سارة، الجزائر العاصمة'],
    ['فستان الزفاف فاق توقعاتي، شعرت وكأنني أميرة في يومي الكبير.', 'ليلى، وهران'],
    ['التوصيل سريع والتغليف فاخر جدًا، تجربة تسوق راقية.', 'آمال، قسنطينة'],
    ['الكراكو تحفة فنية، التطريز يدوي بامتياز.', 'نور الهدى، عنابة'],
  ],
  fr: [
    ['Le caftan est magnifique, les finitions sont d\'une précision incroyable.', 'Sarah, Alger'],
    ['La robe de mariée a dépassé mes attentes, je me suis sentie reine.', 'Lila, Oran'],
    ['Livraison rapide et emballage très luxueux. Expérience haut de gamme.', 'Amel, Constantine'],
    ['Le Karakou est un chef-d\'œuvre. Broderie à la main exceptionnelle.', 'Nour El Houda, Annaba'],
  ]
};

function renderReviews() {
  const track = document.getElementById('reviewTrack');
  if (!track) return;
  track.innerHTML = '';
  
  const list = reviews[currentLang];
  list.forEach(([txt, who]) => {
    const el = document.createElement('div');
    el.className = 'review';
    el.innerHTML = `<div class="stars">★★★★★</div><p>"${txt}"</p><div class="who">— ${who}</div>`;
    track.appendChild(el);
  });
}

/* ---------------- Render Instagram ---------------- */
function renderInstagram() {
  const instaGrid = document.getElementById('instaGrid');
  if (!instaGrid) return;
  instaGrid.innerHTML = '';
  
  const instaImages = [
    'assets/caftan-zahia.png',
    'assets/karakou-velvet.png',
    'assets/dress-star.png',
    'assets/caftan-alhambra.png',
    'assets/wedding-princess.png',
    'assets/intro-visual.png'
  ];
  
  const positions = ['top center', 'center center', 'bottom center', 'center left', 'center right', 'bottom right'];
  const transforms = ['scale(1)', 'scale(1.05) rotate(1deg)', 'scale(1.02) rotate(-1deg)', 'scale(1.07)', 'scale(1.01)', 'scale(1.04)'];
  
  for (let i = 0; i < 12; i++) {
    const d = document.createElement('div');
    d.className = 'insta-item';
    const img = instaImages[i % instaImages.length];
    d.style.backgroundImage = `url('${img}')`;
    d.style.backgroundPosition = positions[i % positions.length];
    d.style.transform = transforms[i % transforms.length];
    d.style.cursor = 'pointer';
    d.onclick = () => window.open('https://www.instagram.com/zephira_caftan_05/', '_blank');
    instaGrid.appendChild(d);
  }
}

/* ---------------- Toast Notification System ---------------- */
function showToast(message, actionText = '', actionCallback = null) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  toast.innerHTML = `
    <span>${message}</span>
    <div style="display:flex; gap:10px; align-items:center;">
      ${actionText ? `<button class="toast-action">${actionText}</button>` : ''}
      <button class="toast-close">&times;</button>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Setup dismiss timers
  const timer = setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
  
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timer);
    toast.remove();
  });
  
  if (actionText && actionCallback) {
    toast.querySelector('.toast-action').addEventListener('click', () => {
      clearTimeout(timer);
      toast.remove();
      actionCallback();
    });
  }
}

/* ---------------- Wishlist Management ---------------- */
function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  const isAdding = index === -1;
  
  if (isAdding) {
    wishlist.push(productId);
    showToast(translations[currentLang].toast_added_wishlist);
  } else {
    wishlist.splice(index, 1);
    showToast(translations[currentLang].toast_removed_wishlist);
  }
  
  localStorage.setItem('zf_wishlist', JSON.stringify(wishlist));
  
  // Re-sync UI hearts
  document.querySelectorAll(`.card-wishlist-btn[data-id="${productId}"]`).forEach(btn => {
    btn.classList.toggle('active', isAdding);
    btn.innerHTML = isAdding ? '♥' : '♡';
  });
  
  updateHeaderBadges();
  renderWishlist();
}

function renderWishlist() {
  const listContainer = document.getElementById('wishlistItemsList');
  const emptyMsg = document.getElementById('wishlistEmptyMsg');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  
  if (wishlist.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }
  
  if (emptyMsg) emptyMsg.style.display = 'none';
  
  wishlist.forEach(pid => {
    const p = productsData.find(item => item.id === pid);
    if (!p) return;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'wishlist-item';
    
    const displayName = currentLang === 'ar' ? p.name : p.name_fr;
    const displayPrice = formatPrice(p.price);
    
    itemEl.innerHTML = `
      <img src="${p.image}" alt="${displayName}">
      <div class="wishlist-item-info">
        <h4 class="wishlist-item-title">${displayName}</h4>
        <div class="wishlist-item-price">${displayPrice}</div>
        <div class="wishlist-actions">
          <button class="add-cart" onclick="moveToCartFromWishlist('${p.id}')">${translations[currentLang].add_cart_wishlist}</button>
          <button onclick="toggleWishlist('${p.id}')">${translations[currentLang].quick_view_wishlist}</button>
        </div>
      </div>
    `;
    
    listContainer.appendChild(itemEl);
  });
}

function moveToCartFromWishlist(productId) {
  addToCart(productId, '38', 1, null);
  toggleWishlist(productId); // Remove from wishlist
}

/* ---------------- Cart Management ---------------- */
function addToCart(productId, size, quantity, measurements = null) {
  const p = productsData.find(item => item.id === productId);
  if (p) {
    trackBrowserEvent('AddToCart', { content_name: p.name, value: p.price * quantity });
  }

  // Check if same item with same size and measurements already exists
  const existingIndex = cart.findIndex(item => 
    item.id === productId && 
    item.size === size && 
    JSON.stringify(item.measurements) === JSON.stringify(measurements)
  );
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ id: productId, size, quantity, measurements });
  }
  
  localStorage.setItem('zf_cart', JSON.stringify(cart));
  updateHeaderBadges();
  renderCart();
  
  // Show toast with option to view cart drawer
  showToast(
    translations[currentLang].toast_added_cart,
    translations[currentLang].toast_view_cart,
    () => openDrawer('cartDrawer')
  );
}

function updateCartQty(index, newQty) {
  if (newQty < 1) {
    removeFromCart(index);
    return;
  }
  cart[index].quantity = newQty;
  localStorage.setItem('zf_cart', JSON.stringify(cart));
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('zf_cart', JSON.stringify(cart));
  updateHeaderBadges();
  renderCart();
}

function populateWilayasDropdown() {
  const select = document.getElementById('clientWilaya');
  if (!select) return;
  
  // Keep first option
  const firstOption = select.options[0];
  select.innerHTML = '';
  select.appendChild(firstOption);
  
  wilayas.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.code;
    opt.textContent = `${w.code} - ${currentLang === 'ar' ? w.name : w.name_fr}`;
    select.appendChild(opt);
  });
}

function calculateShippingCost() {
  const select = document.getElementById('clientWilaya');
  const deskCheck = document.getElementById('deskDelivery');
  if (!select || !select.value) return 0;
  
  const w = wilayas.find(item => item.code === select.value);
  if (!w) return 0;
  
  let cost = w.homeFee;
  if (deskCheck && deskCheck.checked) {
    cost = w.deskFee; // lower rate for desk stop delivery
  }
  return cost;
}

function renderCart() {
  const listContainer = document.getElementById('cartItemsList');
  const emptyMsg = document.getElementById('cartEmptyMsg');
  const footer = document.getElementById('cartFooter');
  const checkoutSec = document.getElementById('checkoutSection');
  
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  
  if (cart.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (footer) footer.style.display = 'none';
    if (checkoutSec) checkoutSec.style.display = 'none';
    return;
  }
  
  if (emptyMsg) emptyMsg.style.display = 'none';
  if (footer) footer.style.display = 'block';
  if (checkoutSec) checkoutSec.style.display = 'block';
  
  let subtotal = 0;
  
  cart.forEach((item, index) => {
    const p = productsData.find(pd => pd.id === item.id);
    if (!p) return;
    
    const displayName = currentLang === 'ar' ? p.name : p.name_fr;
    const itemTotal = p.price * item.quantity;
    subtotal += itemTotal;
    
    const sizeLabel = item.size === 'custom' ? translations[currentLang].custom_size_badge : `FR ${item.size}`;
    
    let measHTML = '';
    if (item.measurements) {
      const { chest, waist, hips, shoulders, height } = item.measurements;
      measHTML = `
        <div class="cart-item-measurements">
          C:${chest} W:${waist} H:${hips} S:${shoulders} L:${height}
        </div>
      `;
    }
    
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <img src="${p.image}" alt="${displayName}">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${displayName}</h4>
        <div class="cart-item-size">${translations[currentLang].size_label} ${sizeLabel}</div>
        ${measHTML}
        <div class="cart-item-row">
          <div class="cart-item-qty">
            <button onclick="updateCartQty(${index}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button onclick="updateCartQty(${index}, ${item.quantity + 1})">+</button>
          </div>
          <span class="cart-item-price">${formatPrice(itemTotal)}</span>
        </div>
        <div style="text-align:left; margin-top:6px;">
          <button class="cart-item-remove" onclick="removeFromCart(${index})">${currentLang === 'ar' ? 'حذف' : 'Retirer'}</button>
        </div>
      </div>
    `;
    listContainer.appendChild(itemEl);
  });
  
  // Calculate pricing
  const shippingCost = calculateShippingCost();
  const totalCost = subtotal + shippingCost;
  
  document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('cartShipping').textContent = shippingCost > 0 ? formatPrice(shippingCost) : '—';
  document.getElementById('cartTotal').textContent = formatPrice(totalCost);
}

function updateHeaderBadges() {
  const cartCountEl = document.getElementById('cartCount');
  const wishlistCountEl = document.getElementById('wishlistCount');
  
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  if (cartCountEl) cartCountEl.textContent = totalCartItems;
  if (wishlistCountEl) wishlistCountEl.textContent = wishlist.length;
}

/* ---------------- Drawer & Modal Open/Close Controls ---------------- */
function openDrawer(drawerId) {
  const d = document.getElementById(drawerId);
  if (!d) return;
  d.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  if (drawerId === 'cartDrawer') {
    renderCart();
    trackBrowserEvent('InitiateCheckout');
  } else if (drawerId === 'wishlistDrawer') {
    renderWishlist();
  }
}

function closeDrawer(drawerId) {
  const d = document.getElementById(drawerId);
  if (!d) return;
  d.classList.remove('open');
  document.body.style.overflow = '';
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}

/* ---------------- Quick View Operations ---------------- */
function openQuickView(productId) {
  const p = productsData.find(item => item.id === productId);
  if (!p) return;
  
  trackBrowserEvent('ViewContent', { content_name: p.name, value: p.price });
  
  activeProductId = productId;
  selectedSize = '38';
  document.getElementById('qvQty').textContent = '1';
  
  // Populate
  const qvImage = document.getElementById('qvImage');
  const qvTitle = document.getElementById('qvTitle');
  const qvTag = document.getElementById('qvTag');
  const qvPrice = document.getElementById('qvPrice');
  const qvOldPrice = document.getElementById('qvOldPrice');
  const qvDesc = document.getElementById('qvDescription');
  
  qvImage.src = p.image;
  qvTitle.textContent = currentLang === 'ar' ? p.name : p.name_fr;
  qvDesc.textContent = currentLang === 'ar' ? p.desc : p.desc_fr;
  
  qvPrice.textContent = formatPrice(p.price);
  if (p.oldPrice) {
    qvOldPrice.textContent = formatPrice(p.oldPrice);
    qvOldPrice.style.display = 'inline';
  } else {
    qvOldPrice.style.display = 'none';
  }
  
  const tagText = currentLang === 'ar' ? p.tag : p.tag_fr;
  if (tagText) {
    qvTag.textContent = tagText;
    qvTag.style.display = 'inline-block';
  } else {
    qvTag.style.display = 'none';
  }
  
  // Reset sizes buttons
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-size') === '38');
  });
  
  document.getElementById('customMeasurementsSection').style.display = 'none';
  
  // Clear inputs
  document.getElementById('mChest').value = '';
  document.getElementById('mWaist').value = '';
  document.getElementById('mHips').value = '';
  document.getElementById('mShoulders').value = '';
  document.getElementById('mHeight').value = '';
  
  openModal('quickViewModal');
}

/* ---------------- COD Checkout Submit ---------------- */
function handleOrderSubmit(e) {
  // [معزول بالكامل] الطلبات لا ترسل إلى لوحة التحكم لحماية الخصوصية ومطابقة إعدادات المتجر الساكن
  e.preventDefault();
  
  const name = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const wilayaCode = document.getElementById('clientWilaya').value;
  const commune = document.getElementById('clientCommune').value;
  const address = document.getElementById('clientAddress').value.trim();
  const isStopDesk = document.getElementById('deskDelivery').checked;
  
  if (!wilayaCode) {
    alert(translations[currentLang].validation_wilaya);
    return;
  }
  
  if (!commune) {
    alert(currentLang === 'ar' ? '⚠️ يرجى اختيار البلدية' : '⚠️ Veuillez choisir la commune');
    return;
  }
  
  // Phone regex check (Algeria numbers: 05, 06, 07 followed by 8 digits)
  const phoneRegex = /^(05|06|07)[0-9]{8}$/;
  if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
    alert(translations[currentLang].validation_phone);
    return;
  }
  
  const selectedWilaya = wilayas.find(w => w.code === wilayaCode);
  const wilayaName = currentLang === 'ar' ? selectedWilaya.name : selectedWilaya.name_fr;
  
  // Compile Invoice HTML
  const orderId = '#ZF-' + Math.floor(1000 + Math.random() * 9000);
  document.getElementById('successOrderId').textContent = orderId;
  
  let subtotal = 0;
  let itemsHTML = '';
  
  cart.forEach(item => {
    const p = productsData.find(pd => pd.id === item.id);
    if (!p) return;
    const nameText = currentLang === 'ar' ? p.name : p.name_fr;
    const itemTotal = p.price * item.quantity;
    subtotal += itemTotal;
    
    const sizeText = item.size === 'custom' ? translations[currentLang].custom_size_badge : `FR ${item.size}`;
    itemsHTML += `
      <div class="invoice-row" style="font-size: 0.85rem; color: var(--grey);">
        <span>${nameText} (x${item.quantity}) [${sizeText}]</span>
        <span>${formatPrice(itemTotal)}</span>
      </div>
    `;
  });
  
  const shippingCost = calculateShippingCost();
  const finalTotal = subtotal + shippingCost;
  const deliveryTypeText = isStopDesk ? translations[currentLang].invoice_desk : translations[currentLang].invoice_home;
  
  const invoiceBox = document.getElementById('invoiceBox');
  invoiceBox.innerHTML = `
    <h5>${translations[currentLang].invoice_title} (${orderId})</h5>
    <div class="invoice-row"><strong>${translations[currentLang].invoice_client}</strong> <span>${name}</span></div>
    <div class="invoice-row"><strong>${translations[currentLang].invoice_phone}</strong> <span>${phone}</span></div>
    <div class="invoice-row"><strong>${translations[currentLang].invoice_wilaya}</strong> <span>${wilayaCode} - ${wilayaName}</span></div>
    <div class="invoice-row"><strong>${translations[currentLang].client_commune.replace(' *', '')}:</strong> <span>${commune}</span></div>
    <div class="invoice-row"><strong>${translations[currentLang].invoice_address}</strong> <span>${address}</span></div>
    <div class="invoice-row" style="margin-bottom: 12px;"><strong>${translations[currentLang].invoice_delivery}</strong> <span>${deliveryTypeText}</span></div>
    
    <div style="border-top:1px dashed var(--line); padding-top:10px; margin-top:10px;"></div>
    ${itemsHTML}
    
    <div class="invoice-row" style="margin-top:8px;"><span>${translations[currentLang].subtotal}</span> <span>${formatPrice(subtotal)}</span></div>
    <div class="invoice-row"><span>${translations[currentLang].shipping}</span> <span>${formatPrice(shippingCost)}</span></div>
    <div class="invoice-row total"><span>${translations[currentLang].total}</span> <span>${formatPrice(finalTotal)}</span></div>
  `;
  
  const purchaseEventId = 'ZF-EV-' + orderId.replace('#', '');
  trackBrowserEvent('Purchase', { value: finalTotal, event_id: purchaseEventId });

  const newOrder = {
    id: orderId.replace('#', ''),
    name: name,
    phone: phone,
    wilaya: selectedWilaya ? selectedWilaya.name : wilayaCode,
    product: orderProducts.join(' + '),
    amount: finalTotal,
    status: 'pending',
    date: new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    pixelEventId: purchaseEventId
  };
  
  // Save order to server with localStorage fallback
  (async function() {
    try {
      const BACKEND_URL = window.location.hostname === 'zaphera-coftan-pro-1.onrender.com' ? 'https://zaphera-coftan-pro-1-m.onrender.com' : '';
      const response = await fetch(BACKEND_URL + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(newOrder)
      });
      if (response.ok) {
        console.log('Order persisted on server');
        return;
      }
    } catch (err) {
      console.warn('Backend server unreachable, falling back to local storage', err);
    }
    // Fallback to localStorage
    const savedOrders = JSON.parse(localStorage.getItem('zf_orders') || '[]');
    savedOrders.unshift(newOrder);
    localStorage.setItem('zf_orders', JSON.stringify(savedOrders));
  })();

  // Clear cart
  cart = [];
  localStorage.setItem('zf_cart', JSON.stringify(cart));
  updateHeaderBadges();
  
  // Close Cart, open Success Modal
  closeDrawer('cartDrawer');
  openModal('successModal');
  
  // Clear form
  document.getElementById('checkoutForm').reset();
  document.getElementById('clientWilaya').selectedIndex = 0;
  
  showToast(translations[currentLang].toast_order_success);
}

/* ---------------- Live Search Overlay ---------------- */
function handleSearch(e) {
  const val = e.target.value.toLowerCase().trim();
  const grid = document.getElementById('searchResultsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  if (!val) return;
  
  const filtered = productsData.filter(p => {
    const titleMatch = p.name.toLowerCase().includes(val) || p.name_fr.toLowerCase().includes(val);
    const descMatch = p.desc.toLowerCase().includes(val) || p.desc_fr.toLowerCase().includes(val);
    return titleMatch || descMatch;
  });
  
  filtered.forEach(p => {
    const item = document.createElement('div');
    item.className = 'card';
    const displayName = currentLang === 'ar' ? p.name : p.name_fr;
    const priceText = formatPrice(p.price);
    
    item.innerHTML = `
      <div class="card-img search-trigger" data-id="${p.id}" style="background-image: url('${p.image}'); aspect-ratio:4/5; cursor:pointer;"></div>
      <div class="card-body search-trigger" data-id="${p.id}" style="cursor:pointer;">
        <h3>${displayName}</h3>
        <div class="price">${priceText}</div>
      </div>
      <div class="card-actions">
        <button class="search-qv-btn" data-id="${p.id}">${translations[currentLang].quick_view}</button>
        <button class="card-buynow-btn search-pp-btn" data-id="${p.id}">🛍️ اطلبي الآن</button>
      </div>
    `;
    grid.appendChild(item);
  });
  
  document.querySelectorAll('.search-qv-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal('searchOverlay');
      openQuickView(btn.getAttribute('data-id'));
    });
  });
  
  document.querySelectorAll('.search-pp-btn, .search-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal('searchOverlay');
      openProductPage(btn.getAttribute('data-id'));
    });
  });
  

}

/* ---------------- Multi-Language Translator ---------------- */
function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('zf_lang', lang);
  
  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  
  const btn = document.querySelector('.lang-switch');
  if (btn) btn.textContent = lang === 'ar' ? 'FR' : 'AR';
  
  // Translate UI texts
  const t = translations[lang];
  
  // Navigation Links
  const links = document.querySelectorAll('.navlinks a');
  if (links.length >= 5) {
    links[0].textContent = t.nav_collection;
    links[0].href = "#collection";
    links[1].textContent = t.nav_caftan;
    links[1].href = "#caftan";
    links[2].textContent = t.nav_karakou;
    links[2].href = "#karakou";
    links[3].textContent = t.nav_wedding;
    links[3].href = "#wedding";
    links[4].textContent = t.nav_reviews;
    links[4].href = "#reviews";
  }
  
  // Hero
  const heroEyebrow = document.querySelector('.hero .eyebrow');
  if (heroEyebrow) heroEyebrow.textContent = t.eyebrow_sub;
  
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) heroTitle.innerHTML = t.hero_title;
  
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) heroSub.textContent = t.hero_sub;
  
  const heroCta = document.querySelector('.hero-cta');
  if (heroCta) heroCta.textContent = t.hero_cta;
  
  const scrollHint = document.querySelector('.scroll-hint span');
  if (scrollHint) scrollHint.textContent = t.scroll_hint;
  
  // Runway
  const runwayEyebrow = document.querySelector('.runway-caption .eyebrow');
  if (runwayEyebrow) runwayEyebrow.textContent = t.runway_eyebrow;
  
  const runwayTitle = document.querySelector('.runway-caption h2');
  if (runwayTitle) runwayTitle.innerHTML = t.runway_title;
  
  // Chapter 1 Intro
  const ch1Num = document.querySelector('#intro .chapter-num');
  if (ch1Num) ch1Num.textContent = t.chapter_1_num;
  
  const ch1Title = document.querySelector('#intro .chapter-title');
  if (ch1Title) ch1Title.innerHTML = t.chapter_1_title;
  
  const ch1Desc = document.querySelector('#intro .chapter-desc');
  if (ch1Desc) ch1Desc.textContent = t.chapter_1_desc;
  
  const ch1Stats = document.querySelectorAll('#intro .stat');
  if (ch1Stats.length >= 3) {
    ch1Stats[0].querySelector('span').textContent = t.stat_experience;
    ch1Stats[1].querySelector('span').textContent = t.stat_clients;
    ch1Stats[2].querySelector('span').textContent = t.stat_handmade;
  }
  
  // Chapter 2-6 Titles
  const ch2Title = document.querySelector('#collection .chapter-title');
  if (ch2Title) ch2Title.innerHTML = t.chapter_2_title;
  const ch2Desc = document.querySelector('#collection .chapter-desc');
  if (ch2Desc) ch2Desc.textContent = t.chapter_2_desc;
  
  const ch3Title = document.querySelector('#caftan .chapter-title');
  if (ch3Title) ch3Title.innerHTML = t.chapter_3_title;
  const ch3Desc = document.querySelector('#caftan .chapter-desc');
  if (ch3Desc) ch3Desc.textContent = t.chapter_3_desc;
  
  const ch4Title = document.querySelector('#karakou .chapter-title');
  if (ch4Title) ch4Title.innerHTML = t.chapter_4_title;
  const ch4Desc = document.querySelector('#karakou .chapter-desc');
  if (ch4Desc) ch4Desc.textContent = t.chapter_4_desc;
  
  const ch5Title = document.querySelector('#wedding .chapter-title');
  if (ch5Title) ch5Title.innerHTML = t.chapter_5_title;
  const ch5Desc = document.querySelector('#wedding .chapter-desc');
  if (ch5Desc) ch5Desc.textContent = t.chapter_5_desc;
  
  const ch6Title = document.querySelector('#bestsellers .chapter-title');
  if (ch6Title) ch6Title.innerHTML = t.chapter_6_title;
  const ch6Desc = document.querySelector('#bestsellers .chapter-desc');
  if (ch6Desc) ch6Desc.textContent = t.chapter_6_desc;
  
  // Chapter 7 Craftsmanship
  const ch7Title = document.querySelector('#craft .chapter-title');
  if (ch7Title) ch7Title.innerHTML = t.chapter_7_title;
  
  const tsteps = document.querySelectorAll('#craft .tstep');
  if (tsteps.length >= 5) {
    tsteps[0].querySelector('h4').textContent = t.chapter_7_step1_title;
    tsteps[0].querySelector('p').textContent = t.chapter_7_step1_desc;
    
    tsteps[1].querySelector('h4').textContent = t.chapter_7_step2_title;
    tsteps[1].querySelector('p').textContent = t.chapter_7_step2_desc;
    
    tsteps[2].querySelector('h4').textContent = t.chapter_7_step3_title;
    tsteps[2].querySelector('p').textContent = t.chapter_7_step3_desc;
    
    tsteps[3].querySelector('h4').textContent = t.chapter_7_step4_title;
    tsteps[3].querySelector('p').textContent = t.chapter_7_step4_desc;
    
    tsteps[4].querySelector('h4').textContent = t.chapter_7_step5_title;
    tsteps[4].querySelector('p').textContent = t.chapter_7_step5_desc;
  }
  
  // Chapter 8 Reviews Title
  const ch8Title = document.querySelector('#reviews .chapter-title');
  if (ch8Title) ch8Title.innerHTML = t.chapter_8_title;
  
  // Final CTA
  const finalEyebrow = document.querySelector('#final .eyebrow');
  if (finalEyebrow) finalEyebrow.textContent = t.final_cta_eyebrow;
  
  const finalTitle = document.querySelector('#final h2');
  if (finalTitle) finalTitle.innerHTML = t.final_cta_title;
  
  const finalDesc = document.querySelector('#final p');
  if (finalDesc) finalDesc.textContent = t.final_cta_desc;
  
  const finalBtn = document.querySelector('#final a');
  if (finalBtn) finalBtn.textContent = t.final_cta_btn;
  
  // Footer
  const footerDesc = document.querySelector('footer p');
  if (footerDesc) footerDesc.textContent = t.footer_desc;
  
  const footerHeaders = document.querySelectorAll('footer h4');
  if (footerHeaders.length >= 3) {
    footerHeaders[0].textContent = t.footer_store;
    footerHeaders[1].textContent = t.footer_care;
    footerHeaders[2].textContent = t.footer_follow;
  }
  
  const footerLinks = document.querySelectorAll('footer ul a');
  if (footerLinks.length >= 7) {
    // Store links
    footerLinks[0].textContent = t.chapter_2_title.replace('<em>', '').replace('</em>', '');
    footerLinks[1].textContent = t.nav_caftan;
    footerLinks[2].textContent = t.nav_karakou;
    footerLinks[3].textContent = t.nav_wedding;
    
    // Care links
    footerLinks[4].textContent = t.footer_guide;
    footerLinks[5].textContent = t.footer_shipping;
    footerLinks[6].textContent = t.footer_returns;
  }
  
  const footerBottom = document.querySelector('.footer-bottom');
  if (footerBottom) footerBottom.textContent = t.footer_rights;
  
  // E-commerce forms & panels translation
  const txtCartTitle = document.getElementById('txtCartTitle');
  if (txtCartTitle) txtCartTitle.innerHTML = `${t.cart_title} (<span id="cartCount">${cart.length}</span>)`;
  
  const cartEmptyMsg = document.getElementById('cartEmptyMsg');
  if (cartEmptyMsg) cartEmptyMsg.textContent = t.cart_empty;
  
  const txtCheckoutTitle = document.getElementById('txtCheckoutTitle');
  if (txtCheckoutTitle) txtCheckoutTitle.textContent = t.checkout_title;
  
  const lblClientName = document.getElementById('lblClientName');
  if (lblClientName) lblClientName.textContent = t.client_name;
  
  const lblClientPhone = document.getElementById('lblClientPhone');
  if (lblClientPhone) lblClientPhone.textContent = t.client_phone;
  
  const lblClientWilaya = document.getElementById('lblClientWilaya');
  if (lblClientWilaya) lblClientWilaya.textContent = t.client_wilaya;
  
  const lblClientCommune = document.getElementById('lblClientCommune');
  if (lblClientCommune) lblClientCommune.textContent = t.client_commune;
  
  const lblClientAddress = document.getElementById('lblClientAddress');
  if (lblClientAddress) lblClientAddress.textContent = t.client_address;
  
  const lblDeskDelivery = document.getElementById('lblDeskDelivery');
  if (lblDeskDelivery) lblDeskDelivery.textContent = t.desk_delivery;
  
  const txtSubtotal = document.getElementById('txtSubtotal');
  if (txtSubtotal) txtSubtotal.textContent = t.subtotal;
  
  const txtShipping = document.getElementById('txtShipping');
  if (txtShipping) txtShipping.textContent = t.shipping;
  
  const txtTotal = document.getElementById('txtTotal');
  if (txtTotal) txtTotal.textContent = t.total;
  
  const submitOrderBtn = document.getElementById('submitOrderBtn');
  if (submitOrderBtn) submitOrderBtn.textContent = t.confirm_order;
  
  const txtWishlistTitle = document.getElementById('txtWishlistTitle');
  if (txtWishlistTitle) txtWishlistTitle.innerHTML = `${t.wishlist_title} (<span id="wishlistCount">${wishlist.length}</span>)`;
  
  const wishlistEmptyMsg = document.getElementById('wishlistEmptyMsg');
  if (wishlistEmptyMsg) wishlistEmptyMsg.textContent = t.wishlist_empty;
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t.search_placeholder;
  
  const txtSuccessTitle = document.getElementById('txtSuccessTitle');
  if (txtSuccessTitle) txtSuccessTitle.textContent = t.success_title;
  
  const txtSuccessDesc = document.getElementById('txtSuccessDesc');
  if (txtSuccessDesc) txtSuccessDesc.innerHTML = `${t.success_desc} <strong id="successOrderId"></strong>`;
  
  const txtSuccessNote = document.getElementById('txtSuccessNote');
  if (txtSuccessNote) txtSuccessNote.textContent = t.success_note;
  
  const successCloseBtn = document.getElementById('successCloseBtn');
  if (successCloseBtn) successCloseBtn.textContent = t.success_close;
  
  const qvAddToCartBtn = document.getElementById('qvAddToCartBtn');
  if (qvAddToCartBtn) qvAddToCartBtn.textContent = t.add_to_cart;
  
  const customSizeBtn = document.getElementById('customSizeBtn');
  if (customSizeBtn) customSizeBtn.textContent = t.custom_size_btn;
  
  const txtCustomFittingTitle = document.getElementById('txtCustomFittingTitle');
  if (txtCustomFittingTitle) txtCustomFittingTitle.textContent = t.custom_fitting_title;
  
  const lblChest = document.getElementById('lblChest');
  if (lblChest) lblChest.textContent = t.lbl_chest;
  
  const lblWaist = document.getElementById('lblWaist');
  if (lblWaist) lblWaist.textContent = t.lbl_waist;
  
  const lblHips = document.getElementById('lblHips');
  if (lblHips) lblHips.textContent = t.lbl_hips;
  
  const lblShoulders = document.getElementById('lblShoulders');
  if (lblShoulders) lblShoulders.textContent = t.lbl_shoulders;
  
  const lblHeight = document.getElementById('lblHeight');
  if (lblHeight) lblHeight.textContent = t.lbl_height;
  
  const txtCustomFittingNote = document.getElementById('txtCustomFittingNote');
  if (txtCustomFittingNote) txtCustomFittingNote.textContent = t.txt_custom_fitting_note;
  
  const lblSize = document.getElementById('lblSize');
  if (lblSize) lblSize.textContent = t.size_label;
  
  // Re-run dynamic rendering
  renderProducts();
  renderReviews();
  renderCart();
  renderWishlist();
  populateWilayasDropdown();
}

/* ---------------- Setup Event Listeners and Initializers ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Lang switch button
  const langBtn = document.querySelector('.lang-switch');
  if (langBtn) {
    langBtn.style.cursor = 'pointer';
    langBtn.addEventListener('click', () => {
      const target = currentLang === 'ar' ? 'fr' : 'ar';
      switchLanguage(target);
    });
  }
  
  // Search Overlay Triggers
  const searchBtn = document.querySelector('.navicons button[title="بحث"], .navicons button:nth-child(2)');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      openModal('searchOverlay');
      document.getElementById('searchInput').focus();
    });
  }
  document.getElementById('searchCloseBtn').addEventListener('click', () => closeModal('searchOverlay'));
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  
  // Cart Drawer Triggers
  const cartBtn = document.querySelector('.navicons button[title="السلة"], .navicons button:nth-child(4)');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => openDrawer('cartDrawer'));
  }
  document.getElementById('cartCloseBtn').addEventListener('click', () => closeDrawer('cartDrawer'));
  document.getElementById('cartOverlay').addEventListener('click', () => closeDrawer('cartDrawer'));
  
  // Wishlist Drawer Triggers
  const wishlistBtn = document.querySelector('.navicons button[title="المفضلة"], .navicons button:nth-child(3)');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => openDrawer('wishlistDrawer'));
  }
  document.getElementById('wishlistCloseBtn').addEventListener('click', () => closeDrawer('wishlistDrawer'));
  document.getElementById('wishlistOverlay').addEventListener('click', () => closeDrawer('wishlistDrawer'));
  
  // Modal Close buttons
  document.getElementById('qvCloseBtn').addEventListener('click', () => closeModal('quickViewModal'));
  document.getElementById('qvOverlay').addEventListener('click', () => closeModal('quickViewModal'));
  
  document.getElementById('successCloseBtn').addEventListener('click', () => closeModal('successModal'));
  document.getElementById('successOverlay').addEventListener('click', () => closeModal('successModal'));
  
  // Size selection toggles
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.getAttribute('data-size');
      
      const customSec = document.getElementById('customMeasurementsSection');
      if (selectedSize === 'custom') {
        customSec.style.display = 'block';
        customSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        customSec.style.display = 'none';
      }
    });
  });
  
  // Modal Qty changers
  document.getElementById('qtyDec').addEventListener('click', () => {
    const span = document.getElementById('qvQty');
    let q = parseInt(span.textContent);
    if (q > 1) span.textContent = q - 1;
  });
  
  document.getElementById('qtyInc').addEventListener('click', () => {
    const span = document.getElementById('qvQty');
    let q = parseInt(span.textContent);
    span.textContent = q + 1;
  });
  
  // Modal Add to Cart Action
  document.getElementById('qvAddToCartBtn').addEventListener('click', () => {
    const qty = parseInt(document.getElementById('qvQty').textContent);
    let measurements = null;
    
    if (selectedSize === 'custom') {
      const chest = document.getElementById('mChest').value.trim();
      const waist = document.getElementById('mWaist').value.trim();
      const hips = document.getElementById('mHips').value.trim();
      const shoulders = document.getElementById('mShoulders').value.trim();
      const height = document.getElementById('mHeight').value.trim();
      
      if (!chest || !waist || !hips || !shoulders || !height) {
        alert(translations[currentLang].validation_measurements);
        return;
      }
      measurements = { chest, waist, hips, shoulders, height };
    }
    
    addToCart(activeProductId, selectedSize, qty, measurements);
    closeModal('quickViewModal');
  });
  
  // Shipping Form Event Handlers
  document.getElementById('clientWilaya').addEventListener('change', (e) => {
    const code = e.target.value;
    const commSelect = document.getElementById('clientCommune');
    if (commSelect) {
      const communes = communesData[code] || [];
      commSelect.innerHTML = '';
      if (communes.length > 0) {
        commSelect.innerHTML = `<option value="" disabled selected>${currentLang === 'ar' ? 'اختر البلدية...' : 'Choisir la commune...'}</option>`;
        communes.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          commSelect.appendChild(opt);
        });
        commSelect.disabled = false;
      } else {
        commSelect.innerHTML = '<option value="" disabled selected>لا تتوفر بلديات</option>';
        commSelect.disabled = true;
      }
    }
    renderCart();
  });
  document.getElementById('deskDelivery').addEventListener('click', renderCart);
  
  // Checkout Form Submission
  document.getElementById('submitOrderBtn').addEventListener('click', (e) => {
    const form = document.getElementById('checkoutForm');
    if (form.reportValidity()) {
      handleOrderSubmit(e);
    }
  });
  
  // Initialize Rendering
  switchLanguage(currentLang);
  renderInstagram();
  updateHeaderBadges();
});

/* Duplicate chapter dots update removed to prevent chapters redeclaration error */

/* ---------------- Runway Video Labels Translate ---------------- */
(function() {
  const video = document.getElementById('modelVideo');
  const label = document.getElementById('runwayLabel');
  if (!video || !label) return;
  
  const stepLabelsAR = [
    'تظهر من بعيد بين الأقواس المغربية',
    'القفطان الأسود يتقدّم بثقة',
    'خيوط الذهب تتلألأ مع كل خطوة',
    'التطريز يتّضح تفصيلاً بتفصيل',
    'وجهًا لوجه معكِ'
  ];
  
  const stepLabelsFR = [
    'Apparition au loin sous les arches mauresques',
    'Le Caftan Noir avance avec assurance',
    'Les fils d\'or scintillent à chaque pas',
    'Les broderies se révèlent détail par détail',
    'Face à face avec vous'
  ];
  
  video.addEventListener('timeupdate', () => {
    const p = video.currentTime / video.duration;
    const list = currentLang === 'ar' ? stepLabelsAR : stepLabelsFR;
    const i = Math.min(list.length - 1, Math.floor(p * list.length));
    label.textContent = list[i];
  });
})();

/* ================================================================
   PRODUCT PAGE — Full-screen high-conversion order page logic
   ================================================================ */

/* ---------- Algerian Communes per Wilaya (representative) ---------- */
const communesData = {
  '01': ['أدرار','تيميمون','رقان','أولف','بودة','تسابيت','فنوغيل','أقبلي','عين صالح'],
  '02': ['الشلف','أم الدروع','بني حواء','تاجنة','بوقادير','هرازة','الكريمة','العبادية','تنس'],
  '03': ['الأغواط','عين مهدي','قصر الحيران','آفلو','تاجموت','سيدي مخلوف','برج بن غسي','حاسي الرمل'],
  '04': ['أم البواقي','عين البيضاء','عين فكرون','سيقوس','الضلعة','عين القرماز','مسكيانة'],
  '05': ['باتنة','عين التوتة','تيمقاد','بريكة','مروانة','أريس','سريانة','لمبيس','نقاوس'],
  '06': ['بجاية','أقبو','خرطة','أميزور','سيدي عيش','الكمان','تيشي','إيغيل علي','ببريون'],
  '07': ['بسكرة','أولاد جلال','طولقة','سيدي عقبة','زريبة الوادي','ليشانة','مشونش','القنطرة'],
  '08': ['بشار','أبادلة','تاغيت','بني عباس','القنادسة','بني ونيف','الصفيصيفة'],
  '09': ['البليدة','الأربعاء','بوفاريك','لربعاء','مفتاح','بني تامو','شريعة','عزازقة','الأخضرية'],
  '10': ['البويرة','عين بسام','المحمدية','عين لحجر','سور الغزلان','لخضرية','بكيرة','حيزر'],
  '11': ['تمنراست','عين قزام','عين صالح','إدلس'],
  '12': ['تبسة','العوينات','الماء الأبيض','الشريعة','بكاريا','شريعة','أولاد رحمون'],
  '13': ['تلمسان','بني مستار','نداموا','أولاد ميمون','حمام بوغرارة','سبدو','المسيرة','باب العسة'],
  '14': ['تيارت','فرندة','مهدية','قصر الشلالة','وادي ليلي','تيسة','سيدي بختي'],
  '15': ['تيزي وزو','عزازقة','درع الميزان','إيفيغا','أزفون','آث يني','واضية','أيت محمد'],
  '16': ['الجزائر العاصمة','باب الوادي','المدنية','حيدرة','القبة','الدار البيضاء','برج الكيفان','المرادية','الحراش','دالي إبراهيم','بن عكنون','بابا حسن','العاشور','بن طلحة'],
  '17': ['الجلفة','عين وسارة','مسعد','حاسي بحبح','سلمانة','البيرينة','زكار','فيض البطمة'],
  '18': ['جيجل','الطاهير','زيامة منصورية','القنار','سيدي معروف','تكسانة','الميلية','الشقفة'],
  '19': ['سطيف','عين أرنات','بني عزيز','بوعنداس','العلمة','معاوية','بوقاعة','عين البشر'],
  '20': ['سعيدة','يوب','أولاد ابراهيم','أيون','سيدي أحمد','سيدي بوبكر'],
  '21': ['سكيكدة','عزابة','فيلفيلة','الحدائق','زردازة','القل','رمضان جمال','كركرة'],
  '22': ['سيدي بلعباس','مرحوم','تنيرة','سفيزف','محمد بن علي','مراسم'],
  '23': ['عنابة','البوني','عين البيضاء','سرايدي','بن مهيدي','الشرفة'],
  '24': ['قالمة','بوشقوف','حمام دباغ','عين مخلوف','المحر','بلخير'],
  '25': ['قسنطينة','الخروب','إبن زياد','أولاد رحمون','بني حميدان','مسقم','عين أبيد','زيغود يوسف'],
  '26': ['المدية','بجاعة','الحمدانية','القلب الكبير','عزيزة','أولاد دايد','سگار'],
  '27': ['مستغانم','سيدي علي','عين تادلس','صيادة','مزغران','خير الدين','أشعاشعة'],
  '28': ['المسيلة','بوسعادة','مجدل','سيدي عيسى','مطارفة','أولاد ماضي'],
  '29': ['معسكر','بوهران','تغنيف','ماوسة','سيق','الغمري'],
  '30': ['ورقلة','تقرت','عين البيضاء','حاسي مسعود','النزلة','سيدي خويلد','المقارين'],
  '31': ['وهران','أرزيو','مرسى الكبير','عين تركي','سيدي الشحمي','بئر الجير','وادي تليلات'],
  '32': ['البيض','بوقطب','الأبيض سيدي الشيخ','تيوت','العبادلة'],
  '33': ['إليزي','برج عمر إدريس','جانت'],
  '34': ['برج بوعريريج','بوعريريج','رأس الوادي','الحمامة','المنصورة','بئر قاصد علي'],
  '35': ['بومرداس','ثنية الأحد','برج منايل','الخميس','نسيغة','نادر','أفسوس'],
  '36': ['الطارف','الحجار','بوثلجة','شعبة لحنة','رمادنية','القالة'],
  '37': ['تندوف','عمار'],
  '38': ['تيسمسيلت','ثنية الحد','المعاصم','لبديء','كمال'],
  '39': ['الوادي','الرباح','حمرية','دبيلة','الطالب العربي','ورماس'],
  '40': ['خنشلة','بابار','أولاد رشاش','بغاي','الرميلة'],
  '41': ['سوق أهراس','سدراتة','عين زانة','راس الكنتور','مداوروش'],
  '42': ['تيبازة','الشرفة','أقبو','بوهارون','العصافير','سيدي غيلاس'],
  '43': ['ميلة','شلغوم العيد','سيدي مروان','عين تيني','أحمد راشدي','راشد'],
  '44': ['عين الدفلى','حمدان','الخميس','أبو الحسن','رواينة','جمعة أولاد شعيب'],
  '45': ['النعامة','مشرية','تيوت','الصفيصيفة','بلبال','أسلا'],
  '46': ['عين تموشنت','حمام بوحجر','بن عزوز','سيدي الطيب','واد الصباح'],
  '47': ['غرداية','متليلي الشعانبة','بريان','القرارة','زلفانة','سبسب'],
  '48': ['غليزان','جديوية','بلهامد','عميرة أرواو','وادي رهيو'],
  '49': ['تيميمون','أولاد سعيد','بودة','شروين'],
  '50': ['برج باجي مختار','تيمياوين'],
  '51': ['أولاد جلال','سيدي خالد','المدائن'],
  '52': ['بني عباس','بشار'],
  '53': ['عين صالح','فقارة الزوى'],
  '54': ['عين قزام','تيمياوين'],
  '55': ['تقرت','الزاوية العابدية','العالية','تماسين'],
  '56': ['جانت','إيليزي'],
  '57': ['المغير','أولاد الرابح'],
  '58': ['المنيعة','حاسي فحل']
};

/* Product-specific reviews */
const productReviews = {
  'caftan-zahia': [
    { text: 'القفطان أكثر من رائع، الخياطة دقيقة جداً والألوان طبيعية تماماً. شعرت وكأنني ملكة!', who: 'سارة م.', wilaya: 'الجزائر العاصمة', rating: 5 },
    { text: 'لم أتوقع هذه الجودة الرائعة. التطريز الذهبي يبدو أصيلاً وراقياً جداً. شكراً زاڤيرا!', who: 'نور هـ.', wilaya: 'وهران', rating: 5 },
    { text: 'التوصيل كان في الوقت المحدد، والتغليف فاخر جداً. القفطان تحفة فنية.', who: 'آمال ب.', wilaya: 'قسنطينة', rating: 5 }
  ],
  'karakou-velvet': [
    { text: 'الكراكو تحفة فنية والتطريز يدوي بامتياز. اشتريته لخطبتي وكان مثالياً.', who: 'ليلى س.', wilaya: 'عنابة', rating: 5 },
    { text: 'المخمل ناعم جداً والفتلة الذهبية رائعة. أنصح كل من يريد قطعة أصيلة.', who: 'منال ك.', wilaya: 'سطيف', rating: 5 },
    { text: 'أفضل كراكو اشتريته في حياتي. السروال من الحرير الذهبي انسيابي ومريح.', who: 'خديجة ع.', wilaya: 'بجاية', rating: 5 }
  ],
  'dress-star': [
    { text: 'فستان السهرة أنيق جداً، الحرير الناعم يلمس الجسم بطريقة رائعة. كنت نجمة الليلة!', who: 'رانيا ف.', wilaya: 'الجزائر العاصمة', rating: 5 },
    { text: 'اللون الكحلي جميل جداً والتصميم عصري. أنصح به بشدة لكل سهرة.', who: 'سلمى ي.', wilaya: 'تلمسان', rating: 5 },
    { text: 'سرعة التوصيل ممتازة وجودة القماش تفوق التوقعات. زاڤيرا الأفضل دائماً!', who: 'نسرين ح.', wilaya: 'قسنطينة', rating: 5 }
  ],
  'caftan-alhambra': [
    { text: 'التطريزات كثيفة ومذهلة، كأنه قادم من قصور الأندلس. أجمل ما اشتريته!', who: 'فاطمة ز.', wilaya: 'تلمسان', rating: 5 },
    { text: 'اللون العاجي رائع والحزام الملكي أضاف إطلالة ملكية. شكراً!', who: 'حنان م.', wilaya: 'وهران', rating: 5 },
    { text: 'قطعة استثنائية لمناسبة استثنائية. ارتديته في عرسي وكان كل شيء مثالياً.', who: 'إيمان ب.', wilaya: 'الجزائر العاصمة', rating: 5 }
  ],
  'wedding-princess': [
    { text: 'فستان الزفاف فاق توقعاتي بكثير، شعرت وكأنني أميرة في يومي الكبير.', who: 'ليلى ع.', wilaya: 'وهران', rating: 5 },
    { text: 'الدانتيل الفرنسي رائع جداً والتفاصيل دقيقة بشكل لا يصدق. يستحق كل دينار!', who: 'زهرة م.', wilaya: 'الجزائر العاصمة', rating: 5 },
    { text: 'زوجي أبكاني من جمال الفستان! التصميم الملكي حقق حلمي.', who: 'سهام ك.', wilaya: 'عنابة', rating: 5 }
  ]
};

/* Default reviews for products without specific reviews */
const defaultReviews = [
  { text: 'جودة استثنائية ومواد فاخرة جداً. لم أتوقع هذا المستوى من الاحترافية!', who: 'فاطمة ر.', wilaya: 'الجزائر العاصمة', rating: 5 },
  { text: 'التوصيل في الوقت المحدد والتغليف فاخر. القطعة تحفة فنية حقيقية.', who: 'نادية ل.', wilaya: 'قسنطينة', rating: 5 },
  { text: 'الدفع عند الاستلام أراحني كثيراً. أنصح كل من يريد قطعة أصيلة بزاڤيرا!', who: 'مريم ح.', wilaya: 'وهران', rating: 5 }
];

/* Category mapping */
const categoryMap = {
  'caftan-zahia': 'القفطان الفاخر',
  'caftan-alhambra': 'القفطان الفاخر',
  'caftan-hand': 'القفطان المطرز',
  'caftan-tlemcen': 'القفطان التلمساني',
  'karakou-velvet': 'الكراكو الجزائري',
  'karakou-jewel': 'الكراكو الجزائري',
  'karakou-fetla': 'الكراكو الجزائري',
  'karakou-red': 'الكراكو الجزائري',
  'dress-star': 'فساتين السهرة',
  'wedding-princess': 'مجموعة الزفاف',
  'wedding-lace': 'مجموعة الزفاف',
  'wedding-classic': 'مجموعة الزفاف'
};

/* Feature bullets per category */
const categoryFeatures = {
  'القفطان الفاخر': ['تطريز يدوي بخيوط الذهب الأصيلة','قماش حرير ومخمل فاخر مستورد','قصة أندلسية تليق بالملكات','تغليف فاخر مع شهادة الأصالة'],
  'القفطان المطرز': ['تطريز يدوي بالخيوط والمجوهرات','قماش خفيف ومريح للمناسبات العائلية','مثالي للاستقبالات والأفراح','متاح للتعديل على المقاس الخاص'],
  'القفطان التلمساني': ['مستوحى من التراث التلمساني الأصيل','نقوش ذهبية واسعة وحزام مذهب','يعبر عن هوية الغرب الجزائري','حرفة أجيال متوارثة'],
  'الكراكو الجزائري': ['تطريز فتلة ذهبية تقليدية أصيلة','قطيفة (مخمل) ملكي فاخر','سروال شلقة من الحرير الذهبي','قطعة تراثية خالدة للمناسبات'],
  'فساتين السهرة': ['حرير طبيعي ناعم اللمس','قصة عصرية أنيقة','تفاصيل ذهبية تقليدية','مثالية للسهرات والمناسبات الراقية'],
  'مجموعة الزفاف': ['دانتيل فرنسي فاخر أو حرير طبيعي','تصميم ملكي لليلة العمر','تفصيل على المقاس متاح','شامل للإكسسوارات المطابقة']
};

/* -------------------- Product Page State -------------------- */
let ppCurrentProduct = null;
let ppDeliveryType = 'home'; // 'home' or 'desk'
let ppCountdownEnd = null;
let ppCountdownInterval = null;
let ppViewerInterval = null;

/* -------------------- Open Product Page -------------------- */
function openProductPage(productId) {
  const p = productsData.find(item => item.id === productId);
  if (!p) return;
  
  ppCurrentProduct = p;
  const page = document.getElementById('productPage');
  if (!page) return;
  
  // Populate Image
  const galleryImg = document.getElementById('ppGalleryImg');
  if (galleryImg) {
    galleryImg.style.backgroundImage = `url('${p.image}')`;
    galleryImg.style.backgroundSize = 'cover';
    galleryImg.style.backgroundPosition = 'center top';
  }
  
  // Badge
  const badge = document.getElementById('ppGalleryBadge');
  const tagText = currentLang === 'ar' ? p.tag : p.tag_fr;
  if (badge) {
    if (tagText) {
      badge.textContent = tagText;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
  
  // Category
  const catEl = document.getElementById('ppCategory');
  if (catEl) catEl.textContent = categoryMap[productId] || 'منتجات';
  
  // Title
  const titleEl = document.getElementById('ppTitle');
  if (titleEl) titleEl.textContent = currentLang === 'ar' ? p.name : p.name_fr;
  
  // Subtitle / tagline
  const subEl = document.getElementById('ppSubtitle');
  if (subEl) subEl.textContent = 'صناعة يدوية · حرفة جزائرية أصيلة · تغليف فاخر';
  
  // Random review count (social proof)
  const rvCount = document.getElementById('ppReviewCount');
  if (rvCount) rvCount.textContent = Math.floor(140 + Math.random() * 300);
  
  // Price
  const priceEl = document.getElementById('ppPrice');
  if (priceEl) priceEl.textContent = formatPrice(p.price);
  
  const oldPriceEl = document.getElementById('ppOldPrice');
  const discBadge = document.getElementById('ppDiscountBadge');
  if (p.oldPrice) {
    if (oldPriceEl) { oldPriceEl.textContent = formatPrice(p.oldPrice); oldPriceEl.style.display = 'inline'; }
    if (discBadge) {
      const pct = Math.round((1 - p.price / p.oldPrice) * 100);
      discBadge.textContent = `-${pct}%`;
      discBadge.style.display = 'inline';
    }
  } else {
    if (oldPriceEl) oldPriceEl.style.display = 'none';
    if (discBadge) discBadge.style.display = 'none';
  }
  
  // Description
  const descEl = document.getElementById('ppDesc');
  if (descEl) descEl.textContent = currentLang === 'ar' ? p.desc : p.desc_fr;
  
  // Features
  const featuresEl = document.getElementById('ppFeatures');
  if (featuresEl) {
    const cat = categoryMap[productId] || 'القفطان الفاخر';
    const feats = categoryFeatures[cat] || categoryFeatures['القفطان الفاخر'];
    const icons = ['🧵','🪡','✂️','📦','⭐','💎'];
    featuresEl.innerHTML = feats.map((f, i) => `
      <div class="pp-feature">
        <div class="pp-feature-icon">${icons[i % icons.length]}</div>
        <span>${f}</span>
      </div>
    `).join('');
  }
  
  // Order summary - product name
  const sumProd = document.getElementById('ppSumProduct');
  if (sumProd) sumProd.textContent = currentLang === 'ar' ? p.name : p.name_fr;
  const sumPrice = document.getElementById('ppSumPrice');
  if (sumPrice) sumPrice.textContent = formatPrice(p.price);
  
  // Populate wilayas dropdown
  ppPopulateWilayas();
  
  // Reset form
  const form = document.getElementById('ppOrderForm');
  if (form) form.reset();
  document.getElementById('ppWilaya').value = '';
  document.getElementById('ppCommune').innerHTML = '<option value="" disabled selected>اختاري أولاً الولاية...</option>';
  document.getElementById('ppCommune').disabled = true;
  document.getElementById('ppSumShipping').textContent = 'اختاري الولاية';
  document.getElementById('ppSumTotal').textContent = '—';
  document.getElementById('ppHomeFee').textContent = '—';
  document.getElementById('ppDeskFee').textContent = '—';
  
  // Reset size selection
  document.querySelectorAll('.pp-size-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-size') === '38');
  });
  const customSec = document.getElementById('ppCustomMeasurementsSection');
  if (customSec) {
    customSec.style.display = 'none';
  }
  ['ppMChest', 'ppMWaist', 'ppMHips', 'ppMShoulders', 'ppMHeight'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = '';
      el.classList.remove('valid', 'invalid');
    }
  });
  
  // Reset delivery type
  ppDeliveryType = 'home';
  document.getElementById('ppDeliveryHome').classList.add('active');
  document.getElementById('ppDeliveryDesk').classList.remove('active');
  
  // Render reviews
  ppRenderReviews(productId);
  
  // Start countdown (random 1-3 hours)
  ppStartCountdown();
  
  // Start viewer simulation
  ppStartViewerSim();
  
  // Show page
  page.classList.add('open');
  page.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

/* -------------------- Close Product Page -------------------- */
function closeProductPage() {
  const page = document.getElementById('productPage');
  if (!page) return;
  page.classList.remove('open');
  document.body.style.overflow = '';
  
  // Stop intervals
  if (ppCountdownInterval) clearInterval(ppCountdownInterval);
  if (ppViewerInterval) clearInterval(ppViewerInterval);
}

/* -------------------- Populate Wilayas -------------------- */
function ppPopulateWilayas() {
  const sel = document.getElementById('ppWilaya');
  if (!sel) return;
  sel.innerHTML = '<option value="" disabled selected>اختاري الولاية...</option>';
  wilayas.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.code;
    opt.textContent = `${w.code} - ${w.name}`;
    sel.appendChild(opt);
  });
}

/* -------------------- Populate Communes -------------------- */
function ppPopulateCommunes(wilayaCode) {
  const sel = document.getElementById('ppCommune');
  if (!sel) return;
  
  const communes = communesData[wilayaCode] || [];
  if (communes.length === 0) {
    sel.innerHTML = '<option value="" disabled selected>لا تتوفر بلديات محددة</option>';
    sel.disabled = true;
    return;
  }
  
  sel.innerHTML = '<option value="" disabled selected>اختاري البلدية...</option>';
  communes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
  sel.disabled = false;
}

/* -------------------- Update Shipping Info -------------------- */
function ppUpdateShipping() {
  if (!ppCurrentProduct) return;
  
  const wilayaCode = document.getElementById('ppWilaya').value;
  if (!wilayaCode) return;
  
  const w = wilayas.find(item => item.code === wilayaCode);
  if (!w) return;
  
  const homeFee = w.homeFee;
  const deskFee = w.deskFee;
  
  // Update delivery buttons prices
  document.getElementById('ppHomeFee').textContent = formatPrice(homeFee);
  document.getElementById('ppDeskFee').textContent = formatPrice(deskFee);
  
  // Current shipping
  const shipping = ppDeliveryType === 'home' ? homeFee : deskFee;
  const total = ppCurrentProduct.price + shipping;
  
  document.getElementById('ppSumShipping').textContent = formatPrice(shipping);
  document.getElementById('ppSumTotal').textContent = formatPrice(total);
}

/* -------------------- Render PP Reviews -------------------- */
function ppRenderReviews(productId) {
  const grid = document.getElementById('ppReviewsGrid');
  if (!grid) return;
  
  const reviews = productReviews[productId] || defaultReviews;
  grid.innerHTML = reviews.map(r => `
    <div class="pp-review">
      <div class="stars">${'★'.repeat(r.rating)}</div>
      <p>"${r.text}"</p>
      <div class="who">${r.who}</div>
      <div class="wilaya">📍 ${r.wilaya}</div>
    </div>
  `).join('');
}

/* -------------------- Countdown Timer -------------------- */
function ppStartCountdown() {
  if (ppCountdownInterval) clearInterval(ppCountdownInterval);
  
  // Random 1-3 hours remaining
  const mins = 60 + Math.floor(Math.random() * 120);
  const secs = Math.floor(Math.random() * 60);
  let totalSeconds = mins * 60 + secs;
  
  function updateDisplay() {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    
    const cdH = document.getElementById('ppCdHours');
    const cdM = document.getElementById('ppCdMinutes');
    const cdS = document.getElementById('ppCdSeconds');
    const inline = document.getElementById('ppTimerInline');
    
    if (cdH) cdH.textContent = hh;
    if (cdM) cdM.textContent = mm;
    if (cdS) cdS.textContent = ss;
    if (inline) inline.textContent = `${hh}:${mm}:${ss}`;
    
    if (totalSeconds > 0) totalSeconds--;
  }
  
  updateDisplay();
  ppCountdownInterval = setInterval(updateDisplay, 1000);
}

/* -------------------- Viewer Simulation -------------------- */
function ppStartViewerSim() {
  if (ppViewerInterval) clearInterval(ppViewerInterval);
  
  let viewers = 8 + Math.floor(Math.random() * 20);
  const el = document.getElementById('ppViewerCount');
  if (el) el.textContent = viewers;
  
  ppViewerInterval = setInterval(() => {
    const delta = Math.floor(Math.random() * 5) - 2;
    viewers = Math.max(5, Math.min(35, viewers + delta));
    const el = document.getElementById('ppViewerCount');
    if (el) el.textContent = viewers;
  }, 4000 + Math.random() * 4000);
}

/* -------------------- PP Order Form Submit -------------------- */
function ppHandleOrderSubmit(e) {
  // [معزول بالكامل] الطلبات لا ترسل إلى لوحة التحكم لحماية الخصوصية ومطابقة إعدادات المتجر الساكن
  e.preventDefault();
  
  const name = document.getElementById('ppName').value.trim();
  const phone = document.getElementById('ppPhone').value.trim().replace(/\s+/g, '');
  const wilayaCode = document.getElementById('ppWilaya').value;
  const commune = document.getElementById('ppCommune').value;
  const address = document.getElementById('ppAddress').value.trim();
  
  // Size selection
  const sizeBtn = document.querySelector('.pp-size-btn.active');
  const size = sizeBtn ? sizeBtn.getAttribute('data-size') : '38';
  
  let customMeasurements = null;
  
  // Validate
  if (!name) {
    ppHighlightField('ppName', false);
    ppShakeBtn();
    return;
  }
  ppHighlightField('ppName', true);
  
  const phoneRegex = /^(05|06|07)[0-9]{8}$/;
  if (!phoneRegex.test(phone)) {
    ppHighlightField('ppPhone', false);
    showToast('⚠️ يرجى إدخال رقم هاتف صحيح (مثال: 0550123456)', '', null);
    ppShakeBtn();
    return;
  }
  ppHighlightField('ppPhone', true);
  
  // Custom Size validations
  if (size === 'custom') {
    const chest = document.getElementById('ppMChest').value.trim();
    const waist = document.getElementById('ppMWaist').value.trim();
    const hips = document.getElementById('ppMHips').value.trim();
    const shoulders = document.getElementById('ppMShoulders').value.trim();
    const height = document.getElementById('ppMHeight').value.trim();
    
    if (!chest || !waist || !hips || !shoulders || !height) {
      showToast('⚠️ يرجى ملء جميع حقول المقاس المخصص لبدء التفصيل', '', null);
      ['ppMChest', 'ppMWaist', 'ppMHips', 'ppMShoulders', 'ppMHeight'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) {
          el.style.borderColor = '#e53935';
        } else if (el) {
          el.style.borderColor = 'var(--line)';
        }
      });
      ppShakeBtn();
      return;
    }
    
    customMeasurements = { chest, waist, hips, shoulders, height };
    // reset border color
    ['ppMChest', 'ppMWaist', 'ppMHips', 'ppMShoulders', 'ppMHeight'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.borderColor = 'var(--line)';
    });
  }
  
  if (!wilayaCode) {
    document.getElementById('ppWilaya').style.borderColor = '#e53935';
    showToast('⚠️ يرجى اختيار الولاية', '', null);
    ppShakeBtn();
    return;
  }
  document.getElementById('ppWilaya').style.borderColor = '#4caf50';
  
  if (!commune) {
    document.getElementById('ppCommune').style.borderColor = '#e53935';
    showToast('⚠️ يرجى اختيار البلدية', '', null);
    ppShakeBtn();
    return;
  }
  document.getElementById('ppCommune').style.borderColor = '#4caf50';
  
  if (!address) {
    ppHighlightField('ppAddress', false);
    ppShakeBtn();
    return;
  }
  ppHighlightField('ppAddress', true);
  
  // Loading state
  const btn = document.getElementById('ppSubmitBtn');
  const btnText = btn.querySelector('.btn-text');
  const spinner = document.getElementById('ppSpinner');
  
  btn.disabled = true;
  if (btnText) btnText.style.display = 'none';
  if (spinner) spinner.style.display = 'block';
  
  // Simulate API call (1.5s delay)
  setTimeout(() => {
    btn.disabled = false;
    if (btnText) btnText.style.display = 'block';
    if (spinner) spinner.style.display = 'none';
    
    // Build success
    const p = ppCurrentProduct;
    if (!p) return;
    
    const selectedWilaya = wilayas.find(w => w.code === wilayaCode);
    const wilayaName = selectedWilaya ? selectedWilaya.name : wilayaCode;
    const shipping = ppDeliveryType === 'home' ? selectedWilaya.homeFee : selectedWilaya.deskFee;
    const total = p.price + shipping;
    const orderId = '#ZF-' + Math.floor(1000 + Math.random() * 9000);
    const productName = currentLang === 'ar' ? p.name : p.name_fr;
    const deliveryText = ppDeliveryType === 'home' ? '🏠 توصيل للمنزل' : '🏢 Stop Desk';
    const notes = document.getElementById('ppNotes').value.trim();
    
    const sizeDisplay = size === 'custom' 
      ? (currentLang === 'ar' ? '📐 تفصيل مخصص' : '📐 Sur Mesure') 
      : `FR ${size}`;
      
    let measHTML = '';
    if (customMeasurements) {
      measHTML = `
        <div style="font-size:0.75rem;color:var(--gold);margin-top:2px;direction:ltr;text-align:right;">
          [صدر: ${customMeasurements.chest} | خصر: ${customMeasurements.waist} | أوراك: ${customMeasurements.hips} | كتفين: ${customMeasurements.shoulders} | طول: ${customMeasurements.height}]
        </div>
      `;
    }
    
    // Fill success overlay
    document.getElementById('ppSuccessOrderId').textContent = orderId;
    
    const invoiceEl = document.getElementById('ppSuccessInvoice');
    if (invoiceEl) {
      invoiceEl.innerHTML = `
        <div style="margin-bottom:6px;"><strong>العميلة:</strong> ${name}</div>
        <div style="margin-bottom:6px;"><strong>الهاتف:</strong> ${phone}</div>
        <div style="margin-bottom:6px;"><strong>الولاية:</strong> ${wilayaCode} - ${wilayaName}</div>
        <div style="margin-bottom:6px;"><strong>البلدية:</strong> ${commune}</div>
        <div style="margin-bottom:6px;"><strong>العنوان:</strong> ${address}</div>
        <div style="margin-bottom:6px;"><strong>المقاس:</strong> ${sizeDisplay} ${measHTML}</div>
        <div style="margin-bottom:6px;"><strong>التوصيل:</strong> ${deliveryText}</div>
        ${notes ? `<div style="margin-bottom:6px;"><strong>ملاحظات:</strong> ${notes}</div>` : ''}
        <div style="border-top:1px dashed rgba(184,134,58,0.3);margin:10px 0;padding-top:10px;">
          <div style="margin-bottom:4px;"><strong>المنتج:</strong> ${productName} — ${formatPrice(p.price)}</div>
          <div style="margin-bottom:4px;"><strong>الشحن:</strong> ${formatPrice(shipping)}</div>
          <div style="font-weight:700;color:var(--gold);font-size:1rem;"><strong>الإجمالي:</strong> ${formatPrice(total)}</div>
        </div>
      `;
    }
    
    const purchaseEventId = 'ZF-EV-' + orderId.replace('#', '');
    trackBrowserEvent('Purchase', { value: total, event_id: purchaseEventId });

    const newOrder = {
      id: orderId.replace('#', ''),
      name: name,
      phone: phone,
      wilaya: wilayaName,
      product: productName,
      amount: total,
      status: 'pending',
      date: new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      pixelEventId: purchaseEventId
    };
    
    // Save order to server with localStorage fallback
    (async function() {
      try {
        const BACKEND_URL = window.location.hostname === 'zaphera-coftan-pro-1.onrender.com' ? 'https://zaphera-coftan-pro-1-m.onrender.com' : '';
        const response = await fetch(BACKEND_URL + '/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(newOrder)
        });
        if (response.ok) {
          console.log('Order persisted on server');
          return;
        }
      } catch (err) {
        console.warn('Backend server unreachable, falling back to local storage', err);
      }
      // Fallback to localStorage
      const savedOrders = JSON.parse(localStorage.getItem('zf_orders') || '[]');
      savedOrders.unshift(newOrder);
      localStorage.setItem('zf_orders', JSON.stringify(savedOrders));
    })();

    // Show success
    const successEl = document.getElementById('ppSuccess');
    if (successEl) successEl.classList.add('show');
    
    // Stop countdown and viewers
    if (ppCountdownInterval) clearInterval(ppCountdownInterval);
    if (ppViewerInterval) clearInterval(ppViewerInterval);
    
  }, 1500);
}

function ppHighlightField(fieldId, isValid) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.toggle('valid', isValid);
  el.classList.toggle('invalid', !isValid);
}

function ppShakeBtn() {
  const btn = document.getElementById('ppSubmitBtn');
  if (!btn) return;
  btn.style.animation = 'none';
  btn.style.transform = 'translateX(-5px)';
  setTimeout(() => {
    btn.style.transform = 'translateX(5px)';
    setTimeout(() => {
      btn.style.transform = '';
      btn.style.animation = 'btn-pulse 3s ease-in-out infinite';
    }, 100);
  }, 100);
}

/* -------------------- Setup PP Event Listeners -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  
  // Back button
  const ppBackBtn = document.getElementById('ppBackBtn');
  if (ppBackBtn) ppBackBtn.addEventListener('click', closeProductPage);

  // Size buttons handler
  document.querySelectorAll('.pp-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pp-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const size = btn.getAttribute('data-size');
      const customSec = document.getElementById('ppCustomMeasurementsSection');
      if (customSec) {
        if (size === 'custom') {
          customSec.style.display = 'block';
          customSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          customSec.style.display = 'none';
        }
      }
    });
  });
  
  // Wilaya change
  const ppWilayaSel = document.getElementById('ppWilaya');
  if (ppWilayaSel) {
    ppWilayaSel.addEventListener('change', (e) => {
      const code = e.target.value;
      ppPopulateCommunes(code);
      ppUpdateShipping();
      e.target.style.borderColor = 'var(--gold)';
    });
  }
  
  // Commune change
  const ppCommuneSel = document.getElementById('ppCommune');
  if (ppCommuneSel) {
    ppCommuneSel.addEventListener('change', (e) => {
      e.target.style.borderColor = 'var(--gold)';
    });
  }
  
  // Delivery toggle
  const homeBtn = document.getElementById('ppDeliveryHome');
  const deskBtn = document.getElementById('ppDeliveryDesk');
  
  if (homeBtn) homeBtn.addEventListener('click', () => {
    ppDeliveryType = 'home';
    homeBtn.classList.add('active');
    deskBtn.classList.remove('active');
    ppUpdateShipping();
  });
  
  if (deskBtn) deskBtn.addEventListener('click', () => {
    ppDeliveryType = 'desk';
    deskBtn.classList.add('active');
    homeBtn.classList.remove('active');
    ppUpdateShipping();
  });
  
  // Order form submit
  const ppForm = document.getElementById('ppOrderForm');
  if (ppForm) ppForm.addEventListener('submit', ppHandleOrderSubmit);
  
  // Success close
  const ppSuccessClose = document.getElementById('ppSuccessCloseBtn');
  if (ppSuccessClose) {
    ppSuccessClose.addEventListener('click', () => {
      document.getElementById('ppSuccess').classList.remove('show');
      closeProductPage();
    });
  }
  
  // Keyboard close (Escape)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const page = document.getElementById('productPage');
      if (page && page.classList.contains('open')) {
        closeProductPage();
      }
    }
  });
  
  // Input real-time validation
  ['ppName', 'ppPhone', 'ppAddress'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (el.value.trim().length > 2) {
          el.classList.add('valid');
          el.classList.remove('invalid');
        }
      });
    }
  });
  
  // Phone-specific validation
  const ppPhone = document.getElementById('ppPhone');
  if (ppPhone) {
    ppPhone.addEventListener('blur', () => {
      const v = ppPhone.value.trim().replace(/\s+/g, '');
      const phoneRegex = /^(05|06|07)[0-9]{8}$/;
      if (v && !phoneRegex.test(v)) {
        ppPhone.classList.add('invalid');
        ppPhone.classList.remove('valid');
      } else if (v) {
        ppPhone.classList.add('valid');
        ppPhone.classList.remove('invalid');
      }
    });
  }

  // Start live purchase notification alerts
  startLiveSocialProofAlerts();
});

/* -------------------- Live Social Proof Alerts (القناع الوحشي) -------------------- */
function startLiveSocialProofAlerts() {
  const names = ['سارة', 'فاطمة', 'أمينة', 'مريم', 'ليلى', 'سميرة', 'ياسمين', 'إيمان', 'خديجة', 'نور الهدى', 'نهال', 'هدى', 'أسماء', 'أحلام', 'آمال'];
  const wilayasList = ['الجزائر العاصمة', 'وهران', 'قسنطينة', 'تلمسان', 'عنابة', 'سطيف', 'البليدة', 'بجاية', 'باتنة', 'جيجل', 'تيبازة', 'بسكرة', 'بومرداس', 'شلف'];
  const times = ['قبل دقيقة', 'قبل دقيقتين', 'قبل 3 دقائق', 'قبل 5 دقائق', 'منذ دقيقة', 'منذ 4 دقائق'];
  const timesFR = ['il y a 1 min', 'il y a 2 min', 'il y a 3 min', 'il y a 5 min', 'à l\'instant'];
  
  const popup = document.getElementById('liveAlertPopup');
  const alertText = document.getElementById('liveAlertText');
  const alertTime = document.getElementById('liveAlertTime');
  if (!popup || !alertText || !alertTime) return;
  
  function triggerAlert() {
    // Pick random product
    const p = productsData[Math.floor(Math.random() * productsData.length)];
    if (!p) return;
    
    const name = names[Math.floor(Math.random() * names.length)];
    const wilaya = wilayasList[Math.floor(Math.random() * wilayasList.length)];
    const time = currentLang === 'ar' 
      ? times[Math.floor(Math.random() * times.length)]
      : timesFR[Math.floor(Math.random() * timesFR.length)];
      
    const prodName = currentLang === 'ar' ? p.name : p.name_fr;
    
    if (currentLang === 'ar') {
      alertText.innerHTML = `قامت العضوة <strong>${name}</strong> من <strong>${wilaya}</strong> بطلب 🛍️ <strong>${prodName}</strong>`;
      alertTime.textContent = time;
    } else {
      alertText.innerHTML = `<strong>${name}</strong> de <strong>${wilaya}</strong> a commandé 🛍️ <strong>${prodName}</strong>`;
      alertTime.textContent = time;
    }
    
    // Show popup
    popup.classList.add('show');
    
    // Hide popup after 5 seconds
    setTimeout(() => {
      popup.classList.remove('show');
    }, 5000);
  }
  
  // First trigger after 8 seconds
  setTimeout(() => {
    triggerAlert();
    // Then repeat every 20 to 28 seconds
    setInterval(triggerAlert, 20000 + Math.random() * 8000);
  }, 6000);
}


/* ======= HERO SLIDER ======= */
(function(){
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  const prev   = document.getElementById('heroPrev');
  const next   = document.getElementById('heroNext');
  let current  = 0;
  let timer;

  function goTo(n) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function autoPlay() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  if(prev) prev.addEventListener('click', () => { goTo(current - 1); autoPlay(); });
  if(next) next.addEventListener('click', () => { goTo(current + 1); autoPlay(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); autoPlay(); }));
  autoPlay();

  /* Animate hero text in on load */
  function animateHero() {
    ['heroBrandSub','heroBrand','heroDivider','heroTagline','heroCtaWrap'].forEach((id, idx) => {
      const el = document.getElementById(id);
      if(el) setTimeout(() => el.classList.add('visible'), idx * 180);
    });
  }
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', animateHero);
  } else {
    animateHero();
  }
})();

