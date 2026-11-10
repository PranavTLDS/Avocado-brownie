// Admin panel (#/admin): add items, edit their details and photos, reorder, delete.
// Running locally (npm run dev) it saves into the project files. On a deployed static
// site it saves in this browser only and offers "Export products.json" to publish.
import { BRAND, CATEGORIES, PRODUCTS, DEFAULTS, DRAFT_KEY, setProducts, normalise, img, money } from './data.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 50) || 'item';
const AUTH = 'ab-admin-ok';

let devSave = null; // true when the local save endpoint answers
let editing = null; // working copy of the product being edited
let ctx = null;

async function detectDev() {
  if (devSave !== null) return devSave;
  try {
    const r = await fetch('/__admin/ping', { cache: 'no-store' });
    devSave = r.ok && (await r.json()).ok === true;
  } catch {
    devSave = false;
  }
  return devSave;
}

const hasDraft = () => {
  try {
    return !!localStorage.getItem(DRAFT_KEY);
  } catch {
    return false;
  }
};

export function adminView() {
  let authed = false;
  try {
    authed = sessionStorage.getItem(AUTH) === '1';
  } catch {}
  if (!authed) {
    return `<section class="admin admin--gate">
      <form class="gate" id="gateForm">
        <p class="script">Kitchen door</p>
        <h1 class="display">Admin</h1>
        <label class="field"><span>Passcode</span><input id="gatePin" type="password" autocomplete="current-password" required></label>
        <button class="btn btn--solid btn--full" type="submit">Enter</button>
        <p class="fine" id="gateMsg"></p>
      </form>
    </section>`;
  }
  return `<section class="admin">
    <header class="admin__head">
      <div>
        <p class="eyebrow"><i></i>Admin</p>
        <h1 class="display">Menu <span class="script">items</span></h1>
      </div>
      <div class="admin__tools">
        <span class="pill" id="saveMode">Checking…</span>
        <button class="btn btn--solid" id="addItem">+ New item</button>
      </div>
    </header>
    <div class="admin__bar">
      <button class="btn btn--line btn--sm" id="exportBtn">Export products.json</button>
      <label class="btn btn--line btn--sm">Import<input type="file" id="importFile" accept="application/json" hidden></label>
      <button class="btn btn--line btn--sm" id="discardBtn" hidden>Discard browser edits</button>
      <a class="btn btn--line btn--sm" href="#/">View site</a>
      <button class="btn btn--ghost btn--sm" id="logoutBtn">Lock</button>
    </div>
    <p class="fine admin__note" id="modeNote"></p>
    <div class="admin__list" id="adminList"></div>
  </section>
  <div class="editor" id="editor" aria-hidden="true"></div>`;
}

export function initAdmin(c) {
  ctx = c;
  const gate = $('#gateForm');
  if (gate) {
    $('#gatePin').focus();
    gate.addEventListener('submit', (e) => {
      e.preventDefault();
      if ($('#gatePin').value === BRAND.adminPin) {
        try {
          sessionStorage.setItem(AUTH, '1');
        } catch {}
        ctx.rerender();
      } else {
        $('#gateMsg').textContent = 'That passcode is not right.';
        $('#gatePin').select();
      }
    });
    return;
  }
  renderList();
  detectDev().then(updateMode);

  $('#addItem').onclick = () =>
    openEditor({ id: '', name: '', cat: 'bakes', price: '', tag: '', short: '', desc: '', notes: [], imgs: [], accent: '', star: false, hero: false });
  $('#exportBtn').onclick = exportJson;
  $('#importFile').onchange = importJson;
  $('#discardBtn').onclick = async () => {
    if (!confirm('Discard the edits saved in this browser and go back to the published menu?')) return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    try {
      const r = await fetch('/products.json', { cache: 'no-cache' });
      setProducts(r.ok ? (await r.json()).products : DEFAULTS);
    } catch {
      setProducts(DEFAULTS);
    }
    renderList();
    updateMode();
    ctx.toast('Browser edits discarded');
  };
  $('#logoutBtn').onclick = () => {
    try {
      sessionStorage.removeItem(AUTH);
    } catch {}
    ctx.rerender();
  };
}

function updateMode() {
  const pill = $('#saveMode');
  if (!pill) return;
  pill.textContent = devSave ? 'Saving to project files' : 'Saving in this browser';
  pill.classList.toggle('pill--ok', !!devSave);
  $('#modeNote').textContent = devSave
    ? 'Changes are written to public/products.json and public/img/uploads as you save. Deploy the site to publish them.'
    : 'This copy of the site cannot write files, so changes are kept in this browser only. Use "Export products.json" and put that file in the site\'s public folder to publish them for everyone.';
  $('#discardBtn').hidden = devSave || !hasDraft();
}

function renderList() {
  const list = $('#adminList');
  if (!list) return;
  const heroIds = PRODUCTS.filter((p) => p.hero && p.plate?.src).slice(0, 2).map((p) => p.id);
  list.innerHTML = PRODUCTS.map(
    (p, i) => `<div class="arow" data-id="${esc(p.id)}">
      <img src="${esc(img(p.imgs[0], true))}" alt="">
      <div class="arow__main">
        <b>${esc(p.name)}</b>
        <span>${esc(CATEGORIES.find((c) => c.id === p.cat)?.label || p.cat)} · ${money(p.price)}</span>
      </div>
      <div class="arow__tags">
        ${p.star ? '<em>Signature</em>' : ''}
        ${heroIds.includes(p.id) ? `<em class="o">3D plate ${heroIds.indexOf(p.id) + 1}</em>` : ''}
      </div>
      <div class="arow__act">
        <button data-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move ${esc(p.name)} up">↑</button>
        <button data-move="1" ${i === PRODUCTS.length - 1 ? 'disabled' : ''} aria-label="Move ${esc(p.name)} down">↓</button>
        <button data-edit>Edit</button>
        <button data-del class="danger">Delete</button>
      </div>
    </div>`
  ).join('');
  list.onclick = async (e) => {
    const row = e.target.closest('.arow');
    if (!row) return;
    const i = PRODUCTS.findIndex((p) => p.id === row.dataset.id);
    const p = PRODUCTS[i];
    if (e.target.closest('[data-edit]')) openEditor(JSON.parse(JSON.stringify(p)));
    else if (e.target.closest('[data-move]')) {
      const d = Number(e.target.closest('[data-move]').dataset.move);
      const j = i + d;
      if (j < 0 || j >= PRODUCTS.length) return;
      [PRODUCTS[i], PRODUCTS[j]] = [PRODUCTS[j], PRODUCTS[i]];
      await persist();
      renderList();
    } else if (e.target.closest('[data-del]')) {
      if (PRODUCTS.length <= 1) return alert('The menu needs at least one item.');
      if (!confirm(`Delete "${p.name}" from the menu? You can bring it back with "Discard browser edits" or an older products.json, but not with undo.`)) return;
      PRODUCTS.splice(i, 1);
      await persist();
      renderList();
      ctx.toast(`${p.name} deleted`);
    }
  };
}

// ── editor ──────────────────────────────────────────────────
function openEditor(p) {
  editing = p;
  const ed = $('#editor');
  const isNew = !p.id;
  ed.innerHTML = `<div class="editor__scrim" data-close-ed></div>
  <form class="editor__panel" id="edForm" novalidate>
    <div class="editor__head">
      <h2>${isNew ? 'New item' : 'Edit item'}</h2>
      <button type="button" data-close-ed>Close</button>
    </div>
    <div class="editor__body">
      <label class="field"><span>Name</span><input name="name" required maxlength="60" value="${esc(p.name)}"></label>
      <div class="field-row">
        <label class="field"><span>Category</span><select name="cat">${CATEGORIES.filter((c) => c.id !== 'all').map((c) => `<option value="${c.id}" ${c.id === p.cat ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
        <label class="field"><span>Price (${BRAND.currency})</span><input name="price" type="number" min="0" step="1" required value="${esc(p.price)}"></label>
      </div>
      <div class="field-row">
        <label class="field"><span>Badge (optional)</span><input name="tag" maxlength="24" placeholder="e.g. Signature" value="${esc(p.tag)}"></label>
        <label class="field"><span>Highlight word in title</span><input name="accent" maxlength="24" placeholder="e.g. Magnum" value="${esc(p.accent)}"></label>
      </div>
      <label class="field"><span>Short line (cards)</span><input name="short" maxlength="110" required value="${esc(p.short)}"></label>
      <label class="field"><span>Description (product page)</span><textarea name="desc" rows="4" maxlength="600">${esc(p.desc)}</textarea></label>
      <label class="field"><span>Highlights, one per line</span><textarea name="notes" rows="3">${esc((p.notes || []).join('\n'))}</textarea></label>
      <label class="check"><input type="checkbox" name="star" ${p.star ? 'checked' : ''}><span>Signature item (featured on the home page)</span></label>

      <h3>Photos</h3>
      <p class="fine">The first photo is the main one. Large photos are resized automatically.</p>
      <div class="pics" id="pics"></div>
      <label class="btn btn--line btn--sm">Add photos<input type="file" id="picFile" accept="image/*" multiple hidden></label>

      <h3>3D plate</h3>
      <p class="fine">A straight-down photo of the dish on its plate. Line the circle up with the plate's edge. Up to two items can be 3D plates: the first sits in the home page hero, and it flips into the second as you scroll.</p>
      <div class="plate-ed" id="plateEd"></div>
      <label class="btn btn--line btn--sm">Upload top-down photo<input type="file" id="plateFile" accept="image/*" hidden></label>
      <label class="check"><input type="checkbox" name="hero" ${p.hero ? 'checked' : ''}><span>Use as a 3D plate on the home page</span></label>
    </div>
    <div class="editor__foot">
      <p class="fine" id="edMsg"></p>
      <button class="btn btn--solid btn--full" type="submit" id="edSave">${isNew ? 'Add to menu' : 'Save changes'}</button>
    </div>
  </form>`;
  ed.classList.add('open');
  ed.setAttribute('aria-hidden', 'false');
  ctx.lockScroll(true);
  renderPics();
  renderPlate();

  ed.onclick = (e) => {
    if (e.target.closest('[data-close-ed]')) closeEditor();
  };
  $('#picFile').onchange = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    for (const f of files) {
      try {
        msg(`Adding ${f.name}…`);
        const data = await fileToDataUrl(f, 1600, 0.84);
        editing.imgs.push(await storeImage(data, `${slug(editing.name || 'item')}-${Date.now().toString(36)}`));
        renderPics();
      } catch (err) {
        msg(`Could not add ${f.name}: ${err.message}`, true);
        return;
      }
    }
    msg('');
  };
  $('#plateFile').onchange = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const data = await fileToDataUrl(f, 2400, 0.9);
      editing._plateSrc = data;
      editing._crop = { z: 0.92, x: 0, y: 0 };
      renderPlate();
    } catch (err) {
      msg(`Could not read that photo: ${err.message}`, true);
    }
  };
  $('#edForm').onsubmit = saveEditor;
  setTimeout(() => $('#edForm [name=name]').focus(), 300);
}

function closeEditor() {
  const ed = $('#editor');
  if (!ed) return;
  ed.classList.remove('open');
  ed.setAttribute('aria-hidden', 'true');
  ctx.lockScroll(false);
  editing = null;
}

function msg(t, bad) {
  const m = $('#edMsg');
  if (!m) return;
  m.textContent = t;
  m.classList.toggle('bad', !!bad);
}

function renderPics() {
  const box = $('#pics');
  box.innerHTML = editing.imgs.length
    ? editing.imgs
        .map(
          (src, i) => `<div class="pic"><img src="${esc(img(src, true))}" alt="">
        ${i === 0 ? '<em>Main</em>' : `<button type="button" data-first="${i}">Make main</button>`}
        <button type="button" class="x" data-rm="${i}" aria-label="Remove photo ${i + 1}">×</button></div>`
        )
        .join('')
    : '<p class="fine">No photos yet.</p>';
  box.onclick = (e) => {
    const rm = e.target.closest('[data-rm]');
    const first = e.target.closest('[data-first]');
    if (rm) editing.imgs.splice(Number(rm.dataset.rm), 1);
    if (first) editing.imgs.unshift(editing.imgs.splice(Number(first.dataset.first), 1)[0]);
    if (rm || first) renderPics();
  };
}

// circular crop for the 3D plate
function renderPlate() {
  const box = $('#plateEd');
  if (editing._plateSrc) {
    const c = editing._crop;
    box.innerHTML = `<div class="crop"><canvas id="cropCv" width="560" height="560"></canvas></div>
      <div class="crop__ctl">
        <label><span>Size</span><input type="range" id="cz" min="0.4" max="1" step="0.005" value="${c.z}"></label>
        <label><span>Left / right</span><input type="range" id="cx" min="-0.5" max="0.5" step="0.002" value="${c.x}"></label>
        <label><span>Up / down</span><input type="range" id="cy" min="-0.5" max="0.5" step="0.002" value="${c.y}"></label>
        <div class="field-row">
          <label class="field"><span>Plate edge colour</span><input type="color" id="rimCol" value="${esc(editing.plate?.rim || '#f4f2ee')}"></label>
          <label class="field"><span>Plate shape</span><select id="shape"><option value="flat">Flat plate</option><option value="bowl" ${editing.plate?.shape === 'bowl' ? 'selected' : ''}>Wide-rim bowl</option></select></label>
        </div>
      </div>`;
    const im = new Image();
    im.onload = () => {
      editing._img = im;
      drawCrop();
      if (!editing.plate?.rim) $('#rimCol').value = sampleRim();
    };
    im.src = editing._plateSrc;
    ['cz', 'cx', 'cy'].forEach((id) =>
      $('#' + id).addEventListener('input', (e) => {
        editing._crop[{ cz: 'z', cx: 'x', cy: 'y' }[id]] = Number(e.target.value);
        drawCrop();
      })
    );
    $('#cz').addEventListener('change', () => ($('#rimCol').value = sampleRim()));
    return;
  }
  box.innerHTML = editing.plate?.src
    ? `<div class="crop crop--done"><img src="${esc(editing.plate.src)}" alt="Current 3D plate"></div><button type="button" class="btn btn--ghost btn--sm" id="plateRm">Remove 3D plate</button>`
    : '<p class="fine">No 3D plate photo yet.</p>';
  const rm = $('#plateRm');
  if (rm)
    rm.onclick = () => {
      delete editing.plate;
      editing.hero = false;
      renderPlate();
      $('#edForm [name=hero]').checked = false;
    };
}

function cropRect() {
  const im = editing._img;
  const c = editing._crop;
  const side = Math.min(im.width, im.height) * c.z;
  return { x: im.width / 2 + c.x * im.width - side / 2, y: im.height / 2 + c.y * im.height - side / 2, side };
}

function drawCrop() {
  const cv = $('#cropCv');
  if (!cv || !editing._img) return;
  const g = cv.getContext('2d');
  const im = editing._img;
  const W = cv.width;
  const s = W / Math.max(im.width, im.height);
  const ox = (W - im.width * s) / 2;
  const oy = (W - im.height * s) / 2;
  g.fillStyle = '#111';
  g.fillRect(0, 0, W, W);
  g.drawImage(im, ox, oy, im.width * s, im.height * s);
  const r = cropRect();
  g.save();
  g.fillStyle = 'rgba(0,0,0,0.62)';
  g.beginPath();
  g.rect(0, 0, W, W);
  g.arc(ox + (r.x + r.side / 2) * s, oy + (r.y + r.side / 2) * s, (r.side / 2) * s, 0, Math.PI * 2, true);
  g.fill('evenodd');
  g.strokeStyle = '#ff6d25';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(ox + (r.x + r.side / 2) * s, oy + (r.y + r.side / 2) * s, (r.side / 2) * s, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}

function sampleRim() {
  const r = cropRect();
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.drawImage(editing._img, r.x, r.y, r.side, r.side, 0, 0, 128, 128);
  const d = g.getImageData(0, 0, 128, 128).data;
  let R = 0, G = 0, B = 0, n = 0;
  for (let a = 0; a < 360; a += 4) {
    const x = Math.round(64 + Math.cos((a * Math.PI) / 180) * 59);
    const y = Math.round(64 + Math.sin((a * Math.PI) / 180) * 59);
    const i = (y * 128 + x) * 4;
    R += d[i]; G += d[i + 1]; B += d[i + 2]; n++;
  }
  return '#' + [R, G, B].map((v) => Math.round(v / n).toString(16).padStart(2, '0')).join('');
}

function exportPlate() {
  const r = cropRect();
  const S = devSave ? 2048 : 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.beginPath();
  g.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2);
  g.clip();
  g.drawImage(editing._img, r.x, r.y, r.side, r.side, 0, 0, S, S);
  const webp = c.toDataURL('image/webp', 0.9);
  return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png');
}

async function saveEditor(e) {
  e.preventDefault();
  const f = $('#edForm');
  const fd = new FormData(f);
  const name = String(fd.get('name')).trim();
  const price = Number(fd.get('price'));
  const short = String(fd.get('short')).trim();
  const bad = [];
  if (!name) bad.push('a name');
  if (!(price >= 0) || fd.get('price') === '') bad.push('a price');
  if (!short) bad.push('a short line');
  if (!editing.imgs.length) bad.push('at least one photo');
  if (bad.length) return msg(`Please add ${bad.join(', ')}.`, true);

  const btn = $('#edSave');
  btn.disabled = true;
  msg('Saving…');
  try {
    const p = editing;
    const isNew = !p.id;
    if (isNew) {
      let id = slug(name);
      let n = 2;
      while (PRODUCTS.some((x) => x.id === id)) id = `${slug(name)}-${n++}`;
      p.id = id;
    }
    Object.assign(p, {
      name,
      price,
      short,
      cat: fd.get('cat'),
      tag: String(fd.get('tag')).trim(),
      accent: String(fd.get('accent')).trim(),
      desc: String(fd.get('desc')).trim() || short,
      notes: String(fd.get('notes')).split('\n').map((s) => s.trim()).filter(Boolean),
      star: fd.get('star') === 'on',
      hero: fd.get('hero') === 'on',
    });
    if (p._plateSrc && p._img) {
      const src = await storeImage(exportPlate(), `plate-${p.id}-${Date.now().toString(36)}`);
      p.plate = { src, rim: $('#rimCol').value, shape: $('#shape').value };
    } else if (p.plate && $('#rimCol')) {
      p.plate.rim = $('#rimCol').value;
    }
    if (p.hero && !p.plate) {
      btn.disabled = false;
      return msg('To use this as the 3D plate, upload a top-down photo first.', true);
    }
    delete p._plateSrc;
    delete p._img;
    delete p._crop;
    if (!p.tag) delete p.tag;
    if (!p.accent) delete p.accent;
    // only one item can be the hero plate
    if (p.hero) PRODUCTS.filter((x) => x.hero && x.id !== p.id).slice(1).forEach((x) => delete x.hero);
    const clean = normalise(p);
    const i = PRODUCTS.findIndex((x) => x.id === p.id);
    if (i >= 0) PRODUCTS[i] = clean;
    else PRODUCTS.push(clean);
    await persist();
    renderList();
    updateMode();
    closeEditor();
    ctx.toast(isNew ? `${name} added to the menu` : `${name} saved`);
  } catch (err) {
    msg(`Not saved: ${err.message}`, true);
    btn.disabled = false;
  }
}

// ── storage ─────────────────────────────────────────────────
async function storeImage(dataUrl, name) {
  if (await detectDev()) {
    const r = await fetch('/__admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, data: dataUrl }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'upload failed');
    return j.url;
  }
  return dataUrl;
}

async function persist() {
  const products = JSON.parse(JSON.stringify(PRODUCTS));
  if (await detectDev()) {
    const r = await fetch('/__admin/catalogue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products }) });
    if (!r.ok) throw new Error((await r.json()).error || 'could not write products.json');
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    return;
  }
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ products }));
  } catch {
    throw new Error('this browser is out of storage space. Export products.json now, or use fewer or smaller photos.');
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ updated: new Date().toISOString(), products: PRODUCTS }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'products.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importJson(e) {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    const list = Array.isArray(j) ? j : j.products;
    if (!Array.isArray(list) || !list.length || !list.every((p) => p.id && p.name)) throw new Error('this does not look like a products.json file');
    if (!confirm(`Replace the menu with the ${list.length} items in ${f.name}?`)) return;
    setProducts(list);
    await persist();
    renderList();
    updateMode();
    ctx.toast(`Imported ${list.length} items`);
  } catch (err) {
    alert(`Import failed: ${err.message}`);
  }
}

function fileToDataUrl(file, max, q) {
  return new Promise((res, rej) => {
    if (!file.type.startsWith('image/')) return rej(new Error('not an image'));
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * s);
      c.height = Math.round(im.height * s);
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const webp = c.toDataURL('image/webp', q);
      res(webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', q));
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error('the browser could not open it'));
    };
    im.src = url;
  });
}
