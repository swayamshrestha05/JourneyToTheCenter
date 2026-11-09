/* Journey to the Center of the Earth: trail, depth gauge, waypoints, exhibits and living scenes. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var map = document.getElementById("map");
  var hero = document.getElementById("top");
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceQuery.matches;
  var each = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };

  /* ---------------- collapsible facts ---------------- */

  each(".more:not(.formed-body)", function (m) { m.setAttribute("data-collapsed", ""); }); // the Himalaya section starts open

  function setOpen(id, open) {
    var region = document.getElementById(id);
    if (!region) return;
    if (open) region.removeAttribute("data-collapsed");
    else region.setAttribute("data-collapsed", "");
    each('[aria-controls="' + id + '"]', function (c) { c.setAttribute("aria-expanded", open ? "true" : "false"); });
    var label = document.querySelector('.read:not(.read-title)[aria-controls="' + id + '"] span');
    if (label) {
      if (!label.dataset.label) label.dataset.label = label.textContent;
      label.textContent = open ? "Show less" : label.dataset.label;
    }
  }
  function isOpen(id) {
    var region = document.getElementById(id);
    return region && !region.hasAttribute("data-collapsed");
  }

  each(".read", function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("aria-controls");
      setOpen(id, !isOpen(id));
    });
  });

  each(".sign", function (sign) {
    sign.addEventListener("click", function () {
      var id = sign.getAttribute("aria-controls");
      var open = !isOpen(id);
      setOpen(id, open);
      if (open) {
        var target = document.getElementById(id).closest(".facts-col") || document.getElementById(id);
        var r = target.getBoundingClientRect();
        if (r.top < 0 || r.top > window.innerHeight * 0.6) {
          target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        }
      }
    });
  });

  /* ---------------- summit waypoint sits on the peak ---------------- */

  // reduced motion: hold the summit flag still
  var heroRange = hero.querySelector(".range");
  if (reduced && heroRange && heroRange.pauseAnimations) heroRange.pauseAnimations();

  var peakSign = hero.querySelector(".sign-peak");
  var peakAnchor = hero.querySelector('[data-anchor="summit"]');

  function peakPoint() {
    var hr = hero.getBoundingClientRect();
    var ar = peakAnchor.getBoundingClientRect();
    return { x: ar.left + ar.width / 2 - hr.left, y: ar.top + ar.height / 2 - hr.top };
  }
  function placePeakSign() {
    var p = peakPoint();
    var dot = peakSign.querySelector(".sign-dot");
    var dotX = dot.offsetLeft + dot.offsetWidth / 2;
    var dotY = dot.offsetTop + dot.offsetHeight / 2;
    peakSign.style.left = (p.x - dotX) + "px";
    peakSign.style.top = (p.y - dotY) + "px";
    return p;
  }

  /* ---------------- trail geometry ---------------- */

  var svg = document.getElementById("trail");
  var pDots = document.getElementById("trail-dots");
  var pHalo = document.getElementById("trail-halo");
  var pMask = document.getElementById("trail-mask");
  var pGhost = document.getElementById("trail-ghost");
  var here = document.getElementById("here");
  var samples = [];
  var total = 0;

  function rel(el) {
    var mr = map.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return { left: r.left - mr.left, top: r.top - mr.top, width: r.width, height: r.height, bottom: r.bottom - mr.top };
  }
  function dotCenter(sign) {
    var r = rel(sign.querySelector(".sign-dot"));
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function catmull(points) {
    var d = "M" + points[0].x.toFixed(1) + " " + points[0].y.toFixed(1);
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      d += " C" + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + " " + (p1.y + (p2.y - p0.y) / 6).toFixed(1) +
        " " + (p2.x - (p3.x - p1.x) / 6).toFixed(1) + " " + (p2.y - (p3.y - p1.y) / 6).toFixed(1) +
        " " + p2.x.toFixed(1) + " " + p2.y.toFixed(1);
    }
    return d;
  }

  function buildTrail() {
    svg.setAttribute("height", 0); // never prop the page open while measuring
    var W = map.clientWidth, H = map.scrollHeight;
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    placePeakSign();
    var hr = rel(hero);
    var peak = peakPoint();
    peak = { x: peak.x + hr.left, y: peak.y + hr.top };

    var signs = Array.prototype.slice.call(map.querySelectorAll(".layer .sign"));
    var wpts = signs.map(dotCenter);
    var laneX = wpts[0].x;
    var summitSec = rel(document.getElementById("summit"));
    var wig = W > 999 ? 16 : 6;

    // down the sunlit face of Everest, then across into the trail lane
    var pts = [
      peak,
      { x: peak.x + 6, y: peak.y + (hr.bottom - peak.y) * 0.45 },
      { x: peak.x - (peak.x - laneX) * 0.6, y: hr.bottom - 24 },
      { x: laneX, y: summitSec.top + 80 },
      { x: laneX + wig, y: summitSec.top + summitSec.height * 0.5 },
      { x: laneX, y: summitSec.bottom - 30 }
    ];
    wpts.forEach(function (p, i) {
      if (i > 0) {
        var prev = wpts[i - 1];
        pts.push({ x: laneX + (i % 2 ? wig : -wig), y: prev.y + (p.y - prev.y) * 0.5 });
      }
      pts.push(p);
    });

    var d = catmull(pts);
    [pDots, pHalo, pMask, pGhost].forEach(function (p) { p.setAttribute("d", d); });
    total = pDots.getTotalLength();
    pMask.style.strokeDasharray = total + " " + total;

    samples = [];
    var maxY = -Infinity;
    for (var l = 0; l <= total; l += 6) {
      var pt = pDots.getPointAtLength(l);
      maxY = Math.max(maxY, pt.y);
      samples.push({ y: maxY, rx: pt.x, ry: pt.y, len: l });
    }
    update();
  }

  function sampleAtY(y) {
    var lo = 0, hi = samples.length - 1;
    if (y <= samples[0].y) return samples[0];
    if (y >= samples[hi].y) return samples[hi];
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (samples[mid].y < y) lo = mid + 1; else hi = mid;
    }
    return samples[lo];
  }

  /* ---------------- depth gauge ---------------- */

  var stops = Array.prototype.slice.call(document.querySelectorAll("[data-stop]"));
  var gMode = document.getElementById("g-mode");
  var gDepth = document.getElementById("g-depth");
  var gTemp = document.getElementById("g-temp");
  var gAt = document.getElementById("g-at");
  var gLayer = document.getElementById("g-layer");
  var gMark = document.getElementById("g-mark");
  var gCol = document.getElementById("g-col");
  var COL_KM = 5100; // the trail ends at the inner core boundary
  var gBody = document.getElementById("g-body");
  var gBands = gCol.querySelectorAll("i");
  var bandStops = ["crust", "upper-mantle", "lower-mantle", "outer-core"].map(function (id) { return document.getElementById(id); });
  var lastStop = null, lastReading = "", lastBands = "", gaugeKm = 0;
  var fmt = new Intl.NumberFormat("en-US");

  var gaugeSigns = Array.prototype.slice.call(document.querySelectorAll(".sign[data-km]"));

  // Depth keyframes in page coordinates: every trail sign (its dot reads exactly its own label)
  // and every stop's lower edge (its data-to boundary). Between keyframes the depth is interpolated.
  function depthKeys() {
    var y0 = window.scrollY, keys = [];
    gaugeSigns.forEach(function (s) {
      var r = s.querySelector(".sign-dot").getBoundingClientRect();
      var y = r.top + r.height / 2 + y0;
      // the summit sign sits above the reading line at scroll 0: pin it there so the count starts falling on the first scroll
      if (s.classList.contains("sign-peak")) y = Math.max(y, window.innerHeight * 0.55);
      keys.push([y, +s.dataset.km]);
    });
    // lower edges of stops that span a range (the hero, inner core and sources hold one depth and add no key)
    stops.forEach(function (st) {
      if (+st.dataset.from !== +st.dataset.to) keys.push([st.getBoundingClientRect().bottom + y0, +st.dataset.to]);
    });
    keys.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    return keys;
  }

  function depthAt(y, keys) {
    if (y <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) {
      if (y <= keys[i][0]) {
        var a = keys[i - 1], b = keys[i], span = b[0] - a[0];
        return span > 0 ? a[1] + (b[1] - a[1]) * (y - a[0]) / span : b[1];
      }
    }
    return keys[keys.length - 1][1];
  }

  // the scroll position where the rail ends: the last trail sign on the reading line
  function railEnd() { return scrollForKm(COL_KM) || 1; }

  // each band is as tall as its layer is long on the page, measured where the gauge changes layer
  function layoutBands(end) {
    var probe = window.innerHeight * 0.55, edges = [0];
    bandStops.forEach(function (st) {
      edges.push(Math.max(0, Math.min(end, st.getBoundingClientRect().top + window.scrollY - probe)));
    });
    edges.push(end);
    var sizes = [];
    for (var i = 1; i < edges.length; i++) sizes.push(Math.round(edges[i] - edges[i - 1]));
    var key = sizes.join();
    if (key === lastBands) return;
    lastBands = key;
    sizes.forEach(function (size, n) { gBands[n].style.flexGrow = size; });
  }

  function updateGauge() {
    // same line the trail's "here" marker rides on, so the gauge reads a sign's depth as the marker passes it
    var probe = window.innerHeight * 0.55;
    var cur = stops[0];
    for (var i = 0; i < stops.length; i++) {
      if (stops[i].getBoundingClientRect().top <= probe) cur = stops[i];
    }
    var km = depthAt(window.scrollY + probe, depthKeys());
    // the column is a linear rail along the page, not a depth scale: one speed through every layer
    var end = railEnd(), frac = Math.max(0, Math.min(1, window.scrollY / end));
    gMark.style.top = (frac * gCol.clientHeight - 1).toFixed(1) + "px";
    layoutBands(end);
    // metres of altitude above sea level, km of depth below it; temperature stays sourced per stop
    var reading = km < 0 ? fmt.format(Math.round(-km * 1000)) + " m" : fmt.format(Math.round(km)) + " km";
    if (cur.dataset.mode === "Altitude" && km >= 0) reading = "0 m";
    if (reading !== lastReading) {
      lastReading = reading;
      gDepth.textContent = reading;
      gBody.setAttribute("aria-valuenow", Math.round(frac * 100));
      gBody.setAttribute("aria-valuetext", reading + (km < 0 ? " altitude" : " depth"));
    }
    gaugeKm = km;
    if (cur !== lastStop) {
      lastStop = cur;
      gMode.textContent = cur.dataset.mode;
      gTemp.textContent = cur.dataset.temp;
      gAt.textContent = cur.dataset.at;
      gLayer.textContent = cur.dataset.name;
    }
  }

  /* the gauge is also a scrubber: drag, click or key along the column to travel to that depth */

  // inverse of depthAt: the scroll position at which the gauge reads `km`
  // (a flat run, e.g. a layer's lower edge followed by the next sign at the same depth, lands on the sign)
  function scrollForKm(km) {
    var keys = depthKeys(), y = keys[0][0];
    for (var i = keys.length - 1; i >= 0; i--) {
      if (keys[i][1] <= km) {
        var a = keys[i], b = keys[i + 1];
        y = (a[1] === km || !b || b[1] === a[1]) ? a[0] : a[0] + (b[0] - a[0]) * (km - a[1]) / (b[1] - a[1]);
        break;
      }
    }
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(max, y - window.innerHeight * 0.55));
  }

  function travelTo(top, smooth) {
    window.scrollTo({ top: top, behavior: smooth && !reduced ? "smooth" : "instant" });
  }

  function travelToPointer(clientY, smooth) {
    var r = gCol.getBoundingClientRect();
    travelTo(Math.max(0, Math.min(1, (clientY - r.top) / r.height)) * railEnd(), smooth);
  }

  var scrubbing = false, scrubMoved = false;
  gBody.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    scrubbing = true; scrubMoved = false;
    gBody.setPointerCapture(e.pointerId);
    gBody.classList.add("scrubbing");
    e.preventDefault();
  });
  gBody.addEventListener("pointermove", function (e) {
    if (!scrubbing) return;
    scrubMoved = true;
    travelToPointer(e.clientY, false);
  });
  function endScrub(e) {
    if (!scrubbing) return;
    scrubbing = false;
    gBody.classList.remove("scrubbing");
    if (!scrubMoved && e.type === "pointerup") travelToPointer(e.clientY, true); // a plain click glides there
  }
  gBody.addEventListener("pointerup", endScrub);
  gBody.addEventListener("pointercancel", endScrub);

  gBody.addEventListener("keydown", function (e) {
    // targets in km; anything above 0 km (the altitude part of the trip) means "back to the top of the page"
    var signKms = gaugeSigns.map(function (s) { return +s.dataset.km; });
    var km = gaugeKm, target, glide = true;
    switch (e.key) {
      case "ArrowDown": case "ArrowRight": case "ArrowUp": case "ArrowLeft":
        e.preventDefault();
        var step = railEnd() / 50 * (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1);
        travelTo(Math.max(0, Math.min(railEnd(), window.scrollY + step)), false);
        return;
      case "PageDown": target = signKms.filter(function (k) { return k > km + 0.5; })[0]; break;
      case "PageUp": target = signKms.filter(function (k) { return k < km - 0.5; }).pop(); break;
      case "Home": target = -1; break;
      case "End": target = COL_KM; break;
      default: return;
    }
    e.preventDefault();
    if (target === undefined) target = e.key === "PageUp" ? -1 : COL_KM;
    travelTo(target < 0 ? 0 : scrollForKm(target), glide);
  });

  var summitSection = document.getElementById("summit");
  var ticking = false;
  function update() {
    ticking = false;
    updateGauge();
    if (!samples.length) return;
    var mapTop = map.getBoundingClientRect().top + window.scrollY;
    var line = window.scrollY - mapTop + window.innerHeight * 0.55;
    // The reading line starts below the peak (more so in taller windows such as fullscreen), so at the top
    // of the page the pin would sit down the slope. Through the Summit section, ease the pin from the peak
    // to the line, the same way the gauge counts 8,849 m down to 0 m, so it starts exactly on the summit.
    var peakY = samples[0].y, line0 = window.innerHeight * 0.55 - mapTop;
    var easeEnd = summitSection.getBoundingClientRect().bottom + window.scrollY - mapTop;
    if (peakY < line0 && line < easeEnd && easeEnd > line0) line = peakY + (line - line0) * (easeEnd - peakY) / (easeEnd - line0);
    var s = sampleAtY(line);
    pMask.style.strokeDashoffset = (total - (reduced ? total : s.len)).toFixed(1);
    here.style.transform = "translate(" + s.rx.toFixed(1) + "px," + s.ry.toFixed(1) + "px)";
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  var rebuildTimer = 0;
  function scheduleBuild() { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(buildTrail, 60); }
  if ("ResizeObserver" in window) new ResizeObserver(scheduleBuild).observe(map);
  window.addEventListener("resize", scheduleBuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleBuild);
  if (reduceQuery.addEventListener) reduceQuery.addEventListener("change", function (e) { reduced = e.matches; update(); });

  document.getElementById("to-top").addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  /* ---------------- plates exhibit ---------------- */

  var platesSvg = document.getElementById("plates");
  var range = document.getElementById("plates-range");
  var status = document.getElementById("plates-status");
  var elIndia = document.getElementById("india");
  var elEurasia = document.getElementById("eurasia");
  var elFolds = document.getElementById("folds");
  var elSlab = document.getElementById("slab");
  var elWater = document.getElementById("ocean-water");
  var elOcean = document.getElementById("ocean");
  var elOceanLabel = document.getElementById("ocean-label");
  var elIndiaLabel = document.getElementById("india-label");
  var elArrow = document.getElementById("india-arrow");
  var elHima = document.getElementById("hima-label");

  var EDGE = 560, GAP0 = 210, CONTACT = 0.55, stage = -1;

  function surface(x, h) {
    var bump = Math.exp(-Math.pow((x - 650) / 95, 2));
    var ridges = 1 + 0.22 * Math.sin(x / 13) + 0.12 * Math.sin(x / 5.3);
    return 150 - h * bump * ridges;
  }

  function renderPlates(t) {
    var close = Math.min(t / CONTACT, 1);
    var under = Math.max(0, (t - CONTACT) / (1 - CONTACT));
    var gap = GAP0 * (1 - close);
    var front = EDGE - gap;
    var push = under * 150;
    var h = under * 118;
    var back = front - 380 + push * 0.4;
    var tip = EDGE + push;

    elIndia.setAttribute("d",
      "M" + back + " 146 L" + Math.min(front + push, EDGE) + " 146" +
      (push > 0 ? " L" + tip + " " + (210 + push * 0.35) + " L" + tip + " " + (262 + push * 0.3) : " L" + front + " 250") +
      " L" + back + " 252 Z");

    elSlab.setAttribute("d",
      "M" + front + " 176 C" + (front + 110) + " 178 " + (EDGE + 30) + " 230 " + (EDGE + 150) + " 380 L" +
      (EDGE + 112) + " 392 C" + (EDGE - 10) + " 262 " + (front + 90) + " 206 " + front + " 204 Z");
    elSlab.style.opacity = (1 - under * 0.85).toFixed(2);

    elWater.setAttribute("x", front);
    elWater.setAttribute("width", Math.max(0, gap));
    elOcean.style.opacity = (1 - close).toFixed(2);
    elOceanLabel.setAttribute("x", front + gap / 2);

    var top = "M" + EDGE + " " + surface(EDGE, h).toFixed(1);
    for (var x = EDGE + 8; x <= 960; x += 8) top += " L" + x + " " + surface(x, h).toFixed(1);
    elEurasia.setAttribute("d", top + " L960 272 L" + EDGE + " 268 Z");

    var folds = "";
    for (var k = 1; k <= 3; k++) {
      var off = k * 26;
      folds += "M" + (EDGE + 6) + " " + (surface(EDGE + 6, h * (1 - k * 0.22)) + off).toFixed(1);
      for (var fx = EDGE + 14; fx <= 900; fx += 10) folds += " L" + fx + " " + (surface(fx, h * (1 - k * 0.22)) + off).toFixed(1);
      folds += " ";
    }
    elFolds.setAttribute("d", folds);

    elIndiaLabel.setAttribute("x", (back + Math.min(front, EDGE)) / 2);
    elArrow.setAttribute("transform", "translate(" + (back + 30) + " 112)");
    elHima.setAttribute("opacity", h > 34 ? "1" : "0");
    elHima.setAttribute("y", (surface(650, h) - 16).toFixed(1));
    range.style.setProperty("--p", (t * 100).toFixed(1) + "%");

    var s = t < CONTACT - 0.02 ? 0 : t < CONTACT + 0.12 ? 1 : 2;
    if (s !== stage) {
      stage = s;
      status.textContent = [
        "The Neotethys Ocean floor sinks beneath Eurasia as India moves north.",
        "Collision: India meets Eurasia. Collision began 50–60 million years ago.",
        "Indian crust underthrusts southern Tibet and the Himalaya rise. The plates still converge at 40–50 mm a year."
      ][s];
    }
  }
  range.addEventListener("input", function () { renderPlates(range.value / 100); });

  var dragging = false, dragStartX = 0, dragStartT = 0;
  function svgX(evt) {
    var r = platesSvg.getBoundingClientRect();
    return (evt.clientX - r.left) * (960 / r.width);
  }
  [elIndia, elIndiaLabel, elArrow].forEach(function (el) {
    el.addEventListener("pointerdown", function (e) {
      dragging = true;
      dragStartX = svgX(e);
      dragStartT = range.value / 100;
      platesSvg.classList.add("dragging");
      platesSvg.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
  });
  platesSvg.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var t = Math.max(0, Math.min(1, dragStartT + (svgX(e) - dragStartX) / 360));
    range.value = Math.round(t * 100);
    renderPlates(t);
  });
  function endDrag() { dragging = false; platesSvg.classList.remove("dragging"); }
  platesSvg.addEventListener("pointerup", endDrag);
  platesSvg.addEventListener("pointercancel", endDrag);
  renderPlates(0);

  /* ---------------- diamond exhibit ---------------- */

  var dBtn = document.getElementById("diamond-btn");
  var dEx = document.getElementById("diamond-exhibit");
  dBtn.addEventListener("click", function () {
    var open = !dEx.classList.contains("open");
    dEx.classList.toggle("open", open);
    dBtn.setAttribute("aria-pressed", open ? "true" : "false");
    dBtn.textContent = open ? "Close the diamond" : "Look inside the diamond";
  });

  /* ---------------- living scenes ---------------- */

  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var scenes = [];

  function Scene(canvas, kind) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.kind = kind;
    this.host = canvas.parentElement;
    this.visible = false;
    this.parts = [];
    this.t = 0;
    this.resize();
  }
  Scene.prototype.resize = function () {
    var w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h || (w === this.w && h === this.h)) return;
    this.w = w; this.h = h;
    this.canvas.width = Math.round(w * DPR);
    this.canvas.height = Math.round(h * DPR);
    this.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    this.seed();
    if (reduced) this.still();
  };
  Scene.prototype.seed = function () {
    var w = this.w, h = this.h, n, i;
    this.parts = [];
    if (this.kind === "snow") {
      n = Math.min(260, Math.round(w * h / 7000));
      for (i = 0; i < n; i++) this.parts.push(this.flake(Math.random() * w, Math.random() * h));
      this.stars = [];
      for (i = 0; i < 120; i++) this.stars.push({ x: Math.random() * w, y: Math.random() * h * 0.45, r: Math.random() < 0.15 ? 2 : 1, ph: Math.random() * 6.28 });
    } else if (this.kind === "convection") {
      n = Math.min(900, Math.round(w * h / 300));
      this.cells = 3;
      for (i = 0; i < n; i++) this.parts.push({ x: Math.random() * w, y: Math.random() * h, life: Math.random() * 400 });
    } else if (this.kind === "molten") {
      n = Math.min(1000, Math.round(w * h / 1900));
      for (i = 0; i < n; i++) this.parts.push(this.blob(Math.random() * w, Math.random() * h));
    }
  };
  Scene.prototype.flake = function (x, y) {
    var r = 0.6 + Math.pow(Math.random(), 2.2) * 2.6;
    return { x: x, y: y, r: r, vy: 0.25 + r * 0.22, vx: 0.35 + r * 0.25, ph: Math.random() * 6.28, a: 0.35 + Math.random() * 0.5 };
  };
  Scene.prototype.blob = function (x, y) {
    var pal = ["255,214,122", "255,179,71", "255,140,40", "255,236,170", "140,40,8"];
    var c = Math.random() < 0.12 ? pal[4] : pal[Math.floor(Math.random() * 4)];
    return { x: x, y: y, c: c, life: Math.random() * 300, w: 1.2 + Math.random() * 2.6 };
  };

  Scene.prototype.step = function () {
    var ctx = this.ctx, w = this.w, h = this.h, i, p;
    this.t += 1;
    if (this.kind === "snow") {
      ctx.clearRect(0, 0, w, h);
      for (i = 0; i < this.stars.length; i++) {
        p = this.stars[i];
        ctx.globalAlpha = 0.35 + 0.35 * Math.sin(this.t / 40 + p.ph);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(p.x, p.y, p.r, p.r);
      }
      var gust = 1 + 0.6 * Math.sin(this.t / 260) + 0.3 * Math.sin(this.t / 71);
      for (i = 0; i < this.parts.length; i++) {
        p = this.parts[i];
        p.x += p.vx * gust + Math.sin(p.ph + this.t / 60) * 0.35;
        p.y += p.vy;
        if (p.y > h + 4 || p.x > w + 4) {
          if (Math.random() < 0.5) { p.x = -4; p.y = Math.random() * h; } else { p.x = Math.random() * w; p.y = -4; }
        }
        ctx.globalAlpha = p.a;
        ctx.fillStyle = "#eef2f5";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (this.kind === "convection") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      var k = this.cells, PI = Math.PI, speed = 0.9 * Math.min(w / k, h) / 2;
      ctx.lineWidth = 1.8;
      for (i = 0; i < this.parts.length; i++) {
        p = this.parts[i];
        var sx = Math.sin(PI * k * p.x / w), cx = Math.cos(PI * k * p.x / w);
        var sy = Math.sin(PI * p.y / h), cy = Math.cos(PI * p.y / h);
        var u = sx * cy * (PI / h) * speed;
        var v = -cx * sy * (PI * k / w) * speed;
        var nx = p.x + u, ny = p.y + v;
        var heat = p.y / h; // hotter toward the bottom of the frame
        ctx.strokeStyle = v > 0.12 ? "rgba(142,197,232,0.5)" : "hsla(" + (12 + heat * 30) + ",95%," + (40 + heat * 25) + "%,0.6)";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.life--;
        if (p.life < 0 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) { p.x = Math.random() * w; p.y = Math.random() * h; p.life = 200 + Math.random() * 300; }
      }
    } else if (this.kind === "molten") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      var T = this.t;
      for (i = 0; i < this.parts.length; i++) {
        p = this.parts[i];
        var mu = 1.5 + 0.9 * Math.sin(p.y / 95 + T * 0.004);
        var mv = 0.7 * Math.sin(p.x / 150 + p.y / 70 + T * 0.006);
        ctx.strokeStyle = "rgba(" + p.c + ",0.6)";
        ctx.lineWidth = p.w;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); p.x += mu; p.y += mv; ctx.lineTo(p.x, p.y); ctx.stroke();
        p.life--;
        if (p.life < 0 || p.x > w + 4 || p.y < -4 || p.y > h + 4) { var nb = this.blob(Math.random() * w * 0.2 - 10, Math.random() * h); nb.life = 160 + Math.random() * 260; this.parts[i] = nb; }
      }
    }
  };

  Scene.prototype.still = function () {
    this.ctx.clearRect(0, 0, this.w, this.h);
    var n = this.kind === "snow" ? 1 : 140;
    for (var i = 0; i < n; i++) this.step();
  };

  each("canvas.fx", function (c) { scenes.push(new Scene(c, c.dataset.fx)); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        scenes.forEach(function (s) { if (s.host === en.target) s.visible = en.isIntersecting; });
      });
    }, { rootMargin: "120px 0px" });
    scenes.forEach(function (s) { io.observe(s.host); });
  } else {
    scenes.forEach(function (s) { s.visible = true; });
  }

  function loop() {
    if (!reduced && !document.hidden) {
      for (var i = 0; i < scenes.length; i++) if (scenes[i].visible) scenes[i].step();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () { scenes.forEach(function (s) { s.resize(); }); });
    scenes.forEach(function (s) { ro.observe(s.host); });
  }

  buildTrail();
})();
