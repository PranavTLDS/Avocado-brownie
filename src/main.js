import '@fontsource/just-another-hand';
import '@fontsource-variable/outfit';
import './style.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import { BRAND, CATEGORIES, PRODUCTS, byId, money, img, loadCatalogue } from './data.js';
import { adminView, initAdmin } from './admin.js';
import { createScene } from './scene.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ── smooth scroll ───────────────────────────────────────────
const lenis = new Lenis({ lerp: 0.1, smoothWheel: !reduced });
const tick = (t) => {
  lenis.raf(t);
  onScroll();
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);

// ── cart ────────────────────────────────────────────────────
const KEY = 'ab-bag-v1';
let cart = {};
try {
  cart = JSON.parse(localStorage.getItem(KEY)) || {};
} catch {
  cart = {};
}
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {}
};
const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
const subtotal = () => Object.entries(cart).reduce((a, [id, q]) => a + (byId(id)?.price || 0) * q, 0);

function setQty(id, q) {
  if (q <= 0) delete cart[id];
  else cart[id] = Math.min(q, 20);
  save();
  renderBag();
  if (route().name === 'checkout') renderSummary();
}
function addToBag(id, q = 1, open = true) {
  setQty(id, (cart[id] || 0) + q);
  const b = $('#bagCount');
  b.classList.remove('bump');
  void b.offsetWidth;
  b.classList.add('bump');
  if (open) openDrawer();
  else toast(`${byId(id).name} added to your bag`);
}

function renderBag() {
  $('#bagCount').textContent = count();
  const body = $('#drawerBody');
  const foot = $('#drawerFoot');
  const ids = Object.keys(cart);
  if (!ids.length) {
    body.innerHTML = `<div class="empty"><p class="script">Nothing here yet</p><p>Your bag is waiting for something sweet.</p><a class="btn btn--line" href="#/shop" data-close>Browse the shop</a></div>`;
    foot.innerHTML = '';
    return;
  }
  body.innerHTML = ids
    .map((id) => {
      const p = byId(id);
      return `<div class="line">
        <a class="line__img" href="#/p/${p.id}" data-close><img src="${img(p.imgs[0], true)}" alt="" loading="lazy"></a>
        <div class="line__info">
          <a href="#/p/${p.id}" data-close>${esc(p.name)}</a>
          <span>${money(p.price)}</span>
          <div class="qty qty--sm">
            <button data-qty="${p.id}" data-d="-1" aria-label="Decrease quantity of ${esc(p.name)}">−</button>
            <b>${cart[id]}</b>
            <button data-qty="${p.id}" data-d="1" aria-label="Increase quantity of ${esc(p.name)}">+</button>
          </div>
        </div>
        <div class="line__end"><b>${money(p.price * cart[id])}</b><button data-remove="${p.id}">Remove</button></div>
      </div>`;
    })
    .join('');
  foot.innerHTML = `<div class="sum"><span>Subtotal</span><b>${money(subtotal())}</b></div>
    <p class="fine">Taxes and delivery are calculated at checkout.</p>
    <a class="btn btn--solid btn--full" href="#/checkout" data-close>Checkout</a>`;
}

const drawer = $('#drawer');
const scrim = $('#scrim');
function openDrawer() {
  drawer.classList.add('open');
  scrim.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  lenis.stop();
}
function closeDrawer() {
  drawer.classList.remove('open');
  scrim.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  lenis.start();
}
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

// ── shared templates ────────────────────────────────────────
const card = (p) => `<article class="card reveal" data-tilt>
  <a class="card__media" href="#/p/${p.id}" aria-label="${esc(p.name)}">
    <img src="${img(p.imgs[0], true)}" alt="${esc(p.name)}" loading="lazy">
    ${p.imgs[1] ? `<img class="card__alt" src="${img(p.imgs[1], true)}" alt="" loading="lazy">` : ''}
    ${p.tag ? `<span class="chip">${esc(p.tag)}</span>` : ''}
  </a>
  <div class="card__body">
    <div><h3><a href="#/p/${p.id}">${esc(p.name)}</a></h3><p>${esc(p.short)}</p></div>
    <div class="card__buy"><b>${money(p.price)}</b><button class="add" data-add="${p.id}" aria-label="Add ${esc(p.name)} to bag"><span>Add</span><i>+</i></button></div>
  </div>
</article>`;

const WORD = 'avocado&brownies';
const footer = () => {
  const sig = PRODUCTS.filter((p) => p.star).slice(0, 2);
  return `<footer class="foot">
  <div class="foot__cta">
    <p class="eyebrow reveal"><i></i>Still thinking about it?</p>
    <h2 class="display display--xl reveal">Go on, <span class="script">treat yourself.</span></h2>
    <div class="foot__btns reveal">
      <a class="btn btn--solid" href="#/shop">Shop the bakes</a>
      <a class="btn btn--line" href="#/" data-scroll="film">Watch the film</a>
    </div>
  </div>
  <div class="foot__grid">
    <div class="foot__brand">
      <img class="foot__roundel" src="/favicon.png" alt="a&amp;b" width="88" height="88" loading="lazy">
      <p class="script">${esc(BRAND.tagline)}</p>
    </div>
    <div class="foot__cols">
      <div><h4>Shop</h4><a href="#/shop">Everything</a>${CATEGORIES.filter((c) => c.id !== 'all').map((c) => `<a href="#/shop/${c.id}">${c.label}</a>`).join('')}</div>
      <div><h4>Signatures</h4>${sig.map((p) => `<a href="#/p/${p.id}">${esc(p.name)}</a>`).join('')}<a href="#/" data-scroll="film">The film</a></div>
      <div><h4>Your order</h4><button type="button" data-open-bag>Your bag</button><a href="#/checkout">Checkout</a><button type="button" data-top>Back to top</button></div>
    </div>
  </div>
  <div class="foot__mark reveal" aria-hidden="true">${[...WORD].map((ch, i) => `<span style="--i:${i}">${ch === '&' ? '&amp;' : ch}</span>`).join('')}</div>
  <div class="foot__base"><span>© ${new Date().getFullYear()} avocado&amp;brownies</span><span>Baked fresh, every day</span><button type="button" data-top>Back to top ↑</button></div>
</footer>`;
};

const titleWithAccent = (p) => {
  const name = esc(p.name);
  const acc = p.accent && p.name.includes(p.accent) ? esc(p.accent) : '';
  return acc ? name.replace(acc, `<span class="script">${acc}</span>`) : name;
};

// ── views ───────────────────────────────────────────────────

function featured() {
  let plates = PRODUCTS.filter((p) => p.hero && p.plate?.src).slice(0, 2);
  if (!plates.length) plates = PRODUCTS.filter((p) => p.plate?.src).slice(0, 2);
  const heroP = plates[0] || null;
  const used = new Set(plates.map((p) => p.id));
  const duo = PRODUCTS.filter((p) => p.star && !used.has(p.id)).slice(0, 2);
  duo.forEach((p) => used.add(p.id));
  return { heroP, plates, duo, used };
}

function homeView() {
  const { heroP, plates, duo, used } = featured();
  return `
  <canvas class="stage" id="stage" aria-hidden="true"></canvas>
  <section class="hero" id="hero">
    <h1 class="hero__type" aria-label="Baked with love, craved forever.">
      <span class="ln ln--top"><span>Baked with love,</span></span>
      <span class="hero__slot" id="heroSlot" aria-hidden="true"></span>
      <span class="hero__split" aria-hidden="true">
        <span class="ln ln--l"><span class="script">craved</span></span>
        <span class="ln ln--r"><span class="script">forever.</span></span>
      </span>
    </h1>
    <div class="hero__foot">
      <div class="hero__left">
        <p class="hero__lede">The Magnum Cake, fudge brownies and an all-day café menu. Made by hand, plated like it matters.</p>
        <div class="hero__cta">
          <a class="btn btn--solid" href="#/shop">Shop the bakes</a>
          <a class="btn btn--ghost" href="#/" data-scroll="film"><i class="play"></i>Watch the film</a>
        </div>
      </div>
    </div>
    <div class="hero__hint"><span>Drag to spin the plate</span><i></i><span>Scroll to taste</span></div>
  </section>

  ${plates
    .map(
      (p, i) => `<section class="chapter ${i ? 'chapter--r' : ''}" id="${i ? 'ch-plate2' : 'signatures'}">
    <div class="chapter__pin">
      <div class="chapter__copy">
        <p class="eyebrow"><i></i>${esc(p.tag || 'From the counter')}</p>
        <h2 class="display">${titleWithAccent(p)}</h2>
        <p class="lede">${esc(p.desc)}</p>
        <ul class="notes notes--live">${p.notes.map((n, k) => `<li><b>0${k + 1}</b>${esc(n)}</li>`).join('')}</ul>
        <div class="sig__buy">
          <button class="btn btn--solid" data-add="${p.id}">Add to bag · ${money(p.price)}</button>
          <a class="btn btn--line" href="#/p/${p.id}">Details</a>
        </div>
      </div>
    </div>
  </section>`
    )
    .join('')}

  <section class="fudge" id="brownies">
    <div class="fudge__bg"><img data-zoom src="${img('brownie-macro')}" alt="Close view of a hazelnut fudge brownie" loading="lazy"></div>
    <div class="fudge__shade"></div>
    <div class="fudge__copy">
      <p class="eyebrow reveal"><i></i>The brownies</p>
      <h2 class="display display--xl reveal">Fudge, all<br>the way <span class="script">through.</span></h2>
      <p class="lede reveal">A paper-thin crackle on top, a dense molten middle, and roasted hazelnuts over everything. This is the brownie the name is for.</p>
    </div>
  </section>

  ${duo.length ? `<section class="duo ${duo.length === 1 ? 'duo--one' : ''}">
    ${duo
      .map(
        (p) => `<article class="duo__item reveal" data-tilt>
      <a class="duo__media" href="#/p/${p.id}"><img src="${img(p.imgs[0])}" ${p.pos ? `style="object-position:${esc(p.pos)}"` : ''} alt="${esc(p.name)}" loading="lazy"></a>
      <div class="duo__body">
        ${p.tag ? `<span class="chip chip--o">${esc(p.tag)}</span>` : ''}
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.short)}</p>
        <div class="card__buy"><b>${money(p.price)}</b><button class="add" data-add="${p.id}" aria-label="Add ${esc(p.name)} to bag"><span>Add</span><i>+</i></button></div>
      </div>
    </article>`
      )
      .join('')}
  </section>` : ''}

  <section class="film" id="film">
    <div class="film__head">
      <p class="eyebrow reveal"><i></i>The film</p>
      <h2 class="display reveal">Thirty seconds of <span class="script">craving.</span></h2>
    </div>
    <div class="film__frame reveal-clip" id="filmFrame">
      <video id="filmVideo" playsinline preload="metadata" poster="/video/poster.jpg" src="/video/film.mp4"></video>
      <button class="film__play" id="filmPlay" aria-label="Play the film"><i class="play"></i><span>Play film</span></button>
    </div>
  </section>

  <section class="coll" id="collection">
    <div class="coll__head">
      <div><p class="eyebrow reveal"><i></i>The collection</p><h2 class="display reveal">From the <span class="script">counter.</span></h2></div>
      <a class="btn btn--line reveal" href="#/shop">View everything</a>
    </div>
    <div class="grid">${PRODUCTS.filter((p) => !used.has(p.id)).slice(0, 8).map(card).join('')}</div>
  </section>

  <section class="cafe" id="cafe">
    <div class="cafe__media reveal-clip"><img data-parallax="0.1" src="${img('cafe')}" alt="Inside the avocado&brownies café" loading="lazy"></div>
    <div class="cafe__copy">
      <p class="eyebrow reveal"><i></i>The café</p>
      <h2 class="display reveal">A bright room, a long table, <span class="script">something warm.</span></h2>
      <p class="lede reveal">Come for the avocado toast, stay for the brownie. Everything on the counter is made by hand, in small batches, the same day you eat it.</p>
      <div class="cafe__stats reveal">
        <div><b>Made</b><span>by hand</span></div>
        <div><b>Small</b><span>batches</span></div>
        <div><b>Fresh</b><span>every day</span></div>
      </div>
    </div>
    <figure class="cafe__float reveal-clip"><img data-parallax="-0.14" src="${img('matcha', true)}" alt="Layered matcha on the café table" loading="lazy"></figure>
  </section>
  ${footer()}`;
}

function shopView(cat = 'all') {
  const list = PRODUCTS.filter((p) => cat === 'all' || p.cat === cat);
  return `<section class="page">
    <header class="page__head">
      <p class="eyebrow"><i></i>The shop</p>
      <h1 class="display display--xl">Everything, <span class="script">baked fresh.</span></h1>
      <div class="filters" role="tablist">${CATEGORIES.map((c) => `<a role="tab" aria-selected="${c.id === cat}" class="${c.id === cat ? 'on' : ''}" href="#/shop/${c.id}">${c.label}<sup>${PRODUCTS.filter((p) => c.id === 'all' || p.cat === c.id).length}</sup></a>`).join('')}</div>
    </header>
    <div class="grid grid--shop">${list.map(card).join('')}</div>
  </section>${footer()}`;
}

function productView(p) {
  const more = PRODUCTS.filter((x) => x.id !== p.id && (x.cat === p.cat || x.star)).slice(0, 4);
  return `<section class="pdp">
    <div class="pdp__gallery">
      <div class="pdp__main" id="pdpMain" data-tilt><img id="pdpImg" src="${img(p.imgs[0])}" alt="${esc(p.name)}"></div>
      ${p.imgs.length > 1 ? `<div class="pdp__thumbs">${p.imgs.map((n, i) => `<button class="${i ? '' : 'on'}" data-img="${n}" aria-label="View image ${i + 1}"><img src="${img(n, true)}" alt=""></button>`).join('')}</div>` : ''}
    </div>
    <div class="pdp__info">
      <a class="back" href="#/shop">← Back to shop</a>
      ${p.tag ? `<span class="chip chip--o">${esc(p.tag)}</span>` : ''}
      <h1 class="display">${esc(p.name)}</h1>
      <p class="pdp__price">${money(p.price)}</p>
      <p class="lede">${esc(p.desc)}</p>
      <ul class="notes">${p.notes.map((n, i) => `<li><b>0${i + 1}</b>${esc(n)}</li>`).join('')}</ul>
      <div class="pdp__buy">
        <div class="qty"><button id="qMinus" aria-label="Decrease quantity">−</button><b id="qVal">1</b><button id="qPlus" aria-label="Increase quantity">+</button></div>
        <button class="btn btn--solid btn--grow" id="pdpAdd">Add to bag</button>
      </div>
      <p class="fine">Baked fresh to order. Best enjoyed the same day.</p>
    </div>
  </section>
  <section class="coll coll--more">
    <div class="coll__head"><h2 class="display">You may also <span class="script">crave.</span></h2></div>
    <div class="grid">${more.map(card).join('')}</div>
  </section>${footer()}`;
}

function checkoutView() {
  if (!count()) {
    return `<section class="page page--center"><p class="script big">Your bag is empty</p><p class="lede">Add something from the counter and come back.</p><a class="btn btn--solid" href="#/shop">Browse the shop</a></section>${footer()}`;
  }
  return `<section class="page checkout">
    <header class="page__head"><p class="eyebrow"><i></i>Checkout</p><h1 class="display">Almost <span class="script">yours.</span></h1></header>
    <div class="checkout__grid">
      <form id="coForm" novalidate>
        <fieldset><legend>How would you like it?</legend>
          <div class="seg"><label><input type="radio" name="mode" value="Pickup" checked><span>Pickup at the café</span></label><label><input type="radio" name="mode" value="Delivery"><span>Delivery</span></label></div>
        </fieldset>
        <fieldset><legend>Your details</legend>
          <label class="field"><span>Full name</span><input name="name" autocomplete="name" required></label>
          <label class="field"><span>Phone number</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" required pattern="[0-9+ ()-]{7,}"></label>
          <label class="field" id="addrField" hidden><span>Delivery address</span><textarea name="address" rows="3" autocomplete="street-address"></textarea></label>
          <label class="field"><span>Note for the kitchen (optional)</span><input name="note"></label>
        </fieldset>
        <button class="btn btn--solid btn--full" type="submit">Place order</button>
        <p class="fine" id="coMsg">Online payment is not connected yet. Placing an order here does not charge you.</p>
      </form>
      <aside class="summary" id="summary"></aside>
    </div>
  </section>${footer()}`;
}

function renderSummary() {
  const el = $('#summary');
  if (!el) return;
  if (!count()) return render();
  el.innerHTML = `<h3>Order summary</h3>${Object.entries(cart)
    .map(([id, q]) => {
      const p = byId(id);
      return `<div class="srow"><img src="${img(p.imgs[0], true)}" alt=""><div><b>${esc(p.name)}</b><span>Qty ${q}</span></div><em>${money(p.price * q)}</em></div>`;
    })
    .join('')}<div class="sum"><span>Subtotal</span><b>${money(subtotal())}</b></div>`;
}

function thanksView(name) {
  const body = BRAND.whatsapp
    ? `<h1 class="display">One last step.</h1><p class="lede">We have opened WhatsApp with your order filled in. Send that message and we will confirm it with you there.</p>`
    : `<h1 class="display">This is a preview.</h1><p class="lede">Ordering is not connected yet, so nothing was sent and nothing was charged. Once it is live, your confirmation will appear here.</p>`;
  return `<section class="page page--center"><p class="script big">Thank you${name ? ', ' + esc(name) : ''}</p>${body}<a class="btn btn--solid" href="#/">Back home</a></section>${footer()}`;
}

// ── router ──────────────────────────────────────────────────
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [a, b] = h.split('/');
  if (!a) return { name: 'home' };
  if (a === 'shop') return { name: 'shop', cat: CATEGORIES.some((c) => c.id === b) ? b : 'all' };
  if (a === 'p' && byId(b)) return { name: 'product', p: byId(b) };
  if (a === 'checkout') return { name: 'checkout' };
  if (a === 'admin') return { name: 'admin' };
  return { name: 'home' };
}

let stage = null;
let pendingScroll = null;
let lastRoute = '';

function render(opts = {}) {
  const r = route();
  const keepScroll = r.name === 'shop' && lastRoute === 'shop';
  lastRoute = r.name;
  if (stage) {
    stage.destroy();
    stage = null;
  }
  document.body.dataset.route = r.name;
  closeMenu();

  if (opts.thanks !== undefined) app.innerHTML = thanksView(opts.thanks);
  else if (r.name === 'home') app.innerHTML = homeView();
  else if (r.name === 'shop') app.innerHTML = shopView(r.cat);
  else if (r.name === 'product') app.innerHTML = productView(r.p);
  else if (r.name === 'admin') app.innerHTML = adminView();
  else app.innerHTML = checkoutView();

  document.title =
    r.name === 'product' ? `${r.p.name} — avocado&brownies` : r.name === 'shop' ? 'Shop — avocado&brownies' : r.name === 'checkout' ? 'Checkout — avocado&brownies' : r.name === 'admin' ? 'Admin — avocado&brownies' : 'avocado&brownies — Baked with love, craved forever';

  if (!keepScroll) {
    lenis.scrollTo(0, { immediate: true, force: true });
    scrollTo(0, 0);
  }
  if (r.name === 'home' && opts.thanks === undefined) initHome();
  if (r.name === 'product') initProduct(r.p);
  if (r.name === 'checkout') initCheckout();
  if (r.name === 'admin') initAdmin({ rerender: () => render(), toast, lockScroll: (on) => (on ? lenis.stop() : lenis.start()) });
  initReveals();
  initTilt();
  collectParallax();
  if (pendingScroll) {
    const id = pendingScroll;
    pendingScroll = null;
    setTimeout(() => scrollToId(id), 60);
  }
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) lenis.scrollTo(el, { offset: -40, duration: 1.4 });
}

// ── home ────────────────────────────────────────────────────
let introDone = false;
let chapters = null;
let homeVH = 0;
let poseCache = null;
let heroRO = null;
function initHome() {
  const canvas = $('#stage');
  homeVH = canvas.clientHeight || innerHeight;
  poseCache = null;
  document.fonts?.ready.then(() => (poseCache = null));
  heroRO?.disconnect();
  if ('ResizeObserver' in window && $('#hero')) {
    heroRO = new ResizeObserver(() => (poseCache = null));
    heroRO.observe($('#hero'));
  }
  const { heroP, plates } = featured();
  const plateEl = $('#signatures');
  const plateEl2 = $('#ch-plate2');
  chapters = {
    plate: plateEl && { el: plateEl, notes: $$('.notes--live li', plateEl) },
    plate2: plateEl2 && { el: plateEl2, notes: $$('.notes--live li', plateEl2) },
  };
  if (heroP) {
    try {
      const toPlate = (p) => ({ src: p.plate.src, rim: p.plate.rim, shape: p.plate.shape || 'flat' });
      stage = createScene(canvas, [toPlate(plates[0]), toPlate(plates[1] || plates[0])]);
      if (!introDone) stage.hide();
      stage.ready.then(() => {
        if (!stage) return;
        placePlate();
        stage.snap();
        stage.start();
      });
    } catch (err) {
      stage = null;
      canvas.hidden = true; // WebGL unavailable: the page still reads without the plate
    }
  } else canvas.hidden = true;
  if (introDone) {
    heroIn();
    stage?.ready.then(() => stage?.intro(gsap));
  }
  placePlate();

  const v = $('#filmVideo');
  const frame = $('#filmFrame');
  $('#filmPlay').addEventListener('click', () => {
    v.controls = true;
    v.play();
  });
  v.addEventListener('play', () => frame.classList.add('playing'));
  v.addEventListener('pause', () => frame.classList.remove('playing'));
  v.addEventListener('ended', () => {
    frame.classList.remove('playing');
    v.controls = false;
    v.load();
  });
}

function heroIn() {
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .fromTo('.hero__type .ln--top > span', { yPercent: 115 }, { yPercent: 0, duration: 1.5 }, 0.15)
    .fromTo('.hero__type .ln--l > span', { xPercent: 60, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 2 }, 0.2)
    .fromTo('.hero__type .ln--r > span', { xPercent: -60, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 2 }, 0.2)
    .fromTo('.hero__left, .hero__hint', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.08 }, 0.7);
}

// The plate's journey: centre stage in the hero → docks beside its own story →
// flips into the second plate, docked on the other side → lifts away.
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => ({ fx: a.fx + (b.fx - a.fx) * t, fy: a.fy + (b.fy - a.fy) * t, s: a.s + (b.s - a.s) * t, tilt: a.tilt + (b.tilt - a.tilt) * t });
// Phones: the plate is fitted to real spaces in the layout, so it can never sit on top of text.
//   hero     → the slot between the two headline lines
//   chapters → the area above the story copy
function mobilePoses(ww) {
  const vh = homeVH || innerHeight;
  if (poseCache && poseCache.ww === ww && poseCache.vh === vh) return poseCache;
  const canvas = $('#stage');
  const cw = canvas?.clientWidth || innerWidth;
  const k = (d) => (d * ww) / (3.74 * cw); // plate diameter in css px → scene scale
  const fit = (top, bottom, width) => {
    const h = Math.max(120, bottom - top);
    return { cy: top + h / 2, d: Math.min(width * 0.88, h / 0.98) };
  };
  let H = { fx: 0, fy: 0.04, s: k(cw * 0.78), tilt: -0.5 };
  const slot = $('#heroSlot');
  if (slot && slot.offsetHeight) {
    const f = fit(slot.offsetTop + 4, slot.offsetTop + slot.offsetHeight - 4, slot.offsetWidth);
    H = { fx: 0, fy: 0.5 - f.cy / vh, s: k(f.d), tilt: -0.5 };
  }
  let D = { fx: 0, fy: 0.2, s: ww / 5.4, tilt: -0.34 };
  const copy = $('#signatures .chapter__copy');
  if (copy) {
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
    const f = fit(navH + 6, Math.max(copy.offsetTop, navH + 150) - 14, innerWidth - 40);
    D = { fx: 0, fy: 0.5 - f.cy / vh, s: k(f.d), tilt: -0.34 };
  }
  poseCache = { H, D, ww, vh };
  return poseCache;
}

function placePlate() {
  if (!chapters) return;
  const vh = homeVH || innerHeight;
  const { plate, plate2 } = chapters;
  const progress = (r) => clamp01(-r.top / Math.max(1, r.height - vh));
  const lightNotes = (c, p) => c.notes.forEach((li, k) => li.classList.toggle('on', p * (c.notes.length + 0.4) > k + 0.2));

  const phone = innerWidth <= 900;
  [plate, plate2].forEach((c) => {
    if (!c) return;
    const r = c.el.getBoundingClientRect();
    // Phones: the plate is fixed above the copy, so each copy block must be gone BEFORE it starts
    // scrolling up underneath the plate (i.e. before its pinned section releases), and the next
    // one appears only as the plate finishes flipping.
    c.el.classList.toggle('in', phone ? r.top < vh * 0.4 && r.bottom > vh * 1.15 : r.top < vh * 0.6 && r.bottom > vh * 0.45);
    lightNotes(c, progress(r));
  });
  if (!stage) return;
  const ww = stage.world().w;
  const wide = innerWidth > 900; // same breakpoint as the CSS layout
  const m = wide ? null : mobilePoses(ww);
  const H = wide ? { fx: 0, fy: -0.02, s: ww / 11.4, tilt: -0.62 } : m.H;
  const D1 = wide ? { fx: -0.215, fy: 0, s: ww / 11, tilt: -0.24 } : m.D;
  const D2 = wide ? { ...D1, fx: 0.215 } : D1;
  const far = { top: vh * 9, bottom: vh * 10 };
  const r1 = plate ? plate.el.getBoundingClientRect() : far;
  const r2 = plate2 ? plate2.el.getBoundingClientRect() : null;
  const last = r2 || r1;
  const a = ease(clamp01((vh - r1.top) / vh));
  const b = r2 ? ease(clamp01((vh - r2.top) / vh)) : 0;
  const leave = ease(clamp01(1 - (last.bottom - vh * 0.35) / (vh * 0.65)));
  const pose = mix(mix(H, D1, a), D2, b);
  stage.setTarget({ ...pose, fy: pose.fy + leave * 0.95, s: pose.s * (1 - leave * 0.25), flip: wide ? b : 0, flipx: wide ? 0 : b, alpha: 1 - leave });
  leave >= 1 ? stage.stop() : stage.start();
}

// ── product ─────────────────────────────────────────────────
function initProduct(p) {
  let q = 1;
  const val = $('#qVal');
  $('#qMinus').onclick = () => (val.textContent = q = Math.max(1, q - 1));
  $('#qPlus').onclick = () => (val.textContent = q = Math.min(20, q + 1));
  $('#pdpAdd').onclick = () => addToBag(p.id, q);
  const main = $('#pdpImg');
  $$('.pdp__thumbs button').forEach((b) =>
    b.addEventListener('click', () => {
      $$('.pdp__thumbs button').forEach((x) => x.classList.toggle('on', x === b));
      gsap.to(main, {
        opacity: 0, scale: 1.03, duration: 0.2,
        onComplete: () => {
          main.src = img(b.dataset.img);
          main.onload = () => gsap.to(main, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' });
        },
      });
    })
  );
  gsap.fromTo('.pdp__info > *', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: 'power3.out', delay: 0.1 });
  gsap.fromTo('.pdp__main', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.out' });
}

// ── checkout ────────────────────────────────────────────────
function initCheckout() {
  const form = $('#coForm');
  if (!form) return;
  renderSummary();
  const addr = $('#addrField');
  form.addEventListener('change', (e) => {
    if (e.target.name === 'mode') {
      addr.hidden = e.target.value !== 'Delivery';
      addr.querySelector('textarea').required = !addr.hidden;
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = $$('input,textarea', form).find((i) => !i.checkValidity());
    $$('.field', form).forEach((f) => f.classList.toggle('err', !f.hidden && !$('input,textarea', f).checkValidity()));
    if (bad) {
      bad.focus();
      return;
    }
    const d = Object.fromEntries(new FormData(form));
    if (BRAND.whatsapp) {
      const lines = Object.entries(cart).map(([id, q]) => `${q} x ${byId(id).name} (${money(byId(id).price * q)})`);
      const text = `New order for avocado&brownies\n\n${lines.join('\n')}\n\nSubtotal: ${money(subtotal())}\n${d.mode}${d.address ? ': ' + d.address : ''}\nName: ${d.name}\nPhone: ${d.phone}${d.note ? '\nNote: ' + d.note : ''}`;
      window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
    cart = {};
    save();
    renderBag();
    render({ thanks: d.name.split(' ')[0] });
  });
}

// ── reveals, parallax, tilt ─────────────────────────────────
let io;
function initReveals() {
  io?.disconnect();
  io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  $$('.reveal, .reveal-clip').forEach((el) => io.observe(el));
}

let pars = [];
let zooms = [];
function collectParallax() {
  pars = $$('[data-parallax]').map((el) => ({ el, k: parseFloat(el.dataset.parallax) }));
  zooms = $$('[data-zoom]');
}
const nav = $('#nav');
let lastY = 0;
function onScroll() {
  const y = window.scrollY;
  const vh = innerHeight;
  nav.classList.toggle('solid', y > 30);
  nav.classList.toggle('hide', y > lastY && y > vh * 0.6 && !drawer.classList.contains('open'));
  lastY = y;
  if (stage) placePlate();
  if (reduced) return;
  for (const p of pars) {
    const r = p.el.parentElement.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) continue;
    const c = (r.top + r.height / 2 - vh / 2) / vh;
    p.el.style.transform = `translate3d(0,${(c * p.k * 100).toFixed(2)}%,0) scale(${1 + Math.abs(p.k) * 2.2})`;
  }
  for (const z of zooms) {
    const r = z.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) continue;
    const prog = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    z.style.transform = `scale(${(1.28 - prog * 0.28).toFixed(4)})`;
  }
}

function initTilt() {
  if (!fine || reduced) return;
  $$('[data-tilt]').forEach((el) => {
    const max = el.classList.contains('pdp__main') ? 4 : 6;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateZ(0)`;
      el.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
      el.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });
}

// ── global events ───────────────────────────────────────────
const menu = $('#menu');
const burger = $('#burger');
function closeMenu() {
  if (!menu.classList.contains('open')) return;
  menu.classList.remove('open');
  burger.classList.remove('open');
  document.body.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
  lenis.start();
}
burger.addEventListener('click', () => {
  if (menu.classList.contains('open')) return closeMenu();
  menu.classList.add('open');
  burger.classList.add('open');
  document.body.classList.add('menu-open');
  burger.setAttribute('aria-expanded', 'true');
  menu.setAttribute('aria-hidden', 'false');
  lenis.stop();
});
matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && closeMenu());

document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) {
    e.preventDefault();
    addToBag(add.dataset.add, 1, true);
    return;
  }
  const qb = e.target.closest('[data-qty]');
  if (qb) return setQty(qb.dataset.qty, (cart[qb.dataset.qty] || 0) + Number(qb.dataset.d));
  const rm = e.target.closest('[data-remove]');
  if (rm) return setQty(rm.dataset.remove, 0);
  if (e.target.closest('[data-close]')) closeDrawer();
  if (e.target.closest('[data-open-bag]')) {
    closeMenu();
    return openDrawer();
  }
  if (e.target.closest('[data-top]')) return lenis.scrollTo(0, { duration: 1.6 });
  const ml = e.target.closest('.menu a');
  if (ml && !ml.dataset.scroll) {
    const same = ml.getAttribute('href') === (location.hash || '#/');
    closeMenu();
    if (same) lenis.scrollTo(0, { duration: 1.2 });
  }
  const sc = e.target.closest('[data-scroll]');
  if (sc) {
    e.preventDefault();
    closeMenu();
    if (route().name === 'home' && $('#hero')) scrollToId(sc.dataset.scroll);
    else {
      pendingScroll = sc.dataset.scroll;
      location.hash = '#/';
    }
  }
});
$('#bagBtn').addEventListener('click', openDrawer);
$('#drawerClose').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDrawer();
    closeMenu();
  }
});
addEventListener('hashchange', () => render());
addEventListener('resize', () => {
  const c = $('#stage');
  if (c) homeVH = c.clientHeight || innerHeight;
  poseCache = null;
});

// ── boot ────────────────────────────────────────────────────
(async function boot() {
  await loadCatalogue();
  Object.keys(cart).forEach((id) => {
    if (!byId(id)) delete cart[id];
  });
  save();
  renderBag();
  render();

  const loader = $('#loader');
  const sheet = $('#loaderSheet');
  const stream = $('#loaderStream');
  const word = $('#loaderWord');
  const liquid = $('#ldLiquid');
  const shine = $('#ldShine');
  const num = $('#loaderNum');
  const msg = $('#loaderMsg');
  const steps = [[0, 'Melting the chocolate'], [40, 'Tempering'], [78, 'Almost set'], [100, 'Ready']];


  let TOP = 40; // liquid level when the word is full (svg units); measured from the real glyphs below
  let BOTTOM = 196; // liquid level when empty
  const measure = () => {
    try {
      // measure the real ink of the letters (not the font's line box, which has empty space below)
      const g = document.createElement('canvas').getContext('2d');
      g.font = '176px "Just Another Hand"';
      const m = g.measureText('avocado&brownies');
      if (m.actualBoundingBoxAscent > 40) {
        TOP = 178 - m.actualBoundingBoxAscent - 16; // above the tallest letter (the "&"), with room for the ripple
        BOTTOM = 178 + Math.max(0, m.actualBoundingBoxDescent) + 2; // right at the bottom of the letters
      }
    } catch {}
  };
  const st = { v: 0, amp: 1, splash: 1, t: 0 };
  let level = BOTTOM;
  const drawLiquid = () => {
    let d = '';
    for (let x = 0; x <= 1000; x += 10) {
      const near = Math.exp(-(((x - 500) / 46) ** 2));
      const y = level + st.amp * (Math.sin(x / 58 + st.t * 2.6) * 5 + Math.sin(x / 21 - st.t * 4.1) * 1.6) - near * st.splash * (4 + Math.sin(st.t * 14) * 3);
      d += (x ? ' L' : 'M') + x + ' ' + y.toFixed(2);
    }
    liquid.setAttribute('d', d + ' L1000 260 L0 260 Z');
  };
  const placeStream = () => {
    const r = word.getBoundingClientRect();
    const sy = r.height / 240;
    stream.style.height = `${Math.max(0, r.top + level * sy)}px`;
    stream.style.width = `${(5 + Math.sin(st.t * 13) * 0.8).toFixed(2)}px`; // the stream wobbles a little as it falls
  };
  let alive = true;
  const loop = () => {
    if (!alive) return;
    st.t += 1 / 60;
    level = BOTTOM - (BOTTOM - TOP) * (st.v / 100);
    drawLiquid();
    if (st.splash > 0.5) placeStream();
    sheet.style.setProperty('--glow', (0.04 + (st.v / 100) * 0.16).toFixed(3));
    requestAnimationFrame(loop);
  };

  const fontsReady = document.fonts.load('176px "Just Another Hand"').catch(() => {});
  const ready = Promise.all([document.fonts.ready, fontsReady, stage ? stage.ready : Promise.resolve()]);
  const finish = () => {
    alive = false;
    loader.hidden = true;
  };
  lenis.stop();

  const open = () => {
    introDone = true;
    lenis.start();
    if (route().name === 'home') {
      heroIn();
      stage?.ready.then(() => stage?.intro(gsap));
    }
    if (reduced) return finish();
    // a clean fade into the hero
    gsap.to(loader, { opacity: 0, duration: 0.9, ease: 'power2.inOut', onComplete: finish });
  };

  if (reduced) {
    await fontsReady;
    measure();
    st.v = 100;
    st.amp = st.splash = 0;
    level = TOP;
    drawLiquid();
    loader.classList.add('ready');
    return ready.then(() => setTimeout(open, 300));
  }
  await fontsReady;
  measure();
  level = BOTTOM;
  loader.classList.add('ready');
  loop();
  gsap.to(st, {
    v: 100, duration: 2.5, ease: 'power1.inOut',
    onUpdate: () => {
      num.textContent = Math.round(st.v);
      const m = steps.filter((x) => st.v >= x[0]).pop()[1];
      if (msg.textContent !== m) msg.textContent = m;
    },
    onComplete: () =>
      ready.then(() => {
        gsap.timeline({ onComplete: open })
          .to(stream, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.35, ease: 'power2.in' }, 0)
          .to(st, { splash: 0, amp: 0.15, duration: 0.6, ease: 'power2.out' }, 0)
          .fromTo(shine, { attr: { x: -260 } }, { attr: { x: 1300 }, duration: 0.9, ease: 'power2.inOut' }, 0.25);
      }),
  });
})();
