/* Summit Trail to the Core: trail, marker, signs, exhibits and living scenes. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var map = document.getElementById("map");
  var stops = Array.prototype.slice.call(document.querySelectorAll(".stop"));
  var summit = document.getElementById("summit");
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceQuery.matches;
  var MOBILE = 760;

  /* ---------------- separators: give the middle dot even spacing ---------------- */

  function sepHTML(text) {
    return text.split(" · ").map(function (t) {
      return t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    }).join(' <span class="sep">·</span> ');
  }
  Array.prototype.forEach.call(document.querySelectorAll(".meta, .cut-label, .sign-depth"), function (el) {
    if (el.textContent.indexOf(" · ") > -1) el.innerHTML = sepHTML(el.textContent);
  });

  /* ---------------- collapsible sign text ---------------- */

  var mores = document.querySelectorAll(".more");
  Array.prototype.forEach.call(mores, function (m) { m.setAttribute("data-collapsed", ""); });

  function controlsFor(id) {
    return document.querySelectorAll('[aria-controls="' + id + '"]');
  }
  function setOpen(id, open) {
    var region = document.getElementById(id);
    if (!region) return;
    if (open) region.removeAttribute("data-collapsed");
    else region.setAttribute("data-collapsed", "");
    Array.prototype.forEach.call(controlsFor(id), function (c) {
      c.setAttribute("aria-expanded", open ? "true" : "false");
    });
    var readBtn = document.querySelector('.read[aria-controls="' + id + '"] span');
    if (readBtn && !readBtn.dataset.label) readBtn.dataset.label = readBtn.textContent;
    if (readBtn) readBtn.textContent = open ? "Show less" : readBtn.dataset.label;
  }
  function isOpen(id) {
    var region = document.getElementById(id);
    return region && !region.hasAttribute("data-collapsed");
  }

  Array.prototype.forEach.call(document.querySelectorAll(".read"), function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("aria-controls");
      setOpen(id, !isOpen(id));
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".sign"), function (sign) {
    sign.addEventListener("click", function () {
      var id = sign.getAttribute("aria-controls");
      var open = !isOpen(id);
      setOpen(id, open);
      if (open) {
        var panel = document.getElementById(id).closest(".panel");
        var r = panel.getBoundingClientRect();
        if (r.top < 0 || r.top > window.innerHeight * 0.6) {
          panel.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        }
      }
    });
  });

  /* ---------------- summit sign sits on the peak ---------------- */

  var summitSign = summit.querySelector(".sign");
  var peakAnchor = summit.querySelector('[data-anchor="summit"]');

  function placeSummitSign() {
    var sr = summit.getBoundingClientRect();
    var ar = peakAnchor.getBoundingClientRect();
    var px = ar.left + ar.width / 2 - sr.left;
    var py = ar.top + ar.height / 2 - sr.top;
    var w = summitSign.offsetWidth;
    var h = summitSign.offsetHeight;
    var post = 36;
    var left = Math.max(10, Math.min(summit.clientWidth - w - 10, px - w / 2));
    summitSign.style.left = left + "px";
    summitSign.style.top = (py - h - post - 3) + "px";
    summitSign.style.setProperty("--post", post + "px");
    return { x: px, y: py };
  }

  /* ---------------- trail geometry ---------------- */

  var svg = document.getElementById("trail");
  var pDots = document.getElementById("trail-dots");
  var pHalo = document.getElementById("trail-halo");
  var pMask = document.getElementById("trail-mask");
  var pGhost = document.getElementById("trail-ghost");
  var here = document.getElementById("here");
  var hereVal = document.getElementById("here-val");

  var samples = []; // {x, y, len}
  var total = 0;
  var stopTops = [];

  function rel(el) {
    var mr = map.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return { left: r.left - mr.left, top: r.top - mr.top, width: r.width, height: r.height, bottom: r.bottom - mr.top, right: r.right - mr.left };
  }

  function sideX(stop, W, mobile) {
    if (mobile) return 30;
    return stop.classList.contains("trail-left") ? W * 0.22 : W * 0.76;
  }

  function signFoot(stop) {
    var sign = stop.querySelector(".sign");
    var r = rel(sign);
    var post = parseFloat(getComputedStyle(sign).getPropertyValue("--post")) || 34;
    var mobile = map.clientWidth <= MOBILE;
    var x = mobile ? r.left + 16 + 5 : r.left + r.width / 2;
    return { x: x, y: r.bottom + 3 + post };
  }

  function catmull(points) {
    if (points.length < 2) return "";
    var d = "M" + points[0].x.toFixed(1) + " " + points[0].y.toFixed(1);
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += " C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2.x.toFixed(1) + " " + p2.y.toFixed(1);
    }
    return d;
  }

  function buildTrail() {
    // collapse the overlay first so it never props the page open
    svg.setAttribute("height", 0);
    var W = map.clientWidth;
    var H = map.scrollHeight;
    var mobile = W <= MOBILE;
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    var peak = placeSummitSign();
    var sRect = rel(summit);
    peak = { x: peak.x + sRect.left, y: peak.y + sRect.top };

    var pts = [peak];
    var later = stops.slice(1);
    var firstX = sideX(later[0], W, mobile);

    // down the sunlit flank of the summit, clear of the panels
    if (mobile) {
      pts.push({ x: Math.min(peak.x + 30, W - 30), y: sRect.top + sRect.height * 0.36 });
      pts.push({ x: W - 34, y: sRect.top + sRect.height * 0.46 });
      pts.push({ x: firstX + 10, y: sRect.top + sRect.height * 0.52 });
      pts.push({ x: firstX, y: sRect.bottom - 40 });
    } else {
      pts.push({ x: peak.x + W * 0.05, y: sRect.top + sRect.height * 0.36 });
      pts.push({ x: firstX + W * 0.03, y: sRect.top + sRect.height * 0.62 });
      pts.push({ x: firstX - W * 0.02, y: sRect.top + sRect.height * 0.86 });
    }

    stopTops = [{ top: sRect.top, tag: summit.dataset.tag }];

    later.forEach(function (stop, i) {
      var r = rel(stop);
      var x = sideX(stop, W, mobile);
      var foot = signFoot(stop);
      var padB = parseFloat(getComputedStyle(stop).paddingBottom) || 120;
      stopTops.push({ top: r.top, tag: stop.dataset.tag });
      pts.push({ x: foot.x, y: foot.y });
      if (i === later.length - 1) return; // the inner-core sign is the trail end
      var wig = mobile ? 0 : W * 0.03 * (i % 2 ? 1 : -1);
      pts.push({ x: x + wig, y: r.top + r.height * 0.42 });
      pts.push({ x: x - wig, y: r.top + r.height * 0.7 });
      pts.push({ x: x, y: r.bottom - padB * 0.55 });
      var nx = sideX(later[i + 1], W, mobile);
      pts.push({ x: (x + nx) / 2, y: r.bottom });
    });

    var d = catmull(pts);
    [pDots, pHalo, pMask, pGhost].forEach(function (p) { p.setAttribute("d", d); });
    total = pDots.getTotalLength();
    pMask.style.strokeDasharray = total + " " + total;

    samples = [];
    var step = 6;
    var maxY = -Infinity;
    for (var l = 0; l <= total; l += step) {
      var pt = pDots.getPointAtLength(l);
      maxY = Math.max(maxY, pt.y);
      samples.push({ x: pt.x, y: maxY, rx: pt.x, ry: pt.y, len: l });
    }
    update();
  }

  function sampleAtY(y) {
    var lo = 0, hi = samples.length - 1;
    if (!samples.length) return null;
    if (y <= samples[0].y) return samples[0];
    if (y >= samples[hi].y) return samples[hi];
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (samples[mid].y < y) lo = mid + 1; else hi = mid;
    }
    return samples[lo];
  }

  var lastTag = "";
  function update() {
    ticking = false;
    if (!samples.length) return;
    var mapTop = map.getBoundingClientRect().top + window.scrollY;
    var targetY = window.scrollY - mapTop + window.innerHeight * 0.55;
    var s = sampleAtY(targetY);
    if (!s) return;
    var revealed = reduced ? total : s.len;
    pMask.style.strokeDashoffset = (total - revealed).toFixed(1);

    if (map.clientWidth > MOBILE) {
      here.style.transform = "translate(" + s.rx.toFixed(1) + "px," + s.ry.toFixed(1) + "px)";
      var tagW = here.querySelector(".here-tag").offsetWidth;
      here.classList.toggle("flip", s.rx + tagW + 40 > map.clientWidth || s.rx > map.clientWidth * 0.62);
    } else {
      here.style.transform = "";
    }

    var tag = stopTops[0] ? stopTops[0].tag : "";
    for (var i = 0; i < stopTops.length; i++) {
      if (s.ry >= stopTops[i].top) tag = stopTops[i].tag;
    }
    if (tag !== lastTag) {
      hereVal.innerHTML = sepHTML(tag);
      lastTag = tag;
    }
  }

  var ticking = false;
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  var rebuildTimer = 0;
  function scheduleBuild() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(buildTrail, 60);
  }
  if ("ResizeObserver" in window) new ResizeObserver(scheduleBuild).observe(map);
  window.addEventListener("resize", scheduleBuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleBuild);
  reduceQuery.addEventListener && reduceQuery.addEventListener("change", function (e) { reduced = e.matches; update(); });

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

  var EDGE = 560;      // Eurasia's southern edge
  var GAP0 = 210;      // starting width of the Neotethys
  var CONTACT = 0.55;  // fraction of the push where the ocean closes
  var stage = -1;

  function surface(x, h) {
    // Eurasia's upper surface: the Himalaya rise near the collision edge
    var bump = Math.exp(-Math.pow((x - 650) / 95, 2));
    var ridges = 1 + 0.22 * Math.sin(x / 13) + 0.12 * Math.sin(x / 5.3);
    return 150 - h * bump * ridges;
  }

  function renderPlates(t) {
    var close = Math.min(t / CONTACT, 1);
    var under = Math.max(0, (t - CONTACT) / (1 - CONTACT));
    var gap = GAP0 * (1 - close);
    var front = EDGE - gap;          // India's leading edge
    var push = under * 150;          // how far India has slid beneath Eurasia
    var h = under * 118;             // mountain height

    var back = front - 380 + push * 0.4;
    var tip = EDGE + push;
    elIndia.setAttribute("d",
      "M" + back + " 146 L" + Math.min(front + push, EDGE) + " 146" +
      (push > 0 ? " L" + tip + " " + (210 + push * 0.35) + " L" + tip + " " + (262 + push * 0.3) : " L" + front + " 250") +
      " L" + back + " 252 Z");

    var slabStart = front;
    elSlab.setAttribute("d",
      "M" + slabStart + " 176 C" + (slabStart + 110) + " 178 " + (EDGE + 30) + " 230 " + (EDGE + 150) + " 380 L" +
      (EDGE + 112) + " 392 C" + (EDGE - 10) + " 262 " + (slabStart + 90) + " 206 " + slabStart + " 204 Z");
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

  // drag the Indian plate itself
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
    this.host = canvas.closest(".stop");
    this.visible = false;
    this.parts = [];
    this.t = 0;
    this.resize();
  }
  Scene.prototype.resize = function () {
    var w = this.host.clientWidth, h = this.host.clientHeight;
    if (w === this.w && h === this.h) return;
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
      n = Math.min(340, Math.round(w * h / 6500));
      for (i = 0; i < n; i++) this.parts.push(this.flake(Math.random() * w, Math.random() * h));
      this.drift = [];
    } else if (this.kind === "convection") {
      n = Math.min(1100, Math.round(w * h / 1700));
      this.cells = Math.max(2, Math.round(w / 560));
      for (i = 0; i < n; i++) this.parts.push({ x: Math.random() * w, y: Math.random() * h, life: Math.random() * 400 });
    } else if (this.kind === "molten") {
      n = Math.min(1000, Math.round(w * h / 1900));
      for (i = 0; i < n; i++) this.parts.push(this.blob(Math.random() * w, Math.random() * h));
    }
  };
  Scene.prototype.flake = function (x, y) {
    var r = 0.7 + Math.pow(Math.random(), 2.2) * 3;
    return { x: x, y: y, r: r, vy: 0.25 + r * 0.22, vx: 0.35 + r * 0.25, ph: Math.random() * 6.28, a: 0.45 + Math.random() * 0.5 };
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
      var gust = 1 + 0.6 * Math.sin(this.t / 260) + 0.3 * Math.sin(this.t / 71);
      for (i = 0; i < this.parts.length; i++) {
        p = this.parts[i];
        p.x += p.vx * gust + Math.sin(p.ph + this.t / 60) * 0.35;
        p.y += p.vy;
        if (p.y > h + 4 || p.x > w + 4) {
          if (Math.random() < 0.5) { p.x = -4; p.y = Math.random() * h; } else { p.x = Math.random() * w; p.y = -4; }
        }
        ctx.globalAlpha = p.a;
        ctx.fillStyle = "#fff4ee";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      // spindrift streaming off the summit
      var a = peakAnchor.getBoundingClientRect(), hr = this.host.getBoundingClientRect();
      var px = a.left - hr.left, py = a.top - hr.top;
      for (i = 0; i < 4; i++) this.drift.push({ x: px + Math.random() * 10, y: py + Math.random() * 12 - 2, vx: 1.4 + Math.random() * 2.4 * gust, vy: (Math.random() - 0.35) * 0.7, life: 0, max: 90 + Math.random() * 110, r: 0.8 + Math.random() * 1.8 });
      for (i = this.drift.length - 1; i >= 0; i--) {
        p = this.drift[i];
        p.life++; p.x += p.vx; p.y += p.vy + Math.sin(p.life / 14) * 0.25; p.vx *= 0.995;
        if (p.life > p.max) { this.drift.splice(i, 1); continue; }
        ctx.globalAlpha = 0.75 * (1 - p.life / p.max);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (this.kind === "convection") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.045)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      var k = this.cells, PI = Math.PI, speed = 0.9 * Math.min(w / k, h) / 2;
      ctx.lineWidth = 2;
      for (i = 0; i < this.parts.length; i++) {
        p = this.parts[i];
        var sx = Math.sin(PI * k * p.x / w), cx = Math.cos(PI * k * p.x / w);
        var sy = Math.sin(PI * p.y / h), cy = Math.cos(PI * p.y / h);
        var u = sx * cy * (PI / h) * speed;
        var v = -cx * sy * (PI * k / w) * speed;
        var nx = p.x + u, ny = p.y + v;
        ctx.strokeStyle = v > 0.12 ? "rgba(34,10,8,0.55)" : v < -0.12 ? "rgba(255,170,120,0.55)" : "rgba(214,110,80,0.45)";
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
    // reduced motion: one settled frame, no loop
    this.ctx.clearRect(0, 0, this.w, this.h);
    var n = this.kind === "snow" ? 1 : 140;
    for (var i = 0; i < n; i++) this.step();
  };

  Array.prototype.forEach.call(document.querySelectorAll("canvas.fx"), function (c) {
    scenes.push(new Scene(c, c.dataset.fx));
  });

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

  var sceneTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(sceneTimer);
    sceneTimer = setTimeout(function () { scenes.forEach(function (s) { s.resize(); }); }, 120);
  });
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () { scenes.forEach(function (s) { s.resize(); }); });
    scenes.forEach(function (s) { ro.observe(s.host); });
  }

  buildTrail();
})();
