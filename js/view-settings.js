/* ==========================================================================
   Экран «Настройки»
   ========================================================================== */
(function () {
  const G = window.G; const ui = G.ui; const esc = G.esc;
  const STORE = [["off", "Не хранить"], ["24", "24 часа"], ["168", "7 дней"], ["720", "30 дней"]];
  const storeText = (v) => (v === "off" ? "не сохраняются" : "хранятся не дольше " + (v === "24" ? "24 часов" : v === "168" ? "7 дней" : "30 дней"));
  const minText = (s) => (s < 60 ? s + " с" : s % 60 ? Math.floor(s / 60) + " мин " + (s % 60) + " с" : s / 60 + " мин");

  const noticeText = () =>
    "В этом кабинете во время занятий работает система «Галёрка». Она по кадрам с камеры оценивает общее состояние группы: кто работает, кто отвлёкся, кто в телефоне, кто спит. Система не распознаёт лица и не определяет личность. Кадры " + storeText(G.settings.store) + ". Вопросы — к преподавателю: " + G.settings.name + ".";

  function setting(title, desc, control) {
    return '<div class="setting"><div class="t"><b>' + title + "</b>" + (desc ? "<span>" + desc + "</span>" : "") + "</div>" + control + "</div>";
  }
  const sw = (id, on, label) => '<label class="switch"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + ' aria-label="' + esc(label) + '"><span></span></label>';

  G.views.settings = {
    render() {
      const s = G.settings;
      return {
        html:
          '<div class="page-head"><div><h1>Настройки</h1><p class="sub">Изменения сохраняются автоматически</p></div><span class="chip ok" id="saved" style="visibility:hidden">' + ui.icon("check", "sm") + " Сохранено</span></div>" +
          '<div class="settings-layout"><nav class="settings-nav" aria-label="Разделы настроек">' + [["priv", "Приватность"], ["det", "Определение"], ["notif", "Уведомления"], ["look", "Оформление"], ["acc", "Профиль"]].map((x) => '<a href="#" data-jump="' + x[0] + '">' + x[1] + "</a>").join("") + "</nav>" +
          '<div class="stack">' +

          '<section class="card card-pad" id="priv"><div class="card-head"><h2>Приватность</h2></div>' +
          setting("Скрывать лица на экране", "Лица на фото размываются, состояние остаётся видно по позе. Включено по умолчанию.", sw("blur", s.blur, "Скрывать лица")) +
          '<div class="setting col"><div class="t"><b>Сколько хранить кадры</b><span>Рекомендуем «Не хранить»: после анализа кадр удаляется, остаются только цифры по паре.</span></div>' + ui.segHTML("store", STORE, s.store) + "</div>" +
          setting("Напоминать о предупреждении группы", "Перед запуском наблюдения попросим подтвердить, что студенты знают о системе.", sw("requireWarn", s.requireWarn, "Напоминать о предупреждении")) +
          '<div class="setting col"><div class="t"><b>Объявление для двери кабинета</b><span>Готовый текст для студентов. Обновляется по вашим настройкам.</span></div><div class="notice-card" id="notice"><h4>Здесь работает «Галёрка»</h4><p id="ntext">' + esc(noticeText()) + '</p></div><div class="row"><button class="btn sm" id="n-copy">' + ui.icon("copy", "sm") + ' Скопировать</button><button class="btn sm" id="n-print">' + ui.icon("print", "sm") + " Распечатать</button></div></div>" +
          setting("Удалить все данные", "Архив пар, кадры и настройки будут стёрты без возможности восстановления.", '<button class="btn danger sm" id="wipe">' + ui.icon("trash", "sm") + " Удалить…</button>") + "</section>" +

          '<section class="card card-pad" id="det"><div class="card-head"><h2>Определение состояний</h2></div>' +
          '<div class="setting col"><div class="t"><b>Как часто делать кадр</b><span>Чаще — точнее картина, но выше нагрузка на камеру и компьютер.</span></div>' + ui.segHTML("interval", [[15, "15 с"], [30, "30 с"], [60, "1 мин"]], s.interval) + "</div>" +
          '<div class="setting col"><div class="t"><b>Отмечать, если длится дольше</b><span>Короткие взгляды в телефон или в сторону не попадут в ленту и уведомления. Так меньше ложных тревог.</span></div><div class="slider-row"><input class="range" id="minSec" type="range" min="0" max="300" step="30" value="' + s.minSec + '" aria-label="Минимальная длительность"><output id="minSecO">' + minText(s.minSec) + "</output></div></div>" +
          '<div class="setting col"><div class="t"><b>Чувствительность</b><span>Чем выше, тем чаще система отмечает состояние, но тем больше ложных срабатываний.</span></div><div class="stack" style="gap:6px">' +
          G.STATES.slice(1).map((st, k) => '<div class="slider-row st" data-s="' + (k + 1) + '"><span class="st-dot">' + ui.stateIcon(k + 1) + '</span><span style="min-width:90px;font-weight:550">' + st.name + '</span><input class="range" type="range" min="0" max="100" step="5" value="' + s.sens[k + 1] + '" data-sens="' + (k + 1) + '" aria-label="Чувствительность: ' + st.name + '"><output>' + s.sens[k + 1] + "</output></div>").join("") + "</div></div></section>" +

          '<section class="card card-pad" id="notif"><div class="card-head"><h2>Уведомления</h2></div>' +
          setting("Подсказка при массовом отвлечении", "Тихий баннер в наблюдении, без звука.", sw("notifyMass", s.notifyMass, "Подсказка при массовом отвлечении")) +
          '<div class="setting col"><div class="t"><b>Порог массового отвлечения</b><span>Показывать подсказку, когда не за работой больше этой доли группы.</span></div><div class="slider-row"><input class="range" id="massPct" type="range" min="20" max="80" step="5" value="' + s.massPct + '" aria-label="Порог массового отвлечения"><output id="massO">' + s.massPct + "%</output></div></div>" +
          setting("Отмечать сон отдельно", "Спящий студент появится в ленте сразу, не дожидаясь порога по времени.", sw("notifySleep", s.notifySleep, "Отмечать сон отдельно")) + "</section>" +

          '<section class="card card-pad" id="look"><div class="card-head"><h2>Оформление</h2></div><div class="setting col"><div class="t"><b>Тема</b><span>«Как в системе» подстраивается под настройки устройства.</span></div>' + ui.segHTML("theme", [["light", "Светлая"], ["dark", "Тёмная"], ["system", "Как в системе"]], s.theme) + "</div></section>" +

          '<section class="card card-pad" id="acc"><div class="card-head"><h2>Профиль</h2></div><div class="grid" style="grid-template-columns:1fr 1fr;gap:16px"><div class="field"><label for="pname">Как к вам обращаться</label><input class="input" id="pname" value="' + esc(s.name) + '" maxlength="40"></div><div class="field"><label for="pmail">Почта</label><input class="input" id="pmail" type="email" value="' + esc(s.email) + '"></div></div>' +
          '<div class="row" style="margin-top:18px"><button class="btn sm" id="reset">Вернуть настройки по умолчанию</button></div><p class="muted" style="font-size:13.5px;margin-top:14px">Исправлений определения за всё время: <b>' + s.corrections + "</b>. Они помогают оценить, насколько система ошибается.</p></section></div></div>",

        mount(root) {
          const $ = (x) => root.querySelector(x); let t;
          const saved = () => { G.saveSettings(); const c = $("#saved"); c.style.visibility = "visible"; clearTimeout(t); t = setTimeout(() => (c.style.visibility = "hidden"), 1600); };
          const bindSw = (id, key, fn) => { $("#" + id).onchange = (e) => { G.settings[key] = e.target.checked; saved(); if (fn) fn(); }; };
          bindSw("blur", "blur"); bindSw("requireWarn", "requireWarn"); bindSw("notifyMass", "notifyMass"); bindSw("notifySleep", "notifySleep");
          ui.segBind(root, "store", (v) => { G.settings.store = v; saved(); $("#ntext").textContent = noticeText(); });
          ui.segBind(root, "interval", (v) => { G.settings.interval = +v; saved(); });
          ui.segBind(root, "theme", (v) => { G.settings.theme = v; saved(); G.applyTheme(); });
          $("#minSec").oninput = (e) => { G.settings.minSec = +e.target.value; $("#minSecO").textContent = minText(+e.target.value); saved(); };
          $("#massPct").oninput = (e) => { G.settings.massPct = +e.target.value; $("#massO").textContent = e.target.value + "%"; saved(); };
          root.querySelectorAll("[data-sens]").forEach((r) => (r.oninput = () => { G.settings.sens[+r.dataset.sens] = +r.value; r.nextElementSibling.textContent = r.value; saved(); }));
          $("#pname").oninput = (e) => { G.settings.name = e.target.value.trim() || "Преподаватель"; saved(); G.refreshProfile(); $("#ntext").textContent = noticeText(); };
          $("#pmail").onchange = (e) => { if (/^\S+@\S+\.\S+$/.test(e.target.value)) { G.settings.email = e.target.value; saved(); } else { ui.toast("Проверьте адрес почты"); e.target.value = G.settings.email; } };
          root.querySelectorAll("[data-jump]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); const el = $("#" + a.dataset.jump); el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); el.focus && el.setAttribute("tabindex", "-1"); }));

          $("#n-copy").onclick = async () => { try { await navigator.clipboard.writeText("Здесь работает «Галёрка»\n\n" + noticeText()); ui.toast("Текст скопирован"); } catch (e) { ui.toast("Не удалось скопировать"); } };
          $("#n-print").onclick = () => {
            const pa = document.createElement("div"); pa.id = "print-area"; pa.innerHTML = "<h1>Здесь работает «Галёрка»</h1><p>" + esc(noticeText()) + "</p>"; document.body.appendChild(pa); document.body.classList.add("print-notice");
            const done = () => { document.body.classList.remove("print-notice"); pa.remove(); window.removeEventListener("afterprint", done); }; window.addEventListener("afterprint", done); window.print();
          };
          $("#wipe").onclick = async () => {
            if (await ui.confirm({ title: "Удалить все данные?", text: "Архив пар, настройки и поправки будут стёрты. Действие необратимо.", ok: "Удалить всё", danger: true })) {
              G.lessons = G.lessons.filter((l) => false); G.today = G.today.filter((t) => t.kind !== "done"); G.resetSettings(); G.applyTheme(); ui.toast("Данные удалены"); G.go("#/");
            }
          };
          $("#reset").onclick = async () => { if (await ui.confirm({ title: "Вернуть настройки по умолчанию?", text: "Профиль и архив пар не изменятся.", ok: "Вернуть" })) { const keep = { name: G.settings.name, email: G.settings.email }; G.resetSettings(); Object.assign(G.settings, keep); G.saveSettings(); G.applyTheme(); ui.toast("Настройки сброшены"); G.go("#/settings"); } };
        },
      };
    },
  };
})();
