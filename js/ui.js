/* ==========================================================================
   UI-помощники: иконки, графики, модальные окна, уведомления
   ========================================================================== */
(function () {
  const G = window.G;
  const ui = (G.ui = {});

  /* ---------- Иконки (24×24, штрих 1.7) ---------- */
  const P = {
    today: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    live: '<circle cx="12" cy="12" r="2.6"/><path d="M6.6 6.6a7.6 7.6 0 0 0 0 10.8M17.4 6.6a7.6 7.6 0 0 1 0 10.8M3.8 3.8a11.6 11.6 0 0 0 0 16.4M20.2 3.8a11.6 11.6 0 0 1 0 16.4"/>',
    archive: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    rooms: '<path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.5l1.2-2h6.6l1.2 2H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/><circle cx="12" cy="13" r="3.5"/>',
    settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    flag: '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
    eye: '<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.7 3.4M6.4 7.4A15 15 0 0 0 2.5 12S6 18 12 18c1.5 0 2.8-.3 4-.8"/><path d="M9.9 10a3 3 0 0 0 4.1 4.1"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    print: '<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.4"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
    pencil: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    sleep: '<path d="M5 6h7l-7 8h7M14 12h5l-5 6h5"/>',
    chat: '<path d="M4 5h16v11H11l-4 4v-4H4z"/>',
    logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h10"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.2"/><rect x="13" y="4" width="7" height="7" rx="1.2"/><rect x="4" y="13" width="7" height="7" rx="1.2"/><rect x="13" y="13" width="7" height="7" rx="1.2"/>',
    image: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M4 17l5-4 4 3 3-2 4 3"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3 6"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    refresh: '<path d="M20 11A8 8 0 0 0 5.5 7.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14.5 3.5L20 15M20 20v-5h-5"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wand: '<path d="M5 19L17 7M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 12l.6 1.2 1.2.6-1.2.6L19 15.6l-.6-1.2-1.2-.6 1.2-.6z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    cam: '<path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.5l1.2-2h6.6l1.2 2H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/><circle cx="12" cy="13" r="3.5"/>',
    wifi: '<path d="M3 9a14 14 0 0 1 18 0M6 12.5a9.5 9.5 0 0 1 12 0M9 16a5 5 0 0 1 6 0M12 19.4v.1"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    mobile: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    usb: '<circle cx="12" cy="18" r="2"/><path d="M12 16V5M9 8l3-3 3 3M7 12v2.5a1.5 1.5 0 0 0 1.5 1.5H12M17 11v3.5a1.5 1.5 0 0 1-1.5 1.5H12"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    zap: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  };
  ui.icon = (name, cls) => '<svg class="i ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || "") + "</svg>";
  ui.stateIcon = (s, cls) => ui.icon(G.STATES[s].icon, cls);
  ui.dot = (s) => '<span class="st st-dot" data-s="' + s + '">' + ui.stateIcon(s) + "</span>";

  /* ---------- Графики ---------- */
  const COLORS = ["var(--st-0)", "var(--st-1)", "var(--st-2)", "var(--st-3)"];
  ui.COLORS = COLORS;

  function ticks(totalMin, max) {
    const steps = [5, 10, 15, 20, 30, 60];
    let st = steps.find((s) => totalMin / s <= max) || 60;
    const t = []; for (let m = 0; m <= totalMin + 0.001; m += st) t.push(m);
    return t;
  }

  /* Накопительный график «кто чем занят» по времени */
  ui.stacked = function (o) {
    const frames = o.frames; const n = frames.length;
    const W = 760, H = o.height || 220, ml = 34, mr = 8, mt = 10, mb = 26;
    const pw = W - ml - mr, ph = H - mt - mb;
    const total = frames[0] ? frames[0].length : 16;
    const x = (i) => ml + (n <= 1 ? 0 : (i / (n - 1)) * pw);
    const y = (v) => mt + ph - (v / total) * ph;
    const cum = frames.map((f) => { const c = G.countFrame(f); return [c[0], c[0] + c[1], c[0] + c[1] + c[2], total]; });
    let areas = "";
    for (let k = 3; k >= 0; k--) {
      let top = "", bot = "";
      cum.forEach((c, i) => { top += (i ? "L" : "M") + x(i).toFixed(1) + " " + y(c[k]).toFixed(1); });
      for (let i = n - 1; i >= 0; i--) bot += "L" + x(i).toFixed(1) + " " + y(k === 0 ? 0 : cum[i][k - 1]).toFixed(1);
      areas += '<path d="' + top + bot + 'Z" fill="' + COLORS[k] + '" opacity="' + (k === 0 ? 0.92 : 0.95) + '"/>';
    }
    const totalMin = (n - 1) * o.stepMin;
    let grid = "";
    [0, 25, 50, 75, 100].forEach((p) => {
      const yy = mt + ph - (p / 100) * ph;
      grid += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + yy + '" y2="' + yy + '"/>' + '<text x="' + (ml - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + p + "%</text>";
    });
    let xt = "";
    ticks(totalMin, 8).forEach((m) => {
      const xx = ml + (totalMin ? (m / totalMin) * pw : 0);
      const tm = new Date(o.start.getTime() + m * 60000);
      xt += '<text x="' + xx + '" y="' + (H - 6) + '" text-anchor="middle">' + G.hhmm(tm) + "</text>";
    });
    let marks = "";
    (o.marks || []).forEach((mk) => {
      const xx = x(mk.idx);
      marks += '<line x1="' + xx + '" x2="' + xx + '" y1="' + mt + '" y2="' + (mt + ph) + '" stroke="var(--ink)" stroke-width="1.5"/>' +
        '<path d="M' + xx + " " + mt + "h9l-2 3.5 2 3.5h-9z" + '" fill="var(--ink)"/>';
    });
    const thr = o.threshold != null ? '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(total * (1 - o.threshold / 100)) + '" y2="' + y(total * (1 - o.threshold / 100)) + '" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 4" opacity=".55"/>' : "";
    return (
      '<div class="chart" data-n="' + n + '">' +
      '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + G.esc(o.label || "График состояния группы по времени") + '">' +
      '<g class="grid axis">' + grid + "</g>" + areas + thr + marks +
      '<g class="axis">' + xt + "</g>" +
      '<line class="cursor" x1="0" x2="0" y1="' + mt + '" y2="' + (mt + ph) + '" style="display:none"/>' +
      '<rect class="hit" x="' + ml + '" y="' + mt + '" width="' + pw + '" height="' + ph + '" fill="transparent"/>' +
      "</svg></div>"
    );
  };

  ui.hoverChart = function (root, o, cb) {
    const wrap = root.querySelector(".chart"); if (!wrap) return;
    const svg = wrap.querySelector("svg"); const hit = svg.querySelector(".hit"); const cur = svg.querySelector(".cursor");
    const n = o.frames.length; const W = 760, ml = 34, mr = 8, pw = W - ml - mr;
    let tip = wrap.querySelector(".chart-tip");
    if (!tip) { tip = document.createElement("div"); tip.className = "chart-tip"; tip.style.display = "none"; wrap.appendChild(tip); }
    function at(ev) {
      const r = svg.getBoundingClientRect(); const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      const vx = (cx / r.width) * W; const i = G.clamp(Math.round(((vx - ml) / pw) * (n - 1)), 0, n - 1);
      return { i, px: cx, vx: ml + (n <= 1 ? 0 : (i / (n - 1)) * pw), w: r.width };
    }
    function move(ev) {
      const p = at(ev); const c = G.countFrame(o.frames[p.i]); const t = new Date(o.start.getTime() + p.i * o.stepMin * 60000);
      cur.setAttribute("x1", p.vx); cur.setAttribute("x2", p.vx); cur.style.display = "";
      tip.style.display = ""; tip.style.left = G.clamp((p.vx / W) * p.w, 70, p.w - 70) + "px";
      tip.innerHTML = "<b>" + G.hhmm(t) + " · " + Math.round(G.engagement(o.frames[p.i])) + "% работают</b><br>" +
        G.STATES.map((s, k) => s.name + ": " + c[k]).slice(1).join(" · ").replace(/^/, "Работают: " + c[0] + " · ");
      if (cb) cb(p.i, "move");
    }
    hit.addEventListener("mousemove", move);
    hit.addEventListener("touchmove", move, { passive: true });
    hit.addEventListener("mouseleave", () => { cur.style.display = "none"; tip.style.display = "none"; if (cb) cb(null, "leave"); });
    hit.addEventListener("click", (ev) => { if (cb) cb(at(ev).i, "click"); });
  };

  ui.spark = function (values, w, h, color) {
    w = w || 120; h = h || 32;
    if (!values.length) return "";
    const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * (w - 2) + 1, h - 3 - (v / 100) * (h - 6)]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" aria-hidden="true"><path d="' + d + 'L' + (w - 1) + " " + h + "L1 " + h + 'Z" fill="' + (color || "var(--accent)") + '" opacity=".14"/><path d="' + d + '" fill="none" stroke="' + (color || "var(--accent)") + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  };

  ui.bars = function (vals, labels, hi, h) {
    const W = 520, H = h || 150, mb = 24, mt = 18; const n = vals.length; const bw = Math.min(46, (W / n) * 0.56); const gap = W / n;
    let s = "";
    vals.forEach((v, i) => {
      const bh = v == null ? 0 : ((H - mb - mt) * v) / 100; const x = i * gap + (gap - bw) / 2; const y = H - mb - bh;
      const on = i === hi;
      if (v == null) s += '<rect x="' + x + '" y="' + (H - mb - 3) + '" width="' + bw + '" height="3" rx="1.5" fill="var(--line-strong)"/>';
      else s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="5" fill="' + (on ? "var(--accent)" : "var(--accent-soft)") + '"' + (on ? "" : ' stroke="var(--accent)" stroke-opacity=".25"') + "/>" +
        '<text x="' + (x + bw / 2) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="12.5" font-weight="650" fill="var(--ink)">' + Math.round(v) + "</text>";
      s += '<text x="' + (x + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="12.5" fill="' + (on ? "var(--ink)" : "var(--muted)") + '" font-weight="' + (on ? 650 : 450) + '">' + G.esc(labels[i]) + "</text>";
    });
    return '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="Столбчатая диаграмма" style="display:block">' + s + "</svg>";
  };

  ui.ring = function (score, size) {
    const r = 46, c = 2 * Math.PI * r; const cls = G.scoreClass(score);
    const col = cls === "hi" ? "var(--st-0)" : cls === "mid" ? "var(--st-1)" : "var(--st-2)";
    return '<div class="ring" style="' + (size ? "width:" + size + "px;height:" + size + "px" : "") + '"><svg viewBox="0 0 112 112" aria-hidden="true"><circle cx="56" cy="56" r="' + r + '" fill="none" stroke="var(--sunken)" stroke-width="9"/><circle cx="56" cy="56" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + ((c * score) / 100).toFixed(1) + " " + c.toFixed(1) + '"/></svg><div class="c">' + score + "</div></div>";
  };

  /* ---------- Тосты ---------- */
  ui.toast = function (text, opt) {
    opt = opt || {}; let box = document.querySelector(".toasts");
    if (!box) { box = document.createElement("div"); box.className = "toasts"; box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
    const el = document.createElement("div"); el.className = "toast";
    el.innerHTML = "<span>" + G.esc(text) + "</span>" + (opt.action ? '<button type="button">' + G.esc(opt.action.label) + "</button>" : "");
    if (opt.action) el.querySelector("button").onclick = () => { opt.action.fn(); el.remove(); };
    box.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, opt.ms || 3600);
  };

  /* ---------- Модальные окна ---------- */
  ui.modal = function (o) {
    const prev = document.activeElement;
    const ov = document.createElement("div"); ov.className = "overlay";
    ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt">' +
      '<div class="modal-head"><div><h2 id="mt">' + o.title + "</h2>" + (o.sub ? "<p>" + o.sub + "</p>" : "") + '</div><button class="btn ghost icon-btn sm" data-close aria-label="Закрыть">' + ui.icon("x") + "</button></div>" +
      '<div class="modal-body">' + (o.body || "") + "</div>" +
      '<div class="modal-foot">' + (o.foot || "") + "</div></div>";
    document.body.appendChild(ov);
    function close(v) { document.removeEventListener("keydown", key); ov.remove(); if (prev && prev.focus) prev.focus(); if (o.onClose) o.onClose(v); }
    function key(e) {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const f = [...ov.querySelectorAll('button:not([disabled]),input:not([disabled]),select,textarea,a[href]')]; if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    }
    document.addEventListener("keydown", key);
    ov.addEventListener("mousedown", (e) => { if (e.target === ov) close(); });
    ov.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => close()));
    const first = ov.querySelector("[data-autofocus]") || ov.querySelector(".modal-foot .btn.primary") || ov.querySelector("input,select,textarea,button");
    if (first) setTimeout(() => first.focus(), 30);
    if (o.onMount) o.onMount(ov, close);
    return { el: ov, close };
  };

  ui.confirm = function (o) {
    return new Promise((res) => {
      let done = false;
      ui.modal({
        title: o.title, sub: o.text,
        foot: '<button class="btn" data-close>' + (o.cancel || "Отмена") + '</button><button class="btn ' + (o.danger ? "danger solid" : "primary") + '" data-ok>' + o.ok + "</button>",
        onMount: (ov, close) => { ov.querySelector("[data-ok]").onclick = () => { done = true; close(true); }; },
        onClose: (v) => res(!!v && done),
      });
    });
  };

  /* Сегментированный переключатель */
  ui.segHTML = (name, items, cur) =>
    '<div class="seg" role="radiogroup" data-seg="' + name + '">' +
    items.map((it) => '<button type="button" role="radio" aria-checked="' + (String(it[0]) === String(cur)) + '" data-v="' + it[0] + '">' + G.esc(it[1]) + "</button>").join("") + "</div>";
  ui.segBind = function (root, name, fn) {
    const g = root.querySelector('[data-seg="' + name + '"]'); if (!g) return;
    g.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      g.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", x === b));
      fn(b.dataset.v);
    });
  };

  ui.scoreChip = (s) => '<span class="score ' + G.scoreClass(s) + '">' + s + "</span>";
  ui.download = function (name, text, mime) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: mime || "text/plain" })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  };
})();
