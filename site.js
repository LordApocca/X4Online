'use strict';
(() => {
  const TEXT = {
    'nav.account': 'Account',
    'nav.signin': 'Sign in',
    'nav.cta-account': 'Account',
    'lock.title': 'Sign-ins are closed right now',
    'lock.default': 'The server isn\'t taking sign-ins at the moment. Check back later.',
    'lock.register': 'You can still create your account now, and sign in with it once sign-ins open.',
    'servers.empty': 'No sessions are open right now. Start new sessions in the app.',
    'servers.offline': 'No live data. The server is offline.',
    'download.looking': 'Looking up the latest release…',
    'download.fallback': 'The latest release is on GitHub.',
  };
  const TEXT_WHERE = {
    'nav.account': 'Menu: the Account link, signed out',
    'nav.signin': 'Top right button, signed out',
    'nav.cta-account': 'Top right button, signed in',
    'lock.title': 'Sign-ins closed: the notice\'s heading (Download and Create account)',
    'lock.default': 'Sign-ins closed: the notice\'s text when the server gives no message',
    'lock.register': 'Sign-ins closed: the line under the notice on Create account',
    'servers.empty': 'Servers: no session is open',
    'servers.offline': 'Servers: the server is offline',
    'download.looking': 'Download: while the release is looked up',
    'download.fallback': 'Download: the release could not be looked up',
  };
  const LIVE_API = 'https://130.61.223.91:47800/x4online/api/';
  const local = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  const asked = new URLSearchParams(location.search).get('api');
  const API = local && asked ? asked.replace(/\/?$/, '/') + 'x4online/api/' : LIVE_API;
  const RELEASES = 'https://api.github.com/repos/LordApocca/X4Online/releases/latest';
  const STATUS_MS = 15000;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const el = (tag, props = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v);
    }
    for (const k of kids) if (k != null) e.append(k);
    return e;
  };
  const store = {
    get() { try { return localStorage.getItem('x4o.token') || sessionStorage.getItem('x4o.token'); } catch { return null; } },
    set(token, remember) {
      try {
        this.clear();
        (remember ? localStorage : sessionStorage).setItem('x4o.token', token);
      } catch {   }
      memToken = token;
    },
    clear() { try { localStorage.removeItem('x4o.token'); sessionStorage.removeItem('x4o.token'); } catch { } memToken = null; },
  };
  let memToken = null;
  const token = () => memToken || store.get();
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const cleanTexts = o => {
    const r = {};
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (typeof v === 'string' && v) r[k] = v;
    return r;
  };
  const SRC = {};
  for (const n of $$('[data-edit]')) if (!has(SRC, n.dataset.edit)) SRC[n.dataset.edit] = n.textContent;
  let OVR = {};
  try { OVR = cleanTexts(JSON.parse(localStorage.getItem('x4o.texts') || '{}')); } catch { }
  const cacheTexts = () => { try { localStorage.setItem('x4o.texts', JSON.stringify(OVR)); } catch { } };
  const source = key => has(TEXT, key) ? TEXT[key] : has(SRC, key) ? SRC[key] : '';
  const T = key => has(OVR, key) ? OVR[key] : source(key);
  let active = null;
  function applyTexts() {
    for (const n of $$('[data-edit]')) {
      if (n === active) continue;
      const key = n.dataset.edit, t = T(key);
      if (n.textContent !== t) n.textContent = t;
      if (n.classList.contains('glitch')) n.dataset.text = t;
      n.classList.toggle('edited', has(OVR, key));
    }
    moveInk();
  }
  function setText(node, key) {
    if (node === active) stopEdit(false);
    node.dataset.edit = key;
    node.textContent = T(key);
    node.classList.toggle('edited', has(OVR, key));
  }
  function setData(node, text) {
    if (node === active) stopEdit(false);
    node.removeAttribute('data-edit');
    node.classList.remove('edited');
    node.textContent = text;
  }
  const keyed = (tag, key, cls) => { const n = el(tag, cls ? { class: cls } : {}); setText(n, key); return n; };
  applyTexts();
  async function api(path, { method = 'GET', body, auth = false, timeout = 12000 } = {}) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (auth && token()) headers.Authorization = 'Bearer ' + token();
    try {
      const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal, cache: 'no-store' });
      let data = null;
      try { data = await res.json(); } catch { }
      if (!res.ok) {
        const err = new Error((data && data.error) || 'The server answered ' + res.status + '.');
        err.status = res.status;
        err.code = (data && data.code) || '';
        throw err;
      }
      return data || {};
    } catch (e) {
      if (e.status) throw e;
      const err = new Error("Can't reach the X4 Online server right now. Try again in a moment.");
      err.status = 0;
      throw err;
    } finally { clearTimeout(timer); }
  }
  function toast(text, kind = '') {
    const t = el('div', { class: 'toast ' + kind, text });
    $('#toasts').append(t);
    setTimeout(() => { t.classList.add('out'); t.addEventListener('animationend', () => t.remove(), { once: true }); }, 4200);
  }
  const stars = (() => {
    const cv = $('#stars'), cx = cv.getContext('2d');
    let w, h, list = [], speed = 0.6, target = 0.6, mx = 0, my = 0, px = 0, py = 0;
    const N = () => Math.min(900, Math.floor(w * h / 2400));
    function resize() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      list = Array.from({ length: N() }, () => spawn(true));
    }
    function spawn(any) {
      const hue = Math.random() < .12 ? (Math.random() < .5 ? 28 : 265) : 195;
      return { x: (Math.random() - .5) * w * 2, y: (Math.random() - .5) * h * 2, z: any ? Math.random() * w : w, hue, s: Math.random() * .8 + .4 };
    }
    function frame() {
      speed += (target - speed) * .06;
      px += (mx - px) * .05; py += (my - py) * .05;
      cx.fillStyle = speed > 3 ? 'rgba(4,7,12,.35)' : 'rgba(4,7,12,.9)';
      cx.fillRect(0, 0, w, h);
      const ox = w / 2 - px * 40, oy = h / 2 - py * 40;
      for (const s of list) {
        const pz = s.z;
        s.z -= speed * s.s * 2;
        if (s.z < 1) { Object.assign(s, spawn(false)); continue; }
        const k = 240 / s.z, x = s.x * k + ox, y = s.y * k + oy;
        if (x < -20 || x > w + 20 || y < -20 || y > h + 20) { Object.assign(s, spawn(false)); continue; }
        const r = Math.max(.3, (1 - s.z / w) * 2.2), a = Math.min(1, (1 - s.z / w) * 1.4);
        cx.strokeStyle = cx.fillStyle = `hsla(${s.hue}, 90%, ${s.hue === 195 ? 82 : 70}%, ${a})`;
        if (speed > 2) {
          const k0 = 240 / pz;
          cx.lineWidth = r; cx.beginPath(); cx.moveTo(s.x * k0 + ox, s.y * k0 + oy); cx.lineTo(x, y); cx.stroke();
        } else { cx.beginPath(); cx.arc(x, y, r, 0, 6.283); cx.fill(); }
      }
      if (!reduced) requestAnimationFrame(frame);
    }
    addEventListener('resize', resize);
    addEventListener('pointermove', e => { mx = e.clientX / w - .5; my = e.clientY / h - .5; });
    resize();
    if (reduced) frame(); else requestAnimationFrame(frame);
    return { warp() { if (reduced) return; target = 14; setTimeout(() => { target = .6; }, 420); } };
  })();
  const top = $('#top'), burger = $('#burger'), drawer = $('#drawer');
  addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 10), { passive: true });
  function setDrawer(open) {
    drawer.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    drawer.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });
  function moveInk() {
    const a = $('#nav a.active'), ink = $('#nav .ink');
    if (!a) { ink.style.width = '0'; return; }
    ink.style.left = a.offsetLeft + 16 + 'px';
    ink.style.width = a.offsetWidth - 32 + 'px';
  }
  addEventListener('resize', moveInk);
  $$('#nav a').forEach(a => {
    a.addEventListener('mouseenter', () => { const ink = $('#nav .ink'); ink.style.left = a.offsetLeft + 16 + 'px'; ink.style.width = a.offsetWidth - 32 + 'px'; });
  });
  $('#nav').addEventListener('mouseleave', moveInk);
  const PAGES = ['home', 'faq', 'servers', 'download', 'account'];
  const TITLES = { faq: 'FAQ' };
  let current = null;
  function show(name, first) {
    if (!PAGES.includes(name)) name = 'home';
    setDrawer(false);
    $$('[data-link]').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + name && !a.classList.contains('brand') && !a.classList.contains('btn')));
    moveInk();
    if (name === current) return;
    stopEdit(true);
    const old = current && $(`.page[data-page="${current}"]`), next = $(`.page[data-page="${name}"]`);
    current = name;
    document.title = name === 'home' ? 'X4 Online' : 'X4 Online · ' + (TITLES[name] || name[0].toUpperCase() + name.slice(1));
    const enter = () => {
      if (old) old.classList.remove('leaving', 'shown');
      next.classList.add('shown');
      scrollTo({ top: 0, behavior: 'instant' });
      revealIn(next);
      if (name === 'servers') renderServers();
      if (name === 'download') loadRelease();
    };
    if (old && !first && !reduced) {
      old.classList.add('leaving');
      stars.warp();
      setTimeout(enter, 260);
    } else enter();
  }
  addEventListener('hashchange', () => show(location.hash.slice(1)));
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-tab]');
    if (a && a.matches('a')) setTimeout(() => setTab(a.dataset.tab), 300);
  });
  $('.scroll-cue').addEventListener('click', () => $('#features').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0, rootMargin: '0px 0px -12% 0px' });
  function revealIn(page) { $$('.reveal', page).forEach(r => { r.classList.remove('in'); io.observe(r); }); }
  if (!reduced) $$('.tilt').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = `perspective(900px) rotateX(${(.5 - y) * 7}deg) rotateY(${(x - .5) * 9}deg) translateY(-4px)`;
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
  $$('.faq-q').forEach(q => q.addEventListener('click', () => {
    if (editing) return;
    const item = q.closest('.faq-item'), open = !item.classList.contains('open');
    item.classList.toggle('open', open);
    q.setAttribute('aria-expanded', open);
  }));
  let faqGroup = 'all';
  function filterFaq() {
    const words = $('#faq-q').value.toLowerCase().split(/\s+/).filter(Boolean);
    let any = false;
    $$('.faq-group').forEach(g => {
      let shown = 0;
      $$('.faq-item', g).forEach(item => {
        const text = item.textContent.toLowerCase(), hit = words.every(w => text.includes(w));
        item.hidden = !hit;
        if (hit) shown++;
        if (words.length && hit && !item.classList.contains('open')) item.classList.add('open', 'by-search');
        if (!words.length && item.classList.contains('by-search')) item.classList.remove('open', 'by-search');
        $('.faq-q', item).setAttribute('aria-expanded', item.classList.contains('open'));
      });
      g.hidden = !shown || (faqGroup !== 'all' && g.dataset.group !== faqGroup);
      if (!g.hidden) { any = true; g.classList.add('in'); }
    });
    $('#faq-none').hidden = any;
  }
  $('#faq-q').addEventListener('input', filterFaq);
  $$('.faq-chips .chip-btn').forEach(b => b.addEventListener('click', () => {
    if (editing) return;
    faqGroup = b.dataset.group;
    $$('.faq-chips .chip-btn').forEach(c => c.classList.toggle('on', c === b));
    filterFaq();
  }));
  let status = null;
  function countTo(node, value) {
    const from = parseInt(node.textContent, 10) || 0, start = performance.now(), dur = 900;
    if (reduced || from === value) { node.textContent = value; return; }
    const step = t => {
      const p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(from + (value - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  async function poll() {
    const chip = $('#status-chip');
    try {
      status = await api('status');
      chip.className = 'chip ok';
      chip.lastElementChild.textContent = status.closed ? 'Sign-ins closed' : `${status.online} online`;
      for (const k of ['online', 'sessions', 'accounts']) countTo($(`[data-count="${k}"]`), status[k] || 0);
      $('.pulse').classList.toggle('on', (status.rooms || []).length > 0);
      if ($('#stat-version').textContent === '–' && status.app) $('#stat-version').textContent = 'v' + status.app;
    } catch {
      status = null;
      chip.className = 'chip down';
      chip.lastElementChild.textContent = 'Server offline';
    }
    lockNotes();
    if (current === 'servers') renderServers();
  }
  function lockNotes() {
    const closed = !!(status && status.closed);
    const message = closed && typeof status.closedText === 'string' ? status.closedText.trim() : '';
    const state = closed ? 'closed:' + message : '';
    for (const box of $$('.lock-note')) {
      if ((box.dataset.state || '') === state) continue;
      box.dataset.state = state;
      box.hidden = !closed;
      box.replaceChildren();
      if (!closed) continue;
      const ns = 'http://www.w3.org/2000/svg', icon = document.createElementNS(ns, 'svg'), path = document.createElementNS(ns, 'path');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('aria-hidden', 'true');
      path.setAttribute('d', 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2');
      icon.append(path);
      box.append(icon, el('div', {},
        keyed(box.dataset.heading === 'h3' ? 'h3' : 'h2', 'lock.title'),
        message ? el('p', { class: 'lock-text', text: message }) : keyed('p', 'lock.default', 'lock-text'),
        box.closest('#f-register') ? keyed('p', 'lock.register', 'lock-text') : null));
    }
  }
  function playTime(min) {
    if (min < 0) return null;
    const h = Math.floor(min / 60);
    return h >= 1 ? `${h} h ${min % 60} min played` : `${min} min played`;
  }
  function renderServers() {
    const list = $('#srv-list'), sum = $('#srv-summary');
    if (active && list.contains(active)) return;
    list.replaceChildren();
    if (!status) {
      if (sum.dataset.loaded) {
        sum.textContent = 'The X4 Online server is offline right now.';
        list.append(el('div', { class: 'empty glass' }, emptyIcon(), keyed('p', 'servers.offline')));
      } else for (let i = 0; i < 3; i++) list.append(el('div', { class: 'skeleton' }));
      return;
    }
    sum.dataset.loaded = '1';
    const rooms = status.rooms || [];
    sum.textContent = `${status.online} pilot${status.online === 1 ? '' : 's'} online · ${rooms.length} open session${rooms.length === 1 ? '' : 's'}`;
    if (!rooms.length) {
      list.append(el('div', { class: 'empty glass' }, emptyIcon(), keyed('p', 'servers.empty')));
      return;
    }
    rooms.forEach((r, i) => {
      const slots = el('div', { class: 'slots', title: `${r.online} online, ${r.slotsUsed} of ${r.maxSlots} slots taken` });
      for (let s = 0; s < r.maxSlots; s++) slots.append(el('i', { class: s < r.online ? 'on' : s < r.slotsUsed ? 'used' : '' }));
      slots.append(el('span', { text: `${r.online}/${r.maxSlots}` }));
      const tags = el('div', { class: 'tags' });
      tags.append(el('span', { class: 'tag' + (r.started ? ' live' : ''), text: r.started ? 'In play' : 'In the lobby' }));
      if (r.locked) tags.append(el('span', { class: 'tag lock', text: 'Password' }));
      if (r.started && !r.hotjoin) tags.append(el('span', { class: 'tag', text: 'Members only' }));
      const pt = playTime(r.minutes);
      if (pt) tags.append(el('span', { class: 'tag', text: pt }));
      for (const d of r.dlc || []) tags.append(el('span', { class: 'tag', text: d }));
      const card = el('article', { class: 'srv glass' },
        el('div', {}, el('h3', { text: r.name }), el('div', { class: 'host', text: 'Hosted by ' + r.host })),
        slots,
        r.desc ? el('p', { class: 'desc', text: r.desc }) : null,
        tags);
      card.style.animationDelay = i * 60 + 'ms';
      list.append(card);
    });
  }
  function emptyIcon() {
    const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'), p = document.createElementNS(ns, 'path');
    s.setAttribute('viewBox', '0 0 24 24');
    p.setAttribute('d', 'M12 2 21 7v10l-9 5-9-5V7zM8 12h8');
    s.append(p);
    return s;
  }
  $('#srv-refresh').addEventListener('click', () => { status = null; renderServers(); poll(); });
  let release = null;
  const AGE_UNITS = [['year', 31536e6], ['month', 2592e6], ['week', 6048e5], ['day', 864e5], ['hour', 36e5], ['minute', 6e4]];
  function showAge() {
    const t = release && release.published_at ? Date.parse(release.published_at) : NaN;
    if (isNaN(t)) return;
    const ms = Date.now() - t;
    const [unit, size] = AGE_UNITS.find(([, s]) => ms >= s) || ['minute', 6e4];
    const n = Math.max(1, Math.floor(ms / size));
    $('#stat-age').textContent = 'updated ' + new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-n, unit);
  }
  async function loadRelease() {
    if (release) return;
    release = 'loading';
    try {
      const res = await fetch(RELEASES, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error();
      const r = await res.json();
      release = r;
      const zip = (r.assets || []).find(a => /\.zip$/i.test(a.name));
      $('#dl-version').textContent = 'X4 Online ' + r.tag_name;
      const date = new Date(r.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      setData($('#dl-meta'), `${r.name || r.tag_name} · ${date}` + (zip ? ` · ${(zip.size / 1048576).toFixed(0)} MB` : ''));
      $('#stat-version').textContent = r.tag_name;
      showAge();
    } catch {
      release = null;
      setText($('#dl-meta'), 'download.fallback');
    }
  }
  let NOTES = null;
  const verKey = v => String(v || '').split(/[.+-]/).map(p => (/^\d+$/.test(p) ? p.padStart(6, '0') : p)).join('.');
  const allNotes = () => {
    const own = typeof X4O_CHANGELOG !== 'undefined' ? X4O_CHANGELOG : [];
    if (!NOTES) return own;
    const have = new Set(NOTES.map(r => r.version));
    return NOTES.concat(own.filter(r => !have.has(r.version))).sort((a, b) => (verKey(a.version) < verKey(b.version) ? 1 : verKey(a.version) > verKey(b.version) ? -1 : 0));
  };
  async function loadNotes() {
    try {
      const r = await api('changelog');
      if (Array.isArray(r.entries)) { NOTES = r.entries; renderNotes(); }
    } catch {   }
  }
  function renderNotes() {
    const box = $('#notes');
    box.replaceChildren();
    const all = allNotes().filter(n => n.date);
    const draw = n => all.slice(0, n).forEach((r, i) => {
      const ul = el('ul');
      for (const c of r.changes) ul.append(el('li', {}, el('em', { class: c.kind, text: c.kind }), el('span', { text: c.text })));
      const card = el('article', { class: 'note glass' }, el('header', {}, el('b', { text: 'v' + r.version }), el('span', { text: r.title || '' }), el('time', { text: r.date })), ul);
      card.style.animationDelay = i * 50 + 'ms';
      box.append(card);
    });
    draw(3);
    if (all.length > 3) {
      const more = el('button', { class: 'btn btn-small btn-ghost more', type: 'button', text: 'Show older releases' });
      more.addEventListener('click', () => { box.replaceChildren(); draw(all.length); });
      box.append(more);
    }
  }
  const ROAD_STATUS = { planned: 'Planned', building: 'In development', testing: 'In testing', released: 'Released' };
  let ROAD = null;
  const allRoad = () => ROAD || (typeof X4O_ROADMAP !== 'undefined' ? X4O_ROADMAP : []);
  async function loadRoad() {
    try {
      const r = await api('roadmap');
      if (Array.isArray(r.entries)) { ROAD = r.entries; renderRoad(); }
    } catch {   }
  }
  function renderRoad() {
    const box = $('#road');
    const list = allRoad();
    $('#roadmap').hidden = !list.length && !editing;
    box.replaceChildren(...list.map((r, i) => {
      const paras = String(r.body || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      const body = el('div', { class: 'road-body' }, ...paras.map(p => el('p', { text: p })));
      body.hidden = true;
      const card = el('article', { class: 'road-card glass' },
        el('header', {}, el('em', { class: 'road-status ' + (ROAD_STATUS[r.status] ? r.status : 'planned'), text: ROAD_STATUS[r.status] || 'Planned' }),
          r.date ? el('time', { text: r.date }) : ''),
        el('h3', { text: r.title }),
        r.summary ? el('p', { class: 'road-summary', text: r.summary }) : '',
        body);
      if (paras.length) {
        const more = el('button', { class: 'btn btn-small btn-ghost road-more', type: 'button', 'aria-expanded': 'false', text: 'Read more' });
        more.addEventListener('click', () => {
          body.hidden = !body.hidden;
          more.textContent = body.hidden ? 'Read more' : 'Show less';
          more.setAttribute('aria-expanded', String(!body.hidden));
        });
        card.append(more);
      }
      card.style.animationDelay = i * 60 + 'ms';
      return card;
    }));
  }
  const panes = $('.panes');
  function setTab(name) {
    $('.tabs').dataset.on = name;
    $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === name));
    const from = panes.offsetHeight;
    $$('.pane').forEach(p => { p.hidden = p.dataset.pane !== name; });
    const to = $(`.pane[data-pane="${name}"]`).offsetHeight;
    panes.style.height = from + 'px';
    requestAnimationFrame(() => { panes.style.height = to + 'px'; });
    setTimeout(() => { panes.style.height = ''; }, 520);
    const first = $(`.pane[data-pane="${name}"] input`);
    if (first && current === 'account' && matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
  }
  $$('.tab').forEach(t => t.addEventListener('click', () => setTab(t.dataset.tab)));
  setTab('login');
  $$('.eye').forEach(b => b.addEventListener('click', () => {
    const i = b.parentElement.querySelector('input'), on = i.type === 'password';
    i.type = on ? 'text' : 'password';
    b.classList.toggle('on', on);
    b.setAttribute('aria-label', on ? 'Hide password' : 'Show password');
  }));
  function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return pw.length < 8 ? Math.min(s, 1) : s;
  }
  $$('input[autocomplete="new-password"][name="password"]').forEach(i => i.addEventListener('input', () => {
    const m = i.closest('form').querySelector('.meter i'), s = strength(i.value);
    m.style.width = i.value ? Math.max(12, s * 20) + '%' : '0';
    m.style.background = ['var(--bad)', 'var(--bad)', 'var(--warn)', 'var(--warn)', 'var(--good)', 'var(--good)'][s];
  }));
  function formError(form, text, field) {
    const p = form.querySelector('.form-error');
    p.textContent = text || '';
    p.classList.toggle('shown', !!text);
    p.classList.remove('note');
    $$('.field', form).forEach(f => f.classList.remove('bad'));
    if (field) {
      const f = form.querySelector(`[name="${field}"]`).closest('.field');
      void f.offsetWidth;
      f.classList.add('bad');
    }
  }
  function busy(form, on) {
    const b = form.querySelector('button[type="submit"]');
    b.disabled = on;
    b.classList.toggle('busy', on);
  }
  async function submitAuth(form, kind) {
    const name = form.name.value.trim(), pw = form.password.value;
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(name)) return formError(form, 'Account names are 3 to 20 letters, digits, - and _.', 'name');
    if (kind === 'register') {
      if (pw.length < 8) return formError(form, 'Passwords need at least 8 characters.', 'password');
      if (pw !== form.confirm.value) return formError(form, "The two passwords don't match.", 'confirm');
    } else if (!pw) return formError(form, 'Enter your password.', 'password');
    formError(form, '');
    busy(form, true);
    try {
      const r = await api(kind, { method: 'POST', body: { t: kind, name, password: pw } });
      store.set(r.token, form.remember.checked);
      form.reset();
      $$('.meter i', form).forEach(m => { m.style.width = '0'; });
      showMe(r.account, true);
      toast(kind === 'register' ? `Welcome aboard, ${r.account.name}.` : `Signed in as ${r.account.name}.`, 'good');
    } catch (e) {
      if (e.code === 'created_closed') {
        form.reset();
        $$('.meter i', form).forEach(m => { m.style.width = '0'; });
        setTab('login');
        $('#f-login').name.value = name;
        formError($('#f-login'), e.message);
        $('#f-login .form-error').classList.add('note');
        toast(`Account ${name} created.`, 'good');
        return;
      }
      formError(form, e.message, e.status === 409 ? 'name' : e.status === 401 ? 'password' : null);
    } finally { busy(form, false); }
  }
  $('#f-login').addEventListener('submit', e => { e.preventDefault(); submitAuth(e.target, 'login'); });
  $('#f-register').addEventListener('submit', e => { e.preventDefault(); submitAuth(e.target, 'register'); });
  function fmtDate(s) {
    if (!s) return '–';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function showMe(a, animate) {
    $('#auth').hidden = true;
    const me = $('#me');
    me.hidden = false;
    if (animate) { me.style.animation = 'none'; void me.offsetWidth; me.style.animation = ''; }
    const f = a.faction || {};
    $('#me-avatar').textContent = (f.short || a.name).slice(0, 3).toUpperCase();
    $('#me-name').textContent = a.name;
    $('#me-faction').textContent = f.name || '';
    $('#me-fname').textContent = f.name || '–';
    $('#me-fshort').textContent = f.short || '–';
    $('#me-look').textContent = f.modelName || 'The default look';
    $('#me-start').textContent = f.startName || 'Argon Prime';
    $('#me-desc').textContent = f.desc || '';
    $('#me-created').textContent = fmtDate(a.created);
    $('#me-last').textContent = fmtDate(a.lastLogin);
    $('#me-online').textContent = a.online ? 'Yes' : 'No';
    $('#me-pid').textContent = a.playerId;
    const badges = $('#me-badges');
    badges.replaceChildren();
    if (a.role === 'admin' || a.role === 'moderator') badges.append(el('span', { class: 'badge staff', text: '★ ' + a.role }));
    if (a.role === 'tester') badges.append(el('span', { class: 'badge', text: 'Tester' }));
    if (a.online) badges.append(el('span', { class: 'badge on', text: 'In the app' }));
    setData($('#nav-account-label'), a.name);
    setText($('#cta-label'), 'nav.cta-account');
    moveInk();
    account = a;
    editControls();
  }
  function showSignedOut() {
    $('#me').hidden = true;
    $('#auth').hidden = false;
    setText($('#nav-account-label'), 'nav.account');
    setText($('#cta-label'), 'nav.signin');
    moveInk();
    account = null;
    editControls();
  }
  function signedOut(why) {
    store.clear();
    showSignedOut();
    toast(why, 'bad');
  }
  $('#sign-out').addEventListener('click', async () => {
    exitEdit(false);
    try { await api('logout', { method: 'POST', auth: true }); } catch { }
    store.clear();
    showSignedOut();
    toast('Signed out.');
  });
  $('#f-password').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    if (form.password.value.length < 8) return formError(form, 'Passwords need at least 8 characters.', 'password');
    formError(form, '');
    busy(form, true);
    try {
      const r = await api('password', { method: 'POST', auth: true, body: { t: 'password', old: form.old.value, password: form.password.value } });
      let remember = false;
      try { remember = !!localStorage.getItem('x4o.token'); } catch { }
      store.set(r.token, remember);
      form.reset();
      form.closest('details').open = false;
      toast('Password changed. Sign in again in the app with the new one.', 'good');
    } catch (err) {
      if (err.status === 401) { signedOut(err.message); return; }
      formError(form, err.message, err.status === 403 ? 'old' : null);
    } finally { busy(form, false); }
  });
  async function restore() {
    if (!token()) return;
    try { const r = await api('me', { auth: true }); showMe(r.account, false); }
    catch (e) { if (e.status === 401) store.clear(); }
  }
  const fab = $('#edit-fab'), bar = $('#edit-bar'), chip = $('#edit-reset'), dialog = $('#edit-dialog'), unlockForm = $('#f-unlock');
  let account = null, contentOk = false, editing = false;
  let before = '';
  let pending = null;
  let unlockedUntil = 0, idleMs = 15 * 60000;
  let chipFor = null, chipTimer = 0;
  async function loadContent() {
    try {
      OVR = cleanTexts((await api('content')).texts);
      contentOk = true;
      cacheTexts();
    } catch (e) {
      contentOk = false;
      if (e.status === 404) { OVR = {}; cacheTexts(); }
    }
    applyTexts();
    editControls();
  }
  function editControls() {
    const can = !!(account && account.canEdit && contentOk);
    if (!can) exitEdit(false);
    fab.hidden = !can || editing;
    document.body.classList.toggle('can-edit', can);
  }
  function askPassword() {
    unlockForm.reset();
    formError(unlockForm, '');
    if (!dialog.open) dialog.showModal();
    unlockForm.password.focus();
  }
  fab.addEventListener('click', () => { if (Date.now() < unlockedUntil) enterEdit(); else askPassword(); });
  $('#edit-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { pending = null; unlockForm.reset(); });
  unlockForm.addEventListener('submit', async e => {
    e.preventDefault();
    const password = unlockForm.password.value;
    if (!password) return formError(unlockForm, 'Enter your password.', 'password');
    formError(unlockForm, '');
    busy(unlockForm, true);
    try {
      const r = await api('edit-unlock', { method: 'POST', auth: true, body: { password } });
      idleMs = (r.idleMin || 15) * 60000;
      unlockedUntil = Date.now() + idleMs;
      const redo = pending;
      pending = null;
      dialog.close();
      enterEdit();
      if (redo && redo.notes) saveNotes(redo.notes);
      else if (redo && redo.road) saveRoad(redo.road);
      else if (redo) saveText(redo.key, redo.text);
    } catch (err) {
      if (err.status === 401) { dialog.close(); signedOut(err.message); }
      else if (err.code === 'denied') { dialog.close(); toast(err.message, 'bad'); }
      else formError(unlockForm, err.message, err.code === 'bad_password' ? 'password' : null);
    } finally { busy(unlockForm, false); }
  });
  function enterEdit() {
    if (editing) return;
    editing = true;
    document.body.classList.add('editing');
    bar.hidden = false;
    $('#edit-more-list').replaceChildren(...Object.keys(TEXT).map(k => el('div', {}, el('dt', { text: TEXT_WHERE[k] || k }), keyed('dd', k))));
    $('#edit-more').hidden = false;
    $('#notes-edit').hidden = false;
    $('#road-edit').hidden = false;
    $('#roadmap').hidden = false;
    applyTexts();
    editControls();
  }
  function exitEdit(save) {
    if (!editing) return;
    stopEdit(save);
    editing = false;
    document.body.classList.remove('editing');
    bar.hidden = true;
    hideChip();
    $('#edit-more').hidden = true;
    $('#notes-edit').hidden = true;
    $('#road-edit').hidden = true;
    if (notesDialog.open) notesDialog.close();
    if (roadDialog.open) roadDialog.close();
    renderRoad();
    $('#edit-more-list').replaceChildren();
    editControls();
  }
  $('#edit-done').addEventListener('click', () => exitEdit(true));
  function editableAt(e) {
    const hit = e.target.closest('[data-edit]');
    if (hit) return hit;
    const control = e.target.closest('button, a, summary, label');
    return !control ? null : $$('[data-edit]', control).find(n => {
      const r = n.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    }) || null;
  }
  function startEdit(n, x, y) {
    stopEdit(true);
    active = n;
    before = n.textContent;
    try { n.contentEditable = 'plaintext-only'; } catch {   }
    if (n.contentEditable !== 'plaintext-only') n.contentEditable = 'true';
    n.classList.add('editing-now');
    n.focus({ preventScroll: true });
    let range = null;
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (p && n.contains(p.offsetNode)) { range = document.createRange(); range.setStart(p.offsetNode, p.offset); range.collapse(true); }
    } else if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      if (r && n.contains(r.startContainer)) { range = r; range.collapse(true); }
    }
    if (!range) { range = document.createRange(); range.selectNodeContents(n); }
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    if (has(OVR, n.dataset.edit)) showChip(n); else hideChip();
  }
  function stopEdit(save) {
    const n = active;
    if (!n) return;
    active = null;
    const key = n.dataset.edit, text = n.textContent.replace(/\s+/g, ' ').trim();
    n.removeAttribute('contenteditable');
    n.classList.remove('editing-now');
    if (document.activeElement === n) n.blur();
    hideChip();
    const changed = save && key && text !== before;
    n.textContent = changed && text ? text : before;
    if (n.classList.contains('glitch')) n.dataset.text = n.textContent;
    if (changed) saveText(key, text === source(key) ? '' : text);
  }
  async function saveText(key, text) {
    try {
      const r = await api('content', { method: 'POST', auth: true, body: { key, text } });
      if (r.text) OVR[key] = r.text; else delete OVR[key];
      cacheTexts();
      unlockedUntil = Date.now() + idleMs;
      toast(r.text ? 'Saved.' : 'Back to the site\'s own text.', 'good');
    } catch (err) {
      if (err.status === 401) signedOut(err.message);
      else if (err.code === 'locked') { unlockedUntil = 0; askPassword(); pending = { key, text }; }
      else toast(err.message, 'bad');
    }
    applyTexts();
  }
  const notesDialog = $('#notes-dialog'), notesBody = $('#notes-body');
  let draft = [];
  const blankRelease = () => ({ version: '', date: '', title: '', changes: [{ kind: 'app', text: '' }] });
  function input(value, props, onInput) {
    const i = el('input', props);
    i.value = value || '';
    i.addEventListener('input', () => onInput(i.value));
    return i;
  }
  function drawNotes() {
    notesBody.replaceChildren(...draft.map((r, ri) => {
      const lines = el('div', { class: 'ne-lines' }, ...r.changes.map((c, ci) => {
        const kind = el('select', { 'aria-label': 'Part' }, el('option', { value: 'app', text: 'App' }), el('option', { value: 'mod', text: 'Mod' }));
        kind.value = c.kind === 'mod' ? 'mod' : 'app';
        kind.addEventListener('change', () => { c.kind = kind.value; });
        const drop = el('button', { class: 'ne-x', type: 'button', title: 'Remove this line', text: '×' });
        drop.addEventListener('click', () => { r.changes.splice(ci, 1); drawNotes(); });
        return el('div', { class: 'ne-line' }, kind, input(c.text, { maxlength: '400', placeholder: 'What changed, for players', 'aria-label': 'Line' }, v => { c.text = v; }), drop);
      }));
      const addLine = el('button', { class: 'btn btn-small btn-ghost', type: 'button', text: 'Add line' });
      addLine.addEventListener('click', () => { r.changes.push({ kind: 'app', text: '' }); drawNotes(); });
      const dropRelease = el('button', { class: 'btn btn-small btn-ghost', type: 'button', text: 'Remove release' });
      dropRelease.addEventListener('click', () => { draft.splice(ri, 1); drawNotes(); });
      return el('fieldset', { class: 'ne-release' },
        el('div', { class: 'ne-head' },
          input(r.version, { maxlength: '20', placeholder: 'Version', 'aria-label': 'Version', class: 'ne-ver' }, v => { r.version = v; }),
          input(r.date, { type: 'date', 'aria-label': 'Release date (empty: hidden)', title: 'Empty keeps the release hidden' }, v => { r.date = v; }),
          input(r.title, { maxlength: '80', placeholder: 'Title', 'aria-label': 'Title', class: 'ne-title' }, v => { r.title = v; })),
        lines, el('div', { class: 'ne-actions' }, addLine, dropRelease));
    }));
  }
  function openNotes() {
    draft = JSON.parse(JSON.stringify(allNotes())).map(r => ({ version: r.version || '', date: r.date || '', title: r.title || '', changes: (r.changes || []).map(c => ({ kind: c.kind, text: c.text || '' })) }));
    $('#notes-hint').textContent = NOTES ? 'Changes show on the site and in the app once saved. A release without a date stays hidden.'
      : 'The server has no patch notes yet: these are the site\'s published copy. Saving puts them on the server, for the site and the app.';
    formError($('#f-notes'), '');
    drawNotes();
    if (!notesDialog.open) notesDialog.showModal();
  }
  async function saveNotes(entries) {
    const form = $('#f-notes');
    formError(form, '');
    busy(form, true);
    try {
      await api('changelog', { method: 'POST', auth: true, body: { entries }, timeout: 20000 });
      NOTES = entries;
      unlockedUntil = Date.now() + idleMs;
      notesDialog.close();
      renderNotes();
      toast('Patch notes saved.', 'good');
    } catch (err) {
      if (err.status === 401) { notesDialog.close(); signedOut(err.message); }
      else if (err.code === 'locked') { unlockedUntil = 0; askPassword(); pending = { notes: entries }; }
      else formError(form, err.message);
    } finally { busy(form, false); }
  }
  $('#notes-edit').addEventListener('click', openNotes);
  $('#notes-add').addEventListener('click', () => { draft.unshift(blankRelease()); drawNotes(); });
  $('#notes-cancel').addEventListener('click', () => notesDialog.close());
  $('#notes-save').addEventListener('click', e => {
    e.preventDefault();
    const entries = draft.map(r => ({ version: r.version.trim(), date: r.date, title: r.title.trim(), changes: r.changes.filter(c => c.text.trim()).map(c => ({ kind: c.kind, text: c.text.trim() })) }));
    saveNotes(entries);
  });
  const roadDialog = $('#road-dialog'), roadBody = $('#road-body');
  let roadDraft = [];
  const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  function drawRoad() {
    roadBody.replaceChildren(...roadDraft.map((r, ri) => {
      const status = el('select', { 'aria-label': 'Status' }, ...Object.keys(ROAD_STATUS).map(k => el('option', { value: k, text: ROAD_STATUS[k] })));
      status.value = ROAD_STATUS[r.status] ? r.status : 'planned';
      status.addEventListener('change', () => { r.status = status.value; });
      const summary = el('textarea', { maxlength: '300', rows: '2', placeholder: 'Summary: one or two sentences shown on the card', 'aria-label': 'Summary' });
      summary.value = r.summary || '';
      summary.addEventListener('input', () => { r.summary = summary.value; });
      const body = el('textarea', { maxlength: '4000', rows: '7', placeholder: 'The article: paragraphs split by a blank line, shown under Read more', 'aria-label': 'Article text' });
      body.value = r.body || '';
      body.addEventListener('input', () => { r.body = body.value; });
      const up = el('button', { class: 'btn btn-small btn-ghost', type: 'button', text: 'Move up' });
      up.disabled = ri === 0;
      up.addEventListener('click', () => { roadDraft.splice(ri - 1, 0, roadDraft.splice(ri, 1)[0]); drawRoad(); });
      const drop = el('button', { class: 'btn btn-small btn-ghost', type: 'button', text: 'Remove article' });
      drop.addEventListener('click', () => { roadDraft.splice(ri, 1); drawRoad(); });
      return el('fieldset', { class: 'ne-release' },
        el('div', { class: 'ne-head' },
          input(r.title, { maxlength: '80', placeholder: 'Title', 'aria-label': 'Title', class: 'ne-title' }, v => { r.title = v; if (!r.idSet) r.id = slug(v); }),
          input(r.id, { maxlength: '40', placeholder: 'id (invasion)', 'aria-label': 'Id', class: 'ne-ver', title: 'Lower-case letters, digits and -; stays the same when the title changes' }, v => { r.id = v; r.idSet = true; }),
          status,
          input(r.date, { type: 'date', 'aria-label': 'Date (optional)' }, v => { r.date = v; })),
        summary, body, el('div', { class: 'ne-actions' }, up, drop));
    }));
  }
  function openRoad() {
    roadDraft = JSON.parse(JSON.stringify(allRoad())).map(r => ({ id: r.id || '', idSet: true, title: r.title || '', status: r.status || 'planned', date: r.date || '', summary: r.summary || '', body: r.body || '' }));
    $('#road-hint').textContent = ROAD ? 'Changes show on the site and in the app once saved.'
      : 'The server has no roadmap yet: this is the site\'s published copy. Saving puts it on the server, for the site and the app.';
    formError($('#f-road'), '');
    drawRoad();
    if (!roadDialog.open) roadDialog.showModal();
  }
  async function saveRoad(entries) {
    const form = $('#f-road');
    formError(form, '');
    busy(form, true);
    try {
      await api('roadmap', { method: 'POST', auth: true, body: { entries }, timeout: 20000 });
      ROAD = entries;
      unlockedUntil = Date.now() + idleMs;
      roadDialog.close();
      renderRoad();
      toast('Roadmap saved.', 'good');
    } catch (err) {
      if (err.status === 401) { roadDialog.close(); signedOut(err.message); }
      else if (err.code === 'locked') { unlockedUntil = 0; askPassword(); pending = { road: entries }; }
      else formError(form, err.message);
    } finally { busy(form, false); }
  }
  $('#road-edit').addEventListener('click', openRoad);
  $('#road-add').addEventListener('click', () => { roadDraft.unshift({ id: '', idSet: false, title: '', status: 'planned', date: '', summary: '', body: '' }); drawRoad(); });
  $('#road-cancel').addEventListener('click', () => roadDialog.close());
  $('#road-save').addEventListener('click', e => {
    e.preventDefault();
    const entries = roadDraft.map(r => ({ id: (r.id || slug(r.title)).trim(), title: r.title.trim(), status: r.status, date: r.date, summary: r.summary.trim(), body: r.body.trim() }));
    saveRoad(entries);
  });
  function showChip(n) {
    clearTimeout(chipTimer);
    chipTimer = 0;
    chipFor = n;
    chip.hidden = false;
    const r = n.getBoundingClientRect(), w = chip.offsetWidth, h = chip.offsetHeight;
    chip.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
    chip.style.top = (r.top - h - 6 < 4 ? r.bottom + 6 : r.top - h - 6) + 'px';
  }
  function hideChip() {
    clearTimeout(chipTimer);
    chipTimer = 0;
    chip.hidden = true;
    chipFor = null;
  }
  document.addEventListener('pointermove', e => {
    if (!editing || active || e.pointerType === 'touch') return;
    if (e.target.closest('#edit-reset')) { clearTimeout(chipTimer); chipTimer = 0; return; }
    const n = e.target.closest('[data-edit]');
    if (n && has(OVR, n.dataset.edit)) { if (n !== chipFor || chipTimer) showChip(n); }
    else if (chipFor && !chipTimer) chipTimer = setTimeout(hideChip, 500);
  });
  addEventListener('scroll', () => { if (chipFor && chipFor === active) showChip(active); else if (chipFor) hideChip(); }, { passive: true });
  chip.addEventListener('mousedown', e => e.preventDefault());
  chip.addEventListener('click', () => {
    const n = chipFor;
    if (!n) return;
    const key = n.dataset.edit;
    stopEdit(false);
    hideChip();
    saveText(key, '');
  });
  document.addEventListener('click', e => {
    if (!editing || e.target.closest('.edit-ui')) return;
    const n = editableAt(e);
    if (!n) return;
    if (n !== active && !e.altKey && n.closest('#top, #drawer')) return;
    e.preventDefault();
    e.stopPropagation();
    if (n !== active) startEdit(n, e.clientX, e.clientY);
  }, true);
  document.addEventListener('mousedown', e => {
    if (active && !active.contains(e.target) && !e.target.closest('.edit-ui') && editableAt(e) === active) e.preventDefault();
  }, true);
  document.addEventListener('submit', e => {
    if (editing && e.target !== unlockForm) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener('keydown', e => {
    if (!active || e.target !== active || e.isComposing) return;
    if (e.key === 'Enter') { e.preventDefault(); stopEdit(true); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stopEdit(false); }
    else if (e.key === ' ' && active.closest('button, summary, a')) {
      e.preventDefault();
      document.execCommand('insertText', false, ' ');
    }
  }, true);
  document.addEventListener('keyup', e => { if (active && e.target === active && e.key === ' ') e.preventDefault(); }, true);
  document.addEventListener('focusout', e => { if (active && e.target === active) stopEdit(true); }, true);
  document.addEventListener('paste', e => {
    if (!active || !active.contains(e.target)) return;
    e.preventDefault();
    document.execCommand('insertText', false, ((e.clipboardData && e.clipboardData.getData('text/plain')) || '').replace(/\s+/g, ' '));
  }, true);
  document.addEventListener('drop', e => { if (active && active.contains(e.target)) e.preventDefault(); }, true);
  document.addEventListener('input', e => {
    if (active && e.target === active && active.classList.contains('glitch')) active.dataset.text = active.textContent;
  }, true);
  renderNotes();
  loadNotes();
  renderRoad();
  loadRoad();
  show(location.hash.slice(1) || 'home', true);
  loadContent();
  restore();
  poll();
  setInterval(() => { if (!document.hidden) { poll(); showAge(); } }, STATUS_MS);
  loadRelease();
})();
