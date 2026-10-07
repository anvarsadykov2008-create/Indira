/* ==========================================================================
   Данные и «движок» демо: места, генерация состояний, метрики, настройки.
   Когда появится бэкенд, заменяются только функции в этом файле.
   ========================================================================== */
(function () {
  const G = (window.G = window.G || {});

  /* ---------- Состояния ---------- */
  G.STATES = [
    { id: 0, key: "work", name: "Работает", icon: "pencil", verb: "работает" },
    { id: 1, key: "away", name: "Отвлечён", icon: "chat", verb: "отвлёкся" },
    { id: 2, key: "phone", name: "Телефон", icon: "phone", verb: "в телефоне" },
    { id: 3, key: "sleep", name: "Спит", icon: "sleep", verb: "спит" },
  ];

  /* ---------- Утилиты ---------- */
  G.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  G.pad = (n) => String(n).padStart(2, "0");
  G.hhmm = (d) => G.pad(d.getHours()) + ":" + G.pad(d.getMinutes());
  G.plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const DAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  const DAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  G.fmtDate = (d) => d.getDate() + " " + MONTHS[d.getMonth()];
  G.fmtDay = (d) => DAYS[d.getDay()];
  G.fmtDayShort = (d) => DAYS_SHORT[d.getDay()];
  G.fmtDateLong = (d) => { const s = G.fmtDay(d) + ", " + G.fmtDate(d); return s[0].toUpperCase() + s.slice(1); };
  G.sameDay = (a, b) => a.toDateString() === b.toDateString();
  G.relDay = (d) => {
    const now = new Date(); const y = new Date(now); y.setDate(now.getDate() - 1);
    if (G.sameDay(d, now)) return "Сегодня";
    if (G.sameDay(d, y)) return "Вчера";
    return G.fmtDate(d);
  };

  /* ---------- Места в кабинете 214 (координаты в пикселях демо-фото 1376×768) ---------- */
  G.IMG = { w: 1376, h: 768, src: "assets/classroom.jpg" };
  // [ряд, место, x, y, w, h, состояние на фото, склонность к отвлечению]
  const SEAT_RAW = [
    [1, 1, 118, 392, 130, 125, 0, 0.4],
    [1, 2, 288, 392, 125, 125, 0, 0.5],
    [1, 3, 540, 398, 155, 135, 0, 0.3],
    [1, 4, 722, 398, 148, 145, 0, 0.5],
    [1, 5, 1018, 432, 145, 98, 3, 1.8],
    [1, 6, 1168, 390, 115, 120, 2, 2.1],
    [2, 1, 272, 285, 108, 100, 0, 0.6],
    [2, 2, 392, 285, 90, 90, 0, 0.5],
    [2, 3, 568, 265, 105, 112, 0, 0.4],
    [2, 4, 718, 270, 112, 115, 0, 0.7],
    [2, 5, 928, 262, 90, 112, 1, 1.5],
    [2, 6, 1032, 278, 88, 100, 1, 1.4],
    [3, 1, 392, 193, 82, 100, 0, 0.7],
    [3, 2, 594, 190, 98, 98, 2, 1.9],
    [3, 3, 842, 218, 76, 95, 3, 1.6],
    [3, 4, 962, 208, 76, 85, 0, 1.0],
  ];
  G.makeSeats = function () {
    return SEAT_RAW.map((r, i) => ({
      id: "s" + (i + 1), row: r[0], place: r[1],
      x: r[2], y: r[3], w: r[4], h: r[5],
      label: "Ряд " + r[0] + ", место " + r[1],
    }));
  };
  G.photoStates = SEAT_RAW.map((r) => r[6]);
  G.propensity = SEAT_RAW.map((r) => r[7]);
  G.seatShort = (s) => "Р" + s.row + " · М" + s.place;

  /* ---------- Генерация состояний ---------- */
  // Кривая «энергии» группы по ходу пары (0..1)
  function energy(x, q, dipAt, dipDepth) {
    const bump = 0.12 * Math.exp(-Math.pow((x - 0.18) / 0.1, 2));
    const fatigue = 0.38 * Math.pow(x, 1.7);
    const dip = dipDepth * Math.exp(-Math.pow((x - dipAt) / 0.07, 2));
    return G.clamp(0.8 + (q - 0.6) * 0.5 - fatigue + bump - dip, 0.08, 0.98);
  }
  G.energy = energy;

  function stepStates(prev, prop, e, dt, rnd) {
    const drift = 1.3 - e;
    return prev.map((s, i) => {
      const p = prop[i];
      if (s === 0) {
        const r = rnd();
        const a = G.clamp(0.02 * p * drift * dt, 0, 0.85);
        const b = G.clamp(0.013 * (0.5 + p * 0.5) * drift * dt, 0, 0.6);
        const c = G.clamp(0.0035 * p * p * drift * dt, 0, 0.3);
        if (r < a) return 2;
        if (r < a + b) return 1;
        if (r < a + b + c) return 3;
        return 0;
      }
      const back = (s === 3 ? 0.05 : s === 2 ? 0.1 : 0.2) * (0.6 + e) * dt;
      return rnd() < G.clamp(back, 0, 0.9) ? 0 : s;
    });
  }
  G.stepStates = stepStates;

  G.genFrames = function (o) {
    const rnd = G.rng(o.seed);
    const frames = [];
    let cur = o.start || G.propensity.map(() => 0);
    const dt = o.stepMin / 0.5;
    for (let f = 0; f < o.n; f++) {
      const x = f / (o.total || o.n);
      cur = stepStates(cur, G.propensity, energy(x, o.q, o.dipAt, o.dipDepth), dt, rnd);
      frames.push(cur.slice());
    }
    return frames;
  };

  /* ---------- Метрики ---------- */
  G.countFrame = (fr) => { const c = [0, 0, 0, 0]; fr.forEach((s) => c[s]++); return c; };
  G.engagement = (fr) => (fr.length ? (fr.filter((s) => s === 0).length / fr.length) * 100 : 0);

  G.metrics = function (frames) {
    if (!frames.length) return { score: 0, eng: 0, stab: 0, disc: 0, shares: [0, 0, 0, 0], eMin: 0, eMinAt: 0, series: [] };
    const series = frames.map(G.engagement);
    const eng = series.reduce((a, b) => a + b, 0) / series.length;
    const stab = (series.filter((v) => v >= 60).length / series.length) * 100;
    const tot = [0, 0, 0, 0];
    frames.forEach((f) => G.countFrame(f).forEach((c, i) => (tot[i] += c)));
    const all = tot.reduce((a, b) => a + b, 0);
    const shares = tot.map((v) => (v / all) * 100);
    const disc = G.clamp(100 - (shares[2] + shares[3]) * 2.2, 0, 100);
    const score = Math.round(0.5 * eng + 0.25 * stab + 0.25 * disc);
    let eMin = 101, eMinAt = 0;
    // сглаживаем по 3 кадрам, чтобы не ловить единичные выбросы
    series.forEach((v, i) => {
      const w = series.slice(Math.max(0, i - 1), i + 2); const a = w.reduce((x, y) => x + y, 0) / w.length;
      if (a < eMin) { eMin = a; eMinAt = i; }
    });
    return { score: Math.round(score), eng, stab, disc, shares, eMin, eMinAt, series };
  };
  G.scoreClass = (s) => (s >= 75 ? "hi" : s >= 60 ? "mid" : "lo");

  // Статистика по местам: доля времени вне «работает»
  G.seatLoad = function (frames) {
    const n = G.propensity.length; const out = Array.from({ length: n }, () => [0, 0, 0, 0]);
    frames.forEach((f) => f.forEach((s, i) => out[i][s]++));
    return out.map((c) => { const t = c.reduce((a, b) => a + b, 0) || 1; return { counts: c, off: ((t - c[0]) / t) * 100 }; });
  };

  /* ---------- Занятия ---------- */
  const SUBJECTS = [["Информатика", "ИС-21"], ["Математика", "ИС-21"], ["Программирование", "ИС-22"], ["Базы данных", "ПО-11"], ["Информатика", "ИС-22"]];
  G.lessons = [];
  G.live = null; // активная сессия
  G.nowRef = new Date();

  function mk(id, subj, group, room, start, dur, stepMin, seed, q, dipAt, dipDepth, status) {
    const n = Math.round(dur / stepMin);
    return {
      id, subject: subj, group, room, start, durMin: dur, stepMin, status: status || "done",
      frames: G.genFrames({ seed, n, stepMin, q, dipAt, dipDepth }), marks: [],
    };
  }

  G.initLessons = function () {
    const now = new Date(); now.setSeconds(0, 0); G.nowRef = now;
    const live0 = new Date(now.getTime() - 27 * 60000);
    const at = (d, h, m) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
    const L = [];
    // Архив за три недели
    const plan = [
      [1, 0, 8, 30], [1, 2, 11, 50], [2, 1, 10, 10], [3, 3, 13, 30], [4, 0, 8, 30], [4, 4, 10, 10],
      [6, 2, 11, 50], [7, 1, 8, 30], [8, 3, 10, 10], [9, 0, 13, 30], [11, 4, 11, 50], [13, 2, 8, 30],
      [14, 1, 10, 10], [15, 0, 13, 30], [16, 3, 8, 30], [18, 4, 10, 10],
    ];
    plan.forEach((p, i) => {
      const [ago, si, h, m] = p; const d = new Date(now); d.setDate(d.getDate() - ago);
      const sj = SUBJECTS[si];
      const q = 0.35 + ((i * 37) % 55) / 100;
      L.push(mk("l" + (i + 1), sj[0], sj[1], "Ауд. 214", at(d, h, m), 90, 2, 1000 + i * 17, q, 0.45 + ((i * 13) % 40) / 100, 0.12 + ((i * 7) % 20) / 100));
    });
    // Сегодня, до текущей пары
    L.push(mk("t1", "Математика", "ИС-21", "Ауд. 214", new Date(live0.getTime() - 200 * 60000), 90, 2, 777, 0.7, 0.62, 0.15));
    L.push(mk("t2", "Информатика", "ПО-11", "Ауд. 214", new Date(live0.getTime() - 100 * 60000), 90, 2, 4242, 0.5, 0.5, 0.25));
    L.sort((a, b) => b.start - a.start);
    G.lessons = L;

    // Расписание на сегодня: две пары позади, идёт «Информатика», потом «Базы данных»
    G.today = [
      { id: "t1", kind: "done" },
      { id: "t2", kind: "done" },
      { id: "now", kind: "live", subject: "Информатика", group: "ИС-21", room: "Ауд. 214", start: live0, durMin: 90 },
      { id: "next", kind: "upcoming", subject: "Базы данных", group: "ПО-11", room: "Ауд. 118", start: new Date(live0.getTime() + 100 * 60000), durMin: 90 },
    ];

    // Живая сессия: 27 минут (54 кадра по 30 с); последний кадр = фото
    const hist = G.genFrames({ seed: 9090, n: 53, stepMin: 0.5, q: 0.62, dipAt: 0.5, dipDepth: 0.1, total: 180 });
    const last = G.photoStates.slice();
    hist.push(last);
    // согласуем «хвост» с фото: у текущих отвлечённых состояния держатся несколько кадров
    last.forEach((s, i) => { if (s) { const k = 2 + ((i * 3) % 6); for (let j = 1; j <= k; j++) { if (hist.length - 1 - j >= 0) hist[hist.length - 1 - j][i] = s; } } });
    G.live = {
      lessonId: "live", subject: "Информатика", group: "ИС-21", room: "Ауд. 214",
      start: live0, durMin: 90, stepMin: 0.5, frames: hist, marks: [], events: [],
      paused: false, confs: G.propensity.map(() => 0.9), sinceChange: G.propensity.map(() => 0), seed: 31337, tick: 0, dismissedAt: -99,
    };
    seedEvents(G.live);
  };

  function seedEvents(L) {
    // Стартовые события по текущему состоянию — чтобы лента не была пустой
    const seats = G.makeSeats();
    const last = L.frames[L.frames.length - 1];
    L._open = {};
    last.forEach((s, i) => {
      if (s) {
        let run = 0; for (let j = L.frames.length - 1; j >= 0 && L.frames[j][i] === s; j--) run++;
        L._open[i] = { from: L.frames.length - run, state: s, said: true };
        L.events.push({ t: L.frames.length - run, seat: i, state: s, text: seats[i].label });
      }
    });
    L.events.sort((a, b) => b.t - a.t);
  }

  G.frameTime = (L, idx) => new Date(L.start.getTime() + idx * L.stepMin * 60000);

  /* Один новый кадр для живой сессии (с учётом поправок преподавателя) */
  G.advanceLive = function (opts) {
    const L = G.live; if (!L) return;
    const rnd = G.rng(L.seed + L.tick * 101);
    L.tick++;
    const prev = L.frames[L.frames.length - 1];
    const x = Math.min(0.99, L.frames.length / 180);
    const next = stepStates(prev, G.propensity, energy(x, 0.62, 0.5, 0.1), 1.6, rnd);
    L.frames.push(next);
    L.confs = next.map((s) => G.clamp((s === 0 ? 0.84 : 0.7) + (rnd() - 0.45) * 0.4, 0.45, 0.99));
    const minFrames = Math.max(1, Math.round(G.settings.minSec / 30));
    const idx = L.frames.length - 1;
    const seats = G.makeSeats();
    L._open = L._open || {};
    next.forEach((s, i) => {
      const o = L._open[i];
      if (s === 0) {
        if (o && o.said) L.events.unshift({ t: idx, seat: i, state: 0, text: seats[i].label, back: true });
        delete L._open[i];
        return;
      }
      if (!o || o.state !== s) L._open[i] = { from: idx, state: s, said: false };
      const cur = L._open[i];
      if (!cur.said && idx - cur.from + 1 >= minFrames) {
        cur.said = true;
        L.events.unshift({ t: idx, seat: i, state: s, text: seats[i].label });
      }
    });
    L.events = L.events.slice(0, 60);
  };

  G.runLength = function (frames, i) {
    const s = frames[frames.length - 1][i]; let r = 0;
    for (let j = frames.length - 1; j >= 0 && frames[j][i] === s; j--) r++;
    return r;
  };

  /* ---------- Комнаты ---------- */
  G.rooms = [
    { id: "214", name: "Ауд. 214", camera: "Камера над доской", source: "IP-камера · 192.168.1.40", online: true, seats: 16, setup: true, last: "5 с назад", lessons: 52 },
    { id: "118", name: "Ауд. 118", camera: "Не подключена", source: "—", online: false, seats: 0, setup: false, last: "—", lessons: 0 },
  ];
  G.seatsByRoom = { 214: G.makeSeats() };

  /* ---------- Настройки (localStorage) ---------- */
  const DEF = {
    name: "Преподаватель", email: "teacher@college.edu", theme: "system",
    blur: true, store: "off", announce: true, requireWarn: true,
    interval: 30, minSec: 60, sens: [60, 55, 70, 80],
    massPct: 40, notifySleep: true, notifyMass: true, showAll: false,
    corrections: 0,
  };
  G.settings = Object.assign({}, DEF);
  try { Object.assign(G.settings, JSON.parse(localStorage.getItem("galerka.settings") || "{}")); } catch (e) {}
  G.saveSettings = () => { try { localStorage.setItem("galerka.settings", JSON.stringify(G.settings)); } catch (e) {} };
  G.resetSettings = () => { G.settings = Object.assign({}, DEF); G.saveSettings(); };
  G.applyTheme = () => {
    const t = G.settings.theme;
    const dark = t === "dark" || (t === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  };

  /* ---------- Инсайты по архиву ---------- */
  G.insights = function () {
    const out = []; const done = G.lessons.filter((l) => l.status === "done");
    if (done.length < 3) return out;
    // 1. усталость по группам
    const byGroup = {};
    done.forEach((l) => {
      const n = l.frames.length; const a = Math.floor(n / 3);
      const first = avg(l.frames.slice(0, a).map(G.engagement)); const lastv = avg(l.frames.slice(n - a).map(G.engagement));
      (byGroup[l.group] = byGroup[l.group] || []).push(first - lastv);
    });
    let worst = null;
    Object.keys(byGroup).forEach((g) => { const d = avg(byGroup[g]); if (!worst || d > worst.d) worst = { g, d, n: byGroup[g].length }; });
    if (worst) out.push({ icon: "clock", title: "Группа " + worst.g + ": вовлечённость падает к концу пары", text: "В среднем на " + Math.round(worst.d) + " п. п. между первой и последней третью (" + worst.n + " " + G.plural(worst.n, "пара", "пары", "пар") + "). Попробуйте поставить активную часть в конец." });
    // 2. зона телефонов
    const load = new Array(16).fill(0);
    done.forEach((l) => l.frames.forEach((f) => f.forEach((s, i) => { if (s === 2) load[i]++; })));
    const seats = G.makeSeats(); const top = load.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).map((x) => seats[x[1]]);
    const rowCount = {}; top.forEach((s) => (rowCount[s.row] = (rowCount[s.row] || 0) + 1));
    const row = Object.keys(rowCount).sort((a, b) => rowCount[b] - rowCount[a])[0];
    const side = avg(top.map((s) => s.x)) > 760 ? "справа" : "слева";
    out.push({ icon: "phone", title: "Телефоны чаще всего — в ряду " + row + ", " + side, text: "Это место устойчиво в топе за три недели. Можно пересадить или проходить рядом в начале пары." });
    // 3. лучшее время
    const byHour = {}; done.forEach((l) => { const h = l.start.getHours(); (byHour[h] = byHour[h] || []).push(G.metrics(l.frames).score); });
    const hs = Object.keys(byHour).filter((h) => byHour[h].length >= 2).sort((a, b) => avg(byHour[b]) - avg(byHour[a]));
    if (hs.length) out.push({ icon: "sun", title: "Лучше всего идут пары в " + G.pad(hs[0]) + ":" + (hs[0] === "8" ? "30" : hs[0] === "10" ? "10" : hs[0] === "11" ? "50" : "30"), text: "Средняя оценка " + Math.round(avg(byHour[hs[0]])) + " из 100 — выше, чем в остальные слоты." });
    return out;
  };
  function avg(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
  G.avg = avg;

  G.getLesson = (id) => G.lessons.find((l) => l.id === id);

  /* Завершить текущую сессию → превратить в запись архива */
  G.endLive = function () {
    const L = G.live; if (!L) return null;
    const id = "l" + (G.lessons.length + 1) + "x";
    const rec = {
      id, subject: L.subject, group: L.group, room: L.room, start: L.start,
      durMin: Math.max(1, Math.round(L.frames.length * L.stepMin)), stepMin: L.stepMin,
      status: "done", frames: L.frames.slice(), marks: L.marks.slice(),
    };
    G.lessons.unshift(rec);
    const slot = G.today.find((t) => t.kind === "live");
    if (slot) { slot.kind = "done"; slot.id = id; }
    G.live = null;
    return rec;
  };

  /* Старт новой сессии */
  G.startLive = function (slot, interval) {
    const start = new Date();
    G.live = {
      lessonId: "live", subject: slot.subject, group: slot.group, room: slot.room,
      start, durMin: slot.durMin, stepMin: 0.5, frames: [G.photoStates.map(() => 0)], marks: [], events: [],
      paused: false, confs: G.propensity.map(() => 0.92), sinceChange: [], seed: Math.floor(Math.random() * 1e6), tick: 0, dismissedAt: -99, _open: {},
    };
    slot.kind = "live";
    slot.start = start;
    G.settings.interval = interval || G.settings.interval; G.saveSettings();
  };

  G.exportCSV = function (l) {
    const rows = ["время;работает;отвлечён;телефон;спит;вовлечённость_%"];
    l.frames.forEach((f, i) => {
      const c = G.countFrame(f); const t = new Date(l.start.getTime() + i * l.stepMin * 60000);
      rows.push([G.hhmm(t), c[0], c[1], c[2], c[3], Math.round(G.engagement(f))].join(";"));
    });
    return "\ufeff" + rows.join("\r\n");
  };
})();
