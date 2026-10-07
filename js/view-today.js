/* ==========================================================================
   Экран «Сегодня» + окно запуска наблюдения
   ========================================================================== */
(function () {
  const G = window.G; const ui = G.ui; const esc = G.esc;

  const endOf = (l) => new Date(l.start.getTime() + l.durMin * 60000);
  const range = (l) => G.hhmm(l.start) + "–" + G.hhmm(endOf(l));

  /* ---------- Запуск наблюдения ---------- */
  G.openStart = function (slot) {
    if (G.live) {
      ui.modal({
        title: "Наблюдение уже идёт",
        sub: "Сейчас наблюдаем за парой «" + esc(G.live.subject) + "», " + esc(G.live.group) + ". Завершите её, чтобы начать новую.",
        foot: '<button class="btn" data-close>Позже</button><a class="btn primary" href="#/live" data-close>Открыть наблюдение</a>',
        onMount: (ov, close) => ov.querySelector("a.btn").addEventListener("click", () => close()),
      });
      return;
    }
    const roomsOpts = G.rooms.map((r) => '<option value="' + esc(r.name) + '"' + (r.name === slot.room ? " selected" : "") + ">" + esc(r.name) + (r.setup ? "" : " — не настроен") + "</option>").join("");
    let interval = G.settings.interval; let room = slot.room;
    const m = ui.modal({
      title: "Начать наблюдение",
      sub: esc(slot.subject) + " · " + esc(slot.group) + " · " + range(slot),
      body:
        '<div class="field"><label for="sr">Кабинет</label><select class="select" id="sr">' + roomsOpts + "</select></div>" +
        '<div id="rwarn"></div>' +
        '<div class="field"><span class="label">Как часто делать кадр</span>' + ui.segHTML("int", [[15, "15 с"], [30, "30 с"], [60, "1 мин"]], interval) + '<span class="hint">Чаще кадры дают точнее картину, но сильнее нагружают камеру и компьютер.</span></div>' +
        (G.settings.requireWarn ? '<label class="check"><input type="checkbox" id="warned"><span><b style="font-weight:600">Я предупредил(а) группу о наблюдении</b><br><span class="muted" style="font-size:14px">Студенты должны знать, что в кабинете работает система. <a href="#/settings" data-close style="color:var(--accent)">Текст объявления</a></span></span></label>' : ""),
      foot: '<button class="btn" data-close>Отмена</button><button class="btn primary" id="go">' + ui.icon("play", "sm") + " Начать</button>",
      onMount(ov, close) {
        const go = ov.querySelector("#go"); const w = ov.querySelector("#warned"); const warn = ov.querySelector("#rwarn");
        function check() {
          const r = G.rooms.find((x) => x.name === room);
          warn.innerHTML = r && !r.setup ? '<div class="banner"><span>' + ui.icon("alert") + '</span><div><b>В кабинете «' + esc(r.name) + '» ещё нет камеры</b>Подключите её и разметьте места — это займёт пару минут. <a href="#/rooms" data-close style="color:inherit;font-weight:600">Настроить</a></div></div>' : "";
          go.disabled = !!(r && !r.setup) || (w && !w.checked);
        }
        ov.querySelector("#sr").onchange = (e) => { room = e.target.value; check(); };
        ui.segBind(ov, "int", (v) => (interval = +v));
        if (w) w.onchange = check;
        ov.querySelectorAll("a[data-close]").forEach((a) => a.addEventListener("click", () => close()));
        check();
        go.onclick = () => {
          slot.room = room; G.startLive(slot, interval); close(); G.syncNavDot(); ui.toast("Наблюдение началось. Первый кадр уже в пути."); G.go("#/live");
        };
      },
    });
  };

  /* ---------- Экран ---------- */
  G.views.today = {
    render() {
      const now = new Date(); const live = G.live;
      const upcoming = G.today.filter((t) => t.kind === "upcoming");
      const nextSlot = upcoming[0];
      let hero;
      if (live) {
        const eng = Math.round(G.engagement(live.frames[live.frames.length - 1]));
        const el = Math.round(live.frames.length * live.stepMin);
        hero =
          '<section class="card hero" aria-label="Идущая пара"><div><span class="chip live">Идёт сейчас</span><h2>' + esc(live.subject) + " · " + esc(live.group) + '</h2><div class="meta"><span>' + ui.icon("rooms", "sm") + esc(live.room) + "</span><span>" + ui.icon("clock", "sm") + range(live) + "</span><span>Прошло " + el + " мин</span></div></div>" +
          '<div class="cta"><div style="text-align:right"><div class="big-num num" id="hero-eng">' + eng + '<small>%</small></div><div class="muted" style="font-size:14px">работают прямо сейчас</div></div><a class="btn primary lg" href="#/live">Открыть наблюдение ' + ui.icon("right", "sm") + "</a></div></section>";
      } else if (nextSlot) {
        hero =
          '<section class="card hero"><div><span class="eyebrow">Следующая пара</span><h2>' + esc(nextSlot.subject) + " · " + esc(nextSlot.group) + '</h2><div class="meta"><span>' + ui.icon("rooms", "sm") + esc(nextSlot.room) + "</span><span>" + ui.icon("clock", "sm") + range(nextSlot) + "</span></div></div>" +
          '<div class="cta"><button class="btn primary lg" data-start="' + nextSlot.id + '">' + ui.icon("play", "sm") + " Начать наблюдение</button></div></section>";
      } else {
        hero = '<section class="card hero"><div><span class="eyebrow">На сегодня всё</span><h2>Пар больше нет</h2><div class="meta"><span>Посмотрите, как прошли сегодняшние, в архиве.</span></div></div><div class="cta"><a class="btn lg" href="#/lessons">Открыть архив</a></div></section>';
      }

      const rows = G.today.map((t) => {
        if (t.kind === "done") {
          const l = G.getLesson(t.id); if (!l) return "";
          const s = G.metrics(l.frames).score;
          return '<li><div class="time">' + G.hhmm(l.start) + "<small>до " + G.hhmm(endOf(l)) + '</small></div><div class="what"><b>' + esc(l.subject) + " · " + esc(l.group) + "</b><span>" + esc(l.room) + '</span></div><div class="act row">' + ui.scoreChip(s) + '<a class="btn sm" href="#/lessons/' + l.id + '">Отчёт</a></div></li>';
        }
        if (t.kind === "live") {
          return '<li class="now"><div class="time">' + G.hhmm(t.start) + "<small>до " + G.hhmm(endOf(t)) + '</small></div><div class="what"><b>' + esc(t.subject) + " · " + esc(t.group) + "</b><span>" + esc(t.room) + '</span></div><div class="act row"><span class="chip live">Идёт</span><a class="btn sm primary" href="#/live">Открыть</a></div></li>';
        }
        const r = G.rooms.find((x) => x.name === t.room);
        return '<li><div class="time">' + G.hhmm(t.start) + "<small>до " + G.hhmm(endOf(t)) + '</small></div><div class="what"><b>' + esc(t.subject) + " · " + esc(t.group) + "</b><span>" + esc(t.room) + (r && !r.setup ? ' · <span style="color:var(--st-1);font-weight:550">камера не настроена</span>' : "") + '</span></div><div class="act"><button class="btn sm" data-start="' + t.id + '">Начать</button></div></li>';
      }).join("");

      // неделя
      const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); days.push(d); }
      const vals = days.map((d) => { const ls = G.lessons.filter((l) => G.sameDay(l.start, d)); return ls.length ? G.avg(ls.map((l) => G.metrics(l.frames).score)) : null; });
      const labels = days.map((d) => G.fmtDayShort(d));
      const have = vals.filter((v) => v != null);
      const wavg = have.length ? Math.round(G.avg(have)) : null;

      const ins = G.insights();
      const r118 = G.rooms.find((r) => r.id === "118");
      const items = [
        ["Камера подключена", "Ауд. 214 передаёт кадры", true],
        ["Места размечены", "16 мест в кабинете 214", true],
        ["Настроить кабинет 118", "Нужна камера и разметка мест", !!(r118 && r118.setup), "#/rooms"],
        ["Предупредить студентов", "Распечатайте объявление и повесьте у двери", false, "#/settings"],
      ];
      const allDone = items.every((i) => i[2]);

      return {
        html:
          '<div class="page-head"><div><h1>Сегодня</h1><p class="sub">' + G.fmtDateLong(now) + "</p></div></div>" +
          '<div class="stack">' + hero +
          '<div class="grid two"><section class="card card-pad" aria-labelledby="sch"><div class="card-head"><h2 id="sch">Расписание</h2><span class="muted" style="font-size:14px">' + G.today.length + " " + G.plural(G.today.length, "пара", "пары", "пар") + "</span></div><ul class=\"sched\">" + rows + "</ul></section>" +
          '<div class="stack"><section class="card card-pad"><div class="card-head"><h2>Неделя</h2>' + (wavg != null ? '<span class="muted" style="font-size:14px">в среднем ' + wavg + "</span>" : "") + '</div>' + ui.bars(vals, labels, 6, 150) + '<p class="muted" style="font-size:13.5px;margin-top:8px">Средняя оценка пар по дням. Оценка — ориентир по вовлечённости группы, а не по людям.</p></section>' +
          (allDone ? "" : '<section class="card card-pad"><div class="card-head"><h2>Что осталось настроить</h2></div><ul class="checklist">' + items.map((i) => '<li class="' + (i[2] ? "done" : "") + '"><span class="tick">' + (i[2] ? ui.icon("check") : "") + "</span><div><b style=\"font-weight:600\">" + (i[3] && !i[2] ? '<a href="' + i[3] + '" style="color:var(--accent)">' + i[0] + "</a>" : i[0]) + "</b><span>" + i[1] + "</span></div></li>").join("") + "</ul></section>") +
          "</div></div>" +
          '<section class="card card-pad"><div class="card-head"><h2>Что видно за три недели</h2><a class="btn ghost sm" href="#/lessons">Все пары ' + ui.icon("right", "sm") + "</a></div>" +
          (ins.length ? ins.map((i) => '<div class="insight">' + ui.icon(i.icon) + "<div><b>" + esc(i.title) + "</b><span>" + esc(i.text) + "</span></div></div>").join("") : '<p class="muted">Пока мало данных. Проведите несколько пар — и здесь появятся закономерности.</p>') + "</section></div>",
        mount(root) {
          root.addEventListener("click", (e) => {
            const b = e.target.closest("[data-start]"); if (!b) return;
            const slot = G.today.find((t) => t.id === b.dataset.start); if (slot) G.openStart(slot);
          });
          G.sub("frame", () => { const el = root.querySelector("#hero-eng"); if (el && G.live) el.innerHTML = Math.round(G.engagement(G.live.frames[G.live.frames.length - 1])) + "<small>%</small>"; });
        },
      };
    },
  };
})();
