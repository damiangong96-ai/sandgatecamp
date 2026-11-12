/* Sand Gate Camp — interactions */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var CAMP = { lat: 26.4916, lng: 27.6735 }; // Abu Monkar, 26°29'29.7"N 27°40'24.7"E
  var TZ = 'Africa/Cairo';
  var WA = '34696972569';
  var MAIL = 'info@sandgatecamp.com';
  var ES = (root.getAttribute('lang') || 'es').slice(0, 2) === 'es';
  var LOC = ES ? 'es-ES' : 'en-GB';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hide broken hotlinked images, gradient stays ---------- */
  d.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG') t.classList.add('failed');
  }, true);
  d.querySelectorAll('img').forEach(function (im) { if (im.complete && im.naturalWidth === 0) im.classList.add('failed'); });

  /* ---------- Upgrade hotlinked images to full size when available ---------- */
  d.querySelectorAll('img[data-full]').forEach(function (im) {
    var big = new Image();
    big.onload = function () { im.src = big.src; im.classList.remove('failed'); };
    big.src = im.getAttribute('data-full');
  });

  /* ---------- Sun maths (SunCalc formulation) ---------- */
  var rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, J0 = 0.0009, e = rad * 23.4397;
  function toDays(date) { return date.valueOf() / dayMs - 0.5 + J1970 - J2000; }
  function fromJ(j) { return new Date((j + 0.5 - J1970) * dayMs); }
  function sunTimes(date, lat, lng) {
    var lw = rad * -lng, phi = rad * lat, days = toDays(date);
    var n = Math.round(days - J0 - lw / (2 * Math.PI));
    var ds = J0 + lw / (2 * Math.PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    var L = M + C + rad * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(e) * Math.sin(L));
    var Jnoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    var a = J0 + (w + lw) / (2 * Math.PI) + n;
    var Jset = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    return { rise: fromJ(Jnoon - (Jset - Jnoon)), noon: fromJ(Jnoon), set: fromJ(Jset) };
  }
  var fmt;
  try { fmt = new Intl.DateTimeFormat(LOC, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }); }
  catch (err) { fmt = new Intl.DateTimeFormat(LOC, { hour: '2-digit', minute: '2-digit', hour12: false }); }
  function hm(date) { return fmt.format(date); }
  function phase(now, s) {
    var t = now.valueOf(), r = s.rise.valueOf(), st = s.set.valueOf(), m = 60000;
    if (t < r - 40 * m || t > st + 50 * m) return ES ? 'Noche estrellada' : 'Stars out';
    if (t < r + 40 * m) return ES ? 'Primera luz' : 'First light';
    if (t > st) return ES ? 'Anochecer' : 'Dusk';
    if (t > st - 70 * m) return ES ? 'Hora dorada' : 'Golden hour';
    var h = parseInt(hm(now).slice(0, 2), 10);
    if (h >= 12 && h < 15) return ES ? 'Horas de sombra' : 'Shade hours';
    if (h < 12) return ES ? 'Mañana' : 'Morning';
    return ES ? 'Tarde' : 'Afternoon';
  }
  var today = sunTimes(new Date(), CAMP.lat, CAMP.lng);
  var tomorrow = sunTimes(new Date(Date.now() + dayMs), CAMP.lat, CAMP.lng);
  function fill(sel, val) { d.querySelectorAll(sel).forEach(function (n) { n.textContent = val; }); }
  fill('[data-sunrise]', hm(today.rise));
  fill('[data-sunset]', hm(today.set));
  fill('[data-noon]', hm(today.noon));
  fill('[data-sunrise-tomorrow]', hm(tomorrow.rise));

  function tick() {
    var now = new Date();
    fill('[data-clock]', hm(now));
    fill('[data-phase]', phase(now, today));
    var dot = d.querySelector('.clock .sd');
    if (dot) {
      var p = (now - today.rise) / (today.set - today.rise);
      var up = p >= 0 && p <= 1;
      p = Math.max(0, Math.min(1, p));
      var x = 2 + p * 22, y = 12 - Math.sin(p * Math.PI) * 9;
      dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', up ? y.toFixed(1) : 12);
      dot.style.opacity = up ? 1 : .45;
    }
  }
  tick(); setInterval(tick, 20000);

  /* ---------- Loader (home, once per session) + page transitions ---------- */
  var veil = d.querySelector('.veil');
  function ready() { root.classList.add('ready'); revealHero(); }
  function revealHero() { d.querySelectorAll('.hero-lines').forEach(function (n) { n.classList.add('in'); }); }

  var loader = d.querySelector('.loader');
  if (root.classList.contains('show-loader') && loader && !reduce) {
    var fillEl = loader.querySelector('.fill'), bar = loader.querySelector('.bar'), pct = loader.querySelector('.pct b');
    var start = performance.now(), dur = 1700;
    (function step(t) {
      var k = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      var v = Math.round(eased * 100);
      fillEl.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      bar.style.left = v + '%';
      pct.textContent = v;
      if (k < 1) requestAnimationFrame(step);
      else {
        loader.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 900, easing: 'cubic-bezier(0.77,0,0.175,1)', fill: 'forwards' })
          .finished.then(function () { root.classList.remove('show-loader'); });
        setTimeout(ready, 380);
      }
    })(start);
  } else {
    root.classList.remove('show-loader');
    if (root.classList.contains('veil-in') && veil && !reduce) {
      requestAnimationFrame(function () {
        veil.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 760, easing: 'cubic-bezier(0.77,0,0.175,1)', fill: 'forwards' })
          .finished.then(function () { root.classList.remove('veil-in'); veil.getAnimations().forEach(function (a) { a.cancel(); }); });
        setTimeout(ready, 260);
      });
    } else { root.classList.remove('veil-in'); requestAnimationFrame(ready); }
  }
  try { sessionStorage.setItem('sg-visited', '1'); } catch (err) {}

  d.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a || reduce || !veil) return;
    var href = a.getAttribute('href');
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    var isFile = /^(\.\.\/|en\/)?[a-z0-9-]+\.html(#.*)?$/i.test(href);
    var isPath = /^\/(?!\/)[a-z0-9\-\/]*(#.*)?$/i.test(href);
    if (!isFile && !isPath) return;
    if (href.indexOf('#') > -1) {
      var base = href.split('#')[0];
      if (!base || base === location.pathname || base === location.pathname.split('/').pop()) return;
    }
    ev.preventDefault();
    veil.style.visibility = 'visible';
    try { sessionStorage.setItem('sg-veil', '1'); } catch (err) {}
    veil.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 620, easing: 'cubic-bezier(0.77,0,0.175,1)', fill: 'forwards' })
      .finished.then(function () { location.href = href; });
  });
  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted && veil) { veil.getAnimations().forEach(function (a) { a.cancel(); }); root.classList.remove('veil-in'); }
  });

  /* ---------- Header state ---------- */
  var header = d.querySelector('.header'), wa = d.querySelector('.wa');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 40);
    if (wa) wa.classList.toggle('show', y > 600);
  }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* Dropdowns: touch/keyboard toggle */
  d.querySelectorAll('.nav-item.has-dd > .nav-link').forEach(function (btn) {
    btn.addEventListener('click', function (ev) {
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      var item = btn.parentElement;
      if (!item.classList.contains('open')) { ev.preventDefault(); item.classList.add('open'); }
    });
  });
  d.addEventListener('click', function (ev) {
    d.querySelectorAll('.nav-item.open').forEach(function (n) { if (!n.contains(ev.target)) n.classList.remove('open'); });
  });

  /* Mobile sheet */
  var sheet = d.querySelector('.sheet');
  function setSheet(open) {
    if (!sheet) return;
    sheet.classList.toggle('open', open);
    d.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      sheet.querySelectorAll('nav a.big, nav .sub').forEach(function (n, i) { n.style.transitionDelay = (120 + i * 40) + 'ms'; });
      var c = sheet.querySelector('.sheet-close'); c && c.focus();
    } else {
      sheet.querySelectorAll('nav a.big, nav .sub').forEach(function (n) { n.style.transitionDelay = '0ms'; });
    }
  }
  d.querySelectorAll('[data-open-menu]').forEach(function (b) { b.addEventListener('click', function () { setSheet(true); }); });
  d.querySelectorAll('[data-close-menu]').forEach(function (b) { b.addEventListener('click', function () { setSheet(false); }); });
  d.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') setSheet(false); });

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  d.querySelectorAll('.rv, .lines:not(.hero-lines)').forEach(function (n) { io.observe(n); });
  /* clip-path hides the element from IntersectionObserver, so watch its parent */
  var cio2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.querySelectorAll(':scope > .rv-img').forEach(function (c) { c.classList.add('in'); });
      cio2.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  d.querySelectorAll('.rv-img').forEach(function (n) { cio2.observe(n.parentElement); });
  /* stagger siblings */
  d.querySelectorAll('[data-stagger]').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.classList.add('rv'); c.style.transitionDelay = (i * 70) + 'ms'; io.observe(c); });
  });

  /* ---------- Statement word reveal (scrubbed) ---------- */
  var st = d.querySelector('.statement[data-words]');
  if (st) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(d.createTextNode(part));
            else { var s = d.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !c.classList.contains('chip')) walk(c);
        else if (c.nodeType === 1) c.classList.add('w');
      });
    };
    walk(st);
    var words = st.querySelectorAll('.w');
    var upd = function () {
      var r = st.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh * 0.86 - r.top) / (r.height + vh * 0.32);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    };
    if (reduce) words.forEach(function (w) { w.classList.add('on'); });
    else { upd(); window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); }
  }

  /* ---------- Count up ---------- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      cio.unobserve(en.target);
      var el = en.target, to = parseFloat(el.getAttribute('data-count')), pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
      if (reduce) { el.textContent = pre + to + suf; return; }
      var s = performance.now(), dur = 1400;
      (function f(t) { var k = Math.min(1, (t - s) / dur), v = Math.round((1 - Math.pow(1 - k, 4)) * to); el.textContent = pre + v + suf; if (k < 1) requestAnimationFrame(f); })(s);
    });
  }, { threshold: 0.5 });
  d.querySelectorAll('[data-count]').forEach(function (n) { cio.observe(n); });

  /* ---------- Sun arc timeline ---------- */
  var arc = d.querySelector('#arcPath');
  if (arc) {
    var len = arc.getTotalLength();
    var sun = d.querySelector('#arcSun');
    var cards = d.querySelectorAll('.tcard[data-p]');
    var pts = d.querySelectorAll('[data-arc-dot]');
    pts.forEach(function (c) {
      var p = parseFloat(c.getAttribute('data-arc-dot')), pt = arc.getPointAtLength(len * p);
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y);
      var lbl = c.nextElementSibling;
      if (lbl) { lbl.setAttribute('x', pt.x + (p < .5 ? -12 : 12)); lbl.setAttribute('y', pt.y + 4); lbl.setAttribute('text-anchor', p < .5 ? 'end' : 'start'); }
    });
    var moveSun = function (p) { var pt = arc.getPointAtLength(len * p); sun.style.transform = 'translate(' + pt.x + 'px,' + pt.y + 'px)'; };
    moveSun(0);
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          cards.forEach(function (c) { c.classList.remove('active'); });
          en.target.classList.add('active');
          moveSun(parseFloat(en.target.getAttribute('data-p')));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    cards.forEach(function (c) { tio.observe(c); });
  }

  /* ---------- Accordion ---------- */
  d.querySelectorAll('.acc').forEach(function (acc) {
    acc.querySelectorAll('.acc-head').forEach(function (h) {
      h.addEventListener('click', function () {
        var item = h.closest('.acc-item'), was = item.classList.contains('open');
        acc.querySelectorAll('.acc-item').forEach(function (i) { i.classList.remove('open'); i.querySelector('.acc-head').setAttribute('aria-expanded', 'false'); });
        if (!was) { item.classList.add('open'); h.setAttribute('aria-expanded', 'true'); }
      });
    });
  });

  /* ---------- Reasons carousel ---------- */
  d.querySelectorAll('.quotes').forEach(function (q) {
    var items = q.querySelectorAll('.quote'), dots = q.querySelector('.dots'), i = 0, timer;
    items.forEach(function (_, k) {
      var b = d.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', (ES ? 'Mostrar motivo ' : 'Show reason ') + (k + 1));
      b.addEventListener('click', function () { go(k); restart(); }); dots.appendChild(b);
    });
    function go(k) {
      i = (k + items.length) % items.length;
      items.forEach(function (n, j) { n.classList.toggle('on', j === i); n.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
      dots.querySelectorAll('button').forEach(function (b, j) { b.setAttribute('aria-current', j === i ? 'true' : 'false'); });
    }
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(i + 1); }, 6500); }
    q.addEventListener('mouseenter', function () { clearInterval(timer); });
    q.addEventListener('mouseleave', restart);
    d.addEventListener('visibilitychange', function () { if (d.hidden) clearInterval(timer); else restart(); });
    go(0); restart();
  });

  /* ---------- Helpers: WhatsApp / email ---------- */
  function waLink(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }
  function mailLink(subject, body) { return 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body); }

  /* Quick enquiry (hero) */
  var quick = d.querySelector('form.quick');
  if (quick) {
    quick.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = new FormData(quick);
      var msg = 'Hello Sand Gate Camp, I would like a quote.\n' +
        'Expedition: ' + f.get('trip') + '\nMonth: ' + f.get('month') + '\nTravellers: ' + f.get('pax') + '\nTravel style: ' + f.get('style');
      window.open(waLink(msg), '_blank', 'noopener');
    });
    var mSel = quick.querySelector('select[name="month"]');
    if (mSel) {
      var now = new Date(), opts = '';
      for (var k = 1; k <= 14; k++) {
        var dt = new Date(now.getFullYear(), now.getMonth() + k, 1);
        var label = dt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        opts += '<option>' + label + '</option>';
      }
      mSel.innerHTML = '<option>Flexible dates</option>' + opts;
    }
  }

  /* ---------- Planner calendar ---------- */
  var planner = d.querySelector('.planner');
  if (planner) {
    var grid = planner.querySelector('.cal-grid'), title = planner.querySelector('.cal-top h3');
    var prev = planner.querySelector('[data-prev]'), next = planner.querySelector('[data-next]');
    var tripSel = planner.querySelector('#plan-trip'), paxSel = planner.querySelector('#plan-pax');
    var out = { arrive: planner.querySelector('[data-arrive]'), depart: planner.querySelector('[data-depart]'), nights: planner.querySelector('[data-nights]'), moon: planner.querySelector('[data-moon]') };
    var base = new Date(); base.setHours(0, 0, 0, 0);
    var minDate = new Date(base.valueOf() + 21 * dayMs); // allow 3 weeks lead time
    var view = new Date(minDate.getFullYear(), minDate.getMonth() + (minDate.getDate() > 20 ? 1 : 0), 1);
    var arrive = null;
    var tripDays = function () { return parseInt(tripSel.selectedOptions[0].getAttribute('data-days'), 10) || 11; };
    var df = function (dt) { return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); };
    var isFull = function (dt) {
      var jd = dt.valueOf() / dayMs + 2440587.5 + 0.5;
      var age = ((jd - 2451550.1) % 29.530588853 + 29.530588853) % 29.530588853;
      return Math.abs(age - 14.765) < 0.5;
    };
    var render = function () {
      title.textContent = view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      prev.disabled = view <= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      next.disabled = view >= new Date(base.getFullYear(), base.getMonth() + 18, 1);
      var html = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (x) { return '<div class="dow" aria-hidden="true">' + x + '</div>'; }).join('');
      var first = (view.getDay() + 6) % 7, dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (var b = 0; b < first; b++) html += '<div></div>';
      var end = arrive ? new Date(arrive.valueOf() + (tripDays() - 1) * dayMs) : null;
      var moonDay = null;
      for (var day = 1; day <= dim; day++) {
        var dt = new Date(view.getFullYear(), view.getMonth(), day), cls = [];
        if (isFull(dt)) { cls.push('moon'); if (!moonDay) moonDay = day; }
        if (arrive) {
          if (dt.valueOf() === arrive.valueOf()) cls.push('start');
          if (dt.valueOf() === end.valueOf()) cls.push('end');
          if (dt > arrive && dt < end) cls.push('in');
        }
        html += '<button type="button" class="' + cls.join(' ') + '" data-d="' + dt.valueOf() + '"' + (dt < minDate ? ' disabled' : '') +
          ' aria-label="' + dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '"><span>' + day + '</span></button>';
      }
      grid.innerHTML = html;
      if (out.moon) out.moon.textContent = moonDay ? 'Full moon on the ' + moonDay + ordinal(moonDay) + ' — the dunes glow either side of it; the stars are best away from it.' : 'Pick your first day in Cairo. We plan the rest around it.';
      summary();
    };
    var ordinal = function (n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; };
    var summary = function () {
      var days = tripDays();
      out.nights.textContent = days + ' days · ' + (days - 1) + ' nights';
      if (arrive) {
        out.arrive.textContent = df(arrive);
        out.depart.textContent = df(new Date(arrive.valueOf() + (days - 1) * dayMs));
      } else { out.arrive.textContent = 'Choose a date'; out.depart.textContent = '—'; }
    };
    grid.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-d]'); if (!b || b.disabled) return;
      arrive = new Date(parseInt(b.getAttribute('data-d'), 10)); render();
    });
    prev.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
    next.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
    tripSel.addEventListener('change', render);
    var text = function () {
      var days = tripDays();
      return 'Hello Sand Gate Camp, I would like to request this expedition.\n' +
        'Expedition: ' + tripSel.value + '\nArrival in Cairo: ' + (arrive ? df(arrive) : 'flexible') +
        '\nDeparture: ' + (arrive ? df(new Date(arrive.valueOf() + (days - 1) * dayMs)) : 'flexible') + '\nTravellers: ' + paxSel.value;
    };
    planner.querySelector('[data-send-wa]').addEventListener('click', function () { window.open(waLink(text()), '_blank', 'noopener'); });
    planner.querySelector('[data-send-mail]').addEventListener('click', function () { location.href = mailLink('Expedition request — ' + tripSel.value, text()); });
    var pre = planner.getAttribute('data-trip');
    if (pre) Array.prototype.forEach.call(tripSel.options, function (o) { if (o.value === pre) o.selected = true; });
    render();
  }

  /* ---------- Generic enquiry forms (contact / agencies) ---------- */
  d.querySelectorAll('form[data-enquiry]').forEach(function (form) {
    var msg = form.querySelector('.form-msg');
    var build = function () {
      var lines = [form.getAttribute('data-enquiry')];
      form.querySelectorAll('[name]').forEach(function (el) {
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
        if (!el.value) return;
        var lab = el.getAttribute('data-label') || el.name;
        lines.push(lab + ': ' + el.value);
      });
      return lines.join('\n');
    };
    var valid = function () {
      var bad = form.querySelector(':invalid');
      if (bad) { bad.focus(); if (msg) msg.textContent = (ES ? 'Completa el campo: ' : 'Please complete: ') + (bad.getAttribute('data-label') || bad.name) + '.'; return false; }
      if (msg) msg.textContent = '';
      return true;
    };
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!valid()) return;
      location.href = mailLink(form.getAttribute('data-subject') || 'Enquiry', build());
      if (msg) msg.textContent = (ES ? 'Se abrirá tu aplicación de correo con el mensaje listo para enviar a ' : 'Your email app should open with the message ready to send to ') + MAIL + '.';
    });
    var w = form.querySelector('[data-wa]');
    if (w) w.addEventListener('click', function () { if (!valid()) return; window.open(waLink(build()), '_blank', 'noopener'); });
  });

  /* ---------- Itinerary day nav ---------- */
  var inav = d.querySelectorAll('.itin-nav a');
  if (inav.length) {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) inav.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    d.querySelectorAll('.dcard[id]').forEach(function (c) { dio.observe(c); });
  }

  /* ---------- Video facade ---------- */
  d.querySelectorAll('[data-yt]').forEach(function (v) {
    v.addEventListener('click', function (ev) {
      ev.preventDefault();
      var id = v.getAttribute('data-yt');
      v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="Sand Gate Camp" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    });
  });

  /* ---------- Copy buttons ---------- */
  d.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy'), lab = b.querySelector('em');
      var done = function () { if (lab) { var o = lab.textContent; lab.textContent = ES ? 'Copiado' : 'Copied'; setTimeout(function () { lab.textContent = o; }, 1600); } };
      if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, function () {});
    });
  });

  var y = d.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
