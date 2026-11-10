// ─────────────────────────────────────────────────────────────
// avocado&brownies — catalogue
// Edit names, prices and copy here. Prices are in INR.
// NOTE: prices below are PLACEHOLDERS until the real menu prices are supplied.
// ─────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'avocado&brownies',
  tagline: 'Baked with love, craved forever!',
  currency: '₹',
  // WhatsApp number for orders, digits only with country code (e.g. '919876543210').
  // Leave empty until the real number is supplied.
  whatsapp: '',
  // Passcode for #/admin. This only keeps casual visitors out; it is NOT real security
  // (anyone can read it in the site's code). Change it, and add a real login before launch.
  adminPin: 'brownies',
};

export const CATEGORIES = [
  { id: 'all', label: 'Everything' },
  { id: 'bakes', label: 'Bakes' },
  { id: 'plates', label: 'Plates' },
  { id: 'drinks', label: 'Drinks' },
];

export const PRODUCTS = [
  {
    id: 'magnum-cake',
    name: 'The Magnum Cake',
    cat: 'bakes',
    price: 349,
    tag: 'Signature',
    star: true,
    accent: 'Magnum',
    short: 'Layered vanilla sponge under poured milk and white chocolate, finished with roasted nuts.',
    desc: 'Our most sought-after dessert. A tall wedge of layered vanilla sponge, drowned in molten milk chocolate, then white chocolate, and finished with a shower of roasted nuts.',
    notes: ['Layered vanilla sponge', 'Molten milk chocolate', 'White chocolate pour', 'Roasted nuts'],
    imgs: ['magnum-1', 'magnum-2', 'magnum-3', 'magnum-4'],
    // scroll story on the home page: plain sponge → each pour → finished
    seq: ['magnum-seq-0', 'magnum-seq-1', 'magnum-seq-2', 'magnum-seq-3', 'magnum-seq-4'],
  },
  {
    id: 'milk-cake',
    name: 'Milk Cake',
    cat: 'bakes',
    price: 299,
    short: 'Golden sponge in chilled sweet milk, hand-piped cream, one blueberry.',
    desc: 'A golden sponge soaked through and resting in a pool of chilled sweet milk, finished with a ribbon of hand-piped cream and a single blueberry. Served cold.',
    notes: ['Soaked golden sponge', 'Hand-piped cream', 'Served chilled'],
    imgs: ['milkcake-side', 'milkcake-macro', 'milkcake-top', 'milkcake-card'],
    hero: true,
    plate: { src: '/img/plates/milkcake.webp', rim: '#889794', shape: 'bowl' },
  },  {
    id: 'hazelnut-brownie',
    name: 'Hazelnut Fudge Brownie',
    cat: 'bakes',
    price: 189,
    tag: 'Signature',
    star: true,
    accent: 'Fudge',
    hero: true,
    pos: '50% 78%',
    plate: { src: '/img/plates/brownie.webp', rim: '#f6f6f4', shape: 'flat' },
    short: 'Crackle top, molten fudge centre, roasted hazelnuts.',
    desc: 'The one the name is for. A paper-thin crackle top over a dense, fudgy centre, finished with a scatter of roasted hazelnuts. Rich enough to share, good enough not to.',
    notes: ['Crackle top', 'Fudge centre', 'Roasted hazelnuts'],
    imgs: ['brownie-macro', 'brownie-side', 'brownie-angle', 'brownie-top'],
  },

  {
    id: 'marble-brownie-stack',
    name: 'Marble Brownie Stack',
    cat: 'bakes',
    price: 449,
    tag: 'Box of three',
    star: true,
    pos: '50% 62%',
    short: 'Three thick-cut brownies with a golden marbled swirl.',
    desc: 'Three thick-cut brownies, each folded with a golden swirl through dark chocolate. Stacked for the table or boxed for later.',
    notes: ['Three thick-cut pieces', 'Golden marble swirl', 'Made for sharing'],
    imgs: ['stack', 'brownie-side2', 'brownie-macro2'],
  },
  {
    id: 'paneer-croissant',
    name: 'Paneer Croissant Sandwich',
    cat: 'plates',
    price: 329,
    short: 'Seeded butter croissant, spiced paneer, crisp lettuce, fries.',
    desc: 'A seeded butter croissant split and filled with spiced paneer and crisp lettuce. Comes with slaw and a stack of fries.',
    notes: ['Seeded croissant', 'Spiced paneer', 'Slaw and fries'],
    imgs: ['croissant', 'croissant2', 'croissant-dark'],
  },
  {
    id: 'sesame-glaze-bowl',
    name: 'Korean Sesame Glaze Bowl',
    cat: 'plates',
    price: 349,
    short: 'Crisp bites in a dark sticky glaze, sesame, fresh slaw.',
    desc: 'Crisp bites tossed in a dark, sticky Korean-style glaze and showered with sesame. A cool cabbage slaw on the side keeps things honest.',
    notes: ['Sticky dark glaze', 'Toasted sesame', 'Fresh slaw'],
    imgs: ['bites-macro', 'bites', 'bites-macro2'],
  },
  {
    id: 'avocado-toast',
    name: 'Avocado Toast',
    cat: 'plates',
    price: 299,
    tag: 'House classic',
    short: 'Smashed avocado, cherry tomato, crumbled cheese, cracked pepper.',
    desc: 'The other half of our name. Thick toast under a generous layer of smashed avocado, cherry tomatoes, crumbled cheese and cracked pepper, with a small salad alongside.',
    notes: ['Smashed avocado', 'Cherry tomato', 'Side salad'],
    imgs: ['avotoast', 'avotoast-top', 'avotoast-tall'],
  },
  {
    id: 'mini-croissant-bowl',
    name: 'Mini Croissant Bowl',
    cat: 'bakes',
    price: 319,
    short: 'Mini croissants in dark, milk and white chocolate.',
    desc: 'A bowl of mini croissants sitting in three chocolates: dark, milk and white. Bring a spoon and a friend.',
    notes: ['Mini croissants', 'Three chocolates', 'Made for sharing'],
    imgs: ['bowl', 'bowl-wide', 'bowl-wide2'],
  },
  {
    id: 'fig-berry-french-toast',
    name: 'Fig & Berry French Toast',
    cat: 'plates',
    price: 369,
    short: 'Thick-cut French toast, whipped cream, fresh fig, blueberries.',
    desc: 'Thick-cut French toast under a cloud of whipped cream, fresh fig and blueberries, finished with a single flower.',
    notes: ['Thick-cut toast', 'Fresh fig', 'Blueberries'],
    imgs: ['frenchtoast', 'frenchtoast-macro'],
  },
  {
    id: 'grilled-panini',
    name: 'Grilled Panini',
    cat: 'plates',
    price: 289,
    short: 'Pressed and charred, with a side of slaw.',
    desc: 'Pressed on the grill until the lines char and the middle melts. Served with fresh slaw.',
    notes: ['Grill-pressed', 'Fresh slaw'],
    imgs: ['panini'],
  },
  {
    id: 'ube-latte',
    name: 'Iced Ube Latte',
    cat: 'drinks',
    price: 249,
    tag: 'Whisked to order',
    short: 'Purple ube whisked by hand, poured over iced milk.',
    desc: 'Ube whisked by hand until smooth, then poured slowly over iced milk so the purple settles in layers.',
    notes: ['Hand-whisked', 'Over ice'],
    imgs: ['ube', 'ube-hand'],
  },
  {
    id: 'layered-matcha',
    name: 'Layered Matcha',
    cat: 'drinks',
    price: 259,
    short: 'Whisked matcha layered over a berry cream.',
    desc: 'Bright whisked matcha layered over a soft berry cream. Stir it, or do not.',
    notes: ['Whisked matcha', 'Berry cream layer'],
    imgs: ['matcha', 'matcha-table'],
  },
  {
    id: 'iced-latte',
    name: 'Iced Latte',
    cat: 'drinks',
    price: 199,
    short: 'Espresso and cold milk over ice.',
    desc: 'Espresso and cold milk over ice. Simple, cold and exactly what it should be.',
    notes: ['Espresso', 'Over ice'],
    imgs: ['latte'],
  },
];

// ── catalogue loading ────────────────────────────────────────
// Order of truth: this browser's unpublished admin edits → /products.json → the list above.
export const DEFAULTS = JSON.parse(JSON.stringify(PRODUCTS));
export const DRAFT_KEY = 'ab-catalogue-draft-v1';

export async function loadCatalogue() {
  let list = null;
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (Array.isArray(d?.products) && d.products.length) list = d.products;
  } catch {}
  if (!list) {
    try {
      const r = await fetch('/products.json', { cache: 'no-cache' });
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j?.products) && j.products.length) list = j.products;
      }
    } catch {}
  }
  if (list) setProducts(list);
}

export function setProducts(list) {
  PRODUCTS.splice(0, PRODUCTS.length, ...list.filter((p) => p && p.id && p.name).map(normalise));
}

export function normalise(p) {
  return {
    ...p,
    price: Number(p.price) || 0,
    imgs: Array.isArray(p.imgs) && p.imgs.length ? p.imgs : ['brownie-top'],
    notes: Array.isArray(p.notes) ? p.notes : [],
    short: p.short || '',
    desc: p.desc || p.short || '',
  };
}

export const byId = (id) => PRODUCTS.find((p) => p.id === id);
export const money = (n) => BRAND.currency + Number(n).toLocaleString('en-IN');
// Built-in photos are referenced by name; uploaded ones by full path or data URL.
export const img = (name, small = false) =>
  /^(data:|blob:|https?:|\/)/.test(name) ? name : `/img/${name}${small ? '-sm' : ''}.webp`;
