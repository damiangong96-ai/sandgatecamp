(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var WA = '34696972569', MAIL = 'info@sandgatecamp.com';
  var CAMP = { lat: 26.4916, lng: 27.6735 };
  root.classList.add('js');

  /* ---------- Sun times at Abu Monkar ---------- */
  var rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, J0 = 0.0009, ob = rad * 23.4397;
  function sunTimes(date) {
    var lw = rad * -CAMP.lng, phi = rad * CAMP.lat, days = date.valueOf() / dayMs - 0.5 + J1970 - J2000;
    var n = Math.round(days - J0 - lw / (2 * Math.PI)), ds = J0 + lw / (2 * Math.PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(ob) * Math.sin(L));
    var Jnoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    var a = J0 + (w + lw) / (2 * Math.PI) + n, Jset = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var f = function (j) { return new Date((j + 0.5 - J1970) * dayMs); };
    return { rise: f(Jnoon - (Jset - Jnoon)), set: f(Jset) };
  }
  var fmt;
  try { fmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Cairo' }); }
  catch (e) { fmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }); }
  var today = sunTimes(new Date()), tomorrow = sunTimes(new Date(Date.now() + dayMs));
  function fill(sel, v) { d.querySelectorAll(sel).forEach(function (n) { n.textContent = v; }); }
  fill('[data-sunrise]', fmt.format(today.rise)); fill('[data-sunset]', fmt.format(today.set));
  fill('[data-sunrise-tomorrow]', fmt.format(tomorrow.rise));
  function clock() { fill('[data-clock]', fmt.format(new Date())); }
  clock(); setInterval(clock, 20000);

  /* ---------- Broken images keep their tinted box ---------- */
  d.addEventListener('error', function (e) { if (e.target.tagName === 'IMG') e.target.style.opacity = 0; }, true);

  /* ---------- Odometer ---------- */
  function buildOdo(el, str) {
    el.innerHTML = '';
    String(str).split('').forEach(function (ch) {
      if (/\d/.test(ch)) {
        var dd = d.createElement('span'); dd.className = 'd';
        var s = d.createElement('span'); s.className = 's';
        for (var i = 0; i <= 9; i++) { var b = d.createElement('b'); b.textContent = i; s.appendChild(b); }
        dd.appendChild(s); el.appendChild(dd);
      } else { var x = d.createElement('span'); x.className = 'x'; x.textContent = ch; el.appendChild(x); }
    });
  }
  function setOdo(el, str) {
    var strips = el.querySelectorAll('.d .s'), digits = String(str).replace(/\D/g, '').split('');
    if (strips.length !== digits.length) { buildOdo(el, str); strips = el.querySelectorAll('.d .s'); }
    strips.forEach(function (s, i) { s.style.transform = 'translateY(-' + (parseInt(digits[i], 10) * 10) + '%)'; });
  }
  d.querySelectorAll('.odo[data-to]').forEach(function (el) { buildOdo(el, el.getAttribute('data-to')); el.setAttribute('aria-label', el.getAttribute('data-to')); });
  var oio = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      oio.unobserve(en.target);
      var el = en.target;
      setTimeout(function () { setOdo(el, el.getAttribute('data-to')); }, 120);
    });
  }, { threshold: 0.4 });
  d.querySelectorAll('.odo[data-to]').forEach(function (el) { oio.observe(el); });

  /* Countdown to sunset (or sunrise) at the camp */
  var cd = d.querySelector('[data-countdown]');
  if (cd) {
    var h = cd.querySelector('[data-h]'), m = cd.querySelector('[data-m]'), s = cd.querySelector('[data-s]'), lab = cd.querySelector('[data-target]');
    [h, m, s].forEach(function (el) { buildOdo(el, '00'); el.querySelectorAll('.s').forEach(function (x) { x.style.transitionDuration = '500ms'; }); });
    var tick = function () {
      var now = Date.now(), t = sunTimes(new Date());
      var target = t.set.valueOf() > now ? t.set : (t.rise.valueOf() > now ? t.rise : sunTimes(new Date(now + dayMs)).rise);
      var isSet = target === t.set;
      if (lab) lab.textContent = isSet ? 'Próximo atardecer en Abu Monkar' : 'Próximo amanecer en Abu Monkar';
      var diff = Math.max(0, Math.floor((target - now) / 1000));
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      setOdo(h, pad(Math.floor(diff / 3600))); setOdo(m, pad(Math.floor(diff % 3600 / 60))); setOdo(s, pad(diff % 60));
    };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- Load / page transitions ---------- */
  var veil = d.querySelector('.veil');
  function ready() { root.classList.add('ready'); d.querySelectorAll('[data-hero]').forEach(function (n) { n.classList.add('in'); }); }
  if (root.classList.contains('veil-in') && veil && !reduce) {
    veil.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 800, easing: 'cubic-bezier(0.77,0,0.175,1)', fill: 'forwards' })
      .finished.then(function () { root.classList.remove('veil-in'); veil.getAnimations().forEach(function (a) { a.cancel(); }); });
    setTimeout(ready, 300);
  } else { root.classList.remove('veil-in'); requestAnimationFrame(function () { requestAnimationFrame(ready); }); }
  d.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a || reduce || !veil || ev.metaKey || ev.ctrlKey || ev.shiftKey || a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (!/^[a-z0-9-]+\.html(#.*)?$/i.test(href)) return;
    if (href.indexOf('#') > -1 && href.split('#')[0] === (location.pathname.split('/').pop() || 'index.html')) return;
    ev.preventDefault();
    try { sessionStorage.setItem('sgc-veil', '1'); } catch (e) {}
    veil.style.visibility = 'visible';
    veil.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(0.77,0,0.175,1)', fill: 'forwards' })
      .finished.then(function () { location.href = href; });
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && veil) { veil.getAnimations().forEach(function (a) { a.cancel(); }); veil.style.visibility = 'hidden'; } });

  /* ---------- Navbar ---------- */
  var nav = d.querySelector('.nav'), wa = d.querySelector('.wa'), lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    if (nav) {
      var fixed = y > 160;
      nav.classList.toggle('fixed', fixed);
      nav.classList.toggle('hide', fixed && y > lastY && y > 400 && !d.body.classList.contains('menu-open'));
    }
    if (wa) wa.classList.toggle('show', y > 700);
    lastY = y;
  }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mega menu ---------- */
  var mega = d.querySelector('.mega'), opener = null;
  function setMenu(open) {
    if (!mega) return;
    mega.classList.toggle('open', open);
    mega.setAttribute('aria-hidden', open ? 'false' : 'true');
    d.body.classList.toggle('menu-open', open);
    d.body.style.overflow = open ? 'hidden' : '';
    var links = mega.querySelectorAll('.mega-links a.big');
    links.forEach(function (l, i) { l.style.transitionDelay = open ? (200 + i * 55) + 'ms' : '0ms'; });
    if (open) { var c = mega.querySelector('.mega-close'); setTimeout(function () { c && c.focus(); }, 50); }
    else if (opener) opener.focus();
  }
  d.querySelectorAll('[data-menu]').forEach(function (b) { b.addEventListener('click', function () { opener = b; setMenu(true); }); });
  d.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mega && mega.classList.contains('open')) setMenu(false); });

  /* ---------- Reveals ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  d.querySelectorAll('.rv, [data-lines]:not([data-hero])').forEach(function (n) { io.observe(n); });
  /* clip-path hides an element from IntersectionObserver: watch its parent */
  var pio = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.querySelectorAll(':scope > .rimg').forEach(function (c, i) { setTimeout(function () { c.classList.add('in'); }, i * 90); });
      pio.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  var parents = new Set();
  d.querySelectorAll('.rimg').forEach(function (n) { parents.add(n.parentElement); });
  parents.forEach(function (p) { pio.observe(p); });
  d.querySelectorAll('[data-stagger]').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.classList.add('rv'); c.style.transitionDelay = (i * 70) + 'ms'; io.observe(c); });
  });

  /* ---------- Rotating words ---------- */
  d.querySelectorAll('[data-rotate]').forEach(function (r) {
    var items = r.querySelectorAll('span'), i = 0, h = function () { return r.getBoundingClientRect().height; };
    if (items.length < 2 || reduce) return;
    setInterval(function () {
      i = (i + 1) % items.length;
      items.forEach(function (s) { s.style.transform = 'translateY(-' + (i * 100) + '%)'; });
    }, 2600);
  });

  /* ---------- Scroll-driven pieces (one rAF loop) ---------- */
  var track = d.querySelector('.rooms-track'), infos = d.querySelectorAll('.rooms-sticky .room-info'), pics = d.querySelectorAll('.rooms-sticky .pics .media');
  var cnt = d.querySelector('.rooms-count'), cntNum = cnt && cnt.querySelector('b');
  var words = [], stmt = d.querySelector('.service .statement');
  if (stmt) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(d.createTextNode(p));
            else { var s = d.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); }
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(stmt); words = stmt.querySelectorAll('.w');
    if (reduce) words.forEach(function (w) { w.classList.add('on'); });
  }
  var cols = d.querySelectorAll('.pgal .col');
  var lastRoom = -1, ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    if (track && infos.length && window.innerWidth >= 1000) {
      var r = track.getBoundingClientRect(), total = r.height - vh;
      var p = Math.min(1, Math.max(0, -r.top / total));
      var idx = Math.min(infos.length - 1, Math.floor(p * infos.length * 0.999));
      if (idx !== lastRoom) {
        infos.forEach(function (n, i) { n.classList.toggle('on', i === idx); });
        pics.forEach(function (n, i) { n.classList.toggle('on', i === idx); n.classList.toggle('past', i < idx); });
        if (cntNum) cntNum.textContent = ('0' + (idx + 1)).slice(-2);
        lastRoom = idx;
      }
      if (cnt) cnt.style.setProperty('--p', p.toFixed(3));
    }
    if (words.length && !reduce) {
      var sr = stmt.getBoundingClientRect();
      var q = Math.min(1, Math.max(0, (vh * 0.85 - sr.top) / (sr.height + vh * 0.35)));
      var n = Math.round(q * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    }
    if (cols.length && !reduce && window.innerWidth >= 900) {
      var g = cols[0].parentElement.getBoundingClientRect();
      var k = (vh - g.top) / (vh + g.height);
      cols.forEach(function (c, ci) {
        var dir = ci === 1 ? -1 : 1;
        c.style.transform = 'translate3d(0,' + ((k - 0.5) * 160 * dir).toFixed(1) + 'px,0)';
      });
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req); req();

  /* ---------- Experience steps ---------- */
  var steps = d.querySelectorAll('.exp .step'), expImgs = d.querySelectorAll('.exp .r .media');
  if (steps.length) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = Array.prototype.indexOf.call(steps, en.target);
        steps.forEach(function (s, j) { s.classList.toggle('on', j === i); });
        expImgs.forEach(function (m, j) { m.classList.toggle('on', j === i); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { sio.observe(s); });
  }

  /* ---------- Reasons slider ---------- */
  d.querySelectorAll('.why').forEach(function (w) {
    var items = w.querySelectorAll('.why-item'), i = 0, timer, out = w.querySelector('.why-dots');
    var go = function (k) {
      i = (k + items.length) % items.length;
      items.forEach(function (n, j) { n.classList.toggle('on', j === i); n.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
      if (out) out.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + items.length).slice(-2);
    };
    var restart = function () { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(i + 1); }, 6500); };
    w.querySelector('[data-prev]').addEventListener('click', function () { go(i - 1); restart(); });
    w.querySelector('[data-next]').addEventListener('click', function () { go(i + 1); restart(); });
    d.addEventListener('visibilitychange', function () { if (d.hidden) clearInterval(timer); else restart(); });
    go(0); restart();
  });

  /* ---------- Enquiry forms → WhatsApp / email ---------- */
  function waLink(t) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t); }
  d.querySelectorAll('form[data-enquiry]').forEach(function (form) {
    var msg = form.querySelector('.f-msg');
    var build = function () {
      var lines = [form.getAttribute('data-enquiry')];
      form.querySelectorAll('[name]').forEach(function (el) {
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
        if (el.value) lines.push((el.getAttribute('data-label') || el.name) + ': ' + el.value);
      });
      return lines.join('\n');
    };
    var valid = function () {
      var bad = form.querySelector(':invalid');
      if (bad) { bad.focus(); if (msg) msg.textContent = 'Completa el campo: ' + (bad.getAttribute('data-label') || bad.name) + '.'; return false; }
      if (msg) msg.textContent = ''; return true;
    };
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!valid()) return;
      var a = d.createElement('a'); a.href = waLink(build()); a.target = '_blank'; a.rel = 'noopener'; d.body.appendChild(a); a.click(); a.remove();
      if (msg) msg.textContent = 'Se abrirá WhatsApp con tu mensaje listo para enviar. Si prefieres email, escríbenos a ' + MAIL + '.';
    });
  });

  /* ---------- Copy to clipboard ---------- */
  d.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var v = b.getAttribute('data-copy'), small = b.querySelector('small'), o = small && small.textContent;
      if (!navigator.clipboard) return;
      e.preventDefault();
      navigator.clipboard.writeText(v).then(function () { if (small) { small.textContent = 'Copiado'; setTimeout(function () { small.textContent = o; }, 1500); } }, function () {});
    });
  });

  var y = d.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
