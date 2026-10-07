/* ==========================================================================
   Экраны «Кабинеты» и «Разметка мест»
   ========================================================================== */
(function () {
  const G = window.G; const ui = G.ui; const esc = G.esc; const IMG = G.IMG;
  const pc = (v, t) => (v / t) * 100 + "%";

  /* ---------- Мастер подключения кабинета ---------- */
  function wizard(existing) {
    const S = { step: 1, type: "ip", name: existing ? existing.name : "", url: "", err: "", testing: false, ok: false };
    const types = [
      ["ip", "cam", "IP-камера", "Камера с сетевым адресом (RTSP). Лучший вариант для постоянной установки."],
      ["usb", "usb", "USB-камера или веб-камера", "Подключена к компьютеру в кабинете."],
      ["phone", "mobile", "Телефон как камера", "Запасной вариант: поставьте телефон на штатив и откройте ссылку."],
    ];
    const m = ui.modal({ title: "Подключить кабинет", sub: "", body: "", foot: "" });
    const head = m.el.querySelector(".modal-head p") || (() => { const p = document.createElement("p"); m.el.querySelector(".modal-head div").appendChild(p); return p; })();
    const body = m.el.querySelector(".modal-body"); const foot = m.el.querySelector(".modal-foot");

    function render() {
      const dots = '<div class="steps" aria-label="Шаг ' + S.step + ' из 3">' + [1, 2, 3].map((i) => '<i class="' + (i <= S.step ? "on" : "") + '"></i>').join("") + "</div>";
      if (S.step === 1) {
        head.textContent = "Шаг 1 из 3 · Откуда брать картинку";
        body.innerHTML = dots + '<div class="field"><label for="rn">Название кабинета</label><input class="input" id="rn" value="' + esc(S.name) + '" placeholder="Например, Ауд. 305" data-autofocus></div>' +
          '<div class="field" role="radiogroup" aria-label="Тип камеры"><span class="label">Тип камеры</span><div class="stack" style="gap:8px">' + types.map((t) => '<button type="button" class="choice" role="radio" aria-checked="' + (S.type === t[0]) + '" data-t="' + t[0] + '">' + ui.icon(t[1]) + "<div><b>" + t[2] + "</b><span>" + t[3] + "</span></div></button>").join("") + "</div></div>" +
          (S.type === "ip" ? '<div class="field"><label for="ru">Адрес потока</label><input class="input" id="ru" value="' + esc(S.url) + '" placeholder="rtsp://192.168.1.40:554/stream"><span class="hint">Адрес указан в инструкции камеры или в её веб-панели.</span></div>' : "") +
          '<div class="login-err" id="werr" role="alert" style="color:var(--danger);font-size:14px;min-height:18px">' + esc(S.err) + "</div>";
        foot.innerHTML = '<button class="btn" data-close>Отмена</button><button class="btn primary" id="next">Проверить подключение ' + ui.icon("right", "sm") + "</button>";
        body.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { S.name = body.querySelector("#rn").value; S.type = b.dataset.t; S.err = ""; render(); }));
        foot.querySelector("#next").onclick = () => {
          S.name = body.querySelector("#rn").value.trim(); const u = body.querySelector("#ru"); S.url = u ? u.value.trim() : "";
          if (!S.name) { S.err = "Укажите название кабинета."; render(); body.querySelector("#rn").focus(); return; }
          if (G.rooms.some((r) => r.name.toLowerCase() === S.name.toLowerCase() && r !== existing)) { S.err = "Кабинет с таким названием уже есть."; render(); return; }
          if (S.type === "ip" && !/^(rtsp|http|https):\/\/\S+/i.test(S.url)) { S.err = "Адрес должен начинаться с rtsp:// или http://"; render(); body.querySelector("#ru").focus(); return; }
          S.err = ""; S.step = 2; S.testing = true; S.ok = false; render(); setTimeout(() => { S.testing = false; S.ok = true; render(); }, 1600);
        };
      } else if (S.step === 2) {
        head.textContent = "Шаг 2 из 3 · Проверка кадра";
        body.innerHTML = dots + (S.testing
          ? '<div class="card" style="padding:44px 20px;text-align:center;background:var(--surface-2)"><div class="muted" style="margin-bottom:6px" role="status">Подключаемся к «' + esc(S.name) + '»…</div><div style="width:160px;height:4px;border-radius:9px;background:var(--line);margin:12px auto;overflow:hidden"><i style="display:block;height:100%;width:40%;background:var(--accent);border-radius:9px;animation:slide 1.1s infinite ease-in-out alternate"></i></div></div><style>@keyframes slide{from{transform:translateX(-30%)}to{transform:translateX(280%)}}</style>'
          : '<div class="row" style="gap:8px;color:var(--st-0);font-weight:600">' + ui.icon("check") + 'Камера отвечает, кадр получен</div><div style="border-radius:12px;overflow:hidden;border:1px solid var(--line)"><img src="' + IMG.src + '" alt="Тестовый кадр"></div><p class="muted" style="font-size:14px">Проверьте, что видны все парты и лица не закрыты. Идеально — камера над доской, чуть выше голов.</p>');
        foot.innerHTML = '<button class="btn" id="back">' + ui.icon("left", "sm") + ' Назад</button><button class="btn primary" id="next"' + (S.testing ? " disabled" : "") + ">Всё видно " + ui.icon("right", "sm") + "</button>";
        foot.querySelector("#back").onclick = () => { S.step = 1; render(); };
        foot.querySelector("#next").onclick = () => { S.step = 3; S.found = null; render(); setTimeout(() => { S.found = 16; render(); }, 1200); };
      } else {
        head.textContent = "Шаг 3 из 3 · Места";
        body.innerHTML = dots + (S.found == null
          ? '<div class="card" style="padding:44px 20px;text-align:center;background:var(--surface-2)"><div class="muted" role="status">Ищем парты и места на кадре…</div></div>'
          : '<div class="row" style="gap:8px;color:var(--st-0);font-weight:600">' + ui.icon("wand") + "Найдено мест: " + S.found + '</div><p class="muted" style="font-size:14.5px">Мы расставили рамки автоматически. На следующем экране можно подвинуть, добавить или удалить лишние — это нужно, чтобы вы потом понимали, где кто сидит.</p>');
        foot.innerHTML = '<button class="btn" id="back">' + ui.icon("left", "sm") + ' Назад</button><button class="btn primary" id="done"' + (S.found == null ? " disabled" : "") + ">Перейти к разметке</button>";
        foot.querySelector("#back").onclick = () => { S.step = 2; render(); };
        foot.querySelector("#done").onclick = () => {
          let room = existing;
          if (!room) { room = { id: String(Date.now()).slice(-5), name: S.name, lessons: 0 }; G.rooms.push(room); }
          Object.assign(room, { name: S.name, camera: S.type === "ip" ? "IP-камера" : S.type === "usb" ? "USB-камера" : "Телефон как камера", source: S.type === "ip" ? S.url : S.type === "usb" ? "USB · Camera 0" : "Мобильная ссылка", online: true, setup: true, seats: 16, last: "только что" });
          G.seatsByRoom[room.id] = G.makeSeats();
          m.close(); ui.toast("Кабинет «" + room.name + "» подключён"); G.go("#/rooms/" + room.id + "/seats");
        };
      }
    }
    render();
  }

  /* ---------- Кабинеты ---------- */
  G.views.rooms = {
    render() {
      const cards = G.rooms.map((r) => {
        const thumb = r.online ? '<img src="' + IMG.src + '" alt="Последний кадр из ' + esc(r.name) + '"><span class="chip ok">В сети</span>' : '<div style="text-align:center">' + ui.icon("wifi") + '<div style="font-size:14px;margin-top:6px">Нет сигнала</div></div><span class="chip warn">Не настроен</span>';
        return '<article class="card room" data-id="' + r.id + '"><div class="thumb">' + thumb + '</div><div class="body"><h3>' + esc(r.name) + "</h3><dl><dt>Камера</dt><dd>" + esc(r.camera) + "</dd><dt>Источник</dt><dd class=\"num\" style=\"overflow-wrap:anywhere\">" + esc(r.source) + "</dd><dt>Мест</dt><dd>" + (r.seats || "—") + "</dd><dt>Последний кадр</dt><dd>" + esc(r.last) + "</dd></dl>" +
          (r.setup ? '<div class="row wrap"><a class="btn primary sm" href="#/rooms/' + r.id + '/seats">' + ui.icon("grid", "sm") + ' Разметка мест</a><button class="btn sm" data-test="' + r.id + '">' + ui.icon("refresh", "sm") + ' Проверить камеру</button><button class="btn ghost sm icon-btn" data-del="' + r.id + '" aria-label="Удалить кабинет ' + esc(r.name) + '" title="Удалить">' + ui.icon("trash", "sm") + "</button></div>" : '<div class="row wrap"><button class="btn primary sm" data-setup="' + r.id + '">' + ui.icon("plus", "sm") + ' Подключить камеру</button><button class="btn ghost sm icon-btn" data-del="' + r.id + '" aria-label="Удалить кабинет ' + esc(r.name) + '" title="Удалить">' + ui.icon("trash", "sm") + "</button></div>") + "</div></article>";
      }).join("");
      return {
        html: '<div class="page-head"><div><h1>Кабинеты</h1><p class="sub">Камеры и расстановка мест</p></div><div class="actions"><button class="btn primary" id="add">' + ui.icon("plus", "sm") + " Добавить кабинет</button></div></div>" +
          (G.rooms.length ? '<div class="rooms">' + cards + "</div>" : '<div class="card empty"><div class="art">' + ui.icon("rooms") + "</div><h3>Пока нет ни одного кабинета</h3><p>Подключите камеру — и можно начинать наблюдение за парами.</p><button class=\"btn primary\" id=\"add2\">" + ui.icon("plus", "sm") + " Добавить кабинет</button></div>") +
          '<section class="card card-pad" style="margin-top:20px"><div class="card-head"><h2>Где лучше повесить камеру</h2></div><div class="grid three" style="gap:24px">' +
          [["Над доской, чуть выше голов", "Так видны лица и позы всей группы, а парты не загораживают друг друга."], ["Без контражура", "Не направляйте камеру на окна: на ярком фоне позы определяются хуже."], ["Не сзади класса", "Затылки почти не показывают, спит студент или смотрит в телефон."]].map((x) => '<div><b style="font-weight:620">' + x[0] + '</b><p class="muted" style="font-size:14.5px;margin-top:4px">' + x[1] + "</p></div>").join("") + "</div></section>",
        mount(root) {
          const add = root.querySelector("#add"), add2 = root.querySelector("#add2");
          if (add) add.onclick = () => wizard(); if (add2) add2.onclick = () => wizard();
          root.addEventListener("click", async (e) => {
            const s = e.target.closest("[data-setup]"); if (s) { wizard(G.rooms.find((r) => r.id === s.dataset.setup)); return; }
            const t = e.target.closest("[data-test]");
            if (t) { t.disabled = true; t.innerHTML = ui.icon("refresh", "sm") + " Проверяем…"; setTimeout(() => { t.disabled = false; t.innerHTML = ui.icon("refresh", "sm") + " Проверить камеру"; ui.toast("Камера отвечает: кадр получен за 0,4 с"); }, 1100); return; }
            const d = e.target.closest("[data-del]");
            if (d) {
              const r = G.rooms.find((x) => x.id === d.dataset.del);
              if (G.live && G.live.room === r.name) { ui.toast("Сначала завершите наблюдение в этом кабинете"); return; }
              if (await ui.confirm({ title: "Удалить «" + r.name + "»?", text: "Настройки камеры и разметка мест будут удалены. Архив пар останется.", ok: "Удалить", danger: true })) { G.rooms = G.rooms.filter((x) => x !== r); G.go("#/rooms"); ui.toast("Кабинет удалён"); }
            }
          });
        },
      };
    },
  };

  /* ---------- Редактор мест ---------- */
  G.views.seats = {
    render(r) {
      const room = G.rooms.find((x) => x.id === r.id);
      if (!room || !room.setup) return { html: '<div class="card empty"><div class="art">' + ui.icon("grid") + "</div><h3>Кабинет ещё не настроен</h3><p>Сначала подключите камеру.</p><a class=\"btn primary\" href=\"#/rooms\">К кабинетам</a></div>" };
      return {
        html: '<a class="crumb" href="#/rooms">' + ui.icon("left", "sm") + " Кабинеты</a>" +
          '<div class="page-head"><div><h1>Разметка мест · ' + esc(room.name) + '</h1><p class="sub">Рамки помогают быстро понимать, о ком речь: вы сами знаете, кто где сидит</p></div><div class="actions"><button class="btn" id="auto">' + ui.icon("wand", "sm") + ' Найти места заново</button><button class="btn primary" id="save">' + ui.icon("check", "sm") + " Сохранить</button></div></div>" +
          '<div class="editor"><section class="card" style="overflow:hidden"><div class="stage-bar"><div class="left"><button class="btn sm" id="addmode">' + ui.icon("plus", "sm") + ' Добавить место</button><span class="muted" id="hint" style="font-size:14px">Перетаскивайте рамки, тяните за угол, чтобы изменить размер.</span></div><div class="right"><span class="chip" id="cnt"></span></div></div><div class="ed-stage" id="es"><img src="' + IMG.src + '" alt="Кадр кабинета для разметки"><div id="eb"></div></div></section>' +
          '<aside class="card card-pad"><div class="panel-title"><h2>Места</h2></div><div class="seat-list" id="sl" role="listbox" aria-label="Список мест"></div><hr class="divider"><div id="sd"></div></aside></div>',
        mount(root) {
          let seats = (G.seatsByRoom[room.id] || G.makeSeats()).map((s) => Object.assign({}, s));
          let sel = null, adding = false, dirty = false;
          const $ = (s) => root.querySelector(s); const es = $("#es");
          const label = (s) => "Ряд " + s.row + ", место " + s.place;
          function paint() {
            $("#cnt").textContent = seats.length + " " + G.plural(seats.length, "место", "места", "мест");
            $("#eb").innerHTML = seats.map((s, i) => '<div class="ed-box ' + (sel === i ? "sel" : "") + '" data-i="' + i + '" style="left:' + pc(s.x, IMG.w) + ";top:" + pc(s.y, IMG.h) + ";width:" + pc(s.w, IMG.w) + ";height:" + pc(s.h, IMG.h) + '"><span class="lab">' + G.seatShort(s) + '</span><i class="grip" data-grip></i></div>').join("");
            $("#sl").innerHTML = seats.map((s, i) => '<button type="button" class="seat-item" role="option" data-pick="' + i + '" aria-current="' + (sel === i) + '">' + ui.icon("grid", "sm") + "<span>" + esc(label(s)) + "</span></button>").join("") || '<p class="muted" style="font-size:14px">Мест нет. Нажмите «Добавить место» и кликните по кадру.</p>';
            const d = $("#sd");
            if (sel == null) { d.innerHTML = '<p class="muted" style="font-size:14px">Выберите место на кадре или в списке, чтобы изменить номер ряда и места.</p>'; return; }
            const s = seats[sel];
            d.innerHTML = '<div class="grid" style="grid-template-columns:1fr 1fr;gap:12px"><div class="field"><label for="er">Ряд</label><input class="input" id="er" type="number" min="1" max="20" value="' + s.row + '"></div><div class="field"><label for="ep">Место</label><input class="input" id="ep" type="number" min="1" max="30" value="' + s.place + '"></div></div><button class="btn danger sm" id="rm" style="margin-top:14px">' + ui.icon("trash", "sm") + " Удалить место</button>";
            $("#er").oninput = (e) => { s.row = G.clamp(+e.target.value || 1, 1, 20); s.label = label(s); dirty = true; softPaint(); };
            $("#ep").oninput = (e) => { s.place = G.clamp(+e.target.value || 1, 1, 30); s.label = label(s); dirty = true; softPaint(); };
            $("#rm").onclick = () => { seats.splice(sel, 1); sel = null; dirty = true; paint(); ui.toast("Место удалено"); };
          }
          function softPaint() { $("#eb").querySelectorAll(".lab").forEach((l, i) => (l.textContent = G.seatShort(seats[i]))); $("#sl").querySelectorAll(".seat-item span").forEach((l, i) => (l.textContent = label(seats[i]))); }

          function toImg(ev) { const r = es.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * IMG.w, ((ev.clientY - r.top) / r.height) * IMG.h]; }
          es.addEventListener("pointerdown", (e) => {
            if (adding) {
              const [x, y] = toImg(e); const row = seats.length ? Math.max(...seats.map((s) => s.row)) : 1;
              const n = seats.filter((s) => s.row === row).length + 1;
              seats.push({ id: "n" + Date.now(), row, place: n, x: Math.max(0, x - 55), y: Math.max(0, y - 55), w: 110, h: 110, label: "" });
              sel = seats.length - 1; adding = false; es.classList.remove("adding"); $("#addmode").classList.remove("primary"); $("#hint").textContent = "Перетаскивайте рамки, тяните за угол, чтобы изменить размер."; dirty = true; paint(); return;
            }
            const b = e.target.closest(".ed-box"); if (!b) { sel = null; paint(); return; }
            const i = +b.dataset.i; sel = i; const s = seats[i]; const grip = !!e.target.closest("[data-grip]");
            const [sx, sy] = toImg(e); const o = { x: s.x, y: s.y, w: s.w, h: s.h };
            es.setPointerCapture(e.pointerId); b.parentNode.querySelectorAll(".ed-box").forEach((x) => x.classList.toggle("sel", x === b));
            const mv = (ev) => {
              const [cx, cy] = toImg(ev);
              if (grip) { s.w = G.clamp(o.w + cx - sx, 30, IMG.w - s.x); s.h = G.clamp(o.h + cy - sy, 30, IMG.h - s.y); }
              else { s.x = G.clamp(o.x + cx - sx, 0, IMG.w - s.w); s.y = G.clamp(o.y + cy - sy, 0, IMG.h - s.h); }
              b.style.left = pc(s.x, IMG.w); b.style.top = pc(s.y, IMG.h); b.style.width = pc(s.w, IMG.w); b.style.height = pc(s.h, IMG.h); dirty = true;
            };
            const up = () => { es.removeEventListener("pointermove", mv); es.removeEventListener("pointerup", up); paint(); };
            es.addEventListener("pointermove", mv); es.addEventListener("pointerup", up);
            paint2(); e.preventDefault();
          });
          function paint2() { /* выбор без перерисовки, чтобы не сбить перетаскивание */ $("#sl").querySelectorAll(".seat-item").forEach((x, k) => x.setAttribute("aria-current", k === sel)); }
          $("#sl").addEventListener("click", (e) => { const b = e.target.closest("[data-pick]"); if (b) { sel = +b.dataset.pick; paint(); } });
          $("#addmode").onclick = () => { adding = !adding; es.classList.toggle("adding", adding); $("#addmode").classList.toggle("primary", adding); $("#hint").textContent = adding ? "Кликните по кадру там, где сидит студент." : "Перетаскивайте рамки, тяните за угол, чтобы изменить размер."; };
          root.addEventListener("keydown", (e) => {
            if (sel != null && !e.target.closest("input") && (e.key === "Delete" || e.key === "Backspace")) { seats.splice(sel, 1); sel = null; dirty = true; paint(); }
          });
          $("#auto").onclick = async () => {
            if (dirty && !(await ui.confirm({ title: "Найти места заново?", text: "Текущая разметка будет заменена автоматической.", ok: "Заменить" }))) return;
            seats = G.makeSeats(); sel = null; dirty = true; paint(); ui.toast("Найдено мест: " + seats.length);
          };
          $("#save").onclick = () => { G.seatsByRoom[room.id] = seats.map((s) => Object.assign({}, s, { label: label(s) })); room.seats = seats.length; dirty = false; ui.toast("Разметка сохранена"); G.go("#/rooms"); };
          window.onbeforeunload = null;
          paint();
        },
      };
    },
  };
})();
