/**
 * Boost Mini App Upgrade Layer
 * Notes 2.0 · Share PNG · Lesson card presets · Local overrides · AI chat
 * Loads after main.js; patches globals safely for older Telegram WebApps.
 */
(function () {
  "use strict";

  const API_BASE = "https://boost.rorosin.ru";
  const BOT_USERNAME = (window.BoostDelightBotUsername) || "mietcbot";
  const WEEK_EPOCH = new Date(2026, 7, 2); // align with backend get_weeks.py
  const OVERRIDES_KEY = "lessonOverrides_v1";
  const NOTES_FILTER_KEY = "notesFilter_v1";
  const MAX_NOTE_DESC = 2000;
  const MAX_NOTE_TITLE = 96;

  const WEEK_TITLES = [
    "1 числитель",
    "1 знаменатель",
    "2 числитель",
    "2 знаменатель",
  ];

  // Полные имена дней из .day-name → стандартные двухбуквенные для карточек
  // (slice(0, 2) давал «Че», «По», «Пя», «Су»)
  const DAY_SHORT_NAMES = {
    Понедельник: "Пн",
    Вторник: "Вт",
    Среда: "Ср",
    Четверг: "Чт",
    Пятница: "Пт",
    Суббота: "Сб",
    Воскресенье: "Вс",
  };

  const PRIORITY_META = {
    low: { label: "Низкий", className: "prio-low" },
    normal: { label: "Обычный", className: "prio-normal" },
    high: { label: "Высокий", className: "prio-high" },
    urgent: { label: "Срочно", className: "prio-urgent" },
  };

  const CARD_PRESETS = {
    compact: {
      label: "Компакт",
      "--day-name-letter-sp": "0px",
      "--day-name-gap": "0.2em",
      "--lesson-number-padding": "4px",
      "--time-letter-sp": "0px",
      "--subject-f-size": "13px",
      "--room-letter-sp": "0px",
      "--room-f-size": "11px",
      "--tname-f-size": "11px",
    },
    comfort: {
      label: "Комфорт",
      "--day-name-letter-sp": "1px",
      "--day-name-gap": "0.5em",
      "--lesson-number-padding": "8px",
      "--time-letter-sp": "1px",
      "--subject-f-size": "15px",
      "--room-letter-sp": "1px",
      "--room-f-size": "12px",
      "--tname-f-size": "12px",
    },
    large: {
      label: "Крупный",
      "--day-name-letter-sp": "2px",
      "--day-name-gap": "0.8em",
      "--lesson-number-padding": "12px",
      "--time-letter-sp": "2px",
      "--subject-f-size": "18px",
      "--room-letter-sp": "2px",
      "--room-f-size": "14px",
      "--tname-f-size": "14px",
    },
  };

  const tg = window.Telegram?.WebApp;
  const haptic = () => tg?.HapticFeedback;

  function authHeaders(extra = {}) {
    const initData = tg?.initData || "";
    return {
      Authorization: initData,
      ...extra,
    };
  }

  async function api(path, options = {}) {
    const opts = { ...options };
    opts.headers = {
      ...authHeaders(opts.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(opts.headers || {}),
    };
    const res = await fetch(`${API_BASE}${path}`, opts);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${path}: ${res.status} ${text}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/\n/g, " ");
  }

  function toast(text, ms = 1900) {
    const al = document.getElementById("fast-alert");
    if (!al) return;
    const prev = al.textContent;
    al.textContent = text;
    al.style.display = "flex";
    al.style.animation = "none";
    void al.offsetWidth;
    al.style.animation = "flyUP 2s normal";
    setTimeout(() => {
      al.style.display = "none";
      al.textContent = prev || "Обновляем данные";
    }, ms);
  }

  function safeHaptic(type = "success") {
    try {
      haptic()?.notificationOccurred?.(type);
    } catch (_) {}
  }

  function safeImpact(style = "light") {
    try {
      haptic()?.impactOccurred?.(style);
    } catch (_) {}
  }

  const PREF_KEY = {
    tips: "prefTips",
    highlights: "prefHighlights",
    breaks: "prefBreaks",
    compactNotes: "prefCompactNotes",
    largeNotes: "prefLargeNotes",
    hideDone: "prefHideDone",
    noteBadges: "prefNoteBadges",
  };

  function applyPref(key, checked) {
    const storageKey = PREF_KEY[key] || `pref${key[0].toUpperCase()}${key.slice(1)}`;
    localStorage.setItem(storageKey, checked ? "on" : "off");
    document.body.classList.toggle(`pref-${key}-off`, !checked);
    document.body.classList.toggle(`pref-${key}-on`, checked);
    if (key === "breaks") renderBreakChips();
    if (key === "hideDone" || key === "noteBadges") {
      if (typeof window.getNotes === "function") window.getNotes();
    }
  }

  function syncPairLinkClear() {
    const summary = document.getElementById("pair-link-summary");
    const clearBtn = document.getElementById("clear-pair-link");
    if (clearBtn) clearBtn.hidden = summary?.dataset.linked !== "1";
  }

  function initAppearanceExtras() {
    // Тумблеры живут прямо в под-экранах «Подсказки» и «Заметки студента»
    document.querySelectorAll("input[data-pref]").forEach((input) => {
      if (input.__prefBound) return;
      input.__prefBound = true;
      const key = input.dataset.pref;
      const storageKey = PREF_KEY[key] || `pref${key[0].toUpperCase()}${key.slice(1)}`;
      input.checked = (localStorage.getItem(storageKey) ?? (key === "tips" || key === "highlights" || key === "breaks" || key === "noteBadges" ? "on" : "off")) === "on";
      applyPref(key, input.checked);
      input.addEventListener("change", () => applyPref(key, input.checked));
    });
    // Ряд «Заметки студента» открывает свой под-экран
    const notesSwipe = document.getElementById("notes-swipe-1");
    const notesScreen = document.getElementById("set-app4");
    if (notesSwipe && notesScreen && !notesSwipe.__prefBound) {
      notesSwipe.__prefBound = true;
      notesSwipe.addEventListener("click", () => {
        const appearanceSettings = document.querySelector(".popuper-appearance > .a-settings-area");
        if (!appearanceSettings) return;
        if (tg?.BackButton) { tg.BackButton.show(); tg.BackButton.onClick(() => window.__showAppearanceRoot?.()); }
        appearanceSettings.style.animation = "ending .3s forwards";
        setTimeout(() => {
          appearanceSettings.style.display = "none";
          appearanceSettings.style.animation = "";
          notesScreen.style.display = "flex";
          notesScreen.style.animation = "starting .5s forwards";
        }, 330);
      });
    }
  }

  /* ─── Перемены между парами ─── */
  function parseRowTimes(text) {
    const m = (text || "").match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const s = Number(m[1]) * 60 + Number(m[2]);
    const e = Number(m[3]) * 60 + Number(m[4]);
    return { start: s, end: e };
  }

  function renderBreakChips() {
    const days = document.querySelectorAll(".day");
    days.forEach((day) => {
      const rows = Array.from(day.querySelectorAll(".lesson-row")).filter(
        (r) => r.style.display !== "none",
      );
      const desired = [];
      for (let i = 0; i < rows.length - 1; i++) {
        const a = parseRowTimes(rows[i].querySelector(".time")?.textContent);
        const b = parseRowTimes(rows[i + 1].querySelector(".time")?.textContent);
        if (!a || !b) continue;
        const gap = b.start - a.end;
        if (gap < 10) continue;
        desired.push({ after: rows[i], text: `☕ перемена · ${gap} мин` });
      }
      const existing = Array.from(day.querySelectorAll(".break-chip"));
      const same =
        existing.length === desired.length &&
        existing.every(
          (chip, i) =>
            chip.textContent === desired[i].text &&
            chip.nextElementSibling === desired[i].after.nextElementSibling,
        );
      if (same) return;
      existing.forEach((chip) => chip.remove());
      desired.forEach(({ after, text }) => {
        const chip = document.createElement("div");
        chip.className = "break-chip";
        chip.textContent = text;
        after.parentElement.insertBefore(chip, after.nextSibling);
      });
    });
  }

  /* ─── Week epoch fix (backend-aligned) ─── */
  function getScheduleWeekIndexFixed() {
    const elapsedWeeks = Math.floor(
      (Date.now() - WEEK_EPOCH.getTime()) / (1000 * 60 * 60 * 24 * 7),
    );
    return ((elapsedWeeks % 4) + 4) % 4;
  }

  function getScheduleWeekMondayFixed(weekIndex) {
    const idx =
      weekIndex ??
      window.scheduleWeekIndex ??
      getScheduleWeekIndexFixed();
    const monday = new Date(WEEK_EPOCH.getTime());
    monday.setDate(WEEK_EPOCH.getDate() + Number(idx) * 7);
    return monday;
  }

  window.getScheduleWeekIndex = getScheduleWeekIndexFixed;
  window.getScheduleWeekMonday = getScheduleWeekMondayFixed;

  /* ─── Local lesson overrides ─── */
  function readOverrides() {
    try {
      return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function writeOverrides(map) {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map));
  }

  function lessonKey(row) {
    const week = row.dataset.week ?? window.scheduleWeekIndex ?? 0;
    const day =
      row.closest(".day")?.querySelector(".day-name")?.textContent?.trim() || "";
    const code = row.dataset.lessonCode || row.querySelector(".lesson")?.textContent?.trim() || "";
    const subject = row.dataset.subject || row.querySelector(".subject")?.textContent?.trim() || "";
    return `${week}|${day}|${code}|${subject}`;
  }

  function applyOverridesToDom() {
    const map = readOverrides();
    document.querySelectorAll(".lesson-row").forEach((row) => {
      if (row.closest("#demo-lesson")) return;
      const key = lessonKey(row);
      const ov = map[key];
      row.classList.remove("is-overridden", "is-hidden-override");
      row.querySelector(".override-badge")?.remove();
      row.style.display = "";

      if (!ov) return;

      if (ov.hidden) {
        row.classList.add("is-hidden-override");
        row.style.display = "none";
        return;
      }

      row.classList.add("is-overridden");
      const subj = row.querySelector(".subject");
      const room = row.querySelector(".room");
      if (ov.alias && subj) {
        if (!subj.dataset.orig) subj.dataset.orig = subj.textContent;
        subj.textContent = ov.alias;
      } else if (subj?.dataset.orig) {
        subj.textContent = subj.dataset.orig;
      }
      if (ov.roomOverride && room) {
        if (!room.dataset.orig) room.dataset.orig = room.textContent;
        room.textContent = `(${ov.roomOverride})`;
      } else if (room?.dataset.orig) {
        room.textContent = room.dataset.orig;
      }

      const badge = document.createElement("button");
      badge.type = "button";
      badge.className = "override-badge";
      badge.title = "Личная правка";
      badge.textContent = "✦";
      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        openOverrideEditor(row);
      });
      row.appendChild(badge);
    });
  }

  function openOverrideEditor(row) {
    const key = lessonKey(row);
    const map = readOverrides();
    const current = map[key] || {};
    const subject =
      row.dataset.subject ||
      row.querySelector(".subject")?.dataset.orig ||
      row.querySelector(".subject")?.textContent?.trim() ||
      "";
    const roomOrig =
      row.dataset.room ||
      row.querySelector(".room")?.dataset.orig ||
      (row.querySelector(".room")?.textContent || "").replace(/[()]/g, "").trim() ||
      "";

    document.getElementById("override-editor-modal")?.remove();
    const modal = document.createElement("div");
    modal.id = "override-editor-modal";
    modal.className = "override-modal";
    modal.innerHTML = `
      <div class="override-sheet" role="dialog" aria-modal="true" aria-labelledby="override-title">
        <header>
          <h3 id="override-title">Личная правка</h3>
          <p>Официальное расписание не меняется — только у тебя</p>
        </header>
        <label class="override-field">
          <span>Название</span>
          <input type="text" id="ov-alias" maxlength="96" placeholder="${escapeAttr(subject)}" value="${escapeAttr(current.alias || "")}">
        </label>
        <label class="override-field">
          <span>Аудитория</span>
          <input type="text" id="ov-room" maxlength="32" placeholder="${escapeAttr(roomOrig)}" value="${escapeAttr(current.roomOverride || "")}">
        </label>
        <label class="override-check">
          <input type="checkbox" id="ov-hide" ${current.hidden ? "checked" : ""}>
          <span>Скрыть пару локально</span>
        </label>
        <div class="override-actions">
          <button type="button" class="ov-ghost" id="ov-reset">Сбросить</button>
          <button type="button" class="ov-ghost" id="ov-cancel">Отмена</button>
          <button type="button" class="ov-primary" id="ov-save">Сохранить</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    safeImpact("light");
    requestAnimationFrame(() => modal.classList.add("is-open"));

    const close = () => {
      modal.classList.remove("is-open");
      setTimeout(() => modal.remove(), 180);
    };
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
    modal.querySelector("#ov-cancel").addEventListener("click", close);
    modal.querySelector("#ov-reset").addEventListener("click", () => {
      delete map[key];
      writeOverrides(map);
      applyOverridesToDom();
      safeHaptic("success");
      toast("Правка сброшена");
      close();
    });
    modal.querySelector("#ov-save").addEventListener("click", () => {
      const alias = (modal.querySelector("#ov-alias").value || "").trim();
      const room = (modal.querySelector("#ov-room").value || "").trim();
      const hide = Boolean(modal.querySelector("#ov-hide").checked);
      if (!alias && !room && !hide) delete map[key];
      else {
        map[key] = {
          alias: alias || null,
          roomOverride: room || null,
          hidden: hide,
          updatedAt: new Date().toISOString(),
        };
      }
      writeOverrides(map);
      applyOverridesToDom();
      safeHaptic("success");
      toast(hide ? "Пара скрыта локально" : "Правка сохранена");
      close();
    });
  }

  /* ─── Enrich lesson rows with data-* ─── */
  function enrichLessonRows() {
    const week = window.scheduleWeekIndex ?? getScheduleWeekIndexFixed();
    document.querySelectorAll(".lesson-row").forEach((row) => {
      if (row.closest("#demo-lesson")) return;
      const subjEl = row.querySelector(".subject");
      const roomEl = row.querySelector(".room");
      if (subjEl && !subjEl.dataset.orig) {
        subjEl.dataset.orig = subjEl.textContent?.trim() || "";
      }
      if (roomEl && !roomEl.dataset.orig) {
        roomEl.dataset.orig = (roomEl.textContent || "").replace(/[()]/g, "").trim();
      }

      const subject = subjEl?.dataset.orig || subjEl?.textContent?.trim() || "";
      const room = roomEl?.dataset.orig || (roomEl?.textContent || "").replace(/[()]/g, "").trim();
      const code = row.querySelector(".lesson")?.textContent?.trim() || "";
      const time = row.querySelector(".time")?.textContent?.trim() || "";
      const teacher = row.querySelector(".tname")?.textContent?.trim() || "";
      const day =
        row.closest(".day")?.querySelector(".day-name")?.textContent?.trim() || "";

      row.dataset.week = String(week);
      row.dataset.lessonCode = code;
      row.dataset.subject = subject;
      row.dataset.room = room;
      row.dataset.time = time;
      row.dataset.teacher = teacher;
      row.dataset.day = day;
      row.dataset.pairId = `${week}|${day}|${code}|${subject}`
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/gi, "-");
      row.id = `pair-${row.dataset.pairId}`;

      if (!row.dataset.boostBound) {
        row.dataset.boostBound = "1";
        let pressTimer = null;
        let pressX = 0;
        let pressY = 0;
        row.addEventListener("pointerdown", (e) => {
          pressX = e.clientX;
          pressY = e.clientY;
          pressTimer = setTimeout(() => {
            safeImpact("medium");
            openQuickNoteFromLesson(row);
          }, 550);
        });
        const clearPress = (e) => {
          if (
            e &&
            (Math.abs((e.clientX || 0) - pressX) > 12 ||
              Math.abs((e.clientY || 0) - pressY) > 12)
          ) {
            clearTimeout(pressTimer);
          }
          clearTimeout(pressTimer);
        };
        row.addEventListener("pointerup", clearPress);
        row.addEventListener("pointerleave", () => clearTimeout(pressTimer));
        row.addEventListener("pointercancel", () => clearTimeout(pressTimer));
        row.addEventListener("pointermove", (e) => {
          if (
            Math.abs(e.clientX - pressX) > 12 ||
            Math.abs(e.clientY - pressY) > 12
          ) {
            clearTimeout(pressTimer);
          }
        });

        // Tap pair number → local rename/hide (official schedule stays intact)
        row.querySelector(".lesson")?.addEventListener("click", (e) => {
          e.stopPropagation();
          openOverrideEditor(row);
        });
      }
    });
    applyOverridesToDom();
    paintNoteBadgesOnLessons();
    renderBreakChips();
  }

  function openQuickNoteFromLesson(row) {
    const pairLink = {
      weekIndex: Number(row.dataset.week),
      dayOfWeek: row.dataset.day,
      lessonCode: row.dataset.lessonCode,
      subject: row.dataset.subject,
      room: row.dataset.room,
      teacher: row.dataset.teacher,
      timeRange: row.dataset.time,
      pairId: row.dataset.pairId,
    };
    sessionStorage.setItem("pendingPairLink", JSON.stringify(pairLink));
    document.getElementById("notes-show")?.click();
    setTimeout(() => {
      const addBtn = document.getElementById("note-add-btn");
      if (addBtn && !addBtn.classList.contains("opened")) addBtn.click();
      const attach = document.getElementById("attach-event");
      if (attach) attach.value = pairLink.subject || "";
      const pairField = document.getElementById("pair-link-summary");
      if (pairField) {
        pairField.textContent = `${pairLink.dayOfWeek} · ${pairLink.timeRange} · ${pairLink.subject}`;
        pairField.dataset.linked = "1";
      }
      syncPairLinkClear();
      toast("Пара привязана к заметке");
    }, 120);
  }

  /* ─── Notes 2.0 ─── */
  function normalizeNote(raw) {
    if (!raw || typeof raw !== "object") return null;
    const uuid =
      raw.uuid ||
      (typeof window.SetUUID === "function"
        ? window.SetUUID()
        : `legacy-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const priority = PRIORITY_META[raw.priority] ? raw.priority : "normal";
    return {
      title: String(raw.title || "Без названия").slice(0, MAX_NOTE_TITLE),
      subject: String(raw.subject || "Общий").slice(0, 128),
      description: String(raw.description || "").slice(0, MAX_NOTE_DESC),
      time: String(raw.time || ""),
      uuid: String(uuid),
      pin: Boolean(raw.pin),
      pairLink: raw.pairLink && typeof raw.pairLink === "object" ? raw.pairLink : null,
      deadline: raw.deadline || null,
      priority,
      done: Boolean(raw.done),
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  function readNotes() {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem("notes") || "[]");
    } catch (_) {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    const normalized = list.map(normalizeNote).filter(Boolean);
    const changed = JSON.stringify(list) !== JSON.stringify(normalized);
    if (changed) localStorage.setItem("notes", JSON.stringify(normalized));
    return normalized;
  }

  function writeNotes(list) {
    localStorage.setItem("notes", JSON.stringify(list.map(normalizeNote).filter(Boolean)));
  }

  function deadlineUrgency(deadline) {
    if (!deadline) return null;
    const end = new Date(deadline);
    if (Number.isNaN(end.getTime())) return null;
    const now = new Date();
    const diffH = (end - now) / 3600000;
    if (diffH < 0) return "overdue";
    if (diffH <= 24) return "soon";
    if (diffH <= 72) return "near";
    return "ok";
  }

  function formatDeadline(deadline) {
    if (!deadline) return "";
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function collectPairLinkFromForm() {
    const pending = sessionStorage.getItem("pendingPairLink");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        sessionStorage.removeItem("pendingPairLink");
        return parsed;
      } catch (_) {}
    }
    const summary = document.getElementById("pair-link-summary");
    if (summary?.dataset.linked === "1" && summary.dataset.payload) {
      try {
        return JSON.parse(summary.dataset.payload);
      } catch (_) {}
    }
    return null;
  }

  function sanitizeAiHtml(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    const allowed = new Set(["B", "STRONG", "I", "EM", "U", "S", "BR", "P", "UL", "OL", "LI", "A"]);
    template.content.querySelectorAll("*").forEach((node) => {
      if (!allowed.has(node.tagName)) {
        node.replaceWith(...node.childNodes);
        return;
      }
      [...node.attributes].forEach((attr) => {
        if (node.tagName === "A" && attr.name === "href" && /^(https?:|tg:)/i.test(attr.value)) {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
        } else node.removeAttribute(attr.name);
      });
    });
    return template.content;
  }

  function fillNoteForm(note) {
    const title = document.getElementById("name-event");
    const time = document.getElementById("time-event");
    const subject = document.getElementById("attach-event");
    const description = document.getElementById("extra-event");
    const deadline = document.getElementById("deadline-event");
    const priority = document.getElementById("priority-event");
    const pairSummary = document.getElementById("pair-link-summary");

    if (title) title.value = note?.title || "";
    if (time) time.value = note?.time || "";
    if (subject) subject.value = note?.subject || "";
    if (description) description.value = note?.description || "";
    if (deadline) {
      if (note?.deadline) {
        const d = new Date(note.deadline);
        deadline.value = Number.isNaN(d.getTime())
          ? ""
          : new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
      } else deadline.value = "";
    }
    if (priority) priority.value = note?.priority || "normal";
    if (pairSummary) {
      if (note?.pairLink) {
        pairSummary.dataset.linked = "1";
        pairSummary.dataset.payload = JSON.stringify(note.pairLink);
        pairSummary.textContent = `${note.pairLink.dayOfWeek || ""} · ${note.pairLink.timeRange || ""} · ${note.pairLink.subject || ""}`.trim();
      } else {
        pairSummary.dataset.linked = "0";
        delete pairSummary.dataset.payload;
        pairSummary.textContent = "Не привязана — удержите пару в расписании";
      }
      syncPairLinkClear();
    }
  }

  function readNoteForm(base = {}) {
    const titleEl = document.getElementById("name-event");
    const timeEl = document.getElementById("time-event");
    const subjectEl = document.getElementById("attach-event");
    const descEl = document.getElementById("extra-event");
    const deadlineEl = document.getElementById("deadline-event");
    const priorityEl = document.getElementById("priority-event");

    const title = (titleEl?.value || "").trim();
    if (!title) return { error: "title" };

    let time = (timeEl?.value || "").trim();
    if (!time) {
      const n = new Date();
      time = `${n.getDate()}.${String(n.getMonth() + 1).padStart(2, "0")}.${n.getFullYear()} ${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
    }

    let deadline = deadlineEl?.value ? new Date(deadlineEl.value).toISOString() : null;
    if (deadlineEl?.value && Number.isNaN(new Date(deadlineEl.value).getTime())) {
      deadline = null;
    }

    const pairLink = collectPairLinkFromForm() || base.pairLink || null;
    const subject = (subjectEl?.value || "").trim() || pairLink?.subject || "Общий";

    return {
      note: normalizeNote({
        ...base,
        title,
        time,
        subject,
        description: (descEl?.value || "").slice(0, MAX_NOTE_DESC),
        deadline,
        priority: priorityEl?.value || "normal",
        pairLink,
        updatedAt: new Date().toISOString(),
        uuid: base.uuid || (typeof window.SetUUID === "function" ? window.SetUUID() : undefined),
        createdAt: base.createdAt || new Date().toISOString(),
      }),
    };
  }

  async function persistNotesAndSync() {
    if (typeof window.sendExtra === "function") {
      await window.sendExtra();
    }
    try {
      await api("/extra/notes", {
        method: "POST",
        body: JSON.stringify({ notes: readNotes() }),
      });
    } catch (err) {
      console.warn("notes sync endpoint unavailable, extra/theme used", err);
    }
  }

  window.saveNoteNew = function saveNoteNewV2() {
    const result = readNoteForm();
    if (result.error) {
      safeHaptic("error");
      const name = document.getElementById("name-event");
      if (name) name.style.outline = "2px solid var(--tg-theme-destructive-text-color)";
      setTimeout(() => {
        if (name) name.style.outline = "none";
      }, 2500);
      return;
    }
    const notes = readNotes();
    notes.push(result.note);
    writeNotes(notes);
    persistNotesAndSync().then(() => {
      window.getNotes();
      safeHaptic("success");
    });
    document.getElementById("note-add-btn")?.click();
  };

  window.getEdinNoteData = async function getEdinNoteDataV2(id) {
    const notes = readNotes();
    const idx = notes.findIndex((n) => String(n.uuid) === String(id));
    if (idx < 0) return;
    const result = readNoteForm(notes[idx]);
    if (result.error) {
      safeHaptic("error");
      return;
    }
    notes[idx] = result.note;
    writeNotes(notes);
    const eventInput = document.getElementById("event-input");
    if (eventInput?.querySelector(".event-header h4")) {
      eventInput.querySelector(".event-header h4").textContent = "Добавление события";
    }
    if (typeof window.CloseBG === "function") window.CloseBG();
    const addBtn = document.getElementById("note-add-btn");
    if (addBtn) addBtn.style.display = "flex";
    const saveBtn = document.getElementById("save-event-btn");
    if (saveBtn) saveBtn.onclick = window.saveNoteNew;
    await persistNotesAndSync();
    window.getNotes();
    safeHaptic("success");
  };

  window.editNote = function editNoteV2(id) {
    const addBtn = document.getElementById("note-add-btn");
    if (addBtn) addBtn.style.display = "none";
    if (typeof window.ShowAdd === "function") window.ShowAdd();
    const eventInput = document.getElementById("event-input");
    if (eventInput?.querySelector(".event-header h4")) {
      eventInput.querySelector(".event-header h4").textContent = "Редактирование";
    }
    const notes = readNotes();
    const note = notes.find((n) => String(n.uuid) === String(id));
    if (!note) return;
    fillNoteForm(note);
    const saveBtn = document.getElementById("save-event-btn");
    if (saveBtn) saveBtn.onclick = () => window.getEdinNoteData(id);
  };

  window.toggleNoteDone = async function toggleNoteDone(id) {
    const notes = readNotes();
    const note = notes.find((n) => String(n.uuid) === String(id));
    if (!note) return;
    note.done = !note.done;
    note.updatedAt = new Date().toISOString();
    writeNotes(notes);
    await persistNotesAndSync();
    window.getNotes();
    safeImpact("soft");
  };

  window.jumpToPairLink = function jumpToPairLink(id) {
    const note = readNotes().find((n) => String(n.uuid) === String(id));
    if (!note?.pairLink) {
      toast("Нет привязки к паре");
      return;
    }
    const { weekIndex, dayOfWeek } = note.pairLink;
    const dayIdx = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"].indexOf(dayOfWeek);
    if (typeof weekIndex === "number") {
      if (typeof window.jumpToScheduleWeek === "function") {
        // мгновенный рендер нужной недели и дня из кэша (window.scheduleWeekIndex
        // не работает: main.js читает собственную let-переменную, а не свойство window)
        window.jumpToScheduleWeek(weekIndex, dayIdx);
      } else if (typeof window.getSchedule1 === "function") {
        window.getSchedule1(true, weekIndex);
      }
    }
    document.getElementById("schedule-show")?.click();
    setTimeout(() => {
      if (dayIdx >= 0) {
        document.querySelector(".swiper")?.swiper?.slideToLoop?.(dayIdx);
        document.querySelectorAll(".btnD")[dayIdx]?.click?.();
      }
      setTimeout(() => {
        document.querySelectorAll(".lesson-row").forEach((row) => {
          row.classList.remove("pair-flash");
          const samePair = note.pairLink.pairId
            ? row.dataset.pairId === note.pairLink.pairId
            : row.dataset.subject === note.pairLink.subject && String(row.dataset.lessonCode) === String(note.pairLink.lessonCode || "");
          if (samePair) {
            row.classList.add("pair-flash");
            row.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => row.classList.remove("pair-flash"), 3000);
          }
        });
      }, 400);
    }, 500);
    safeHaptic("success");
  };

  window.getNotes = function getNotesV2() {
    const notesArea = document.querySelector(".notes-area");
    if (!notesArea) return;
    const filter = localStorage.getItem(NOTES_FILTER_KEY) || "all";
    let notes = readNotes();

    notes = notes.slice().sort((a, b) => {
      if (a.pin !== b.pin) return a.pin ? -1 : 1;
      if (a.done !== b.done) return a.done ? 1 : -1;
      const pa = { urgent: 0, high: 1, normal: 2, low: 3 }[a.priority] ?? 2;
      const pb = { urgent: 0, high: 1, normal: 2, low: 3 }[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return da - db;
    });

    if (filter === "open") notes = notes.filter((n) => !n.done);
    if (filter === "done") notes = notes.filter((n) => n.done);
    if (filter === "deadlines") notes = notes.filter((n) => n.deadline && !n.done);
    if (filter === "linked") notes = notes.filter((n) => n.pairLink);

    notesArea.innerHTML = "";

    const toolbar = document.createElement("div");
    toolbar.className = "notes-toolbar";
    toolbar.innerHTML = ["all", "open", "deadlines", "linked", "done"]
      .map((f) => {
        const labels = {
          all: "Все",
          open: "Активные",
          deadlines: "Дедлайны",
          linked: "К парам",
          done: "Готово",
        };
        return `<button type="button" class="notes-filter-btn${filter === f ? " is-active" : ""}" data-filter="${f}">${labels[f]}</button>`;
      })
      .join("");
    notesArea.appendChild(toolbar);
    toolbar.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem(NOTES_FILTER_KEY, btn.dataset.filter);
        window.getNotes();
        safeImpact("light");
      });
    });

    if (!notes.length) {
      notesArea.insertAdjacentHTML(
        "beforeend",
        `<div class="note empty-note-v2">
          <h2>Пока пусто</h2>
          <p>Удержите пару в расписании — заметка привяжется автоматически. Добавьте дедлайн, чтобы не пропустить сдачу.</p>
        </div>`,
      );
      paintNoteBadgesOnLessons();
      renderDeadlinesStrip();
      return;
    }

    notes.forEach((note) => {
      const urgency = deadlineUrgency(note.deadline);
      const prio = PRIORITY_META[note.priority] || PRIORITY_META.normal;
      let clasS = `note note-v2 ${prio.className}`;
      if (note.pin || localStorage.getItem("pin-note") === String(note.uuid)) clasS += " pinned";
      if (note.done) clasS += " is-done";
      if (urgency) clasS += ` deadline-${urgency}`;

      const pairBtn = note.pairLink
        ? `<button type="button" class="note-btn-jump" onclick="jumpToPairLink('${note.uuid}')" title="К паре">↗</button>`
        : "";

      notesArea.insertAdjacentHTML(
        "beforeend",
        `<article id="note-${escapeAttr(note.uuid)}" class="${clasS}">
          <div class="note-top">
            <button type="button" class="note-check" onclick="toggleNoteDone('${escapeAttr(note.uuid)}')" aria-label="Готово">${note.done ? "✓" : ""}</button>
            <h2>${escapeHtml(note.title)}</h2>
            <span class="note-prio-chip">${prio.label}</span>
          </div>
          <div class="note-meta">
            <time>${escapeHtml(note.time)}</time>
            <span class="note-subject">${escapeHtml(note.subject)}</span>
            ${note.deadline ? `<span class="note-deadline" data-urgency="${urgency || ""}">⏳ ${escapeHtml(formatDeadline(note.deadline))}</span>` : ""}
          </div>
          ${note.pairLink ? `<button type="button" class="note-pair-chip" onclick="jumpToPairLink('${escapeAttr(note.uuid)}')">📎 ${escapeHtml(note.pairLink.dayOfWeek || "")} · ${escapeHtml(note.pairLink.subject || "")}</button>` : ""}
          ${note.description ? `<p>${escapeHtml(note.description)}</p>` : ""}
          <div class="note-btn-container">
            <button class="note-btn-edit" onclick="editNote('${escapeAttr(note.uuid)}')" aria-label="Редактировать">✎</button>
            <button class="note-btn-pin" onclick="pinNote('${escapeAttr(note.uuid)}')" aria-label="Закрепить">📌</button>
            ${pairBtn}
            <button class="note-btn-del" onclick="delNote('${escapeAttr(note.uuid)}')" aria-label="Удалить">🗑</button>
          </div>
        </article>`,
      );
    });

    paintNoteBadgesOnLessons();
    renderDeadlinesStrip();
  };

  function paintNoteBadgesOnLessons() {
    document.querySelectorAll(".lesson-note-dot").forEach((el) => el.remove());
    if (document.body.classList.contains("pref-noteBadges-off")) return;
    const openLinked = readNotes().filter((n) => n.pairLink && !n.done);
    document.querySelectorAll(".lesson-row").forEach((row) => {
      if (row.closest("#demo-lesson")) return;
      const hits = openLinked.filter(
        (n) =>
          n.pairLink.subject === row.dataset.subject &&
          String(n.pairLink.lessonCode || "") === String(row.dataset.lessonCode || ""),
      );
      if (!hits.length) return;
      const dot = document.createElement("span");
      dot.className = "lesson-note-dot";
      const urgent = hits.some((h) => h.priority === "urgent" || deadlineUrgency(h.deadline) === "soon" || deadlineUrgency(h.deadline) === "overdue");
      if (urgent) dot.classList.add("is-urgent");
      dot.textContent = String(hits.length);
      dot.title = hits.map((h) => h.title).join(", ");
      row.appendChild(dot);
    });
  }

  function renderDeadlinesStrip() {
    let strip = document.getElementById("deadlines-strip");
    const summary = document.getElementById("summary-screen");
    if (!summary) return;
    if (!strip) {
      strip = document.createElement("div");
      strip.id = "deadlines-strip";
      summary.insertBefore(strip, summary.querySelector(".now-lesson-summary-container"));
    }
    const upcoming = readNotes()
      .filter((n) => n.deadline && !n.done)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 4);
    if (!upcoming.length) {
      strip.innerHTML = "";
      strip.hidden = true;
      return;
    }
    strip.hidden = false;
    strip.innerHTML =
      `<div class="deadlines-strip-head">Дедлайны</div>` +
      upcoming
        .map((n) => {
          const u = deadlineUrgency(n.deadline);
          return `<button type="button" class="deadline-pill deadline-${u}" onclick="document.getElementById('notes-show').click()">
            <strong>${escapeHtml(n.title)}</strong>
            <span>${escapeHtml(formatDeadline(n.deadline))}</span>
          </button>`;
        })
        .join("");
  }

  /* ─── Share schedule as PNG ─── */
  function collectDayLessonsFromDom(dayEl) {
    if (!dayEl) return [];
    return Array.from(dayEl.querySelectorAll(".lesson-row"))
      .filter((r) => r.style.display !== "none")
      .map((row) => ({
        code: row.querySelector(".lesson")?.textContent?.trim() || "",
        time: row.querySelector(".time")?.textContent?.trim() || "",
        subject: row.querySelector(".subject")?.textContent?.trim() || "",
        room: (row.querySelector(".room")?.textContent || "").replace(/[()]/g, "").trim(),
        teacher: row.querySelector(".tname")?.textContent?.trim() || "",
      }));
  }

  function getActiveDayElement() {
    const swiper = document.querySelector(".swiper")?.swiper;
    const idx = swiper?.realIndex ?? 0;
    return document.querySelectorAll(".swiper-slide .day")[idx] || document.querySelector(".day");
  }

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function drawScheduleCard({ title, subtitle, weekLabel, lessons, days, mode }) {
    const W = 1080;
    const pad = 48;
    const headerH = 280;
    const textLeft = pad + 110;
    const maxTextW = W - pad - 30 - textLeft;
    const DAY_HEAD = 56; // заголовок мини-блока дня: подпись + линия
    const GROUP_GAP = 24; // зазор между мини-блоками дней

    // Проход 1: измеряем текст и считаем высоту каждой строки — предмет
    // переносится на несколько строк (до трёх), высота карточки от контента.
    const measure = document.createElement("canvas").getContext("2d");
    const subjectFont = "700 34px system-ui, -apple-system, sans-serif";
    const metaFont = "400 24px system-ui, -apple-system, sans-serif";
    const measureRow = (lesson) => {
      const lines = wrapCardText(measure, lesson.subject, maxTextW, 3);
      measure.font = metaFont;
      const meta = fitCardText(
        measure,
        [lesson.room && `ауд. ${lesson.room}`, lesson.teacher].filter(Boolean).join(" · "),
        maxTextW,
      );
      measure.font = subjectFont;
      // 40 = отступ времени, 84 = базовая линия предмета, +40 за строку,
      // 38 = мета-строка, 18 = нижний паддинг карточки
      const height = 84 + (lines.length - 1) * 40 + 38 + 18;
      return { lesson, lines, meta, height };
    };
    const groups = (days || []).map((d) => ({ name: d.name, rows: d.lessons.map(measureRow) }));
    const rows = groups.length ? [] : (lessons || []).map(measureRow);

    const rowsH = groups.length
      ? groups.reduce(
          (sum, g) =>
            sum + DAY_HEAD + g.rows.reduce((s, r) => s + r.height + 18, 0) + GROUP_GAP,
          0,
        ) - GROUP_GAP
      : rows.reduce((sum, row) => sum + row.height + 18, 0) - 18;
    const H = Math.max(720, headerH + Math.max(rowsH, 140) + 160);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const bg = cssVar("--tg-theme-bg-color", "#171F30");
    const card = cssVar("--tg-theme-secondary-bg-color", "#242F43");
    const accent = cssVar("--tg-theme-button-color", "#3390ec");
    const text = cssVar("--tg-theme-text-color", "#ffffff");
    const hint = cssVar("--tg-theme-hint-color", "#8b9bb4");

    // background atmosphere
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bg);
    grad.addColorStop(1, card);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(W - 80, 80, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = text;
    ctx.font = "700 54px system-ui, -apple-system, sans-serif";
    ctx.fillText(title.slice(0, 28), pad, 90);

    ctx.fillStyle = hint;
    ctx.font = "400 32px system-ui, -apple-system, sans-serif";
    ctx.fillText(subtitle.slice(0, 48), pad, 140);

    // week chip
    ctx.fillStyle = accent;
    roundRect(ctx, pad, 170, 420, 56, 16);
    ctx.fill();
    ctx.fillStyle = cssVar("--tg-theme-button-text-color", "#fff");
    ctx.font = "600 28px system-ui, -apple-system, sans-serif";
    ctx.fillText(weekLabel.slice(0, 24), pad + 22, 208);

    let y = headerH;
    if (!rows.length && !groups.length) {
      ctx.fillStyle = card;
      roundRect(ctx, pad, y, W - pad * 2, 140, 24);
      ctx.fill();
      ctx.fillStyle = text;
      ctx.font = "600 36px system-ui, -apple-system, sans-serif";
      ctx.fillText(mode === "summary" ? "Сегодня пар нет" : "Пар нет — можно отдыхать", pad + 36, y + 82);
    } else {
      const drawRow = ({ lesson, lines, meta, height }, i) => {
        ctx.fillStyle = i % 2 === 0 ? card : mixColor(card, bg, 0.35);
        roundRect(ctx, pad, y, W - pad * 2, height, 22);
        ctx.fill();

        ctx.fillStyle = accent;
        roundRect(ctx, pad + 18, y + (height - 64) / 2, 64, 64, 16);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "700 30px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(lesson.code || i + 1).slice(0, 2), pad + 50, y + height / 2 + 10);
        ctx.textAlign = "left";

        ctx.fillStyle = hint;
        ctx.font = "600 26px system-ui, -apple-system, sans-serif";
        ctx.fillText((lesson.time || "").slice(0, 20), textLeft, y + 40);

        ctx.fillStyle = text;
        ctx.font = subjectFont;
        lines.forEach((lineText, li) => {
          ctx.fillText(lineText, textLeft, y + 84 + li * 40);
        });

        ctx.fillStyle = hint;
        ctx.font = metaFont;
        ctx.fillText(meta, textLeft, y + 84 + (lines.length - 1) * 40 + 38);

        y += height + 18;
      };

      if (groups.length) {
        // Мини-блоки по дням: подпись дня акцентом + линия, под ней пары дня
        groups.forEach(({ name, rows: groupRows }) => {
          ctx.fillStyle = accent;
          ctx.font = "700 30px system-ui, -apple-system, sans-serif";
          ctx.fillText(name, pad + 6, y + 30);
          ctx.fillStyle = hint;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(pad + 6, y + 44, W - pad * 2 - 12, 2);
          ctx.globalAlpha = 1;
          y += DAY_HEAD;
          groupRows.forEach(drawRow);
          y += GROUP_GAP;
        });
      } else {
        rows.forEach(drawRow);
      }
    }

    ctx.fillStyle = accent;
    roundRect(ctx, pad, H - 110, W - pad * 2, 70, 18);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 28px system-ui, -apple-system, sans-serif";
    ctx.fillText("BoostBot · t.me/mietcbot", pad + 28, H - 64);

    return canvas;
  }

  function wrapCardText(ctx, value, maxW, maxLines = 3) {
    // Перенос по словам; если строки кончились, а слова нет — многоточие
    const normalized = String(value || "—").replace(/\s+/g, " ").trim();
    const words = normalized.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (!line || ctx.measureText(candidate).width <= maxW) {
        line = candidate;
      } else {
        lines.push(line);
        if (lines.length >= maxLines) break;
        line = word;
      }
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
      let last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + "…").width > maxW) {
        last = last.slice(0, -1).trimEnd();
      }
      lines[maxLines - 1] = last + "…";
    }
    return lines;
  }

  function fitCardText(ctx, value, maxW) {
    let s = String(value || "");
    if (ctx.measureText(s).width <= maxW) return s;
    while (s.length > 1 && ctx.measureText(s + "…").width > maxW) {
      s = s.slice(0, -1).trimEnd();
    }
    return s + "…";
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function mixColor(a, b, t) {
    // simple fallback — return a if parse fails
    try {
      const pa = parseHex(a);
      const pb = parseHex(b);
      if (!pa || !pb) return a;
      const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
      return `rgb(${m[0]},${m[1]},${m[2]})`;
    } catch (_) {
      return a;
    }
  }

  function parseHex(c) {
    if (!c) return null;
    let s = c.trim();
    if (s.startsWith("#") && (s.length === 7 || s.length === 4)) {
      if (s.length === 4) s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
      return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
    }
    const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (m) return [+m[1], +m[2], +m[3]];
    return null;
  }

  async function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob failed"));
      }, "image/png");
    });
  }

  async function uploadShareBlob(blob, weekRange = null, cardDate = null) {
    const form = new FormData();
    form.append("file", blob, "schedule.png");
    form.append(
      "meta",
      JSON.stringify({
        group: localStorage.getItem("userGroup") || "",
        week: weekRange || (window.scheduleWeekIndex ?? getScheduleWeekIndexFixed()),
        ...(cardDate ? { date: `${cardDate.slice(0, 2)}.${cardDate.slice(2, 4)}` } : {}),
      }),
    );
    // Жёсткий таймаут: пока идёт заливка, юзер сидит на кнопке «Отправить»
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(`${API_BASE}/share/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`upload ${res.status}`);
      const data = await res.json();
      if (!data?.url) throw new Error("no url");
      try {
        sessionStorage.setItem("lastSharePublicUrl", data.url);
      } catch (_) {}
      return data.url;
    } finally {
      clearTimeout(timer);
    }
  }

  function botSharePayloadLink() {
    // Deep link с payload группы: получатель получает карточку и атрибуцию
    const group = localStorage.getItem("userGroup") || "";
    const b64 = btoa(unescape(encodeURIComponent(group || "boost")))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return `https://t.me/${BOT_USERNAME}?start=share_${b64}`;
  }

  function inTelegramWeb() {
    return Boolean(tg?.platform && tg.platform !== "unknown");
  }

  function openBotChat(url) {
    // Открытие без баннер-артефактов: если клиент не переключился на чат с
    // ботом, кнопка «Открыть бота» остаётся в шите — отдельный слой не нужен
    try {
      if (/^https:\/\/t\.me\//.test(url) && typeof tg?.openTelegramLink === "function") {
        tg.openTelegramLink(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      return true;
    } catch (err) {
      console.warn("open bot link failed", err);
      return false;
    }
  }

  /* ─── Share sheet: данные карточек ───
   * Все 4 недели цикла приходят одним ответом /schedulejson (кэш в
   * main.js), поэтому и дневные, и недельные карточки рисуем из данных:
   * не трогаем DOM расписания (раньше недельная карточка переключала
   * расписание юзера на нужную неделю и ждала 700мс — гонка и мигание)
   * и честно применяем локальные правки (alias/аудитория/скрытые пары). */
  const SHARE_DAY_ORDER = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

  const shareState = {
    mode: "day", // "day" | "week"
    dayIdx: 0,
    weekIdx: 0,
    monday: null,
    canvas: null,
    payload: null,
    busy: false,
    lastUrl: null,
  };

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function fmtDDMM(d) {
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
  }

  function fmtWeekRange(monday) {
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return `${fmtDDMM(monday)}-${fmtDDMM(sunday)}`;
  }

  function displayedWeekMonday() {
    const monday = window.getRealWeekMonday?.(window.getScheduleWeekOffset?.() ?? 0);
    return monday instanceof Date && !Number.isNaN(monday.getTime()) ? monday : null;
  }

  function shareRowsCache() {
    try {
      if (typeof window.getScheduleRows === "function") {
        const rows = window.getScheduleRows();
        if (rows?.rows?.length) return rows;
      }
    } catch (_) {}
    try {
      const cached = JSON.parse(localStorage.getItem("schedule_json") || "null");
      if (cached?.rows?.length) return { rows: cached.rows, times: cached.times };
    } catch (_) {}
    return null;
  }

  function dayLessonsFromData(weekIdx, dayIdx) {
    const cache = shareRowsCache();
    if (!cache) return null;
    const dayName = SHARE_DAY_ORDER[dayIdx];
    const times = cache.times || {};
    const overrides = readOverrides();
    const rows = (cache.rows || [])
      .filter((r) => Number(r.day_number) === Number(weekIdx) && Number(r.day_of_week) === dayIdx + 1)
      .sort((a, b) => Number(a.lesson_code || 0) - Number(b.lesson_code || 0));
    const lessons = [];
    for (const r of rows) {
      const code = String(r.lesson_code ?? "");
      const t = times[code] ?? times[r.lesson_code];
      const time = Array.isArray(t) ? t.join(" - ") : String(t || "").replace(",", " - ");
      const subject = String(r.subject_name || "—");
      const ov = overrides[`${weekIdx}|${dayName}|${code}|${subject}`];
      if (ov?.hidden) continue;
      const fallbackTime = [r.lesson_start, r.lesson_end]
        .filter(Boolean)
        .map((s) => String(s).slice(0, 5))
        .join(" - ");
      lessons.push({
        code,
        time: time || fallbackTime,
        subject: ov?.alias || subject,
        room: ov?.roomOverride || String(r.room_name || "").replace(/[()]/g, "").trim(),
        teacher: String(r.teacher_full || "").trim(),
      });
    }
    return lessons;
  }

  // Фолбэк на DOM — только когда кэша данных нет, а нужная неделя на экране
  function dayLessonsFromDom(dayIdx) {
    const dayEls = document.querySelectorAll(".swiper-slide .day");
    return collectDayLessonsFromDom(dayEls[dayIdx] || getActiveDayElement());
  }

  function buildShareDayCard(weekIdx, dayIdx, monday) {
    const group = localStorage.getItem("userGroup") || "Группа";
    const base = monday ?? displayedWeekMonday();
    const dayName = SHARE_DAY_ORDER[dayIdx] ?? "День";
    const date = base
      ? new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayIdx)
      : null;
    let lessons = dayLessonsFromData(weekIdx, dayIdx);
    if (lessons === null) lessons = dayLessonsFromDom(dayIdx);
    const canvas = drawScheduleCard({
      title: group,
      subtitle: date ? `${dayName}, ${fmtDDMM(date)}` : dayName,
      weekLabel: WEEK_TITLES[weekIdx] || `Неделя ${weekIdx + 1}`,
      lessons,
      mode: "day",
    });
    return {
      canvas,
      weekRange: null,
      cardDate: date ? `${pad2(date.getDate())}${pad2(date.getMonth() + 1)}` : null,
      filename: `${group}-${dayName}.png`,
    };
  }

  function buildShareWeekCard(weekIdx, monday) {
    const group = localStorage.getItem("userGroup") || "Группа";
    const base = monday ?? displayedWeekMonday();
    const displayed = Number(window.scheduleWeekIndex ?? getScheduleWeekIndexFixed());
    const cache = shareRowsCache();
    // без кэша доступна только неделя на экране (DOM)
    if (!cache && weekIdx !== displayed) return null;
    const dayBlocks = [];
    SHARE_DAY_ORDER.forEach((dayName, i) => {
      const lessons = dayLessonsFromData(weekIdx, i) ?? dayLessonsFromDom(i);
      if (lessons.length) {
        dayBlocks.push({
          name: DAY_SHORT_NAMES[dayName] ?? dayName.slice(0, 2),
          lessons: lessons.slice(0, 8),
        });
      }
    });
    const canvas = drawScheduleCard({
      title: group,
      subtitle: base ? fmtWeekRange(base) : WEEK_TITLES[weekIdx] || `Неделя ${weekIdx + 1}`,
      weekLabel: WEEK_TITLES[weekIdx] || "",
      days: dayBlocks,
      mode: "week",
    });
    return {
      canvas,
      weekRange: base ? fmtWeekRange(base) : null,
      cardDate: null,
      filename: `${group}-week-${weekIdx + 1}.png`,
    };
  }

  /* ─── Share sheet: UI ─── */
  function ensureShareSheet() {
    if (document.getElementById("share-sheet-modal")) return;
    const sheet = document.createElement("div");
    sheet.id = "share-sheet-modal";
    sheet.className = "share-sheet-modal";
    sheet.hidden = true;
    sheet.innerHTML = `
      <div class="share-sheet" role="dialog" aria-modal="true" aria-labelledby="share-sheet-title">
        <header>
          <h3 id="share-sheet-title">Поделиться</h3>
          <button type="button" id="share-sheet-close" aria-label="Закрыть">×</button>
        </header>
        <div class="share-mode-row" id="share-mode-row">
          <button type="button" class="share-mode-btn is-active" data-mode="day">День</button>
          <button type="button" class="share-mode-btn" data-mode="week">Неделя</button>
        </div>
        <div class="share-day-chips" id="share-day-chips"></div>
        <p class="share-sub-label" id="share-sub-label"></p>
        <div class="share-preview" id="share-preview"></div>
        <div class="share-sheet-actions" id="share-actions">
          <button type="button" id="share-download-btn" class="share-ghost-btn">Скачать PNG</button>
          <button type="button" id="share-send-btn" class="share-primary-btn">Отправить</button>
        </div>
        <div class="share-done" id="share-done" hidden>
          <p id="share-done-text"></p>
          <div class="share-sheet-actions">
            <button type="button" id="share-done-close" class="share-ghost-btn">Готово</button>
            <a id="share-open-link" class="share-primary-btn" href="#">Открыть бота</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet) closeShareSheet();
    });
    sheet.querySelector("#share-sheet-close").addEventListener("click", closeShareSheet);
    sheet.querySelector("#share-mode-row").addEventListener("click", (e) => {
      const btn = e.target.closest(".share-mode-btn");
      if (!btn) return;
      safeImpact("light");
      setShareMode(btn.dataset.mode);
    });
    sheet.querySelector("#share-day-chips").addEventListener("click", (e) => {
      const chip = e.target.closest(".share-day-chip");
      if (!chip) return;
      shareState.dayIdx = Number(chip.dataset.dayIdx) || 0;
      safeImpact("light");
      renderShareSheet();
    });
    sheet.querySelector("#share-send-btn").addEventListener("click", sendShareCard);
    sheet.querySelector("#share-download-btn").addEventListener("click", downloadShareCard);
    sheet.querySelector("#share-done-close").addEventListener("click", closeShareSheet);
    sheet.querySelector("#share-open-link").addEventListener("click", (e) => {
      e.preventDefault();
      if (shareState.lastUrl) openBotChat(shareState.lastUrl);
    });
  }

  function activeDayIndex() {
    const swiper = document.querySelector(".swiper")?.swiper;
    return Math.min(SHARE_DAY_ORDER.length - 1, Math.max(0, swiper?.realIndex ?? 0));
  }

  function openShareSheet(opts = {}) {
    ensureShareSheet();
    const displayed = Number(window.scheduleWeekIndex ?? getScheduleWeekIndexFixed());
    const monday = opts.monday instanceof Date && !Number.isNaN(opts.monday.getTime())
      ? opts.monday
      : displayedWeekMonday();
    const weekIdx = Number.isFinite(Number(opts.weekIdx))
      ? ((Number(opts.weekIdx) % 4) + 4) % 4
      : displayed;
    let dayIdx = Number.isFinite(Number(opts.dayIdx))
      ? Math.min(SHARE_DAY_ORDER.length - 1, Math.max(0, Number(opts.dayIdx)))
      : activeDayIndex();
    if (opts.todayIfVisible && monday) {
      // сегодня попадает в отображённую неделю? (в вс чипов нет — оставляем активный день)
      const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
      const diff = Math.floor((new Date().setHours(0, 0, 0, 0) - start.getTime()) / 86400000);
      if (diff >= 0 && diff <= 5) dayIdx = diff;
    }
    Object.assign(shareState, {
      mode: opts.mode === "week" ? "week" : "day",
      dayIdx,
      weekIdx,
      monday,
      busy: false,
      lastUrl: null,
    });
    const sheet = document.getElementById("share-sheet-modal");
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add("is-open"));
    renderShareSheet();
    safeImpact("light");
  }

  function closeShareSheet() {
    const sheet = document.getElementById("share-sheet-modal");
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove("is-open");
    setTimeout(() => {
      sheet.hidden = true;
      sheet.querySelector("#share-done").hidden = true;
      sheet.querySelector("#share-actions").hidden = false;
      sheet.querySelector("#share-preview").innerHTML = "";
    }, 200);
  }

  function setShareMode(mode) {
    const next = mode === "week" ? "week" : "day";
    if (shareState.mode === next) return;
    shareState.mode = next;
    renderShareSheet();
  }

  function renderDayChips(container) {
    container.innerHTML = "";
    SHARE_DAY_ORDER.forEach((dayName, i) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "share-day-chip" + (i === shareState.dayIdx ? " is-active" : "");
      chip.dataset.dayIdx = String(i);
      const date = shareState.monday
        ? new Date(shareState.monday.getFullYear(), shareState.monday.getMonth(), shareState.monday.getDate() + i)
        : null;
      chip.innerHTML = `<b>${DAY_SHORT_NAMES[dayName]}</b><span>${
        date ? `${date.getDate()}.${date.getMonth() + 1}` : ""
      }</span>`;
      container.appendChild(chip);
    });
  }

  function renderShareSheet() {
    const sheet = document.getElementById("share-sheet-modal");
    if (!sheet || sheet.hidden) return;
    sheet.querySelectorAll(".share-mode-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === shareState.mode);
    });
    const chips = sheet.querySelector("#share-day-chips");
    chips.hidden = shareState.mode !== "day";
    if (shareState.mode === "day") renderDayChips(chips);

    let payload;
    if (shareState.mode === "week") {
      payload = buildShareWeekCard(shareState.weekIdx, shareState.monday);
      if (!payload) {
        // данных по этой неделе нет — не показываем пустую карточку
        toast("Расписание ещё не загрузилось — попробуй чуть позже");
        shareState.mode = "day";
        return renderShareSheet();
      }
    } else {
      payload = buildShareDayCard(shareState.weekIdx, shareState.dayIdx, shareState.monday);
    }
    shareState.canvas = payload.canvas;
    shareState.payload = payload;

    const sub = sheet.querySelector("#share-sub-label");
    const weekTitle = WEEK_TITLES[shareState.weekIdx] || "";
    if (shareState.mode === "day") {
      const dayName = SHARE_DAY_ORDER[shareState.dayIdx];
      const date = shareState.monday
        ? new Date(
            shareState.monday.getFullYear(),
            shareState.monday.getMonth(),
            shareState.monday.getDate() + shareState.dayIdx,
          )
        : null;
      sub.textContent = date ? `${dayName}, ${fmtDDMM(date)} · ${weekTitle}` : dayName;
    } else {
      sub.textContent = shareState.monday
        ? `${fmtWeekRange(shareState.monday)} · ${weekTitle}`
        : weekTitle;
    }

    const preview = sheet.querySelector("#share-preview");
    preview.innerHTML = "";
    payload.canvas.className = "share-preview-canvas";
    preview.appendChild(payload.canvas);

    // «Скачать PNG» имеет смысл только там, где браузер умеет файлы:
    // в мобильных webview Telegram скачивание блокируется — там карточку
    // сохраняет кнопка бота «Сохранить на устройство»
    const platform = tg?.platform || "";
    const canDownload =
      !inTelegramWeb() || ["tdesktop", "macos", "web", "unified"].includes(platform);
    sheet.querySelector("#share-download-btn").hidden = !canDownload;
  }

  async function sendShareCard() {
    if (shareState.busy || !shareState.canvas) return;
    shareState.busy = true;
    const sendBtn = document.querySelector("#share-send-btn");
    const prevText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.textContent = "Готовлю…";
    try {
      const blob = await canvasToPngBlob(shareState.canvas);
      if (inTelegramWeb()) {
        await deliverViaBot(blob, shareState.payload);
      } else {
        await deliverNative(blob, shareState.payload);
      }
    } catch (err) {
      console.error(err);
      safeHaptic("error");
      toast("Не получилось поделиться — попробуй ещё раз");
    } finally {
      shareState.busy = false;
      sendBtn.disabled = false;
      sendBtn.textContent = prevText;
    }
  }

  async function deliverViaBot(blob, payload) {
    // В Telegram карточка живёт у бота: он отдаёт её с кнопками «Выбрать
    // чат»/«Сохранить». Заливка PNG — best effort: если не вышло, deep link
    // несёт дату/диапазон, и бот рисует карточку сам из расписания.
    const { weekRange, cardDate } = payload;
    let start = null;
    try {
      const publicUrl = await uploadShareBlob(blob, weekRange, cardDate);
      const digest = (publicUrl.split("/").pop() || "").replace(/\.png$/i, "").split("_").pop();
      if (/^[0-9a-f]{8,32}$/.test(digest)) {
        start = `card_${digest}`;
        if (weekRange) start += `_${weekRange.replace(/\./g, "")}`;
        else if (cardDate) start += `_${cardDate}`;
      }
    } catch (err) {
      console.warn("card upload failed — bot will render it server-side", err);
    }
    if (!start) {
      const today = new Date();
      start = weekRange
        ? `card_week_${weekRange.replace(/\./g, "")}`
        : `card_day_${cardDate || `${pad2(today.getDate())}${pad2(today.getMonth() + 1)}`}`;
    }
    const url = `https://t.me/${BOT_USERNAME}?start=${start}`;
    shareState.lastUrl = url;
    openBotChat(url);
    safeHaptic("success");
    showShareDone(
      "Карточка уже в чате с ботом — перешли её в любой чат или сохрани на устройство.",
      "Открыть бота",
    );
  }

  async function deliverNative(blob, payload) {
    // Вне Telegram: системный шеринг с настоящим вложением, затем буфер
    // обмена, в крайнем случае — публичная ссылка. Каждый шаг честно
    // сообщает результат, «тихих» провалов нет.
    const file = new File([blob], payload.filename || "schedule.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Расписание",
          text: `Расписание ${localStorage.getItem("userGroup") || ""} · ${botSharePayloadLink()}`,
        });
        safeHaptic("success");
        toast("Отправлено");
        closeShareSheet();
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.warn("share file failed", err);
      }
    }
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        safeHaptic("success");
        toast("Картинка в буфере обмена");
        closeShareSheet();
        return;
      }
    } catch (_) {}
    const publicUrl = await uploadShareBlob(blob);
    shareState.lastUrl = publicUrl;
    showShareDone(
      "Системный шеринг недоступен — вот прямая ссылка на карточку.",
      "Открыть картинку",
    );
  }

  function showShareDone(text, linkLabel) {
    const sheet = document.getElementById("share-sheet-modal");
    if (!sheet) return;
    sheet.querySelector("#share-done-text").textContent = text;
    sheet.querySelector("#share-open-link").textContent = linkLabel || "Открыть";
    sheet.querySelector("#share-actions").hidden = true;
    sheet.querySelector("#share-done").hidden = false;
  }

  function downloadShareCard() {
    if (!shareState.canvas) return;
    try {
      shareState.canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = shareState.payload?.filename || "schedule.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast("Картинка скачана");
      }, "image/png");
    } catch (_) {
      toast("Не удалось скачать — сохрани карточку через бота");
    }
  }

  window.shareCurrentDayCard = function shareCurrentDayCard() {
    openShareSheet();
  };

  window.shareSummaryCard = function shareSummaryCard() {
    openShareSheet({ todayIfVisible: true });
  };

  /* ─── Lesson card editor redesign ─── */
  function applyCardPreset(name) {
    const preset = CARD_PRESETS[name];
    if (!preset) return;
    const key = "customLessonCardSettings";
    const saved = {};
    Object.entries(preset).forEach(([prop, val]) => {
      if (prop === "label") return;
      document.documentElement.style.setProperty(prop, val);
      saved[prop] = val;
    });
    localStorage.setItem(key, JSON.stringify(saved));
    localStorage.setItem("lessonCardPreset", name);
    document.querySelectorAll(".lesson-preset-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.preset === name);
    });
    const resetBtn = document.querySelector(".reset-lesson-settings-c-btn");
    if (resetBtn) resetBtn.classList.remove("disabled");
    safeImpact("light");
    toast(`Пресет: ${preset.label}`);
  }

  function enhanceLessonEditor() {
    const tools = document.getElementById("lesson-tools-1");
    if (!tools || tools.dataset.enhanced === "1") return;
    tools.dataset.enhanced = "1";

    const presets = document.createElement("div");
    presets.className = "lesson-presets";
    presets.innerHTML = Object.entries(CARD_PRESETS)
      .map(
        ([id, p]) =>
          `<button type="button" class="lesson-preset-btn" data-preset="${id}">${p.label}</button>`,
      )
      .join("");
    tools.insertBefore(presets, tools.firstChild);
    presets.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => applyCardPreset(btn.dataset.preset));
    });

    const active = localStorage.getItem("lessonCardPreset");
    if (active) {
      presets.querySelector(`[data-preset="${active}"]`)?.classList.add("is-active");
    }

    const tip = document.createElement("p");
    tip.className = "lesson-editor-tip";
    tip.textContent = "Тап по элементу превью → тонкая настройка. Пресеты — для быстрого утра.";
    tools.insertBefore(tip, presets.nextSibling);

    const demo = document.getElementById("demo-lesson");
    if (demo) demo.classList.add("demo-lesson-v2");
  }

  /* ─── AI schedule chat ─── */
  const AI_QUOTA_KEY = "aiChatQuota_v1";
  const AI_FREE_DAILY = 5;
  const AI_PREMIUM_DAILY = 30;
  const AI_CHIPS = [
    "Когда следующая пара?",
    "Куда идти сейчас?",
    "Сколько пар сегодня?",
    "Что завтра?",
  ];

  function aiQuotaState() {
    const today = new Date().toISOString().slice(0, 10);
    let raw = {};
    try {
      raw = JSON.parse(localStorage.getItem(AI_QUOTA_KEY) || "{}") || {};
    } catch (_) {
      raw = {};
    }
    if (raw.day !== today) raw = { day: today, used: 0 };
    const premium =
      Boolean(tg?.initDataUnsafe?.user?.is_premium) ||
      localStorage.getItem("boostSoftPremium") === "1";
    // Лимит, возвращённый сервером (/ai/chat → quota), приоритетнее локальной догадки
    // по is_premium — на бэкенде премиум-статус может быть другим
    const limit =
      Number.isFinite(raw.limit) && raw.limit > 0 ? raw.limit : premium ? AI_PREMIUM_DAILY : AI_FREE_DAILY;
    return { ...raw, premium, limit, left: Math.max(0, limit - (raw.used || 0)) };
  }

  function syncAiQuota(quota) {
    // Сервер — источник истины по остатку квоты: перезаписываем им оптимистичный локальный счётчик
    if (!quota || typeof quota !== "object") return;
    const used = Number(quota.used);
    const limit = Number(quota.limit);
    if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return;
    localStorage.setItem(AI_QUOTA_KEY, JSON.stringify({ day: new Date().toISOString().slice(0, 10), used: Math.max(0, used), limit }));
  }

  function consumeAiQuota() {
    const st = aiQuotaState();
    if (st.left <= 0) return false;
    st.used = (st.used || 0) + 1;
    // limit сохраняем: там может лежать серверное значение из syncAiQuota
    localStorage.setItem(AI_QUOTA_KEY, JSON.stringify({ day: st.day, used: st.used, limit: st.limit }));
    return true;
  }

  function initAiChat() {
    if (document.getElementById("ai-chat-panel")) return;

    const panel = document.createElement("div");
    panel.id = "ai-chat-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="ai-chat-head">
        <strong>Спросить расписание</strong>
        <span id="ai-quota-label" class="ai-quota-label"></span>
        <button type="button" id="ai-chat-close" aria-label="Закрыть">×</button>
      </div>
      <div id="ai-chips" class="ai-chips"></div>
      <div id="ai-chat-log" class="ai-chat-log"></div>
      <form id="ai-chat-form" class="ai-chat-form">
        <input id="ai-chat-input" maxlength="200" placeholder="Когда следующая пара? Куда идти?" autocomplete="off" />
        <button type="submit" id="ai-chat-send" aria-label="Отправить">
          <svg class="neuron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
              <circle class="n-core" cx="12" cy="12" r="2.1" fill="currentColor" stroke="none"/>
              <path d="M12 9.9V5.4"/><circle class="n-node" cx="12" cy="3.9" r="1.4"/>
              <path d="M13.8 13.05l3.9 2.25"/><circle class="n-node" cx="19.1" cy="16" r="1.4"/>
              <path d="M10.2 13.05l-3.9 2.25"/><circle class="n-node" cx="4.9" cy="16" r="1.4"/>
              <path d="M10.7 10.6L6.9 8"/><circle class="n-node" cx="5.4" cy="7.2" r="1.4"/>
              <path d="M13.3 10.6l3.8-2.6"/><circle class="n-node" cx="18.6" cy="7.2" r="1.4"/>
            </g>
          </svg>
        </button>
      </form>
    `;
    document.body.appendChild(panel);

    const log = panel.querySelector("#ai-chat-log");
    const form = panel.querySelector("#ai-chat-form");
    const input = panel.querySelector("#ai-chat-input");
    const chips = panel.querySelector("#ai-chips");
    const quotaLabel = panel.querySelector("#ai-quota-label");
    const openChat = () => {
      panel.hidden = false;
      refreshQuotaLabel();
      input.focus();
      safeImpact("light");
    };

    function refreshQuotaLabel() {
      const st = aiQuotaState();
      quotaLabel.textContent = st.premium
        ? `${st.left}/${st.limit} ★`
        : `${st.left}/${st.limit}`;
    }

    chips.innerHTML = AI_CHIPS.map(
      (q) => `<button type="button" class="ai-chip" data-q="${escapeAttr(q)}">${escapeHtml(q)}</button>`,
    ).join("");
    chips.querySelectorAll(".ai-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        input.value = btn.dataset.q || "";
        form.requestSubmit();
      });
    });

    function appendMsg(role, text) {
      const div = document.createElement("div");
      div.className = `ai-msg ai-${role}`;
      if (role === "bot" && /<[^>]+>/.test(String(text))) {
        div.appendChild(sanitizeAiHtml(text));
      } else div.textContent = text;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }

    // Ассистент «звёздочка» открывает чат только если он включён в настройках
    const aiEnabled = () => localStorage.getItem("isActiveAI") !== "false";
    const openChatFromStarry = () => {
      if (!aiEnabled()) return;
      openChat();
    };
    document.getElementById("default-assistant")?.addEventListener("click", openChatFromStarry);
    document.getElementById("gloomy-asistant")?.addEventListener("click", openChatFromStarry);
    window.__openScheduleAi = openChatFromStarry;
    panel.querySelector("#ai-chat-close").addEventListener("click", () => {
      panel.hidden = true;
    });

    const sendBtn = panel.querySelector("#ai-chat-send");
    function setSendBusy(busy) {
      if (!sendBtn) return;
      sendBtn.disabled = busy;
      sendBtn.classList.toggle("is-thinking", busy);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sendBtn?.disabled) return;
      const q = (input.value || "").trim();
      if (!q) return;
      const st = aiQuotaState();
      if (st.left <= 0) {
        appendMsg(
          "bot",
          st.premium
            ? "Дневной лимит AI исчерпан. Завтра снова будет доступен."
            : "Лимит на сегодня закончился. Telegram Premium или серия 7 дней дают расширенную квоту.",
        );
        safeHaptic("error");
        refreshQuotaLabel();
        return;
      }
      if (!consumeAiQuota()) return;
      refreshQuotaLabel();
      input.value = "";
      setSendBusy(true);
      appendMsg("user", q);
      appendMsg("bot", "Думаю");
      const pending = log.lastChild;
      pending.classList.add("ai-thinking");
      try {
        const data = await api("/ai/chat", {
          method: "POST",
          body: JSON.stringify({ message: q }),
        });
        // Ответ несёт актуальный остаток квоты — корректируем локальный счётчик
        if (data?.quota) syncAiQuota(data.quota);
        refreshQuotaLabel();
        pending.classList.remove("ai-thinking");
        pending.replaceChildren();
        const reply = data?.reply ||
          (data?.status === "rejected"
            ? "Могу помочь только с вопросами по расписанию."
            : "Не получилось ответить. Попробуй иначе.");
        pending.appendChild(/<[^>]+>/.test(reply) ? sanitizeAiHtml(reply) : document.createTextNode(reply));
        safeHaptic("success");
      } catch (err) {
        pending.classList.remove("ai-thinking");
        const errText = String(err?.message || "");
        // В теле 429 сервер отдаёт {used, limit} — синхронизируем и его,
        // чтобы остаток в шапке совпадал с сервером
        const jsonAt = errText.indexOf("{");
        if (errText.includes("429") && jsonAt !== -1) {
          try {
            syncAiQuota(JSON.parse(errText.slice(jsonAt)));
            refreshQuotaLabel();
          } catch (_) {}
        }
        pending.textContent = errText.includes("429")
          ? "Дневная квота AI исчерпана. Завтра лимит обновится."
          : "Сеть или сервер недоступны. Проверь интернет.";
        safeHaptic("error");
      } finally {
        setSendBusy(false);
      }
    });

    refreshQuotaLabel();
  }

  /* ─── Share UI injection ─── */
  function injectMainShareButton() {
    const header = document.querySelector("header");
    if (!header || document.getElementById("main-share-btn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "main-share-btn";
    btn.setAttribute("aria-label", "Поделиться расписанием");
    btn.title = "Поделиться расписанием";
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="currentColor" d="M18 16.1c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 1 0-3-3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9a3 3 0 0 0 0 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a2.92 2.92 0 1 0 2.92-2.9z"/>' +
      "</svg>";
    btn.addEventListener("click", () => window.shareCurrentDayCard());
    header.appendChild(btn);
  }

  function injectShareButtons() {
    injectMainShareButton();
    // calendar week headers — share inside week-type selector (per week block)
    const cal = document.getElementById("calendarContainer");
    if (cal) {
      cal.querySelectorAll(".calendar-week-header").forEach((header) => {
        if (header.querySelector(".share-week-type-btn")) return;
        const weekBlock = header.closest(".calendar-week-block");
        const weekId = calendarWeeksIndexFromTitle(
          header.querySelector(".calendar-week-title")?.textContent,
        );
        // Реальный понедельник кликнутого блока (а не типа недели!) —
        // берём из даты Пн в сетке блока
        const blockMonday =
          weekBlock?.querySelector(".calendar-day-btn")?.dataset?.date || null;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "share-btn share-week-type-btn";
        btn.title = "Поделиться этой неделей";
        btn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path fill="currentColor" d="m16 5l-1.42 1.42l-1.59-1.59V16h-1.98V4.83L9.42 6.42L8 5l4-4zm4 5v11c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3a2 2 0 0 1 2 2"/></svg>';
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          window.shareWeekTypeCard(weekId, blockMonday);
        });
        header.appendChild(btn);
        if (weekBlock) weekBlock.dataset.weekId = String(weekId);
      });
    }

    const summaryHeader = document.querySelector(".summary-header");
    if (summaryHeader && !document.getElementById("share-summary-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "share-summary-btn";
      btn.className = "share-btn";
      btn.textContent = "Поделиться";
      summaryHeader.appendChild(btn);
      btn.addEventListener("click", () => window.shareSummaryCard());
    }
  }

  function calendarWeeksIndexFromTitle(title) {
    const idx = WEEK_TITLES.indexOf((title || "").trim());
    return idx >= 0 ? idx : window.scheduleWeekIndex ?? getScheduleWeekIndexFixed();
  }

  window.shareWeekTypeCard = function shareWeekTypeCard(weekId, blockMonday = null) {
    // Недельная карточка открывается в шите: расписание пользователя
    // больше не переключается на целевую неделю (раньше это выглядело
    // как мигание и могло уехать гонкой по 700мс)
    let monday = null;
    if (blockMonday) {
      const parsed = new Date(`${blockMonday}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) monday = parsed;
    }
    if (monday) openShareSheet({ mode: "week", weekIdx: Number(weekId), monday });
    else openShareSheet({ mode: "week" });
  };

  /* ─── Patch schedule render completion ─── */
  function patchCacheData() {
    const original = window.cacheData;
    if (typeof original !== "function" || original.__boostPatched) return;
    window.cacheData = function cacheDataPatched(data) {
      const result = original.apply(this, arguments);
      try {
        // also keep raw JSON if available via last fetch — stored separately when we hook fetch
        enrichLessonRows();
      } catch (err) {
        console.warn(err);
      }
      return result;
    };
    window.cacheData.__boostPatched = true;
  }

  function patchGetSchedule() {
    const original = window.getSchedule1;
    if (typeof original !== "function" || original.__boostPatched) return;
    window.getSchedule1 = function getSchedule1Patched() {
      const ret = original.apply(this, arguments);
      // schedule renders async; observe DOM
      setTimeout(enrichLessonRows, 800);
      setTimeout(enrichLessonRows, 2000);
      return ret;
    };
    window.getSchedule1.__boostPatched = true;
  }

  function watchScheduleMutations() {
    const wrap = document.getElementById("schedule-wrapper");
    if (!wrap || wrap.__boostObserved) return;
    wrap.__boostObserved = true;
    const mo = new MutationObserver((mutations) => {
      // Ignore class/style-only churn from loadSummary / overrides
      const meaningful = mutations.some(
        (m) =>
          m.type === "childList" &&
          (m.addedNodes.length > 0 || m.removedNodes.length > 0),
      );
      if (!meaningful) return;
      clearTimeout(wrap.__boostEnrichTimer);
      wrap.__boostEnrichTimer = setTimeout(enrichLessonRows, 120);
    });
    mo.observe(wrap, { childList: true, subtree: true });
  }

  /* ─── Deadline pulse on summary interval ─── */
  const originalLoadSummary = window.loadSummary;
  if (typeof originalLoadSummary === "function") {
    window.loadSummary = function loadSummaryPatched() {
      originalLoadSummary.apply(this, arguments);
      renderDeadlinesStrip();
    };
  }

  /* ─── Init ─── */
  function init() {
    patchCacheData();
    patchGetSchedule();
    watchScheduleMutations();
    enhanceLessonEditor();
    injectShareButtons();
    initAiChat();
    initAppearanceExtras();
    enrichLessonRows();
    if (typeof window.getNotes === "function") window.getNotes();
    renderDeadlinesStrip();

    // re-inject share into calendar when opened
    document.getElementById("calendar-btn")?.addEventListener("click", () => {
      setTimeout(injectShareButtons, 50);
    });

    // clear pair link UI when opening fresh note
    document.getElementById("note-add-btn")?.addEventListener("click", () => {
      const btn = document.getElementById("note-add-btn");
      if (btn?.classList.contains("opened")) return;
      setTimeout(() => {
        const editing =
          document.querySelector("#event-input .event-header h4")?.textContent || "";
        if (editing.includes("Редактирование")) return;
        if (!sessionStorage.getItem("pendingPairLink")) {
          const pairSummary = document.getElementById("pair-link-summary");
          if (pairSummary && pairSummary.dataset.linked !== "1") {
            pairSummary.textContent = "Не привязана — удержите пару в расписании";
            pairSummary.dataset.linked = "0";
          }
        }
        syncPairLinkClear();
      }, 0);
    });

    document.getElementById("clear-pair-link")?.addEventListener("click", () => {
      sessionStorage.removeItem("pendingPairLink");
      const pairSummary = document.getElementById("pair-link-summary");
      if (pairSummary) {
        pairSummary.dataset.linked = "0";
        delete pairSummary.dataset.payload;
        pairSummary.textContent = "Не привязана — удержите пару в расписании";
      }
      syncPairLinkClear();
      safeImpact("light");
    });

    // preset deadline chips
    document.querySelectorAll("[data-deadline-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const hours = Number(btn.dataset.deadlinePreset);
        const d = new Date(Date.now() + hours * 3600000);
        const input = document.getElementById("deadline-event");
        if (!input) return;
        input.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        safeImpact("light");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // expose for debugging
  window.BoostUpgrade = {
    applyOverridesToDom,
    enrichLessonRows,
    readNotes,
    api,
    applyCardPreset,
    toast,
    shareWeekTypeCard,
  };
})();
