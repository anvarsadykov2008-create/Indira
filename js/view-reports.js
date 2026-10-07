/* ==========================================================================
   Экраны «Архив пар» и «Отчёт по паре»
   ========================================================================== */
(function () {
  const G = window.G; const ui = G.ui; const esc = G.esc; const IMG = G.IMG;
  const endOf = (l) => new Date(l.start.getTime() + l.durMin * 60000);
  const pc = (v, t) => (v / t) * 100 + "%";

  /* ---------- Архив ---------- */
  G.views.lessons = {
    render() {
      const groups = [...new Set(G.lessons.map((l) => l.group))].sort();
      return {
        html:
          '<div class="page-head"><div><h1>Архив пар</h1><p class="sub">Все завершённые пары и их оценки</p></div></div>' +
          '<div class="toolbar"><div class="search"><span class="sr-only">Поиск</span>' + ui.icon("search") + '<input class="input" id="q" type="search" placeholder="Предмет или группа" aria-label="Поиск по предмету или группе"></div>' +
          '<select class="select" id="g" aria-label="Группа"><option value="">Все группы</option>' + groups.map((g) => "<option>" + esc(g) + "</option>").join("") + "</select>" +
          ui.segHTML("per", [["7", "Неделя"], ["30", "Месяц"], ["999", "Всё"]], "999") +
          '<select class="select" id="s" aria-label="Сортировка"><option value="date">Сначала новые</option><option value="low">Сначала слабые</option><option value="high">Сначала сильные</option></select></div>' +
          '<div class="card" style="overflow:hidden" id="tbl"></div>',
        mount(root) {
          const st = { q: "", g: "", per: 999, s: "date" };
          const tbl = root.querySelector("#tbl");
          function paint() {
            const now = new Date();
            let rows = G.lessons.filter((l) => l.status === "done").map((l) => ({ l, m: G.metrics(l.frames) }));
            rows = rows.filter((r) => (!st.g || r.l.group === st.g) && (!st.q || (r.l.subject + " " + r.l.group).toLowerCase().includes(st.q.toLowerCase())) && (now - r.l.start) / 864e5 <= st.per);
            rows.sort((a, b) => (st.s === "date" ? b.l.start - a.l.start : st.s === "low" ? a.m.score - b.m.score : b.m.score - a.m.score));
            if (!rows.length) {
              tbl.innerHTML = '<div class="empty"><div class="art">' + ui.icon("search") + "</div><h3>Ничего не найдено</h3><p>Попробуйте убрать фильтры или изменить запрос.</p><button class=\"btn\" id=\"reset\">Сбросить фильтры</button></div>";
              tbl.querySelector("#reset").onclick = () => { st.q = ""; st.g = ""; st.per = 999; root.querySelector("#q").value = ""; root.querySelector("#g").value = ""; root.querySelectorAll('[data-seg="per"] button').forEach((b) => b.setAttribute("aria-checked", b.dataset.v === "999")); paint(); };
              return;
            }
            tbl.innerHTML = '<table class="table"><thead><tr><th>Пара</th><th class="hide-sm">Когда</th><th class="hide-sm">Ход пары</th><th>Оценка</th><th style="width:40px"><span class="sr-only">Открыть</span></th></tr></thead><tbody>' +
              rows.map(({ l, m }) => '<tr data-id="' + l.id + '" tabindex="0" role="link" aria-label="Открыть отчёт: ' + esc(l.subject) + ", " + esc(l.group) + '"><td class="t-main"><b>' + esc(l.subject) + "</b><span>" + esc(l.group) + " · " + esc(l.room) + '</span></td><td class="hide-sm"><b style="font-weight:550">' + G.relDay(l.start) + '</b><div class="muted" style="font-size:13.5px">' + G.hhmm(l.start) + "–" + G.hhmm(endOf(l)) + '</div></td><td class="hide-sm">' + ui.spark(m.series, 140, 32, "var(--accent)") + "</td><td>" + ui.scoreChip(m.score) + '</td><td style="color:var(--muted)">' + ui.icon("right", "sm") + "</td></tr>").join("") +
              "</tbody></table>";
          }
          root.querySelector("#q").oninput = (e) => { st.q = e.target.value; paint(); };
          root.querySelector("#g").onchange = (e) => { st.g = e.target.value; paint(); };
          root.querySelector("#s").onchange = (e) => { st.s = e.target.value; paint(); };
          ui.segBind(root, "per", (v) => { st.per = +v; paint(); });
          tbl.addEventListener("click", (e) => { const r = e.target.closest("tr[data-id]"); if (r) G.go("#/lessons/" + r.dataset.id); });
          tbl.addEventListener("keydown", (e) => { if (e.key === "Enter") { const r = e.target.closest("tr[data-id]"); if (r) G.go("#/lessons/" + r.dataset.id); } });
          paint();
        },
      };
    },
  };

  /* ---------- Отчёт ---------- */
  G.views.report = {
    render(r) {
      const l = G.getLesson(r.id);
      if (!l) return { html: '<div class="card empty"><div class="art">' + ui.icon("search") + "</div><h3>Такой пары нет</h3><p>Возможно, ссылка устарела.</p><a class=\"btn primary\" href=\"#/lessons\">К архиву</a></div>" };
      const m = G.metrics(l.frames); const n = l.frames.length; const seats = G.seatsByRoom["214"];
      const load = G.seatLoad(l.frames);
      const fT = (i) => G.hhmm(new Date(l.start.getTime() + i * l.stepMin * 60000));

      // сравнение с последними парами группы
      const same = G.lessons.filter((x) => x.group === l.group && x.status === "done" && x.start <= l.start).sort((a, b) => b.start - a.start).slice(0, 6).reverse();
      const sv = same.map((x) => G.metrics(x.frames).score);
      const sl = same.map((x) => G.fmtDate(x.start).replace(/ (\S{3})\S*/, " $1"));
      const prevAvg = same.length > 1 ? G.avg(sv.slice(0, -1)) : null;
      const diff = prevAvg != null ? Math.round(m.score - prevAvg) : null;

      // инсайты по этой паре
      const ins = [];
      const third = Math.floor(n / 3) || 1;
      const e1 = G.avg(m.series.slice(0, third)), e3 = G.avg(m.series.slice(n - third));
      ins.push({ t: fT(m.eMinAt), h: "Самый сильный провал", d: "Работали около " + Math.round(m.eMin) + "% группы. Если в это время шла лекция без вопросов, попробуйте разбить её заданием." });
      if (e1 - e3 > 12) ins.push({ t: fT(n - 1), h: "К концу пары группа устала", d: "В первой трети работали " + Math.round(e1) + "%, в последней — " + Math.round(e3) + "%. Практику лучше поставить в конец." });
      else if (e3 - e1 > 8) ins.push({ t: fT(n - 1), h: "Группа разогналась к концу", d: "Вовлечённость выросла с " + Math.round(e1) + "% до " + Math.round(e3) + "%. Хороший сценарий пары." });
      const top = load.map((x, i) => [x.off, i]).sort((a, b) => b[0] - a[0]).slice(0, 2);
      ins.push({ t: "", h: "Больше всего отвлечений: " + seats[top[0][1]].label.toLowerCase(), d: "Около " + Math.round(top[0][0]) + "% времени не за работой" + (top[1] ? "; затем — " + seats[top[1][1]].label.toLowerCase() + "." : ".") });
      if (m.shares[3] > 2) ins.push({ t: "", h: "Был сон", d: "Доля времени со сном — " + m.shares[3].toFixed(1).replace(".", ",") + "%. Часто это первая пара утра или конец долгой лекции." });

      const bars = [["Вовлечённость", m.eng, "50%", "доля времени, когда студенты работали"], ["Устойчивость", m.stab, "25%", "доля времени без провалов ниже 60%"], ["Дисциплина", m.disc, "25%", "насколько мало было телефонов и сна"]];

      return {
        html:
          '<a class="crumb no-print" href="#/lessons">' + ui.icon("left", "sm") + " Архив пар</a>" +
          '<div class="page-head"><div><h1>' + esc(l.subject) + " · " + esc(l.group) + '</h1><p class="sub">' + G.fmtDateLong(l.start) + ", " + G.hhmm(l.start) + "–" + G.hhmm(endOf(l)) + " · " + esc(l.room) + " · " + n + " " + G.plural(n, "кадр", "кадра", "кадров") + '</p></div><div class="actions"><button class="btn" id="b-copy">' + ui.icon("copy", "sm") + " Скопировать итог</button><button class=\"btn\" id=\"b-csv\">" + ui.icon("download", "sm") + ' CSV</button><button class="btn" id="b-print">' + ui.icon("print", "sm") + " Печать</button></div></div>" +
          '<div class="stack">' +
          '<section class="card"><div class="kpis"><div><div class="score-block">' + ui.ring(m.score) + '<div><div class="lbl">Оценка пары</div><div class="sub" style="margin:4px 0 8px">' + (diff == null ? "первая пара в сравнении" : (diff >= 0 ? "▲ " : "▼ ") + Math.abs(diff) + " к обычным парам группы") + '</div><button class="btn ghost sm" id="how" style="margin-left:-8px">' + ui.icon("info", "sm") + " Как считается</button></div></div></div>" +
          '<div><div class="lbl">Вовлечённость</div><div class="val num">' + Math.round(m.eng) + "<small>%</small></div><div class=\"sub\">в среднем работали</div></div>" +
          '<div><div class="lbl">Провал</div><div class="val num">' + fT(m.eMinAt) + '</div><div class="sub">работали ' + Math.round(m.eMin) + "%</div></div>" +
          '<div><div class="lbl">Телефоны и сон</div><div class="val num">' + (m.shares[2] + m.shares[3]).toFixed(0) + '<small>%</small></div><div class="sub">телефон ' + m.shares[2].toFixed(0) + "% · сон " + m.shares[3].toFixed(0) + "%</div></div></div></section>" +
          '<div class="grid two"><section class="card card-pad"><div class="card-head"><h2>Как шла пара</h2><div class="legend">' + G.STATES.map((s, i) => '<span><i style="background:' + ui.COLORS[i] + '"></i>' + s.name + "</span>").join("") + '</div></div><div id="chart"></div><div class="muted" style="font-size:13.5px;margin-top:8px">Наведите на график — увидите состояние группы и кадр на этот момент. Клик закрепляет кадр.</div>' +
          (l.marks.length ? '<hr class="divider"><div class="eyebrow" style="margin-bottom:8px">Ваши отметки</div><ul class="pill-list" style="padding:0;margin:0">' + l.marks.map((k) => "<li><time>" + fT(k.idx) + "</time><span>" + esc(k.note || "Без комментария") + "</span></li>").join("") + "</ul>" : "") + "</section>" +
          '<section class="card" style="overflow:hidden"><div class="stage-bar"><div class="left"><b id="fr-t" class="num">Кадр</b></div><div class="right"><span class="muted" id="fr-s" style="font-size:14px"></span></div></div><div class="stage" id="stage"><img src="' + IMG.src + '" alt="Кадр из кабинета"><div id="blurs"></div><div id="boxes"></div><div class="badge-demo">Демо-фото</div></div></section></div>' +
          '<div class="grid two"><section class="card card-pad"><div class="card-head"><h2>Что заметно</h2></div><ul class="pill-list" style="padding:0;margin:0">' + ins.map((x) => "<li>" + (x.t ? "<time>" + x.t + "</time>" : '<span style="min-width:48px">' + ui.icon("bulb") + "</span>") + '<div><b style="font-weight:600;display:block">' + esc(x.h) + '</b><span class="muted" style="font-size:14.5px">' + esc(x.d) + "</span></div></li>").join("") + "</ul></section>" +
          '<section class="card card-pad"><div class="card-head"><h2>Где отвлекались чаще всего</h2></div><div class="heat" id="heat"></div><div class="legend" style="margin-top:12px"><span><i style="background:var(--st-0)"></i>почти всегда работают</span><span><i style="background:var(--st-1)"></i>иногда</span><span><i style="background:var(--st-2)"></i>часто отвлекаются</span></div></section></div>' +
          '<section class="card card-pad"><div class="card-head"><h2>Сравнение с прошлыми парами ' + esc(l.group) + "</h2></div>" + ui.bars(sv, sl, sv.length - 1, 150) + "</section></div>",
        mount(root) {
          const o = { frames: l.frames, stepMin: l.stepMin, start: l.start, marks: l.marks.map((k) => ({ idx: k.idx })), height: 240 };
          root.querySelector("#chart").innerHTML = ui.stacked(o);
          let pinned = null; let cur = n - 1 < 0 ? 0 : m.eMinAt;
          const blur = G.settings.blur;
          function frame(i) {
            cur = i; const fr = l.frames[i]; const c = G.countFrame(fr);
            root.querySelector("#fr-t").textContent = "Кадр " + fT(i);
            root.querySelector("#fr-s").textContent = Math.round(G.engagement(fr)) + "% работают" + (pinned != null ? " · закреплён" : "");
            root.querySelector("#blurs").innerHTML = blur ? seats.map((s) => '<div class="blurp" style="left:' + pc(s.x + s.w * 0.08, IMG.w) + ";top:" + pc(s.y + s.h * 0.02, IMG.h) + ";width:" + pc(s.w * 0.84, IMG.w) + ";height:" + pc(s.h * 0.42, IMG.h) + '"></div>').join("") : "";
            root.querySelector("#boxes").innerHTML = seats.map((s, k) => { const v = fr[k]; return '<div class="box st ' + (v === 0 ? "quiet" : "") + '" data-s="' + v + '" style="left:' + pc(s.x, IMG.w) + ";top:" + pc(s.y, IMG.h) + ";width:" + pc(s.w, IMG.w) + ";height:" + pc(s.h, IMG.h) + '"><span class="tag">' + ui.stateIcon(v) + "<span>" + G.seatShort(s) + "</span></span></div>"; }).join("");
          }
          ui.hoverChart(root, o, (i, kind) => {
            if (kind === "move" && pinned == null) frame(i);
            else if (kind === "click") { pinned = pinned === i ? null : i; frame(i); }
            else if (kind === "leave" && pinned == null) frame(m.eMinAt);
          });
          frame(m.eMinAt);

          // тепловая карта
          const heat = root.querySelector("#heat");
          heat.style.cssText = "position:relative;aspect-ratio:1376/560;background:var(--surface-2);border-radius:10px;border:1px solid var(--line)";
          heat.innerHTML = seats.map((s, i) => { const off = load[i].off; const col = off < 22 ? "var(--st-0)" : off < 38 ? "var(--st-1)" : "var(--st-2)"; return '<div title="' + esc(s.label) + ": " + Math.round(off) + '% времени не за работой" style="position:absolute;left:' + pc(s.x + s.w / 2, IMG.w) + ";top:" + ((s.row === 3 ? 18 : s.row === 2 ? 48 : 80)) + '%;transform:translate(-50%,-50%);width:9%;aspect-ratio:1.4;border-radius:8px;background:' + col + ';color:#fff;display:grid;place-items:center;font-weight:650;font-size:13px">' + Math.round(off) + "%</div>"; }).join("") + '<div style="position:absolute;left:30%;right:30%;bottom:3%;height:6%;border-radius:4px;background:var(--ink);opacity:.85"></div>';

          root.querySelector("#how").onclick = () => ui.modal({
            title: "Как считается оценка", sub: "Это ориентир по группе в целом. Она не оценивает ни отдельных студентов, ни вас.",
            body: '<div class="parts">' + bars.map((b) => '<div class="p"><span><b>' + b[0] + "</b> · вес " + b[2] + '</span><b class="num">' + Math.round(b[1]) + '</b><div class="bar"><i style="width:' + b[1] + '%"></i></div><span class="muted" style="grid-column:1/-1">' + b[3] + "</span></div>").join("") + '</div><p class="muted" style="font-size:14px">Итог = 0,5 × вовлечённость + 0,25 × устойчивость + 0,25 × дисциплина. Формула одинакова для всех пар, поэтому оценки можно сравнивать между собой.</p>',
            foot: '<button class="btn primary" data-close>Понятно</button>',
          });
          root.querySelector("#b-print").onclick = () => window.print();
          root.querySelector("#b-csv").onclick = () => { ui.download("galerka-" + l.subject + "-" + l.group + ".csv", G.exportCSV(l), "text/csv;charset=utf-8"); ui.toast("Файл CSV сохранён"); };
          root.querySelector("#b-copy").onclick = async () => {
            const t = l.subject + ", " + l.group + ", " + G.fmtDate(l.start) + ": оценка " + m.score + "/100. Вовлечённость " + Math.round(m.eng) + "%, провал в " + fT(m.eMinAt) + " (" + Math.round(m.eMin) + "%), телефоны " + Math.round(m.shares[2]) + "%, сон " + Math.round(m.shares[3]) + "%.";
            try { await navigator.clipboard.writeText(t); ui.toast("Итог скопирован"); } catch (e) { ui.toast("Не удалось скопировать"); }
          };
        },
      };
    },
  };
})();
