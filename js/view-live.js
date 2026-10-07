/* ==========================================================================
   Экран «Наблюдение» (живой режим)
   ========================================================================== */
(function () {
  const G = window.G; const ui = G.ui; const esc = G.esc;
  const IMG = G.IMG;

  const durText = (L, i) => {
    const sec = G.runLength(L.frames, i) * L.stepMin * 60;
    return sec < 60 ? Math.round(sec) + " с" : Math.round(sec / 60) + " мин";
  };
  const pc = (v, t) => (v / t) * 100 + "%";

  G.views.live = {
    render() {
      const L = G.live;
      if (!L) {
        const next = G.today.find((t) => t.kind === "upcoming");
        const last = G.lessons[0];
        return {
          html:
            '<div class="page-head"><div><h1>Наблюдение</h1><p class="sub">Живая картина класса во время пары</p></div></div>' +
            '<div class="card empty"><div class="art">' + ui.icon("live") + "</div><h3>Сейчас наблюдение не идёт</h3><p>Запустите его в начале пары — первый кадр появится здесь через несколько секунд.</p>" +
            '<div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">' + (next ? '<button class="btn primary lg" id="st">' + ui.icon("play", "sm") + " Начать: " + esc(next.subject) + ", " + esc(next.group) + "</button>" : "") + (last ? '<a class="btn lg" href="#/lessons/' + last.id + '">Отчёт по последней паре</a>' : "") + "</div></div>",
          mount(root) { const b = root.querySelector("#st"); if (b) b.onclick = () => G.openStart(next); },
        };
      }
      const seats = G.seatsByRoom["214"];
      return {
        html:
          '<div class="page-head"><div><h1>Наблюдение</h1><p class="sub" id="sub"></p></div>' +
          '<div class="actions"><button class="btn" id="b-pause">' + ui.icon("pause", "sm") + ' <span>Пауза</span></button><button class="btn" id="b-snap">' + ui.icon("cam", "sm") + " Снимок сейчас</button><button class=\"btn\" id=\"b-mark\">" + ui.icon("flag", "sm") + ' Отметить момент</button><button class="btn danger" id="b-end">' + ui.icon("stop", "sm") + " Завершить пару</button></div></div>" +
          '<div id="banner"></div>' +
          '<div class="live-grid"><div class="stack">' +
          '<section class="card" style="overflow:hidden" aria-label="Кадр из кабинета"><div class="stage-bar"><div class="left"><span class="chip live" id="chip">Идёт</span><span class="muted num" id="ftime"></span><span class="muted" id="cd" style="font-size:14px"></span></div>' +
          '<div class="right"><label class="row" style="gap:8px;font-size:14px;font-weight:520" id="blur-wrap"><span class="switch"><input type="checkbox" id="blur"><span></span></span>Скрыть лица</label>' +
          ui.segHTML("view", [["photo", "Фото"], ["map", "Карта"]], "photo") + "</div></div>" +
          '<div class="stage" id="stage"><img src="' + IMG.src + '" alt="Кадр с камеры в аудитории 214"><div id="blurs"></div><div id="boxes"></div><div class="badge-demo">Демо: фото статичное, состояния меняются</div></div>' +
          '<div class="map" id="map" hidden></div>' +
          '<div class="tl-wrap"><div class="panel-title"><h2>Ход пары</h2><div class="legend">' + G.STATES.map((s, i) => '<span><i style="background:' + ui.COLORS[i] + '"></i>' + s.name + "</span>").join("") + '</div></div><div id="chart"></div><p class="muted" style="font-size:13px;margin-top:6px">Пунктир — порог внимания. Если работают меньше ' + (100 - G.settings.massPct) + "%, покажем подсказку.</p></div></section>" +
          '<p class="muted no-print" style="font-size:13.5px;display:flex;gap:14px;flex-wrap:wrap;align-items:center"><span><span class="kbd">Пробел</span> пауза</span><span><span class="kbd">S</span> снимок</span><span><span class="kbd">M</span> отметка</span><span><span class="kbd">B</span> лица</span><span><span class="kbd">1</span>–<span class="kbd">4</span> фильтры</span></p>' +
          '</div><aside class="stack" aria-label="Сводка"><section class="card card-pad" id="sum"></section><div id="detail"></div><section class="card card-pad"><div class="panel-title"><h2>Лента событий</h2><span class="muted" style="font-size:13px">от ' + G.settings.minSec + " с</span></div><ul class=\"feed\" id=\"feed\"></ul></section></aside></div>",

        mount(root) {
          const st = { active: new Set([1, 2, 3]), view: "photo", sel: null, fix: false };
          const $ = (s) => root.querySelector(s);
          const stage = $("#stage");
          const blurChk = $("#blur"); blurChk.checked = G.settings.blur;

          function sub() {
            const el = Math.round(L.frames.length * L.stepMin);
            $("#sub").textContent = L.subject + " · " + L.group + " · " + L.room + " · прошло " + el + " мин из " + L.durMin;
          }
          function chip() {
            const c = $("#chip"); c.className = "chip " + (L.paused ? "paused" : "live"); c.textContent = L.paused ? "На паузе" : "Идёт";
            $("#b-pause span").textContent = L.paused ? "Продолжить" : "Пауза";
            $("#b-pause .i").outerHTML = ui.icon(L.paused ? "play" : "pause", "sm");
            stage.classList.toggle("paused", L.paused);
          }
          function paintStage() {
            const fr = L.frames[L.frames.length - 1];
            $("#ftime").textContent = "Кадр " + G.hhmm(G.frameTime(L, L.frames.length - 1)) + ":" + G.pad((L.frames.length * 30) % 60);
            // размытие лиц — для всех мест, независимо от фильтров
            $("#blurs").innerHTML = G.settings.blur ? seats.slice(0, fr.length).map((s) => '<div class="blurp" style="left:' + pc(s.x + s.w * 0.08, IMG.w) + ";top:" + pc(s.y + s.h * 0.02, IMG.h) + ";width:" + pc(s.w * 0.84, IMG.w) + ";height:" + pc(s.h * 0.42, IMG.h) + '"></div>').join("") : "";
            let h = "";
            seats.slice(0, fr.length).forEach((s, i) => {
              const v = fr[i]; if (!st.active.has(v)) return;
              const low = L.confs[i] < 0.62 && v !== 0; const quiet = v === 0;
              h += '<button type="button" class="box st ' + (low ? "low " : "") + (quiet ? "quiet " : "") + (st.sel === i ? "sel" : "") + '" data-s="' + v + '" data-i="' + i + '" aria-label="' + esc(s.label) + ": " + G.STATES[v].name + (low ? ", не уверена" : "") + '" style="left:' + pc(s.x, IMG.w) + ";top:" + pc(s.y, IMG.h) + ";width:" + pc(s.w, IMG.w) + ";height:" + pc(s.h, IMG.h) + '">' +
                '<span class="tag">' + ui.stateIcon(v) + "<span>" + G.seatShort(s) + (v ? " · " + durText(L, i) : "") + (low ? " · ?" : "") + "</span></span></button>";
            });
            $("#boxes").innerHTML = h;
          }
          function paintMap() {
            const fr = L.frames[L.frames.length - 1];
            const rows = [3, 2, 1];
            $("#map").innerHTML = rows.map((r) => {
              const inRow = seats.map((s, i) => [s, i]).filter((x) => x[0].row === r && x[1] < fr.length);
              const offset = inRow.length < 6 ? Math.floor((6 - inRow.length) / 2) : 0;
              return '<div class="maprow"><span class="rowlabel">Ряд ' + r + '</span><div class="maprow-grid">' + inRow.map(([s, i], k) => {
                const v = fr[i]; const quiet = !st.active.has(v); const low = L.confs[i] < 0.62 && v !== 0;
                return '<button type="button" class="seat st ' + (quiet ? "quiet " : "") + (low ? "low " : "") + (st.sel === i ? "sel" : "") + '" data-s="' + v + '" data-i="' + i + '" style="grid-column:' + (k + 1 + offset) + '" aria-label="' + esc(s.label) + ": " + G.STATES[v].name + '">' + ui.stateIcon(v) + "<small>М" + s.place + "</small></button>";
              }).join("") + "</div></div>";
            }).join("") + '<div class="board">Доска · преподаватель</div>';
          }
          function paintSum() {
            const fr = L.frames[L.frames.length - 1]; const c = G.countFrame(fr); const tot = fr.length; const eng = Math.round(G.engagement(fr));
            const prev = L.frames.length > 4 ? Math.round(G.engagement(L.frames[L.frames.length - 5])) : eng; const d = eng - prev;
            $("#sum").innerHTML =
              '<div class="row between" style="align-items:flex-end;margin-bottom:10px"><div><div class="eyebrow">Работают сейчас</div><div class="big-num num" style="margin-top:6px">' + eng + "<small>%</small></div></div>" +
              '<div class="chip ' + (d >= 0 ? "ok" : "warn") + '" title="Изменение за последние 2 минуты">' + (d >= 0 ? "▲ " : "▼ ") + Math.abs(d) + " п. п. за 2 мин</div></div>" +
              '<div class="stackbar" role="img" aria-label="Распределение состояний">' + c.map((v) => '<i style="width:' + (v / tot) * 100 + '%"></i>').join("") + "</div>" +
              '<div class="state-list">' + G.STATES.map((s, i) => '<button type="button" class="state-row st" data-s="' + i + '" data-f="' + i + '" aria-pressed="' + st.active.has(i) + '">' + ui.dot(i) + '<span class="nm">' + s.name + '</span><span class="ct">' + c[i] + " <small>из " + tot + "</small></span></button>").join("") + "</div>" +
              '<p class="muted" style="font-size:13px;margin-top:10px">Нажмите на состояние, чтобы показать или скрыть его на фото.</p>';
          }
          function paintDetail() {
            const el = $("#detail");
            if (st.sel == null) { el.innerHTML = ""; return; }
            const i = st.sel; const s = seats[i]; const fr = L.frames[L.frames.length - 1]; const v = fr[i]; const conf = Math.round(L.confs[i] * 100);
            const seq = L.frames.slice(-24).map((f) => f[i]);
            el.innerHTML = '<section class="seat-detail st" data-s="' + v + '"><div class="top">' + ui.dot(v) + '<div style="flex:1;min-width:0"><h3>' + esc(s.label) + '</h3><div class="muted" style="font-size:14px">' + G.STATES[v].name + (v ? " · уже " + durText(L, i) : "") + '</div></div><button class="btn ghost icon-btn sm" data-desel aria-label="Закрыть">' + ui.icon("x", "sm") + "</button></div>" +
              '<div class="muted" style="font-size:13.5px;margin-top:10px">Уверенность: <b style="color:var(--ink)">' + conf + "%</b>" + (conf < 62 ? " — система сомневается, посмотрите сами" : "") + "</div>" +
              '<div class="mini-seq" aria-label="Состояния за последние минуты">' + seq.map((x) => '<i class="st" data-s="' + x + '" style="background:var(--c)"></i>').join("") + "</div>" +
              '<div class="row" style="margin-top:12px;gap:8px"><button class="btn sm" data-fixtoggle>' + ui.icon("flag", "sm") + " Определено неверно</button></div>" +
              (st.fix ? '<div class="fix-menu" role="group" aria-label="Как на самом деле">' + G.STATES.map((x, k) => '<button type="button" class="st" data-s="' + k + '" data-fix="' + k + '"' + (k === v ? " disabled" : "") + ">" + ui.dot(k) + x.name + "</button>").join("") + "</div>" : "") + "</section>";
          }
          function paintFeed() {
            const items = L.events.map((e) => ({ t: e.t, e })).concat(L.marks.map((m) => ({ t: m.idx, m }))).sort((a, b) => b.t - a.t).slice(0, 40);
            $("#feed").innerHTML = items.length ? items.map((it) => {
              const tm = G.hhmm(G.frameTime(L, it.t));
              if (it.m) return '<li class="mark"><span class="st-dot">' + ui.icon("flag", "sm") + '</span><div><b>Ваша отметка</b><span>' + esc(it.m.note || "Без комментария") + "</span></div><time>" + tm + "</time></li>";
              const e = it.e; const s = e.state;
              return '<li class="st" data-s="' + s + '"><button type="button" data-ev="' + e.seat + '" style="all:unset;display:contents;cursor:pointer">' + ui.dot(s) + "<div><b>" + esc(e.text) + "</b><span>" + (e.back ? "снова работает" : G.STATES[s].verb) + "</span></div><time>" + tm + "</time></button></li>";
            }).join("") : '<li style="display:block;color:var(--muted);font-size:14px">Пока всё спокойно: заметных отвлечений нет.</li>';
          }
          function paintChart() {
            const o = { frames: L.frames, stepMin: L.stepMin, start: L.start, height: 150, threshold: G.settings.massPct, marks: L.marks };
            $("#chart").innerHTML = ui.stacked(o); ui.hoverChart($("#chart"), o);
          }
          function paintBanner() {
            const el = $("#banner"); const fr = L.frames[L.frames.length - 1]; const off = 100 - G.engagement(fr); const n = L.frames.length;
            if (L.paused) { el.innerHTML = '<div class="banner neutral"><span>' + ui.icon("pause") + '</span><div><b>Наблюдение на паузе</b>Кадры не обновляются. Нажмите «Продолжить», когда будете готовы.</div></div>'; return; }
            if (G.settings.notifyMass && off >= G.settings.massPct && n - L.dismissedAt > 10) {
              const k = fr.filter((x) => x !== 0).length;
              el.innerHTML = '<div class="banner" role="status"><span>' + ui.icon("alert") + '</span><div><b>Отвлечены ' + k + " из " + fr.length + " (" + Math.round(off) + "%)</b>Хороший момент задать вопрос всей группе или на пару минут сменить формат работы.</div><button class=\"btn ghost icon-btn sm x\" data-dismiss aria-label=\"Скрыть подсказку\">" + ui.icon("x", "sm") + "</button></div>";
            } else el.innerHTML = "";
          }
          function paintAll() { sub(); chip(); paintSum(); paintStage(); paintMap(); paintDetail(); paintFeed(); paintChart(); paintBanner(); }
          function setView(v) { st.view = v; $("#stage").hidden = v !== "photo"; $("#map").hidden = v !== "map"; $("#blur-wrap").style.visibility = v === "photo" ? "visible" : "hidden"; }

          function select(i) { st.sel = st.sel === i ? null : i; st.fix = false; paintStage(); paintMap(); paintDetail(); }
          function toggleFilter(k) { st.active.has(k) ? st.active.delete(k) : st.active.add(k); paintSum(); paintStage(); paintMap(); }

          /* события */
          root.addEventListener("click", (e) => {
            const box = e.target.closest("[data-i]"); if (box) { select(+box.dataset.i); return; }
            const f = e.target.closest("[data-f]"); if (f) { toggleFilter(+f.dataset.f); return; }
            const ev = e.target.closest("[data-ev]"); if (ev) { st.sel = +ev.dataset.ev; st.fix = false; paintStage(); paintMap(); paintDetail(); return; }
            if (e.target.closest("[data-desel]")) { st.sel = null; paintStage(); paintMap(); paintDetail(); return; }
            if (e.target.closest("[data-fixtoggle]")) { st.fix = !st.fix; paintDetail(); return; }
            const fx = e.target.closest("[data-fix]");
            if (fx) {
              const v = +fx.dataset.fix; L.frames[L.frames.length - 1][st.sel] = v; L.confs[st.sel] = 1; G.settings.corrections++; G.saveSettings(); st.fix = false;
              if (L._open) delete L._open[st.sel];
              paintAll(); ui.toast("Исправлено: " + seats[st.sel].label + " — " + G.STATES[v].name.toLowerCase() + ". Поправка попадёт в отчёт."); return;
            }
            if (e.target.closest("[data-dismiss]")) { L.dismissedAt = L.frames.length; paintBanner(); }
          });
          ui.segBind(root, "view", setView);
          blurChk.onchange = () => { G.settings.blur = blurChk.checked; G.saveSettings(); paintStage(); };

          function pause() { L.paused = !L.paused; if (!L.paused) G.nextFrameAt = Date.now() + G.FRAME_MS; chip(); paintBanner(); }
          function snap() { stage.classList.remove("shutter"); void stage.offsetWidth; stage.classList.add("shutter"); G.tickNow(); ui.toast("Кадр обновлён"); }
          function mark() {
            ui.modal({
              title: "Отметить момент", sub: "Отметка появится на графике и в отчёте — например, начало нового задания.",
              body: '<div class="field"><label for="mn">Комментарий</label><input class="input" id="mn" data-autofocus placeholder="Например: начали практическую часть" maxlength="80"></div>',
              foot: '<button class="btn" data-close>Отмена</button><button class="btn primary" id="ok">Сохранить</button>',
              onMount(ov, close) {
                const save = () => { L.marks.push({ idx: L.frames.length - 1, note: ov.querySelector("#mn").value.trim() }); close(); paintFeed(); paintChart(); ui.toast("Момент отмечен"); };
                ov.querySelector("#ok").onclick = save; ov.querySelector("#mn").addEventListener("keydown", (e) => { if (e.key === "Enter") save(); });
              },
            });
          }
          async function end() {
            const mt = G.metrics(L.frames); const mins = Math.round(L.frames.length * L.stepMin);
            const ok = await ui.confirm({ title: "Завершить пару?", text: "Прошло " + mins + " мин, средняя вовлечённость " + Math.round(mt.eng) + "%. После завершения откроется отчёт.", ok: "Завершить и открыть отчёт" });
            if (!ok) return; const rec = G.endLive(); G.syncNavDot(); ui.toast("Пара сохранена в архив"); G.go("#/lessons/" + rec.id);
          }
          $("#b-pause").onclick = pause; $("#b-snap").onclick = snap; $("#b-mark").onclick = mark; $("#b-end").onclick = end;

          G.sub("key", (e) => {
            if (e.code === "Space") { e.preventDefault(); pause(); }
            else if (e.key === "s" || e.key === "S" || e.key === "ы") snap();
            else if (e.key === "m" || e.key === "M" || e.key === "ь") mark();
            else if (e.key === "b" || e.key === "B" || e.key === "и") { blurChk.checked = !blurChk.checked; blurChk.onchange(); }
            else if (/^[1-4]$/.test(e.key)) toggleFilter(+e.key - 1);
            else if (e.key === "Escape" && st.sel != null) { st.sel = null; paintStage(); paintMap(); paintDetail(); }
          });
          G.sub("frame", () => { if (!G.live) return; paintAll(); });

          const timer = setInterval(() => {
            const cd = $("#cd"); if (!cd) return;
            cd.textContent = L.paused ? "обновление остановлено" : "· следующий кадр через " + Math.max(0, Math.ceil((G.nextFrameAt - Date.now()) / 1000)) + " с";
          }, 500);
          root._t = timer;
          paintAll(); setView("photo");
        },
        unmount() { const m = document.getElementById("main"); if (m && m._t) clearInterval(m._t); },
      };
    },
  };
})();
