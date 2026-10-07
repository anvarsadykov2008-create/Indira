/* ==========================================================================
   Приложение: роутер, каркас, фоновый движок кадров, экран входа
   ========================================================================== */
(function () {
  const G = window.G; const ui = G.ui;
  G.views = {};

  /* ---------- Шина событий и подписки, которые чистятся при смене экрана ---------- */
  const bus = {}; let subs = [];
  G.emit = (e, d) => (bus[e] || []).slice().forEach((f) => f(d));
  G.sub = (e, f) => { (bus[e] = bus[e] || []).push(f); subs.push([e, f]); };
  function clearSubs() { subs.forEach(([e, f]) => { bus[e] = (bus[e] || []).filter((x) => x !== f); }); subs = []; }
  G.on = (e, f) => (bus[e] = bus[e] || []).push(f);

  /* ---------- Навигация ---------- */
  const NAV = [
    ["today", "Сегодня", "today", "#/"],
    ["live", "Наблюдение", "live", "#/live"],
    ["lessons", "Архив пар", "archive", "#/lessons"],
    ["rooms", "Кабинеты", "rooms", "#/rooms"],
    ["settings", "Настройки", "settings", "#/settings"],
  ];
  const isAuth = () => localStorage.getItem("galerka.auth") === "1";
  G.go = (h) => { if (location.hash === h) route(); else location.hash = h; };

  const MARK = '<svg class="brand-mark" viewBox="0 0 26 26" aria-hidden="true"><rect x="2" y="17" width="7" height="7" rx="2" fill="currentColor"/><rect x="9.5" y="9.5" width="7" height="7" rx="2" fill="currentColor"/><rect x="17" y="2" width="7" height="7" rx="2" fill="var(--st-1)"/></svg>';
  G.MARK = MARK;

  let mode = null; // 'shell' | 'login'
  function buildShell() {
    const name = G.settings.name || "Преподаватель";
    document.getElementById("root").innerHTML =
      '<div class="app">' +
      '<aside class="sidebar"><a class="brand" href="#/" aria-label="Галёрка — на главную">' + MARK + '<span class="brand-name">Галёрка</span></a>' +
      '<nav class="nav" aria-label="Основная навигация">' + NAV.map((n) => '<a href="' + n[3] + '" data-nav="' + n[0] + '">' + ui.icon(n[2]) + "<span>" + n[1] + "</span>" + (n[0] === "live" ? '<i class="live-dot" hidden></i>' : "") + "</a>").join("") + "</nav>" +
      '<div class="sidebar-foot"><div class="avatar" id="av">' + G.esc(name[0].toUpperCase()) + '</div><div class="who"><b id="who-name">' + G.esc(name) + '</b><span>Кабинет 214</span></div>' +
      '<button class="btn ghost icon-btn sm" id="logout" style="margin-left:auto" aria-label="Выйти" title="Выйти">' + ui.icon("logout") + "</button></div></aside>" +
      '<main class="main" id="main" tabindex="-1"></main></div>' +
      '<nav class="tabbar" aria-label="Основная навигация">' + NAV.map((n) => '<a href="' + n[3] + '" data-nav="' + n[0] + '">' + ui.icon(n[2]) + "<span>" + (n[0] === "lessons" ? "Архив" : n[0] === "settings" ? "Ещё" : n[1]) + "</span>" + (n[0] === "live" ? '<i class="live-dot" hidden></i>' : "") + "</a>").join("") + "</nav>";
    document.getElementById("logout").onclick = async () => {
      if (await ui.confirm({ title: "Выйти из аккаунта?", text: "Наблюдение за идущей парой продолжится в фоне.", ok: "Выйти" })) { localStorage.removeItem("galerka.auth"); G.go("#/login"); }
    };
    mode = "shell"; syncNavDot();
  }
  G.refreshProfile = () => {
    const n = G.settings.name || "Преподаватель";
    const a = document.getElementById("av"), w = document.getElementById("who-name");
    if (a) a.textContent = n[0].toUpperCase(); if (w) w.textContent = n;
  };
  function syncNavDot() { document.querySelectorAll(".live-dot").forEach((d) => (d.hidden = !G.live)); }
  G.syncNavDot = syncNavDot;

  /* ---------- Роутер ---------- */
  let current = null;
  function parse() {
    const seg = (location.hash.replace(/^#/, "") || "/").split("/").filter(Boolean);
    const p = seg[0] || "today";
    if (p === "login") return { v: "login", nav: null, title: "Вход" };
    if (p === "live") return { v: "live", nav: "live", title: "Наблюдение" };
    if (p === "lessons" && seg[1]) return { v: "report", nav: "lessons", id: decodeURIComponent(seg[1]), title: "Отчёт по паре" };
    if (p === "lessons") return { v: "lessons", nav: "lessons", title: "Архив пар" };
    if (p === "rooms" && seg[1] && seg[2] === "seats") return { v: "seats", nav: "rooms", id: seg[1], title: "Разметка мест" };
    if (p === "rooms") return { v: "rooms", nav: "rooms", title: "Кабинеты" };
    if (p === "settings") return { v: "settings", nav: "settings", title: "Настройки" };
    return { v: "today", nav: "today", title: "Сегодня" };
  }

  function route() {
    const r = parse();
    if (current && current.unmount) { try { current.unmount(); } catch (e) {} }
    clearSubs(); current = null;
    if (r.v !== "login" && !isAuth()) { location.hash = "#/login"; return; }
    if (r.v === "login" && isAuth()) { location.hash = "#/"; return; }
    document.title = r.title + " — Галёрка";

    if (r.v === "login") {
      mode = "login";
      document.getElementById("root").innerHTML = G.views.login.render().html;
      G.views.login.mount(document.getElementById("root"));
      return;
    }
    if (mode !== "shell") buildShell();
    document.querySelectorAll("[data-nav]").forEach((a) => (a.dataset.nav === r.nav ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    const main = document.getElementById("main");
    const view = G.views[r.v];
    const out = view.render(r);
    main.innerHTML = out.html;
    current = { unmount: out.unmount };
    if (out.mount) out.mount(main, r);
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
    syncNavDot();
  }
  window.addEventListener("hashchange", route);

  /* ---------- Фоновый «движок» кадров ---------- */
  G.FRAME_MS = 4500; // в демо кадры идут быстрее, чем раз в 30 секунд
  G.nextFrameAt = Date.now() + G.FRAME_MS;
  G.tickNow = function () {
    if (!G.live) return;
    G.advanceLive(); G.nextFrameAt = Date.now() + G.FRAME_MS; G.emit("frame");
  };
  setInterval(() => {
    if (G.live && !G.live.paused && Date.now() >= G.nextFrameAt) G.tickNow();
  }, 500);

  /* ---------- Горячие клавиши ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input,textarea,select,[contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector(".overlay")) return;
    G.emit("key", e);
  });

  /* ---------- Экран входа ---------- */
  G.views.login = {
    render() {
      return {
        html:
          '<div class="login"><section class="login-art"><div class="row" style="gap:10px;color:#fff">' + MARK.replace('class="brand-mark"', 'class="brand-mark" style="color:#fff"') + '<span class="brand-name">Галёрка</span></div>' +
          '<div><h1>Видно, где нужна ваша помощь</h1><ul>' +
          '<li>' + ui.icon("eyeoff") + "<div><b>Не узнаёт лиц.</b> Только состояние: работает, отвлёкся, телефон, спит. Лица можно скрыть прямо на экране.</div></li>" +
          '<li>' + ui.icon("users") + "<div><b>Подсказывает, а не судит.</b> Вы сами понимаете, кто на какой парте, и решаете, что с этим делать.</div></li>" +
          '<li>' + ui.icon("lock") + "<div><b>Кадры не хранятся</b> по умолчанию. Остаются только цифры по паре.</div></li></ul></div>" +
          '<div class="login-rows" aria-hidden="true"><div><i></i><i></i><i></i></div><div><i></i><i></i><i></i><i></i></div><div><i></i><i></i><i></i></div></div></section>' +
          '<section class="login-form"><form id="lf" novalidate><div><h2>С возвращением</h2><p class="muted" style="margin-top:6px">Войдите, чтобы открыть расписание и наблюдение.</p></div>' +
          '<div class="field"><label for="em">Почта</label><input class="input" id="em" type="email" autocomplete="username" value="' + G.esc(G.settings.email) + '"></div>' +
          '<div class="field"><label for="pw">Пароль</label><input class="input" id="pw" type="password" autocomplete="current-password" value="demo-password"><span class="hint">Это демо: данные уже подставлены.</span></div>' +
          '<div class="field"><div class="login-err" id="le" role="alert" style="color:var(--danger);font-size:14px;min-height:20px"></div><button class="btn primary lg" type="submit">Войти</button></div></form></section></div>',
      };
    },
    mount(root) {
      root.querySelector("#lf").addEventListener("submit", (e) => {
        e.preventDefault();
        const em = root.querySelector("#em").value.trim(); const pw = root.querySelector("#pw").value;
        const err = root.querySelector("#le");
        if (!/^\S+@\S+\.\S+$/.test(em)) { err.textContent = "Проверьте почту: нужен адрес вида name@college.edu"; root.querySelector("#em").focus(); return; }
        if (pw.length < 4) { err.textContent = "Пароль слишком короткий."; root.querySelector("#pw").focus(); return; }
        G.settings.email = em; G.saveSettings(); localStorage.setItem("galerka.auth", "1"); mode = null; G.go("#/");
      });
      root.querySelector("#em").focus();
    },
  };

  /* ---------- Старт ---------- */
  G.boot = function () {
    if (/[?&]dev\b/.test(location.search)) localStorage.setItem("galerka.auth", "1");
    G.applyTheme();
    if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", G.applyTheme);
    G.initLessons();
    if (!location.hash) history.replaceState(null, "", location.pathname + location.search + "#/");
    route();
  };
})();
